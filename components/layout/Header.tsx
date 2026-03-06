'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, BookOpen, LogOut, Pencil, User, Monitor, Globe, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import AdminProfileModal from '@/components/auth/AdminProfileModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import type { SystemMode } from '@/types';
import { toast } from 'sonner';
import { useSystemMode } from '@/hooks/useSystemSettings';
import Button from '@/components/ui/Button';

const NAV_INDEX = [
  { href: '/dashboard',    label: 'Dashboard' },
  { href: '/proxies',      label: 'Proxies' },
  { href: '/connections',  label: 'Connections' },
  { href: '/providers',    label: 'Providers' },
  { href: '/nodes',        label: 'Nodes' },
  { href: '/groups',       label: 'Proxy Groups' },
  { href: '/rules',        label: 'Rules' },
  { href: '/logs',         label: 'Logs' },
  { href: '/settings',     label: 'Settings' },
  { href: '/inbounds',     label: 'Inbounds' },
  { href: '/users',        label: 'Users' },
];

interface HeaderCardProps {
  username?: string;
}

export default function HeaderCard({ username }: HeaderCardProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const { data: systemMode = 'server', setMode } = useSystemMode();

  const handleModeSwitch = (mode: SystemMode) => {
    if (mode === systemMode) return;
    setMode.mutate(mode);
  };

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  const results = query.trim().length > 0
    ? NAV_INDEX.filter(n => n.label.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleSelect = useCallback((href: string) => {
    router.push(href);
    setQuery('');
    setShowResults(false);
  }, [router]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header
      className="shrink-0 flex items-center justify-between px-6 h-14 bg-[var(--bg-surface)] border-b border-[var(--border-color)]"
    >
      {/* ── Search ─────────────────────────────────── */}
      <div className="flex-1 max-w-md relative" ref={dropRef}>
        <div className={cn(
          "flex items-center gap-2.5 px-3 py-1.5 transition-all duration-200",
          "bg-[var(--bg-base)] border",
          showResults || query ? "border-[var(--accent-primary)]" : "border-[var(--border-color)] focus-within:border-[var(--text-secondary)]",
        )}>
          <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            placeholder="Jump to page…"
            className="flex-1 bg-transparent text-sm font-mono text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none min-w-0"
          />
          <kbd className="hidden sm:flex items-center gap-1 text-[9px] text-[var(--text-secondary)] font-mono border border-[var(--border-color)] bg-[var(--bg-surface)] px-1.5 py-0.5 shrink-0 uppercase">
            ⌘K
          </kbd>
        </div>

        {/* Search Dropdown */}
        {showResults && results.length > 0 && (
          <div className={cn(
            "absolute top-full left-0 right-0 mt-2 z-50",
            "rounded-xl border border-white/[0.1] overflow-hidden",
            "bg-[#0d0f1a]/95 backdrop-blur-2xl",
            "shadow-[0_20px_60px_rgba(0,0,0,0.6)]",
          )}>
            {results.map((item, i) => (
              <Button
                variant="ghost"
                key={item.href}
                onMouseDown={() => handleSelect(item.href)}
                className={cn(
                  "w-full justify-start gap-3 px-4 py-2.5 h-auto border-none",
                  "hover:bg-white/[0.06]",
                  i !== 0 && "border-t border-white/[0.04]",
                )}
              >
                <span className="text-sm text-white/80 font-medium">{item.label}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* ── Right Actions ──────────────────────────── */}
      <div className="flex items-center gap-4 shrink-0">
        {/* System Mode Toggle */}
        <div className="flex bg-[var(--bg-base)] border border-[var(--border-color)] p-0.5 shrink-0">
          <Button
            variant={systemMode === 'server' ? 'primary' : 'ghost'}
            disabled={setMode.isPending}
            onClick={() => handleModeSwitch('server')}
            className={cn(
              "h-8 px-3 text-[10px] border-none shadow-none",
              systemMode === 'server' ? "bg-[var(--bg-surface)] text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline ml-1.5">{t('settings.server_mode', 'Server')}</span>
          </Button>
          <div className="w-px bg-[var(--border-color)] my-1" />
          <Button
            variant={systemMode === 'client' ? 'primary' : 'ghost'}
            disabled={setMode.isPending}
            onClick={() => handleModeSwitch('client')}
            className={cn(
              "h-8 px-3 text-[10px] border-none shadow-none",
              systemMode === 'client' ? "bg-[var(--bg-surface)] text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
            )}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline ml-1.5">{t('settings.client_mode', 'Client')}</span>
          </Button>
        </div>

        {/* Docs */}
        <div className="flex items-center gap-1">
            <a
            href="https://sing-box.sagernet.org"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 border border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)] hover:bg-[var(--bg-base)] transition-all duration-150"
            title="Documentation"
            >
            <BookOpen className="w-4 h-4" />
            </a>

            {/* Notifications (decorative) */}
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 border-none relative text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[var(--accent-primary)]" />
            </Button>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-[var(--border-color)] mx-1" />

        {/* User profile */}
        <div className="relative" ref={profileRef}>
            <Button 
              variant="ghost"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={cn(
                "flex items-center gap-2 pl-2 pr-2 h-9 transition-all duration-150 group border border-[var(--border-color)]",
                showProfileMenu && "bg-[var(--bg-base)] border-[var(--accent-primary)] shadow-glow-sm"
              )}
            >
              <div className="w-6 h-6 bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-[var(--text-primary)] uppercase">
                  {username?.[0] ?? 'A'}
                </span>
              </div>
              <ChevronDown className={cn("w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform duration-200 hidden sm:block", showProfileMenu && "rotate-180")} />
            </Button>

            {/* Profile Popover Menu */}
            {showProfileMenu && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-48 bg-[var(--bg-surface)] border border-[var(--border-color)] p-1 animate-in slide-in-from-top-2 fade-in duration-200 overflow-hidden z-50 rounded-none shadow-2xl">
                    <div className="px-3 py-2 border-b border-[var(--border-color)] mb-1">
                        <p className="text-sm font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider truncate">{username ?? 'admin'}</p>
                        <p className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest truncate">{t('auth.admin', 'System Admin')}</p>
                    </div>
                    <Button 
                        variant="ghost"
                        onClick={() => {
                            setShowProfileMenu(false);
                            setShowEditProfile(true);
                        }}
                        className="justify-start gap-2 w-full px-3 py-2 h-auto text-[10px] font-mono uppercase tracking-wider font-bold transition-colors border-none mb-0.5"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        {t('auth.edit_profile', 'Edit Profile')}
                    </Button>
                    <Button 
                        variant="ghost"
                        onClick={() => {
                            setShowProfileMenu(false);
                            setShowLogoutConfirm(true);
                        }}
                        className="justify-start gap-2 w-full px-3 py-2 text-[var(--status-error)] hover:bg-[var(--status-error)]/10 hover:text-[var(--status-error)] h-auto text-[10px] font-mono uppercase tracking-wider font-bold transition-colors border-none"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        {t('auth.sign_out', 'Log out')}
                    </Button>
                </div>
            )}
        </div>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title={t('auth.sign_out', 'Log out')}
        description={t('auth.logout_confirm', 'Are you sure you want to sign out?')}
        variant="danger" 
        confirmLabel={t('auth.sign_out', 'Log out')}
      />

      <AdminProfileModal 
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        currentUsername={username || 'admin'}
      />
    </header>
  );
}
