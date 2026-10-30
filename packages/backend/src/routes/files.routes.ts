import { Router, Request, Response } from 'express';
import { requireRole } from '../middleware/rbac.js';
import { AppError, TSApiError } from '../middleware/error-handler.js';
import { parseQueryResponse, tsEscape } from '@ts6/common';
import type { BotEngine } from '../bot-engine/engine.js';
import multer from 'multer';
import net from 'net';

export const fileRoutes: Router = Router({ mergeParams: true });

const getConfigId = (req: Request) => parseInt(String(req.params.configId));
const getSid = (req: Request) => parseInt(String(req.params.sid));

/** 单文件上传上限，可用环境变量覆盖 */
const MAX_UPLOAD_SIZE = Number(process.env.FILE_UPLOAD_MAX_MB || 100) * 1024 * 1024;

/** 上传缓冲在内存中，不落盘 —— ft* 走的是 ServerQuery 的 TCP 传输通道 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE },
  // 浏览器按 UTF-8 写入 multipart 的文件名，multer 默认按 latin1 解码会把中文变成乱码
  defParamCharset: 'utf8',
});

/**
 * Execute a ServerQuery command via the shared SSH connection (EventBridge).
 * Reuses the same SSH session used for bot events — no extra server slots.
 */
async function sshExecute(
  req: Request,
  command: string,
  params: Record<string, string>,
): Promise<Record<string, string>[]> {
  const engine: BotEngine = req.app.locals.botEngine;
  if (!engine) throw new AppError(503, '机器人引擎不可用');

  const bridge = engine.getEventBridge();
  const configId = getConfigId(req);
  const sid = getSid(req);

  // Build raw ServerQuery command string
  const paramStr = Object.entries(params)
    .map(([k, v]) => `${k}=${tsEscape(v)}`)
    .join(' ');
  const fullCommand = paramStr ? `${command} ${paramStr}` : command;

  let rawResponse: string;
  try {
    rawResponse = await bridge.executeCommand(configId, sid, fullCommand);
  } catch (err: any) {
    // Convert "TS error {code}: {msg}" to TSApiError
    const match = err.message?.match(/^TS error (\d+): (.+)$/);
    if (match) {
      throw new TSApiError(parseInt(match[1]), match[2]);
    }
    throw err;
  }

  if (!rawResponse.trim()) return [];
  return parseQueryResponse(rawResponse);
}

/**
 * 从命令返回的键值对里取出第一个结果对象。
 * ServerQuery 对 ftinitupload / ftinitdownload / ftgetfileinfo 返回的是单行键值对。
 */
function firstRow(rows: Record<string, string>[]): Record<string, string> {
  return rows[0] || {};
}

/**
 * TeamSpeak 的文件名限制：仅接受可打印 ASCII。
 * 服务端对中文/非 ASCII 名会直接返回 2052 file input/output error，
 * 这里提前拦截并给出可理解的提示，避免用户以为是网络问题。
 */
function assertAsciiFileName(name: string): void {
  // eslint-disable-next-line no-control-regex
  if (!/^[\x20-\x7E]+$/.test(name)) {
    throw new AppError(
      400,
      'TeamSpeak 文件系统不支持中文或特殊字符的文件名，请改用英文字母、数字、下划线、连字符或空格。',
    );
  }
}

/** 把 TS 的 ft* 错误码翻译成用户能看懂的提示 */
function mapFtError(err: any): Error {
  if (err instanceof TSApiError) {
    switch (err.code) {
      case 2051:
        return new AppError(404, '文件或目录不存在。', err.message);
      case 2052:
        return new AppError(
          400,
          '文件操作失败：TeamSpeak 拒绝了该名称或路径。文件名只能使用英文字母、数字、空格和常见符号，不能包含中文。',
          err.message,
        );
      case 2054:
        return new AppError(400, '路径无效。目录名不能包含中文，且必须是不超过服务端限制的合法路径。', err.message);
      case 2304:
        return new AppError(400, '没有权限操作该文件。', err.message);
      case 2305:
        return new AppError(400, '目标文件已存在，请勾选覆盖或改名后重试。', err.message);
      default:
        return err;
    }
  }
  return err;
}

/**
 * 建立 TeamSpeak 文件传输的 TCP 通道。
 * 协议：连接后先发送明文 ftkey（无换行），作为上传方则紧随其后发送文件内容，
 * 作为下载方则直接读取响应直到连接关闭。
 */
function ftTransfer(
  host: string,
  port: number,
  ftkey: string,
  uploadPayload?: Buffer,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const socket = net.connect({ host, port });
    let settled = false;

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (err) reject(err);
      else resolve(Buffer.concat(chunks));
    };

    socket.setTimeout(120000);
    socket.on('connect', () => {
      socket.write(Buffer.from(ftkey, 'ascii'));
      if (uploadPayload) {
        socket.write(uploadPayload);
        // 上传场景服务端会在接收完毕后关闭连接，或用超时兜底
      }
    });
    socket.on('data', (chunk) => chunks.push(chunk));
    socket.on('timeout', () => finish(new AppError(504, '文件传输超时，请重试。')));
    socket.on('error', (err) => finish(new AppError(502, `文件传输失败：${err.message}`)));
    socket.on('close', () => finish());
  });
}

/** 尽力释放服务端的传输会话，失败不影响主流程 */
async function stopTransfer(req: Request, serverftfid: string | undefined): Promise<void> {
  if (!serverftfid) return;
  try {
    await sshExecute(req, 'ftstop', { serverftfid, delete: '0' });
  } catch {
    /* 忽略：会话可能已自然结束 */
  }
}

/**
 * 传输通道需要直连 TeamSpeak 的文件传输端口。
 * 端口优先用服务端 ftinit* 返回的 port，这里只负责拿到主机名；
 * 若服务端端口经过 NAT 映射，可用 FILE_TRANSFER_PORT 覆盖。
 */
async function getTransferHost(req: Request): Promise<string> {
  const prisma = req.app.locals.prisma;
  if (!prisma) throw new AppError(503, '数据库不可用');
  const config = await prisma.tsServerConfig.findUnique({ where: { id: getConfigId(req) } });
  if (!config) throw new AppError(404, '服务器配置不存在');
  return config.host;
}

/** 解析实际使用的文件传输端口 */
function resolveTransferPort(serverPort: string | undefined): number {
  const override = Number(process.env.FILE_TRANSFER_PORT);
  if (Number.isFinite(override) && override > 0) return override;
  const parsed = Number(serverPort);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30033;
}

// List files in a channel directory
// Uses shared SSH connection because ft* commands are not supported via WebQuery HTTP
fileRoutes.get('/:cid', async (req: Request, res: Response, next) => {
  try {
    const result = await sshExecute(req, 'ftgetfilelist', {
      cid: String(req.params.cid),
      cpw: String(req.query.cpw || ''),
      path: String(req.query.path || '/'),
    });
    res.json(result);
  } catch (err: any) {
    // TS3 error 1281 = database_empty_result → empty directory
    if (err instanceof TSApiError && err.code === 1281) {
      return res.json([]);
    }
    if (err.message?.includes('SSH not connected') || err.message?.includes('SSH credentials')) {
      return next(new AppError(400, '该服务器未配置 SSH 凭据。文件浏览需要 SSH 访问，因为 WebQuery HTTP 不支持 ft* 系列命令。'));
    }
    next(err);
  }
});

// Create directory
fileRoutes.post('/:cid/mkdir', requireRole('admin'), async (req: Request, res: Response, next) => {
  try {
    const dirname: string = req.body.dirname;
    assertAsciiFileName(dirname.split('/').filter(Boolean).pop() || '');
    const result = await sshExecute(req, 'ftcreatedir', {
      cid: String(req.params.cid),
      cpw: '',
      dirname,
    });
    res.json(result);
  } catch (err) { next(mapFtError(err)); }
});

// Delete file or directory
fileRoutes.delete('/:cid/file', requireRole('admin'), async (req: Request, res: Response, next) => {
  try {
    const result = await sshExecute(req, 'ftdeletefile', {
      cid: String(req.params.cid),
      cpw: '',
      name: req.body.name,
    });
    res.json(result);
  } catch (err) { next(mapFtError(err)); }
});

// Rename / move within the same channel
fileRoutes.put('/:cid/rename', requireRole('admin'), async (req: Request, res: Response, next) => {
  try {
    const { oldName, newName } = req.body as { oldName?: string; newName?: string };
    if (!oldName || !newName) {
      return next(new AppError(400, 'oldName 与 newName 均为必填项。'));
    }
    assertAsciiFileName(newName.split('/').filter(Boolean).pop() || '');
    const result = await sshExecute(req, 'ftrenamefile', {
      cid: String(req.params.cid),
      cpw: '',
      oldname: oldName,
      newname: newName,
    });
    res.json(result);
  } catch (err) { next(mapFtError(err)); }
});

// Move to another channel (optionally renaming at the same time)
fileRoutes.put('/:cid/move', requireRole('admin'), async (req: Request, res: Response, next) => {
  try {
    const { oldName, newName, targetCid, targetCpw } = req.body as {
      oldName?: string; newName?: string; targetCid?: number; targetCpw?: string;
    };
    if (!oldName || !targetCid) {
      return next(new AppError(400, 'oldName 与 targetCid 均为必填项。'));
    }
    const finalName = newName || oldName;
    assertAsciiFileName(finalName.split('/').filter(Boolean).pop() || '');
    const params: Record<string, string> = {
      cid: String(req.params.cid),
      cpw: '',
      tcid: String(targetCid),
      // 跨频道移动时 tcid 与 tcpw 是成对的必填参数，缺 tcpw 会报 1542 missing required parameter
      tcpw: String(targetCpw || ''),
      oldname: oldName,
      newname: finalName,
    };
    const result = await sshExecute(req, 'ftrenamefile', params);
    res.json(result);
  } catch (err) { next(mapFtError(err)); }
});

// Upload a single file into the given directory
fileRoutes.post('/:cid/upload', requireRole('admin'), upload.single('file'), async (req: Request, res: Response, next) => {
  try {
    const file = (req as any).file as { originalname: string; buffer: Buffer; size: number } | undefined;
    if (!file) {
      return next(new AppError(400, '未收到上传的文件。'));
    }
    const parentPath = String(req.query.path || '/');
    const baseName = file.originalname;
    assertAsciiFileName(baseName);

    const fullPath = parentPath === '/' ? `/${baseName}` : `${parentPath}/${baseName}`;
    const overwrite = String(req.query.overwrite ?? '1');

    const initRows = await sshExecute(req, 'ftinitupload', {
      clientftfid: '1',
      name: fullPath,
      cid: String(req.params.cid),
      cpw: String(req.query.cpw || ''),
      size: String(file.size),
      overwrite,
      resume: '0',
    });
    const init = firstRow(initRows);
    if (!init.ftkey) {
      return next(new AppError(502, `服务端未返回文件传输密钥：${init.msg || JSON.stringify(init)}`));
    }

    const host = await getTransferHost(req);
    const transferPort = resolveTransferPort(init.port);
    await ftTransfer(host, transferPort, init.ftkey, file.buffer);
    await stopTransfer(req, init.serverftfid);

    res.status(201).json({ name: baseName, path: fullPath, size: file.size });
  } catch (err) { next(mapFtError(err)); }
});

// Download a file by name (path is resolved from the query string)
fileRoutes.get('/:cid/download', async (req: Request, res: Response, next) => {
  try {
    const name = String(req.query.name || '');
    if (!name) {
      return next(new AppError(400, '缺少 name 参数。'));
    }
    const initRows = await sshExecute(req, 'ftinitdownload', {
      clientftfid: '1',
      name,
      cid: String(req.params.cid),
      cpw: String(req.query.cpw || ''),
      seekpos: '0',
    });
    const init = firstRow(initRows);
    if (!init.ftkey) {
      return next(new AppError(502, `服务端未返回文件传输密钥：${init.msg || JSON.stringify(init)}`));
    }

    const host = await getTransferHost(req);
    const transferPort = resolveTransferPort(init.port);
    const data = await ftTransfer(host, transferPort, init.ftkey);
    await stopTransfer(req, init.serverftfid);

    const expectSize = Number(init.size);
    if (Number.isFinite(expectSize) && expectSize > 0 && data.length !== expectSize) {
      return next(new AppError(502, `下载不完整：期望 ${expectSize} 字节，实际收到 ${data.length} 字节。`));
    }

    const fileName = name.split('/').filter(Boolean).pop() || 'download';
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', String(data.length));
    // 文件名已限制为 ASCII，直接用 filename 即可
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.end(data);
  } catch (err) { next(mapFtError(err)); }
});

// Get details of a single entry (files only — TeamSpeak rejects directories here)
fileRoutes.get('/:cid/info', async (req: Request, res: Response, next) => {
  try {
    const name = String(req.query.name || '');
    if (!name) {
      return next(new AppError(400, '缺少 name 参数。'));
    }
    const result = await sshExecute(req, 'ftgetfileinfo', {
      cid: String(req.params.cid),
      cpw: String(req.query.cpw || ''),
      name,
    });
    res.json(result);
  } catch (err) { next(mapFtError(err)); }
});
