'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-sm font-medium text-white"
      >
        <Icon className="w-4 h-4 text-sing-blue" />
        <span className="capitalize" suppressHydrationWarning>{currentMode.label}</span>
      </button>

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
                <button
                  key={mode.value}
                  onClick={() => mutation.mutate(mode.value)}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors",
                    isActive 
                      ? "bg-sing-blue/20 text-sing-blue" 
                      : "text-sing-text-secondary hover:text-white hover:bg-white/5"
                  )}
                >
                  <ModeIcon className="w-4 h-4" />
                  <span suppressHydrationWarning>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
