import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useWidgets, useCreateWidget, useUpdateWidget, useDeleteWidget, useRegenerateWidgetToken } from '@/hooks/use-widgets';
import { useQuery } from '@tanstack/react-query';
import { serversApi } from '@/api/servers.api';
import type { WidgetConfig, WidgetTheme, ServerConfig } from '@ts6/common';
import { WIDGET_THEME_LABELS } from '@ts6/common';
import { Copy, ExternalLink, Plus, Trash2, Pencil, RefreshCw, ArrowLeft, Code2, Image } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ViewState = 'list' | 'create' | 'edit' | 'embed';

const THEME_OPTIONS = (Object.keys(WIDGET_THEME_LABELS) as WidgetTheme[]).map(
  (key) => [key, WIDGET_THEME_LABELS[key]] as [WidgetTheme, string]
);

function copyText(text: string) {
  navigator.clipboard.writeText(text);
}

export function WidgetManagerModal({ open, onOpenChange }: Props) {
  const { data: widgets = [], isLoading } = useWidgets();
  const { data: servers = [] } = useQuery<ServerConfig[]>({ queryKey: ['servers'], queryFn: serversApi.list });
  const createWidget = useCreateWidget();
  const updateWidget = useUpdateWidget();
  const deleteWidget = useDeleteWidget();
  const regenerateToken = useRegenerateWidgetToken();

  const [view, setView] = useState<ViewState>('list');
  const [editTarget, setEditTarget] = useState<WidgetConfig | null>(null);
  const [embedTarget, setEmbedTarget] = useState<WidgetConfig | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [serverConfigId, setServerConfigId] = useState<number>(0);
  const [virtualServerId, setVirtualServerId] = useState(1);
  const [theme, setTheme] = useState<WidgetTheme>('dark');
  const [showChannelTree, setShowChannelTree] = useState(true);
  const [showClients, setShowClients] = useState(true);
  const [hideEmptyChannels, setHideEmptyChannels] = useState(false);
  const [maxChannelDepth, setMaxChannelDepth] = useState(5);

  const resetForm = () => {
    setName('');
    setServerConfigId(servers[0]?.id ?? 0);
    setVirtualServerId(1);
    setTheme('dark');
    setShowChannelTree(true);
    setShowClients(true);
    setHideEmptyChannels(false);
    setMaxChannelDepth(5);
  };

  const openCreate = () => {
    resetForm();
    setServerConfigId(servers[0]?.id ?? 0);
    setView('create');
  };

  const openEdit = (w: WidgetConfig) => {
    setEditTarget(w);
    setName(w.name);
    setTheme(w.theme);
    setShowChannelTree(w.showChannelTree);
    setShowClients(w.showClients);
    setHideEmptyChannels(w.hideEmptyChannels ?? false);
    setMaxChannelDepth(w.maxChannelDepth);
    setView('edit');
  };

  const openEmbed = (w: WidgetConfig) => {
    setEmbedTarget(w);
    setView('embed');
  };

  const handleCreate = async () => {
    if (!name.trim() || !serverConfigId) return;
    await createWidget.mutateAsync({
      name: name.trim(),
      serverConfigId,
      virtualServerId,
      theme,
      showChannelTree,
      showClients,
      hideEmptyChannels,
      maxChannelDepth,
    });
    setView('list');
  };

  const handleUpdate = async () => {
    if (!editTarget || !name.trim()) return;
    await updateWidget.mutateAsync({
      id: editTarget.id,
      data: { name: name.trim(), theme, showChannelTree, showClients, hideEmptyChannels, maxChannelDepth },
    });
    setView('list');
  };

  const handleDelete = async (id: number) => {
    await deleteWidget.mutateAsync(id);
  };

  const handleRegenerate = async (w: WidgetConfig) => {
    await regenerateToken.mutateAsync(w.id);
    if (embedTarget?.id === w.id) {
      // Refresh embed target with new token
      const updated = widgets.find(x => x.id === w.id);
      if (updated) setEmbedTarget(updated);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setView('list'); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {view !== 'list' && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setView('list')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {view === 'list' && '服务器小组件'}
            {view === 'create' && '创建小组件'}
            {view === 'edit' && '编辑小组件'}
            {view === 'embed' && '嵌入代码'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {/* LIST VIEW */}
          {view === 'list' && (
            <div className="space-y-3">
              <Button size="sm" onClick={openCreate} disabled={servers.length === 0}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> 新建小组件
              </Button>

              {isLoading && <p className="text-sm text-muted-foreground">加载中...</p>}

              {widgets.length === 0 && !isLoading && (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  还没有小组件。创建一个即可把服务器状态嵌入到外部网站。
                </p>
              )}

              {widgets.map((w) => (
                <div key={w.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{w.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {WIDGET_THEME_LABELS[w.theme] || w.theme}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    服务器：{(w as any).serverConfig?.name || `#${w.serverConfigId}`} | 虚拟服务器 {w.virtualServerId}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEmbed(w)}>
                      <Code2 className="h-3 w-3 mr-1" /> 嵌入
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => window.open(`/widget/${w.token}`, '_blank')}>
                      <ExternalLink className="h-3 w-3 mr-1" /> 预览
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => window.open(`/api/widget/${w.token}/image.svg`, '_blank')}>
                      <Image className="h-3 w-3 mr-1" /> SVG
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(w)}>
                      <Pencil className="h-3 w-3 mr-1" /> 编辑
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => handleDelete(w.id)}>
                      <Trash2 className="h-3 w-3 mr-1" /> 删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CREATE / EDIT VIEW */}
          {(view === 'create' || view === 'edit') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>名称</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="我的服务器小组件" />
              </div>

              {view === 'create' && (
                <>
                  <div className="space-y-2">
                    <Label>服务器</Label>
                    <Select value={String(serverConfigId)} onValueChange={(v) => setServerConfigId(Number(v))}>
                      <SelectTrigger><SelectValue placeholder="选择服务器" /></SelectTrigger>
                      <SelectContent>
                        {servers.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>虚拟服务器 ID</Label>
                    <Input type="number" min={1} value={virtualServerId} onChange={(e) => setVirtualServerId(Number(e.target.value))} />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>主题</Label>
                <Select value={theme} onValueChange={(v) => setTheme(v as WidgetTheme)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {THEME_OPTIONS.map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label>显示频道树</Label>
                <Switch checked={showChannelTree} onCheckedChange={setShowChannelTree} />
              </div>

              <div className="flex items-center justify-between">
                <Label>显示客户端</Label>
                <Switch checked={showClients} onCheckedChange={setShowClients} />
              </div>

              <div className="flex items-center justify-between">
                <Label>隐藏空频道</Label>
                <Switch checked={hideEmptyChannels} onCheckedChange={setHideEmptyChannels} />
              </div>

              <div className="space-y-2">
                <Label>最大频道深度：{maxChannelDepth}</Label>
                <Slider min={1} max={10} step={1} value={[maxChannelDepth]} onValueChange={([v]) => setMaxChannelDepth(v)} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setView('list')}>取消</Button>
                <Button onClick={view === 'create' ? handleCreate : handleUpdate} disabled={!name.trim()}>
                  {view === 'create' ? '创建' : '保存'}
                </Button>
              </div>
            </div>
          )}

          {/* EMBED VIEW */}
          {view === 'embed' && embedTarget && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{embedTarget.name}</p>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleRegenerate(embedTarget)}>
                  <RefreshCw className="h-3 w-3 mr-1" /> 重新生成令牌
                </Button>
              </div>

              <Tabs defaultValue="iframe">
                <TabsList className="w-full">
                  <TabsTrigger value="iframe" className="flex-1">iFrame</TabsTrigger>
                  <TabsTrigger value="image" className="flex-1">图片链接</TabsTrigger>
                  <TabsTrigger value="bbcode" className="flex-1">BBCode</TabsTrigger>
                </TabsList>

                <TabsContent value="iframe" className="space-y-2">
                  <Label className="text-xs text-muted-foreground">把下面代码粘贴到你的网站 HTML 中：</Label>
                  <div className="relative">
                    <code className="block bg-muted rounded-md p-3 text-xs font-mono break-all leading-relaxed">
                      {`<iframe src="${origin}/widget/${embedTarget.token}" width="420" height="600" frameborder="0" scrolling="auto" style="border-radius:8px;border:none;"></iframe>`}
                    </code>
                    <Button
                      size="icon" variant="ghost"
                      className="absolute top-1 right-1 h-7 w-7"
                      onClick={() => copyText(`<iframe src="${origin}/widget/${embedTarget.token}" width="420" height="600" frameborder="0" scrolling="auto" style="border-radius:8px;border:none;"></iframe>`)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">SVG（可缩放，质量最佳）：</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted rounded-md p-2 text-xs font-mono break-all">
                        {`${origin}/api/widget/${embedTarget.token}/image.svg`}
                      </code>
                      <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={() => copyText(`${origin}/api/widget/${embedTarget.token}/image.svg`)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">PNG（适用于论坛 / 签名）：</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted rounded-md p-2 text-xs font-mono break-all">
                        {`${origin}/api/widget/${embedTarget.token}/image.png`}
                      </code>
                      <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={() => copyText(`${origin}/api/widget/${embedTarget.token}/image.png`)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">HTML img 标签：</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted rounded-md p-2 text-xs font-mono break-all">
                        {`<img src="${origin}/api/widget/${embedTarget.token}/image.png" alt="TeamSpeak 服务器" />`}
                      </code>
                      <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={() => copyText(`<img src="${origin}/api/widget/${embedTarget.token}/image.png" alt="TeamSpeak 服务器" />`)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="bbcode" className="space-y-2">
                  <Label className="text-xs text-muted-foreground">论坛 BBCode（使用 PNG）：</Label>
                  <div className="relative">
                    <code className="block bg-muted rounded-md p-3 text-xs font-mono break-all">
                      {`[img]${origin}/api/widget/${embedTarget.token}/image.png[/img]`}
                    </code>
                    <Button
                      size="icon" variant="ghost"
                      className="absolute top-1 right-1 h-7 w-7"
                      onClick={() => copyText(`[img]${origin}/api/widget/${embedTarget.token}/image.png[/img]`)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
