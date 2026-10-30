import { useState, useMemo } from 'react';
import { useBans, useAddBan, useDeleteBan } from '@/hooks/use-bans';
import { useServerStore } from '@/stores/server.store';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDuration, timeAgo } from '@/lib/utils';
import { Ban, Plus, Trash2 } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

export default function Bans() {
  const { selectedConfigId, selectedSid } = useServerStore();
  const { data, isLoading } = useBans();
  const addBan = useAddBan();
  const deleteBan = useDeleteBan();
  const [showAdd, setShowAdd] = useState(false);
  const [banType, setBanType] = useState<'ip' | 'name' | 'uid'>('ip');
  const [banValue, setBanValue] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('3600');

  const bans = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'lastnickname', header: '最后昵称', cell: ({ getValue }) => <span className="font-medium">{(getValue() as string) || '-'}</span> },
    { accessorKey: 'ip', header: 'IP', cell: ({ getValue }) => <span className="font-mono-data text-xs">{(getValue() as string) || '-'}</span> },
    { accessorKey: 'uid', header: 'UID', cell: ({ getValue }) => <span className="font-mono-data text-xs truncate max-w-[120px] block">{(getValue() as string) || '-'}</span> },
    { accessorKey: 'reason', header: '原因', cell: ({ getValue }) => <span className="text-xs">{(getValue() as string) || '-'}</span> },
    { accessorKey: 'duration', header: '时长', cell: ({ getValue }) => <span className="font-mono-data text-xs">{formatDuration(getValue() as number)}</span> },
    { accessorKey: 'created', header: '创建时间', cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{timeAgo(getValue() as number)}</span> },
    { accessorKey: 'invokername', header: '操作人', cell: ({ getValue }) => <span className="text-xs">{(getValue() as string) || '-'}</span> },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => {
          deleteBan.mutate(row.original.banid, { onSuccess: () => toast.success('已移除封禁') });
        }}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ], [deleteBan]);

  if (!selectedConfigId || !selectedSid) return <EmptyState icon={Ban} title="未选择服务器" />;
  if (isLoading) return <PageLoader />;

  const handleAdd = () => {
    const params: any = { time: parseInt(banDuration), banreason: banReason };
    params[banType] = banValue;
    addBan.mutate(params, {
      onSuccess: () => { toast.success('已添加封禁'); setShowAdd(false); setBanValue(''); setBanReason(''); },
      onError: () => toast.error('添加封禁失败'),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">封禁</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> 添加封禁</Button>
      </div>

      <DataTable columns={columns} data={bans} searchKey="lastnickname" searchPlaceholder="搜索封禁..." />

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>添加封禁</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">封禁类型</Label>
              <Select value={banType} onValueChange={(v: any) => setBanType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ip">IP 地址</SelectItem>
                  <SelectItem value="name">名称（正则）</SelectItem>
                  <SelectItem value="uid">唯一 ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">值</Label><Input value={banValue} onChange={(e) => setBanValue(e.target.value)} placeholder={banType === 'ip' ? '192.168.1.*' : banType === 'name' ? '.*bad.*' : 'unique-id'} /></div>
            <div><Label className="text-xs">原因</Label><Input value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="封禁原因" /></div>
            <div>
              <Label className="text-xs">时长</Label>
              <Select value={banDuration} onValueChange={setBanDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3600">1 小时</SelectItem>
                  <SelectItem value="86400">1 天</SelectItem>
                  <SelectItem value="604800">1 周</SelectItem>
                  <SelectItem value="2592000">30 天</SelectItem>
                  <SelectItem value="0">永久</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>取消</Button>
            <Button onClick={handleAdd} disabled={!banValue}>添加封禁</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
