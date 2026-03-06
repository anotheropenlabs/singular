'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import Button from './Button';

type Mode = 'rule' | 'global' | 'direct';

export default function ModeToggle() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const res = await fetch('/api/system/config');
      const data = await res.json();
      return data.data as { mode: Mode };
    },
  });

  const mutation = useMutation({
    mutationFn: async (mode: Mode) => {
      await fetch('/api/system/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      setIsOpen(false);
    },
  });

  const modes: { value: Mode; label: string; icon: any }[] = [
    { value: 'rule', label: t('mode.rule'), icon: Shield },
    { value: 'global', label: t('mode.global'), icon: Globe },
    { value: 'direct', label: t('mode.direct'), icon: Zap },
  ];

  const currentMode = modes.find(m => m.value.toLowerCase() === config?.mode?.toLowerCase()) || modes[0];
  const Icon = currentMode.icon;

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="primary"
        className={cn(
          "h-9 gap-2 px-3 border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]",
          isOpen && "border-[var(--accent-primary)] shadow-glow-sm"
        )}
      >
        <Icon className="w-4 h-4 text-[var(--accent-primary)]" />
        <span className="capitalize" suppressHydrationWarning>{currentMode.label}</span>
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-32 bg-glass border border-glass-border backdrop-blur-xl rounded-xl overflow-hidden shadow-2xl z-50">
            {modes.map((mode) => {
              const ModeIcon = mode.icon;
              const isActive = mode.value.toLowerCase() === config?.mode?.toLowerCase();
              
              return (
                <Button
                  variant="ghost"
                  key={mode.value}
                  onClick={() => mutation.mutate(mode.value)}
                  className={cn(
                    "flex items-center justify-start gap-2 w-full px-3 py-2 h-auto text-[11px] font-mono uppercase tracking-wider transition-colors border-none",
                    isActive 
                      ? "text-[var(--accent-primary)] bg-[var(--accent-primary)]/10" 
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                  )}
                >
                  <ModeIcon className="w-3.5 h-3.5" />
                  <span suppressHydrationWarning>{mode.label}</span>
                </Button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
