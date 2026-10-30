import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesApi } from '@/api/files.api';
import { channelsApi } from '@/api/channels.api';
import { useServerStore } from '@/stores/server.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn, formatBytes } from '@/lib/utils';
import {
  FolderOpen, File, Folder, ArrowLeft, FolderPlus, Trash2, Hash, HardDrive, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface FileEntry {
  name: string;
  size: number;
  datetime: number;
  type: number; // 0 = file, 1 = directory
}

export default function Files() {
  const { selectedConfigId: c, selectedSid: s } = useServerStore();
  const qc = useQueryClient();

  const [selectedCid, setSelectedCid] = useState<number | null>(null);
  const [currentPath, setCurrentPath] = useState('/');
  const [showMkdir, setShowMkdir] = useState(false);
  const [newDirName, setNewDirName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FileEntry | null>(null);

  // Fetch channel list for selector
  const { data: channelData } = useQuery({
    queryKey: ['channels-for-files', c, s],
    queryFn: () => channelsApi.list(c!, s!),
    enabled: !!c && !!s,
  });

  const channels = useMemo(() => {
    if (!channelData || !Array.isArray(channelData)) return [];
    return channelData.map((ch: any) => ({
      cid: Number(ch.cid),
      name: ch.channel_name,
    }));
  }, [channelData]);

  // Fetch files in selected channel + path
  const { data: fileData, isLoading: loadingFiles, error: filesError } = useQuery({
    queryKey: ['files', c, s, selectedCid, currentPath],
    queryFn: () => filesApi.list(c!, s!, selectedCid!, currentPath),
    enabled: !!c && !!s && !!selectedCid,
    retry: false,
  });

  const files: FileEntry[] = useMemo(() => {
    if (!fileData || !Array.isArray(fileData)) return [];
    return fileData.map((f: any) => ({
      name: f.name,
      size: Number(f.size) || 0,
      datetime: Number(f.datetime) || 0,
      type: Number(f.type),
    })).sort((a: FileEntry, b: FileEntry) => {
      // Directories first, then alphabetical
      if (a.type !== b.type) return b.type - a.type;
      return a.name.localeCompare(b.name);
    });
  }, [fileData]);

  const mkdirMutation = useMutation({
    mutationFn: (dirname: string) => filesApi.createDir(c!, s!, selectedCid!, dirname),
    onSuccess: () => {
      toast.success('目录已创建');
      setShowMkdir(false);
      setNewDirName('');
      qc.invalidateQueries({ queryKey: ['files', c, s, selectedCid, currentPath] });
    },
    onError: () => toast.error('创建目录失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => filesApi.delete(c!, s!, selectedCid!, name),
    onSuccess: () => {
      toast.success('文件已删除');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['files', c, s, selectedCid, currentPath] });
    },
    onError: () => toast.error('删除文件失败'),
  });

  const navigateTo = (entry: FileEntry) => {
    if (entry.type === 1) {
      const newPath = currentPath === '/' ? `/${entry.name}` : `${currentPath}/${entry.name}`;
      setCurrentPath(newPath);
    }
  };

  const goUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.length === 0 ? '/' : '/' + parts.join('/'));
  };

  const handleMkdir = () => {
    if (!newDirName.trim()) return;
    const dirname = currentPath === '/' ? `/${newDirName}` : `${currentPath}/${newDirName}`;
    mkdirMutation.mutate(dirname);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const fullPath = currentPath === '/' ? `/${deleteTarget.name}` : `${currentPath}/${deleteTarget.name}`;
    deleteMutation.mutate(fullPath);
  };

  const formatDate = (ts: number) => {
    if (!ts) return '-';
    return new Date(ts * 1000).toLocaleDateString('zh-CN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Breadcrumb parts
  const pathParts = currentPath.split('/').filter(Boolean);

  if (!c || !s) return <EmptyState icon={FolderOpen} title="未选择服务器" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">文件浏览器</h1>
        {selectedCid && (
          <Button size="sm" onClick={() => setShowMkdir(true)}>
            <FolderPlus className="h-4 w-4 mr-1" /> 新建文件夹
          </Button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Channel Selector */}
        <Card className="col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" /> 频道
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-2 space-y-0.5">
                {channels.map((ch) => (
                  <button
                    key={ch.cid}
                    onClick={() => { setSelectedCid(ch.cid); setCurrentPath('/'); }}
                    className={cn(
                      'w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors truncate',
                      selectedCid === ch.cid
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted/50',
                    )}
                  >
                    {ch.name}
                  </button>
                ))}
                {channels.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">暂无频道</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* File List */}
        <Card className="col-span-9">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedCid && currentPath !== '/' && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goUp}>
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Button>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <HardDrive className="h-3.5 w-3.5" />
                  <button onClick={() => setCurrentPath('/')} className="hover:text-foreground transition-colors">/</button>
                  {pathParts.map((part, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span>/</span>
                      <button
                        onClick={() => setCurrentPath('/' + pathParts.slice(0, i + 1).join('/'))}
                        className="hover:text-foreground transition-colors"
                      >
                        {part}
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              {selectedCid && (
                <Badge variant="secondary" className="text-[10px] font-mono-data">
                  {files.length} 项
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!selectedCid ? (
              <div className="flex items-center justify-center h-[400px]">
                <p className="text-sm text-muted-foreground">请选择一个频道以浏览文件</p>
              </div>
            ) : loadingFiles ? (
              <div className="flex items-center justify-center h-[400px]">
                <PageLoader />
              </div>
            ) : filesError ? (
              <div className="flex flex-col items-center justify-center h-[400px] gap-3 px-8">
                <AlertTriangle className="h-8 w-8 text-amber-400" />
                <p className="text-sm font-medium text-foreground">文件浏览器不可用</p>
                <p className="text-xs text-muted-foreground text-center max-w-md">
                  {(filesError as any)?.response?.data?.error?.includes('未配置 SSH 凭据')
                    ? '文件浏览需要通过 SSH 访问，因为 TeamSpeak WebQuery HTTP API 不支持文件传输命令。请在服务器设置中配置 SSH 凭据（用户名和密码）。'
                    : (filesError as any)?.response?.data?.error?.includes('SSH')
                      ? '无法通过 SSH 连接到 TeamSpeak 服务器。请检查服务器设置中的 SSH 凭据和端口。'
                      : (filesError as any)?.response?.data?.details || (filesError as any)?.response?.data?.error || '加载文件失败。请确认已在服务器设置中配置 SSH 凭据。'}
                </p>
                {(filesError as any)?.response?.data?.code != null && (
                  <p className="text-[10px] text-muted-foreground/60 mt-1">TS3 错误码：{(filesError as any).response.data.code}</p>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[460px]">
                {/* File table header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border">
                  <div className="col-span-6">名称</div>
                  <div className="col-span-2 text-right">大小</div>
                  <div className="col-span-3">修改时间</div>
                  <div className="col-span-1"></div>
                </div>

                {files.length === 0 ? (
                  <div className="flex items-center justify-center h-[350px]">
                    <EmptyState icon={FolderOpen} title="空目录" description="此目录中没有文件。" />
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {files.map((file) => (
                      <div
                        key={file.name}
                        className={cn(
                          'grid grid-cols-12 gap-2 px-4 py-2 text-sm items-center group hover:bg-muted/20 transition-colors',
                          file.type === 1 && 'cursor-pointer',
                        )}
                        onClick={() => navigateTo(file)}
                      >
                        <div className="col-span-6 flex items-center gap-2 truncate">
                          {file.type === 1 ? (
                            <Folder className="h-4 w-4 text-primary/70 shrink-0" />
                          ) : (
                            <File className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="truncate">{file.name}</span>
                        </div>
                        <div className="col-span-2 text-right text-xs text-muted-foreground font-mono-data">
                          {file.type === 0 ? formatBytes(file.size) : '-'}
                        </div>
                        <div className="col-span-3 text-xs text-muted-foreground font-mono-data">
                          {formatDate(file.datetime)}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(file); }}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info notice */}
      <p className="text-xs text-muted-foreground text-center">
        通过 WebQuery API 不支持文件上传/下载。请使用 TS3 客户端进行文件传输。
      </p>

      {/* Create Directory Dialog */}
      <Dialog open={showMkdir} onOpenChange={setShowMkdir}>
        <DialogContent>
          <DialogHeader><DialogTitle>创建目录</DialogTitle></DialogHeader>
          <div>
            <Label className="text-xs">目录名称</Label>
            <Input value={newDirName} onChange={(e) => setNewDirName(e.target.value)} placeholder="新建文件夹" autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMkdir(false)}>取消</Button>
            <Button onClick={handleMkdir} disabled={mkdirMutation.isPending || !newDirName.trim()}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="删除文件"
        description={`确定要删除「${deleteTarget?.name}」吗？此操作无法撤销。`}
        confirmLabel="删除"
        destructive
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
