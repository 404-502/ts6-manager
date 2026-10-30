import { Clock, Users, Shield, Globe, Zap, MessageSquare, Moon, Timer, Megaphone, Award, FolderPlus, Eye, Webhook, Sparkles } from 'lucide-react';

export interface TemplateConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  placeholder?: string;
  defaultValue?: string;
  options?: { label: string; value: string }[];
  required?: boolean;
}

export interface BotTemplate {
  id: string;
  name: string;
  description: string;
  category: 'info-channels' | 'moderation' | 'automation' | 'integration';
  icon: React.ElementType;
  configFields: TemplateConfigField[];
  flowDataFactory: (config: Record<string, string>) => { nodes: any[]; edges: any[] };
}

let _id = 0;
const nid = () => `tpl_${++_id}`;
const eid = () => `tpl_e${_id}`;

function resetIds() { _id = 0; }

// Helper to build a simple linear flow
function makeNode(id: string, type: string, label: string, config: Record<string, any>, x: number, y: number) {
  return { id, type, label, config, x, y };
}
function makeEdge(id: string, source: string, target: string, sourcePort = 'out', targetPort = 'in') {
  return { id, source, sourcePort, target, targetPort };
}

export const BOT_TEMPLATES: BotTemplate[] = [
  // ===== INFO CHANNELS =====
  {
    id: 'clock-channel',
    name: '时钟频道',
    description: '每分钟用当前时间更新一次频道名称。',
    category: 'info-channels',
    icon: Clock,
    configFields: [
      { key: 'channelId', label: '频道 ID', type: 'number', placeholder: '42', required: true },
      { key: 'timezone', label: '时区', type: 'select', defaultValue: 'Europe/Berlin', options: [
        { label: 'Europe/Berlin (CET/CEST)', value: 'Europe/Berlin' },
        { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
        { label: 'Europe/Paris (CET/CEST)', value: 'Europe/Paris' },
        { label: 'Europe/Moscow (MSK)', value: 'Europe/Moscow' },
        { label: 'America/New_York (EST/EDT)', value: 'America/New_York' },
        { label: 'America/Chicago (CST/CDT)', value: 'America/Chicago' },
        { label: 'America/Los_Angeles (PST/PDT)', value: 'America/Los_Angeles' },
        { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
        { label: 'UTC', value: 'UTC' },
      ] },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_cron', '每分钟', { cron: '* * * * *', timezone: cfg.timezone || 'Europe/Berlin' }, 60, 80),
          makeNode(n2, 'action_channelEdit', '更新时钟', { channelId: cfg.channelId, channel_name: '[cspacer]{{time.time}}' }, 300, 80),
        ],
        edges: [makeEdge(eid(), n1, n2)],
      };
    },
  },
  {
    id: 'online-counter',
    name: '在线人数统计',
    description: '在频道名称中显示当前在线客户端数量。',
    category: 'info-channels',
    icon: Users,
    configFields: [
      { key: 'channelId', label: '频道 ID', type: 'number', placeholder: '43', required: true },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid(), n3 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_cron', '每分钟', { cron: '* * * * *' }, 60, 80),
          makeNode(n2, 'action_webquery', '获取服务器信息', { command: 'serverinfo', storeAs: 'server' }, 300, 80),
          makeNode(n3, 'action_channelEdit', '更新计数', { channelId: cfg.channelId, channel_name: '[cspacer]在线: {{temp.server.virtualserver_clientsonline}}/{{temp.server.virtualserver_maxclients}}' }, 540, 80),
        ],
        edges: [makeEdge(eid(), n1, n2), makeEdge(eid(), n2, n3)],
      };
    },
  },
  {
    id: 'server-stats',
    name: '服务器统计',
    description: '在三个信息频道中分别显示运行时长、在线客户端数和频道数量。',
    category: 'info-channels',
    icon: Eye,
    configFields: [
      { key: 'uptimeChannelId', label: '运行时长频道 ID', type: 'number', placeholder: '44', required: true },
      { key: 'clientsChannelId', label: '在线人数频道 ID', type: 'number', placeholder: '45', required: true },
      { key: 'channelCountChannelId', label: '频道数量频道 ID', type: 'number', placeholder: '46', required: true },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid(), n3 = nid(), n4 = nid(), n5 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_cron', '每 5 分钟', { cron: '*/5 * * * *' }, 60, 150),
          makeNode(n2, 'action_webquery', '获取服务器信息', { command: 'serverinfo', storeAs: 'server' }, 300, 150),
          makeNode(n3, 'action_channelEdit', '运行时长', { channelId: cfg.uptimeChannelId, channel_name: '[cspacer]运行时长: {{temp.server.virtualserver_uptime|uptime}}' }, 540, 60),
          makeNode(n4, 'action_channelEdit', '在线人数', { channelId: cfg.clientsChannelId, channel_name: '[cspacer]客户端: {{temp.server.virtualserver_clientsonline}}/{{temp.server.virtualserver_maxclients}}' }, 540, 150),
          makeNode(n5, 'action_channelEdit', '频道数量', { channelId: cfg.channelCountChannelId, channel_name: '[cspacer]频道: {{temp.server.virtualserver_channelsonline}}' }, 540, 240),
        ],
        edges: [
          makeEdge(eid(), n1, n2),
          makeEdge(eid(), n2, n3),
          makeEdge(eid(), n2, n4),
          makeEdge(eid(), n2, n5),
        ],
      };
    },
  },

  {
    id: 'animated-channel',
    name: '动态频道名称',
    description: '用滚动跑马灯、打字机、弹跳等视觉效果为频道名称添加动画，每 2-5 秒更新一次。',
    category: 'info-channels',
    icon: Sparkles,
    configFields: [
      { key: 'channelId', label: '频道 ID', type: 'number', placeholder: '42', required: true },
      { key: 'text', label: '显示文本', type: 'text', placeholder: '欢迎来到我的服务器', required: true },
      { key: 'style', label: '动画样式', type: 'select', defaultValue: 'scroll', options: [
        { label: '向左滚动（跑马灯）', value: 'scroll' },
        { label: '打字机', value: 'typewriter' },
        { label: '弹跳', value: 'bounce' },
        { label: '闪烁', value: 'blink' },
        { label: '波浪（装饰）', value: 'wave' },
        { label: '大小写交替', value: 'alternateCase' },
      ] },
      { key: 'intervalSeconds', label: '速度', type: 'select', defaultValue: '3', options: [
        { label: '慢速（5 秒）', value: '5' },
        { label: '中速（3 秒）', value: '3' },
        { label: '快速（2 秒）', value: '2' },
        { label: '很快（1 秒）', value: '1' },
        { label: '极快（0.5 秒）', value: '0.5' },
        { label: '疯狂（0.25 秒）', value: '0.25' },
      ] },
      { key: 'prefix', label: '频道名称前缀', type: 'text', placeholder: '[cspacer]', defaultValue: '[cspacer]' },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid();
      return {
        nodes: [
          makeNode(n1, 'action_animatedChannel', '动态频道', {
            channelId: cfg.channelId,
            text: cfg.text || '欢迎来到我的服务器',
            style: cfg.style || 'scroll',
            intervalSeconds: cfg.intervalSeconds || '3',
            prefix: cfg.prefix || '[cspacer]',
          }, 200, 100),
        ],
        edges: [],
      };
    },
  },

  // ===== AUTOMATION =====
  {
    id: 'welcome-message',
    name: '欢迎消息',
    description: '当客户端加入服务器时发送欢迎消息或戳一戳。',
    category: 'automation',
    icon: MessageSquare,
    configFields: [
      { key: 'message', label: '欢迎消息', type: 'text', placeholder: '欢迎 {{event.client_nickname}}！', required: true },
      { key: 'usePokeInstead', label: '发送方式', type: 'select', defaultValue: 'message', options: [{ label: '私聊消息', value: 'message' }, { label: '戳一戳', value: 'poke' }] },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid(), n3 = nid();
      const usePoke = cfg.usePokeInstead === 'poke';
      return {
        nodes: [
          makeNode(n1, 'trigger_event', '客户端进入', { eventName: 'notifycliententerview' }, 60, 80),
          makeNode(n2, 'condition', '是真人吗？', { expression: 'event.client_type == 0' }, 300, 80),
          usePoke
            ? makeNode(n3, 'action_poke', '欢迎戳一戳', { message: cfg.message || '欢迎！' }, 540, 40)
            : makeNode(n3, 'action_message', '欢迎消息', { targetMode: 'client', message: cfg.message || '欢迎！' }, 540, 40),
        ],
        edges: [
          makeEdge(eid(), n1, n2),
          makeEdge(eid(), n2, n3, 'true', 'in'),
        ],
      };
    },
  },
  {
    id: 'support-system',
    name: '支持系统',
    description: '当客户端进入支持频道时通知管理员。',
    category: 'automation',
    icon: Megaphone,
    configFields: [
      { key: 'supportChannelId', label: '支持频道 ID', type: 'number', placeholder: '15', required: true },
      { key: 'adminGroupId', label: '管理员组 ID', type: 'number', placeholder: '6', required: true },
      { key: 'message', label: '通知消息', type: 'text', placeholder: '{{event.client_nickname}} 需要支持！' },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid(), n3 = nid(), n4 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_event', '客户端切换频道', { eventName: 'notifyclientmoved' }, 60, 80),
          makeNode(n2, 'condition', '进入支持频道？', { expression: `event.ctid == ${cfg.supportChannelId}` }, 300, 80),
          makeNode(n3, 'action_webquery', '获取客户端信息', { command: 'clientinfo clid={{event.clid}}', storeAs: 'client' }, 540, 40),
          makeNode(n4, 'action_pokeGroup', '通知管理员', { groupId: cfg.adminGroupId, message: cfg.message || '{{temp.client.client_nickname}} 需要支持！' }, 780, 40),
        ],
        edges: [
          makeEdge(eid(), n1, n2),
          makeEdge(eid(), n2, n3, 'true', 'in'),
          makeEdge(eid(), n3, n4),
        ],
      };
    },
  },
  {
    id: 'temp-channel-creator',
    name: '临时频道创建器',
    description: '当客户端进入大厅频道时创建一个临时频道，并将其移入该频道。频道在空置后自动删除。',
    category: 'automation',
    icon: FolderPlus,
    configFields: [
      { key: 'lobbyChannelId', label: '大厅频道 ID', type: 'number', placeholder: '20', required: true },
      { key: 'parentChannelId', label: '父频道 ID', type: 'number', placeholder: '19', required: true },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid(), n3 = nid(), n4 = nid(), n5 = nid();
      const n6 = nid(), n7 = nid();
      return {
        nodes: [
          // Create channel when user joins lobby
          makeNode(n1, 'trigger_event', '客户端切换频道', { eventName: 'notifyclientmoved' }, 60, 80),
          makeNode(n2, 'condition', '进入大厅？', { expression: `event.ctid == ${cfg.lobbyChannelId}` }, 300, 80),
          makeNode(n3, 'action_webquery', '获取客户端信息', { command: 'clientinfo clid={{event.clid}}', storeAs: 'client' }, 540, 80),
          makeNode(n4, 'action_channelCreate', '创建频道', { channel_name: "{{temp.client.client_nickname}} 的频道", cpid: cfg.parentChannelId, channel_flag_semi_permanent: '1' }, 780, 80),
          makeNode(n5, 'action_move', '移动到频道', { cid: '{{temp.lastCreatedChannelId}}' }, 1020, 80),
          // Cron cleanup: delete empty channels under parent every minute
          makeNode(n6, 'trigger_cron', '清理定时器', { cron: '* * * * *' }, 60, 220),
          makeNode(n7, 'action_tempChannelCleanup', '删除空频道', { parentChannelId: cfg.parentChannelId, protectedChannelIds: cfg.lobbyChannelId }, 300, 220),
        ],
        edges: [
          makeEdge(eid(), n1, n2),
          makeEdge(eid(), n2, n3, 'true', 'in'),
          makeEdge(eid(), n3, n4),
          makeEdge(eid(), n4, n5),
          makeEdge(eid(), n6, n7),
        ],
      };
    },
  },
  {
    id: 'auto-rank',
    name: '自动等级',
    description: '根据累计在线时长自动分配服务器组。',
    category: 'automation',
    icon: Award,
    configFields: [
      { key: 'ranks', label: '等级规则（JSON）', type: 'text', placeholder: '[{"hours":10,"groupId":"7"},{"hours":50,"groupId":"8"}]', required: true },
      { key: 'pollInterval', label: '检查间隔', type: 'select', defaultValue: '*/5 * * * *', options: [{ label: '每 5 分钟', value: '*/5 * * * *' }, { label: '每 15 分钟', value: '*/15 * * * *' }, { label: '每小时', value: '0 * * * *' }] },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_cron', '等级定时器', { cron: cfg.pollInterval || '*/5 * * * *' }, 60, 80),
          makeNode(n2, 'action_rankCheck', '检查等级', { ranks: cfg.ranks || '[]' }, 300, 80),
        ],
        edges: [makeEdge(eid(), n1, n2)],
      };
    },
  },
  {
    id: 'last-seen-tracker',
    name: '最后在线记录',
    description: '在客户端断开连接时记录其最后在线时间戳。',
    category: 'automation',
    icon: Clock,
    configFields: [],
    flowDataFactory: () => {
      resetIds();
      const n1 = nid(), n2 = nid(), n3 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_event', '客户端离开', { eventName: 'notifyclientleftview' }, 60, 80),
          makeNode(n2, 'variable', '保存时间戳', { operation: 'set', name: 'lastseen_{{event.client_database_id}}', value: '{{time.timestamp}}' }, 300, 80),
          makeNode(n3, 'log', '记录离开', { level: 'info', message: '{{event.client_nickname}} 已离开（dbid={{event.client_database_id}}）' }, 540, 80),
        ],
        edges: [makeEdge(eid(), n1, n2), makeEdge(eid(), n2, n3)],
      };
    },
  },

  // ===== MODERATION =====
  {
    id: 'afk-mover',
    name: 'AFK 移动器',
    description: '在超过可配置的超时时间后，将闲置客户端移动到 AFK 频道。',
    category: 'moderation',
    icon: Moon,
    configFields: [
      { key: 'afkChannelId', label: 'AFK 频道 ID', type: 'number', placeholder: '10', required: true },
      { key: 'idleThresholdSeconds', label: '闲置阈值（秒）', type: 'number', placeholder: '300', required: true },
      { key: 'exemptGroupIds', label: '豁免组 ID（逗号分隔）', type: 'text', placeholder: '6,7' },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_cron', 'AFK 检查', { cron: '* * * * *' }, 60, 80),
          makeNode(n2, 'action_afkMover', '移动 AFK', { afkChannelId: cfg.afkChannelId, idleThresholdSeconds: cfg.idleThresholdSeconds || '300', exemptGroupIds: cfg.exemptGroupIds || '' }, 300, 80),
        ],
        edges: [makeEdge(eid(), n1, n2)],
      };
    },
  },
  {
    id: 'idle-kicker',
    name: '闲置踢出',
    description: '踢出闲置时间过长的客户端。',
    category: 'moderation',
    icon: Timer,
    configFields: [
      { key: 'idleThresholdSeconds', label: '闲置阈值（秒）', type: 'number', placeholder: '1800', required: true },
      { key: 'reason', label: '踢出原因', type: 'text', placeholder: '闲置超时' },
      { key: 'exemptGroupIds', label: '豁免组 ID（逗号分隔）', type: 'text', placeholder: '6,7' },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_cron', '闲置检查', { cron: '* * * * *' }, 60, 80),
          makeNode(n2, 'action_idleKicker', '踢出闲置', { idleThresholdSeconds: cfg.idleThresholdSeconds || '1800', reason: cfg.reason || '闲置超时', exemptGroupIds: cfg.exemptGroupIds || '' }, 300, 80),
        ],
        edges: [makeEdge(eid(), n1, n2)],
      };
    },
  },
  {
    id: 'bad-name-checker',
    name: '违禁昵称检查',
    description: '昵称中包含违禁词的客户端将被踢出。',
    category: 'moderation',
    icon: Shield,
    configFields: [
      { key: 'badWords', label: '违禁词（逗号分隔）', type: 'text', placeholder: 'admin,moderator,test', required: true },
      { key: 'reason', label: '踢出原因', type: 'text', placeholder: '违禁昵称' },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const words = (cfg.badWords || '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
      // Build expression: contains(lower(event.client_nickname),'word1') or contains(...)
      const expr = words.length > 0
        ? words.map(w => `contains(lower(event.client_nickname),'${w}')`).join(' or ')
        : "contains(lower(event.client_nickname),'admin')";

      const n1 = nid(), n2 = nid(), n3 = nid(), n4 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_event', '客户端进入', { eventName: 'notifycliententerview' }, 60, 80),
          makeNode(n2, 'condition', '是真人吗？', { expression: 'event.client_type == 0' }, 300, 80),
          makeNode(n3, 'condition', '昵称违禁？', { expression: expr }, 540, 40),
          makeNode(n4, 'action_kick', '踢出违禁昵称', { reasonid: '5', reason: cfg.reason || '昵称不符合规定' }, 780, 0),
        ],
        edges: [
          makeEdge(eid(), n1, n2),
          makeEdge(eid(), n2, n3, 'true', 'in'),
          makeEdge(eid(), n3, n4, 'true', 'in'),
        ],
      };
    },
  },
  {
    id: 'group-protector',
    name: '服务器组保护',
    description: '踢出拥有受保护组但缺少所需授权组的客户端。',
    category: 'moderation',
    icon: Shield,
    configFields: [
      { key: 'protectedGroupId', label: '受保护组 ID', type: 'number', placeholder: '8', required: true },
      { key: 'allowedGroupId', label: '授权组 ID', type: 'number', placeholder: '10', required: true },
      { key: 'action', label: '处理方式', type: 'select', defaultValue: 'kick', options: [{ label: '踢出', value: 'kick' }, { label: '移除组', value: 'remove' }] },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid(), n3 = nid(), n4 = nid();
      const actionNode = cfg.action === 'remove'
        ? makeNode(n4, 'action_groupRemove', '移除组', { groupId: cfg.protectedGroupId }, 780, 0)
        : makeNode(n4, 'action_kick', '踢出违规者', { reasonid: '5', reason: '不在允许的服务器组内' }, 780, 0);

      return {
        nodes: [
          makeNode(n1, 'trigger_event', '客户端进入', { eventName: 'notifycliententerview' }, 60, 80),
          makeNode(n2, 'condition', '拥有受保护组？', { expression: `contains(event.client_servergroups,'${cfg.protectedGroupId}')` }, 300, 80),
          makeNode(n3, 'condition', '缺少授权？', { expression: `contains(event.client_servergroups,'${cfg.allowedGroupId}') == 0` }, 540, 40),
          actionNode,
        ],
        edges: [
          makeEdge(eid(), n1, n2),
          makeEdge(eid(), n2, n3, 'true', 'in'),
          makeEdge(eid(), n3, n4, 'true', 'in'),
        ],
      };
    },
  },

  // ===== INTEGRATION =====
  {
    id: 'webhook-server-message',
    name: 'Webhook → 服务器消息',
    description: '接收 Webhook POST 请求，并把消息广播到 TeamSpeak 服务器。适用于监控告警、CI/CD 通知或 Discord 桥接。',
    category: 'integration',
    icon: Webhook,
    configFields: [
      { key: 'path', label: 'Webhook 路径', type: 'text', placeholder: 'server-notify', required: true },
      { key: 'secret', label: '密钥（可选）', type: 'text', placeholder: 'my-secret-key' },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_webhook', '接收 Webhook', { path: cfg.path || 'server-notify', method: 'POST', secret: cfg.secret || '' }, 60, 80),
          makeNode(n2, 'action_message', '广播消息', { targetMode: '3', message: '[Webhook] {{event.webhook_body}}' }, 340, 80),
        ],
        edges: [makeEdge(eid(), n1, n2)],
      };
    },
  },
  {
    id: 'webhook-group-assign',
    name: 'Webhook → 分配服务器组',
    description: '外部系统（例如网站验证）发送携带客户端数据库 ID 的 Webhook，以分配服务器组。用于网站到 TS3 的用户验证。',
    category: 'integration',
    icon: Webhook,
    configFields: [
      { key: 'path', label: 'Webhook 路径', type: 'text', placeholder: 'verify-user', required: true },
      { key: 'groupId', label: '要分配的服务器组 ID', type: 'text', placeholder: '42', required: true },
      { key: 'secret', label: '密钥（可选）', type: 'text', placeholder: 'my-secret-key' },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid(), n3 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_webhook', '验证 Webhook', { path: cfg.path || 'verify-user', method: 'POST', secret: cfg.secret || '' }, 60, 80),
          makeNode(n2, 'action_webquery', '加入组', { command: 'servergroupaddclient', params: { sgid: cfg.groupId, cldbid: '{{event.webhook_body.cldbid}}' } }, 340, 80),
          makeNode(n3, 'log', '记录结果', { level: 'info', message: '已为 cldbid {{event.webhook_body.cldbid}} 分配服务器组 {{groupId}}' }, 600, 80),
        ],
        edges: [makeEdge(eid(), n1, n2), makeEdge(eid(), n2, n3)],
      };
    },
  },
  {
    id: 'webhook-channel-rename',
    name: 'Webhook → 更新频道',
    description: '接收 Webhook 并更新频道名称。适用于外部状态展示，例如游戏服务器状态、直播状态或监控仪表盘。',
    category: 'integration',
    icon: Webhook,
    configFields: [
      { key: 'path', label: 'Webhook 路径', type: 'text', placeholder: 'update-status', required: true },
      { key: 'channelId', label: '要更新的频道 ID', type: 'text', placeholder: '42', required: true },
      { key: 'nameTemplate', label: '频道名称模板', type: 'text', placeholder: '[STATUS] {{event.webhook_body.status}}', required: true },
      { key: 'secret', label: '密钥（可选）', type: 'text', placeholder: 'my-secret-key' },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_webhook', '状态 Webhook', { path: cfg.path || 'update-status', method: 'POST', secret: cfg.secret || '' }, 60, 80),
          makeNode(n2, 'action_channelEdit', '更新频道', { channelId: cfg.channelId, params: { channel_name: cfg.nameTemplate || '[STATUS] {{event.webhook_body.status}}' } }, 340, 80),
        ],
        edges: [makeEdge(eid(), n1, n2)],
      };
    },
  },
  {
    id: 'anti-vpn',
    name: 'Anti-VPN 反代理',
    description: '通过 VPN 检测 API 校验接入的客户端，并对 VPN 用户执行踢出或封禁。',
    category: 'integration',
    icon: Globe,
    configFields: [
      { key: 'apiUrl', label: 'API URL（使用 {{ip}} 占位符）', type: 'text', placeholder: 'https://vpnapi.io/api/{{ip}}?key=YOUR_KEY', required: true },
      { key: 'action', label: '针对 VPN 的处理方式', type: 'select', defaultValue: 'kick', options: [{ label: '踢出', value: 'kick' }, { label: '封禁（1 小时）', value: 'ban' }] },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid(), n3 = nid(), n4 = nid(), n5 = nid();
      const url = (cfg.apiUrl || '').replace('{{ip}}', '{{event.connection_client_ip}}');
      const actionNode = cfg.action === 'ban'
        ? makeNode(n5, 'action_ban', '封禁 VPN', { time: 3600, reason: '检测到 VPN' }, 780, 0)
        : makeNode(n5, 'action_kick', '踢出 VPN', { reasonid: '5', reason: '检测到 VPN' }, 780, 0);

      return {
        nodes: [
          makeNode(n1, 'trigger_event', '客户端进入', { eventName: 'notifycliententerview' }, 60, 80),
          makeNode(n2, 'condition', '是真人吗？', { expression: 'event.client_type == 0' }, 300, 80),
          makeNode(n3, 'action_httpRequest', '校验 VPN API', { url, method: 'GET', storeAs: 'vpn' }, 540, 40),
          makeNode(n4, 'condition', '是 VPN 吗？', { expression: "temp.vpn.security.vpn == 1 or temp.vpn.security.proxy == 1" }, 540, 120),
          actionNode,
        ],
        edges: [
          makeEdge(eid(), n1, n2),
          makeEdge(eid(), n2, n3, 'true', 'in'),
          makeEdge(eid(), n3, n4),
          makeEdge(eid(), n4, n5, 'true', 'in'),
        ],
      };
    },
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: 'info-channels', label: '信息频道', description: '带实时数据的动态频道名称' },
  { id: 'moderation', label: '管理', description: '自动化管理与防护' },
  { id: 'automation', label: '自动化', description: '欢迎消息、临时频道、等级' },
  { id: 'integration', label: '集成', description: '外部 API 与 Webhook' },
] as const;
