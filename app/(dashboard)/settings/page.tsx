'use client';

import { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import SettingsForm from '@/components/settings/SettingsForm';
import ConfigEditor from '@/components/settings/ConfigEditor';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import SingBoxSettings from '@/components/settings/SingBoxSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'general' | 'core' | 'security'>('general');

  const tabs = [
    { id: 'general', label: t('settings.general') },
    { id: 'core', label: t('settings.core') },
    { id: 'security', label: t('settings.security') },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex gap-1 p-1 bg-[var(--bg-surface)] border border-[var(--border-color)] w-fit">
        {tabs.map((tab) => (
          <Button
            variant="ghost"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "h-auto px-6 py-2 text-xs font-mono font-bold tracking-wider transition-none rounded-none w-auto flex-1 sm:flex-none",
              activeTab === tab.id
                ? "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)] hover:text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
            )}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        {activeTab === 'general' && <SettingsForm />}
        {activeTab === 'core' && <SingBoxSettings />}
        {activeTab === 'security' && <SecuritySettings />}
      </div>
    </div>
  );
}
