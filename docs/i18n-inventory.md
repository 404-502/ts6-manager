# 汉化对照清单

本文件从 git 提交差异中自动提取，记录汉化时每一处「英文原文 → 中文译文」的映射。

**用途**：上游仓库更新后，若某段英文被改写，可在此按原文检索，
快速确认该处原本译成什么，从而只重译变化的部分，不必整份文件重来。

**维护**：每完成一轮上游同步后重新生成（命令见文末）。

## 统计

| 项 | 数量 |
|---|---|
| 涉及文件 | 65 |
| 对照条目 | 1296 |

## 目录

- [`README.md`](#readmemd) — 147 条
- [`packages/backend/src/app.ts`](#packagesbackendsrcappts) — 2 条
- [`packages/backend/src/bot-engine/engine.ts`](#packagesbackendsrcbot-engineenginets) — 1 条
- [`packages/backend/src/index.ts`](#packagesbackendsrcindexts) — 1 条
- [`packages/backend/src/middleware/auth.ts`](#packagesbackendsrcmiddlewareauthts) — 4 条
- [`packages/backend/src/middleware/error-handler.ts`](#packagesbackendsrcmiddlewareerror-handlerts) — 2 条
- [`packages/backend/src/middleware/rbac.ts`](#packagesbackendsrcmiddlewarerbacts) — 2 条
- [`packages/backend/src/middleware/server-access.ts`](#packagesbackendsrcmiddlewareserver-accessts) — 2 条
- [`packages/backend/src/routes/auth.routes.ts`](#packagesbackendsrcroutesauthroutests) — 7 条
- [`packages/backend/src/routes/bots.routes.ts`](#packagesbackendsrcroutesbotsroutests) — 3 条
- [`packages/backend/src/routes/files.routes.ts`](#packagesbackendsrcroutesfilesroutests) — 2 条
- [`packages/backend/src/routes/music-bots.routes.ts`](#packagesbackendsrcroutesmusic-botsroutests) — 17 条
- [`packages/backend/src/routes/music-library.routes.ts`](#packagesbackendsrcroutesmusic-libraryroutests) — 5 条
- [`packages/backend/src/routes/music-requests.routes.ts`](#packagesbackendsrcroutesmusic-requestsroutests) — 1 条
- [`packages/backend/src/routes/playlists.routes.ts`](#packagesbackendsrcroutesplaylistsroutests) — 4 条
- [`packages/backend/src/routes/radio-stations.routes.ts`](#packagesbackendsrcroutesradio-stationsroutests) — 2 条
- [`packages/backend/src/routes/servers.routes.ts`](#packagesbackendsrcroutesserversroutests) — 2 条
- [`packages/backend/src/routes/settings.routes.ts`](#packagesbackendsrcroutessettingsroutests) — 2 条
- [`packages/backend/src/routes/setup.routes.ts`](#packagesbackendsrcroutessetuproutests) — 3 条
- [`packages/backend/src/routes/users.routes.ts`](#packagesbackendsrcroutesusersroutests) — 3 条
- [`packages/backend/src/routes/widget-public.routes.ts`](#packagesbackendsrcrouteswidget-publicroutests) — 4 条
- [`packages/backend/src/routes/widget.routes.ts`](#packagesbackendsrcrouteswidgetroutests) — 3 条
- [`packages/backend/src/utils/url-validator.ts`](#packagesbackendsrcutilsurl-validatorts) — 7 条
- [`packages/backend/src/utils/validate-password.ts`](#packagesbackendsrcutilsvalidate-passwordts) — 4 条
- [`packages/backend/src/voice/voice-bot-manager.ts`](#packagesbackendsrcvoicevoice-bot-managerts) — 1 条
- [`packages/backend/src/voice/voice-bot.ts`](#packagesbackendsrcvoicevoice-botts) — 2 条
- [`packages/common/src/widget-themes.ts`](#packagescommonsrcwidget-themests) — 6 条
- [`packages/frontend/index.html`](#packagesfrontendindexhtml) — 1 条
- [`packages/frontend/src/components/bots/PlaceholderReference.tsx`](#packagesfrontendsrccomponentsbotsplaceholderreferencetsx) — 115 条
- [`packages/frontend/src/components/bots/TemplateGallery.tsx`](#packagesfrontendsrccomponentsbotstemplategallerytsx) — 4 条
- [`packages/frontend/src/components/layout/Header.tsx`](#packagesfrontendsrccomponentslayoutheadertsx) — 1 条
- [`packages/frontend/src/components/layout/ServerSelector.tsx`](#packagesfrontendsrccomponentslayoutserverselectortsx) — 2 条
- [`packages/frontend/src/components/layout/Sidebar.tsx`](#packagesfrontendsrccomponentslayoutsidebartsx) — 25 条
- [`packages/frontend/src/components/shared/ConfirmDialog.tsx`](#packagesfrontendsrccomponentssharedconfirmdialogtsx) — 2 条
- [`packages/frontend/src/components/shared/DataTable.tsx`](#packagesfrontendsrccomponentsshareddatatabletsx) — 1 条
- [`packages/frontend/src/components/shared/LoadingSpinner.tsx`](#packagesfrontendsrccomponentssharedloadingspinnertsx) — 1 条
- [`packages/frontend/src/components/video/VideoPlayer.tsx`](#packagesfrontendsrccomponentsvideovideoplayertsx) — 4 条
- [`packages/frontend/src/components/video/VideoStreamTab.tsx`](#packagesfrontendsrccomponentsvideovideostreamtabtsx) — 18 条
- [`packages/frontend/src/components/widget/WidgetManagerModal.tsx`](#packagesfrontendsrccomponentswidgetwidgetmanagermodaltsx) — 25 条
- [`packages/frontend/src/components/widget/WidgetRenderer.tsx`](#packagesfrontendsrccomponentswidgetwidgetrenderertsx) — 6 条
- [`packages/frontend/src/data/bot-templates.ts`](#packagesfrontendsrcdatabot-templatests) — 158 条
- [`packages/frontend/src/lib/utils.ts`](#packagesfrontendsrclibutilsts) — 11 条
- [`packages/frontend/src/pages/Bans.tsx`](#packagesfrontendsrcpagesbanstsx) — 24 条
- [`packages/frontend/src/pages/BotEditor.tsx`](#packagesfrontendsrcpagesboteditortsx) — 166 条
- [`packages/frontend/src/pages/BotList.tsx`](#packagesfrontendsrcpagesbotlisttsx) — 24 条
- [`packages/frontend/src/pages/ChannelGroups.tsx`](#packagesfrontendsrcpageschannelgroupstsx) — 2 条
- [`packages/frontend/src/pages/Channels.tsx`](#packagesfrontendsrcpageschannelstsx) — 26 条
- [`packages/frontend/src/pages/Clients.tsx`](#packagesfrontendsrcpagesclientstsx) — 18 条
- [`packages/frontend/src/pages/Complaints.tsx`](#packagesfrontendsrcpagescomplaintstsx) — 7 条
- [`packages/frontend/src/pages/Dashboard.tsx`](#packagesfrontendsrcpagesdashboardtsx) — 21 条
- [`packages/frontend/src/pages/Files.tsx`](#packagesfrontendsrcpagesfilestsx) — 23 条
- [`packages/frontend/src/pages/Instance.tsx`](#packagesfrontendsrcpagesinstancetsx) — 26 条
- [`packages/frontend/src/pages/Login.tsx`](#packagesfrontendsrcpageslogintsx) — 7 条
- [`packages/frontend/src/pages/Messages.tsx`](#packagesfrontendsrcpagesmessagestsx) — 24 条
- [`packages/frontend/src/pages/MusicBots.tsx`](#packagesfrontendsrcpagesmusicbotstsx) — 142 条
- [`packages/frontend/src/pages/MusicRequests.tsx`](#packagesfrontendsrcpagesmusicrequeststsx) — 3 条
- [`packages/frontend/src/pages/NotFound.tsx`](#packagesfrontendsrcpagesnotfoundtsx) — 1 条
- [`packages/frontend/src/pages/Permissions.tsx`](#packagesfrontendsrcpagespermissionstsx) — 29 条
- [`packages/frontend/src/pages/ServerGroups.tsx`](#packagesfrontendsrcpagesservergroupstsx) — 12 条
- [`packages/frontend/src/pages/ServerLogs.tsx`](#packagesfrontendsrcpagesserverlogstsx) — 13 条
- [`packages/frontend/src/pages/Settings.tsx`](#packagesfrontendsrcpagessettingstsx) — 85 条
- [`packages/frontend/src/pages/SetupPage.tsx`](#packagesfrontendsrcpagessetuppagetsx) — 12 条
- [`packages/frontend/src/pages/Tokens.tsx`](#packagesfrontendsrcpagestokenstsx) — 11 条
- [`packages/frontend/src/pages/VirtualServers.tsx`](#packagesfrontendsrcpagesvirtualserverstsx) — 6 条
- [`packages/frontend/src/pages/WidgetPage.tsx`](#packagesfrontendsrcpageswidgetpagetsx) — 1 条

## `README.md`

| 英文原文 | 中文译文 |
|---|---|
| `#### DISCLAIMER:` | #### 声明： |
| `# TS6 Manager` | # TS6 Manager 汉化版 |
| `Built on the **WebQuery HTTP API** (the ServerQuery replacement in modern TeamSpeak builds). Telnet is not used or supported.` | 基于 **WebQuery HTTP API**（现代 TeamSpeak 版本中 ServerQuery 的替代方案）构建，不使用也不支持 Telnet。 |
| `## Screenshots` | ## 界面截图 |
| `### Dashboard` | ### 仪表盘 |
| `Live overview of your server: online users, channel count, uptime, ping, bandwidth graph, and server capacity at a glance.` | 服务器实时概览：在线用户、频道数量、运行时长、延迟、带宽曲线与服务器容量，一目了然。 |
| `### Music Bots` | ### 音乐机器人 |
| `Run multiple music bots per server. Each bot has its own queue, volume control, and playback state. Supports radio streams, YouTube, and a local music library. Users in the bot's channel can control i…` | 每台服务器可运行多个音乐机器人，每个机器人拥有独立的播放队列、音量控制与播放状态。支持电台流、YouTube 与本地音乐库。机器人所在频道的用户可通过文字命令（`!radio`、`!play`、`!vol` 等）控制播放。 |
| `### Bot Flow Engine` | ### 机器人流程引擎 |
| `Visual node-based editor for building automated server workflows. Drag triggers, conditions, and actions onto the canvas, connect them, and deploy. Supports TS3 events, cron schedules, webhooks, and c…` | 可视化节点编辑器，用于搭建服务器自动化流程。将触发器、条件与动作拖到画布上，连线后即可部署。支持 TS3 事件、cron 定时计划、Webhook 与聊天命令作为触发器。 |
| `### Flow Templates` | ### 流程模板 |
| `Get started quickly with pre-built flow templates. Covers common use cases like temporary channel creation, AFK movers, idle kickers, online counters, and group protection. One click to import, then c…` | 通过预置流程模板快速上手，覆盖创建临时频道、AFK 移动、闲置踢出、在线人数统计、服务器组保护等常见场景。一键导入后按需修改即可。 |
| `## Features` | ## 功能特性 |
| `### Server Management` | ### 服务器管理 |
| `- Dashboard with live server stats, bandwidth graph, and capacity overview` | - 仪表盘：实时服务器状态、带宽曲线与容量概览 |
| `- Virtual server list with start/stop controls` | - 虚拟服务器列表，支持启动/停止 |
| `- Channel tree with drag-and-drop ordering` | - 频道树，支持拖拽排序 |
| `- Client list with kick, ban, move, poke actions` | - 客户端列表，支持踢出、封禁、移动、戳一戳 |
| `- Server & channel group management` | - 服务器组与频道组管理 |
| `- Permission editor (server, channel, client, group-level)` | - 权限编辑器（服务器、频道、客户端、服务器组各级别） |
| `- Ban list management` | - 封禁列表管理 |
| `- Token / privilege key management` | - 令牌 / 权限密钥管理 |
| `- Complaint viewer` | - 投诉查看器 |
| `- Offline message system` | - 离线消息系统 |
| `- Server log viewer with filtering` | - 服务器日志查看器，支持筛选 |
| `- Channel file browser with upload/download` | - 频道文件浏览器，支持上传/下载 |
| `- Instance-level settings` | - 实例级设置 |
| `- Multiple bots per server, each with independent queue and playback` | - 单台服务器可运行多个机器人，各自独立队列与播放 |
| `- Radio station streaming with ICY metadata and live title updates` | - 电台流播放，支持 ICY 元数据与实时曲目标题更新 |
| `- YouTube playback via yt-dlp (search, download, queue)` | - 通过 yt-dlp 播放 YouTube（搜索、下载、加入队列） |
| `- Music library management (upload, organize, playlists)` | - 音乐库管理（上传、整理、播放列表） |
| `- Volume control, pause, skip, previous, shuffle, repeat` | - 音量控制、暂停、跳过、上一首、随机播放、循环 |
| `- Stereo audio support with stable 20ms pacing` | - 立体声音频，采用稳定的 20ms 节奏控制 |
| `- Auto-reconnect with exponential backoff on disconnect` | - 断线后按指数退避自动重连 |
| `- In-channel text commands for hands-free control` | - 频道内文字命令，无需切出即可控制 |
| `- Music request history tracking` | - 音乐点播历史记录 |
| `### Video Streaming` | ### 视频串流 |
| `- Live video streaming from YouTube, Twitch, or direct URLs to TeamSpeak channels` | - 将 YouTube、Twitch 或直链视频实时推送到 TeamSpeak 频道 |
| `- WebRTC-based with Go sidecar relay (Pion) for low-latency delivery` | - 基于 WebRTC，配合 Go sidecar 中继（Pion）实现低延迟分发 |
| `- Quality presets (480p, 720p, 1080p)` | - 画质预设（480p、720p、1080p） |
| `- In-browser preview with WebRTC playback` | - 浏览器内 WebRTC 预览播放 |
| `- A/V synchronization via RTCP Sender Reports` | - 通过 RTCP Sender Reports 实现音画同步 |
| `- Runs as a Docker sidecar container alongside the backend` | - 以 Docker sidecar 容器形式与后端并行运行 |
| `- Visual flow editor with drag-and-drop node canvas` | - 可视化流程编辑器，支持拖拽式节点画布 |
| `- Triggers: TS3 events, cron schedules, webhooks (with mandatory secrets), chat commands (global or channel-specific)` | - 触发器：TS3 事件、cron 定时计划、Webhook（强制校验密钥）、聊天命令（全局或指定频道） |
| `- Actions: kick, ban, move, message, poke, channel create/edit/delete, HTTP requests, WebQuery commands` | - 动作：踢出、封禁、移动、发送消息、戳一戳、频道创建/编辑/删除、HTTP 请求、WebQuery 命令 |
| `- Conditions, variables, delays, loops, logging` | - 条件、变量、延迟、循环、日志记录 |
| `- Animated channel names (rotating text on a timer)` | - 动态频道名（定时滚动文字） |
| `- Placeholder system with filters and expressions` | - 占位符系统，支持过滤器与表达式 |
| `- Pre-built templates for common automation tasks` | - 常见自动化任务的内置模板 |
| `### Server Widgets` | ### 服务器小组件 |
| `- Embeddable server status banner for websites and forums` | - 可嵌入网站与论坛的服务器状态横幅 |
| `- Token-based public access (no authentication required)` | - 基于令牌的公开访问（无需登录鉴权） |
| `- Available as live page, SVG, or PNG image` | - 提供实时页面、SVG 或 PNG 图片三种形式 |
| `- Dark and light themes` | - 深色与浅色主题 |
| `- Configurable: show/hide channel tree and client list` | - 可配置显示/隐藏频道树与客户端列表 |
| `### Security` | ### 安全 |
| `- Setup wizard for initial admin account (no default credentials)` | - 首次使用设置向导创建管理员账户（无默认凭据） |
| `- AES-256-GCM encryption for stored credentials (API keys, SSH passwords)` | - 存储的凭据（API 密钥、SSH 密码）采用 AES-256-GCM 加密 |
| `- SSRF protection on all outbound HTTP requests and FFmpeg URLs` | - 所有出站 HTTP 请求与 FFmpeg URL 均具备 SSRF 防护 |
| `- Rate limiting on authentication endpoints` | - 认证接口限流 |
| `- JWT access + refresh token rotation with reuse detection` | - JWT 访问令牌 + 刷新令牌轮换，含重用检测 |
| `- Role-based access control (admin / viewer)` | - 基于角色的访问控制（管理员 / 查看者） |
| `- Per-server access control for multi-tenant setups` | - 多租户场景下的按服务器访问控制 |
| `- WebQuery command whitelist in bot flows (blocks destructive commands)` | - 机器人流程中的 WebQuery 命令白名单（拦截破坏性命令） |
| `- Authenticated WebSocket connections` | - 需鉴权的 WebSocket 连接 |
| `- Password complexity requirements` | - 密码复杂度要求 |
| `### Settings & Administration` | ### 设置与运维 |
| `- yt-dlp cookie file management for accessing age-restricted or member-only YouTube content` | - yt-dlp cookie 文件管理，用于访问有年龄限制或仅会员可见的 YouTube 内容 |
| `- Upload cookies via file or paste directly in the UI` | - 支持上传 cookie 文件或直接在界面中粘贴 |
| `- Admin-only settings panel` | - 仅管理员可见的设置面板 |
| `## Architecture` | ## 系统架构 |
| `**Four packages** in a pnpm monorepo:` | pnpm monorepo 共 **四个包**： |
| `\| Package \| Description \|` | \| 包名 \| 说明 \| |
| `\| `@ts6/common` \| Shared types, constants, utilities \|` | \| `@ts6/common` \| 共享类型、常量与工具函数 \| |
| `\| `@ts6/backend` \| Express API, WebQuery client, bot engine, voice bots, widgets \|` | \| `@ts6/backend` \| Express API、WebQuery 客户端、机器人引擎、语音机器人、小组件 \| |
| `\| `@ts6/frontend` \| React SPA with Vite, TailwindCSS, shadcn/ui \|` | \| `@ts6/frontend` \| 基于 Vite、TailwindCSS、shadcn/ui 的 React SPA \| |
| `\| `sidecar` \| Go WebRTC media relay (Pion) for video streaming \|` | \| `sidecar` \| Go 编写的 WebRTC 媒体中继（Pion），用于视频串流 \| |
| `The backend proxies all TeamSpeak API calls. The frontend never has direct access to API keys or server credentials.` | 所有 TeamSpeak API 调用均由后端代理，前端始终无法直接接触 API 密钥或服务器凭据。 |
| `## Tech Stack` | ## 技术栈 |
| `**Frontend:** React 18, Vite, TailwindCSS, shadcn/ui, TanStack Query + Table, React Flow, Recharts, Zustand` | **前端：** React 18、Vite、TailwindCSS、shadcn/ui、TanStack Query + Table、React Flow、Recharts、Zustand |
| `**Backend:** Node.js, Express, Prisma (SQLite), JWT authentication, WebQuery HTTP client, SSH event listener` | **后端：** Node.js、Express、Prisma（SQLite）、JWT 认证、WebQuery HTTP 客户端、SSH 事件监听 |
| `**Voice/Audio:** Custom TS3 voice protocol client (UDP), Opus encoding, FFmpeg, yt-dlp` | **语音/音频：** 自研 TS3 语音协议客户端（UDP）、Opus 编码、FFmpeg、yt-dlp |
| `**Video Streaming:** Go sidecar with Pion WebRTC v4, RTCP Sender Reports for A/V sync` | **视频串流：** Go sidecar，Pion WebRTC v4，通过 RTCP Sender Reports 实现音画同步 |
| `## Quick Start (Docker)` | ## 快速开始（Docker） |
| `1. Download the [`docker-compose.yml`](docker-compose.yml)` | 1. 下载 [`docker-compose.yml`](docker-compose.yml) |
| `2. Create a `.env` file next to it:` | 2. 在同级目录创建 `.env` 文件： |
| `Generate secure values:` | 生成安全随机值： |
| `3. Start the stack:` | 3. 启动服务： |
| `4. Open `http://localhost:3000/setup` and create your admin account` | 4. 打开 `http://localhost:3000/setup`，创建管理员账户 |
| `5. Log in, then add your TeamSpeak server connection under **Settings → Connections** (host, WebQuery port, API key)` | 5. 登录后，在 **设置 → 连接** 中添加 TeamSpeak 服务器连接（主机、WebQuery 端口、API 密钥） |
| `> `JWT_SECRET` is **required** — the backend will refuse to start in production without it.` | > `JWT_SECRET` 为**必填项** —— 生产环境下缺失该变量后端将拒绝启动。 |
| `> `ENCRYPTION_KEY` is optional but recommended — if not set, `JWT_SECRET` is used as fallback for credential encryption.` | > `ENCRYPTION_KEY` 可选但强烈建议设置 —— 若未设置，将回退使用 `JWT_SECRET` 作为凭据加密密钥。 |
| `### Coolify / Reverse Proxy` | ### Coolify / 反向代理 |
| `Use [`docker-compose.coolify.yml`](docker-compose.coolify.yml) as a starting point. Key differences from the standard compose:` | 可将 [`docker-compose.coolify.yml`](docker-compose.coolify.yml) 作为配置起点。与标准 compose 的关键差异： |
| `- No `ports` section — the reverse proxy handles routing` | - 没有 `ports` 段 —— 由反向代理负责路由 |
| `- Set the domain on the **frontend** service in Coolify (port 80)` | - 在 Coolify 中为 **frontend** 服务设置域名（端口 80） |
| `- If your TS server runs in a separate Docker network, add it as an external network on the backend service:` | - 若 TS 服务器运行在独立的 Docker 网络中，需将其作为外部网络挂到 backend 服务上： |
| `## Development` | ## 开发 |
| `Requires: Node.js 20+, pnpm 9+` | 环境要求：Node.js 20+、pnpm 9+ |
| `pnpm dev # starts backend + frontend in parallel` | pnpm dev # 并行启动后端与前端 |
| `Backend runs on `:3001`, frontend on `:5173` (Vite dev server).` | 后端运行于 `:3001`，前端运行于 `:5173`（Vite 开发服务器）。 |
| `### Database` | ### 数据库 |
| `Prisma with SQLite. On first run:` | 使用 Prisma + SQLite。首次运行： |
| `The Docker images handle migrations automatically on startup.` | Docker 镜像会在启动时自动执行数据库迁移。 |
| `## Environment Variables` | ## 环境变量 |
| `\| Variable \| Default \| Description \|` | \| 变量 \| 默认值 \| 说明 \| |
| `\| `JWT_SECRET` \| — \| **Required.** Secret for JWT signing. Must be set in production. \|` | \| `JWT_SECRET` \| — \| **必填。** JWT 签名密钥，生产环境必须设置。 \| |
| `\| `ENCRYPTION_KEY` \| — \| Optional. Dedicated key for AES-256-GCM credential encryption. Falls back to `JWT_SECRET` if not set. \|` | \| `ENCRYPTION_KEY` \| — \| 可选。AES-256-GCM 凭据加密的专用密钥，未设置时回退使用 `JWT_SECRET`。 \| |
| `\| `PORT` \| `3001` \| Backend port \|` | \| `PORT` \| `3001` \| 后端端口 \| |
| `\| `DATABASE_URL` \| `file:./data/ts6webui.db` \| SQLite database path \|` | \| `DATABASE_URL` \| `file:./data/ts6webui.db` \| SQLite 数据库路径 \| |
| `\| `JWT_ACCESS_EXPIRY` \| `15m` \| Access token lifetime \|` | \| `JWT_ACCESS_EXPIRY` \| `15m` \| 访问令牌有效期 \| |
| `\| `JWT_REFRESH_EXPIRY` \| `7d` \| Refresh token lifetime \|` | \| `JWT_REFRESH_EXPIRY` \| `7d` \| 刷新令牌有效期 \| |
| `\| `FRONTEND_URL` \| `http://localhost:3000` \| CORS origin \|` | \| `FRONTEND_URL` \| `http://localhost:3000` \| CORS 来源 \| |
| `\| `MUSIC_DIR` \| `/data/music` \| Directory for downloaded music files \|` | \| `MUSIC_DIR` \| `/data/music` \| 音乐文件下载目录 \| |
| `\| `SIDECAR_URL` \| — \| Optional. Full URL of the WebRTC sidecar service (e.g. `http://ts6-sidecar:9800`). Set in Docker when sidecar runs as a separate container. \|` | \| `SIDECAR_URL` \| — \| 可选。WebRTC sidecar 服务的完整 URL（如 `http://ts6-sidecar:9800`），sidecar 作为独立容器运行时需设置。 \| |
| `\| `YT_COOKIE_FILE` \| — \| Optional. Path to a Netscape-format cookies.txt file for yt-dlp. Can also be managed via **Settings → YouTube** in the UI. \|` | \| `YT_COOKIE_FILE` \| — \| 可选。yt-dlp 使用的 Netscape 格式 cookies.txt 文件路径，也可通过界面中的 **设置 → YouTube** 管理。 \| |
| `## Environment Variables Sidecar(VideoStreaming)` | ## 环境变量 Sidecar（视频串流） |
| `\| `VIDEO_QUEUE_SIZE` \| `2048` \| Size of the video RTP queue \|` | \| `VIDEO_QUEUE_SIZE` \| `2048` \| 视频 RTP 队列大小 \| |
| `\| `AUDIO_QUEUE_SIZE` \| `4096` \| Size of the audio RTP queue \|` | \| `AUDIO_QUEUE_SIZE` \| `4096` \| 音频 RTP 队列大小 \| |
| `\| `SYNC_PLAYOUT_BUFFER_MS` \| `4` \| Small playout buffer used by the adaptive pacing logic \|` | \| `SYNC_PLAYOUT_BUFFER_MS` \| `4` \| 供自适应节奏控制使用的小型播放缓冲区 \| |
| `\| `SYNC_VIDEO_BIAS_MS` \| `4` \| Optional extra holdback for video to fine-tune sync \|` | \| `SYNC_VIDEO_BIAS_MS` \| `4` \| 可选的视频额外延迟，用于微调同步 \| |
| `\| `AUDIO_DELAY_MS` \| `0` \| Legacy / manual audio delay option With the current pacing logic this is typically expected to stay at 0 \|` | \| `AUDIO_DELAY_MS` \| `0` \| 旧版 / 手动音频延迟选项。在当前节奏控制逻辑下通常应保持为 0 \| |
| `\| `SIDECAR_DEBUG_LOGS` \| `1` \| Enables verbose debug logging for high-frequency runtime details \|` | \| `SIDECAR_DEBUG_LOGS` \| `1` \| 开启高频运行时细节的详细调试日志 \| |
| `\| `VIDEO_READ_RTP_BUFFER` \| `4194304` \| UDP OS-socketbuffer for video port \|` | \| `VIDEO_READ_RTP_BUFFER` \| `4194304` \| 视频端口的 UDP 系统套接字缓冲区 \| |
| `\| `AUDIO_READ_RTP_BUFFER` \| `1048576` \| UDP OS-socketbuffer for audio port \|` | \| `AUDIO_READ_RTP_BUFFER` \| `1048576` \| 音频端口的 UDP 系统套接字缓冲区 \| |
| `\| `VIDEO_BUFSIZE` \| `1M` \| FFmpeg Video Buffer \|` | \| `VIDEO_BUFSIZE` \| `1M` \| FFmpeg 视频缓冲区 \| |
| `## Music Bot Text Commands` | ## 音乐机器人文字命令 |
| `When a music bot is connected to a channel, users in that channel can control it via chat:` | 当音乐机器人连接到某频道后，该频道内的用户可通过聊天控制它： |
| `\| Command \| Description \|` | \| 命令 \| 说明 \| |
| `\| `!radio` \| List available radio stations \|` | \| `!radio` \| 列出可用电台 \| |
| `\| `!radio <id>` \| Play a radio station \|` | \| `!radio <id>` \| 播放指定电台 \| |
| `\| `!play <url>` \| Play from YouTube URL \|` | \| `!play <url>` \| 通过 YouTube URL 播放 \| |
| `\| `!play` \| Resume paused playback \|` | \| `!play` \| 继续暂停的播放 \| |
| `\| `!stop` \| Stop playback \|` | \| `!stop` \| 停止播放 \| |
| `\| `!pause` \| Toggle pause/resume \|` | \| `!pause` \| 切换暂停/继续 \| |
| `\| `!skip` / `!next` \| Next track in queue \|` | \| `!skip` / `!next` \| 播放队列中的下一首 \| |
| `\| `!prev` \| Previous track \|` | \| `!prev` \| 上一首 \| |
| `\| `!vol` \| Show current volume \|` | \| `!vol` \| 显示当前音量 \| |
| `\| `!vol <0-100>` \| Set volume \|` | \| `!vol <0-100>` \| 设置音量 \| |
| `\| `!np` \| Show current track \|` | \| `!np` \| 显示当前曲目 \| |
| `## Requirements` | ## 运行要求 |
| `- TeamSpeak server with **WebQuery HTTP** enabled (not raw/telnet)` | - TeamSpeak 服务器已启用 **WebQuery HTTP**（非 raw/telnet 模式） |
| `- WebQuery API key (generated via `apikeyadd` or server admin tools)` | - WebQuery API 密钥（通过 `apikeyadd` 或服务器管理工具生成） |
| `- SSH access to the TS server (only needed for bot flow event triggers)` | - 对 TS 服务器的 SSH 访问权限（仅机器人流程的事件触发器需要） |
| `- `yt-dlp` and `ffmpeg` installed on the backend (included in the Docker image)` | - 后端已安装 `yt-dlp` 与 `ffmpeg`（Docker 镜像中已内置） |
| `## License` | ## 许可证 |

## `packages/backend/src/app.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Too many attempts, please try again later` | 尝试次数过多，请稍后再试 |
| `Bot engine not running` | 机器人引擎未运行 |

## `packages/backend/src/bot-engine/engine.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Not found` | 未找到 |

## `packages/backend/src/index.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Invalid token` | 令牌无效 |

## `packages/backend/src/middleware/auth.ts`

| 英文原文 | 中文译文 |
|---|---|
| `No token provided` | 未提供访问令牌 |
| `User account disabled or deleted` | 该用户账户已被停用或删除 |
| `Internal server error` | 服务器内部错误 |
| `Invalid or expired token` | 令牌无效或已过期 |

## `packages/backend/src/middleware/error-handler.ts`

| 英文原文 | 中文译文 |
|---|---|
| `TeamSpeak API Error` | TeamSpeak API 错误 |
| `Internal server error` | 服务器内部错误 |

## `packages/backend/src/middleware/rbac.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Not authenticated` | 未登录 |
| `Insufficient permissions` | 权限不足 |

## `packages/backend/src/middleware/server-access.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Invalid server config ID` | 服务器配置 ID 无效 |
| `No access to this server` | 无权访问该服务器 |

## `packages/backend/src/routes/auth.routes.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Username and password required` | 用户名和密码为必填项 |
| `Invalid credentials` | 用户名或密码错误 |
| `Refresh token required` | 刷新令牌为必填项 |
| `Invalid refresh token` | 刷新令牌无效 |
| `User not found` | 用户不存在 |
| `Both passwords required` | 两次密码均为必填项 |
| `Current password is incorrect` | 当前密码不正确 |

## `packages/backend/src/routes/bots.routes.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Bot flow not found` | 机器人流程不存在 |
| `Name and valid serverConfigId are required` | 名称和有效的 serverConfigId 为必填项 |
| `Server config ${parsedConfigId} does not exist` | 服务器配置 ${parsedConfigId} 不存在 |

## `packages/backend/src/routes/files.routes.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Bot engine not available` | 机器人引擎不可用 |
| `SSH credentials not configured for this server. File browsing requires SSH access because WebQuery HTTP does not support ft* commands.` | 该服务器未配置 SSH 凭据。文件浏览需要 SSH 访问，因为 WebQuery HTTP 不支持 ft* 系列命令。 |

## `packages/backend/src/routes/music-bots.routes.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Music bot not found` | 音乐机器人不存在 |
| `name and serverConfigId are required` | name 和 serverConfigId 为必填项 |
| `songId is required` | songId 为必填项 |
| `Bot is not connected` | 机器人未连接 |
| `Song not found` | 歌曲不存在 |
| `url is required` | url 为必填项 |
| `Failed to play URL: ${err.message}` | 播放 URL 失败：${err.message} |
| `stationId is required` | stationId 为必填项 |
| `Radio station not found` | 电台不存在 |
| `Playlist not found` | 播放列表不存在 |
| `Invalid repeat mode` | 循环模式无效 |
| `Invalid queue index` | 队列索引无效 |
| `from and to are required` | from 和 to 为必填项 |
| `Invalid indices` | 索引无效 |
| `source is required` | source 为必填项 |
| `No active video stream` | 当前没有活跃的视频流 |
| `sdp is required` | sdp 为必填项 |

## `packages/backend/src/routes/music-library.routes.ts`

| 英文原文 | 中文译文 |
|---|---|
| `No file uploaded` | 未上传文件 |
| `Song not found` | 歌曲不存在 |
| `query is required` | query 为必填项 |
| `url is required` | url 为必填项 |
| `urls array is required` | urls 数组为必填项 |

## `packages/backend/src/routes/music-requests.routes.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Invalid config id` | 配置 ID 无效 |

## `packages/backend/src/routes/playlists.routes.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Playlist not found` | 播放列表不存在 |
| `name is required` | name 为必填项 |
| `songId is required` | songId 为必填项 |
| `songIds array is required` | songIds 数组为必填项 |

## `packages/backend/src/routes/radio-stations.routes.ts`

| 英文原文 | 中文译文 |
|---|---|
| `name and url are required` | name 和 url 为必填项 |
| `Invalid URL: ${urlCheck.error}` | URL 无效：${urlCheck.error} |

## `packages/backend/src/routes/servers.routes.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Name, host, and API key are required` | 名称、主机和 API 密钥为必填项 |
| `Server config not found` | 服务器配置不存在 |

## `packages/backend/src/routes/settings.routes.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Admin access required` | 需要管理员权限 |
| `No cookie file or text provided` | 未提供 Cookie 文件或内容 |

## `packages/backend/src/routes/setup.routes.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Setup already completed` | 初始化已完成 |
| `Username and password are required` | 用户名和密码为必填项 |
| `Admin account created. You can now log in.` | 管理员账户已创建，现在可以登录了。 |

## `packages/backend/src/routes/users.routes.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Username, password, and display name required` | 用户名、密码和显示名称为必填项 |
| `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` | 角色无效。必须是以下之一：${VALID_ROLES.join(', ')} |
| `Cannot delete your own account` | 不能删除自己的账户 |

## `packages/backend/src/routes/widget-public.routes.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Widget not found or server offline` | 小组件不存在或服务器离线 |
| `Widget not found` | 小组件不存在 |
| `Invalid token` | 令牌无效 |
| `Bot not found` | 机器人不存在 |

## `packages/backend/src/routes/widget.routes.ts`

| 英文原文 | 中文译文 |
|---|---|
| `name and serverConfigId are required` | name 和 serverConfigId 为必填项 |
| `Server config not found` | 服务器配置不存在 |
| `Widget not found` | 小组件不存在 |

## `packages/backend/src/utils/url-validator.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Invalid URL format` | URL 格式无效 |
| `Protocol "${parsed.protocol}" is not allowed. Use: ${allowedProtocols.join(', ')}` | 不允许使用协议 "${parsed.protocol}"。请使用：${allowedProtocols.join(', ')} |
| `Hostname "${hostname}" is blocked` | 主机名 "${hostname}" 已被禁止访问 |
| `Cloud metadata endpoint is blocked` | 云元数据端点已被禁止访问 |
| `Private/reserved IP addresses are blocked` | 私有/保留 IP 地址已被禁止访问 |
| `Hostname "${hostname}" resolves to a private IP (${address})` | 主机名 "${hostname}" 解析到私有 IP（${address}） |
| `Hostname "${hostname}" resolves to a cloud metadata IP` | 主机名 "${hostname}" 解析到云元数据 IP |

## `packages/backend/src/utils/validate-password.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Password must be at least 8 characters long` | 密码长度至少为 8 位 |
| `Password must contain at least one uppercase letter` | 密码必须包含至少一个大写字母 |
| `Password must contain at least one lowercase letter` | 密码必须包含至少一个小写字母 |
| `Password must contain at least one digit` | 密码必须包含至少一个数字 |

## `packages/backend/src/voice/voice-bot-manager.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Server config not found` | 服务器配置不存在 |

## `packages/backend/src/voice/voice-bot.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Bot is not connected` | 机器人未连接 |
| `No active video stream` | 当前没有活跃的视频流 |

## `packages/common/src/widget-themes.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Dark` | 深色 |
| `Light` | 浅色 |
| `Transparent` | 透明 |
| `Neon / Cyberpunk` | 霓虹 / 赛博朋克 |
| `Military / OD Green` | 军旅 / 橄榄绿 |
| `Minimal / Clean` | 极简 / 清爽 |

## `packages/frontend/index.html`

| 英文原文 | 中文译文 |
|---|---|
| `TeamSpeak 6 Manager` | TeamSpeak 6 管理器 |

## `packages/frontend/src/components/bots/PlaceholderReference.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Placeholder Reference` | 占位符参考 |
| `Event` | 事件 |
| `Time` | 时间 |
| `Variables` | 变量 |
| `Temp` | 临时变量 |
| `Exec` | 执行 |
| `Filter` | 过滤器 |
| `Functions` | 函数 |
| `Client Connected &mdash; notifycliententerview` | 客户端已连接 &mdash; notifycliententerview |
| `Client ID` | 客户端 ID |
| `Move client #{{event.clid}} to channel` | 将客户端 #{{event.clid}} 移动到频道 |
| `Nickname` | 昵称 |
| `Welcome {{event.client_nickname}}!` | 欢迎 {{event.client_nickname}}！ |
| `Database ID` | 数据库 ID |
| `Unique ID (UID)` | 唯一 ID（UID） |
| `Type (0=User, 1=Query)` | 类型（0=用户，1=查询） |
| `Server group IDs (comma-separated)` | 服务器组 ID（逗号分隔） |
| `IP address` | IP 地址 |
| `VPN check: https://api.vpn.io/{{event.connection_client_ip}}` | VPN 校验：https://api.vpn.io/{{event.connection_client_ip}} |
| `Channel the client joined` | 客户端所加入的频道 |
| `Client Disconnected &mdash; notifyclientleftview` | 客户端已断开 &mdash; notifyclientleftview |
| `Channel the client was in` | 客户端原先所在的频道 |
| `Reason (3=lost, 5=kick, 6=ban, 8=leave)` | 原因（3=断线，5=踢出，6=封禁，8=离开） |
| `Reason message` | 原因说明 |
| `Kicked: {{event.reasonmsg}}` | 已被踢出：{{event.reasonmsg}} |
| `Client Moved &mdash; notifyclientmoved` | 客户端已移动 &mdash; notifyclientmoved |
| `Target channel ID` | 目标频道 ID |
| `Source channel ID` | 来源频道 ID |
| `Reason (0=self, 1=moved by admin)` | 原因（0=自行移动，1=被管理员移动） |
| `Text Message &mdash; notifytextmessage` | 文本消息 &mdash; notifytextmessage |
| `Sender client ID` | 发送者客户端 ID |
| `Sender nickname` | 发送者昵称 |
| `Message text` | 消息文本 |
| `User wrote: {{event.msg}}` | 用户说：{{event.msg}} |
| `Target (1=private, 2=channel, 3=server)` | 目标（1=私聊，2=频道，3=服务器） |
| `Chat Command &mdash; trigger_command` | 聊天命令 &mdash; trigger_command |
| `Command name (without prefix)` | 命令名称（不含前缀） |
| `Command: {{event.command_name}}` | 命令：{{event.command_name}} |
| `Arguments after command` | 命令后的参数 |
| `Args: {{event.command_args}}` | 参数：{{event.command_args}} |
| `Channel Events &mdash; created / edited / deleted` | 频道事件 &mdash; created / edited / deleted |
| `Channel ID` | 频道 ID |
| `Client ID of who made the change` | 执行变更的客户端 ID |
| `Name of who made the change` | 执行变更者名称 |
| `Request path` | 请求路径 |
| `HTTP method` | HTTP 方法 |
| `GET or POST` | GET 或 POST |
| `Request body (raw JSON)` | 请求体（原始 JSON） |
| `Nested field from JSON body` | JSON 请求体中的嵌套字段 |
| `Status: {{event.webhook_body.status}}` | 状态：{{event.webhook_body.status}} |
| `Query parameters (raw JSON)` | 查询参数（原始 JSON） |
| `Formatted time HH:MM` | 格式化时间 HH:MM |
| `Channel name: Es ist {{time.time}} Uhr` | 频道名：现在是 {{time.time}} |
| `Formatted date DD.MM.YYYY` | 格式化日期 DD.MM.YYYY |
| `Datum: {{time.date}}` | 日期：{{time.date}} |
| `Hour (00-23)` | 小时（00-23） |
| `Minute (00-59)` | 分钟（00-59） |
| `Second (00-59)` | 秒（00-59） |
| `Day of month (01-31)` | 月内日期（01-31） |
| `Month (01-12)` | 月份（01-12） |
| `Year (4-digit)` | 年份（4 位） |
| `Day of week (0=Sun, 1=Mon, ..., 6=Sat)` | 星期（0=周日，1=周一，…，6=周六） |
| `Unix timestamp (seconds)` | Unix 时间戳（秒） |
| `Set Variable` | 设置变量 |
| `Read variable by name` | 按名称读取变量 |
| `Counter: {{var.visit_count}}` | 计数：{{var.visit_count}} |
| `Actions for Variables` | 变量相关操作 |
| `Set` | 设置 |
| `&mdash; Set a variable to a fixed value or template` | &mdash; 将变量设为固定值或模板 |
| `Increment` | 自增 |
| `&mdash; Add a number to the current value` | &mdash; 在当前值基础上加上一个数字 |
| `Append` | 追加 |
| `&mdash; Append text to the current value` | &mdash; 在当前值末尾追加文本 |
| `Use Case Examples` | 用法示例 |
| `Visit counter: Increment` | 访问计数：每次加入时将 |
| `by 1 on each join` | 自增 1 |
| `Last seen: Set` | 最后出现：将 |
| `to` | 设为 |
| `Online time tracking: Increment` | 在线时长统计：将 |
| `Auto-set by Actions` | 由动作自动写入 |
| `CID of channel created by Create Channel` | 「创建频道」所创建频道的 CID |
| `Move client to {{temp.lastCreatedChannelId}}` | 将客户端移动到 {{temp.lastCreatedChannelId}} |
| `Raw JSON result from WebQuery action` | WebQuery 动作返回的原始 JSON 结果 |
| `Number of clients moved by AFK Mover` | AFK 移动动作所移动的客户端数量 |
| `Moved {{temp.afkMovedCount}} AFK users` | 已移动 {{temp.afkMovedCount}} 名 AFK 用户 |
| `Number of clients kicked by Idle Kicker` | 闲置踢出动作所踢出的客户端数量 |
| `Number of clients poked by Poke Group` | 戳一戳组动作所戳的客户端数量 |
| `Number of clients promoted by Rank Check` | 等级检查动作所晋升的客户端数量 |
| `Online users (after serverinfo stored as "server")` | 在线用户数（在将 serverinfo 存储为 "server" 之后） |
| `Online: {{temp.server.virtualserver_clientsonline}}/{{temp.server.virtualserver_maxclients}}` | 在线：{{temp.server.virtualserver_clientsonline}}/{{temp.server.virtualserver_maxclients}} |
| `Server uptime in seconds` | 服务器运行时长（秒） |
| `Uptime: {{temp.server.virtualserver_uptime\|uptime}}` | 运行时长：{{temp.server.virtualserver_uptime\|uptime}} |
| `Client name (after clientinfo stored as "client")` | 客户端名称（在将 clientinfo 存储为 "client" 之后） |
| `ID of the flow being executed` | 正在执行的流程 ID |
| `Unique execution instance ID` | 唯一的执行实例 ID |
| `Server config ID` | 服务器配置 ID |
| `Virtual server ID` | 虚拟服务器 ID |
| `Trigger type (event, cron, webhook, command)` | 触发器类型（event、cron、webhook、command） |
| `Converts seconds to readable uptime` | 将秒数转换为易读的运行时长 |
| `Rounds to nearest integer` | 四舍五入到整数 |
| `Rounds down to integer` | 向下取整 |
| `Condition` | 条件 |
| `String contains substring?` | 字符串是否包含子串？ |
| `String starts with prefix?` | 字符串是否以指定前缀开头？ |
| `String ends with suffix?` | 字符串是否以指定后缀结尾？ |
| `Convert to lowercase` | 转换为小写 |
| `Convert to uppercase` | 转换为大写 |
| `String length` | 字符串长度 |
| `Split string and get element at index` | 拆分字符串并取指定下标的元素 |
| `Condition Examples` | 条件示例 |
| `&mdash; Only real users (no query clients)` | &mdash; 仅真实用户（不含查询客户端） |
| `&mdash; Client is in server group 7` | &mdash; 客户端位于服务器组 7 |
| `&mdash; Nighttime only` | &mdash; 仅在夜间 |
| `&mdash; Client moved to specific channel` | &mdash; 客户端被移动到指定频道 |
| `&mdash; VPN detected (after HTTP request)` | &mdash; 检测到 VPN（HTTP 请求之后） |

## `packages/frontend/src/components/bots/TemplateGallery.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Configure: ${selected.name}` | 配置：${selected.name} |
| `Flow Templates` | 流程模板 |
| `No configuration needed — ready to create.` | 无需配置，可直接创建。 |
| `Back` | 返回 |

## `packages/frontend/src/components/layout/Header.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Log out` | 退出登录 |

## `packages/frontend/src/components/layout/ServerSelector.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Select server...` | 选择服务器... |
| `Virtual server...` | 虚拟服务器... |

## `packages/frontend/src/components/layout/Sidebar.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Overview` | 概览 |
| `Dashboard` | 仪表盘 |
| `Virtual Servers` | 虚拟服务器 |
| `Management` | 管理 |
| `Channels` | 频道 |
| `Clients` | 客户端 |
| `Server Groups` | 服务器组 |
| `Channel Groups` | 频道组 |
| `Permissions` | 权限 |
| `Security` | 安全 |
| `Bans` | 封禁 |
| `Tokens` | 令牌 |
| `Content` | 内容 |
| `Files` | 文件 |
| `Complaints` | 投诉 |
| `Messages` | 消息 |
| `System` | 系统 |
| `Server Logs` | 服务器日志 |
| `Instance` | 实例 |
| `Music Request History` | 音乐点播历史 |
| `Automation` | 自动化 |
| `Bot Flows` | 机器人流程 |
| `Music Bots` | 音乐机器人 |
| `Settings` | 设置 |
| `Collapse` | 收起 |

## `packages/frontend/src/components/shared/ConfirmDialog.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Confirm` | 确认 |
| `Processing...` | 处理中... |

## `packages/frontend/src/components/shared/DataTable.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Search...` | 搜索... |

## `packages/frontend/src/components/shared/LoadingSpinner.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `LOADING...` | 加载中... |

## `packages/frontend/src/components/video/VideoPlayer.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Failed to connect` | 连接失败 |
| `No active video stream` | 当前没有进行中的视频流 |
| `Connecting to stream...` | 正在连接视频流... |
| `LIVE` | 直播中 |

## `packages/frontend/src/components/video/VideoStreamTab.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Video Stream` | 视频流 |
| `Source URL` | 源地址 |
| `https://youtube.com/watch?v=... or direct video URL` | https://youtube.com/watch?v=... 或直链视频地址 |
| `Quality Preset` | 画质预设 |
| `Frame Rate (FPS)` | 帧率（FPS） |
| `Video Bitrate` | 视频码率 |
| `e.g. 1500k, 2500k, 4500k` | 例如 1500k、2500k、4500k |
| `Starting...` | 启动中... |
| `Start Stream` | 开始推流 |
| `Stopping...` | 停止中... |
| `Stop Stream` | 停止推流 |
| `Live Preview` | 实时预览 |
| `Preset:` | 预设： |
| `FPS:` | 帧率： |
| `Bitrate:` | 码率： |
| `No viewers connected` | 暂无观看者连接 |
| `${mins}m ${secs}s` | ${mins}分 ${secs}秒 |
| `${secs}s` | ${secs}秒 |

## `packages/frontend/src/components/widget/WidgetManagerModal.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Server Widgets` | 服务器小组件 |
| `Create Widget` | 创建小组件 |
| `Edit Widget` | 编辑小组件 |
| `Embed Code` | 嵌入代码 |
| `Loading...` | 加载中... |
| `Name` | 名称 |
| `My Server Widget` | 我的服务器小组件 |
| `Server` | 服务器 |
| `Select server` | 选择服务器 |
| `Virtual Server ID` | 虚拟服务器 ID |
| `Theme` | 主题 |
| `Show Channel Tree` | 显示频道树 |
| `Show Clients` | 显示客户端 |
| `Hide Empty Channels` | 隐藏空频道 |
| `Cancel` | 取消 |
| `Create` | 创建 |
| `Save` | 保存 |
| `Image URLs` | 图片链接 |
| `Paste this into your website HTML:` | 把下面代码粘贴到你的网站 HTML 中： |
| `SVG (scalable, best quality):` | SVG（可缩放，质量最佳）： |
| `PNG (for forums / signatures):` | PNG（适用于论坛 / 签名）： |
| `HTML img tag:` | HTML img 标签： |
| `<img src="${origin}/api/widget/${embedTarget.token}/image.png" alt="TeamSpeak Server" />` | <img src="${origin}/api/widget/${embedTarget.token}/image.png" alt="TeamSpeak 服务器" /> |
| `TeamSpeak Server` | TeamSpeak 服务器 |
| `Forum BBCode (uses PNG):` | 论坛 BBCode（使用 PNG）： |

## `packages/frontend/src/components/widget/WidgetRenderer.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `${d}d ${h}h` | ${d}天 ${h}小时 |
| `${h}h ${m}m` | ${h}小时 ${m}分 |
| `${m}m` | ${m}分 |
| `[away]` | [离开] |
| `[muted]` | [已静音] |
| `Click to join server` | 点击加入服务器 |

## `packages/frontend/src/data/bot-templates.ts`

| 英文原文 | 中文译文 |
|---|---|
| `Clock Channel` | 时钟频道 |
| `Updates a channel name with the current time every minute.` | 每分钟用当前时间更新一次频道名称。 |
| `Channel ID` | 频道 ID |
| `Timezone` | 时区 |
| `Every Minute` | 每分钟 |
| `Update Clock` | 更新时钟 |
| `Online Counter` | 在线人数统计 |
| `Shows the current online client count in a channel name.` | 在频道名称中显示当前在线客户端数量。 |
| `Get Server Info` | 获取服务器信息 |
| `Update Counter` | 更新计数 |
| `[cspacer]Online: {{temp.server.virtualserver_clientsonline}}/{{temp.server.virtualserver_maxclients}}` | [cspacer]在线: {{temp.server.virtualserver_clientsonline}}/{{temp.server.virtualserver_maxclients}} |
| `Server Stats` | 服务器统计 |
| `Displays uptime, online clients, and channel count in three info channels.` | 在三个信息频道中分别显示运行时长、在线客户端数和频道数量。 |
| `Uptime Channel ID` | 运行时长频道 ID |
| `Clients Channel ID` | 在线人数频道 ID |
| `Channel Count Channel ID` | 频道数量频道 ID |
| `Every 5 Min` | 每 5 分钟 |
| `Uptime` | 运行时长 |
| `[cspacer]Uptime: {{temp.server.virtualserver_uptime\|uptime}}` | [cspacer]运行时长: {{temp.server.virtualserver_uptime\|uptime}} |
| `Clients` | 在线人数 |
| `[cspacer]Clients: {{temp.server.virtualserver_clientsonline}}/{{temp.server.virtualserver_maxclients}}` | [cspacer]客户端: {{temp.server.virtualserver_clientsonline}}/{{temp.server.virtualserver_maxclients}} |
| `Channels` | 频道数量 |
| `[cspacer]Channels: {{temp.server.virtualserver_channelsonline}}` | [cspacer]频道: {{temp.server.virtualserver_channelsonline}} |
| `Animated Channel Name` | 动态频道名称 |
| `Animates a channel name with visual effects like scrolling marquee, typewriter, bounce, and more. Updates every 2-5 seconds.` | 用滚动跑马灯、打字机、弹跳等视觉效果为频道名称添加动画，每 2-5 秒更新一次。 |
| `Display Text` | 显示文本 |
| `Welcome to MyServer` | 欢迎来到我的服务器 |
| `Animation Style` | 动画样式 |
| `Scroll Left (Marquee)` | 向左滚动（跑马灯） |
| `Typewriter` | 打字机 |
| `Bounce` | 弹跳 |
| `Blink` | 闪烁 |
| `Wave (Decorative)` | 波浪（装饰） |
| `Alternate Case` | 大小写交替 |
| `Speed` | 速度 |
| `Slow (5s)` | 慢速（5 秒） |
| `Medium (3s)` | 中速（3 秒） |
| `Fast (2s)` | 快速（2 秒） |
| `Very Fast (1s)` | 很快（1 秒） |
| `Ultra (0.5s)` | 极快（0.5 秒） |
| `Insane (0.25s)` | 疯狂（0.25 秒） |
| `Channel Name Prefix` | 频道名称前缀 |
| `Animated Channel` | 动态频道 |
| `Welcome Message` | 欢迎消息 |
| `Sends a welcome message or poke when a client joins the server.` | 当客户端加入服务器时发送欢迎消息或戳一戳。 |
| `Welcome {{event.client_nickname}}!` | 欢迎 {{event.client_nickname}}！ |
| `Delivery Method` | 发送方式 |
| `Private Message` | 私聊消息 |
| `Poke` | 戳一戳 |
| `Client Enter` | 客户端进入 |
| `Is Human?` | 是真人吗？ |
| `Welcome Poke` | 欢迎戳一戳 |
| `Welcome!` | 欢迎！ |
| `Welcome Msg` | 欢迎消息 |
| `Support System` | 支持系统 |
| `Notifies admins when a client joins the support channel.` | 当客户端进入支持频道时通知管理员。 |
| `Support Channel ID` | 支持频道 ID |
| `Admin Group ID` | 管理员组 ID |
| `Notification Message` | 通知消息 |
| `Support needed by {{event.client_nickname}}!` | {{event.client_nickname}} 需要支持！ |
| `Client Moved` | 客户端切换频道 |
| `Joined Support?` | 进入支持频道？ |
| `Get Client Info` | 获取客户端信息 |
| `Notify Admins` | 通知管理员 |
| `Support needed by {{temp.client.client_nickname}}!` | {{temp.client.client_nickname}} 需要支持！ |
| `Temp Channel Creator` | 临时频道创建器 |
| `Creates a temporary channel when a client joins a lobby channel, then moves them in. Channel is auto-deleted when empty.` | 当客户端进入大厅频道时创建一个临时频道，并将其移入该频道。频道在空置后自动删除。 |
| `Lobby Channel ID` | 大厅频道 ID |
| `Parent Channel ID` | 父频道 ID |
| `Joined Lobby?` | 进入大厅？ |
| `Create Channel` | 创建频道 |
| `{{temp.client.client_nickname}}'s Channel` | {{temp.client.client_nickname}} 的频道 |
| `Move to Channel` | 移动到频道 |
| `Cleanup Timer` | 清理定时器 |
| `Delete Empty Channels` | 删除空频道 |
| `Auto-Rank` | 自动等级 |
| `Automatically assigns server groups based on cumulative online time.` | 根据累计在线时长自动分配服务器组。 |
| `Ranks (JSON)` | 等级规则（JSON） |
| `Check Interval` | 检查间隔 |
| `Every 5 min` | 每 5 分钟 |
| `Every 15 min` | 每 15 分钟 |
| `Every hour` | 每小时 |
| `Rank Timer` | 等级定时器 |
| `Check Ranks` | 检查等级 |
| `Last-Seen Tracker` | 最后在线记录 |
| `Records the last-seen timestamp when a client disconnects.` | 在客户端断开连接时记录其最后在线时间戳。 |
| `Client Leave` | 客户端离开 |
| `Store Timestamp` | 保存时间戳 |
| `Log Leave` | 记录离开 |
| `{{event.client_nickname}} left (dbid={{event.client_database_id}})` | {{event.client_nickname}} 已离开（dbid={{event.client_database_id}}） |
| `AFK Mover` | AFK 移动器 |
| `Moves idle clients to an AFK channel after a configurable timeout.` | 在超过可配置的超时时间后，将闲置客户端移动到 AFK 频道。 |
| `AFK Channel ID` | AFK 频道 ID |
| `Idle Threshold (seconds)` | 闲置阈值（秒） |
| `Exempt Group IDs (comma-separated)` | 豁免组 ID（逗号分隔） |
| `AFK Check` | AFK 检查 |
| `Move AFK` | 移动 AFK |
| `Idle Kicker` | 闲置踢出 |
| `Kicks clients that have been idle for too long.` | 踢出闲置时间过长的客户端。 |
| `Kick Reason` | 踢出原因 |
| `Idle timeout` | 闲置超时 |
| `Idle Check` | 闲置检查 |
| `Kick Idle` | 踢出闲置 |
| `Bad Name Checker` | 违禁昵称检查 |
| `Kicks clients whose nickname contains forbidden words.` | 昵称中包含违禁词的客户端将被踢出。 |
| `Bad Words (comma-separated)` | 违禁词（逗号分隔） |
| `Forbidden nickname` | 违禁昵称 |
| `Bad Name?` | 昵称违禁？ |
| `Kick Bad Name` | 踢出违禁昵称 |
| `Forbidden nickname` | 昵称不符合规定 |
| `Group Protector` | 服务器组保护 |
| `Kicks clients who have a protected group but lack the required authorization group.` | 踢出拥有受保护组但缺少所需授权组的客户端。 |
| `Protected Group ID` | 受保护组 ID |
| `Authorized Group ID` | 授权组 ID |
| `Action` | 处理方式 |
| `Kick` | 踢出 |
| `Remove Group` | 移除组 |
| `Kick Intruder` | 踢出违规者 |
| `Unauthorized group` | 不在允许的服务器组内 |
| `Has Protected?` | 拥有受保护组？ |
| `Missing Auth?` | 缺少授权？ |
| `Webhook → Server Message` | Webhook → 服务器消息 |
| `Receives a webhook POST and broadcasts the message to the TeamSpeak server. Great for monitoring alerts, CI/CD notifications, or Discord bridges.` | 接收 Webhook POST 请求，并把消息广播到 TeamSpeak 服务器。适用于监控告警、CI/CD 通知或 Discord 桥接。 |
| `Webhook Path` | Webhook 路径 |
| `Secret (optional)` | 密钥（可选） |
| `Incoming Webhook` | 接收 Webhook |
| `Broadcast Message` | 广播消息 |
| `Webhook → Assign Group` | Webhook → 分配服务器组 |
| `External system (e.g. website verification) sends a webhook with a client database ID to assign a server group. Use for website-to-TS3 user verification.` | 外部系统（例如网站验证）发送携带客户端数据库 ID 的 Webhook，以分配服务器组。用于网站到 TS3 的用户验证。 |
| `Server Group ID to assign` | 要分配的服务器组 ID |
| `Verification Webhook` | 验证 Webhook |
| `Add to Group` | 加入组 |
| `Log Result` | 记录结果 |
| `Assigned group {{groupId}} to cldbid {{event.webhook_body.cldbid}}` | 已为 cldbid {{event.webhook_body.cldbid}} 分配服务器组 {{groupId}} |
| `Webhook → Update Channel` | Webhook → 更新频道 |
| `Receives a webhook and updates a channel name. Use for external status displays like game server status, stream status, or monitoring dashboards.` | 接收 Webhook 并更新频道名称。适用于外部状态展示，例如游戏服务器状态、直播状态或监控仪表盘。 |
| `Channel ID to update` | 要更新的频道 ID |
| `Channel Name Template` | 频道名称模板 |
| `Status Webhook` | 状态 Webhook |
| `Update Channel` | 更新频道 |
| `Anti-VPN` | Anti-VPN 反代理 |
| `Checks connecting clients against a VPN detection API and kicks/bans VPN users.` | 通过 VPN 检测 API 校验接入的客户端，并对 VPN 用户执行踢出或封禁。 |
| `API URL (use {{ip}} placeholder)` | API URL（使用 {{ip}} 占位符） |
| `Action for VPN` | 针对 VPN 的处理方式 |
| `Ban (1h)` | 封禁（1 小时） |
| `Ban VPN` | 封禁 VPN |
| `VPN detected` | 检测到 VPN |
| `Kick VPN` | 踢出 VPN |
| `Check VPN API` | 校验 VPN API |
| `Is VPN?` | 是 VPN 吗？ |
| `Info Channels` | 信息频道 |
| `Dynamic channel names with live data` | 带实时数据的动态频道名称 |
| `Moderation` | 管理 |
| `Automated moderation and protection` | 自动化管理与防护 |
| `Automation` | 自动化 |
| `Welcome messages, temp channels, ranking` | 欢迎消息、临时频道、等级 |
| `Integration` | 集成 |
| `External APIs and webhooks` | 外部 API 与 Webhook |

## `packages/frontend/src/lib/utils.ts`

| 英文原文 | 中文译文 |
|---|---|
| `${d}d ${h}h ${m}m` | ${d}天 ${h}小时 ${m}分 |
| `${h}h ${m}m` | ${h}小时 ${m}分 |
| `${m}m` | ${m}分 |
| `Permanent` | 永久 |
| `${d}d` | ${d}天 |
| `${h}h` | ${h}小时 |
| `< 1m` | 小于 1 分钟 |
| `Just now` | 刚刚 |
| `${Math.floor(diff / 60)}m ago` | ${Math.floor(diff / 60)} 分钟前 |
| `${Math.floor(diff / 3600)}h ago` | ${Math.floor(diff / 3600)} 小时前 |
| `${Math.floor(diff / 86400)}d ago` | ${Math.floor(diff / 86400)} 天前 |

## `packages/frontend/src/pages/Bans.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Last Nickname` | 最后昵称 |
| `Reason` | 原因 |
| `Duration` | 时长 |
| `Created` | 创建时间 |
| `By` | 操作人 |
| `Ban removed` | 已移除封禁 |
| `No server selected` | 未选择服务器 |
| `Ban added` | 已添加封禁 |
| `Failed to add ban` | 添加封禁失败 |
| `Bans` | 封禁 |
| `Add Ban` | 添加封禁 |
| `Search bans...` | 搜索封禁... |
| `Ban Type` | 封禁类型 |
| `IP Address` | IP 地址 |
| `Name (Regex)` | 名称（正则） |
| `Unique ID` | 唯一 ID |
| `Value` | 值 |
| `Ban reason` | 封禁原因 |
| `1 Hour` | 1 小时 |
| `1 Day` | 1 天 |
| `1 Week` | 1 周 |
| `30 Days` | 30 天 |
| `Permanent` | 永久 |
| `Cancel` | 取消 |

## `packages/frontend/src/pages/BotEditor.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `TS Event` | TS 事件 |
| `Cron Timer` | Cron 定时器 |
| `Chat Command` | 聊天命令 |
| `Send Message` | 发送消息 |
| `Poke Client` | 戳一戳客户端 |
| `Kick Client` | 踢出客户端 |
| `Ban Client` | 封禁客户端 |
| `Move Client` | 移动客户端 |
| `Create Channel` | 创建频道 |
| `Edit Channel` | 编辑频道 |
| `Delete Channel` | 删除频道 |
| `Add to Group` | 加入服务器组 |
| `Remove from Group` | 移出服务器组 |
| `HTTP Request` | HTTP 请求 |
| `Voice Play` | 语音播放 |
| `Voice Stop` | 停止播放 |
| `Voice Join` | 加入语音频道 |
| `Voice Leave` | 离开语音频道 |
| `Voice Volume` | 语音音量 |
| `Voice Pause/Resume` | 语音暂停/继续 |
| `Voice Skip` | 语音跳过 |
| `Voice Seek` | 语音定位 |
| `Voice TTS` | 语音合成 TTS |
| `AFK Mover` | AFK 移动 |
| `Idle Kicker` | 闲置踢出 |
| `Poke Group` | 戳一戳组 |
| `Rank Check` | 等级检查 |
| `Temp Cleanup` | 临时频道清理 |
| `Animated Channel` | 动态频道 |
| `Condition` | 条件 |
| `Delay` | 延迟 |
| `Set Variable` | 设置变量 |
| `Log` | 日志 |
| `Generate Code` | 生成代码 |
| `Triggers` | 触发器 |
| `Actions` | 动作 |
| `Voice` | 语音 |
| `Smart Actions` | 智能动作 |
| `Logic` | 逻辑 |
| `Flow saved` | 流程已保存 |
| `Failed to save flow` | 保存流程失败 |
| `Placeholder Reference` | 占位符参考 |
| `Input: ${port}` | 输入：${port} |
| `Output: ${port}` | 输出：${port} |
| `Node Properties` | 节点属性 |
| `Label` | 标签 |
| `Type` | 类型 |
| `CONFIGURATION` | 配置 |
| `Event Name` | 事件名称 |
| `Select event...` | 选择事件... |
| `Client Enter` | 客户端进入 |
| `Client Leave` | 客户端离开 |
| `Text Message` | 文本消息 |
| `Client Moved` | 客户端切换频道 |
| `Server Edited` | 服务器已编辑 |
| `Channel Desc Changed` | 频道描述变更 |
| `Cron Expression` | Cron 表达式 |
| `Timezone` | 时区 |
| `Webhook Path` | Webhook 路径 |
| `HTTP Method` | HTTP 方法 |
| `Secret (optional)` | 密钥（可选） |
| `Leave empty for no auth` | 留空表示不校验 |
| `Validated via X-Webhook-Secret header or ?secret= query param` | 通过 X-Webhook-Secret 请求头或 ?secret= 查询参数校验 |
| `Command` | 命令 |
| `Listen Channel ID (optional)` | 监听频道 ID（可选） |
| `Target Mode` | 目标模式 |
| `Client` | 客户端 |
| `Channel` | 频道 |
| `Server` | 服务器 |
| `Channel ID` | 频道 ID |
| `Client ID` | 客户端 ID |
| `Channel ID or {{event.ctid}}` | 频道 ID 或 {{event.ctid}} |
| `Client ID or {{event.clid}}` | 客户端 ID 或 {{event.clid}} |
| `Message` | 消息 |
| `Dies ist die HelpList:\n\n!create - erstellt einen Channel\n!delete - löscht deinen Channel\n!help - zeigt diese Liste` | 这里是帮助列表：\n\n!create - 创建一个频道\n!delete - 删除你的频道\n!help - 显示此列表 |
| `Kick From` | 踢出范围 |
| `Reason` | 原因 |
| `Kicked by bot` | 被机器人踢出 |
| `Duration (seconds, 0=permanent)` | 时长（秒，0 表示永久） |
| `Banned by bot` | 被机器人封禁 |
| `Target Channel ID (or template)` | 目标频道 ID（或模板） |
| `94 or {{temp.lastCreatedChannelId}}` | 94 或 {{temp.lastCreatedChannelId}} |
| `Hey {{event.client_nickname}}!` | 嘿 {{event.client_nickname}}！ |
| `Channel Name` | 频道名称 |
| `Parent Channel ID` | 父频道 ID |
| `Channel Password (optional)` | 频道密码（可选） |
| `secret or {{temp.channelPassword}}` | 密码 或 {{temp.channelPassword}} |
| `Temporary` | 临时频道 |
| `Permanent` | 永久 |
| `Temporary` | 临时 |
| `Channel Topic` | 频道主题 |
| `Optional` | 可选 |
| `Channel Description` | 频道描述 |
| `Force Delete` | 强制删除 |
| `No` | 否 |
| `Yes (delete sub-channels)` | 是（同时删除子频道） |
| `Server Group ID` | 服务器组 ID |
| `Store As (temp variable)` | 存储为（临时变量） |
| `Method` | 请求方法 |
| `Body (JSON)` | 请求体（JSON） |
| `Headers (JSON)` | 请求头（JSON） |
| `AFK Channel ID` | AFK 频道 ID |
| `Idle Threshold (seconds)` | 闲置阈值（秒） |
| `Exempt Group IDs (comma-separated)` | 豁免组 ID（逗号分隔） |
| `Kick Reason` | 踢出原因 |
| `Idle timeout` | 闲置超时 |
| `Support needed!` | 需要支持！ |
| `Ranks (JSON)` | 等级规则（JSON） |
| `Protected Channel IDs (comma-separated)` | 受保护频道 ID（逗号分隔） |
| `Channels under the parent that should NOT be deleted (e.g. the lobby)` | 父频道下不应被删除的频道（例如大厅） |
| `Display Text` | 显示文本 |
| `Welcome to MyServer` | 欢迎来到我的服务器 |
| `Animation Style` | 动画样式 |
| `Scroll Left (Marquee)` | 向左滚动（跑马灯） |
| `Typewriter` | 打字机 |
| `Bounce` | 弹跳 |
| `Blink` | 闪烁 |
| `Wave (Decorative)` | 波浪（装饰） |
| `Alternate Case` | 大小写交替 |
| `Speed` | 速度 |
| `Insane (0.25s)` | 疯狂（0.25 秒） |
| `Ultra (0.5s)` | 极快（0.5 秒） |
| `Very Fast (1s)` | 很快（1 秒） |
| `Fast (2s)` | 快速（2 秒） |
| `Medium (3s)` | 中速（3 秒） |
| `Slow (5s)` | 慢速（5 秒） |
| `Prefix` | 前缀 |
| `TS3 channel name prefix (e.g. [cspacer] for centered spacer)` | TS3 频道名前缀（例如 [cspacer] 用于居中占位） |
| `Bot ID` | 机器人 ID |
| `1 or {{var.botId}}` | 1 或 {{var.botId}} |
| `Song ID` | 歌曲 ID |
| `Song ID to play` | 要播放的歌曲 ID |
| `Playlist ID (alternative)` | 播放列表 ID（备选） |
| `Load playlist instead` | 改为加载播放列表 |
| `Volume (0-100)` | 音量（0-100） |
| `50 or {{event.volume}}` | 50 或 {{event.volume}} |
| `Action` | 操作 |
| `Pause` | 暂停 |
| `Resume` | 继续播放 |
| `Toggle` | 切换 |
| `Direction` | 方向 |
| `Next` | 下一首 |
| `Previous` | 上一首 |
| `Position (seconds)` | 位置（秒） |
| `Text` | 文本 |
| `Hello {{event.client_nickname}}` | 你好 {{event.client_nickname}} |
| `Language (optional)` | 语言（可选） |
| `TTS engine not yet configured — placeholder only` | TTS 引擎尚未配置——仅为占位 |
| `Expression` | 表达式 |
| `True → green output, False → red output` | 真 → 绿色输出，假 → 红色输出 |
| `Delay (ms)` | 延迟（毫秒） |
| `Variable Name` | 变量名 |
| `Value (Expression)` | 值（表达式） |
| `Length` | 长度 |
| `Store As` | 存储为 |
| `Characters` | 字符类型 |
| `Digits only` | 仅数字 |
| `Alphanumeric` | 字母与数字 |
| `Log Level` | 日志级别 |
| `Debug` | 调试 |
| `Info` | 信息 |
| `Warning` | 警告 |
| `Error` | 错误 |
| `Client joined: {{event.client_nickname}}` | 客户端已加入：{{event.client_nickname}} |
| `CONNECTIONS` | 连线 |
| `No connections` | 暂无连线 |

## `packages/frontend/src/pages/BotList.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Please select a server first` | 请先选择服务器 |
| `Bot created` | 机器人已创建 |
| `Failed to create bot` | 创建机器人失败 |
| `Bot Flows` | 机器人流程 |
| `From Template` | 从模板创建 |
| `New Bot` | 新建机器人 |
| `No bot flows yet` | 还没有机器人流程 |
| `Create your first automation flow to get started.` | 创建你的第一个自动化流程开始使用。 |
| `Bot enabled` | 机器人已启用 |
| `Bot disabled` | 机器人已停用 |
| `No description` | 暂无描述 |
| `Active` | 启用中 |
| `Inactive` | 已停用 |
| `New Bot Flow` | 新建机器人流程 |
| `Name` | 名称 |
| `My Automation` | 我的自动化 |
| `Description` | 描述 |
| `What does this bot do?` | 这个机器人做什么？ |
| `Bot '${name}' created from template` | 已从模板创建机器人「${name}」 |
| `${name}` | 已从模板创建机器人「${name}」 |
| `Failed to create bot from template` | 从模板创建机器人失败 |
| `Delete Bot?` | 删除机器人？ |
| `This will permanently delete this bot flow and all its execution history.` | 该操作将永久删除此机器人流程及其全部执行历史。 |
| `Bot deleted` | 机器人已删除 |

## `packages/frontend/src/pages/ChannelGroups.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `No server selected` | 未选择服务器 |
| `Channel Groups` | 频道组 |

## `packages/frontend/src/pages/Channels.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Away` | 离开 |
| `Muted` | 静音 |
| `No server selected` | 未选择服务器 |
| `Channel created` | 频道已创建 |
| `Failed to create channel` | 创建频道失败 |
| `Channel deleted` | 频道已删除 |
| `Failed to delete channel` | 删除频道失败 |
| `Channel updated` | 频道已更新 |
| `Failed to update channel` | 更新频道失败 |
| `Channel moved` | 频道已移动 |
| `Failed to move channel` | 移动频道失败 |
| `Channels` | 频道 |
| `Create Channel` | 创建频道 |
| `Channel Name` | 频道名称 |
| `New Channel` | 新建频道 |
| `Cancel` | 取消 |
| `Create` | 创建 |
| `Edit Channel` | 编辑频道 |
| `Topic` | 主题 |
| `Optional` | 可选 |
| `Password` | 密码 |
| `Leave empty to keep current` | 留空则保持当前值 |
| `Saving...` | 保存中... |
| `Delete Channel` | 确定要删除「${deleteTarget?.name}」吗？此操作无法撤销。 |
| `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.` | 确定要删除「${deleteTarget?.name}」吗？此操作无法撤销。 |
| `${deleteTarget?.name}` | 确定要删除「${deleteTarget?.name}」吗？此操作无法撤销。 |

## `packages/frontend/src/pages/Clients.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Nickname` | 昵称 |
| `Country` | 国家 |
| `Idle` | 空闲 |
| `Status` | 状态 |
| `Away` | 离开 |
| `Muted` | 已静音 |
| `Active` | 在线 |
| `Kicked by admin` | 被管理员踢出 |
| `Kicked ${c.client_nickname}` | 已踢出 ${c.client_nickname} |
| `Banned by admin` | 被管理员封禁 |
| `Banned ${c.client_nickname}` | 已封禁 ${c.client_nickname} |
| `No server selected` | 未选择服务器 |
| `Clients` | 客户端 |
| `Search clients...` | 搜索客户端... |
| `Message` | 消息 |
| `Hey!` | 嘿！ |
| `Cancel` | 取消 |
| `Poked ${pokeTarget.name}` | 已戳 ${pokeTarget.name} |

## `packages/frontend/src/pages/Complaints.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `From` | 来自 |
| `About` | 关于 |
| `Message` | 消息 |
| `When` | 时间 |
| `No server selected` | 未选择服务器 |
| `Complaints` | 投诉 |
| `Search complaints...` | 搜索投诉... |

## `packages/frontend/src/pages/Dashboard.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `No server selected` | 未选择服务器 |
| `Select a server connection from the header to view the dashboard.` | 请在页面顶部选择一个服务器连接以查看仪表盘。 |
| `Connection failed` | 连接失败 |
| `Could not connect to the TeamSpeak server. Check your connection settings.` | 无法连接到 TeamSpeak 服务器，请检查连接设置。 |
| `ONLINE` | 在线 |
| `Live Monitoring` | 实时监控 |
| `ACTIVE` | 监测中 |
| `Online Users` | 在线用户 |
| `of ${data.maxClients} slots` | 共 ${data.maxClients} 个名额 |
| `Channels` | 频道 |
| `Uptime` | 运行时长 |
| `Ping` | 延迟 |
| `Loss: ${(parseFloat(String(data.packetloss \|\| 0)) * 100).toFixed(2)}%` | 丢包：${(parseFloat(String(data.packetloss \|\| 0)) * 100).toFixed(2)}% |
| `Download` | 下载 |
| `Upload` | 上传 |
| `In:` | 入： |
| `Out:` | 出： |
| `Server Capacity` | 服务器容量 |
| `User Slots` | 用户名额 |
| `Server Version` | 服务器版本 |
| `Platform` | 平台 |

## `packages/frontend/src/pages/Files.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Directory created` | 目录已创建 |
| `Failed to create directory` | 创建目录失败 |
| `File deleted` | 文件已删除 |
| `Failed to delete file` | 删除文件失败 |
| `No server selected` | 未选择服务器 |
| `File Browser` | 文件浏览器 |
| `No channels` | 暂无频道 |
| `Select a channel to browse files` | 请选择一个频道以浏览文件 |
| `File Browser Unavailable` | 文件浏览器不可用 |
| `SSH credentials not configured` | 未配置 SSH 凭据 |
| `File browsing requires SSH access because the TeamSpeak WebQuery HTTP API does not support file transfer commands. Please configure SSH credentials (username & password) in the server settings.` | 文件浏览需要通过 SSH 访问，因为 TeamSpeak WebQuery HTTP API 不支持文件传输命令。请在服务器设置中配置 SSH 凭据（用户名和密码）。 |
| `Could not connect to TeamSpeak server via SSH. Please check the SSH credentials and port in server settings.` | 无法通过 SSH 连接到 TeamSpeak 服务器。请检查服务器设置中的 SSH 凭据和端口。 |
| `Failed to load files. Ensure SSH credentials are configured in server settings.` | 加载文件失败。请确认已在服务器设置中配置 SSH 凭据。 |
| `Name` | 名称 |
| `Size` | 大小 |
| `Modified` | 修改时间 |
| `Empty directory` | 空目录 |
| `No files in this directory.` | 此目录中没有文件。 |
| `Create Directory` | 创建目录 |
| `Directory Name` | 目录名称 |
| `New Folder` | 新建文件夹 |
| `Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.` | 确定要删除「${deleteTarget?.name}」吗？此操作无法撤销。 |
| `${deleteTarget?.name}` | 确定要删除「${deleteTarget?.name}」吗？此操作无法撤销。 |

## `packages/frontend/src/pages/Instance.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Instance settings updated` | 实例设置已更新 |
| `Failed to update instance settings` | 更新实例设置失败 |
| `No server selected` | 未选择服务器 |
| `Guest ServerQuery Group` | 访客 ServerQuery 组 |
| `Template Server Admin Group` | 模板服务器管理员组 |
| `Template Server Default Group` | 模板服务器默认组 |
| `Template Channel Default Group` | 模板频道默认组 |
| `Template Channel Admin Group` | 模板频道管理员组 |
| `File Transfer Port` | 文件传输端口 |
| `Flood Commands` | 泛洪命令数 |
| `Flood Time (sec)` | 泛洪时间（秒） |
| `Flood Ban Time (sec)` | 泛洪封禁时间（秒） |
| `Instance` | 实例 |
| `Version` | 版本 |
| `Build` | 构建号 |
| `Platform` | 平台 |
| `Host` | 主机 |
| `Uptime` | 运行时长 |
| `Bytes Sent` | 已发送字节 |
| `Bytes Received` | 已接收字节 |
| `Virtual Servers` | 虚拟服务器 |
| `Database` | 数据库 |
| `DB Plugin` | 数据库插件 |
| `FT Port` | 文件传输端口 |
| `Permissions Version` | 权限版本 |
| `Instance Settings` | 实例设置 |

## `packages/frontend/src/pages/Login.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `TeamSpeak 6 Manager` | TeamSpeak 6 管理器 |
| `Server Administration Panel` | 服务器管理面板 |
| `Sign in to continue` | 登录以继续 |
| `Username` | 用户名 |
| `Password` | 密码 |
| `Invalid credentials. Please try again.` | 用户名或密码错误，请重试。 |
| `Sign In` | 登录 |

## `packages/frontend/src/pages/Messages.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Message sent` | 消息已发送 |
| `From` | 发件人 |
| `Subject` | 主题 |
| `Date` | 日期 |
| `Status` | 状态 |
| `Read` | 已读 |
| `Unread` | 未读 |
| `Message deleted` | 消息已删除 |
| `No server selected` | 未选择服务器 |
| `Failed to send message` | 发送消息失败 |
| `Offline Messages` | 离线消息 |
| `Compose` | 撰写 |
| `Search messages...` | 搜索消息... |
| `Message` | 消息 |
| `From:` | 发件人： |
| `No content` | 无内容 |
| `Close` | 关闭 |
| `Compose Message` | 撰写消息 |
| `Recipient Client UID` | 收件客户端 UID |
| `Client unique ID` | 客户端唯一 ID |
| `Message subject` | 消息主题 |
| `Message body...` | 消息正文... |
| `Cancel` | 取消 |
| `Send` | 发送 |

## `packages/frontend/src/pages/MusicBots.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Player Widget` | 播放器小组件 |
| `LIVE` | 直播中 |
| `Bot stopped` | 机器人已停止 |
| `Bot started` | 机器人已启动 |
| `Failed to start bot` | 启动机器人失败 |
| `BBCode URL (for channel description)` | BBCode URL（用于频道描述） |
| `Copied!` | 已复制！ |
| `Copy` | 复制 |
| `JSON URL (for websites/integrations)` | JSON URL（用于网站/集成） |
| `Token` | 令牌 |
| `Play Music` | 播放音乐 |
| `Select a song or playlist to play on this bot.` | 选择要在此机器人上播放的歌曲或播放列表。 |
| `Server...` | 服务器... |
| `Filter songs...` | 筛选歌曲... |
| `No songs found. Upload songs in the Library tab first.` | 未找到歌曲。请先在「音乐库」标签页中上传歌曲。 |
| `No playlists. Create one in the Playlists tab.` | 暂无播放列表。请在「播放列表」标签页中创建一个。 |
| `No music requests found. Use !play in chat to build history.` | 暂无点歌记录。在聊天中使用 !play 可累积历史记录。 |
| `Close` | 关闭 |
| `Please select a server` | 请选择服务器 |
| `Music bot created` | 音乐机器人已创建 |
| `Failed to create bot` | 创建机器人失败 |
| `Bot updated` | 机器人已更新 |
| `Failed to update bot` | 更新机器人失败 |
| `No music bots yet` | 暂无音乐机器人 |
| `Create your first voice bot to play music on your TeamSpeak server.` | 创建你的第一个语音机器人，在你的 TeamSpeak 服务器上播放音乐。 |
| `Edit Music Bot` | 编辑音乐机器人 |
| `New Music Bot` | 新建音乐机器人 |
| `Name` | 名称 |
| `My Music Bot` | 我的音乐机器人 |
| `Server` | 服务器 |
| `Select server...` | 选择服务器... |
| `Voice Port` | 语音端口 |
| `Nickname` | 昵称 |
| `Server Password` | 服务器密码 |
| `Leave empty if none` | 没有则留空 |
| `Default Channel` | 默认频道 |
| `Channel name or ID (optional)` | 频道名称或 ID（可选） |
| `Channel Password` | 频道密码 |
| `Auto-start on server startup` | 服务器启动时自动启动 |
| `Cancel` | 取消 |
| `Save` | 保存 |
| `Create` | 创建 |
| `Delete Music Bot?` | 删除音乐机器人？ |
| `This will permanently delete this music bot and disconnect it from the server.` | 此操作将永久删除该音乐机器人，并将其从服务器断开。 |
| `Bot deleted` | 机器人已删除 |
| `Playing` | 正在播放 |
| `Failed to play song` | 播放歌曲失败 |
| `Playing URL` | 正在播放 URL |
| `Failed to play URL` | 播放 URL 失败 |
| `Added to queue` | 已加入队列 |
| `Failed to enqueue` | 加入队列失败 |
| `Playlist loaded` | 播放列表已加载 |
| `Failed to load playlist` | 加载播放列表失败 |
| `Uploaded: ${file.name}` | 已上传：${file.name} |
| `Failed to upload: ${file.name}` | 上传失败：${file.name} |
| `YouTube search failed` | YouTube 搜索失败 |
| `Download started` | 下载已开始 |
| `Download failed` | 下载失败 |
| `Failed to load URL info` | 加载 URL 信息失败 |
| `Downloading 0/${urls.length}...` | 正在下载 0/${urls.length}... |
| `Downloaded ${data.downloaded}/${data.total} songs` | 已下载 ${data.downloaded}/${data.total} 首歌曲 |
| `${data.errors.length} failed` | ${data.errors.length} 个失败 |
| `Batch download failed` | 批量下载失败 |
| `Select a server` | 选择服务器 |
| `Choose a server to manage its music library.` | 选择一个服务器以管理其音乐库。 |
| `Uploading...` | 上传中... |
| `Upload` | 上传 |
| `Paste YouTube URL or Playlist URL...` | 粘贴 YouTube 视频 URL 或播放列表 URL... |
| `Playlist (${urlInfo.items.length} videos)` | 播放列表（${urlInfo.items.length} 个视频） |
| `Single Video` | 单个视频 |
| `Downloading...` | 下载中... |
| `Search YouTube...` | 搜索 YouTube... |
| `No songs yet` | 暂无歌曲 |
| `Upload audio files or download from YouTube to build your library.` | 上传音频文件或从 YouTube 下载，以构建你的音乐库。 |
| `Title` | 标题 |
| `Duration` | 时长 |
| `Source` | 来源 |
| `Size` | 大小 |
| `Delete Song?` | 删除歌曲？ |
| `This will permanently remove this song from the library.` | 此操作将从音乐库中永久移除该歌曲。 |
| `Song deleted` | 歌曲已删除 |
| `Playlist created` | 播放列表已创建 |
| `Failed to create playlist` | 创建播放列表失败 |
| `No playlists` | 暂无播放列表 |
| `Create a playlist to organize your songs.` | 创建一个播放列表来整理你的歌曲。 |
| `No songs in this playlist` | 此播放列表暂无歌曲 |
| `Song removed` | 歌曲已移除 |
| `New Playlist` | 新建播放列表 |
| `My Playlist` | 我的播放列表 |
| `Add Songs to Playlist` | 添加歌曲到播放列表 |
| `No songs available. Upload songs to the library first.` | 没有可用的歌曲。请先向音乐库上传歌曲。 |
| `Song added` | 歌曲已添加 |
| `Done` | 完成 |
| `Delete Playlist?` | 删除播放列表？ |
| `This will permanently delete this playlist.` | 此操作将永久删除该播放列表。 |
| `Playlist deleted` | 播放列表已删除 |
| `Station added` | 电台已添加 |
| `Failed to add station` | 添加电台失败 |
| `Added: ${preset.name}` | 已添加：${preset.name} |
| `Failed to add: ${preset.name}` | 添加失败：${preset.name} |
| `Select a running bot first` | 请先选择一个正在运行的机器人 |
| `Playing radio` | 正在播放电台 |
| `Failed to play radio` | 播放电台失败 |
| `Choose a server to manage radio stations.` | 选择一个服务器以管理电台。 |
| `Play on:` | 播放于： |
| `No running bots` | 没有正在运行的机器人 |
| `Select bot...` | 选择机器人... |
| `Start a music bot first to play radio stations.` | 请先启动一个音乐机器人，然后再播放电台。 |
| `No radio stations` | 暂无电台 |
| `Add stations manually or from presets to start streaming.` | 手动添加电台或从预设中添加，即可开始串流。 |
| `Add Radio Station` | 添加电台 |
| `Add a custom internet radio station by providing its stream URL.` | 提供串流 URL 以添加自定义网络电台。 |
| `Station name` | 电台名称 |
| `Stream URL` | 串流 URL |
| `Genre (optional)` | 流派（可选） |
| `Pop, Rock, Electronic...` | 流行、摇滚、电子... |
| `Radio Presets` | 电台预设 |
| `Add popular radio stations with one click.` | 一键添加热门电台。 |
| `No presets available.` | 暂无可用预设。 |
| `Delete Radio Station?` | 删除电台？ |
| `This will remove this station from your list.` | 此操作将从列表中移除该电台。 |
| `Station removed` | 电台已移除 |
| `No bots available` | 暂无可用机器人 |
| `Create a music bot first, then use it for video streaming.` | 请先创建一个音乐机器人，然后再用它进行视频流传输。 |
| `Select Bot:` | 选择机器人： |
| `Choose a bot...` | 选择一个机器人... |
| `Select a bot to manage video streaming.` | 选择一个机器人以管理视频流传输。 |
| `Bot:` | 机器人： |
| `Select bot` | 选择机器人 |
| `Select a bot to manage its queue` | 选择一个机器人以管理其队列 |
| `Queue is empty` | 队列为空 |
| `Click to play` | 点击播放 |
| `Move up` | 上移 |
| `Move down` | 下移 |
| `Remove from queue` | 从队列中移除 |
| `Music Bots` | 音乐机器人 |
| `Bots` | 机器人 |
| `Queue` | 队列 |
| `Video` | 视频 |
| `Library` | 音乐库 |
| `Playlists` | 播放列表 |
| `Radio` | 电台 |

## `packages/frontend/src/pages/MusicRequests.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `No server selected` | 未选择服务器 |
| `No music requests yet` | 暂无点歌记录 |
| `When users request songs using the !play command, they will appear here as a history log.` | 当用户使用 !play 命令点歌后，记录会作为历史日志显示在这里。 |

## `packages/frontend/src/pages/NotFound.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Page Not Found` | 页面未找到 |

## `packages/frontend/src/pages/Permissions.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Virtual Server` | 虚拟服务器 |
| `Server Instance` | 服务器实例 |
| `Channel` | 频道 |
| `Client` | 客户端 |
| `Group` | 组 |
| `File Transfer` | 文件传输 |
| `Channel (Values)` | 频道（数值型） |
| `Group (Values)` | 组（数值型） |
| `Client (Values)` | 客户端（数值型） |
| `File Transfer (Values)` | 文件传输（数值型） |
| `Limits` | 限制 |
| `Needed Powers` | 所需权限值 |
| `Server Groups` | 服务器组 |
| `Channel Groups` | 频道组 |
| `Permissions saved` | 权限已保存 |
| `Failed to save permissions` | 保存权限失败 |
| `No server selected` | 未选择服务器 |
| `Permissions` | 权限 |
| `No entities found` | 未找到对象 |
| `Select an entity` | 选择一个对象 |
| `Search permissions...` | 搜索权限... |
| `Select an entity from the left panel` | 从左侧面板选择一个对象 |
| `Permission` | 权限 |
| `Value` | 值 |
| `Skip` | 跳过 |
| `Negate` | 取反 |
| `Remove permission` | 移除权限 |
| `modified` | 已修改 |
| `No permissions match your search` | 没有匹配搜索的权限 |

## `packages/frontend/src/pages/ServerGroups.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `No server selected` | 未选择服务器 |
| `Server Groups` | 服务器组 |
| `Select a group to view its members` | 选择一个组以查看其成员 |
| `No members in this group` | 该组暂无成员 |
| `Create Server Group` | 创建服务器组 |
| `Group Name` | 组名称 |
| `New Group` | 新建组 |
| `Delete Server Group` | 删除「${deleteTarget?.name}」？ |
| `Delete "${deleteTarget?.name}"?` | 删除「${deleteTarget?.name}」？ |
| `${deleteTarget?.name}` | 删除「${deleteTarget?.name}」？ |
| `Delete` | 删除「${deleteTarget?.name}」？ |
| `Group deleted` | 删除「${deleteTarget?.name}」？ |

## `packages/frontend/src/pages/ServerLogs.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `No server selected` | 未选择服务器 |
| `Server Logs` | 服务器日志 |
| `Filter logs...` | 筛选日志... |
| `All Levels` | 全部级别 |
| `Error` | 错误 |
| `Warning` | 警告 |
| `Info` | 信息 |
| `Debug` | 调试 |
| `50 lines` | 50 行 |
| `100 lines` | 100 行 |
| `250 lines` | 250 行 |
| `500 lines` | 500 行 |
| `No log entries found.` | 未找到日志记录。 |

## `packages/frontend/src/pages/Settings.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Settings` | 设置 |
| `Connections` | 连接 |
| `Account` | 账户 |
| `Users` | 用户 |
| `New password must be at least 6 characters` | 新密码长度至少为 6 个字符 |
| `Passwords do not match` | 两次输入的密码不一致 |
| `Password changed successfully` | 密码修改成功 |
| `Failed to change password` | 修改密码失败 |
| `Change Password` | 修改密码 |
| `Current Password` | 当前密码 |
| `Enter current password` | 请输入当前密码 |
| `New Password` | 新密码 |
| `Min. 6 characters` | 至少 6 个字符 |
| `Confirm New Password` | 确认新密码 |
| `Repeat new password` | 请再次输入新密码 |
| `Changing...` | 修改中... |
| `Connection updated` | 连接已更新 |
| `Failed to update` | 更新失败 |
| `Connection added` | 连接已添加 |
| `Failed to create` | 创建失败 |
| `Manage TeamSpeak server connections` | 管理 TeamSpeak 服务器连接 |
| `Add Connection` | 添加连接 |
| `Enabled` | 已启用 |
| `Disabled` | 已禁用 |
| `Host` | 主机 |
| `Protocol` | 协议 |
| `Connection successful` | 连接成功 |
| `Connection failed` | 连接失败 |
| `Edit Connection` | 编辑连接 |
| `Name` | 名称 |
| `My TS Server` | 我的 TS 服务器 |
| `WebQuery Port` | WebQuery 端口 |
| `API Key` | API 密钥 |
| `(unchanged — enter new key to update)` | （未修改，输入新密钥以更新） |
| `WebQuery API Key` | WebQuery API 密钥 |
| `Use HTTPS` | 使用 HTTPS |
| `SSH Port` | SSH 端口 |
| `SSH User` | SSH 用户 |
| `SSH Password` | SSH 密码 |
| `Cancel` | 取消 |
| `Update` | 更新 |
| `Add` | 添加 |
| `Delete Connection?` | 删除连接？ |
| `This will remove the server connection. Bots linked to this server will stop working.` | 此操作将移除该服务器连接。关联到此服务器的机器人将停止工作。 |
| `Connection deleted` | 连接已删除 |
| `User created` | 用户已创建 |
| `Failed to create user` | 创建用户失败 |
| `Role updated` | 角色已更新 |
| `Failed to update role` | 更新角色失败 |
| `User enabled` | 用户已启用 |
| `User disabled` | 用户已禁用 |
| `Failed to update status` | 更新状态失败 |
| `Password must be at least 6 characters` | 密码长度至少为 6 个字符 |
| `Password reset successfully` | 密码重置成功 |
| `Failed to reset password` | 重置密码失败 |
| `Manage webapp users and roles` | 管理 Web 应用用户与角色 |
| `Add User` | 添加用户 |
| `Username` | 用户名 |
| `Display Name` | 显示名称 |
| `Role` | 角色 |
| `Status` | 状态 |
| `Actions` | 操作 |
| `Admin` | 管理员 |
| `Viewer` | 查看者 |
| `Reset Password` | 重置密码 |
| `John Doe` | 张三 |
| `Password` | 密码 |
| `Create` | 创建 |
| `Resetting...` | 重置中... |
| `Delete User?` | 删除用户？ |
| `This user will be permanently deleted.` | 该用户将被永久删除。 |
| `User deleted` | 用户已删除 |
| `Cookie file uploaded` | Cookie 文件已上传 |
| `Failed to upload cookie file` | 上传 Cookie 文件失败 |
| `Cookies saved` | Cookie 已保存 |
| `Failed to save cookies` | 保存 Cookie 失败 |
| `Cookie file removed` | Cookie 文件已移除 |
| `Failed to remove cookies` | 移除 Cookie 失败 |
| `Loading...` | 加载中... |
| `Cookies active (${formatSize(status.size)})` | Cookie 已生效（${formatSize(status.size)}） |
| `No cookies configured` | 未配置 Cookie |
| `Uploading...` | 上传中... |
| `Upload cookies.txt` | 上传 cookies.txt |
| `Saving...` | 保存中... |
| `Save` | 保存 |

## `packages/frontend/src/pages/SetupPage.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Passwords do not match` | 两次输入的密码不一致 |
| `Setup failed` | 初始化失败 |
| `Initial Setup` | 初始设置 |
| `Create your administrator account` | 创建您的管理员账户 |
| `Username` | 用户名 |
| `Display Name` | 显示名称 |
| `Administrator` | 管理员 |
| `Password` | 密码 |
| `Min. 8 chars, uppercase, lowercase, digit` | 至少 8 位，含大小写字母和数字 |
| `Confirm Password` | 确认密码 |
| `Repeat password` | 再次输入密码 |
| `Create Admin Account` | 创建管理员账户 |

## `packages/frontend/src/pages/Tokens.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `Token` | 令牌 |
| `Copied` | 已复制 |
| `Type` | 类型 |
| `Server Group` | 服务器组 |
| `Channel Group` | 频道组 |
| `Group ID` | 组 ID |
| `Description` | 描述 |
| `Token deleted` | 令牌已删除 |
| `No server selected` | 未选择服务器 |
| `Privilege Keys` | 权限密钥 |
| `Search tokens...` | 搜索令牌... |

## `packages/frontend/src/pages/VirtualServers.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `No server selected` | 未选择服务器 |
| `Server started` | 服务器已启动 |
| `Failed to start server` | 启动服务器失败 |
| `Server stopped` | 服务器已停止 |
| `Failed to stop server` | 停止服务器失败 |
| `Virtual Servers` | 虚拟服务器 |

## `packages/frontend/src/pages/WidgetPage.tsx`

| 英文原文 | 中文译文 |
|---|---|
| `TS Server Widget` | TS 服务器小组件 |

---

## 重新生成

清单基准是 `upstream-base` 引用，即「上一次与上游对齐时的原始英文版本」。

首次生成（`upstream-base` 尚未建立）时用默认的 `HEAD`：

```bash
python scripts/gen-i18n-inventory.py
```

同步上游后，把基准指到 `upstream-base` 再跑一次即可得到全量对照：

```bash
I18N_BASE=upstream-base python scripts/gen-i18n-inventory.py
```

PowerShell：`$env:I18N_BASE="upstream-base"; python scripts/gen-i18n-inventory.py`
