import express, { type Express } from 'express';
import { isIP } from 'node:net';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { errorHandler } from './middleware/error-handler.js';
import { authMiddleware } from './middleware/auth.js';
import { authRoutes } from './routes/auth.routes.js';
import { serverRoutes } from './routes/servers.routes.js';
import { virtualServerRoutes } from './routes/virtual-servers.routes.js';
import { channelRoutes } from './routes/channels.routes.js';
import { clientRoutes } from './routes/clients.routes.js';
import { serverGroupRoutes } from './routes/server-groups.routes.js';
import { channelGroupRoutes } from './routes/channel-groups.routes.js';
import { permissionRoutes } from './routes/permissions.routes.js';
import { banRoutes } from './routes/bans.routes.js';
import { tokenRoutes } from './routes/tokens.routes.js';
import { fileRoutes } from './routes/files.routes.js';
import { complaintRoutes } from './routes/complaints.routes.js';
import { messageRoutes } from './routes/messages.routes.js';
import { logRoutes } from './routes/logs.routes.js';
import { instanceRoutes } from './routes/instance.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';
import { botRoutes } from './routes/bots.routes.js';
import { userRoutes } from './routes/users.routes.js';
import { musicBotRoutes } from './routes/music-bots.routes.js';
import { musicLibraryRoutes } from './routes/music-library.routes.js';
import { playlistRoutes } from './routes/playlists.routes.js';
import { radioStationRoutes } from './routes/radio-stations.routes.js';
import { musicRequestRoutes } from './routes/music-requests.routes.js';
import { widgetPublicRoutes } from './routes/widget-public.routes.js';
import { widgetRoutes } from './routes/widget.routes.js';
import { setupRoutes } from './routes/setup.routes.js';
import { settingsRoutes } from './routes/settings.routes.js';
import { requireServerAccess } from './middleware/server-access.js';

export function createApp(): Express {
  const app = express();

  // Trust only the known reverse-proxy hops (nginx / Coolify / docker bridge networks).
  // A blanket `true` or `1` would let clients spoof X-Forwarded-For and dodge IP rate limiting.
  app.set('trust proxy', ['127.0.0.1/32', '::1/128', '172.16.0.0/12', '192.168.0.0/16']);

  app.use(helmet());
  app.use(cors({ origin: config.frontendUrl, credentials: true }));
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // H1: Rate limiting on auth endpoints
  //
  // Key = `${normalizedIp}|${username}`. Two notes:
  //  - express-rate-limit 7.5.1 has no `ipKeyGenerator` helper, so IP normalization
  //    (IPv6 /64 bucketing) is implemented here.
  //  - IPv6 clients routinely rotate the low 64 bits of their address, so keying on
  //    the full address would let them bypass the limit; bucket by prefix instead.
  const normalizeIp = (ip: string | undefined): string => {
    const raw = (ip ?? '').trim();
    if (!raw) return 'unknown';

    // Drop an IPv6 zone id, e.g. `fe80::1%eth0`.
    const addr = raw.split('%')[0].toLowerCase();

    // IPv4-mapped IPv6 (`::ffff:127.0.0.1`) is really an IPv4 client.
    const mapped = addr.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
    if (mapped) return mapped[1];

    if (isIP(addr) === 4) return addr;
    if (isIP(addr) !== 6) return 'unknown';

    // Expand a possibly-compressed IPv6 address into exactly 8 hextets.
    const expand = (value: string): string[] | null => {
      let text = value;
      const lastColon = text.lastIndexOf(':');
      const tail = text.slice(lastColon + 1);
      if (tail.includes('.')) {
        const octets = tail.split('.').map((part) => Number.parseInt(part, 10));
        if (octets.length !== 4 || octets.some((n) => Number.isNaN(n))) return null;
        const hi = ((octets[0] << 8) | octets[1]).toString(16);
        const lo = ((octets[2] << 8) | octets[3]).toString(16);
        text = `${text.slice(0, lastColon + 1)}${hi}:${lo}`;
      }

      const halves = text.split('::');
      if (halves.length > 2) return null;
      if (halves.length === 1) {
        const groups = halves[0].split(':');
        return groups.length === 8 ? groups : null;
      }
      const left = halves[0] ? halves[0].split(':') : [];
      const right = halves[1] ? halves[1].split(':') : [];
      const missing = 8 - left.length - right.length;
      if (missing < 0) return null;
      return [...left, ...Array<string>(missing).fill('0'), ...right];
    };

    const groups = expand(addr);
    if (!groups) return 'unknown';

    const hextets = groups.map((group) => {
      const parsed = Number.parseInt(group, 16);
      return Number.isNaN(parsed) ? '0' : parsed.toString(16);
    });

    // Bucket at /64 — the interface-identifier part is not a stable client identity.
    return `${hextets.slice(0, 4).join(':')}::/64`;
  };

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: '尝试次数过多，请稍后再试' },
    keyGenerator: (req) => {
      const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
      // Bound the username segment so absurd payloads cannot bloat limiter keys.
      return `${normalizeIp(req.ip)}|${username.slice(0, 128)}`;
    },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/refresh', authLimiter);

  // Captcha image generation is unauthenticated and CPU-bound (PNG rendering),
  // so it gets its own tighter budget.
  const captchaLimiter = rateLimit({
    windowMs: 60_000, // 1 minute
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: '请求过于频繁，请稍后再试' },
    keyGenerator: (req) => normalizeIp(req.ip),
  });
  app.use('/api/auth/captcha', captchaLimiter);

  // Public routes
  app.use('/api/setup', setupRoutes);
  app.use('/api/auth', authRoutes);

  // Bot webhook route (unauthenticated — called by external systems)
  app.all('/api/bots/webhook/:path(*)', (req, res) => {
    const engine = req.app.locals.botEngine;
    if (!engine) return res.status(503).json({ error: '机器人引擎未运行' });
    engine.handleWebhookRequest(req, res);
  });

  // Public widget routes (unauthenticated — embeddable on external sites)
  app.use('/api/widget', widgetPublicRoutes);

  // Protected routes
  app.use('/api', authMiddleware);
  app.use('/api/servers', serverRoutes);

  // H9: Server access control on all :configId routes
  const serverAccess = requireServerAccess();
  app.use('/api/servers/:configId/virtual-servers', serverAccess, virtualServerRoutes);
  app.use('/api/servers/:configId/vs/:sid/channels', serverAccess, channelRoutes);
  app.use('/api/servers/:configId/vs/:sid/clients', serverAccess, clientRoutes);
  app.use('/api/servers/:configId/vs/:sid/server-groups', serverAccess, serverGroupRoutes);
  app.use('/api/servers/:configId/vs/:sid/channel-groups', serverAccess, channelGroupRoutes);
  app.use('/api/servers/:configId/vs/:sid/permissions', serverAccess, permissionRoutes);
  app.use('/api/servers/:configId/vs/:sid/bans', serverAccess, banRoutes);
  app.use('/api/servers/:configId/vs/:sid/tokens', serverAccess, tokenRoutes);
  app.use('/api/servers/:configId/vs/:sid/files', serverAccess, fileRoutes);
  app.use('/api/servers/:configId/vs/:sid/complaints', serverAccess, complaintRoutes);
  app.use('/api/servers/:configId/vs/:sid/messages', serverAccess, messageRoutes);
  app.use('/api/servers/:configId/vs/:sid/logs', serverAccess, logRoutes);
  app.use('/api/servers/:configId/instance', serverAccess, instanceRoutes);
  app.use('/api/servers/:configId/vs/:sid/dashboard', serverAccess, dashboardRoutes);
  app.use('/api/bots', botRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/music-bots', musicBotRoutes);
  app.use('/api/servers/:configId/music-library', serverAccess, musicLibraryRoutes);
  app.use('/api/playlists', playlistRoutes);
  app.use('/api/servers/:configId/radio-stations', serverAccess, radioStationRoutes);
  app.use('/api/servers/:configId/music-requests', serverAccess, musicRequestRoutes);
  app.use('/api/widgets', widgetRoutes);
  app.use('/api/settings', settingsRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
