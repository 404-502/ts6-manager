import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBot, useUpdateBot } from '@/hooks/use-bots';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Save, HelpCircle, Zap, MessageSquare, Ban, UserX, ArrowRightLeft,
  Clock, GitBranch, Variable, FileText, Webhook, Terminal, Plus, Trash2,
  Bell, PenLine, FolderPlus, FolderMinus, Users, Globe, Send,
  Moon, Timer, Megaphone, Award, Shield,
  Music, Volume2, LogIn, LogOut, Pause, SkipForward, Navigation, Mic, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PlaceholderReference } from '@/components/bots/PlaceholderReference';
import { Textarea } from '@/components/ui/textarea';

// --- Node type definitions ---
type HandleConfig = {
  inputs: string[];   // named input ports
  outputs: string[];  // named output ports
};

interface NodeTypeDef {
  type: string;
  label: string;
  icon: React.ElementType;
  color: string;
  handles: HandleConfig;
}

const TRIGGER_NODES: NodeTypeDef[] = [
  { type: 'trigger_event', label: 'TS 事件', icon: Zap, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', handles: { inputs: [], outputs: ['out'] } },
  { type: 'trigger_cron', label: 'Cron 定时器', icon: Clock, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', handles: { inputs: [], outputs: ['out'] } },
  { type: 'trigger_webhook', label: 'Webhook', icon: Webhook, color: 'bg-violet-500/20 text-violet-400 border-violet-500/30', handles: { inputs: [], outputs: ['out'] } },
  { type: 'trigger_command', label: '聊天命令', icon: Terminal, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', handles: { inputs: [], outputs: ['out'] } },
];

const ACTION_NODES: NodeTypeDef[] = [
  { type: 'action_message', label: '发送消息', icon: MessageSquare, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_poke', label: '戳一戳客户端', icon: Bell, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_kick', label: '踢出客户端', icon: UserX, color: 'bg-red-500/20 text-red-400 border-red-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_ban', label: '封禁客户端', icon: Ban, color: 'bg-red-500/20 text-red-400 border-red-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_move', label: '移动客户端', icon: ArrowRightLeft, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_channelCreate', label: '创建频道', icon: FolderPlus, color: 'bg-green-500/20 text-green-400 border-green-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_channelEdit', label: '编辑频道', icon: PenLine, color: 'bg-green-500/20 text-green-400 border-green-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_channelDelete', label: '删除频道', icon: FolderMinus, color: 'bg-red-500/20 text-red-400 border-red-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_groupAdd', label: '加入服务器组', icon: Users, color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_groupRemove', label: '移出服务器组', icon: Users, color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_webquery', label: 'WebQuery', icon: Terminal, color: 'bg-sky-500/20 text-sky-400 border-sky-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_webhook', label: 'Webhook', icon: Send, color: 'bg-sky-500/20 text-sky-400 border-sky-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_httpRequest', label: 'HTTP 请求', icon: Globe, color: 'bg-sky-500/20 text-sky-400 border-sky-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
];

const VOICE_ACTION_NODES: NodeTypeDef[] = [
  { type: 'action_voicePlay', label: '语音播放', icon: Music, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_voiceStop', label: '停止播放', icon: Music, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_voiceJoinChannel', label: '加入语音频道', icon: LogIn, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_voiceLeaveChannel', label: '离开语音频道', icon: LogOut, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_voiceVolume', label: '语音音量', icon: Volume2, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_voicePauseResume', label: '语音暂停/继续', icon: Pause, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_voiceSkip', label: '语音跳过', icon: SkipForward, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_voiceSeek', label: '语音定位', icon: Navigation, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_voiceTts', label: '语音合成 TTS', icon: Mic, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
];

const SMART_ACTION_NODES: NodeTypeDef[] = [
  { type: 'action_afkMover', label: 'AFK 移动', icon: Moon, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_idleKicker', label: '闲置踢出', icon: Timer, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_pokeGroup', label: '戳一戳组', icon: Megaphone, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_rankCheck', label: '等级检查', icon: Award, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_tempChannelCleanup', label: '临时频道清理', icon: Trash2, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_animatedChannel', label: '动态频道', icon: Sparkles, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', handles: { inputs: [], outputs: [] } },
];

const LOGIC_NODES: NodeTypeDef[] = [
  { type: 'condition', label: '条件', icon: GitBranch, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', handles: { inputs: ['in'], outputs: ['true', 'false'] } },
  { type: 'delay', label: '延迟', icon: Clock, color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'variable', label: '设置变量', icon: Variable, color: 'bg-teal-500/20 text-teal-400 border-teal-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'log', label: '日志', icon: FileText, color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
  { type: 'action_generateCode', label: '生成代码', icon: Sparkles, color: 'bg-teal-500/20 text-teal-400 border-teal-500/30', handles: { inputs: ['in'], outputs: ['out'] } },
];

const ALL_NODE_TYPES: NodeTypeDef[] = [...TRIGGER_NODES, ...ACTION_NODES, ...VOICE_ACTION_NODES, ...SMART_ACTION_NODES, ...LOGIC_NODES];

const NODE_CATEGORIES = [
  { label: '触发器', nodes: TRIGGER_NODES },
  { label: '动作', nodes: ACTION_NODES },
  { label: '语音', nodes: VOICE_ACTION_NODES },
  { label: '智能动作', nodes: SMART_ACTION_NODES },
  { label: '逻辑', nodes: LOGIC_NODES },
];

function getNodeMeta(type: string): NodeTypeDef | undefined {
  return ALL_NODE_TYPES.find((n) => n.type === type);
}

// --- Constants ---
const NODE_W = 180;
const NODE_H = 64;
const HANDLE_R = 6;

// Calculate handle positions (absolute coords on canvas)
function getOutputHandlePos(node: FlowNode, portIndex: number, portCount: number) {
  const spacing = NODE_H / (portCount + 1);
  return { x: node.x + NODE_W, y: node.y + spacing * (portIndex + 1) };
}

function getInputHandlePos(node: FlowNode, portIndex: number, portCount: number) {
  const spacing = NODE_H / (portCount + 1);
  return { x: node.x, y: node.y + spacing * (portIndex + 1) };
}

// --- Types ---
interface FlowNode {
  id: string;
  type: string;
  label: string;
  config: Record<string, any>;
  x: number;
  y: number;
}

interface FlowEdge {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
}

export default function BotEditor() {
  const { botId } = useParams();
  const navigate = useNavigate();
  const { data: bot, isLoading } = useBot(botId ? parseInt(botId) : null);
  const updateBot = useUpdateBot();

  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [botName, setBotName] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // Drag state
  const [dragging, setDragging] = useState<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);

  // Connection state
  const [connectFrom, setConnectFrom] = useState<{ nodeId: string; port: string } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Load flow data
  useEffect(() => {
    if (bot) {
      setBotName(bot.name || '');
      try {
        const flow = typeof bot.flowData === 'string' ? JSON.parse(bot.flowData) : bot.flowData;
        const loadedNodes: FlowNode[] = flow?.nodes || [];
        const loadedEdges: FlowEdge[] = (flow?.edges || []).map((e: any) => ({
          ...e,
          sourcePort: e.sourcePort || 'out',
          targetPort: e.targetPort || 'in',
        }));
        setNodes(loadedNodes);
        setEdges(loadedEdges);
      } catch {
        setNodes([]);
        setEdges([]);
      }
    }
  }, [bot]);

  const handleSave = () => {
    if (!botId) return;
    updateBot.mutate({
      id: parseInt(botId),
      data: { name: botName, flowData: { nodes, edges } },
    }, {
      onSuccess: () => toast.success('流程已保存'),
      onError: () => toast.error('保存流程失败'),
    });
  };

  const addNode = (type: string, label: string) => {
    const id = `node_${Date.now()}`;
    setNodes((prev) => [...prev, { id, type, label, config: {}, x: 220 + Math.random() * 200, y: 80 + prev.length * 90 }]);
    setSelectedNode(id);
  };

  const deleteNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
    if (selectedNode === id) setSelectedNode(null);
  };

  const deleteEdge = (id: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== id));
  };

  // --- Canvas mouse handlers ---
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
    const y = e.clientY - rect.top + e.currentTarget.scrollTop;

    if (connectFrom) {
      setMousePos({ x, y });
    }

    if (dragging) {
      didDragRef.current = true;
      setNodes((prev) => prev.map((n) =>
        n.id === dragging
          ? { ...n, x: Math.max(0, x - dragOffsetRef.current.x), y: Math.max(0, y - dragOffsetRef.current.y) }
          : n
      ));
    }
  }, [dragging, connectFrom]);

  const handleCanvasMouseUp = useCallback((e: React.MouseEvent) => {
    setDragging(null);

    // If connecting: check if we released on a valid target
    if (connectFrom) {
      const target = (e.target as HTMLElement).closest('[data-input-port]') as HTMLElement | null;
      const targetNode = (e.target as HTMLElement).closest('.flow-node') as HTMLElement | null;

      if (target) {
        // Released on an input handle
        const nodeId = target.getAttribute('data-node-id')!;
        const port = target.getAttribute('data-input-port')!;
        if (connectFrom.nodeId !== nodeId) {
          const exists = edges.some((ed) => ed.source === connectFrom.nodeId && ed.sourcePort === connectFrom.port && ed.target === nodeId);
          if (!exists) {
            setEdges((prev) => [...prev, {
              id: `edge_${Date.now()}`,
              source: connectFrom.nodeId,
              sourcePort: connectFrom.port,
              target: nodeId,
              targetPort: port,
            }]);
          }
        }
        setConnectFrom(null);
      } else if (targetNode) {
        // Released on a node body — connect to first input if available
        const nodeId = targetNode.getAttribute('data-node-id');
        if (nodeId && connectFrom.nodeId !== nodeId) {
          const targetMeta = getNodeMeta(nodes.find((n) => n.id === nodeId)?.type || '');
          if (targetMeta && targetMeta.handles.inputs.length > 0) {
            const targetPort = targetMeta.handles.inputs[0];
            const exists = edges.some((ed) => ed.source === connectFrom.nodeId && ed.sourcePort === connectFrom.port && ed.target === nodeId);
            if (!exists) {
              setEdges((prev) => [...prev, {
                id: `edge_${Date.now()}`,
                source: connectFrom.nodeId,
                sourcePort: connectFrom.port,
                target: nodeId,
                targetPort,
              }]);
            }
          }
        }
        setConnectFrom(null);
      } else {
        // Released on empty canvas — cancel
        setConnectFrom(null);
      }
    }
  }, [connectFrom, nodes, edges]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if we clicked directly on the canvas (not on a node)
    if ((e.target as HTMLElement).closest('.flow-node')) return;
    setSelectedNode(null);
    setConnectFrom(null); // Cancel active connection on empty canvas click
  }, []);

  // --- Node mouse handlers ---
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (connectFrom) return; // Don't start drag while connecting

    const canvas = (e.currentTarget as HTMLElement).closest('.flow-canvas')!;
    const rect = canvas.getBoundingClientRect();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const mx = e.clientX - rect.left + canvas.scrollLeft;
    const my = e.clientY - rect.top + canvas.scrollTop;

    dragOffsetRef.current = { x: mx - node.x, y: my - node.y };
    didDragRef.current = false;
    setDragging(nodeId);
  }, [nodes, connectFrom]);

  const handleNodeClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();

    // If connecting, complete the connection to this node's input
    if (connectFrom) {
      const targetMeta = getNodeMeta(nodes.find((n) => n.id === nodeId)?.type || '');
      if (connectFrom.nodeId !== nodeId && targetMeta && targetMeta.handles.inputs.length > 0) {
        const targetPort = targetMeta.handles.inputs[0];
        // Don't allow duplicate edges
        const exists = edges.some((e) => e.source === connectFrom.nodeId && e.sourcePort === connectFrom.port && e.target === nodeId);
        if (!exists) {
          setEdges((prev) => [...prev, {
            id: `edge_${Date.now()}`,
            source: connectFrom.nodeId,
            sourcePort: connectFrom.port,
            target: nodeId,
            targetPort,
          }]);
        }
      }
      setConnectFrom(null);
      return;
    }

    // Select (only if not finishing a drag)
    if (!didDragRef.current) {
      setSelectedNode(nodeId);
    }
  }, [connectFrom, nodes, edges]);

  // --- Output handle click: start connection ---
  const handleOutputClick = useCallback((e: React.MouseEvent, nodeId: string, port: string) => {
    e.stopPropagation();
    e.preventDefault();
    const canvas = (e.currentTarget as HTMLElement).closest('.flow-canvas')!;
    const rect = canvas.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left + canvas.scrollLeft,
      y: e.clientY - rect.top + canvas.scrollTop,
    });
    setConnectFrom({ nodeId, port });
  }, []);

  // --- Input handle click: complete connection ---
  const handleInputClick = useCallback((e: React.MouseEvent, nodeId: string, port: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (connectFrom && connectFrom.nodeId !== nodeId) {
      const exists = edges.some((ed) => ed.source === connectFrom.nodeId && ed.sourcePort === connectFrom.port && ed.target === nodeId);
      if (!exists) {
        setEdges((prev) => [...prev, {
          id: `edge_${Date.now()}`,
          source: connectFrom.nodeId,
          sourcePort: connectFrom.port,
          target: nodeId,
          targetPort: port,
        }]);
      }
      setConnectFrom(null);
    }
  }, [connectFrom, edges]);

  const selectedNodeData = useMemo(() => nodes.find((n) => n.id === selectedNode), [nodes, selectedNode]);
  const nodeTypeMeta = useMemo(() => getNodeMeta(selectedNodeData?.type || ''), [selectedNodeData]);

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/bots')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input value={botName} onChange={(e) => setBotName(e.target.value)} className="h-8 w-60 text-sm font-medium" />
          <Badge variant="outline" className="text-[10px]">{nodes.length} 个节点</Badge>
          <Badge variant="outline" className="text-[10px]">{edges.length} 条连线</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowHelp(true)} title="占位符参考">
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={handleSave} disabled={updateBot.isPending}>
            <Save className="h-4 w-4 mr-1" /> 保存
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-0 overflow-hidden rounded-lg border border-border">
        {/* Node Palette */}
        <div className="w-52 border-r border-border bg-card/50 shrink-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {NODE_CATEGORIES.map((cat) => (
                <div key={cat.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">{cat.label}</p>
                  <div className="space-y-1">
                    {cat.nodes.map((node) => (
                      <button
                        key={node.type}
                        className={cn('w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs border transition-colors hover:opacity-80', node.color)}
                        onClick={() => addNode(node.type, node.label)}
                      >
                        <node.icon className="h-3.5 w-3.5 shrink-0" />
                        <span>{node.label}</span>
                        <Plus className="h-3 w-3 ml-auto opacity-50" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Canvas */}
        <div
          className="flex-1 relative bg-zinc-950/30 overflow-auto flow-canvas"
          style={{
            cursor: connectFrom ? 'crosshair' : 'default',
            backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onClick={handleCanvasClick}
        >
          <svg className="absolute inset-0 pointer-events-none" style={{ minWidth: 2000, minHeight: 1200, width: '100%', height: '100%' }}>
            {/* Edges */}
            {edges.map((edge) => {
              const srcNode = nodes.find((n) => n.id === edge.source);
              const tgtNode = nodes.find((n) => n.id === edge.target);
              if (!srcNode || !tgtNode) return null;

              const srcMeta = getNodeMeta(srcNode.type);
              const tgtMeta = getNodeMeta(tgtNode.type);
              if (!srcMeta || !tgtMeta) return null;

              const srcPortIdx = srcMeta.handles.outputs.indexOf(edge.sourcePort);
              const tgtPortIdx = tgtMeta.handles.inputs.indexOf(edge.targetPort);
              if (srcPortIdx < 0 || tgtPortIdx < 0) return null;

              const src = getOutputHandlePos(srcNode, srcPortIdx, srcMeta.handles.outputs.length);
              const tgt = getInputHandlePos(tgtNode, tgtPortIdx, tgtMeta.handles.inputs.length);

              const dx = Math.abs(tgt.x - src.x) * 0.5;
              const isConditionTrue = edge.sourcePort === 'true';
              const isConditionFalse = edge.sourcePort === 'false';

              return (
                <g key={edge.id} className="pointer-events-auto cursor-pointer" onClick={(ev) => { ev.stopPropagation(); deleteEdge(edge.id); }}>
                  <path
                    d={`M ${src.x} ${src.y} C ${src.x + dx} ${src.y}, ${tgt.x - dx} ${tgt.y}, ${tgt.x} ${tgt.y}`}
                    fill="none"
                    stroke={isConditionTrue ? '#22c55e' : isConditionFalse ? '#ef4444' : 'hsl(var(--primary))'}
                    strokeWidth={2}
                    strokeOpacity={0.5}
                  />
                  {/* Invisible wider path for easier click */}
                  <path
                    d={`M ${src.x} ${src.y} C ${src.x + dx} ${src.y}, ${tgt.x - dx} ${tgt.y}, ${tgt.x} ${tgt.y}`}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={12}
                  />
                  {/* Arrow at target */}
                  <circle cx={tgt.x} cy={tgt.y} r={3}
                    fill={isConditionTrue ? '#22c55e' : isConditionFalse ? '#ef4444' : 'hsl(var(--primary))'}
                    fillOpacity={0.8}
                  />
                </g>
              );
            })}

            {/* Connection drag preview */}
            {connectFrom && (() => {
              const srcNode = nodes.find((n) => n.id === connectFrom.nodeId);
              const srcMeta = srcNode ? getNodeMeta(srcNode.type) : null;
              if (!srcNode || !srcMeta) return null;
              const idx = srcMeta.handles.outputs.indexOf(connectFrom.port);
              if (idx < 0) return null;
              const src = getOutputHandlePos(srcNode, idx, srcMeta.handles.outputs.length);
              const dx = Math.abs(mousePos.x - src.x) * 0.4;
              return (
                <path
                  d={`M ${src.x} ${src.y} C ${src.x + dx} ${src.y}, ${mousePos.x - dx} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  strokeOpacity={0.7}
                />
              );
            })()}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const meta = getNodeMeta(node.type);
            if (!meta) return null;
            const Icon = meta.icon;
            const hasInputs = meta.handles.inputs.length > 0;
            const outputs = meta.handles.outputs;

            return (
              <div
                key={node.id}
                data-node-id={node.id}
                className={cn(
                  'flow-node absolute rounded-lg border bg-card/95 backdrop-blur-sm shadow-sm select-none transition-shadow',
                  selectedNode === node.id ? 'border-primary ring-1 ring-primary/30 shadow-md' : 'border-border hover:border-muted-foreground/30',
                  dragging === node.id ? 'cursor-grabbing shadow-lg z-20' : 'cursor-grab z-10',
                )}
                style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={(e) => handleNodeClick(e, node.id)}
              >
                {/* Header */}
                <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-b border-border', meta.color)}>
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs font-medium truncate">{node.label}</span>
                </div>
                {/* Body */}
                <div className="px-3 py-1.5">
                  <p className="text-[10px] text-muted-foreground truncate">{node.type.replace(/_/g, ' ')}</p>
                </div>

                {/* Input handle(s) - left side */}
                {hasInputs && meta.handles.inputs.map((port, i) => {
                  const pos = getInputHandlePos(node, i, meta.handles.inputs.length);
                  return (
                    <div
                      key={`in-${port}`}
                      data-input-port={port}
                      data-node-id={node.id}
                      className={cn(
                        'absolute rounded-full border-2 border-card transition-colors z-30',
                        connectFrom ? 'bg-primary hover:bg-primary scale-125' : 'bg-muted-foreground/50 hover:bg-primary',
                      )}
                      style={{
                        left: -HANDLE_R,
                        top: (pos.y - node.y) - HANDLE_R,
                        width: HANDLE_R * 2,
                        height: HANDLE_R * 2,
                      }}
                      onClick={(e) => handleInputClick(e, node.id, port)}
                      title={`输入：${port}`}
                    />
                  );
                })}

                {/* Output handle(s) - right side */}
                {outputs.map((port, i) => {
                  const pos = getOutputHandlePos(node, i, outputs.length);
                  const isTrue = port === 'true';
                  const isFalse = port === 'false';
                  return (
                    <div
                      key={`out-${port}`}
                      className="absolute z-30 flex items-center gap-1"
                      style={{
                        left: NODE_W - HANDLE_R,
                        top: (pos.y - node.y) - HANDLE_R,
                      }}
                    >
                      <div
                        className={cn(
                          'rounded-full border-2 border-card cursor-crosshair transition-colors',
                          isTrue ? 'bg-green-500 hover:bg-green-400' :
                          isFalse ? 'bg-red-500 hover:bg-red-400' :
                          'bg-primary/60 hover:bg-primary',
                        )}
                        style={{ width: HANDLE_R * 2, height: HANDLE_R * 2 }}
                        onMouseDown={(e) => handleOutputClick(e, node.id, port)}
                        title={`输出：${port}`}
                      />
                      {outputs.length > 1 && (
                        <span className={cn(
                          'text-[8px] font-mono-data ml-1 select-none pointer-events-none',
                          isTrue ? 'text-green-400' : isFalse ? 'text-red-400' : 'text-muted-foreground',
                        )}>
                          {port}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Connection hint */}
          {connectFrom && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-primary/20 border border-primary/30 text-primary text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
              点击输入端口或节点即可连接；按 ESC 取消
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {selectedNodeData && (
          <div className="w-64 border-l border-border bg-card/50 shrink-0">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold">节点属性</p>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => deleteNode(selectedNodeData.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <Separator />

                <div>
                  <Label className="text-[10px] text-muted-foreground">标签</Label>
                  <Input
                    className="h-7 text-xs mt-1"
                    value={selectedNodeData.label}
                    onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, label: e.target.value } : n))}
                  />
                </div>

                <div>
                  <Label className="text-[10px] text-muted-foreground">类型</Label>
                  <div className={cn('mt-1 text-xs px-2 py-1 rounded border', nodeTypeMeta?.color || 'bg-muted/30')}>
                    {selectedNodeData.type.replace(/_/g, ' ')}
                  </div>
                </div>

                {/* Ports info */}
                {nodeTypeMeta && (
                  <div className="flex gap-2 text-[10px]">
                    {nodeTypeMeta.handles.inputs.length > 0 && (
                      <Badge variant="secondary" className="text-[9px]">输入：{nodeTypeMeta.handles.inputs.join(', ')}</Badge>
                    )}
                    <Badge variant="secondary" className="text-[9px]">输出：{nodeTypeMeta.handles.outputs.join(', ')}</Badge>
                  </div>
                )}

                <Separator />

                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-2">配置</p>

                  {selectedNodeData.type === 'trigger_event' && (
                    <div>
                      <Label className="text-[10px] text-muted-foreground">事件名称</Label>
                      <Select
                        value={selectedNodeData.config.eventName || ''}
                        onValueChange={(v) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, eventName: v } } : n))}
                      >
                        <SelectTrigger className="h-7 text-xs mt-1"><SelectValue placeholder="选择事件..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="notifycliententerview">客户端进入</SelectItem>
                          <SelectItem value="notifyclientleftview">客户端离开</SelectItem>
                          <SelectItem value="notifytextmessage">文本消息</SelectItem>
                          <SelectItem value="notifyclientmoved">客户端切换频道</SelectItem>
                          <SelectItem value="notifyserveredited">服务器已编辑</SelectItem>
                          <SelectItem value="notifychanneldescriptionchanged">频道描述变更</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedNodeData.type === 'trigger_cron' && (
                    <>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Cron 表达式</Label>
                        <Input
                          className="h-7 text-xs mt-1 font-mono-data"
                          placeholder="*/5 * * * *"
                          value={selectedNodeData.config.cron || ''}
                          onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, cron: e.target.value } } : n))}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">时区</Label>
                        <Select
                          value={selectedNodeData.config.timezone || 'UTC'}
                          onValueChange={(v) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, timezone: v } } : n))}
                        >
                          <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                            <SelectItem value="Europe/London">Europe/London</SelectItem>
                            <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                            <SelectItem value="Europe/Moscow">Europe/Moscow</SelectItem>
                            <SelectItem value="America/New_York">America/New_York</SelectItem>
                            <SelectItem value="America/Chicago">America/Chicago</SelectItem>
                            <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                            <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedNodeData.type === 'trigger_webhook' && (
                    <>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Webhook 路径</Label>
                        <Input
                          className="h-7 text-xs mt-1 font-mono-data"
                          placeholder="my-hook"
                          value={selectedNodeData.config.path || ''}
                          onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, path: e.target.value } } : n))}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">HTTP 方法</Label>
                        <Select
                          value={selectedNodeData.config.method || 'POST'}
                          onValueChange={(v) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, method: v } } : n))}
                        >
                          <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="GET">GET</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">密钥（可选）</Label>
                        <Input
                          className="h-7 text-xs mt-1 font-mono-data"
                          placeholder="留空表示不校验"
                          type="password"
                          value={selectedNodeData.config.secret || ''}
                          onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, secret: e.target.value } } : n))}
                        />
                        <p className="text-[9px] text-muted-foreground/60 mt-0.5">通过 X-Webhook-Secret 请求头或 ?secret= 查询参数校验</p>
                      </div>
                    </>
                  )}

                  {selectedNodeData.type === 'trigger_command' && (
                  <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">命令</Label>
                        <Input
                          className="h-7 text-xs mt-1 font-mono-data"
                          placeholder="!help"
                          value={selectedNodeData.config.command || ''}
                          onChange={(e) =>
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode
                                  ? { ...n, config: { ...n.config, command: e.target.value } }
                                  : n
                              )
                            )
                          }
                        />
                      </div>

                      <div>
                        <Label className="text-[10px] text-muted-foreground">监听频道 ID（可选）</Label>
                        <Input
                          type="number"
                          className="h-7 text-xs mt-1 font-mono-data"
                          placeholder="42"
                          value={selectedNodeData.config.channelId || ''}
                          onChange={(e) =>
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode
                                  ? { ...n, config: { ...n.config, channelId: e.target.value } }
                                  : n
                              )
                            )
                          }
                        />
                        <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                          仅当服务器查询客户端处于该频道时才会接收到命令。
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_message' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">目标模式</Label>
                        <Select
                          value={selectedNodeData.config.targetMode || 'client'}
                          onValueChange={(v) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, targetMode: v } } : n))}
                        >
                          <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client">客户端</SelectItem>
                            <SelectItem value="channel">频道</SelectItem>
                            <SelectItem value="server">服务器</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedNodeData.config.targetMode !== 'server' && (
                        <div>
                          <Label className="text-[10px] text-muted-foreground">
                            {selectedNodeData.config.targetMode === 'channel' ? '频道 ID' : '客户端 ID'}
                          </Label>
                          <Input
                            className="h-7 text-xs mt-1 font-mono-data"
                            placeholder={selectedNodeData.config.targetMode === 'channel' ? '频道 ID 或 {{event.ctid}}' : '客户端 ID 或 {{event.clid}}'}
                            value={selectedNodeData.config.target || ''}
                            onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, target: e.target.value } } : n))}
                          />
                        </div>
                      )}
                      <div>
                        <Label className="text-[10px] text-muted-foreground">消息</Label>
                        <Textarea
                          className="min-h-[120px] text-xs mt-1 resize-y font-mono-data"
                          placeholder={"这里是帮助列表：\n\n!create - 创建一个频道\n!delete - 删除你的频道\n!help - 显示此列表"}
                          value={selectedNodeData.config.message || ''}
                          onChange={(e) =>
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode
                                  ? { ...n, config: { ...n.config, message: e.target.value } }
                                  : n
                              )
                            )
                          }
                        />
                        <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                          提示：换行符会被保留。
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_kick' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">踢出范围</Label>
                        <Select
                          value={selectedNodeData.config.reasonid || '5'}
                          onValueChange={(v) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, reasonid: v } } : n))}
                        >
                          <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4">频道</SelectItem>
                            <SelectItem value="5">服务器</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">原因</Label>
                        <Input className="h-7 text-xs mt-1" placeholder="被机器人踢出" value={selectedNodeData.config.reason || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, reason: e.target.value } } : n))} />
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_ban' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">时长（秒，0 表示永久）</Label>
                        <Input type="number" className="h-7 text-xs mt-1 font-mono-data" placeholder="3600" value={selectedNodeData.config.time || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, time: parseInt(e.target.value) || 0 } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">原因</Label>
                        <Input className="h-7 text-xs mt-1" placeholder="被机器人封禁" value={selectedNodeData.config.reason || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, reason: e.target.value } } : n))} />
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_move' && (
                    <div>
                      <Label className="text-[10px] text-muted-foreground">目标频道 ID（或模板）</Label>
                      <Input
                        className="h-7 text-xs mt-1 font-mono-data"
                        placeholder="94  或  {{temp.lastCreatedChannelId}}"
                        value={selectedNodeData.config.cid ?? ''}
                        onChange={(e) =>
                          setNodes((prev) =>
                            prev.map((n) =>
                              n.id === selectedNode
                                ? { ...n, config: { ...n.config, cid: e.target.value } }
                                : n
                            )
                          )
                        }
                      />
                      <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                        示例：94 或 {"{{temp.lastCreatedChannelId}}"}
                      </p>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_poke' && (
                    <div>
                      <Label className="text-[10px] text-muted-foreground">消息</Label>
                      <Input className="h-7 text-xs mt-1" placeholder="嘿 {{event.client_nickname}}！" value={selectedNodeData.config.message || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, message: e.target.value } } : n))} />
                    </div>
                  )}

                  {selectedNodeData.type === 'action_channelCreate' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">频道名称</Label>
                        <Input className="h-7 text-xs mt-1" placeholder="[cspacer]Info" value={selectedNodeData.config.channel_name || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, channel_name: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">父频道 ID</Label>
                        <Input type="number" className="h-7 text-xs mt-1 font-mono-data" placeholder="0" value={selectedNodeData.config.cpid || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, cpid: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">频道密码（可选）</Label>
                        <Input
                          className="h-7 text-xs mt-1 font-mono-data"
                          placeholder="密码 或 {{temp.channelPassword}}"
                          value={selectedNodeData.config.channel_password || ''}
                          onChange={(e) =>
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode
                                  ? { ...n, config: { ...n.config, channel_password: e.target.value } }
                                  : n
                              )
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">临时频道</Label>
                        <Select value={selectedNodeData.config.channel_flag_temporary || '0'} onValueChange={(v) => setNodes((prev) => prev.map((n) => { if (n.id !== selectedNode) return n; const cfg: any = { ...n.config }; if (v === '1') { cfg.channel_flag_temporary = '1'; delete cfg.channel_flag_semi_permanent; } else { cfg.channel_flag_temporary = '0'; cfg.channel_flag_semi_permanent = '1'; } return { ...n, config: cfg }; }) ) }>
                          <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">永久</SelectItem>
                            <SelectItem value="1">临时</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_channelEdit' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">频道 ID</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="42" value={selectedNodeData.config.channelId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, channelId: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">频道名称</Label>
                        <Input className="h-7 text-xs mt-1" placeholder="[cspacer]{{time.time}}" value={selectedNodeData.config.channel_name || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, channel_name: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">频道主题</Label>
                        <Input className="h-7 text-xs mt-1" placeholder="可选" value={selectedNodeData.config.channel_topic || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, channel_topic: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">频道描述</Label>
                        <Textarea className="text-xs mt-1 min-h-[60px] font-mono-data" placeholder="{{temp.apiResult}}" value={selectedNodeData.config.channel_description || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, channel_description: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">频道密码（可选）</Label>
                        <Input
                          className="h-7 text-xs mt-1 font-mono-data"
                          placeholder="密码 或 {{temp.channelPassword}}"
                          value={selectedNodeData.config.channel_password || ''}
                          onChange={(e) =>
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode
                                  ? { ...n, config: { ...n.config, channel_password: e.target.value } }
                                  : n
                              )
                            )
                          }
                        />
                        <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                          留空表示保持不变。
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_channelDelete' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">频道 ID</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="42" value={selectedNodeData.config.channelId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, channelId: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">强制删除</Label>
                        <Select value={selectedNodeData.config.force ? '1' : '0'} onValueChange={(v) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, force: v === '1' } } : n))}>
                          <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">否</SelectItem>
                            <SelectItem value="1">是（同时删除子频道）</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {(selectedNodeData.type === 'action_groupAdd' || selectedNodeData.type === 'action_groupRemove') && (
                    <div>
                      <Label className="text-[10px] text-muted-foreground">服务器组 ID</Label>
                      <Input type="number" className="h-7 text-xs mt-1 font-mono-data" placeholder="6" value={selectedNodeData.config.groupId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, groupId: e.target.value } } : n))} />
                    </div>
                  )}

                  {selectedNodeData.type === 'action_webquery' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">命令</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="serverinfo" value={selectedNodeData.config.command || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, command: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">存储为（临时变量）</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="server" value={selectedNodeData.config.storeAs || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, storeAs: e.target.value } } : n))} />
                        <p className="text-[9px] text-muted-foreground mt-1">通过 {'{{temp.server.virtualserver_name}}'} 访问</p>
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_webhook' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">URL</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="https://example.com/hook" value={selectedNodeData.config.url || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, url: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">请求方法</Label>
                        <Select value={selectedNodeData.config.method || 'POST'} onValueChange={(v) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, method: v } } : n))}>
                          <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">请求体（JSON）</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder='{"key":"value"}' value={selectedNodeData.config.body || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, body: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">存储为（临时变量）</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="response" value={selectedNodeData.config.storeAs || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, storeAs: e.target.value } } : n))} />
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_httpRequest' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">URL</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="https://api.example.com/check" value={selectedNodeData.config.url || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, url: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">请求方法</Label>
                        <Select value={selectedNodeData.config.method || 'GET'} onValueChange={(v) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, method: v } } : n))}>
                          <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="DELETE">DELETE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">请求头（JSON）</Label>
                        <Input
                          className="h-7 text-xs mt-1 font-mono-data"
                          placeholder='{"Authorization":"Bearer xxx"}'
                          value={selectedNodeData.config.headersRaw ?? (selectedNodeData.config.headers ? JSON.stringify(selectedNodeData.config.headers) : '')}
                          onChange={(e) => {
                            const raw = e.target.value;
                            let parsed: Record<string, string> | undefined;
                            try { parsed = JSON.parse(raw); } catch { /* user still typing */ }
                            setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, headersRaw: raw, headers: parsed ?? n.config.headers } } : n));
                          }}
                        />
                        <p className="text-[9px] text-muted-foreground/60 mt-0.5">以 JSON 对象形式提供的键值对，支持 {'{{placeholders}}'}。</p>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">请求体（JSON）</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder='{"ip":"{{event.connection_client_ip}}"}' value={selectedNodeData.config.body || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, body: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">存储为（临时变量）</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="apiResult" value={selectedNodeData.config.storeAs || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, storeAs: e.target.value } } : n))} />
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_afkMover' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">AFK 频道 ID</Label>
                        <Input type="number" className="h-7 text-xs mt-1 font-mono-data" placeholder="10" value={selectedNodeData.config.afkChannelId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, afkChannelId: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">闲置阈值（秒）</Label>
                        <Input type="number" className="h-7 text-xs mt-1 font-mono-data" placeholder="300" value={selectedNodeData.config.idleThresholdSeconds || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, idleThresholdSeconds: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">豁免组 ID（逗号分隔）</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="6,7" value={selectedNodeData.config.exemptGroupIds || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, exemptGroupIds: e.target.value } } : n))} />
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_idleKicker' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">闲置阈值（秒）</Label>
                        <Input type="number" className="h-7 text-xs mt-1 font-mono-data" placeholder="1800" value={selectedNodeData.config.idleThresholdSeconds || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, idleThresholdSeconds: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">踢出原因</Label>
                        <Input className="h-7 text-xs mt-1" placeholder="闲置超时" value={selectedNodeData.config.reason || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, reason: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">豁免组 ID（逗号分隔）</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="6,7" value={selectedNodeData.config.exemptGroupIds || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, exemptGroupIds: e.target.value } } : n))} />
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_pokeGroup' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">服务器组 ID</Label>
                        <Input type="number" className="h-7 text-xs mt-1 font-mono-data" placeholder="6" value={selectedNodeData.config.groupId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, groupId: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">消息</Label>
                        <Input className="h-7 text-xs mt-1" placeholder="需要支持！" value={selectedNodeData.config.message || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, message: e.target.value } } : n))} />
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_rankCheck' && (
                    <div>
                      <Label className="text-[10px] text-muted-foreground">等级规则（JSON）</Label>
                      <Input className="h-7 text-xs mt-1 font-mono-data" placeholder='[{"hours":10,"groupId":"7"},{"hours":50,"groupId":"8"}]' value={selectedNodeData.config.ranks || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, ranks: e.target.value } } : n))} />
                      <p className="text-[9px] text-muted-foreground mt-1">{'{hours, groupId}'} 数组 —— 将分配符合条件中的最高等级</p>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_tempChannelCleanup' && (
                    <>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">父频道 ID</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="19" value={selectedNodeData.config.parentChannelId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, parentChannelId: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">受保护频道 ID（逗号分隔）</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="20,21" value={selectedNodeData.config.protectedChannelIds || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, protectedChannelIds: e.target.value } } : n))} />
                        <p className="text-[9px] text-muted-foreground mt-1">父频道下不应被删除的频道（例如大厅）</p>
                      </div>
                    </>
                  )}

                  {selectedNodeData.type === 'action_animatedChannel' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">频道 ID</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="42" value={selectedNodeData.config.channelId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, channelId: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">显示文本</Label>
                        <Input className="h-7 text-xs mt-1" placeholder="欢迎来到我的服务器" value={selectedNodeData.config.text || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, text: e.target.value } } : n))} />
                        <p className="text-[9px] text-muted-foreground mt-1">支持 {'{{time.time}}'}、{'{{time.date}}'} 等</p>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">动画样式</Label>
                        <Select value={selectedNodeData.config.style || 'scroll'} onValueChange={(v) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, style: v } } : n))}>
                          <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scroll">向左滚动（跑马灯）</SelectItem>
                            <SelectItem value="typewriter">打字机</SelectItem>
                            <SelectItem value="bounce">弹跳</SelectItem>
                            <SelectItem value="blink">闪烁</SelectItem>
                            <SelectItem value="wave">波浪（装饰）</SelectItem>
                            <SelectItem value="alternateCase">大小写交替</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">速度</Label>
                        <Select value={selectedNodeData.config.intervalSeconds || '3'} onValueChange={(v) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, intervalSeconds: v } } : n))}>
                          <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0.25">疯狂（0.25 秒）</SelectItem>
                            <SelectItem value="0.5">极快（0.5 秒）</SelectItem>
                            <SelectItem value="1">很快（1 秒）</SelectItem>
                            <SelectItem value="2">快速（2 秒）</SelectItem>
                            <SelectItem value="3">中速（3 秒）</SelectItem>
                            <SelectItem value="5">慢速（5 秒）</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">前缀</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="[cspacer]" value={selectedNodeData.config.prefix ?? '[cspacer]'} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, prefix: e.target.value } } : n))} />
                        <p className="text-[9px] text-muted-foreground mt-1">TS3 频道名前缀（例如 [cspacer] 用于居中占位）</p>
                      </div>
                    </div>
                  )}

                  {/* Voice Action Configs */}
                  {selectedNodeData.type === 'action_voicePlay' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">机器人 ID</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="1 或 {{var.botId}}" value={selectedNodeData.config.botId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, botId: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">歌曲 ID</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="要播放的歌曲 ID" value={selectedNodeData.config.songId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, songId: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">播放列表 ID（备选）</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="改为加载播放列表" value={selectedNodeData.config.playlistId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, playlistId: e.target.value } } : n))} />
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_voiceStop' && (
                    <div>
                      <Label className="text-[10px] text-muted-foreground">机器人 ID</Label>
                      <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="1 或 {{var.botId}}" value={selectedNodeData.config.botId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, botId: e.target.value } } : n))} />
                    </div>
                  )}

                  {selectedNodeData.type === 'action_voiceJoinChannel' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">机器人 ID</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="1" value={selectedNodeData.config.botId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, botId: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">频道 ID</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="频道 ID 或 {{event.ctid}}" value={selectedNodeData.config.channelId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, channelId: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">频道密码（可选）</Label>
                        <Input className="h-7 text-xs mt-1" type="password" placeholder="可选" value={selectedNodeData.config.channelPassword || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, channelPassword: e.target.value } } : n))} />
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_voiceLeaveChannel' && (
                    <div>
                      <Label className="text-[10px] text-muted-foreground">机器人 ID</Label>
                      <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="1" value={selectedNodeData.config.botId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, botId: e.target.value } } : n))} />
                    </div>
                  )}

                  {selectedNodeData.type === 'action_voiceVolume' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">机器人 ID</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="1" value={selectedNodeData.config.botId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, botId: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">音量（0-100）</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="50 或 {{event.volume}}" value={selectedNodeData.config.volume || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, volume: e.target.value } } : n))} />
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_voicePauseResume' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">机器人 ID</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="1" value={selectedNodeData.config.botId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, botId: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">操作</Label>
                        <Select value={selectedNodeData.config.action || 'toggle'} onValueChange={(v) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, action: v } } : n))}>
                          <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pause">暂停</SelectItem>
                            <SelectItem value="resume">继续播放</SelectItem>
                            <SelectItem value="toggle">切换</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_voiceSkip' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">机器人 ID</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="1" value={selectedNodeData.config.botId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, botId: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">方向</Label>
                        <Select value={selectedNodeData.config.direction || 'next'} onValueChange={(v) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, direction: v } } : n))}>
                          <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="next">下一首</SelectItem>
                            <SelectItem value="previous">上一首</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_voiceSeek' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">机器人 ID</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="1" value={selectedNodeData.config.botId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, botId: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">位置（秒）</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="30" value={selectedNodeData.config.position || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, position: e.target.value } } : n))} />
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_voiceTts' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">机器人 ID</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="1" value={selectedNodeData.config.botId || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, botId: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">文本</Label>
                        <Input className="h-7 text-xs mt-1" placeholder="你好 {{event.client_nickname}}" value={selectedNodeData.config.text || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, text: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">语言（可选）</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="en" value={selectedNodeData.config.language || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, language: e.target.value } } : n))} />
                      </div>
                      <p className="text-[9px] text-muted-foreground/60">TTS 引擎尚未配置——仅为占位</p>
                    </div>
                  )}

                  {selectedNodeData.type === 'condition' && (
                    <div>
                      <Label className="text-[10px] text-muted-foreground">表达式</Label>
                      <Input
                        className="h-7 text-xs mt-1 font-mono-data"
                        placeholder='event.client_type == 0'
                        value={selectedNodeData.config.expression || ''}
                        onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, expression: e.target.value } } : n))}
                      />
                      <p className="text-[9px] text-muted-foreground mt-1">真 → 绿色输出，假 → 红色输出</p>
                    </div>
                  )}

                  {selectedNodeData.type === 'delay' && (
                    <div>
                      <Label className="text-[10px] text-muted-foreground">延迟（毫秒）</Label>
                      <Input type="number" className="h-7 text-xs mt-1 font-mono-data" placeholder="5000" value={selectedNodeData.config.delayMs || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, delayMs: parseInt(e.target.value) || 0 } } : n))} />
                    </div>
                  )}

                  {selectedNodeData.type === 'variable' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">变量名</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="myVar" value={selectedNodeData.config.varName || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, varName: e.target.value } } : n))} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">值（表达式）</Label>
                        <Input className="h-7 text-xs mt-1 font-mono-data" placeholder="event.clid" value={selectedNodeData.config.varValue || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, varValue: e.target.value } } : n))} />
                      </div>
                    </div>
                  )}

                  {selectedNodeData.type === 'action_generateCode' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">长度</Label>
                        <Input
                          type="number"
                          className="h-7 text-xs mt-1 font-mono-data"
                          placeholder="5"
                          value={selectedNodeData.config.length ?? '5'}
                          onChange={(e) =>
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode
                                  ? { ...n, config: { ...n.config, length: e.target.value } }
                                  : n
                              )
                            )
                          }
                        />
                      </div>

                      <div>
                        <Label className="text-[10px] text-muted-foreground">存储为</Label>
                        <Input
                          className="h-7 text-xs mt-1 font-mono-data"
                          placeholder="code"
                          value={selectedNodeData.config.storeAs ?? 'code'}
                          onChange={(e) =>
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode
                                  ? { ...n, config: { ...n.config, storeAs: e.target.value } }
                                  : n
                              )
                            )
                          }
                        />
                        <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                          可引用为：{'{{temp.'}{(selectedNodeData.config.storeAs ?? 'code')}{'}}'}
                        </p>
                      </div>

                      <div>
                        <Label className="text-[10px] text-muted-foreground">字符类型</Label>
                        <Select
                          value={(selectedNodeData.config.numericOnly ?? true) ? 'digits' : 'alnum'}
                          onValueChange={(v) =>
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode
                                  ? { ...n, config: { ...n.config, numericOnly: v === 'digits' } }
                                  : n
                              )
                            )
                          }
                        >
                          <SelectTrigger className="h-7 text-xs mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="digits">仅数字</SelectItem>
                            <SelectItem value="alnum">字母与数字</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  
                  {selectedNodeData.type === 'log' && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">日志级别</Label>
                        <Select
                          value={selectedNodeData.config.level || 'info'}
                          onValueChange={(v) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, level: v } } : n))}
                        >
                          <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="debug">调试</SelectItem>
                            <SelectItem value="info">信息</SelectItem>
                            <SelectItem value="warn">警告</SelectItem>
                            <SelectItem value="error">错误</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">消息</Label>
                        <Input className="h-7 text-xs mt-1" placeholder="客户端已加入：{{event.client_nickname}}" value={selectedNodeData.config.message || ''} onChange={(e) => setNodes((prev) => prev.map((n) => n.id === selectedNode ? { ...n, config: { ...n.config, message: e.target.value } } : n))} />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Connections overview */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">连线</p>
                  <div className="space-y-1">
                    {edges.filter((e) => e.source === selectedNodeData.id).map((edge) => {
                      const target = nodes.find((n) => n.id === edge.target);
                      return (
                        <div key={edge.id} className="flex items-center justify-between text-[10px] bg-muted/20 rounded px-2 py-1">
                          <span className="flex items-center gap-1">
                            <span className="text-muted-foreground">{edge.sourcePort}</span>
                            <span>→</span>
                            <span>{target?.label || '?'}</span>
                          </span>
                          <button onClick={() => deleteEdge(edge.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      );
                    })}
                    {edges.filter((e) => e.target === selectedNodeData.id).map((edge) => {
                      const source = nodes.find((n) => n.id === edge.source);
                      return (
                        <div key={edge.id} className="flex items-center justify-between text-[10px] bg-muted/20 rounded px-2 py-1">
                          <span className="flex items-center gap-1">
                            <span>{source?.label || '?'}</span>
                            <span>→</span>
                            <span className="text-muted-foreground">{edge.targetPort}</span>
                          </span>
                          <button onClick={() => deleteEdge(edge.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      );
                    })}
                    {edges.filter((e) => e.source === selectedNodeData.id || e.target === selectedNodeData.id).length === 0 && (
                      <p className="text-[10px] text-muted-foreground/50">暂无连线</p>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      <PlaceholderReference open={showHelp} onOpenChange={setShowHelp} />
    </div>
  );
}
