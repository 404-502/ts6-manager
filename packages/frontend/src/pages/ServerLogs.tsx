import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logsApi } from '@/api/bans.api';
import { useServerStore } from '@/stores/server.store';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollText, RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 100;

/** 日志流：TS6 logview 的 instance 参数，0 = 虚拟服务器日志，1 = 实例日志 */
const LOG_STREAMS = [
  { value: '1', label: '实例日志', desc: '服务器进程日志：启动、数据库、授权、文件管理等' },
  { value: '0', label: '虚拟服务器日志', desc: '当前虚拟服务器自身的事件日志' },
] as const;

const LEVEL_COLORS: Record<string, string> = {
  ERROR: 'text-destructive bg-destructive/10 border-destructive/20',
  WARNING: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  INFO: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  DEBUG: 'text-muted-foreground bg-muted/50 border-border/50',
};

function parseLevel(line: string): string {
  if (line.includes('|ERROR')) return 'ERROR';
  if (line.includes('|WARNING')) return 'WARNING';
  if (line.includes('|INFO')) return 'INFO';
  if (line.includes('|DEBUG')) return 'DEBUG';
  return 'INFO';
}

export default function ServerLogs() {
  const { selectedConfigId: c, selectedSid: s } = useServerStore();
  const [instance, setInstance] = useState('1');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');

  // 切换日志流时回到第 1 页
  useEffect(() => { setPage(1); }, [instance, c, s]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['logs', c, s, instance, page],
    queryFn: () => logsApi.get(c!, s!, { instance: parseInt(instance), page, pageSize: PAGE_SIZE }),
    enabled: !!c && !!s,
  });

  const entries: any[] = Array.isArray(data) ? data : data?.entries ?? [];
  const total: number | null = Array.isArray(data) ? data.length : data?.total ?? null;
  const hasMore: boolean = Array.isArray(data) ? false : !!data?.hasMore;

  const logs = useMemo(() => {
    return entries
      .map((entry: any) => {
        const line = typeof entry === 'string' ? entry : entry.l || entry.msg || JSON.stringify(entry);
        return { raw: line, level: parseLevel(line) };
      })
      .filter((entry) => {
        if (levelFilter !== 'ALL' && entry.level !== levelFilter) return false;
        if (filter && !entry.raw.toLowerCase().includes(filter.toLowerCase())) return false;
        return true;
      });
  }, [entries, filter, levelFilter]);

  if (!c || !s) return <EmptyState icon={ScrollText} title="未选择服务器" />;
  if (isLoading) return <PageLoader />;

  const canPrev = page > 1;
  const canNext = hasMore;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">服务器日志</h1>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn('h-4 w-4 mr-1', isFetching && 'animate-spin')} /> 刷新
        </Button>
      </div>

      <Tabs value={instance} onValueChange={setInstance}>
        <TabsList>
          {LOG_STREAMS.map((stream) => (
            <TabsTrigger key={stream.value} value={stream.value} title={stream.desc}>
              {stream.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="筛选日志..." value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-8 h-9" />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">全部级别</SelectItem>
            <SelectItem value="ERROR">错误</SelectItem>
            <SelectItem value="WARNING">警告</SelectItem>
            <SelectItem value="INFO">信息</SelectItem>
            <SelectItem value="DEBUG">调试</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden shadow-sm">
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="p-3 space-y-0.5">
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-10">未找到日志记录。</p>
            ) : (
              logs.map((entry, i) => (
                <div key={i} className="flex items-start gap-2 py-0.5 group hover:bg-muted/10 rounded px-1">
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded border shrink-0 font-mono-data uppercase tracking-wider mt-0.5', LEVEL_COLORS[entry.level] || LEVEL_COLORS.INFO)}>
                    {entry.level.slice(0, 3)}
                  </span>
                  <span className="text-xs font-mono-data text-muted-foreground leading-relaxed break-all">
                    {entry.raw}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          已显示 {logs.length} 条记录（每页 {PAGE_SIZE} 条{total !== null ? `，共 ${total} 条` : ''}）
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!canPrev || isFetching}>
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> 上一页
          </Button>
          <span className="text-xs text-muted-foreground font-mono-data">第 {page} 页</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!canNext || isFetching}>
            下一页 <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
