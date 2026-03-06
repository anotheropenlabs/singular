'use client';

import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { Save, Bell, Globe, Palette, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import Panel from '@/components/ui/Panel';
import SectionHeader from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/ThemeProvider'; // We will create this

interface ThemeOption {
  id: string;
  name: string;
  description: string;
  badge?: string;
  colors: string[];
  disabled?: boolean;
}

const THEMES: ThemeOption[] = [
  {
    id: 'cyber',
    name: 'Cyber Industrial',
    description: 'Deep high-contrast, monospace data, sharp 1px borders.',
    badge: 'Active',
    colors: ['#000000', '#09090b', '#3b82f6']
  },
  {
    id: 'modern',
    name: 'Modern Tech',
    description: 'Sleek dark blue-grey, glowing accents, rounded corners.',
    badge: 'New',
    colors: ['#0f172a', '#1e293b', '#38bdf8']
  },
  {
    id: 'light',
    name: 'Clean Light',
    description: 'Crisp white surfaces, soft shadows, high readability.',
    badge: 'Coming Soon',
    colors: ['#ffffff', '#f1f5f9', '#0ea5e9'],
    disabled: true
  }
];

export default function SettingsForm() {
  const { language, setLanguage, t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success(t('settings.save_success'));
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 w-full">
      <div>
         <h2 className="text-2xl font-mono font-bold text-[var(--text-primary)] tracking-tight mb-1">{t('settings.general')}</h2>
         <p className="text-[var(--text-secondary)] text-sm font-mono tracking-wide">Customize your dashboard experience and UI styling</p>
      </div>

      {/* Theme Selection */}
      <Panel variant="elevated" className="p-6">
          <SectionHeader
            icon={Palette}
            title={t('settings.theme')}
            description="Select the global UI aesthetic"
            color="accent"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {THEMES.map((t) => (
                  <Button
                      variant={theme === t.id ? 'primary' : 'outline'}
                      key={t.id}
                      disabled={t.disabled}
                      onClick={() => setTheme(t.id as any)}
                      className={cn(
                          "flex flex-col text-left p-4 h-auto transition-all duration-200 group relative overflow-hidden",
                          theme === t.id 
                              ? "border-[var(--accent-primary)] bg-[var(--bg-surface-hover)] shadow-glow-sm" 
                              : "border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--text-secondary)]",
                          t.disabled && "opacity-50 cursor-not-allowed grayscale"
                      )}
                  >
                      {/* Color dots preview */}
                      <div className="flex gap-2 mb-4">
                          {t.colors.map(c => (
                              <div key={c} className="w-4 h-4 rounded-full shadow-sm border border-white/10" style={{ background: c }} />
                          ))}
                      </div>

                      <div className="flex items-center justify-between mb-2 w-full">
                        <span className="font-mono font-bold text-sm text-[var(--text-primary)] uppercase tracking-tight">{t.name}</span>
                        {t.badge && (
                            <span className={cn(
                                "text-[9px] font-mono px-1.5 py-0.5 border uppercase tracking-wider",
                                theme === t.id 
                                    ? "bg-[var(--accent-primary)] text-white border-transparent" 
                                    : t.disabled ? "bg-transparent text-[var(--text-secondary)] border-[var(--text-secondary)]" : "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/30"
                            )}>
                                {t.badge}
                            </span>
                        )}
                      </div>
                      
                      <p className="text-[11px] text-[var(--text-secondary)] font-mono leading-relaxed line-clamp-2">
                          {t.description}
                      </p>

                      {theme === t.id && (
                          <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden pointer-events-none">
                              <div className="absolute top-[-16px] right-[-16px] w-8 h-8 bg-[var(--accent-primary)] rotate-45" />
                          </div>
                      )}
                  </Button>
              ))}
          </div>
      </Panel>

      {/* Language Selection */}
      <Panel variant="elevated" className="p-6">
          <SectionHeader
            icon={Globe}
            title={t('settings.language')}
            description="Change the dashboard language"
            color="blue"
          />

          <div className="grid grid-cols-2 max-w-lg gap-4 mt-6">
              <Button 
                variant={language === 'en' ? 'primary' : 'outline'}
                onClick={() => setLanguage('en')}
                className={cn(
                    "p-4 h-auto transition-all duration-200 flex flex-col items-start relative",
                    language === 'en' 
                    ? "border-[var(--accent-primary)] bg-[var(--bg-surface-hover)] shadow-glow-sm" 
                    : "border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--text-secondary)]"
                )}
              >
                  <div className="font-mono font-bold text-[var(--text-primary)] text-sm mb-1 uppercase">English</div>
                  <div className="text-[10px] text-[var(--text-secondary)] font-mono">United States</div>
                  {language === 'en' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent-primary)]" />}
              </Button>
              <Button 
                variant={language === 'zh' ? 'primary' : 'outline'}
                onClick={() => setLanguage('zh')}
                className={cn(
                    "p-4 h-auto transition-all duration-200 flex flex-col items-start relative",
                    language === 'zh' 
                    ? "border-[var(--accent-primary)] bg-[var(--bg-surface-hover)] shadow-glow-sm" 
                    : "border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--text-secondary)]"
                )}
              >
                  <div className="font-sans font-bold text-[var(--text-primary)] text-sm mb-1">中文</div>
                  <div className="text-[10px] text-[var(--text-secondary)] font-mono">简体中文</div>
                  {language === 'zh' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent-primary)]" />}
              </Button>
          </div>
      </Panel>

      {/* Notification Settings */}
      <Panel variant="elevated" className="p-6">
          <SectionHeader
            icon={Bell}
            title={t('settings.notifications')}
            description="Manage system alerts"
            color="yellow"
          />
           <div className="p-4 bg-[var(--bg-base)] border border-[var(--border-color)] flex items-center justify-between max-w-lg transition-colors hover:bg-[var(--bg-surface)] cursor-pointer mt-6">
              <div>
                  <h4 className="text-[var(--text-primary)] font-mono font-bold text-sm uppercase">System Alerts</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-1">Receive notifications for system events and errors</p>
              </div>
              {/* Dummy toggle */}
              <div className="w-10 h-5 bg-green-500/20 border border-green-500/50 relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 bottom-0.5 w-4 bg-green-400" />
              </div>
          </div>
      </Panel>

      <div className="flex justify-end pt-4">
          <Button onClick={handleSave} isLoading={isLoading} className="font-mono uppercase tracking-wider rounded-none min-w-32">
              <Save className="w-4 h-4 mr-2" />
              {t('common.save')}
          </Button>
      </div>
    </div>
  );
}
