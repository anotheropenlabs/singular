'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '@/lib/utils';

interface ShellProps {
  children: React.ReactNode;
  username: string;
}

export default function Shell({ children, username }: ShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen text-[var(--text-primary)] font-sans bg-[var(--bg-base)] flex">
      <Sidebar
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
        username={username}
      />

      {/* Right-side layout */}
      <div className={cn(
        'flex flex-col h-screen overflow-hidden relative z-10 flex-1',
        'transition-all duration-300 ease-out',
        isCollapsed ? 'pl-[68px]' : 'pl-[264px]',
      )}>

        {/* ── Header Card ──────────────────────────── */}
        <Header username={username} />

        {/* ── Content Card ─────────────────────────── */}
        <main
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6"
        >
          <div className="w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
