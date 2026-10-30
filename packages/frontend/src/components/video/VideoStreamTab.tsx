/**
 * Video Stream Tab — embedded in the MusicBots page.
 * Controls video streaming: source input, quality preset, start/stop,
 * live WebRTC preview, and viewer management.
 */

import { useState } from 'react';
import { VideoPlayer } from './VideoPlayer';
import {
  useVideoStreamStatus,
  useStartVideoStream,
  useStopVideoStream,
  useSetStreamSource,
  useKickVideoViewer,
} from '@/hooks/use-music-bots';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PRESETS = [
  { value: '480p', label: '480p (854x480, 1 Mbps)' },
  { value: '720p', label: '720p (1280x720, 2.5 Mbps)' },
  { value: '1080p', label: '1080p (1920x1080, 4.5 Mbps)' },
];

const FPS_OPTIONS = [
  { value: '24', label: '24 FPS' },
  { value: '30', label: '30 FPS' },
  { value: '60', label: '60 FPS' },
];

interface VideoStreamTabProps {
  botId: number;
  botStatus: string;
}

export function VideoStreamTab({ botId, botStatus }: VideoStreamTabProps) {
  const [sourceUrl, setSourceUrl] = useState('');
  const [preset, setPreset] = useState('720p');
  const [framerate, setFramerate] = useState('30');
  const [bitrate, setBitrate] = useState('2500k');

  const { data: streamStatus } = useVideoStreamStatus(botId);
  const startStream = useStartVideoStream();
  const stopStream = useStopVideoStream();
  const setSource = useSetStreamSource();
  const kickViewer = useKickVideoViewer();

  const isStreaming = streamStatus?.streaming ?? false;
  const isBotConnected = botStatus === 'connected' || botStatus === 'playing' || botStatus === 'paused';

  const handleStart = () => {
    if (!sourceUrl.trim()) return;
    startStream.mutate({
      botId,
      source: sourceUrl.trim(),
      preset,
      framerate: Number(framerate),
      bitrate: bitrate.trim(),
    });
  };

  const handleStop = () => {
    stopStream.mutate(botId);
  };

  const handleChangeSource = () => {
    if (!sourceUrl.trim()) return;
    setSource.mutate({ botId, source: sourceUrl.trim() });
  };

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Stream Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">视频流</CardTitle>
            {isStreaming && (
              <Badge variant="destructive" className="gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                直播中
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isBotConnected && (
            <p className="text-sm text-muted-foreground">
              Bot 必须先连接才能开始视频推流。
            </p>
          )}

          {isBotConnected && (
            <>
              <div className="space-y-2">
                <Label>源地址</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://youtube.com/watch?v=... 或直链视频地址"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    disabled={startStream.isPending}
                  />
                  {isStreaming ? (
                    <Button
                      onClick={handleChangeSource}
                      disabled={!sourceUrl.trim() || setSource.isPending}
                      variant="outline"
                      className="shrink-0"
                    >
                      切换源
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  支持 YouTube、直链视频地址（MP4、HLS）或本地文件路径
                </p>
              </div>

              {!isStreaming && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>画质预设</Label>
                    <div className="flex gap-2">
                      {PRESETS.map((p) => (
                        <Button
                          key={p.value}
                          variant={preset === p.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPreset(p.value)}
                        >
                          {p.value}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>帧率（FPS）</Label>
                    <div className="flex gap-2">
                      {FPS_OPTIONS.map((fps) => (
                        <Button
                          key={fps.value}
                          variant={framerate === fps.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFramerate(fps.value)}
                        >
                          {fps.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>视频码率</Label>
                    <Input
                      value={bitrate}
                      onChange={(e) => setBitrate(e.target.value)}
                      placeholder="例如 1500k、2500k、4500k"
                    />
                    <p className="text-xs text-muted-foreground">
                      例如：1500k、2500k、4500k、6000k
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {!isStreaming ? (
                  <Button
                    onClick={handleStart}
                    disabled={!sourceUrl.trim() || startStream.isPending}
                  >
                    {startStream.isPending ? '启动中...' : '开始推流'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleStop}
                    variant="destructive"
                    disabled={stopStream.isPending}
                  >
                    {stopStream.isPending ? '停止中...' : '停止推流'}
                  </Button>
                )}
              </div>

              {(startStream.isError || stopStream.isError || setSource.isError) && (
                <p className="text-sm text-red-500">
                  {(startStream.error as any)?.message ||
                    (stopStream.error as any)?.message ||
                    (setSource.error as any)?.message}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Live Preview */}
      {isBotConnected && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">实时预览</CardTitle>
          </CardHeader>
          <CardContent>
            <VideoPlayer botId={botId} streaming={isStreaming} />
            {isStreaming && streamStatus && (
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>预设：<strong>{streamStatus.preset}</strong></span>
                <span>帧率：<strong>{streamStatus.framerate}</strong></span>
                <span>码率：<strong>{streamStatus.bitrate}</strong></span>
                {streamStatus.source && (
                  <span className="truncate max-w-xs">
                    源：<strong>{streamStatus.source}</strong>
                  </span>
                )}
                {streamStatus.startedAt && (
                  <span>
                    运行时长：<strong>{formatDuration(Date.now() - streamStatus.startedAt)}</strong>
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Viewers */}
      {isStreaming && streamStatus && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                观看者（{streamStatus.viewerCount}）
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {streamStatus.viewers.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无观看者连接</p>
            ) : (
              <div className="space-y-2">
                {streamStatus.viewers.map((viewer: any) => {
                  const duration = Math.floor((Date.now() - viewer.joinedAt) / 1000);
                  const mins = Math.floor(duration / 60);
                  const secs = duration % 60;
                  return (
                    <div
                      key={viewer.clid}
                      className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          viewer.iceState === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                        <span className="text-sm">客户端 #{viewer.clid}</span>
                        <span className="text-xs text-muted-foreground">
                          {mins > 0 ? `${mins}分 ${secs}秒` : `${secs}秒`}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-red-500 hover:text-red-400"
                        onClick={() => kickViewer.mutate({ botId, clid: viewer.clid })}
                      >
                        踢出
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
