import { useMemo, useState } from 'react';
import { useChannels, useCreateChannel, useDeleteChannel, useEditChannel, useMoveChannel } from '@/hooks/use-channels';
import { useClients, useMoveClient } from '@/hooks/use-clients';
import { useServerStore } from '@/stores/server.store';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, isForbiddenError } from '@/lib/utils';
import { Hash, Plus, Trash2, Pencil, ChevronRight, ChevronDown, Users, Lock, Volume2, GripVertical, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface ChannelNode {
  cid: number;
  pid: number;
  channel_name: string;
  channel_topic: string;
  total_clients: number;
  channel_flag_permanent: number;
  channel_flag_password: number;
  channel_codec_quality: number;
  /** TeamSpeak 的排序值，稀疏且不连续，只能用来作为「插到某个兄弟之前」的参照 */
  channel_order: number;
  children: ChannelNode[];
}

interface ClientInfo {
  clid: number;
  cid: number;
  client_nickname: string;
  client_type: string;
  client_away: number;
  client_input_muted: number;
}

/** 拖拽落点：放在目标之前、拖进目标内部、放在目标之后 */
type DropPosition = 'before' | 'inside' | 'after';

/** 每一级缩进的像素宽度 */
const INDENT = 20;

/** 树形行高，比原先高一档，方便点击与拖拽 */
const ROW_PADDING = 'py-2';

/**
 * 拖动客户端时额外写入的自定义 MIME 类型。
 * dragover 阶段浏览器不允许读取 getData，只能靠 types 区分「正在拖的是频道还是客户端」。
 */
const CLIENT_DRAG_TYPE = 'application/x-ts6-client';

function buildTree(channels: any[]): ChannelNode[] {
  const normalized = channels.map((ch) => ({
    ...ch,
    cid: Number(ch.cid),
    pid: Number(ch.pid),
    total_clients: Number(ch.total_clients) || 0,
    channel_flag_permanent: Number(ch.channel_flag_permanent) || 0,
    channel_flag_password: Number(ch.channel_flag_password) || 0,
    channel_codec_quality: Number(ch.channel_codec_quality) || 0,
    channel_order: Number(ch.channel_order) || 0,
    channel_topic: ch.channel_topic || '',
  }));
  const map = new Map<number, ChannelNode>();
  const roots: ChannelNode[] = [];
  normalized.forEach((ch) => map.set(ch.cid, { ...ch, children: [] }));
  normalized.forEach((ch) => {
    const node = map.get(ch.cid)!;
    if (ch.pid === 0) roots.push(node);
    else map.get(ch.pid)?.children.push(node);
  });
  // 按服务端返回的 order 排序，保证界面顺序与 TeamSpeak 一致
  const byOrder = (a: ChannelNode, b: ChannelNode) => a.channel_order - b.channel_order;
  roots.sort(byOrder);
  map.forEach((node) => node.children.sort(byOrder));
  return roots;
}

/** 判断当前正在拖的是频道还是客户端（dragover 阶段只能读 types，读不到 data） */
const isClientDrag = (e: React.DragEvent) => e.dataTransfer.types.includes(CLIENT_DRAG_TYPE);

interface ClientEntryProps {
  client: ClientInfo;
  depth: number;
  /** 该客户端所在频道的 cid，拖到客户端行上等价于成为该频道的子频道 */
  parentCid: number;
  draggable: boolean;
  draggedCid: number | null;
  canDropInto: (targetCid: number) => boolean;
  onDropInto: (draggedCid: number, targetCid: number) => void;
  /** 正在被拖动的客户端 clid（null 表示没在拖客户端） */
  draggedClid: number | null;
  /** 正在被拖动的客户端当前所在频道 cid */
  draggedClientCid: number | null;
  onClientDragStart: (clid: number) => void;
  onClientDragEnd: () => void;
  /** 把客户端移动到某个频道 */
  onClientDrop: (clid: number, targetCid: number) => void;
}

/**
 * 频道下的客户端行。它同时是两种拖拽的落点：
 * 把频道拖到「频道行与它下面的客户端之间」时，语义等同于放进该频道内部；
 * 把客户端拖到任意客户端行上时，语义等同于把该客户端移进这个频道。
 * 它本身也可以被拖动，用来切换客户端所在频道。
 */
function ClientEntry({
  client, depth, parentCid, draggable, draggedCid, canDropInto, onDropInto,
  draggedClid, draggedClientCid, onClientDragStart, onClientDragEnd, onClientDrop,
}: ClientEntryProps) {
  const [over, setOver] = useState(false);
  const channelDroppable = draggable && !!draggedCid && canDropInto(parentCid);
  const clientDroppable = draggable && !!draggedClid && draggedClientCid !== parentCid;
  const isDraggedClient = draggedClid === client.clid;

  const handleDragOver = (e: React.DragEvent) => {
    if (isClientDrag(e)) {
      if (!clientDroppable) return;
    } else if (!channelDroppable) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOver(false);
    if (isClientDrag(e)) {
      if (!clientDroppable) return;
      const clid = Number(e.dataTransfer.getData(CLIENT_DRAG_TYPE));
      if (!clid || draggedClientCid === parentCid) return;
      onClientDrop(clid, parentCid);
      return;
    }
    if (!channelDroppable) return;
    const cid = Number(e.dataTransfer.getData('text/plain'));
    if (!cid || cid === parentCid) return;
    onDropInto(cid, parentCid);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) return;
    e.stopPropagation();
    e.dataTransfer.setData(CLIENT_DRAG_TYPE, String(client.clid));
    e.dataTransfer.effectAllowed = 'move';
    onClientDragStart(client.clid);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setOver(false);
    onClientDragEnd();
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 py-1.5 px-2 text-[13px] text-muted-foreground transition-colors group/client rounded-md',
        draggable && 'cursor-grab active:cursor-grabbing',
        over && 'bg-primary/15 ring-1 ring-primary/40',
        isDraggedClient && 'opacity-40',
      )}
      style={{ paddingLeft: `${depth * INDENT + 36}px` }}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnter={handleDragOver}
    >
      {draggable && (
        <GripVertical className="h-3 w-3 text-muted-foreground/30 shrink-0 -ml-1 opacity-0 group-hover/client:opacity-100 transition-opacity" />
      )}
      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-mono-data text-primary shrink-0">
        {client.client_nickname?.[0]?.toUpperCase() || '?'}
      </div>
      <span className="truncate">{client.client_nickname}</span>
      {client.client_away === 1 && <Badge variant="warning" className="text-[9px] px-1.5 py-0 h-4">离开</Badge>}
      {client.client_input_muted === 1 && !client.client_away && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">静音</Badge>}
    </div>
  );
}

interface TreeNodeProps {
  node: ChannelNode;
  depth?: number;
  /** 在兄弟节点中的序号，用于计算插入位置 */
  index: number;
  /** 父频道 cid，顶层为 0 */
  parentCid: number;
  /** 下一个兄弟频道的 order 值；已经是最后一个时为 null */
  nextOrder: number | null;
  isAdmin: boolean;
  clientsByChannel: Map<number, ClientInfo[]>;
  onDelete: (cid: number, name: string) => void;
  onEdit: (node: ChannelNode) => void;
  /**
   * 移动频道。
   * @param newPid 目标父频道 cid
   * @param beforeOrder 插到哪个 order 值之前；为 null 表示不调整顺序（只换父级）
   */
  onDrop: (draggedCid: number, newPid: number, beforeOrder: number | null) => void;
  draggedCid: number | null;
  setDraggedCid: (cid: number | null) => void;
  canDropInto: (targetCid: number) => boolean;
  /** 正在被拖动的客户端 clid 与它当前所在频道 */
  draggedClid: number | null;
  draggedClientCid: number | null;
  onClientDragStart: (clid: number) => void;
  onClientDragEnd: () => void;
  /** 把客户端移进某个频道 */
  onClientDrop: (clid: number, targetCid: number) => void;
}

function ChannelTreeNode({
  node, depth = 0, index, parentCid, nextOrder, isAdmin, clientsByChannel,
  onDelete, onEdit, onDrop, draggedCid, setDraggedCid, canDropInto,
  draggedClid, draggedClientCid, onClientDragStart, onClientDragEnd, onClientDrop,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [dropPos, setDropPos] = useState<DropPosition | null>(null);
  const [clientOver, setClientOver] = useState(false);
  const hasChildren = node.children.length > 0;
  const clients = clientsByChannel.get(node.cid) || [];
  const hasContent = hasChildren || clients.length > 0;
  const isSpacer = node.channel_name.startsWith('[spacer') || node.channel_name.startsWith('[*spacer');
  const isDragged = draggedCid === node.cid;

  if (isSpacer) {
    return (
      <div style={{ paddingLeft: `${depth * INDENT + 8}px` }}>
        <div className="border-t border-border/40 my-2" />
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(node.cid));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedCid(node.cid);
  };
  /**
   * 根据鼠标在行内的纵向位置判断落点：
   * 上沿 30% 放到目标之前，下沿 30% 放到目标之后，中间 40% 表示拖进目标内部。
   * 上沿/下沿让频道能升到目标的同级，从而把频道从子层级里拖出来。
   */
  const computePosition = (e: React.DragEvent): DropPosition => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = e.clientY - rect.top;
    const ratio = offset / rect.height;
    if (ratio < 0.3) return 'before';
    if (ratio > 0.7) return 'after';
    return 'inside';
  };

  /** 拖客户端进来：任意频道都可以作为目标，只要不是它当前所在的频道 */
  const clientDroppable = isAdmin && !!draggedClid && draggedClientCid !== node.cid;

  const handleDragOver = (e: React.DragEvent) => {
    if (isClientDrag(e)) {
      if (!clientDroppable) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      // 客户端只能在频道之间平移，没有「之前/之后」的语义，落点统一按「移入」处理
      setDropPos(null);
      setClientOver(true);
      return;
    }
    setClientOver(false);
    if (!draggedCid || isDragged) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const pos = computePosition(e);
    if (pos === 'inside' && !canDropInto(node.cid)) {
      setDropPos(null);
      return;
    }
    setDropPos(pos);
  };

  const handleDragLeave = () => {
    setDropPos(null);
    setClientOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isClientDrag(e)) {
      setClientOver(false);
      setDropPos(null);
      if (!clientDroppable) return;
      const clid = Number(e.dataTransfer.getData(CLIENT_DRAG_TYPE));
      if (!clid || draggedClientCid === node.cid) return;
      onClientDrop(clid, node.cid);
      setExpanded(true);
      return;
    }

    const pos = dropPos;
    setDropPos(null);
    setClientOver(false);
    const cid = Number(e.dataTransfer.getData('text/plain'));
    if (!cid || cid === node.cid || !pos) return;

    if (pos === 'inside') {
      // 成为子频道；服务端会把新子频道放在最前面，不再额外调整顺序
      onDrop(cid, node.cid, null);
      setExpanded(true);
    } else if (pos === 'before') {
      onDrop(cid, parentCid, node.channel_order);
    } else {
      // 放到目标之后 = 插到下一个兄弟之前；目标已是最后一个时退回目标自身的 order
      onDrop(cid, parentCid, nextOrder ?? node.channel_order);
    }
  };

  const handleDragEnd = () => {
    setDraggedCid(null);
    setDropPos(null);
    setClientOver(false);
    onClientDragEnd();
  };

  return (
    <div>
      <div className="relative">
        {/* 放到目标之前 */}
        {dropPos === 'before' && (
          <div
            className="absolute top-0 h-0.5 bg-primary rounded-full z-10"
            style={{ left: `${depth * INDENT + 8}px`, right: '8px' }}
          />
        )}

        <div
          className={cn(
            'flex items-center gap-1.5 px-2.5 rounded-md hover:bg-muted/30 transition-colors group text-sm',
            ROW_PADDING,
            isAdmin && 'cursor-grab active:cursor-grabbing',
            dropPos === 'inside' && 'bg-primary/15 ring-2 ring-primary/50',
            clientOver && 'bg-primary/20 ring-2 ring-primary/50',
            isDragged && 'opacity-40',
          )}
          style={{ paddingLeft: `${depth * INDENT + 10}px` }}
          draggable={isAdmin}
          onDragStart={isAdmin ? handleDragStart : undefined}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        >
          {isAdmin && (
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}

          {hasContent ? (
            <button onClick={() => setExpanded(!expanded)} className="p-0.5 hover:bg-muted rounded shrink-0">
              {expanded
                ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          <Hash className="h-4 w-4 text-primary/70 shrink-0" />

          <span className="truncate flex-1 font-medium">{node.channel_name}</span>

          <span className="text-[11px] font-mono-data text-muted-foreground/50 shrink-0">#{node.cid}</span>

          {isAdmin && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => onEdit(node)}
                title="编辑频道"
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(node.cid, node.channel_name)}
                title="删除频道"
                className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-1 shrink-0">
            {node.channel_flag_password === 1 && <Lock className="h-3.5 w-3.5 text-amber-400/60" />}
            {(node.total_clients > 0 || clients.length > 0) && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono-data">
                <Users className="h-3.5 w-3.5" />
                {clients.length || node.total_clients}
              </span>
            )}
          </div>
        </div>

        {/* 放到目标之后 */}
        {dropPos === 'after' && (
          <div
            className="absolute bottom-0 h-0.5 bg-primary rounded-full z-10"
            style={{ left: `${depth * INDENT + 8}px`, right: '8px' }}
          />
        )}
      </div>

      {expanded && (
        <>
          {clients.map((client) => (
            <ClientEntry
              key={client.clid}
              client={client}
              depth={depth + 1}
              parentCid={node.cid}
              draggable={isAdmin}
              draggedCid={draggedCid}
              canDropInto={canDropInto}
              onDropInto={(cid, targetCid) => onDrop(cid, targetCid, null)}
              draggedClid={draggedClid}
              draggedClientCid={draggedClientCid}
              onClientDragStart={onClientDragStart}
              onClientDragEnd={onClientDragEnd}
              onClientDrop={onClientDrop}
            />
          ))}
          {node.children.map((child, i) => (
            <ChannelTreeNode
              key={child.cid}
              node={child}
              depth={depth + 1}
              index={i}
              parentCid={node.cid}
              nextOrder={node.children[i + 1]?.channel_order ?? null}
              isAdmin={isAdmin}
              clientsByChannel={clientsByChannel}
              onDelete={onDelete}
              onEdit={onEdit}
              onDrop={onDrop}
              draggedCid={draggedCid}
              setDraggedCid={setDraggedCid}
              canDropInto={canDropInto}
              draggedClid={draggedClid}
              draggedClientCid={draggedClientCid}
              onClientDragStart={onClientDragStart}
              onClientDragEnd={onClientDragEnd}
              onClientDrop={onClientDrop}
            />
          ))}
        </>
      )}
    </div>
  );
}

export default function Channels() {
  const { selectedConfigId, selectedSid } = useServerStore();
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const { data: channelData, isLoading: channelsLoading, error: channelsError } = useChannels();
  const { data: clientData } = useClients();
  const createChannel = useCreateChannel();
  const deleteChannel = useDeleteChannel();
  const editChannel = useEditChannel();
  const moveChannel = useMoveChannel();
  const moveClient = useMoveClient();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ cid: number; name: string } | null>(null);
  const [editTarget, setEditTarget] = useState<ChannelNode | null>(null);
  const [editForm, setEditForm] = useState({ channel_name: '', channel_topic: '', channel_password: '' });
  const [newName, setNewName] = useState('');
  const [draggedCid, setDraggedCid] = useState<number | null>(null);
  const [draggedClid, setDraggedClid] = useState<number | null>(null);

  const tree = useMemo(() => {
    if (!channelData || !Array.isArray(channelData)) return [];
    return buildTree(channelData);
  }, [channelData]);

  /** cid → 父 cid 的映射，用于判断层级关系 */
  const parentOf = useMemo(() => {
    const map = new Map<number, number>();
    if (Array.isArray(channelData)) {
      for (const ch of channelData) map.set(Number(ch.cid), Number(ch.pid));
    }
    return map;
  }, [channelData]);

  /** target 是否是 dragged 的后代；是的话就不能把 dragged 拖进 target */
  const isDescendantOf = (targetCid: number, ancestorCid: number) => {
    let current = parentOf.get(targetCid);
    let guard = 0;
    while (current && guard++ < 200) {
      if (current === ancestorCid) return true;
      current = parentOf.get(current);
    }
    return false;
  };

  const canDropInto = (targetCid: number) => {
    if (!draggedCid) return false;
    if (targetCid === draggedCid) return false;
    return !isDescendantOf(targetCid, draggedCid);
  };

  const clientsByChannel = useMemo(() => {
    const map = new Map<number, ClientInfo[]>();
    if (!clientData || !Array.isArray(clientData)) return map;
    for (const c of clientData) {
      if (String(c.client_type) !== '0') continue;
      const cid = Number(c.cid);
      const entry: ClientInfo = {
        clid: Number(c.clid),
        cid,
        client_nickname: c.client_nickname || '?',
        client_type: String(c.client_type),
        client_away: Number(c.client_away) || 0,
        client_input_muted: Number(c.client_input_muted) || 0,
      };
      if (!map.has(cid)) map.set(cid, []);
      map.get(cid)!.push(entry);
    }
    return map;
  }, [clientData]);

  /** cid → 频道名，用于移动客户端后的提示文案 */
  const channelNameOf = (cid: number) => {
    if (!Array.isArray(channelData)) return `#${cid}`;
    const found = channelData.find((ch: any) => Number(ch.cid) === cid);
    return found?.channel_name || `#${cid}`;
  };

  /** 正在被拖动的客户端当前所在频道 */
  const draggedClientCid = useMemo(() => {
    if (!draggedClid) return null;
    for (const [cid, list] of clientsByChannel) {
      if (list.some((c) => c.clid === draggedClid)) return cid;
    }
    return null;
  }, [draggedClid, clientsByChannel]);

  if (!selectedConfigId || !selectedSid) return <EmptyState icon={Hash} title="未选择服务器" />;
  if (channelsLoading) return <PageLoader />;
  if (isForbiddenError(channelsError)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="无权访问该服务器"
        description="当前账号未被授予该服务器的访问权限，请联系管理员在「设置 → 用户」中为其分配可访问的服务器。"
      />
    );
  }

  const handleCreate = () => {
    if (!newName.trim()) return;
    createChannel.mutate({ channel_name: newName, channel_flag_permanent: 1 }, {
      onSuccess: () => { toast.success('频道已创建'); setShowCreate(false); setNewName(''); },
      onError: () => toast.error('创建频道失败'),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteChannel.mutate(deleteTarget.cid, {
      onSuccess: () => { toast.success('频道已删除'); setDeleteTarget(null); },
      onError: () => toast.error('删除频道失败'),
    });
  };

  const handleEditOpen = (node: ChannelNode) => {
    setEditTarget(node);
    setEditForm({ channel_name: node.channel_name, channel_topic: node.channel_topic || '', channel_password: '' });
  };

  const handleEditSave = () => {
    if (!editTarget || !editForm.channel_name.trim()) return;
    const data: any = { channel_name: editForm.channel_name };
    if (editForm.channel_topic !== undefined) data.channel_topic = editForm.channel_topic;
    if (editForm.channel_password) data.channel_password = editForm.channel_password;
    editChannel.mutate({ cid: editTarget.cid, data }, {
      onSuccess: () => { toast.success('频道已更新'); setEditTarget(null); },
      onError: () => toast.error('更新频道失败'),
    });
  };

  /**
   * 两步法移动频道：
   * 1. 父级变化时先发 `channelmove { cpid }`（TeamSpeak 跨父级时只接受不带 order 的调用，
   *    传了 order 会报 `779 invalid channel order`）。
   * 2. 需要调整同级顺序时再发 `channeledit { channel_order }`，语义是大致「占住该 order 的位置」。
   *    服务端对 channel_order 校验很严，失败（779）属于常态，因此顺序调整是 best-effort：
   *    父级变更成功就视为成功，顺序不生效时给出提示，但不把整次拖拽判为失败。
   */
  const handleDrop = (cid: number, newPid: number, beforeOrder: number | null) => {
    if (cid === newPid) return;
    if (newPid !== 0 && isDescendantOf(newPid, cid)) {
      toast.error('不能把频道移动到它自己的子频道下');
      return;
    }

    const currentPid = parentOf.get(cid) ?? 0;
    const pidChanged = currentPid !== newPid;
    const doneText = newPid === 0 ? '频道已移到顶层' : '频道已移动';

    // 既没有换父级、也没有顺序参考点 —— 落点与原位置相同，不做任何请求
    if (!pidChanged && beforeOrder === null) {
      setDraggedCid(null);
      return;
    }

    const applyOrder = () => {
      if (beforeOrder === null) {
        toast.success(doneText);
        return;
      }
      editChannel.mutate(
        { cid, data: { channel_order: beforeOrder } },
        {
          onSuccess: () => toast.success(doneText),
          onError: () => {
            if (pidChanged) toast.success(doneText);
            else toast.error('TeamSpeak 拒绝了该位置的排序调整，频道顺序未改变');
          },
        },
      );
    };

    setDraggedCid(null);

    if (!pidChanged) {
      applyOrder();
      return;
    }

    moveChannel.mutate(
      { cid, data: { cpid: newPid } },
      {
        onSuccess: applyOrder,
        onError: () => toast.error('移动频道失败'),
      },
    );
  };

  /** 拖动客户端到频道：直接调 clientmove 换频道，没有排序概念 */
  const handleClientDrop = (clid: number, targetCid: number) => {
    const entry = Array.from(clientsByChannel.values()).flat().find((c) => c.clid === clid);
    if (entry && entry.cid === targetCid) {
      toast('该客户端已在目标频道');
      setDraggedClid(null);
      return;
    }
    const nickname = entry?.client_nickname ?? '客户端';
    const channelName = channelNameOf(targetCid);
    moveClient.mutate(
      { clid, cid: targetCid },
      {
        onSuccess: () => toast.success(`已将「${nickname}」移到「${channelName}」`),
        onError: (err: any) => {
          const msg = err?.response?.data?.error || '移动客户端失败';
          toast.error(msg);
        },
      },
    );
    setDraggedClid(null);
  };

  const totalClients = clientsByChannel.size > 0
    ? Array.from(clientsByChannel.values()).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">频道</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {Array.isArray(channelData) ? channelData.length : 0} 个频道 · {totalClients} 个客户端在线
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> 创建频道
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-primary" />
              频道树
            </CardTitle>
            {isAdmin && (
              <span className="text-[11px] text-muted-foreground/70">
                拖动频道：悬停在目标上沿或下沿显示横线时放到同级，悬停中间（含该频道的用户列表）时设为子频道 · 拖动用户：放到目标频道上即可切换该用户所在频道
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-0">
              {tree.map((node, i) => (
                <ChannelTreeNode
                  key={node.cid}
                  node={node}
                  index={i}
                  parentCid={0}
                  nextOrder={tree[i + 1]?.channel_order ?? null}
                  isAdmin={isAdmin}
                  clientsByChannel={clientsByChannel}
                  onDelete={(cid, name) => setDeleteTarget({ cid, name })}
                  onEdit={handleEditOpen}
                  onDrop={handleDrop}
                  draggedCid={draggedCid}
                  setDraggedCid={setDraggedCid}
                  canDropInto={canDropInto}
                  draggedClid={draggedClid}
                  draggedClientCid={draggedClientCid}
                  onClientDragStart={setDraggedClid}
                  onClientDragEnd={() => setDraggedClid(null)}
                  onClientDrop={handleClientDrop}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建频道</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">频道名称</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="新建频道" autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={createChannel.isPending}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(v) => { if (!v) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑频道</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">频道名称</Label>
              <Input value={editForm.channel_name} onChange={(e) => setEditForm({ ...editForm, channel_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">主题</Label>
              <Input value={editForm.channel_topic} onChange={(e) => setEditForm({ ...editForm, channel_topic: e.target.value })} placeholder="可选" />
            </div>
            <div>
              <Label className="text-xs">密码</Label>
              <Input type="password" value={editForm.channel_password} onChange={(e) => setEditForm({ ...editForm, channel_password: e.target.value })} placeholder="留空则保持当前值" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>取消</Button>
            <Button onClick={handleEditSave} disabled={!editForm.channel_name.trim() || editChannel.isPending}>
              {editChannel.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="删除频道"
        description={`确定要删除「${deleteTarget?.name}」吗？此操作无法撤销。`}
        confirmLabel="删除"
        destructive
        onConfirm={handleDelete}
        loading={deleteChannel.isPending}
      />
    </div>
  );
}
