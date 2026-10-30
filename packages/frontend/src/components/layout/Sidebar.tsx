import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Server, Hash, Users, Shield, ShieldCheck,
  Lock, Ban, KeyRound, FolderOpen, MessageSquareWarning, Mail,
  ScrollText, Settings, Bot, Cpu, ChevronLeft, ChevronRight, Music, ListMusic,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const navSections = [
  {
    label: '概览',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: '仪表盘' },
      { to: '/servers', icon: Server, label: '虚拟服务器', adminOnly: true },
    ],
  },
  {
    label: '管理',
    items: [
      { to: '/channels', icon: Hash, label: '频道' },
      { to: '/clients', icon: Users, label: '客户端' },
      { to: '/server-groups', icon: Shield, label: '服务器组', adminOnly: true },
      { to: '/channel-groups', icon: ShieldCheck, label: '频道组', adminOnly: true },
      { to: '/permissions', icon: Lock, label: '权限', adminOnly: true },
    ],
  },
  {
    label: '安全',
    adminOnly: true,
    items: [
      { to: '/bans', icon: Ban, label: '封禁', adminOnly: true },
      { to: '/tokens', icon: KeyRound, label: '令牌', adminOnly: true },
    ],
  },
  {
    label: '内容',
    adminOnly: true,
    items: [
      { to: '/files', icon: FolderOpen, label: '文件', adminOnly: true },
      { to: '/complaints', icon: MessageSquareWarning, label: '投诉', adminOnly: true },
      { to: '/messages', icon: Mail, label: '消息', adminOnly: true },
    ],
  },
  {
    label: '系统',
    adminOnly: true,
    items: [
      { to: '/logs', icon: ScrollText, label: '服务器日志', adminOnly: true },
      { to: '/instance', icon: Cpu, label: '实例', adminOnly: true },
      { to: '/music-requests', icon: ListMusic, label: '音乐点播历史', adminOnly: true },
    ],
  },
  {
    label: '自动化',
    adminOnly: true,
    items: [
      { to: '/bots', icon: Bot, label: '机器人流程', adminOnly: true },
      { to: '/music-bots', icon: Music, label: '音乐机器人', adminOnly: true },
    ],
  },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const location = useLocation();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out relative',
          sidebarCollapsed ? 'w-16' : 'w-56',
        )}
      >
        {/* Logo area */}
        <div className={cn('flex items-center h-14 px-4 border-b border-sidebar-border', sidebarCollapsed && 'justify-center px-0')}>
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-xs font-mono-data">TS</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-sidebar-accent-foreground">TS6</span>
                <span className="text-sm text-sidebar-foreground ml-1">Manager</span>
              </div>
            </div>
          ) : (
            <div className="h-7 w-7 rounded-md bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-xs font-mono-data">TS</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-1 px-2">
            {navSections
              .filter((section) => !(section as any).adminOnly || isAdmin)
              .map((section, si) => {
                const visibleItems = section.items.filter((item) => !(item as any).adminOnly || isAdmin);
                if (visibleItems.length === 0) return null;
                return (
                  <div key={section.label}>
                    {si > 0 && <Separator className="my-2 bg-sidebar-border" />}
                    {!sidebarCollapsed && (
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                        {section.label}
                      </p>
                    )}
                    {visibleItems.map((item) => {
                      const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                      const link = (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={cn(
                            'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-all duration-150',
                            sidebarCollapsed && 'justify-center px-0 py-2',
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                          )}
                        >
                          <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
                          {!sidebarCollapsed && <span>{item.label}</span>}
                        </NavLink>
                      );

                      if (sidebarCollapsed) {
                        return (
                          <Tooltip key={item.to}>
                            <TooltipTrigger asChild>{link}</TooltipTrigger>
                            <TooltipContent side="right" className="font-medium">
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      return link;
                    })}
                  </div>
                );
              })}
          </nav>
        </ScrollArea>

        {/* Settings + Collapse */}
        <div className="border-t border-sidebar-border p-2 space-y-1">
          <NavLink
            to="/settings"
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors',
              sidebarCollapsed && 'justify-center px-0 py-2',
              location.pathname.startsWith('/settings') && 'bg-sidebar-accent text-sidebar-accent-foreground',
            )}
          >
            <Settings className="h-4 w-4" />
            {!sidebarCollapsed && <span>设置</span>}
          </NavLink>

          <button
            onClick={toggleSidebar}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors w-full',
              sidebarCollapsed && 'justify-center px-0 py-2',
            )}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!sidebarCollapsed && <span>收起</span>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
