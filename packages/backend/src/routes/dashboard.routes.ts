import { Router, Request, Response } from 'express';
import type { ConnectionPool } from '../ts-client/connection-pool.js';

export const dashboardRoutes: Router = Router({ mergeParams: true });

const getClient = (req: Request) => {
  const pool: ConnectionPool = req.app.locals.connectionPool;
  return pool.getClient(parseInt(String(req.params.configId)));
};

dashboardRoutes.get('/', async (req: Request, res: Response, next) => {
  try {
    const sid = parseInt(String(req.params.sid));
    const client = getClient(req);

    const [serverInfo, clientList, channelList, connectionInfo] = await Promise.all([
      client.execute(sid, 'serverinfo'),
      client.execute(sid, 'clientlist'),
      client.execute(sid, 'channellist'),
      client.execute(sid, 'serverrequestconnectioninfo'),
    ]);

    const info = Array.isArray(serverInfo) ? serverInfo[0] : serverInfo;
    const connInfo = Array.isArray(connectionInfo) ? connectionInfo[0] : connectionInfo;
    const clients = Array.isArray(clientList) ? clientList : [];
    const channels = Array.isArray(channelList) ? channelList : [];

    const onlineClients = clients.filter((c: any) => String(c.client_type) === '0');

    res.json({
      serverName: info.virtualserver_name,
      platform: info.virtualserver_platform,
      version: info.virtualserver_version,
      onlineUsers: onlineClients.length,
      maxClients: Number(info.virtualserver_maxclients) || 0,
      uptime: Number(info.virtualserver_uptime) || 0,
      channelCount: channels.length,
      bandwidth: {
        incoming: Number(connInfo.connection_bandwidth_received_last_second_total) || 0,
        outgoing: Number(connInfo.connection_bandwidth_sent_last_second_total) || 0,
      },
      packetloss: Number(info.virtualserver_total_packetloss_total) || 0,
      ping: Number(info.virtualserver_total_ping) || 0,
    });
  } catch (err) { next(err); }
});

/**
 * Time ranges offered by the dashboard bandwidth chart. `bucketMs` is chosen so
 * every range returns 60-240 points, which keeps the payload small and the
 * chart readable regardless of how much history exists.
 */
const BANDWIDTH_RANGES: Record<string, { ms: number; bucketMs: number }> = {
  '1h': { ms: 60 * 60 * 1000, bucketMs: 60 * 1000 },
  '6h': { ms: 6 * 60 * 60 * 1000, bucketMs: 5 * 60 * 1000 },
  '24h': { ms: 24 * 60 * 60 * 1000, bucketMs: 10 * 60 * 1000 },
  '7d': { ms: 7 * 24 * 60 * 60 * 1000, bucketMs: 60 * 60 * 1000 },
  '30d': { ms: 30 * 24 * 60 * 60 * 1000, bucketMs: 3 * 60 * 60 * 1000 },
};

interface BandwidthRow {
  t: number | bigint;
  bytesIn: number | bigint;
  bytesOut: number | bigint;
  coveredMs: number | bigint;
}

dashboardRoutes.get('/bandwidth', async (req: Request, res: Response, next) => {
  try {
    const configId = parseInt(String(req.params.configId));
    const sid = parseInt(String(req.params.sid));

    const rangeKey = String(req.query.range || '1h');
    const range = BANDWIDTH_RANGES[rangeKey];
    if (!range) {
      res.status(400).json({
        error: '无效的时间范围',
        details: `range 必须是 ${Object.keys(BANDWIDTH_RANGES).join(' / ')} 之一`,
      });
      return;
    }

    const now = Date.now();
    // Snap the window to bucket boundaries so the newest bucket is whole.
    const to = Math.floor(now / range.bucketMs) * range.bucketMs + range.bucketMs;
    const from = to - range.ms;

    const prisma = req.app.locals.prisma;
    const { bucketMs } = range;

    // SQLite stores Prisma DateTime columns as INTEGER epoch-milliseconds, so the
    // bucketing and the range filter can both be done in SQL against integers.
    const rows: BandwidthRow[] = await prisma.$queryRawUnsafe(
      `SELECT (CAST(bucketStart AS INTEGER) / ${bucketMs}) * ${bucketMs} AS t,
              SUM(bytesIn)   AS bytesIn,
              SUM(bytesOut)  AS bytesOut,
              SUM(coveredMs) AS coveredMs
         FROM BandwidthSample
        WHERE serverConfigId = ${configId}
          AND virtualServerId = ${sid}
          AND bucketStart >= ${from}
          AND bucketStart < ${to}
        GROUP BY t
        ORDER BY t ASC`,
    );

    const earliest: { m: number | bigint | null }[] = await prisma.$queryRawUnsafe(
      `SELECT MIN(bucketStart) AS m FROM BandwidthSample
        WHERE serverConfigId = ${configId} AND virtualServerId = ${sid}`,
    );
    const earliestMs = earliest[0]?.m == null ? null : Number(earliest[0].m);

    const series = rows.map((row) => {
      const coveredMs = Number(row.coveredMs) || 0;
      const inBytes = Number(row.bytesIn) || 0;
      const outBytes = Number(row.bytesOut) || 0;
      // Bytes accumulated over the actually-covered time, expressed per second.
      const scale = coveredMs > 0 ? 1000 / coveredMs : 0;
      return {
        t: Number(row.t),
        in: Math.round(inBytes * scale),
        out: Math.round(outBytes * scale),
      };
    });

    res.json({
      range: rangeKey,
      bucketMs,
      from,
      to,
      // true when there is no data covering the beginning of the requested
      // window — the chart then grows as history accumulates.
      partial: earliestMs === null || earliestMs > from,
      series,
    });
  } catch (err) { next(err); }
});
