import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ------------------------------------------------------------------ */
/*  Tiny helper: one placeholder row                                  */
/* ------------------------------------------------------------------ */
function P({ code, desc, example }: { code: string; desc: string; example?: string }) {
  return (
    <div className="py-1.5 grid grid-cols-[1fr_1.4fr_1.6fr] gap-2 items-start text-xs border-b border-border/40 last:border-0">
      <code className="text-[11px] font-mono text-emerald-400 break-all">{code}</code>
      <span className="text-muted-foreground">{desc}</span>
      {example ? (
        <code className="text-[10px] font-mono text-muted-foreground/70 bg-muted/40 rounded px-1.5 py-0.5 break-all">{example}</code>
      ) : <span />}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 mb-1.5 first:mt-0"><Badge variant="outline" className="text-[10px]">{children}</Badge></div>;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */
export function PlaceholderReference({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl !grid-rows-none !block p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="text-base">占位符参考</DialogTitle>
          <p className="text-xs text-muted-foreground">
            可在任意文本字段中使用 <code className="text-emerald-400">{'{{placeholder}}'}</code>，其值会在运行时解析。
          </p>
        </DialogHeader>

        <Tabs defaultValue="event" className="px-5 pb-5">
          <TabsList className="h-8 mb-3">
            <TabsTrigger value="event" className="text-xs px-2.5 h-6">事件</TabsTrigger>
            <TabsTrigger value="time" className="text-xs px-2.5 h-6">时间</TabsTrigger>
            <TabsTrigger value="var" className="text-xs px-2.5 h-6">变量</TabsTrigger>
            <TabsTrigger value="temp" className="text-xs px-2.5 h-6">临时变量</TabsTrigger>
            <TabsTrigger value="exec" className="text-xs px-2.5 h-6">执行</TabsTrigger>
            <TabsTrigger value="filter" className="text-xs px-2.5 h-6">过滤器</TabsTrigger>
            <TabsTrigger value="functions" className="text-xs px-2.5 h-6">函数</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[58vh]">
            {/* ========== EVENT ========== */}
            <TabsContent value="event" className="mt-0 pr-3">
              <p className="text-xs text-muted-foreground mb-2">
                来自触发 TS3 事件的字段。可用字段取决于事件类型。
              </p>

              <SectionHeader>客户端已连接 &mdash; notifycliententerview</SectionHeader>
              <P code="{{event.clid}}" desc="客户端 ID" example='将客户端 #{{event.clid}} 移动到频道' />
              <P code="{{event.client_nickname}}" desc="昵称" example='欢迎 {{event.client_nickname}}！' />
              <P code="{{event.client_database_id}}" desc="数据库 ID" example='DB-ID: {{event.client_database_id}}' />
              <P code="{{event.client_unique_identifier}}" desc="唯一 ID（UID）" example='UID: {{event.client_unique_identifier}}' />
              <P code="{{event.client_type}}" desc="类型（0=用户，1=查询）" example='Condition: event.client_type == 0' />
              <P code="{{event.client_servergroups}}" desc="服务器组 ID（逗号分隔）" example="contains(event.client_servergroups, '6')" />
              <P code="{{event.connection_client_ip}}" desc="IP 地址" example='VPN 校验：https://api.vpn.io/{{event.connection_client_ip}}' />
              <P code="{{event.cid}}" desc="客户端所加入的频道" example='Condition: event.cid == 42' />

              <SectionHeader>客户端已断开 &mdash; notifyclientleftview</SectionHeader>
              <P code="{{event.clid}}" desc="客户端 ID" />
              <P code="{{event.cfid}}" desc="客户端原先所在的频道" />
              <P code="{{event.reasonid}}" desc="原因（3=断线，5=踢出，6=封禁，8=离开）" example='Condition: event.reasonid == 5' />
              <P code="{{event.reasonmsg}}" desc="原因说明" example='已被踢出：{{event.reasonmsg}}' />

              <SectionHeader>客户端已移动 &mdash; notifyclientmoved</SectionHeader>
              <P code="{{event.clid}}" desc="客户端 ID" />
              <P code="{{event.ctid}}" desc="目标频道 ID" example='Condition: event.ctid == 10' />
              <P code="{{event.cfid}}" desc="来源频道 ID" />
              <P code="{{event.reasonid}}" desc="原因（0=自行移动，1=被管理员移动）" />

              <SectionHeader>文本消息 &mdash; notifytextmessage</SectionHeader>
              <P code="{{event.clid}}" desc="发送者客户端 ID" />
              <P code="{{event.client_nickname}}" desc="发送者昵称" />
              <P code="{{event.msg}}" desc="消息文本" example='用户说：{{event.msg}}' />
              <P code="{{event.targetmode}}" desc="目标（1=私聊，2=频道，3=服务器）" />

              <SectionHeader>聊天命令 &mdash; trigger_command</SectionHeader>
              <P code="{{event.command_name}}" desc="命令名称（不含前缀）" example='命令：{{event.command_name}}' />
              <P code="{{event.command_args}}" desc="命令后的参数" example='参数：{{event.command_args}}' />
              <P code="{{event.clid}}" desc="发送者客户端 ID" />
              <P code="{{event.client_nickname}}" desc="发送者昵称" />

              <SectionHeader>频道事件 &mdash; created / edited / deleted</SectionHeader>
              <P code="{{event.cid}}" desc="频道 ID" />
              <P code="{{event.invokerid}}" desc="执行变更的客户端 ID" />
              <P code="{{event.invokername}}" desc="执行变更者名称" />

              <SectionHeader>Webhook &mdash; trigger_webhook</SectionHeader>
              <P code="{{event.webhook_path}}" desc="请求路径" example='/my-hook' />
              <P code="{{event.webhook_method}}" desc="HTTP 方法" example='GET 或 POST' />
              <P code="{{event.webhook_body}}" desc="请求体（原始 JSON）" />
              <P code="{{event.webhook_body.field}}" desc="JSON 请求体中的嵌套字段" example='状态：{{event.webhook_body.status}}' />
              <P code="{{event.webhook_query}}" desc="查询参数（原始 JSON）" />
            </TabsContent>

            {/* ========== TIME ========== */}
            <TabsContent value="time" className="mt-0 pr-3">
              <p className="text-xs text-muted-foreground mb-2">
                当前日期与时间。遵循 Cron 触发器上配置的时区（未配置时回退为 UTC）。
              </p>
              <P code="{{time.time}}" desc="格式化时间 HH:MM" example='频道名：现在是 {{time.time}}' />
              <P code="{{time.date}}" desc="格式化日期 DD.MM.YYYY" example='日期：{{time.date}}' />
              <P code="{{time.hours}}" desc="小时（00-23）" example='Condition: time.hours >= 22' />
              <P code="{{time.minutes}}" desc="分钟（00-59）" />
              <P code="{{time.seconds}}" desc="秒（00-59）" />
              <P code="{{time.day}}" desc="月内日期（01-31）" />
              <P code="{{time.month}}" desc="月份（01-12）" example='Condition: time.month == 12' />
              <P code="{{time.year}}" desc="年份（4 位）" example='2026' />
              <P code="{{time.dayOfWeek}}" desc="星期（0=周日，1=周一，…，6=周六）" example='Condition: time.dayOfWeek == 0' />
              <P code="{{time.timestamp}}" desc="Unix 时间戳（秒）" example='1739462400' />
            </TabsContent>

            {/* ========== VARIABLES ========== */}
            <TabsContent value="var" className="mt-0 pr-3">
              <p className="text-xs text-muted-foreground mb-2">
                持久化存储在数据库中的变量，重启后依然保留，作用域为单个流程。
                通过 <strong>设置变量</strong> 动作节点写入。
              </p>
              <P code={'{{var.name}}'} desc="按名称读取变量" example='计数：{{var.visit_count}}' />

              <SectionHeader>变量相关操作</SectionHeader>
              <div className="text-xs text-muted-foreground space-y-1 mt-1">
                <p><strong>设置</strong> &mdash; 将变量设为固定值或模板</p>
                <p><strong>自增</strong> &mdash; 在当前值基础上加上一个数字</p>
                <p><strong>追加</strong> &mdash; 在当前值末尾追加文本</p>
              </div>

              <SectionHeader>用法示例</SectionHeader>
              <div className="text-xs text-muted-foreground space-y-1 mt-1">
                <p>访问计数：每次加入时将 <code className="text-emerald-400">visit_count</code> 自增 1</p>
                <p>最后出现：将 <code className="text-emerald-400">{'lastseen_{{event.client_database_id}}'}</code> 设为 <code className="text-emerald-400">{'{{time.timestamp}}'}</code></p>
                <p>在线时长统计：将 <code className="text-emerald-400">{'onlinetime_{{event.clid}}'}</code> 自增</p>
              </div>
            </TabsContent>

            {/* ========== TEMP ========== */}
            <TabsContent value="temp" className="mt-0 pr-3">
              <p className="text-xs text-muted-foreground mb-2">
                仅在单次流程执行期间存在的临时变量，由特定动作节点自动写入，支持点号访问嵌套字段。
              </p>

              <SectionHeader>由动作自动写入</SectionHeader>
              <P code="{{temp.lastCreatedChannelId}}" desc="「创建频道」所创建频道的 CID" example='将客户端移动到 {{temp.lastCreatedChannelId}}' />
              <P code="{{temp.lastResult}}" desc="WebQuery 动作返回的原始 JSON 结果" />
              <P code="{{temp.afkMovedCount}}" desc="AFK 移动动作所移动的客户端数量" example='已移动 {{temp.afkMovedCount}} 名 AFK 用户' />
              <P code="{{temp.idleKickedCount}}" desc="闲置踢出动作所踢出的客户端数量" />
              <P code="{{temp.pokedCount}}" desc="戳一戳组动作所戳的客户端数量" />
              <P code="{{temp.rankPromotedCount}}" desc="等级检查动作所晋升的客户端数量" />
              <P code="{{temp.tempChannelsDeleted}}" desc="临时频道清理动作所删除的频道数量" />

              <SectionHeader>通过「存储为」自定义</SectionHeader>
              <p className="text-xs text-muted-foreground mb-1">
                WebQuery 与 HTTP 请求动作都有「存储为」字段，其结果会保存为临时变量。
              </p>
              <P code={'{{temp.server.virtualserver_clientsonline}}'} desc='在线用户数（在将 serverinfo 存储为 "server" 之后）' example='在线：{{temp.server.virtualserver_clientsonline}}/{{temp.server.virtualserver_maxclients}}' />
              <P code={'{{temp.server.virtualserver_uptime}}'} desc='服务器运行时长（秒）' example='运行时长：{{temp.server.virtualserver_uptime|uptime}}' />
              <P code={'{{temp.client.client_nickname}}'} desc='客户端名称（在将 clientinfo 存储为 "client" 之后）' />
            </TabsContent>

            {/* ========== EXEC ========== */}
            <TabsContent value="exec" className="mt-0 pr-3">
              <p className="text-xs text-muted-foreground mb-2">
                关于当前流程执行的只读元信息。
              </p>
              <P code="{{exec.flowId}}" desc="正在执行的流程 ID" />
              <P code="{{exec.executionId}}" desc="唯一的执行实例 ID" />
              <P code="{{exec.configId}}" desc="服务器配置 ID" />
              <P code="{{exec.sid}}" desc="虚拟服务器 ID" />
              <P code="{{exec.triggerType}}" desc="触发器类型（event、cron、webhook、command）" example='Condition: exec.triggerType == "cron"' />
            </TabsContent>

            {/* ========== FILTER ========== */}
            <TabsContent value="filter" className="mt-0 pr-3">
              <p className="text-xs text-muted-foreground mb-2">
                过滤器用于转换取值，使用管道语法：<code className="text-emerald-400">{'{{value|filter}}'}</code>
              </p>
              <P code="uptime" desc="将秒数转换为易读的运行时长" example='{{temp.server.virtualserver_uptime|uptime}} → "5d 3h 42m"' />
              <P code="round" desc="四舍五入到整数" example='{{temp.value|round}} → "42"' />
              <P code="floor" desc="向下取整" example='{{temp.value|floor}} → "41"' />
            </TabsContent>

            {/* ========== FUNCTIONS ========== */}
            <TabsContent value="functions" className="mt-0 pr-3">
              <p className="text-xs text-muted-foreground mb-2">
                可在 <strong>条件</strong> 节点表达式中使用的函数，返回 0 或 1（假/真）。
              </p>
              <P code="contains(str, sub)" desc="字符串是否包含子串？" example="contains(event.client_servergroups, '6')" />
              <P code="startsWith(str, prefix)" desc="字符串是否以指定前缀开头？" example="startsWith(event.client_nickname, 'Admin')" />
              <P code="endsWith(str, suffix)" desc="字符串是否以指定后缀结尾？" example="endsWith(event.client_nickname, 'Bot')" />
              <P code="lower(str)" desc="转换为小写" example="contains(lower(event.client_nickname), 'bot')" />
              <P code="upper(str)" desc="转换为大写" />
              <P code="length(str)" desc="字符串长度" example="length(event.msg) > 100" />
              <P code="split(str, sep, idx)" desc="拆分字符串并取指定下标的元素" example="split(event.command_args, ' ', 0)" />

              <SectionHeader>条件示例</SectionHeader>
              <div className="text-xs text-muted-foreground space-y-1 mt-1">
                <p><code className="text-emerald-400">event.client_type == 0</code> &mdash; 仅真实用户（不含查询客户端）</p>
                <p><code className="text-emerald-400">{"contains(event.client_servergroups, '7')"}</code> &mdash; 客户端位于服务器组 7</p>
                <p><code className="text-emerald-400">time.hours {'>='} 22 or time.hours {'<'} 6</code> &mdash; 仅在夜间</p>
                <p><code className="text-emerald-400">event.ctid == 42</code> &mdash; 客户端被移动到指定频道</p>
                <p><code className="text-emerald-400">temp.vpn.security.vpn == 1</code> &mdash; 检测到 VPN（HTTP 请求之后）</p>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
