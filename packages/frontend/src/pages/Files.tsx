import { useState, useMemo, useRef } from 'react';
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
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn, formatBytes } from '@/lib/utils';
import {
  FolderOpen, File, Folder, ArrowLeft, FolderPlus, Trash2, Hash, HardDrive, AlertTriangle,
  Upload, MoreHorizontal, Download, Pencil, MoveRight, X, Search, ArrowUpDown, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface FileEntry {
  name: string;
  size: number;
  datetime: number;
  type: number; // 0 = directory, 1 = file
}

type SortKey = 'name' | 'size' | 'datetime';

interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

/** 拼出完整的服务端路径 */
const joinPath = (parent: string, name: string) =>
  parent === '/' ? `/${name}` : `${parent}/${name}`;

/** 取路径里的最后一段，用于展示与重命名的默认值 */
const baseName = (path: string) => path.split('/').filter(Boolean).pop() || '';

/**
 * TeamSpeak 返回的 datetime 在部分版本是毫秒、部分是秒，这里统一判断。
 * 用 1e11 做分界：秒级时间戳要到公元 5138 年才会超过它。
 */
const toMillis = (ts: number) => (ts > 1e11 ? ts : ts * 1000);

export default function Files() {
  const { selectedConfigId: c, selectedSid: s } = useServerStore();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCid, setSelectedCid] = useState<number | null>(null);
  const [currentPath, setCurrentPath] = useState('/');
  const [showMkdir, setShowMkdir] = useState(false);
  const [newDirName, setNewDirName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FileEntry | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const [dragging, setDragging] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FileEntry | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [moveTarget, setMoveTarget] = useState<FileEntry | null>(null);
  const [moveCid, setMoveCid] = useState<string>('');
  const [movePath, setMovePath] = useState('/');

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
    }));
  }, [fileData]);

  // 移动弹窗里浏览目标频道目录用，只有打开了弹窗才请求
  const { data: moveDirData, isLoading: loadingMoveDir } = useQuery({
    queryKey: ['files-move-browse', c, s, moveCid, movePath],
    queryFn: () => filesApi.list(c!, s!, Number(moveCid), movePath),
    enabled: !!c && !!s && !!moveCid && !!moveTarget,
    retry: false,
  });

  // 目标目录里只列子目录，文件不能作为移动目的地
  const moveSubDirs: FileEntry[] = useMemo(() => {
    if (!moveDirData || !Array.isArray(moveDirData)) return [];
    return moveDirData
      .map((f: any) => ({
        name: f.name,
        size: Number(f.size) || 0,
        datetime: Number(f.datetime) || 0,
        type: Number(f.type),
      }))
      .filter((f) => f.type === 0)
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  }, [moveDirData]);

  // 目录永远在前，其余按用户选择的列排序
  const visibleFiles = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filtered = keyword
      ? files.filter((f) => f.name.toLowerCase().includes(keyword))
      : files;
    const sorted = [...filtered].sort((a, b) => {
      if (a.type !== b.type) return a.type - b.type;
      let diff: number;
      if (sortKey === 'size') diff = a.size - b.size;
      else if (sortKey === 'datetime') diff = a.datetime - b.datetime;
      else diff = a.name.localeCompare(b.name, 'zh-CN');
      return sortAsc ? diff : -diff;
    });
    return sorted;
  }, [files, search, sortKey, sortAsc]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['files', c, s, selectedCid, currentPath] });
  };

  const mkdirMutation = useMutation({
    mutationFn: (dirname: string) => filesApi.createDir(c!, s!, selectedCid!, dirname),
    onSuccess: () => {
      toast.success('目录已创建');
      setShowMkdir(false);
      setNewDirName('');
      refresh();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || '创建目录失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => filesApi.delete(c!, s!, selectedCid!, name),
    onSuccess: () => {
      toast.success('已删除');
      setDeleteTarget(null);
      refresh();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || '删除失败'),
  });

  const renameMutation = useMutation({
    mutationFn: (payload: { oldName: string; newName: string }) =>
      filesApi.rename(c!, s!, selectedCid!, payload.oldName, payload.newName),
    onSuccess: () => {
      toast.success('已重命名');
      setRenameTarget(null);
      refresh();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || '重命名失败'),
  });

  const moveMutation = useMutation({
    mutationFn: (payload: { oldName: string; targetCid: number; newName: string }) =>
      filesApi.move(c!, s!, selectedCid!, payload.oldName, payload.targetCid, payload.newName),
    onSuccess: () => {
      toast.success('已移动');
      setMoveTarget(null);
      refresh();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || '移动失败'),
  });

  const navigateTo = (entry: FileEntry) => {
    if (entry.type === 0) {
      setCurrentPath(joinPath(currentPath, entry.name));
      setSearch('');
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
    mkdirMutation.mutate(joinPath(currentPath, newDirName.trim()));
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(joinPath(currentPath, deleteTarget.name));
  };

  const handleRename = () => {
    if (!renameTarget || !renameValue.trim()) return;
    renameMutation.mutate({
      oldName: joinPath(currentPath, renameTarget.name),
      newName: joinPath(currentPath, renameValue.trim()),
    });
  };

  const handleMove = () => {
    if (!moveTarget || !moveCid) return;
    moveMutation.mutate({
      oldName: joinPath(currentPath, moveTarget.name),
      targetCid: Number(moveCid),
      newName: joinPath(movePath || '/', moveTarget.name),
    });
  };

  const handleDownload = async (entry: FileEntry) => {
    try {
      const blob = await filesApi.download(c!, s!, selectedCid!, joinPath(currentPath, entry.name));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = entry.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || '下载失败');
    }
  };

  /** 中文名在 TeamSpeak 服务端会被拒绝，这里提前提示，避免用户以为上传卡住了 */
  const isAsciiName = (name: string) => {
    // eslint-disable-next-line no-control-regex
    return /^[\x20-\x7E]+$/.test(name);
  };

  const startUpload = async (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    if (incoming.length === 0 || !selectedCid) return;

    const accepted: UploadTask[] = [];
    for (const file of incoming) {
      if (!isAsciiName(file.name)) {
        toast.error(`「${file.name}」包含中文或特殊字符，TeamSpeak 文件系统不支持，已跳过。`);
        continue;
      }
      accepted.push({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        progress: 0,
        status: 'pending',
      });
    }
    if (accepted.length === 0) return;

    setUploads((prev) => [...prev, ...accepted]);

    for (const task of accepted) {
      setUploads((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: 'uploading' } : t)),
      );
      try {
        await filesApi.upload(c!, s!, selectedCid, task.file, currentPath, (percent) => {
          setUploads((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, progress: percent } : t)),
          );
        });
        setUploads((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: 'done', progress: 100 } : t)),
        );
      } catch (err: any) {
        setUploads((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, status: 'error', error: err?.response?.data?.error || '上传失败' }
              : t,
          ),
        );
      }
    }
    refresh();
  };

  const retryUpload = (task: UploadTask) => {
    setUploads((prev) => prev.filter((t) => t.id !== task.id));
    void startUpload([task.file]);
  };

  const clearFinished = () => {
    setUploads((prev) => prev.filter((t) => t.status === 'uploading' || t.status === 'pending'));
  };

  const formatDate = (ts: number) => {
    if (!ts) return '-';
    return new Date(toMillis(ts)).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // Breadcrumb parts
  const pathParts = currentPath.split('/').filter(Boolean);

  if (!c || !s) return <EmptyState icon={FolderOpen} title="未选择服务器" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">文件浏览器</h1>
        {selectedCid && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-1" /> 刷新
            </Button>
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-1" /> 上传文件
            </Button>
            <Button size="sm" onClick={() => setShowMkdir(true)}>
              <FolderPlus className="h-4 w-4 mr-1" /> 新建文件夹
            </Button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void startUpload(e.target.files);
          e.target.value = '';
        }}
      />

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
                    onClick={() => { setSelectedCid(ch.cid); setCurrentPath('/'); setSearch(''); }}
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
        <Card
          className={cn('col-span-9 relative', dragging && 'ring-2 ring-primary')}
          onDragOver={(e) => {
            if (!selectedCid) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            if (!selectedCid) return;
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length > 0) void startUpload(e.dataTransfer.files);
          }}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
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
              <div className="flex items-center gap-2 shrink-0">
                {selectedCid && (
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="搜索当前目录..."
                      className="h-7 w-40 pl-6 text-xs"
                    />
                  </div>
                )}
                {selectedCid && (
                  <Badge variant="secondary" className="text-[10px] font-mono-data">
                    {search ? `${visibleFiles.length}/${files.length}` : files.length} 项
                  </Badge>
                )}
              </div>
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
                  <button
                    onClick={() => toggleSort('name')}
                    className="col-span-6 flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    名称
                    {sortKey === 'name' && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => toggleSort('size')}
                    className="col-span-2 flex items-center justify-end gap-1 hover:text-foreground transition-colors"
                  >
                    大小
                    {sortKey === 'size' && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => toggleSort('datetime')}
                    className="col-span-3 flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    修改时间
                    {sortKey === 'datetime' && <ArrowUpDown className="h-3 w-3" />}
                  </button>
                  <div className="col-span-1"></div>
                </div>

                {visibleFiles.length === 0 ? (
                  <div className="flex items-center justify-center h-[350px]">
                    {search ? (
                      <EmptyState icon={Search} title="没有匹配的文件" description={`当前目录中没有名称包含「${search}」的条目。`} />
                    ) : (
                      <EmptyState
                        icon={FolderOpen}
                        title="空目录"
                        description="此目录中没有文件，可拖拽文件到此处上传。"
                      />
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {visibleFiles.map((file) => {
                      const isDir = file.type === 0;
                      return (
                        <div
                          key={file.name}
                          className={cn(
                            'grid grid-cols-12 gap-2 px-4 py-2 text-sm items-center group hover:bg-muted/20 transition-colors',
                            isDir && 'cursor-pointer',
                          )}
                          onClick={() => navigateTo(file)}
                        >
                          <div className="col-span-6 flex items-center gap-2 min-w-0">
                            {isDir ? (
                              <Folder className="h-4 w-4 text-primary/70 shrink-0" />
                            ) : (
                              <File className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="truncate">{file.name}</span>
                          </div>
                          <div className="col-span-2 text-right text-xs text-muted-foreground font-mono-data">
                            {isDir ? '-' : formatBytes(file.size)}
                          </div>
                          <div className="col-span-3 text-xs text-muted-foreground font-mono-data">
                            {formatDate(file.datetime)}
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                {!isDir && (
                                  <DropdownMenuItem onClick={() => handleDownload(file)}>
                                    <Download className="h-3.5 w-3.5 mr-2" /> 下载
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setRenameTarget(file);
                                    setRenameValue(file.name);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-2" /> 重命名
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setMoveTarget(file);
                                    setMoveCid(String(selectedCid));
                                    setMovePath('/');
                                  }}
                                >
                                  <MoveRight className="h-3.5 w-3.5 mr-2" /> 移动到...
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteTarget(file)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" /> 删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            )}
          </CardContent>
          {dragging && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-primary/10 border-2 border-dashed border-primary pointer-events-none">
              <Upload className="h-8 w-8 text-primary" />
              <p className="text-sm font-medium text-primary">松开鼠标即可上传到 {currentPath}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Upload queue */}
      {uploads.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              上传队列（{uploads.filter((t) => t.status === 'done').length}/{uploads.length}）
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearFinished}>
              清除已完成
            </Button>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {uploads.map((task) => (
              <div key={task.id} className="flex items-center gap-3 text-xs">
                <span className="flex-1 truncate">{task.file.name}</span>
                <span className="text-muted-foreground font-mono-data w-16 text-right">
                  {formatBytes(task.file.size)}
                </span>
                <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all',
                      task.status === 'error' ? 'bg-destructive' : 'bg-primary',
                    )}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <span
                  className={cn(
                    'w-24 text-right',
                    task.status === 'error' ? 'text-destructive' : 'text-muted-foreground',
                  )}
                >
                  {task.status === 'pending' && '等待中'}
                  {task.status === 'uploading' && `${task.progress}%`}
                  {task.status === 'done' && '已完成'}
                  {task.status === 'error' && (task.error || '失败')}
                </span>
                {task.status === 'error' && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => retryUpload(task)}>
                    重试
                  </Button>
                )}
                <button
                  onClick={() => setUploads((prev) => prev.filter((t) => t.id !== task.id))}
                  className="p-0.5 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Info notice */}
      <p className="text-xs text-muted-foreground text-center">
        文件名只能使用英文字母、数字、空格和常见符号 —— TeamSpeak 文件系统不支持中文文件名，但文件内容不受影响。
      </p>

      {/* Create Directory Dialog */}
      <Dialog open={showMkdir} onOpenChange={setShowMkdir}>
        <DialogContent>
          <DialogHeader><DialogTitle>创建目录</DialogTitle></DialogHeader>
          <div>
            <Label className="text-xs">目录名称</Label>
            <Input
              value={newDirName}
              onChange={(e) => setNewDirName(e.target.value)}
              placeholder="新建文件夹"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleMkdir(); }}
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              将创建在 {currentPath} 下，只能使用英文字母、数字、空格和常见符号。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMkdir(false)}>取消</Button>
            <Button onClick={handleMkdir} disabled={mkdirMutation.isPending || !newDirName.trim()}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => { if (!open) setRenameTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>重命名</DialogTitle></DialogHeader>
          <div>
            <Label className="text-xs">新名称</Label>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
            />
            <p className="text-[10px] text-muted-foreground mt-1.5 min-w-0">
              <span className="block truncate" title={renameTarget?.name}>原名：{renameTarget?.name}</span>
              只能使用英文字母、数字、空格和常见符号。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>取消</Button>
            <Button
              onClick={handleRename}
              disabled={
                renameMutation.isPending ||
                !renameValue.trim() ||
                renameValue.trim() === baseName(renameTarget?.name || '')
              }
            >
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={!!moveTarget} onOpenChange={(open) => { if (!open) setMoveTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="pr-6">移动</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">要移动的项目</p>
              <p className="text-sm font-mono-data truncate" title={moveTarget?.name}>
                {moveTarget?.name}
              </p>
            </div>
            <div>
              <Label className="text-xs">目标频道</Label>
              <Select
                value={moveCid}
                onValueChange={(v) => { setMoveCid(v); setMovePath('/'); }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="选择目标频道" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((ch) => (
                    <SelectItem key={ch.cid} value={String(ch.cid)}>
                      {ch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">目标目录</Label>
              <div className="rounded-md border border-border">
                <div className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground border-b border-border">
                  <button onClick={() => setMovePath('/')} className="hover:text-foreground transition-colors">/</button>
                  {movePath.split('/').filter(Boolean).map((part, i, arr) => (
                    <span key={i} className="flex items-center gap-1 min-w-0">
                      <span>/</span>
                      <button
                        onClick={() => setMovePath('/' + arr.slice(0, i + 1).join('/'))}
                        className="hover:text-foreground transition-colors truncate max-w-[7rem]"
                        title={part}
                      >
                        {part}
                      </button>
                    </span>
                  ))}
                </div>
                <ScrollArea className="h-40">
                  <div className="p-1">
                    {movePath !== '/' && (
                      <button
                        onClick={() => {
                          const parts = movePath.split('/').filter(Boolean);
                          parts.pop();
                          setMovePath(parts.length === 0 ? '/' : '/' + parts.join('/'));
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                      >
                        <ArrowLeft className="h-3.5 w-3.5 shrink-0" /> 返回上级
                      </button>
                    )}
                    {loadingMoveDir ? (
                      <p className="text-xs text-muted-foreground text-center py-6">加载中...</p>
                    ) : moveSubDirs.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">此目录下没有子目录</p>
                    ) : (
                      moveSubDirs.map((dir) => (
                        <button
                          key={dir.name}
                          onClick={() => setMovePath(joinPath(movePath, dir.name))}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-foreground hover:bg-muted/50 transition-colors"
                        >
                          <Folder className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                          <span className="truncate text-left flex-1">{dir.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                将移动到 {channels.find((ch) => String(ch.cid) === moveCid)?.name || '目标频道'} 的 {movePath} 目录。
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveTarget(null)}>取消</Button>
            <Button onClick={handleMove} disabled={moveMutation.isPending || !moveCid}>
              移动
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="删除"
        description={`确定要删除「${deleteTarget?.name}」吗？此操作无法撤销。`}
        confirmLabel="删除"
        destructive
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
