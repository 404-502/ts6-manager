# 中文本地化术语表（TS6 Manager Web UI）

本文件是本次「Web 界面全量中文翻译」的统一术语与规则来源。所有参与翻译的人必须先读本文件，
严格按本表用词，保证全站用词一致。

## 一、总原则

1. **只改用户可见文案**：JSX 文本节点、`placeholder` / `title` / `aria-label` / `label` 等展示属性、
   `toast.*()` 的消息、`EmptyState` 的 `title`/`description`、确认框文案、`document.title`。
2. **绝对不要改动**（改了会破坏功能）：
   - `className`、样式值、Tailwind 类名
   - `key=`、`id=`、`value=`（下拉框/枚举值）、`name=`、`htmlFor=`
   - 路由 path、API 路径、查询参数、字段名（如 `client_nickname`、`virtualserver_id`）
   - 节点 `type`、模板 `id`、配置 `key`、`flowDataFactory` 里传给后端的数据
   - TypeScript 类型、枚举、`switch/case` 判据、`includes()`/`===` 比较用的字符串
   - 占位符语法 `{xxx}`、`{{xxx}}`、`$xxx`、正则表达式、cron 表达式
   - `import`/`export`、注释结构（可保留英文注释，不必翻译）
3. 不改代码结构、不重排 import、不调整缩进；仅做字符串替换（edit 工具精确替换）。
4. 标点用中文全角标点（，。：；？！）与中文引号「」或 ""；句末不强行加句号（短标签不加）。
5. 专有名词保持原文：TeamSpeak、TS3/TS6、TS6 Manager、YouTube、WebQuery、Webhook、WebRTC、
   Docker、SSH、BBCode、PNG、SVG、JSON、HTTP、API、URL、UID、FPS、cron、TTS、yt-dlp、
   时区名（Europe/Berlin 等）。
6. 英文全大写状态词尽量保留原文（ONLINE / LIVE / ACTIVE / CONFIGURATION 等），
   或按语境给出中文；同一页面内保持一致。
7. 不要翻译 `docs/`、`README.md` 或其他文档、`console.log` 调试输出、后端日志。

## 二、固定术语对照

| English | 中文 |
| --- | --- |
| Dashboard | 仪表盘 |
| Overview | 概览 |
| Management | 管理 |
| Security | 安全 |
| Content | 内容 |
| System | 系统 |
| Automation | 自动化 |
| Virtual Server | 虚拟服务器 |
| Server Instance | 服务器实例 |
| Instance | 实例 |
| Channel | 频道 |
| Client | 客户端 |
| Server Group | 服务器组 |
| Channel Group | 频道组 |
| Permission | 权限 |
| Privilege Key | 权限密钥 |
| Token | 令牌 |
| Ban | 封禁 |
| Complaint | 投诉 |
| Offline Message | 离线消息 |
| Server Log | 服务器日志 |
| File Browser | 文件浏览器 |
| Widget | 小组件 |
| Bot Flow | 机器人流程 |
| Music Bot | 音乐机器人 |
| Playlist | 播放列表 |
| Queue | 队列 |
| Radio Station | 电台 |
| Music Library | 音乐库 |
| Volume | 音量 |
| Video Stream | 视频流 |
| Viewer | 观看者 |
| Uptime | 运行时长 |
| Bandwidth | 带宽 |
| Ping | 延迟 |
| Online Users | 在线用户 |
| Server Capacity | 服务器容量 |
| User Slots | 用户名额 |
| Role | 角色 |
| Admin | 管理员 |
| Username | 用户名 |
| Password | 密码 |
| Display Name | 显示名称 |
| Nickname | 昵称 |
| Unique ID | 唯一 ID |
| Trigger | 触发器 |
| Condition | 条件 |
| Variable | 变量 |
| Delay | 延迟 |
| Action | 操作 / 动作（节点语境用「动作」） |
| Node Properties | 节点属性 |
| Placeholder | 占位符 |
| Template | 模板 |
| Preset | 预设 |
| Sign In | 登录 |
| Log out | 退出登录 |
| Settings | 设置 |
| Save | 保存 |
| Cancel | 取消 |
| Delete | 删除 |
| Edit | 编辑 |
| Create | 创建 |
| Close | 关闭 |
| Confirm | 确认 |
| Back | 返回 |
| Next | 下一步 |
| Previous | 上一首 |
| Skip | 跳过 |
| Pause | 暂停 |
| Resume | 继续播放 |
| Search | 搜索 |
| Filter | 筛选 |
| Name | 名称 |
| Topic | 主题 |
| Description | 描述 |
| Type | 类型 |
| Status | 状态 |
| Actions | 操作 |
| Reason | 原因 |
| Duration | 时长 |
| Loading... | 加载中... |
| Processing... | 处理中... |
| Saving... | 保存中... |
| No data | 暂无数据 |
| Collapse | 收起 |

## 三、区域与时间格式

- `index.html` 的 `<html lang="de">` 必须改为 `lang="zh-CN"`。
- 所有 `toLocaleTimeString('de-DE', ...)`、`toLocaleDateString('de-DE', ...)`、
  `toLocaleString('en-US', ...)` 等硬编码 locale 改为 `'zh-CN'`（仅前端展示处）。
- 页面标题、登录页副标题等按中文语境重写（例如 "Server Administration Panel" → 「服务器管理面板」）。

## 四、自检

翻译完成后，在仓库根目录运行：

```bash
pnpm --filter @ts6/frontend run typecheck
```

必须 0 error。随后用 grep 自查是否还有遗留英文文案：

```bash
cd packages/frontend/src && grep -rhoE '>[A-Za-z][^<>{}]{3,}<' --include='*.tsx' . | sort -u
```

剩余的应是品牌名、技术缩写或代码标识（如 `TS6`、`GET`），不应有完整英文句子。

## 五、执行结果（2026-10 完成）

共改动 64 个文件、约 1400 处文案：

- 前端 38 个文件：全部页面、布局、共享组件、`index.html`（`lang="zh-CN"`）。
- 后端 25 个文件：会通过 `res.json({ error })` 透传到前端 toast 的错误消息。
- 公共包 1 个文件：`packages/common/src/widget-themes.ts` 的 `WIDGET_THEME_LABELS`。
- locale：`de-DE` 全部改为 `zh-CN`；`date-fns` 引入 `zhCN`。

**特意保留英文的项**：
`TeamSpeak`、`TS6`、`TS3`、`SSH`、`API`、`HTTPS`/`HTTP`、`URL`、`WebQuery`、
`Cookie`、`YouTube`、`Get cookies.txt LOCALLY`、`iFrame`、`BBCode`、`SVG`、`PNG`、`HTML`、
`GET`/`POST`/`PUT`/`DELETE`、`FPS`/`Mbps`/`480p`、IANA 时区名（`Europe/Berlin` 等）、
`serveradmin`/`johndoe` 账号示例、Netscape cookie 文件模板、`[cspacer]` 频道名前缀、`!play` 命令。

**翻译时修复的两个真实 bug**：
1. `packages/frontend/src/pages/Permissions.tsx` 原用 `.replace(/s$/, '')` 去英文复数，中文会被误截
   （「服务器组」→「服务器」），已删除该 replace。
2. `packages/frontend/src/pages/Files.tsx:227` 原用英文原文 `'SSH credentials not configured'` 匹配后端错误，
   后端消息译成中文后该分支失效，已同步改为匹配中文串。

**不在翻译范围内**（按设计保留）：节点 `type`、模板 `id`、权限 `b_*`/`i_*` key、路由、API 字段名、
`className`、`localStorage` key、Cron 表达式、占位符语法 `{{...}}`。

