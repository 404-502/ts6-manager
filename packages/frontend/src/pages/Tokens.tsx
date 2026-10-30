import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tokensApi } from '@/api/bans.api';
import { useServerStore } from '@/stores/server.store';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { KeyRound, Trash2, Copy } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

export default function Tokens() {
  const { selectedConfigId: c, selectedSid: s } = useServerStore();
  const { data, isLoading } = useQuery({ queryKey: ['tokens', c, s], queryFn: () => tokensApi.list(c!, s!), enabled: !!c && !!s });
  const qc = useQueryClient();
  const deleteToken = useMutation({ mutationFn: (token: string) => tokensApi.delete(c!, s!, token), onSuccess: () => qc.invalidateQueries({ queryKey: ['tokens'] }) });

  const tokens = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'token', header: '令牌', cell: ({ getValue }) => (
      <div className="flex items-center gap-1">
        <span className="font-mono-data text-xs truncate max-w-[200px]">{getValue() as string}</span>
        <button onClick={() => { navigator.clipboard.writeText(getValue() as string); toast.success('已复制'); }} className="p-1 hover:bg-muted rounded"><Copy className="h-3 w-3 text-muted-foreground" /></button>
      </div>
    )},
    { accessorKey: 'token_type', header: '类型', cell: ({ getValue }) => <span className="text-xs">{(getValue() as number) === 0 ? '服务器组' : '频道组'}</span> },
    { accessorKey: 'token_id1', header: '组 ID', cell: ({ getValue }) => <span className="font-mono-data text-xs">{getValue() as number}</span> },
    { accessorKey: 'token_description', header: '描述', cell: ({ getValue }) => <span className="text-xs">{(getValue() as string) || '-'}</span> },
    { id: 'actions', header: '', cell: ({ row }) => (
      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteToken.mutate(row.original.token, { onSuccess: () => toast.success('令牌已删除') })}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    )},
  ], [deleteToken]);

  if (!c || !s) return <EmptyState icon={KeyRound} title="未选择服务器" />;
  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">权限密钥</h1>
      <DataTable columns={columns} data={tokens} searchKey="token_description" searchPlaceholder="搜索令牌..." />
    </div>
  );
}
