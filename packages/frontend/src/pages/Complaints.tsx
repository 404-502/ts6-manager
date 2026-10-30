import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { complaintsApi } from '@/api/bans.api';
import { useServerStore } from '@/stores/server.store';
import { DataTable } from '@/components/shared/DataTable';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { MessageSquareWarning } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { timeAgo } from '@/lib/utils';

export default function Complaints() {
  const { selectedConfigId: c, selectedSid: s } = useServerStore();
  const { data, isLoading } = useQuery({ queryKey: ['complaints', c, s], queryFn: () => complaintsApi.list(c!, s!), enabled: !!c && !!s });

  const complaints = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'fname', header: '来自' },
    { accessorKey: 'tname', header: '关于' },
    { accessorKey: 'message', header: '消息' },
    { accessorKey: 'timestamp', header: '时间', cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{timeAgo(getValue() as number)}</span> },
  ], []);

  if (!c || !s) return <EmptyState icon={MessageSquareWarning} title="未选择服务器" />;
  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">投诉</h1>
      <DataTable columns={columns} data={complaints} searchKey="message" searchPlaceholder="搜索投诉..." />
    </div>
  );
}
