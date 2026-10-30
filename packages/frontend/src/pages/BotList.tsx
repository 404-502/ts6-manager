import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBots, useCreateBot, useToggleBot } from '@/hooks/use-bots';
import { useServerStore } from '@/stores/server.store';
import { botsApi } from '@/api/bots.api';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Bot, Plus, Pencil, Trash2, Play, Clock, AlertTriangle, LayoutTemplate } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TemplateGallery } from '@/components/bots/TemplateGallery';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeAgo } from '@/lib/utils';

export default function BotList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { selectedConfigId, selectedSid } = useServerStore();
  const { data, isLoading } = useBots();
  const createBot = useCreateBot();
  const toggleBot = useToggleBot();
  const deleteBot = useMutation({ mutationFn: (id: number) => botsApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['bots'] }) });

  const [showCreate, setShowCreate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const bots = Array.isArray(data) ? data : [];

  if (isLoading) return <PageLoader />;

  const handleCreate = () => {
    if (!selectedConfigId) {
      toast.error('请先选择服务器');
      return;
    }
    createBot.mutate({ name: newName, description: newDesc, serverConfigId: selectedConfigId, virtualServerId: selectedSid || 1, flowData: { nodes: [], edges: [] } }, {
      onSuccess: (bot: any) => { toast.success('机器人已创建'); setShowCreate(false); setNewName(''); setNewDesc(''); navigate(`/bots/${bot.id}`); },
      onError: () => toast.error('创建机器人失败'),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">机器人流程</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}><LayoutTemplate className="h-4 w-4 mr-1" /> 从模板创建</Button>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> 新建机器人</Button>
        </div>
      </div>

      {bots.length === 0 ? (
        <EmptyState icon={Bot} title="还没有机器人流程" description="创建你的第一个自动化流程开始使用。" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bots.map((bot: any) => (
            <Card key={bot.id} className="group hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium truncate">{bot.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={bot.enabled}
                      onCheckedChange={(enabled) => toggleBot.mutate({ id: bot.id, enabled }, {
                        onSuccess: () => toast.success(enabled ? '机器人已启用' : '机器人已停用'),
                      })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-2">{bot.description || '暂无描述'}</p>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={bot.enabled ? 'default' : 'secondary'} className="text-[10px]">
                    {bot.enabled ? '启用中' : '已停用'}
                  </Badge>
                  {bot.serverConfigId && (
                    <Badge variant="outline" className="text-[10px]">服务器 #{bot.serverConfigId}</Badge>
                  )}
                </div>

                {bot.updatedAt && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> 更新于 {timeAgo(new Date(bot.updatedAt).getTime() / 1000)}
                  </p>
                )}

                <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => navigate(`/bots/${bot.id}`)}>
                    <Pencil className="h-3 w-3 mr-1" /> 编辑流程
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(bot.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>新建机器人流程</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">名称</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="我的自动化" /></div>
            <div><Label className="text-xs">描述</Label><Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="这个机器人做什么？" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!newName || !selectedConfigId || createBot.isPending}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Gallery */}
      <TemplateGallery
        open={showTemplates}
        onOpenChange={setShowTemplates}
        onSelect={(name, description, flowData) => {
          if (!selectedConfigId) {
            toast.error('请先选择服务器');
            return;
          }
          createBot.mutate({ name, description, serverConfigId: selectedConfigId, virtualServerId: selectedSid || 1, flowData }, {
            onSuccess: (bot: any) => { toast.success(`已从模板创建机器人「${name}」`); navigate(`/bots/${bot.id}`); },
            onError: () => toast.error('从模板创建机器人失败'),
          });
        }}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
        title="删除机器人？"
        description="该操作将永久删除此机器人流程及其全部执行历史。"
        onConfirm={() => {
          if (deleteId) deleteBot.mutate(deleteId, { onSuccess: () => { toast.success('机器人已删除'); setDeleteId(null); } });
        }}
        destructive
      />
    </div>
  );
}
