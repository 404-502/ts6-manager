import cron from 'node-cron';
import type { PrismaClient } from '../../generated/prisma/index.js';
import type { ConnectionPool } from '../ts-client/connection-pool.js';

/** One row is written per minute and per virtual server. */
export const BUCKET_MS = 60_000;
/** How often the cumulative TS counters are read. */
export const SAMPLE_INTERVAL_MS = 10_000;
/** Bandwidth history is kept for this many days. */
export const RETENTION_DAYS = 30;

interface SeriesState {
  lastCumIn: number;
  lastCumOut: number;
  lastTs: number;
  bucketStart: number;
  bytesIn: number;
  bytesOut: number;
  coveredMs: number;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function floorBucket(ts: number, bucketMs: number = BUCKET_MS): number {
  return Math.floor(ts / bucketMs) * bucketMs;
}

/**
 * Continuously samples the TeamSpeak server-wide byte counters so the dashboard
 * can show a bandwidth history that survives page reloads.
 *
 * The TS WebQuery exposes monotonic cumulative counters
 * (`connection_bytes_received_total` / `connection_bytes_sent_total`) that are
 * server-wide rather than per query connection, so the delta between two
 * samples divided by the elapsed time is the actual throughput.
 *
 * Data is accumulated in memory and flushed into `BandwidthSample` every tick,
 * keyed by the minute-aligned bucket start, so a bucket is upserted repeatedly
 * while it fills and never duplicated.
 */
export class BandwidthSampler {
  private states = new Map<string, SeriesState>();
  private timer: NodeJS.Timeout | null = null;
  private retentionTask: ReturnType<typeof cron.schedule> | null = null;
  private running = false;
  private ticking = false;
  private warned = new Set<number>();

  constructor(
    private prisma: PrismaClient,
    private pool: ConnectionPool,
  ) {}

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    // Baseline immediately so the first interval does not have to wait a tick.
    await this.sampleAll();

    this.timer = setInterval(() => {
      void this.sampleAll();
    }, SAMPLE_INTERVAL_MS);
    this.timer.unref?.();

    // Daily retention sweep at 03:00.
    this.retentionTask = cron.schedule('0 3 * * *', () => {
      void this.prune();
    });
    await this.prune();

    console.log(
      `[BandwidthSampler] Started (interval ${SAMPLE_INTERVAL_MS / 1000}s, bucket ${BUCKET_MS / 1000}s, retention ${RETENTION_DAYS}d)`,
    );
  }

  async stop(): Promise<void> {
    if (!this.running) return;
    this.running = false;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.retentionTask) {
      this.retentionTask.stop();
      this.retentionTask = null;
    }

    // Persist whatever is still pending in the current bucket.
    for (const [key, state] of this.states) {
      const [configId, sid] = key.split(':').map(Number);
      await this.flush(configId, sid, state);
    }
    this.states.clear();

    console.log('[BandwidthSampler] Stopped');
  }

  /** Exposed for tests / diagnostics: raw in-memory pending bucket. */
  getPending(configId: number, virtualServerId: number): Readonly<SeriesState> | undefined {
    return this.states.get(`${configId}:${virtualServerId}`);
  }

  private async sampleAll(): Promise<void> {
    if (!this.running || this.ticking) return;
    this.ticking = true;
    try {
      const configs = await this.prisma.tsServerConfig.findMany({
        where: { enabled: true },
        select: { id: true },
      });

      for (const cfg of configs) {
        if (!this.pool.hasClient(cfg.id)) continue;

        let onlineSids: number[];
        try {
          const list = await this.pool.getClient(cfg.id).execute(0, 'serverlist');
          onlineSids = (Array.isArray(list) ? list : [])
            .filter((vs: any) => String(vs?.virtualserver_status) === 'online')
            .map((vs: any) => parseInt(String(vs.virtualserver_id), 10))
            .filter((sid: number) => Number.isFinite(sid) && sid > 0);
        } catch (err) {
          this.warnOnce(cfg.id, `[BandwidthSampler] config ${cfg.id}: serverlist failed: ${(err as Error).message}`);
          continue;
        }

        for (const sid of onlineSids) {
          try {
            const info = await this.pool.getClient(cfg.id).execute(sid, 'serverrequestconnectioninfo');
            const row = Array.isArray(info) ? info[0] : info;
            if (!row) continue;
            await this.ingest(cfg.id, sid, row, Date.now());
          } catch (err) {
            this.warnOnce(cfg.id, `[BandwidthSampler] config ${cfg.id} sid ${sid}: ${(err as Error).message}`);
          }
        }
      }
    } finally {
      this.ticking = false;
    }
  }

  private async ingest(configId: number, sid: number, row: any, now: number): Promise<void> {
    const key = `${configId}:${sid}`;
    const bucketStart = floorBucket(now);
    const prev = this.states.get(key);

    const hasCounters =
      row.connection_bytes_received_total !== undefined &&
      row.connection_bytes_sent_total !== undefined;

    if (!prev) {
      this.states.set(key, {
        lastCumIn: toNumber(row.connection_bytes_received_total),
        lastCumOut: toNumber(row.connection_bytes_sent_total),
        lastTs: now,
        bucketStart,
        bytesIn: 0,
        bytesOut: 0,
        coveredMs: 0,
      });
      return;
    }

    const elapsed = now - prev.lastTs;
    if (elapsed <= 0) return;

    let deltaIn = 0;
    let deltaOut = 0;
    let valid = true;

    if (hasCounters) {
      const cumIn = toNumber(row.connection_bytes_received_total);
      const cumOut = toNumber(row.connection_bytes_sent_total);
      deltaIn = cumIn - prev.lastCumIn;
      deltaOut = cumOut - prev.lastCumOut;
      prev.lastCumIn = cumIn;
      prev.lastCumOut = cumOut;
      // The TeamSpeak server was restarted: its counters went back to zero.
      // Re-anchor on the new baseline instead of recording a negative spike.
      if (deltaIn < 0 || deltaOut < 0) {
        valid = false;
        deltaIn = 0;
        deltaOut = 0;
      }
    } else {
      // Fallback for servers without the cumulative counters: use the
      // instantaneous last-second rate as a constant rate over the interval.
      deltaIn = (toNumber(row.connection_bandwidth_received_last_second_total) * elapsed) / 1000;
      deltaOut = (toNumber(row.connection_bandwidth_sent_last_second_total) * elapsed) / 1000;
    }

    if (prev.bucketStart !== bucketStart) {
      // A new minute started; the previous bucket was already flushed by the
      // tick that filled it, so just roll the accumulator over.
      prev.bucketStart = bucketStart;
      prev.bytesIn = 0;
      prev.bytesOut = 0;
      prev.coveredMs = 0;
    }

    if (valid) {
      prev.bytesIn += deltaIn;
      prev.bytesOut += deltaOut;
      prev.coveredMs += elapsed;
    }
    prev.lastTs = now;

    await this.flush(configId, sid, prev);
  }

  private async flush(configId: number, sid: number, state: SeriesState): Promise<void> {
    if (state.coveredMs <= 0) return;
    const bucketStart = new Date(state.bucketStart);
    const bytesIn = BigInt(Math.round(state.bytesIn));
    const bytesOut = BigInt(Math.round(state.bytesOut));

    try {
      await this.prisma.bandwidthSample.upsert({
        where: {
          serverConfigId_virtualServerId_bucketStart: {
            serverConfigId: configId,
            virtualServerId: sid,
            bucketStart,
          },
        },
        create: {
          serverConfigId: configId,
          virtualServerId: sid,
          bucketStart,
          bytesIn,
          bytesOut,
          coveredMs: state.coveredMs,
        },
        update: { bytesIn, bytesOut, coveredMs: state.coveredMs },
      });
    } catch (err) {
      this.warnOnce(
        configId,
        `[BandwidthSampler] config ${configId} sid ${sid}: persist failed: ${(err as Error).message}`,
      );
    }
  }

  private async prune(): Promise<void> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    try {
      const removed = await this.prisma.bandwidthSample.deleteMany({
        where: { bucketStart: { lt: cutoff } },
      });
      if (removed.count > 0) {
        console.log(`[BandwidthSampler] Pruned ${removed.count} sample(s) older than ${RETENTION_DAYS}d`);
      }
    } catch (err) {
      console.error('[BandwidthSampler] Retention sweep failed:', (err as Error).message);
    }
  }

  private warnOnce(key: number, message: string): void {
    if (this.warned.has(key)) return;
    this.warned.add(key);
    console.warn(message);
  }
}
