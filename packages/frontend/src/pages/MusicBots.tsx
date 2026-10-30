import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { musicRequestsApi } from '@/api/music-requests.api';
import { musicBotsApi } from '@/api/music.api';
import {
  useMusicBots, useCreateMusicBot, useUpdateMusicBot, useDeleteMusicBot,
  useStartMusicBot, useStopMusicBot, useMusicBotState,
  usePlaySong, usePlayUrl, usePausePlayback, useResumePlayback, useStopPlayback,
  useSkipTrack, usePreviousTrack, useSeek, useSetVolume,
  useEnqueue, useLoadPlaylist, useRemoveFromQueue, useClearQueue,
  useSetShuffle, useSetRepeat,
  usePlayFromQueue, useMoveQueueItem,
} from '@/hooks/use-music-bots';
import { useSongs, useUploadSong, useDeleteSong, useYouTubeSearch, useYouTubeDownload, useYouTubeInfo, useYouTubeDownloadBatch } from '@/hooks/use-music-library';
import { useRadioStations, useRadioPresets, useCreateRadioStation, useDeleteRadioStation, usePlayRadio } from '@/hooks/use-radio-stations';
import { usePlaylists, usePlaylist, useCreatePlaylist, useDeletePlaylist, useAddSongToPlaylist, useRemoveSongFromPlaylist } from '@/hooks/use-playlists';
import { useServers } from '@/hooks/use-servers';
import { useServerStore } from '@/stores/server.store';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Music, Plus, Trash2, Play, Pause, SkipForward, SkipBack, Square,
  Volume2, VolumeX, Upload, Search, Download, ListMusic, Shuffle,
  Repeat, Repeat1, Power, PowerOff, RefreshCw, Pencil, X, Loader2,
  Youtube, FileAudio, Link, GripVertical, Music2, Radio, Clock,
  Video,
} from 'lucide-react';
import { VideoStreamTab } from '@/components/video/VideoStreamTab';
import { toast } from 'sonner';
import { formatBytes } from '@/lib/utils';
import type { MusicBotSummary, PlaybackState, SongInfo, PlaylistSummary, PlaylistDetail, YouTubeSearchResult, RadioStationInfo, RadioPreset } from '@ts6/common';

// ─── Helper ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const sourceLabels: Record<string, string> = {
  youtube: 'YouTube',
  local: '本地',
  url: '链接',
};

const statusColors: Record<string, string> = {
  stopped: 'bg-zinc-500',
  starting: 'bg-amber-500 animate-pulse',
  connected: 'bg-emerald-500',
  playing: 'bg-emerald-500 animate-pulse',
  paused: 'bg-amber-500',
  error: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  stopped: '已停止',
  starting: '启动中',
  connected: '已连接',
  playing: '播放中',
  paused: '已暂停',
  error: '错误',
};

// ─── Bot Player Card ─────────────────────────────────────────────────────────

function BotPlayerCard({ bot, onEdit, onDelete, onPlay }: {
  bot: MusicBotSummary;
  onEdit: () => void;
  onDelete: () => void;
  onPlay: () => void;
}) {
  const startBot = useStartMusicBot();
  const stopBot = useStopMusicBot();
  const { data: state } = useMusicBotState(
    bot.status !== 'stopped' ? bot.id : null,
  ) as { data: PlaybackState | undefined };

  const pausePlayback = usePausePlayback();
  const resumePlayback = useResumePlayback();
  const stopPlayback = useStopPlayback();
  const skipTrack = useSkipTrack();
  const previousTrack = usePreviousTrack();
  const setVolume = useSetVolume();
  const seekMut = useSeek();
  const shuffleMut = useSetShuffle();
  const repeatMut = useSetRepeat();

  // Widget token dialog
  const [showWidget, setShowWidget] = useState(false);
  const [widgetData, setWidgetData] = useState<{ token: string; jsonUrl: string; bbcodeUrl: string } | null>(null);

  // Local drag state so sliders don't snap back during interaction
  const [draggingSeek, setDraggingSeek] = useState<number | null>(null);
  const [draggingVolume, setDraggingVolume] = useState<number | null>(null);

  const isRunning = bot.status !== 'stopped' && bot.status !== 'error';
  const isPlaying = state?.status === 'playing';
  const isPaused = state?.status === 'paused';
  const isStreaming = state?.isStreaming ?? false;

  return (
    <Card className="group hover:border-primary/30 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`h-2 w-2 rounded-full shrink-0 ${statusColors[bot.status] || 'bg-zinc-500'}`} />
            <CardTitle className="text-sm font-medium truncate">{bot.name}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" title="播放器小组件"
              onClick={() => {
                musicBotsApi.playerWidgetToken(bot.id).then(setWidgetData);
                setShowWidget(true);
              }}
            >
              <Link className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] capitalize">{statusLabels[bot.status] ?? bot.status}</Badge>
          <Badge variant="outline" className="text-[10px]">{bot.nickname}</Badge>
          {bot.serverConfig && (
            <Badge variant="secondary" className="text-[10px]">{bot.serverConfig.name}</Badge>
          )}
        </div>

        {/* Play button when connected but idle */}
        {isRunning && !state?.nowPlaying && (
          <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={onPlay}>
            <Play className="h-3.5 w-3.5 mr-1.5" /> 点播歌曲...
          </Button>
        )}

        {/* Now Playing */}
        {state?.nowPlaying && (
          <div className="rounded-md bg-muted/50 p-2.5 space-y-2">
            <div className="flex items-center gap-2 min-w-0">
              {isStreaming ? <Radio className="h-3.5 w-3.5 text-red-500 shrink-0" /> : <Music2 className="h-3.5 w-3.5 text-primary shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{state.nowPlaying.title}</p>
                {state.nowPlaying.artist && (
                  <p className="text-[10px] text-muted-foreground truncate">{state.nowPlaying.artist}</p>
                )}
              </div>
              {isStreaming && (
                <Badge variant="destructive" className="text-[9px] shrink-0 animate-pulse">直播中</Badge>
              )}
            </div>
            {/* Progress bar (hidden for streams) */}
            {!isStreaming && (
              <div className="space-y-1">
                <Slider
                  value={[draggingSeek ?? state.position ?? 0]}
                  max={state.duration || 1}
                  step={1}
                  onValueChange={([val]) => setDraggingSeek(val)}
                  onValueCommit={([val]) => { seekMut.mutate({ botId: bot.id, seconds: val }); setDraggingSeek(null); }}
                  className="cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{formatTime(draggingSeek ?? state.position)}</span>
                  <span>{formatTime(state.duration)}</span>
                </div>
              </div>
            )}
            {/* Controls */}
            <div className="flex items-center justify-center gap-1">
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => shuffleMut.mutate({ botId: bot.id, enabled: !state.shuffle })}
              >
                <Shuffle className={`h-3.5 w-3.5 ${state.shuffle ? 'text-primary' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => previousTrack.mutate(bot.id)}
              >
                <SkipBack className="h-3.5 w-3.5" />
              </Button>
              {isPlaying ? (
                <Button variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => pausePlayback.mutate(bot.id)}
                >
                  <Pause className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => resumePlayback.mutate(bot.id)}
                >
                  <Play className="h-4 w-4 ml-0.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => skipTrack.mutate(bot.id)}
              >
                <SkipForward className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => {
                  const modes = ['off', 'track', 'queue'] as const;
                  const idx = modes.indexOf(state.repeat);
                  repeatMut.mutate({ botId: bot.id, mode: modes[(idx + 1) % 3] });
                }}
              >
                {state.repeat === 'track' ? (
                  <Repeat1 className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Repeat className={`h-3.5 w-3.5 ${state.repeat === 'queue' ? 'text-primary' : ''}`} />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Volume */}
        {isRunning && (
          <div className="flex items-center gap-2">
            <VolumeX className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Slider
              value={[draggingVolume ?? state?.volume ?? bot.volume]}
              max={100}
              step={1}
              onValueChange={([val]) => setDraggingVolume(val)}
              onValueCommit={([val]) => { setVolume.mutate({ botId: bot.id, volume: val }); setDraggingVolume(null); }}
              className="flex-1"
            />
            <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground w-7 text-right">{draggingVolume ?? state?.volume ?? bot.volume}%</span>
          </div>
        )}

        {/* Queue preview */}
        {state?.queue && state.queue.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium">队列（{state.queue.length}）</p>
            <div className="space-y-0.5 max-h-24 overflow-y-auto">
              {state.queue.slice(0, 5).map((item, i) => (
                <div key={item.id} className="flex items-center gap-2 text-[10px] py-0.5">
                  <span className="text-muted-foreground w-4 text-right">{i + 1}</span>
                  <span className="truncate flex-1">{item.title}</span>
                  <span className="text-muted-foreground">{formatTime(item.duration)}</span>
                </div>
              ))}
              {state.queue.length > 5 && (
                <p className="text-[10px] text-muted-foreground text-center">还有 {state.queue.length - 5} 首</p>
              )}
            </div>
          </div>
        )}

        {/* Start/Stop */}
        <div className="flex items-center gap-1.5 pt-1">
          {isRunning ? (
            <>
              <Button variant="outline" size="sm" className="h-7 text-xs flex-1"
                onClick={() => stopBot.mutate(bot.id, { onSuccess: () => toast.success('机器人已停止') })}
                disabled={stopBot.isPending}
              >
                <PowerOff className="h-3 w-3 mr-1" /> 停止
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs"
                onClick={onPlay}
              >
                <Music2 className="h-3 w-3 mr-1" /> 点播...
              </Button>
              {state?.nowPlaying && (
                <Button variant="ghost" size="sm" className="h-7 text-xs"
                  onClick={() => stopPlayback.mutate(bot.id)}
                >
                  <Square className="h-3 w-3 mr-1" /> 停止音频
                </Button>
              )}
            </>
          ) : (
            <Button variant="default" size="sm" className="h-7 text-xs flex-1"
              onClick={() => startBot.mutate(bot.id, {
                onSuccess: () => toast.success('机器人已启动'),
                onError: () => toast.error('启动机器人失败'),
              })}
              disabled={startBot.isPending}
            >
              <Power className="h-3 w-3 mr-1" /> 启动
            </Button>
          )}
        </div>
      </CardContent>

      {/* Player Widget Dialog */}
      <Dialog open={showWidget} onOpenChange={setShowWidget}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">播放器小组件</DialogTitle>
            <DialogDescription className="text-xs">
              将下列 URL 嵌入你的 TeamSpeak 频道描述或网站中。
            </DialogDescription>
          </DialogHeader>
          {widgetData && (
            <div className="space-y-3">
              <div>
                <Label className="text-[10px] text-muted-foreground">BBCode URL（用于频道描述）</Label>
                <div className="flex gap-1.5 mt-1">
                  <Input readOnly className="h-7 text-[11px] font-mono-data" value={widgetData.bbcodeUrl} />
                  <Button variant="outline" size="sm" className="h-7 text-xs shrink-0"
                    onClick={() => { navigator.clipboard.writeText(widgetData.bbcodeUrl); toast.success('已复制！'); }}
                  >复制</Button>
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">JSON URL（用于网站/集成）</Label>
                <div className="flex gap-1.5 mt-1">
                  <Input readOnly className="h-7 text-[11px] font-mono-data" value={widgetData.jsonUrl} />
                  <Button variant="outline" size="sm" className="h-7 text-xs shrink-0"
                    onClick={() => { navigator.clipboard.writeText(widgetData.jsonUrl); toast.success('已复制！'); }}
                  >复制</Button>
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">令牌</Label>
                <Input readOnly className="h-7 text-[11px] font-mono-data mt-1" value={widgetData.token} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Play Song Dialog ─────────────────────────────────────────────────────────

function PlaySongDialog({ botId, onClose, onPlaySong, onPlayUrl, onEnqueue, onLoadPlaylist }: {
  botId: number | null;
  onClose: () => void;
  onPlaySong: (songId: number) => void;
  onPlayUrl: (url: string) => void;
  onEnqueue: (songId: number) => void;
  onLoadPlaylist: (playlistId: number) => void;
}) {
  const { selectedConfigId } = useServerStore();
  const { data: servers } = useServers();
  const [serverId, setServerId] = useState<number | null>(selectedConfigId);
  const configId = serverId || selectedConfigId;
  const { data: songs } = useSongs(configId);
  const { data: playlists } = usePlaylists();
  const { data: history = [] } = useQuery({
    queryKey: ['music-requests', configId],
    queryFn: () => musicRequestsApi.list(configId!),
    enabled: !!configId,
  });
  const [tab, setTab] = useState<'songs' | 'playlists' | 'history'>('songs');
  const [filter, setFilter] = useState('');

  const serverList = Array.isArray(servers) ? servers : [];
  const songList = (Array.isArray(songs) ? songs : []) as SongInfo[];
  const playlistList = (Array.isArray(playlists) ? playlists : []) as PlaylistSummary[];

  const filtered = filter
    ? songList.filter((s) => s.title.toLowerCase().includes(filter.toLowerCase()) || (s.artist || '').toLowerCase().includes(filter.toLowerCase()))
    : songList;

  return (
    <Dialog open={botId !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>播放音乐</DialogTitle>
          <DialogDescription>选择要在此机器人上播放的歌曲或播放列表。</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-2">
          <Button variant={tab === 'songs' ? 'default' : 'outline'} size="sm" className="h-7 text-xs"
            onClick={() => setTab('songs')}
          >
            <FileAudio className="h-3 w-3 mr-1" /> 歌曲
          </Button>
          <Button variant={tab === 'playlists' ? 'default' : 'outline'} size="sm" className="h-7 text-xs"
            onClick={() => setTab('playlists')}
          >
            <ListMusic className="h-3 w-3 mr-1" /> 播放列表
          </Button>
          <Button variant={tab === 'history' ? 'default' : 'outline'} size="sm" className="h-7 text-xs"
            onClick={() => setTab('history')}
          >
            <Clock className="h-3 w-3 mr-1" /> 历史
          </Button>
          <div className="flex-1" />
          {tab === 'songs' && (
            <Select value={String(configId || '')} onValueChange={(v) => setServerId(parseInt(v))}>
              <SelectTrigger className="w-36 h-7 text-xs"><SelectValue placeholder="服务器..." /></SelectTrigger>
              <SelectContent>
                {serverList.map((s: any) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {tab === 'songs' && (
          <>
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="筛选歌曲..."
              className="h-8 text-xs"
            />
            <div className="flex-1 max-h-[400px] mt-2 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">未找到歌曲。请先在「音乐库」标签页中上传歌曲。</p>
              ) : filtered.map((song) => (
                <div key={song.id} className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted/30 transition-colors rounded group">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{song.title}</p>
                    {song.artist && <p className="text-[10px] text-muted-foreground truncate">{song.artist}</p>}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(song.duration)}</span>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="default" size="sm" className="h-6 text-[10px] px-2"
                      onClick={() => onPlaySong(song.id)}
                    >
                      <Play className="h-3 w-3 mr-0.5" /> 播放
                    </Button>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2"
                      onClick={() => onEnqueue(song.id)}
                    >
                      <Plus className="h-3 w-3 mr-0.5" /> 加入队列
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'playlists' && (
          <div className="flex-1 max-h-[400px] overflow-y-auto">
            {playlistList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">暂无播放列表。请在「播放列表」标签页中创建一个。</p>
            ) : playlistList.map((pl) => (
              <div key={pl.id} className="flex items-center gap-2 py-2 px-2 hover:bg-muted/30 transition-colors rounded group">
                <ListMusic className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{pl.name}</p>
                  <p className="text-[10px] text-muted-foreground">{pl.songCount} 首歌曲</p>
                </div>
                <Button variant="default" size="sm" className="h-6 text-[10px] px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onLoadPlaylist(pl.id)}
                >
                  <Play className="h-3 w-3 mr-0.5" /> 加载并播放
                </Button>
              </div>
            ))}
          </div>
        )}

        {tab === 'history' && (
          <div className="flex-1 max-h-[400px] overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">暂无点歌记录。在聊天中使用 !play 可累积历史记录。</p>
            ) : history.map((req: any) => (
              <div key={req.id} className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted/30 transition-colors rounded group">
                <Music2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate" title={req.title}>{req.title}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="default" size="sm" className="h-6 text-[10px] px-2"
                    onClick={() => onPlayUrl(req.url)}
                  >
                    <Play className="h-3 w-3 mr-0.5" /> 播放
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bots Tab ────────────────────────────────────────────────────────────────

function BotsTab() {
  const { data, isLoading } = useMusicBots();
  const { data: servers } = useServers();
  const { selectedConfigId } = useServerStore();
  const createBot = useCreateMusicBot();
  const updateBot = useUpdateMusicBot();
  const deleteBot = useDeleteMusicBot();
  const playSong = usePlaySong();
  const playUrl = usePlayUrl();
  const enqueueSong = useEnqueue();
  const loadPlaylist = useLoadPlaylist();

  const [showCreate, setShowCreate] = useState(false);
  const [editBot, setEditBot] = useState<MusicBotSummary | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showPlayDialog, setShowPlayDialog] = useState<number | null>(null);

  // Create form
  const [form, setForm] = useState({
    name: '', serverConfigId: '', nickname: 'MusicBot', serverPassword: '', defaultChannel: '', channelPassword: '', voicePort: 9987, volume: 50, autoStart: false,
  });

  const bots = Array.isArray(data) ? data : [];
  const serverList = Array.isArray(servers) ? servers : [];

  if (isLoading) return <PageLoader />;

  const handleCreate = () => {
    const configId = parseInt(form.serverConfigId);
    if (!configId) { toast.error('请选择服务器'); return; }
    createBot.mutate({
      name: form.name,
      serverConfigId: configId,
      nickname: form.nickname || 'MusicBot',
      serverPassword: form.serverPassword || undefined,
      defaultChannel: form.defaultChannel || undefined,
      channelPassword: form.channelPassword || undefined,
      voicePort: form.voicePort,
      volume: form.volume,
      autoStart: form.autoStart,
    }, {
      onSuccess: () => { toast.success('音乐机器人已创建'); setShowCreate(false); resetForm(); },
      onError: () => toast.error('创建机器人失败'),
    });
  };

  const handleUpdate = () => {
    if (!editBot) return;
    updateBot.mutate({ id: editBot.id, data: {
      name: form.name,
      nickname: form.nickname,
      serverPassword: form.serverPassword || undefined,
      defaultChannel: form.defaultChannel || undefined,
      channelPassword: form.channelPassword || undefined,
      voicePort: form.voicePort,
      volume: form.volume,
      autoStart: form.autoStart,
    }}, {
      onSuccess: () => { toast.success('机器人已更新'); setEditBot(null); },
      onError: () => toast.error('更新机器人失败'),
    });
  };

  const resetForm = () => setForm({ name: '', serverConfigId: '', nickname: 'MusicBot', serverPassword: '', defaultChannel: '', channelPassword: '', voicePort: 9987, volume: 50, autoStart: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">共 {bots.length} 个音乐机器人</p>
        <Button size="sm" onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus className="h-4 w-4 mr-1" /> 新建机器人
        </Button>
      </div>

      {bots.length === 0 ? (
        <EmptyState icon={Music} title="暂无音乐机器人" description="创建你的第一个语音机器人，在你的 TeamSpeak 服务器上播放音乐。" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bots.map((bot: MusicBotSummary) => (
            <BotPlayerCard
              key={bot.id}
              bot={bot}
              onEdit={() => {
                setForm({
                  name: bot.name,
                  serverConfigId: String(bot.serverConfigId),
                  nickname: bot.nickname,
                  serverPassword: bot.serverPassword || '',
                  defaultChannel: bot.defaultChannel || '',
                  channelPassword: bot.channelPassword || '',
                  voicePort: bot.voicePort ?? 9987,
                  volume: bot.volume,
                  autoStart: bot.autoStart,
                });
                setEditBot(bot);
              }}
              onDelete={() => setDeleteId(bot.id)}
              onPlay={() => setShowPlayDialog(bot.id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showCreate || editBot !== null} onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditBot(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editBot ? '编辑音乐机器人' : '新建音乐机器人'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">名称</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="我的音乐机器人" />
            </div>
            {!editBot && (
              <div>
                <Label className="text-xs">服务器</Label>
                <Select value={form.serverConfigId} onValueChange={(v) => setForm({ ...form, serverConfigId: v })}>
                  <SelectTrigger><SelectValue placeholder="选择服务器..." /></SelectTrigger>
                  <SelectContent>
                    {serverList.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.host})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs">语音端口</Label>
              <Input type="number" value={form.voicePort} onChange={(e) => setForm({ ...form, voicePort: parseInt(e.target.value) || 9987 })} placeholder="9987" />
            </div>
            <div>
              <Label className="text-xs">昵称</Label>
              <Input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="MusicBot" />
            </div>
            <div>
              <Label className="text-xs">服务器密码</Label>
              <Input type="password" value={form.serverPassword} onChange={(e) => setForm({ ...form, serverPassword: e.target.value })} placeholder="没有则留空" />
            </div>
            <div>
              <Label className="text-xs">默认频道</Label>
              <Input value={form.defaultChannel} onChange={(e) => setForm({ ...form, defaultChannel: e.target.value })} placeholder="频道名称或 ID（可选）" />
            </div>
            <div>
              <Label className="text-xs">频道密码</Label>
              <Input type="password" value={form.channelPassword} onChange={(e) => setForm({ ...form, channelPassword: e.target.value })} placeholder="没有则留空" />
            </div>
            <div>
              <Label className="text-xs">音量（{form.volume}%）</Label>
              <Slider value={[form.volume]} max={100} step={1} onValueChange={([v]) => setForm({ ...form, volume: v })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.autoStart} onCheckedChange={(v) => setForm({ ...form, autoStart: v })} />
              <Label className="text-xs">服务器启动时自动启动</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditBot(null); }}>取消</Button>
            <Button onClick={editBot ? handleUpdate : handleCreate} disabled={!form.name || (!editBot && !form.serverConfigId) || createBot.isPending || updateBot.isPending}>
              {editBot ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
        title="删除音乐机器人？"
        description="此操作将永久删除该音乐机器人，并将其从服务器断开。"
        onConfirm={() => {
          if (deleteId) deleteBot.mutate(deleteId, { onSuccess: () => { toast.success('机器人已删除'); setDeleteId(null); } });
        }}
        destructive
      />

      {/* Play Song Dialog */}
      <PlaySongDialog
        botId={showPlayDialog}
        onClose={() => setShowPlayDialog(null)}
        onPlaySong={(songId) => {
          if (showPlayDialog) {
            playSong.mutate({ botId: showPlayDialog, songId }, {
              onSuccess: () => { toast.success('正在播放'); setShowPlayDialog(null); },
              onError: () => toast.error('播放歌曲失败'),
            });
          }
        }}
        onPlayUrl={(url) => {
          if (showPlayDialog) {
            playUrl.mutate({ botId: showPlayDialog, url }, {
              onSuccess: () => { toast.success('正在播放 URL'); setShowPlayDialog(null); },
              onError: () => toast.error('播放 URL 失败'),
            });
          }
        }}
        onEnqueue={(songId) => {
          if (showPlayDialog) {
            enqueueSong.mutate({ botId: showPlayDialog, songId }, {
              onSuccess: () => toast.success('已加入队列'),
              onError: () => toast.error('加入队列失败'),
            });
          }
        }}
        onLoadPlaylist={(playlistId) => {
          if (showPlayDialog) {
            loadPlaylist.mutate({ botId: showPlayDialog, playlistId, clearFirst: true }, {
              onSuccess: () => { toast.success('播放列表已加载'); setShowPlayDialog(null); },
              onError: () => toast.error('加载播放列表失败'),
            });
          }
        }}
      />
    </div>
  );
}

// ─── Library Tab ─────────────────────────────────────────────────────────────

function LibraryTab() {
  const { selectedConfigId } = useServerStore();
  const { data: servers } = useServers();
  const [libServerId, setLibServerId] = useState<number | null>(selectedConfigId);
  const configId = libServerId || selectedConfigId;

  const { data: songs, isLoading } = useSongs(configId);
  const uploadSong = useUploadSong();
  const deleteSong = useDeleteSong();
  const ytSearch = useYouTubeSearch();
  const ytDownload = useYouTubeDownload();

  const ytInfo = useYouTubeInfo();
  const ytBatchDownload = useYouTubeDownloadBatch();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ytResults, setYtResults] = useState<YouTubeSearchResult[]>([]);
  const [showYt, setShowYt] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filter, setFilter] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [urlInfo, setUrlInfo] = useState<{ type: 'video' | 'playlist'; items: YouTubeSearchResult[] } | null>(null);
  const [selectedUrlIds, setSelectedUrlIds] = useState<Set<string>>(new Set());
  const [batchProgress, setBatchProgress] = useState<string | null>(null);

  const serverList = Array.isArray(servers) ? servers : [];
  const songList = (Array.isArray(songs) ? songs : []) as SongInfo[];
  const filtered = filter
    ? songList.filter((s) => s.title.toLowerCase().includes(filter.toLowerCase()) || (s.artist || '').toLowerCase().includes(filter.toLowerCase()))
    : songList;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !configId) return;
    Array.from(files).forEach((file) => {
      const formData = new FormData();
      formData.append('file', file);
      uploadSong.mutate({ configId, formData }, {
        onSuccess: () => toast.success(`已上传：${file.name}`),
        onError: () => toast.error(`上传失败：${file.name}`),
      });
    });
    e.target.value = '';
  };

  const handleYtSearch = () => {
    if (!searchQuery.trim() || !configId) return;
    ytSearch.mutate({ configId, query: searchQuery }, {
      onSuccess: (data: any) => {
        setYtResults(Array.isArray(data) ? data : data?.results || []);
        setShowYt(true);
      },
      onError: () => toast.error('YouTube 搜索失败'),
    });
  };

  const handleYtDownload = (url: string) => {
    if (!configId) return;
    ytDownload.mutate({ configId, url }, {
      onSuccess: () => toast.success('下载已开始'),
      onError: () => toast.error('下载失败'),
    });
  };

  const sourceIcon = (source: string) => {
    switch (source) {
      case 'youtube': return <Youtube className="h-3 w-3" />;
      case 'url': return <Link className="h-3 w-3" />;
      default: return <FileAudio className="h-3 w-3" />;
    }
  };

  const handleLoadUrl = () => {
    if (!ytUrl.trim() || !configId) return;
    ytInfo.mutate({ configId, url: ytUrl }, {
      onSuccess: (data: any) => {
        setUrlInfo(data);
        if (data.type === 'playlist') {
          setSelectedUrlIds(new Set(data.items.map((i: any) => i.id)));
        }
      },
      onError: () => toast.error('加载 URL 信息失败'),
    });
  };

  const handleBatchDownload = () => {
    if (!configId || !urlInfo) return;
    const ids = Array.from(selectedUrlIds);
    const urls = ids.map((id) => `https://youtube.com/watch?v=${id}`);
    setBatchProgress(`正在下载 0/${urls.length}...`);
    ytBatchDownload.mutate({ configId, urls }, {
      onSuccess: (data: any) => {
        setBatchProgress(null);
        toast.success(`已下载 ${data.downloaded}/${data.total} 首歌曲`);
        if (data.errors?.length) toast.error(`${data.errors.length} 个失败`);
        setUrlInfo(null);
        setYtUrl('');
      },
      onError: () => { setBatchProgress(null); toast.error('批量下载失败'); },
    });
  };

  const toggleUrlSelect = (id: string) => {
    setSelectedUrlIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (!configId) {
    return <EmptyState icon={Music} title="选择服务器" description="选择一个服务器以管理其音乐库。" />;
  }

  return (
    <div className="space-y-4">
      {/* Server selector + actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={String(configId)} onValueChange={(v) => setLibServerId(parseInt(v))}>
          <SelectTrigger className="w-48"><SelectValue placeholder="服务器..." /></SelectTrigger>
          <SelectContent>
            {serverList.map((s: any) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="筛选歌曲..."
          className="w-48"
        />
        <input ref={fileInputRef} type="file" accept="audio/*" multiple hidden onChange={handleUpload} />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadSong.isPending}>
          <Upload className="h-4 w-4 mr-1" /> {uploadSong.isPending ? '上传中...' : '上传'}
        </Button>
      </div>

      {/* YouTube URL / Playlist Paste */}
      <Card className="border-dashed">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLoadUrl()}
                placeholder="粘贴 YouTube 视频 URL 或播放列表 URL..."
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleLoadUrl} disabled={ytInfo.isPending || !ytUrl.trim()}>
              {ytInfo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4 mr-1" />}
              加载
            </Button>
            {urlInfo && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setUrlInfo(null); setYtUrl(''); }}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* URL Info Results */}
          {urlInfo && (
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  {urlInfo.type === 'playlist' ? `播放列表（${urlInfo.items.length} 个视频）` : '单个视频'}
                </Badge>
                {urlInfo.type === 'playlist' && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-6 text-[10px]"
                      onClick={() => setSelectedUrlIds(new Set(urlInfo.items.map((i) => i.id)))}
                    >
                      全选
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px]"
                      onClick={() => setSelectedUrlIds(new Set())}
                    >
                      取消全选
                    </Button>
                    <Button variant="default" size="sm" className="h-7 text-xs"
                      onClick={handleBatchDownload}
                      disabled={selectedUrlIds.size === 0 || ytBatchDownload.isPending}
                    >
                      {ytBatchDownload.isPending ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> {batchProgress || '下载中...'}</>
                      ) : (
                        <><Download className="h-3 w-3 mr-1" /> 下载选中的 {selectedUrlIds.size} 项</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              <ScrollArea className="max-h-60">
                {urlInfo.items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-2 py-1.5 rounded transition-colors ${
                      urlInfo.type === 'playlist'
                        ? `cursor-pointer ${selectedUrlIds.has(item.id) ? 'bg-primary/10' : 'hover:bg-muted/50'}`
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => urlInfo.type === 'playlist' && toggleUrlSelect(item.id)}
                  >
                    {urlInfo.type === 'playlist' && (
                      <input
                        type="checkbox"
                        checked={selectedUrlIds.has(item.id)}
                        onChange={() => toggleUrlSelect(item.id)}
                        className="shrink-0 accent-primary"
                      />
                    )}
                    {item.thumbnail && (
                      <img src={item.thumbnail} alt="" className="h-8 w-12 rounded object-cover shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">{item.artist} - {formatTime(item.duration)}</p>
                    </div>
                    {urlInfo.type === 'video' && (
                      <Button variant="default" size="sm" className="h-7 text-xs shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleYtDownload(`https://youtube.com/watch?v=${item.id}`); }}
                        disabled={ytDownload.isPending}
                      >
                        <Download className="h-3 w-3 mr-1" /> 下载
                      </Button>
                    )}
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* YouTube Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleYtSearch()}
            placeholder="搜索 YouTube..."
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleYtSearch} disabled={ytSearch.isPending || !searchQuery.trim()}>
          {ytSearch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4 mr-1" />}
          搜索
        </Button>
      </div>

      {/* YouTube Results */}
      {showYt && ytResults.length > 0 && (
        <Card>
          <CardHeader className="py-2 px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs">YouTube 搜索结果（{ytResults.length}）</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowYt(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-60 overflow-y-auto">
              {ytResults.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors">
                  {r.thumbnail && (
                    <img src={r.thumbnail} alt="" className="h-10 w-14 rounded object-cover shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{r.title}</p>
                    <p className="text-[10px] text-muted-foreground">{r.artist} - {formatTime(r.duration)}</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs shrink-0"
                    onClick={() => handleYtDownload(`https://youtube.com/watch?v=${r.id}`)}
                    disabled={ytDownload.isPending}
                  >
                    <Download className="h-3 w-3 mr-1" /> 下载
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Song List */}
      {isLoading ? <PageLoader /> : filtered.length === 0 ? (
        <EmptyState icon={Music} title="暂无歌曲" description="上传音频文件或从 YouTube 下载，以构建你的音乐库。" />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] gap-2 px-3 py-2 bg-muted/50 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <span>标题</span>
            <span className="w-20 text-right">时长</span>
            <span className="w-16 text-center">来源</span>
            <span className="w-16 text-right">大小</span>
            <span className="w-16" />
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {filtered.map((song) => (
              <div key={song.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] gap-2 px-3 py-2 hover:bg-muted/30 transition-colors items-center border-t border-border/50">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{song.title}</p>
                  {song.artist && <p className="text-[10px] text-muted-foreground truncate">{song.artist}</p>}
                </div>
                <span className="text-xs text-muted-foreground w-20 text-right">{formatTime(song.duration)}</span>
                <span className="w-16 flex justify-center">
                  <Badge variant="outline" className="text-[9px] gap-1">{sourceIcon(song.source)} {sourceLabels[song.source] ?? song.source}</Badge>
                </span>
                <span className="text-xs text-muted-foreground w-16 text-right">{song.fileSize ? formatBytes(song.fileSize) : '-'}</span>
                <div className="w-16 flex justify-end">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(song.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
        title="删除歌曲？"
        description="此操作将从音乐库中永久移除该歌曲。"
        onConfirm={() => {
          if (deleteId && configId) deleteSong.mutate({ configId, songId: deleteId }, {
            onSuccess: () => { toast.success('歌曲已删除'); setDeleteId(null); },
          });
        }}
        destructive
      />
    </div>
  );
}

// ─── Playlists Tab ───────────────────────────────────────────────────────────

function PlaylistsTab() {
  const { selectedConfigId } = useServerStore();
  const { data, isLoading } = usePlaylists();
  const createPlaylist = useCreatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const addSong = useAddSongToPlaylist();
  const removeSong = useRemoveSongFromPlaylist();

  const { data: songs } = useSongs(selectedConfigId);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showAddSong, setShowAddSong] = useState(false);
  const [songFilter, setSongFilter] = useState('');

  const { data: detail } = usePlaylist(selectedId) as { data: PlaylistDetail | undefined };

  const playlists = (Array.isArray(data) ? data : []) as PlaylistSummary[];
  const songList = (Array.isArray(songs) ? songs : []) as SongInfo[];
  const playlistSongIds = new Set((detail?.songs || []).map((s: any) => s.id));
  const availableSongs = songList.filter((s) => !playlistSongIds.has(s.id) && (!songFilter || s.title.toLowerCase().includes(songFilter.toLowerCase())));

  const handleCreate = () => {
    createPlaylist.mutate({ name: newName }, {
      onSuccess: () => { toast.success('播放列表已创建'); setShowCreate(false); setNewName(''); },
      onError: () => toast.error('创建播放列表失败'),
    });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">共 {playlists.length} 个播放列表</p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> 新建播放列表
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        {/* Playlist list */}
        <div className="space-y-1.5">
          {playlists.length === 0 ? (
            <EmptyState icon={ListMusic} title="暂无播放列表" description="创建一个播放列表来整理你的歌曲。" />
          ) : playlists.map((pl) => (
            <div
              key={pl.id}
              className={`flex items-center gap-2 p-2.5 rounded-md cursor-pointer transition-colors ${
                selectedId === pl.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50 border border-transparent'
              }`}
              onClick={() => setSelectedId(pl.id)}
            >
              <ListMusic className={`h-4 w-4 shrink-0 ${selectedId === pl.id ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{pl.name}</p>
                <p className="text-[10px] text-muted-foreground">{pl.songCount} 首歌曲</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
                onClick={(e) => { e.stopPropagation(); setDeleteId(pl.id); }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        {/* Playlist detail */}
        {selectedId && detail ? (
          <Card>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{detail.name}</CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowAddSong(true)}>
                  <Plus className="h-3 w-3 mr-1" /> 添加歌曲
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {detail.songs.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">此播放列表暂无歌曲</div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  {detail.songs.map((song: any, i: number) => (
                    <div key={song.id} className="flex items-center gap-2 px-4 py-2 hover:bg-muted/30 transition-colors border-t border-border/50">
                      <span className="text-[10px] text-muted-foreground w-5 text-right">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{song.title}</p>
                        {song.artist && <p className="text-[10px] text-muted-foreground truncate">{song.artist}</p>}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{formatTime(song.duration)}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => removeSong.mutate({ playlistId: selectedId, songId: song.id }, {
                          onSuccess: () => toast.success('歌曲已移除'),
                        })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center text-xs text-muted-foreground py-16">
            选择一个播放列表以查看其中的歌曲
          </div>
        )}
      </div>

      {/* Create Playlist Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>新建播放列表</DialogTitle></DialogHeader>
          <div>
            <Label className="text-xs">名称</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="我的播放列表"
              onKeyDown={(e) => e.key === 'Enter' && newName && handleCreate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!newName || createPlaylist.isPending}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Song Dialog */}
      <Dialog open={showAddSong} onOpenChange={setShowAddSong}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>添加歌曲到播放列表</DialogTitle></DialogHeader>
          <Input
            value={songFilter}
            onChange={(e) => setSongFilter(e.target.value)}
            placeholder="筛选歌曲..."
          />
          <ScrollArea className="max-h-72">
            {availableSongs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">没有可用的歌曲。请先向音乐库上传歌曲。</p>
            ) : availableSongs.map((song) => (
              <div key={song.id} className="flex items-center gap-2 py-1.5 hover:bg-muted/30 transition-colors rounded px-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs truncate">{song.title}</p>
                  {song.artist && <p className="text-[10px] text-muted-foreground truncate">{song.artist}</p>}
                </div>
                <Button variant="outline" size="sm" className="h-6 text-[10px] shrink-0"
                  onClick={() => {
                    if (selectedId) addSong.mutate({ playlistId: selectedId, songId: song.id }, {
                      onSuccess: () => toast.success('歌曲已添加'),
                    });
                  }}
                >
                  <Plus className="h-3 w-3 mr-0.5" /> 添加
                </Button>
              </div>
            ))}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddSong(false); setSongFilter(''); }}>完成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
        title="删除播放列表？"
        description="此操作将永久删除该播放列表。"
        onConfirm={() => {
          if (deleteId) deletePlaylist.mutate(deleteId, {
            onSuccess: () => {
              toast.success('播放列表已删除');
              if (selectedId === deleteId) setSelectedId(null);
              setDeleteId(null);
            },
          });
        }}
        destructive
      />
    </div>
  );
}

// ─── Radio Tab ───────────────────────────────────────────────────────────────

function RadioTab() {
  const { selectedConfigId } = useServerStore();
  const { data: servers } = useServers();
  const [serverId, setServerId] = useState<number | null>(selectedConfigId);
  const configId = serverId || selectedConfigId;

  const { data: stations, isLoading } = useRadioStations(configId);
  const { data: presets } = useRadioPresets(configId);
  const createStation = useCreateRadioStation();
  const deleteStation = useDeleteRadioStation();
  const playRadio = usePlayRadio();

  const { data: bots } = useMusicBots();
  const runningBots = (Array.isArray(bots) ? bots : []).filter(
    (b: MusicBotSummary) => b.status !== 'stopped' && b.status !== 'error'
  );

  const [selectedBotId, setSelectedBotId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', url: '', genre: '' });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const serverList = Array.isArray(servers) ? servers : [];
  const stationList = (Array.isArray(stations) ? stations : []) as RadioStationInfo[];
  const presetList = (Array.isArray(presets) ? presets : []) as RadioPreset[];

  // Auto-select first running bot
  useEffect(() => {
    if (!selectedBotId && runningBots.length > 0) {
      setSelectedBotId(runningBots[0].id);
    }
  }, [runningBots, selectedBotId]);

  const handleAddStation = () => {
    if (!configId || !addForm.name || !addForm.url) return;
    createStation.mutate({
      configId,
      data: { name: addForm.name, url: addForm.url, genre: addForm.genre || undefined },
    }, {
      onSuccess: () => { toast.success('电台已添加'); setShowAdd(false); setAddForm({ name: '', url: '', genre: '' }); },
      onError: () => toast.error('添加电台失败'),
    });
  };

  const handleAddPreset = (preset: RadioPreset) => {
    if (!configId) return;
    createStation.mutate({
      configId,
      data: { name: preset.name, url: preset.url, genre: preset.genre },
    }, {
      onSuccess: () => toast.success(`已添加：${preset.name}`),
      onError: () => toast.error(`添加失败：${preset.name}`),
    });
  };

  const handlePlay = (stationId: number) => {
    if (!selectedBotId) {
      toast.error('请先选择一个正在运行的机器人');
      return;
    }
    playRadio.mutate({ botId: selectedBotId, stationId }, {
      onSuccess: () => toast.success('正在播放电台'),
      onError: () => toast.error('播放电台失败'),
    });
  };

  if (!configId) {
    return <EmptyState icon={Radio} title="选择服务器" description="选择一个服务器以管理电台。" />;
  }

  return (
    <div className="space-y-4">
      {/* Server + Bot selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={String(configId)} onValueChange={(v) => setServerId(parseInt(v))}>
          <SelectTrigger className="w-48"><SelectValue placeholder="服务器..." /></SelectTrigger>
          <SelectContent>
            {serverList.map((s: any) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6" />

        <Label className="text-xs text-muted-foreground">播放于：</Label>
        <Select
          value={selectedBotId ? String(selectedBotId) : ''}
          onValueChange={(v) => setSelectedBotId(parseInt(v))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder={runningBots.length === 0 ? '没有正在运行的机器人' : '选择机器人...'} />
          </SelectTrigger>
          <SelectContent>
            {runningBots.map((b: MusicBotSummary) => (
              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={() => setShowPresets(true)}>
          <Radio className="h-4 w-4 mr-1" /> 预设
        </Button>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> 添加电台
        </Button>
      </div>

      {runningBots.length === 0 && (
        <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3">
          <p className="text-xs text-amber-500">请先启动一个音乐机器人，然后再播放电台。</p>
        </div>
      )}

      {/* Station List */}
      {isLoading ? <PageLoader /> : stationList.length === 0 ? (
        <EmptyState icon={Radio} title="暂无电台" description="手动添加电台或从预设中添加，即可开始串流。" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {stationList.map((station) => (
            <Card key={station.id} className="group hover:border-primary/30 transition-colors">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Radio className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{station.name}</p>
                  {station.genre && (
                    <Badge variant="outline" className="text-[9px] mt-0.5">{station.genre}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="default"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePlay(station.id)}
                    disabled={!selectedBotId || playRadio.isPending}
                  >
                    <Play className="h-4 w-4 ml-0.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setDeleteId(station.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Station Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加电台</DialogTitle>
            <DialogDescription>提供串流 URL 以添加自定义网络电台。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">名称</Label>
              <Input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="电台名称" />
            </div>
            <div>
              <Label className="text-xs">串流 URL</Label>
              <Input value={addForm.url} onChange={(e) => setAddForm({ ...addForm, url: e.target.value })} placeholder="https://stream.example.com/live" />
            </div>
            <div>
              <Label className="text-xs">流派（可选）</Label>
              <Input value={addForm.genre} onChange={(e) => setAddForm({ ...addForm, genre: e.target.value })} placeholder="流行、摇滚、电子..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>取消</Button>
            <Button onClick={handleAddStation} disabled={!addForm.name || !addForm.url || createStation.isPending}>
              添加电台
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Presets Dialog */}
      <Dialog open={showPresets} onOpenChange={setShowPresets}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-auto">
          <DialogHeader>
            <DialogTitle>电台预设</DialogTitle>
            <DialogDescription>一键添加热门电台。</DialogDescription>
          </DialogHeader>
          <div className="flex-1 max-h-[400px] overflow-y-auto">
            {presetList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">暂无可用预设。</p>
            ) : presetList.map((preset, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-2 hover:bg-muted/50 transition-colors rounded">
                <Radio className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{preset.name}</p>
                  <p className="text-[10px] text-muted-foreground">{preset.genre}</p>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs shrink-0"
                  onClick={() => handleAddPreset(preset)}
                  disabled={createStation.isPending}
                >
                  <Plus className="h-3 w-3 mr-1" /> 添加
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPresets(false)}>完成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
        title="删除电台？"
        description="此操作将从列表中移除该电台。"
        onConfirm={() => {
          if (deleteId && configId) deleteStation.mutate({ configId, id: deleteId }, {
            onSuccess: () => { toast.success('电台已移除'); setDeleteId(null); },
          });
        }}
        destructive
      />
    </div>
  );
}

// ─── Video Streaming Tab ─────────────────────────────────────────────────────

function VideoTab() {
  const { data } = useMusicBots();
  const bots = Array.isArray(data) ? data : [];
  const [selectedBotId, setSelectedBotId] = useState<number | null>(null);

  // Auto-select first running bot
  const runningBots = bots.filter((b: MusicBotSummary) => b.status !== 'stopped' && b.status !== 'error');
  useEffect(() => {
    if (!selectedBotId && runningBots.length > 0) {
      setSelectedBotId(runningBots[0].id);
    }
  }, [runningBots, selectedBotId]);

  const selectedBot = bots.find((b: MusicBotSummary) => b.id === selectedBotId);

  return (
    <div className="space-y-4">
      {bots.length === 0 ? (
        <EmptyState icon={Video} title="暂无可用机器人" description="请先创建一个音乐机器人，然后再用它进行视频流传输。" />
      ) : (
        <>
          {/* Bot selector */}
          <div className="flex items-center gap-3">
            <Label className="shrink-0">选择机器人：</Label>
            <Select
              value={selectedBotId ? String(selectedBotId) : ''}
              onValueChange={(v) => setSelectedBotId(parseInt(v))}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="选择一个机器人..." />
              </SelectTrigger>
              <SelectContent>
                {bots.map((b: MusicBotSummary) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name} — {statusLabels[b.status] ?? b.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedBot ? (
            <VideoStreamTab botId={selectedBot.id} botStatus={selectedBot.status} />
          ) : (
            <p className="text-sm text-muted-foreground">选择一个机器人以管理视频流传输。</p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Queue Tab ───────────────────────────────────────────────────────────────

function QueueTab() {
  const { data: bots } = useMusicBots();
  const [selectedBot, setSelectedBot] = useState<number | null>(null);
  const { data: state } = useMusicBotState(selectedBot);
  const removeFromQueue = useRemoveFromQueue();
  const clearQueue = useClearQueue();
  const playFromQueue = usePlayFromQueue();
  const moveQueueItem = useMoveQueueItem();

  const botList = Array.isArray(bots) ? bots : [];
  const queue: any[] = state?.queue ?? [];
  const currentIndex: number = state?.currentIndex ?? -1;

  // Auto-select first running bot
  useEffect(() => {
    if (!selectedBot && botList.length > 0) {
      const running = botList.find((b: any) => b.status !== 'stopped');
      setSelectedBot(running?.id ?? botList[0]?.id ?? null);
    }
  }, [botList, selectedBot]);

  return (
    <div className="space-y-4">
      {/* Bot selector */}
      <div className="flex items-center gap-3">
        <Label className="text-xs text-muted-foreground">机器人：</Label>
        <Select value={selectedBot ? String(selectedBot) : ''} onValueChange={(v) => setSelectedBot(parseInt(v))}>
          <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="选择机器人" /></SelectTrigger>
          <SelectContent>
            {botList.map((b: any) => (
              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {queue.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="secondary" className="text-[10px]">{queue.length} 首</Badge>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => selectedBot && clearQueue.mutate(selectedBot)}>
              <Trash2 className="h-3 w-3 mr-1" /> 清空
            </Button>
          </div>
        )}
      </div>

      {!selectedBot ? (
        <EmptyState icon={Music} title="选择一个机器人以管理其队列" />
      ) : queue.length === 0 ? (
        <EmptyState icon={ListMusic} title="队列为空" />
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Header */}
            <div className="grid grid-cols-[2rem_minmax(0,1fr)_5rem_5rem_3rem_3rem] gap-2 px-3 py-2 text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/50">
              <div>#</div>
              <div>标题</div>
              <div className="text-right">时长</div>
              <div className="text-right">来源</div>
              <div />
              <div />
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {queue.map((item: any, i: number) => {
                const isActive = i === currentIndex;
                return (
                  <div
                    key={`${item.id}-${i}`}
                    className={`grid grid-cols-[2rem_minmax(0,1fr)_5rem_5rem_3rem_3rem] gap-2 px-3 py-1.5 items-center group transition-colors ${isActive ? 'bg-primary/10' : 'hover:bg-muted/30'}`}
                  >
                    <div className="text-xs text-muted-foreground font-mono-data">
                      {isActive ? <Play className="h-3 w-3 text-primary" /> : i + 1}
                    </div>
                    <div className="min-w-0">
                      <button
                        className="text-xs truncate block text-left hover:text-primary transition-colors w-full"
                        onClick={() => selectedBot && playFromQueue.mutate({ botId: selectedBot, index: i })}
                        title="点击播放"
                      >
                        {item.title}
                      </button>
                      {item.artist && <p className="text-[10px] text-muted-foreground truncate">{item.artist}</p>}
                    </div>
                    <div className="text-[11px] text-muted-foreground text-right font-mono-data">
                      {item.duration ? formatTime(item.duration) : '—'}
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[9px] h-4 px-1">{sourceLabels[item.source] ?? item.source}</Badge>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {i > 0 && (
                        <button
                          className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          onClick={() => selectedBot && moveQueueItem.mutate({ botId: selectedBot, from: i, to: i - 1 })}
                          title="上移"
                        >
                          <GripVertical className="h-3 w-3 rotate-180" />
                        </button>
                      )}
                      {i < queue.length - 1 && (
                        <button
                          className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          onClick={() => selectedBot && moveQueueItem.mutate({ botId: selectedBot, from: i, to: i + 1 })}
                          title="下移"
                        >
                          <GripVertical className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        onClick={() => selectedBot && removeFromQueue.mutate({ botId: selectedBot, index: i })}
                        title="从队列中移除"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MusicBots() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">音乐机器人</h1>
        </div>
      </div>

      <Tabs defaultValue="bots" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bots"><Music2 className="h-3.5 w-3.5 mr-1.5" /> 机器人</TabsTrigger>
          <TabsTrigger value="queue"><ListMusic className="h-3.5 w-3.5 mr-1.5" /> 队列</TabsTrigger>
          <TabsTrigger value="video"><Video className="h-3.5 w-3.5 mr-1.5" /> 视频</TabsTrigger>
          <TabsTrigger value="library"><FileAudio className="h-3.5 w-3.5 mr-1.5" /> 音乐库</TabsTrigger>
          <TabsTrigger value="playlists"><ListMusic className="h-3.5 w-3.5 mr-1.5" /> 播放列表</TabsTrigger>
          <TabsTrigger value="radio"><Radio className="h-3.5 w-3.5 mr-1.5" /> 电台</TabsTrigger>
        </TabsList>

        <TabsContent value="bots"><BotsTab /></TabsContent>
        <TabsContent value="queue"><QueueTab /></TabsContent>
        <TabsContent value="video"><VideoTab /></TabsContent>
        <TabsContent value="library"><LibraryTab /></TabsContent>
        <TabsContent value="playlists"><PlaylistsTab /></TabsContent>
        <TabsContent value="radio"><RadioTab /></TabsContent>
      </Tabs>
    </div>
  );
}
