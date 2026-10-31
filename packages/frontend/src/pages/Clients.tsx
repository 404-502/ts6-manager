import { useMemo, useState } from 'react';
import { useClients, useKickClient, useBanClient, usePokeClient } from '@/hooks/use-clients';
import { useServerStore } from '@/stores/server.store';
import { useAuthStore } from '@/stores/auth.store';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatUptime, isForbiddenError } from '@/lib/utils';
import { Users, MoreHorizontal, LogOut, Ban, MessageSquare, Zap, ShieldAlert } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

export default function Clients() {
  const { selectedConfigId, selectedSid } = useServerStore();
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const { data, isLoading, error } = useClients();
  const kickClient = useKickClient();
  const banClient = useBanClient();
  const pokeClient = usePokeClient();

  const [pokeTarget, setPokeTarget] = useState<{ clid: number; name: string } | null>(null);
  const [pokeMsg, setPokeMsg] = useState('');

  const clients = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.filter((c: any) => String(c.client_type) === '0');
  }, [data]);

  const columns: ColumnDef<any>[] = useMemo(() => {
    const cols: ColumnDef<any>[] = [
      {
        accessorKey: 'client_nickname',
        header: '昵称',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-mono-data text-primary">
              {row.original.client_nickname?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="font-medium">{row.original.client_nickname}</span>
          </div>
        ),
      },
      {
        accessorKey: 'client_country',
        header: '国家',
        cell: ({ getValue }) => <span className="font-mono-data text-xs">{(getValue() as string) || '-'}</span>,
      },
      {
        accessorKey: 'client_idle_time',
        header: '空闲',
        cell: ({ getValue }) => <span className="font-mono-data text-xs text-muted-foreground">{formatUptime(Math.floor((getValue() as number) / 1000))}</span>,
      },
      {
        accessorKey: 'client_away',
        header: '状态',
        cell: ({ row }) => {
          if (row.original.client_away) return <Badge variant="warning" className="text-[10px]">离开</Badge>;
          if (row.original.client_input_muted) return <Badge variant="secondary" className="text-[10px]">已静音</Badge>;
          return <Badge variant="success" className="text-[10px]">在线</Badge>;
        },
      },
    ];
    if (isAdmin) {
      cols.push({
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const c = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setPokeTarget({ clid: c.clid, name: c.client_nickname }); setPokeMsg(''); }}>
                  <Zap className="mr-2 h-4 w-4" /> 戳一戳
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  kickClient.mutate({ clid: c.clid, reasonid: 5, reasonmsg: '被管理员踢出' });
                  toast.success(`已踢出 ${c.client_nickname}`);
                }}>
                  <LogOut className="mr-2 h-4 w-4" /> 踢出服务器
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                  banClient.mutate({ clid: c.clid, time: 3600, banreason: '被管理员封禁' });
                  toast.success(`已封禁 ${c.client_nickname}`);
                }}>
                  <Ban className="mr-2 h-4 w-4" /> 封禁（1 小时）
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      });
    }
    return cols;
  }, [isAdmin, kickClient, banClient]);

  if (!selectedConfigId || !selectedSid) return <EmptyState icon={Users} title="未选择服务器" />;
  if (isLoading) return <PageLoader />;
  if (isForbiddenError(error)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="无权访问该服务器"
        description="当前账号未被授予该服务器的访问权限，请联系管理员在「设置 → 用户」中为其分配可访问的服务器。"
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">客户端</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{clients.length} 人在线</p>
        </div>
      </div>

      <DataTable columns={columns} data={clients} searchKey="client_nickname" searchPlaceholder="搜索客户端..." />

      {/* Poke Dialog */}
      <Dialog open={!!pokeTarget} onOpenChange={() => setPokeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>戳一戳 {pokeTarget?.name}</DialogTitle>
          </DialogHeader>
          <div>
            <Label className="text-xs">消息</Label>
            <Input value={pokeMsg} onChange={(e) => setPokeMsg(e.target.value)} placeholder="嘿！" autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPokeTarget(null)}>取消</Button>
            <Button onClick={() => {
              if (pokeTarget && pokeMsg) {
                pokeClient.mutate({ clid: pokeTarget.clid, msg: pokeMsg });
                toast.success(`已戳 ${pokeTarget.name}`);
                setPokeTarget(null);
              }
            }}>
              <Zap className="h-4 w-4 mr-1" /> 戳一戳
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
