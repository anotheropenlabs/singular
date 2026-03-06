'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Server,
  Users,
  Link2,
  Activity,
  FileText,
  Settings,
  LogOut,
  Zap,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  User,
  ChevronUp,
  Globe,
  Layers,
  Wrench,
  Download,
  Route,
  Network,
  Box,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import type { SystemMode } from '@/types';
import SingularLogo from '@/components/ui/SingularLogo';
import { useSystemMode } from '@/hooks/useSystemSettings';
import Button from '@/components/ui/Button';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  username: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function Sidebar({ isCollapsed, toggleCollapse, username }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { data: systemMode = 'server' } = useSystemMode();

  const serverNavGroups: NavGroup[] = [
    {
      title: t('common.overview'),
      items: [
        { href: '/dashboard', label: t('dashboard.title'), icon: LayoutDashboard },
      ]
    },
    {
      title: t('common.network'),
      items: [
        { href: '/users', label: t('users.title'), icon: Users },
        { href: '/subscriptions', label: t('common.share_links'), icon: Link2 },
        { href: '/connections', label: t('connections.title'), icon: Activity },
      ]
    },
    {
      title: t('common.system'),
      items: [
        { href: '/logs', label: t('logs.title'), icon: FileText }, 
        { href: '/certificates', label: t('certificates.title'), icon: ShieldCheck },
        { href: '/settings', label: t('settings.title'), icon: Settings },
      ]
    }
  ];

  const clientNavGroups: NavGroup[] = [
    {
      title: t('common.overview'),
      items: [
        { href: '/dashboard', label: t('dashboard.title'), icon: LayoutDashboard },
      ]
    },
    {
      title: t('common.runtime'),
      items: [
        { href: '/proxies', label: t('common.proxies'), icon: Zap },
        { href: '/connections', label: t('connections.title'), icon: Activity },
      ]
    },
    {
      title: 'CONFIG MANAGEMENT',
      items: [
        { href: '/providers', label: 'Providers', icon: Box },
        { href: '/groups', label: 'Proxy Groups', icon: Layers },
        { href: '/nodes', label: 'Proxy Nodes', icon: Server },
        { href: '/config-builder', label: 'Config Builder', icon: Wrench },
      ]
    },
    {
      title: 'TOOLS & SYSTEM',
      items: [
        { href: '/settings', label: t('settings.title', 'Settings'), icon: Settings },
      ]
    }
  ];

  const navGroups = systemMode === 'client' ? clientNavGroups : serverNavGroups;

  return (
    <>
      <aside 
        className={cn(
            'fixed left-0 top-0 z-30 h-screen',
            'flex flex-col',
            'transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]',
            'bg-[var(--bg-surface)] border-r border-[var(--border-color)]',
            isCollapsed ? 'w-[68px]' : 'w-[264px]'
        )}
      >
        {/* Floating Toggle Button */}
        <Button 
            variant="ghost"
            onClick={toggleCollapse}
            className="absolute -right-3 top-8 w-6 h-6 p-0 bg-[var(--bg-base)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all z-40 opacity-0 group-hover:opacity-100 hover:opacity-100 shadow-md"
        >
            {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </Button>

        {/* Logo Area */}
        <div className="h-20 flex flex-col justify-center px-4 shrink-0 bg-black/20 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <SingularLogo size={isCollapsed ? 24 : 30} />
            <div
               className={cn(
                   'flex flex-col overflow-hidden transition-all duration-300',
                   isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
               )}
             >
               <span className="brand-name text-[18px] leading-tight">singular</span>
             </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-3 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-none">
          {navGroups.map((group, groupIndex) => (
            <div key={group.title} className="relative">
              {!isCollapsed && (
                  <h3 className="px-4 mb-2 text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] transition-opacity duration-300">
                      {group.title}
                  </h3>
              )}
              {isCollapsed && groupIndex > 0 && (
                  <div className="mx-auto w-8 my-4 border-t border-white/5" />
              )}
              
              <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={isCollapsed ? item.label : undefined}
                        className={cn(
                          'flex items-center transition-all duration-200 group relative rounded-none border',
                          isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2.5 gap-3 mx-2',
                          isActive 
                            ? 'text-[var(--text-primary)] bg-[var(--bg-base)] border-[var(--border-color)]' 
                            : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
                        )}
                      >
                        {/* Active Indicator Line */}
                        {isActive && (
                            <div className={cn(
                                "absolute w-0.5 bg-[var(--accent-primary)] transition-all duration-300",
                                isCollapsed ? "left-0 h-4 top-3" : "left-0 h-full top-0"
                            )} />
                        )}
                        
                        <Icon className={cn(
                            "w-[18px] h-[18px] transition-all duration-300", 
                            isActive ? "text-[var(--accent-primary)]" : "group-hover:text-[var(--text-primary)]"
                        )} />
                        
                        {!isCollapsed && (
                            <span className={cn(
                                "font-mono font-bold text-[11px] uppercase tracking-wider transition-all",
                                isActive ? "text-[var(--text-primary)]" : ""
                            )}>
                                {item.label}
                            </span>
                        )}
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
