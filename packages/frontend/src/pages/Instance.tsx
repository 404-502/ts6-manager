import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serversApi } from '@/api/servers.api';
import { useServerStore } from '@/stores/server.store';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Cpu, Save, Server, Globe } from 'lucide-react';
import { formatBytes, formatUptime } from '@/lib/utils';
import { toast } from 'sonner';

export default function Instance() {
  const { selectedConfigId: c } = useServerStore();
  const qc = useQueryClient();
  const [editFields, setEditFields] = useState<Record<string, string>>({});

  const { data: info, isLoading: loadingInfo } = useQuery({
    queryKey: ['instance-info', c],
    queryFn: () => serversApi.instanceInfo(c!),
    enabled: !!c,
  });
  const { data: host, isLoading: loadingHost } = useQuery({
    queryKey: ['host-info', c],
    queryFn: () => serversApi.hostInfo(c!),
    enabled: !!c,
  });
  const { data: version } = useQuery({
    queryKey: ['version', c],
    queryFn: () => serversApi.version(c!),
    enabled: !!c,
  });

  const editMutation = useMutation({
    mutationFn: (data: any) => serversApi.instanceEdit(c!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['instance-info', c] }); toast.success('实例设置已更新'); setEditFields({}); },
    onError: () => toast.error('更新实例设置失败'),
  });

  if (!c) return <EmptyState icon={Cpu} title="未选择服务器" />;
  if (loadingInfo || loadingHost) return <PageLoader />;

  const instanceData = Array.isArray(info) ? info[0] : info;
  const hostData = Array.isArray(host) ? host[0] : host;
  const versionData = Array.isArray(version) ? version[0] : version;

  const editableFields = [
    { key: 'serverinstance_guest_serverquery_group', label: '访客服务器查询组', type: 'number' },
    { key: 'serverinstance_template_serveradmin_group', label: '模板服务器管理员组', type: 'number' },
    { key: 'serverinstance_template_serverdefault_group', label: '模板服务器默认组', type: 'number' },
    { key: 'serverinstance_template_channeldefault_group', label: '模板频道默认组', type: 'number' },
    { key: 'serverinstance_template_channeladmin_group', label: '模板频道管理员组', type: 'number' },
    { key: 'serverinstance_filetransfer_port', label: '文件传输端口', type: 'number' },
    { key: 'serverinstance_serverquery_flood_commands', label: '泛洪命令数', type: 'number' },
    { key: 'serverinstance_serverquery_flood_time', label: '泛洪时间（秒）', type: 'number' },
    { key: 'serverinstance_serverquery_flood_ban_time', label: '泛洪封禁时间（秒）', type: 'number' },
  ];

  const handleSave = () => {
    if (Object.keys(editFields).length === 0) return;
    const data: any = {};
    for (const [k, v] of Object.entries(editFields)) data[k] = parseInt(v);
    editMutation.mutate(data);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">实例</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Version Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Server className="h-4 w-4 text-primary" /> 版本</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoRow label="版本" value={versionData?.version} />
            <InfoRow label="构建号" value={versionData?.build} />
            <InfoRow label="平台" value={versionData?.platform} />
          </CardContent>
        </Card>

        {/* Host Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> 主机</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoRow label="运行时长" value={hostData?.instance_uptime ? formatUptime(hostData.instance_uptime) : '-'} />
            <InfoRow label="已发送字节" value={hostData?.connection_bytes_sent_total ? formatBytes(hostData.connection_bytes_sent_total) : '-'} />
            <InfoRow label="已接收字节" value={hostData?.connection_bytes_received_total ? formatBytes(hostData.connection_bytes_received_total) : '-'} />
            <InfoRow label="虚拟服务器" value={hostData?.virtualservers_total_maxclients ? `${hostData.virtualservers_total_clients_online || 0} / ${hostData.virtualservers_total_maxclients}` : '-'} />
          </CardContent>
        </Card>

        {/* Database Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" /> 数据库</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoRow label="数据库插件" value={instanceData?.serverinstance_database_version} />
            <InfoRow label="文件传输端口" value={instanceData?.serverinstance_filetransfer_port} />
            <InfoRow label="权限版本" value={instanceData?.serverinstance_permissions_version} />
          </CardContent>
        </Card>
      </div>

      {/* Editable Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">实例设置</CardTitle>
            <Button size="sm" onClick={handleSave} disabled={Object.keys(editFields).length === 0 || editMutation.isPending}>
              <Save className="h-4 w-4 mr-1" /> 保存更改
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editableFields.map((field) => {
              const current = instanceData?.[field.key];
              return (
                <div key={field.key}>
                  <Label className="text-xs text-muted-foreground">{field.label}</Label>
                  <Input
                    type="number"
                    className="h-8 mt-1 font-mono-data text-xs"
                    defaultValue={current ?? ''}
                    onChange={(e) => setEditFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono-data font-medium">{value ?? '-'}</span>
    </div>
  );
}
