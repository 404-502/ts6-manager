import type { WidgetData, WidgetChannelNode as WidgetChannelNodeType, WidgetTheme } from '@ts6/common';
import { WIDGET_THEMES } from '@ts6/common';

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}天 ${h}小时`;
  if (h > 0) return `${h}小时 ${m}分`;
  return `${m}分`;
}

function SpacerChannel({ node, theme }: { node: WidgetChannelNodeType; theme: WidgetTheme }) {
  const t = WIDGET_THEMES[theme];

  if (node.spacerType === 'line' || node.spacerType === 'dashline' || node.spacerType === 'dotline') {
    const borderStyle = node.spacerType === 'dotline' ? 'dotted' : node.spacerType === 'dashline' ? 'dashed' : 'solid';
    return (
      <div style={{
        padding: '4px 4px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{
          flex: 1,
          borderBottom: `1px ${borderStyle} ${t.border}`,
        }} />
      </div>
    );
  }

  const textAlign = node.spacerType === 'center' ? 'center' as const
    : node.spacerType === 'right' ? 'right' as const
    : 'left' as const;

  return (
    <div style={{
      padding: '2px 4px',
      fontSize: '11px',
      color: t.textSecondary,
      textAlign,
      fontWeight: 600,
      letterSpacing: '0.5px',
    }}>
      {node.spacerText || ''}
    </div>
  );
}

function ChannelNode({ node, depth, showClients, theme }: {
  node: WidgetChannelNodeType;
  depth: number;
  showClients: boolean;
  theme: WidgetTheme;
}) {
  const t = WIDGET_THEMES[theme];
  const indent = depth * 16;

  if (node.isspacer) {
    return <SpacerChannel node={node} theme={theme} />;
  }

  return (
    <div>
      {/* Channel row */}
      <div style={{
        paddingLeft: `${indent + 4}px`,
        paddingTop: '3px',
        paddingBottom: '3px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
      }}>
        <span style={{ color: t.accent, fontWeight: 700, fontSize: '11px', flexShrink: 0 }}>#</span>
        <span style={{ color: t.textPrimary, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>
        {node.hasPassword && (
          <span style={{ color: t.textSecondary, fontSize: '10px', flexShrink: 0 }}>🔒</span>
        )}
        {node.clients.length > 0 && (
          <span style={{ color: t.textSecondary, fontSize: '10px', flexShrink: 0 }}>{node.clients.length}</span>
        )}
      </div>

      {/* Clients */}
      {showClients && node.clients.map((client) => (
        <div key={client.clid} style={{
          paddingLeft: `${indent + 22}px`,
          paddingTop: '1px',
          paddingBottom: '1px',
          fontSize: '11px',
          color: t.clientColor,
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: t.clientColor, flexShrink: 0,
          }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {client.nickname}
            {client.isAway && <span style={{ color: t.textSecondary }}> [离开]</span>}
            {client.isMuted && <span style={{ color: t.textSecondary }}> [已静音]</span>}
          </span>
        </div>
      ))}

      {/* Children */}
      {node.children.map((child) => (
        <ChannelNode key={child.cid} node={child} depth={depth + 1} showClients={showClients} theme={theme} />
      ))}
    </div>
  );
}

export function WidgetRenderer({ data }: { data: WidgetData }) {
  const t = WIDGET_THEMES[data.theme] || WIDGET_THEMES.dark;

  const joinUrl = data.serverHost
    ? `ts3server://${data.serverHost}${data.serverPort !== 9987 ? `?port=${data.serverPort}` : ''}`
    : null;

  return (
    <div style={{
      background: t.background,
      color: t.textPrimary,
      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      fontSize: '13px',
      minHeight: '100vh',
      padding: '14px',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${t.border}`,
        paddingBottom: '10px',
        marginBottom: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {joinUrl ? (
            <a
              href={joinUrl}
              style={{
                fontWeight: 700,
                color: t.accent,
                fontSize: '15px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                marginRight: '8px',
                textDecoration: 'none',
              }}
              title="点击加入服务器"
            >
              {data.serverName}
            </a>
          ) : (
            <span style={{
              fontWeight: 700,
              color: t.accent,
              fontSize: '15px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              marginRight: '8px',
            }}>
              {data.serverName}
            </span>
          )}
          <span style={{
            background: t.clientColor,
            color: '#fff',
            fontSize: '10px',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontWeight: 600,
            flexShrink: 0,
            letterSpacing: '0.5px',
          }}>
            在线
          </span>
        </div>
        <div style={{
          marginTop: '6px',
          color: t.textSecondary,
          fontSize: '11px',
          display: 'flex',
          gap: '14px',
        }}>
          <span>{data.onlineUsers} / {data.maxClients} 位用户</span>
          <span>运行时长 {formatUptime(data.uptime)}</span>
        </div>
      </div>

      {/* Channel Tree */}
      {data.showChannelTree && data.channelTree.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          {data.channelTree.map((node) => (
            <ChannelNode
              key={node.cid}
              node={node}
              depth={0}
              showClients={data.showClients}
              theme={data.theme}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${t.border}`,
        paddingTop: '8px',
        textAlign: 'center',
        color: t.textSecondary,
        fontSize: '9px',
        opacity: 0.6,
      }}>
        TS6 WebUI 小组件
      </div>
    </div>
  );
}
