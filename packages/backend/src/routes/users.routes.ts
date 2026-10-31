import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { requireRole } from '../middleware/rbac.js';
import { AppError } from '../middleware/error-handler.js';
import { validatePassword } from '../utils/validate-password.js';

const VALID_ROLES = ['admin', 'viewer'];

export const userRoutes: Router = Router();

userRoutes.use(requireRole('admin'));

userRoutes.get('/', async (req: Request, res: Response, next) => {
  try {
    const prisma = req.app.locals.prisma;
    const users = await prisma.user.findMany({
      select: {
        id: true, username: true, displayName: true, role: true, enabled: true, createdAt: true, lastLoginAt: true,
        serverAccess: { select: { serverConfigId: true } },
      },
      orderBy: { id: 'asc' },
    });
    // 把授权表拍平成 serverConfigIds，前端直接可用
    type UserRow = { serverAccess: { serverConfigId: number }[] } & Record<string, unknown>;
    res.json((users as UserRow[]).map((row) => {
      const { serverAccess, ...u } = row;
      return { ...u, serverConfigIds: serverAccess.map((a) => a.serverConfigId) };
    }));
  } catch (err) { next(err); }
});

userRoutes.post('/', async (req: Request, res: Response, next) => {
  try {
    const { username, password, displayName, role } = req.body;
    if (!username || !password || !displayName) throw new AppError(400, '用户名、密码和显示名称为必填项');

    const pwError = validatePassword(password);
    if (pwError) throw new AppError(400, pwError);

    const assignedRole = role || 'viewer';
    if (!VALID_ROLES.includes(assignedRole)) throw new AppError(400, `角色无效。必须是以下之一：${VALID_ROLES.join(', ')}`);

    const prisma = req.app.locals.prisma;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, passwordHash, displayName, role: assignedRole },
    });

    res.status(201).json({ id: user.id, username: user.username });
  } catch (err) { next(err); }
});

userRoutes.put('/:userId', async (req: Request, res: Response, next) => {
  try {
    const prisma = req.app.locals.prisma;
    const id = parseInt(String(req.params.userId));
    const data: any = {};

    if (req.body.displayName !== undefined) data.displayName = req.body.displayName;
    if (req.body.role !== undefined) {
      if (!VALID_ROLES.includes(req.body.role)) throw new AppError(400, `角色无效。必须是以下之一：${VALID_ROLES.join(', ')}`);
      data.role = req.body.role;
    }
    if (req.body.enabled !== undefined) data.enabled = req.body.enabled;
    if (req.body.password) {
      const pwError = validatePassword(req.body.password);
      if (pwError) throw new AppError(400, pwError);
      data.passwordHash = await bcrypt.hash(req.body.password, 12);
    }

    await prisma.user.update({ where: { id }, data });
    res.status(204).send();
  } catch (err) { next(err); }
});

userRoutes.delete('/:userId', async (req: Request, res: Response, next) => {
  try {
    const prisma = req.app.locals.prisma;
    const id = parseInt(String(req.params.userId));
    if (id === req.user!.id) throw new AppError(400, '不能删除自己的账户');
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

/** 读取某个账号被授权访问的服务器配置 ID 列表 */
userRoutes.get('/:userId/server-access', async (req: Request, res: Response, next) => {
  try {
    const prisma = req.app.locals.prisma;
    const userId = parseInt(String(req.params.userId));
    if (isNaN(userId)) throw new AppError(400, '用户 ID 无效');

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new AppError(404, '用户不存在');

    const rows = await prisma.userServerAccess.findMany({
      where: { userId },
      select: { serverConfigId: true },
      orderBy: { serverConfigId: 'asc' },
    });
    res.json({ serverConfigIds: rows.map((r: { serverConfigId: number }) => r.serverConfigId) });
  } catch (err) { next(err); }
});

/** 整体覆盖某个账号的服务器授权（先清空再写入，保证与前端多选一致） */
userRoutes.put('/:userId/server-access', async (req: Request, res: Response, next) => {
  try {
    const prisma = req.app.locals.prisma;
    const userId = parseInt(String(req.params.userId));
    if (isNaN(userId)) throw new AppError(400, '用户 ID 无效');

    const raw = req.body?.serverConfigIds;
    if (!Array.isArray(raw)) throw new AppError(400, 'serverConfigIds 必须是数组');

    const ids = [...new Set(raw.map((v: unknown) => Number(v)))];
    if (ids.some((v) => !Number.isInteger(v) || v <= 0)) throw new AppError(400, '服务器配置 ID 必须是正整数');

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!user) throw new AppError(404, '用户不存在');

    // 只保留真实存在的服务器配置，避免前端传入陈旧 ID 时整批失败
    const existing = await prisma.tsServerConfig.findMany({ where: { id: { in: ids } }, select: { id: true } });
    const validIds = existing.map((s: { id: number }) => s.id);

    await prisma.$transaction([
      prisma.userServerAccess.deleteMany({ where: { userId } }),
      ...(validIds.length
        ? [prisma.userServerAccess.createMany({ data: validIds.map((serverConfigId: number) => ({ userId, serverConfigId })) })]
        : []),
    ]);

    res.json({ serverConfigIds: validIds.sort((a: number, b: number) => a - b) });
  } catch (err) { next(err); }
});
