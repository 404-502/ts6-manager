import { Router, Request, Response } from 'express';
import type { ConnectionPool } from '../ts-client/connection-pool.js';

export const logRoutes: Router = Router({ mergeParams: true });

const getClient = (req: Request) => {
  const pool: ConnectionPool = req.app.locals.connectionPool;
  return pool.getClient(parseInt(String(req.params.configId)));
};
const getSid = (req: Request) => parseInt(String(req.params.sid));

/**
 * TS6 `logview` 单次最多返回 100 行，超过会返回
 * `{status:{code:1541,message:"invalid parameter size"}}`。
 */
const MAX_PAGE_SIZE = 100;

/** 单次请求最多向 TS6 发起的 logview 往返次数（100 × 100 = 10000 行）。 */
const MAX_BATCHES = 100;

const clampInt = (value: unknown, min: number, max: number, fallback: number) => {
  const n = parseInt(String(value), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

type LogEntry = Record<string, unknown>;

const normalizeEntry = (entry: unknown): LogEntry =>
  typeof entry === 'string' ? { l: entry } : (entry as LogEntry);

/**
 * GET /api/servers/:configId/vs/:sid/logs
 *
 * Query:
 * - `instance` 0 = 虚拟服务器日志（默认写入 VS 事件），1 = 实例日志（启动/数据库/授权等）。
 *   默认 1；前端通过切换按钮传入。
 * - `page`     页码，从 1 开始；默认 1。
 * - `lines`    每页行数（1–100）；默认 100。
 *
 * `logview` 的返回数组里只有**第一个元素**带 `last_pos`，它是下一段（更早的日志）的
 * `begin_pos` 游标，`0` 表示已经到达该日志流的开头。这里从游标 0 开始按 `reverse=1`
 * （最新在前）逐段向后翻，直到取满 `page * lines` 行或日志耗尽，再切出请求的那一页。
 */
logRoutes.get('/', async (req: Request, res: Response, next) => {
  try {
    const page = clampInt(req.query.page, 1, 10000, 1);
    const pageSize = clampInt(req.query.lines, 1, MAX_PAGE_SIZE, MAX_PAGE_SIZE);
    const instance = clampInt(req.query.instance, 0, 1, 1);
    const client = getClient(req);
    const sid = getSid(req);

    const target = page * pageSize;
    const collected: LogEntry[] = [];
    let cursor = 0;
    let more = true;
    let batches = 0;

    while (more && collected.length < target && batches < MAX_BATCHES) {
      const batch = await client.execute(sid, 'logview', {
        lines: pageSize,
        reverse: 1,
        instance,
        begin_pos: cursor,
      });
      batches += 1;

      if (!Array.isArray(batch) || batch.length === 0) {
        more = false;
        break;
      }

      const next = Number(batch[0]?.last_pos);
      collected.push(...batch.map(normalizeEntry));

      // last_pos 为 0 表示已到日志流开头；next === cursor 说明游标不再前进，视为结束
      more = Number.isFinite(next) && next > 0 && next !== cursor;
      cursor = Number.isFinite(next) ? next : 0;
    }

    const start = (page - 1) * pageSize;
    const entries = collected.slice(start, start + pageSize);

    // 只有整条日志流都扫完时才知道确切总行数，否则为 null（前端显示「第 N 页」）
    const total = more ? null : collected.length;

    res.json({
      entries,
      page,
      pageSize,
      instance,
      total,
      hasMore: more || collected.length > start + entries.length,
    });
  } catch (err) { next(err); }
});
