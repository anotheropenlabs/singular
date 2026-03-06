'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Panel from '../ui/Panel';
import Select from '../ui/Select';
import SegmentedControl from '../ui/SegmentedControl';
import SectionHeader from '../ui/SectionHeader';
import { Save, Server, Shield, Cpu, FileJson, AlertTriangle, Activity, Monitor, Globe, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { SystemMode } from '@/types';
import { SingBoxSettingsValues, DEFAULT_SINGBOX_SETTINGS } from '@/lib/settings-defaults';

export default function SingBoxSettings() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  
  const { register, handleSubmit, reset, watch, setValue } = useForm<SingBoxSettingsValues>({
    defaultValues: DEFAULT_SINGBOX_SETTINGS
  });

  const configMode = watch('app_system_config_mode');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings-core'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      const data = await res.json();
      return data.data;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (settings) {
        if (!settings.app_system_config_mode) {
            settings.app_system_config_mode = 'auto';
        }
        // Ensure default values for new settings if they are missing
        if (!settings.app_traffic_refresh_interval) settings.app_traffic_refresh_interval = '5000';
        if (!settings.app_connections_refresh_interval) settings.app_connections_refresh_interval = '2000';
        if (!settings.app_system_stats_refresh_interval) settings.app_system_stats_refresh_interval = '5000';
        if (!settings.app_traffic_retention_days) settings.app_traffic_retention_days = '1';
        if (!settings.app_traffic_collection_interval) settings.app_traffic_collection_interval = '2000';
        if (!settings.app_traffic_user_cache_ttl_mins) settings.app_traffic_user_cache_ttl_mins = '5';
        if (!settings.app_traffic_inbound_cache_ttl_mins) settings.app_traffic_inbound_cache_ttl_mins = '10';
        
        reset(settings);
    }
  }, [settings, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: SingBoxSettingsValues) => {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success(t('settings.save_success'));
      queryClient.invalidateQueries({ queryKey: ['settings-core'] });
    },
    onError: () => {
      toast.error(t('common.error'));
    }
  });

  const onSubmit = (data: SingBoxSettingsValues) => {
    updateMutation.mutate(data);
  };

  // System Mode (independent of form)
  const [systemMode, setSystemMode] = useState<SystemMode>('server');
  const [modeSwitching, setModeSwitching] = useState(false);

  useEffect(() => {
    fetch('/api/settings/mode')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.mode) {
          setSystemMode(data.data.mode);
        }
      })
      .catch(() => {});
  }, []);

  const handleModeSwitch = async (mode: SystemMode) => {
    if (mode === systemMode) return;
    setModeSwitching(true);
    try {
      const res = await fetch('/api/settings/mode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t('settings.mode_switch_success'));
        setTimeout(() => window.location.reload(), 800);
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const [isReloading, setIsReloading] = useState(false);

  const handleConfigReload = async () => {
    setIsReloading(true);
    try {
      const res = await fetch('/api/system/reload', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Configuration reloaded');
      } else {
        toast.error(data.error || 'Failed to reload');
      }
    } catch {
      toast.error('Failed to reload configuration');
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-mono font-bold text-[var(--text-primary)] tracking-tight mb-1">{t('settings.singbox_config')}</h2>
          <p className="text-[var(--text-secondary)] text-sm font-mono tracking-wide">{t('settings.singbox_config_desc')}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleConfigReload}
          disabled={isReloading}
          className="font-mono uppercase tracking-wider"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isReloading && "animate-spin")} />
          {isReloading ? 'Reloading...' : 'Reload Config'}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <Panel variant="elevated" className="p-6">
            <SectionHeader
                variant="primary"
                icon={FileJson}
                title={t('settings.config_mode')}
                description={configMode === 'auto' ? t('settings.config_mode_auto') : t('settings.config_mode_manual')}
                color="yellow"
                containerClassName="!mb-0"
                rightContent={
                    <SegmentedControl
                        value={configMode || 'auto'}
                        onChange={(val) => setValue('app_system_config_mode', val as 'auto' | 'manual', { shouldDirty: true })}
                        options={[
                            { label: 'Auto', value: 'auto' },
                            { label: 'Manual', value: 'manual' }
                        ]}
                    />
                }
            />

        {/* Path Inputs (Hidden in Auto Mode) */}
        {configMode === 'manual' && (
            <div className="space-y-4 pt-6 mt-6 border-t border-[var(--border-color)] animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-sing-yellow/10 border border-sing-yellow/30 p-4 flex gap-3 mb-6">
                    <AlertTriangle className="w-5 h-5 text-sing-yellow shrink-0 mt-0.5" />
                    <p className="text-sm text-sing-yellow/90 font-mono">
                        Advanced usage only. Incorrect paths will prevent the service from starting.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-2">
                   <div>
                       <Input 
                         label="Binary Path"
                         placeholder="sing-box (or absolute path)"
                         {...register('singbox_binary_path')}
                       />
                       <p className="text-xs text-[var(--text-secondary)] mt-1 ml-1">Path to the sing-box executable</p>
                   </div>
                   <div>
                       <Input 
                         label="Config Path"
                         placeholder="config.json (or absolute path)"
                         {...register('singbox_config_path')}
                       />
                       <p className="text-xs text-[var(--text-secondary)] mt-1 ml-1">Where to generate the config file</p>
                   </div>
                   <div>
                       <Input 
                         label="Log Path"
                         placeholder="sing-box.log (or absolute path)"
                         {...register('singbox_log_path')}
                       />
                       <p className="text-xs text-[var(--text-secondary)] mt-1 ml-1">Where logs are outputted</p>
                   </div>
                </div>
            </div>
        )}

        {/* Clash API Settings */}
        <div className="pt-6 mt-6 border-t border-[var(--border-color)]">
           <h3 className="text-xs font-mono font-bold text-[var(--text-secondary)] tracking-widest uppercase mb-4">
               API CONFIGURATION
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Input 
                 label={t('settings.singbox_clash_api_port')}
                 placeholder="9090"
                 {...register('singbox_clash_api_port')}
               />
               <Input 
                 label={t('settings.singbox_clash_api_secret')}
                 type="password"
                 placeholder="Secret"
                 {...register('singbox_clash_api_secret')}
               />
           </div>
        </div>
        </Panel>

        {/* Traffic & Analytics Settings */}
        <Panel variant="elevated" className="p-6">
            <SectionHeader
                variant="primary"
                icon={Activity}
                title={t('settings.traffic_analytics')}
                description="Manage dashboard statistics and data retention"
                color="green"
            />

            {/* Compact Parameters UI */}
            <div className="space-y-6 mt-6">
               <div>
                   <h4 className="text-[10px] font-mono font-bold text-[var(--text-secondary)] tracking-widest mb-3 uppercase">DASHBOARD REFRESH INTERVALS</h4>
                   <div className="bg-[var(--bg-base)] border border-[var(--border-color)] divide-y divide-[var(--border-color)] px-4">
                      <div className="flex items-center justify-between py-3">
                          <label className="text-sm font-mono text-[var(--text-secondary)] uppercase">Traffic Chart</label>
                          <Select {...register('app_traffic_refresh_interval')} containerClassName="w-32 shrink-0">
                              <option value="5000">5s</option>
                              <option value="10000">10s</option>
                              <option value="30000">30s</option>
                              <option value="60000">60s</option>
                          </Select>
                      </div>
                      <div className="flex items-center justify-between py-3">
                          <label className="text-sm font-mono text-[var(--text-secondary)] uppercase">Dashboard Cards</label>
                          <Select {...register('app_system_stats_refresh_interval')} containerClassName="w-32 shrink-0">
                              <option value="2000">2s</option>
                              <option value="5000">5s</option>
                              <option value="10000">10s</option>
                              <option value="30000">30s</option>
                          </Select>
                      </div>
                      <div className="flex items-center justify-between py-3">
                          <label className="text-sm font-mono text-[var(--text-secondary)] uppercase">Connections Matrix</label>
                          <Select {...register('app_connections_refresh_interval')} containerClassName="w-32 shrink-0">
                              <option value="1000">1s</option>
                              <option value="2000">2s</option>
                              <option value="5000">5s</option>
                              <option value="10000">10s</option>
                          </Select>
                      </div>
                   </div>
               </div>

               <div>
                   <h4 className="text-[10px] font-mono font-bold text-[var(--text-secondary)] tracking-widest mb-3">DATABASE & CACHE RULES</h4>
                   <div className="bg-[var(--bg-base)] border border-[var(--border-color)] divide-y divide-[var(--border-color)] px-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
                          <div>
                              <label className="text-sm font-mono text-[var(--text-secondary)] block">{t('settings.collection_interval')}</label>
                              <span className="text-[10px] text-[var(--text-secondary)]/50 block mt-0.5">{t('settings.collection_desc')}</span>
                          </div>
                          <Select {...register('app_traffic_collection_interval')} containerClassName="w-32 shrink-0">
                              <option value="2000">2s</option>
                              <option value="5000">5s</option>
                              <option value="10000">10s</option>
                              <option value="30000">30s</option>
                          </Select>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
                          <div>
                              <label className="text-sm font-mono text-[var(--text-secondary)] block">{t('settings.data_retention')}</label>
                              <span className="text-[10px] text-[var(--text-secondary)]/50 block mt-0.5">{t('settings.retention_desc')}</span>
                          </div>
                          <Select {...register('app_traffic_retention_days')} containerClassName="w-32 shrink-0">
                              <option value="1">1 {t('common.days')}</option>
                              <option value="3">3 {t('common.days')}</option>
                              <option value="7">7 {t('common.days')}</option>
                              <option value="30">30 {t('common.days')}</option>
                          </Select>
                      </div>
                      <div className="flex items-center justify-between py-3">
                          <label className="text-sm font-mono text-[var(--text-secondary)] uppercase">User Cache TTL</label>
                          <Select {...register('app_traffic_user_cache_ttl_mins')} containerClassName="w-32 shrink-0">
                              <option value="1">1m</option>
                              <option value="5">5m</option>
                              <option value="10">10m</option>
                              <option value="30">30m</option>
                          </Select>
                      </div>
                      <div className="flex items-center justify-between py-3">
                          <label className="text-sm font-mono text-[var(--text-secondary)] uppercase">Inbound Cache TTL</label>
                          <Select {...register('app_traffic_inbound_cache_ttl_mins')} containerClassName="w-32 shrink-0">
                              <option value="5">5m</option>
                              <option value="10">10m</option>
                              <option value="30">30m</option>
                              <option value="60">60m</option>
                          </Select>
                      </div>
                   </div>
               </div>
            </div>
        </Panel>

        {/* End of Form Elements */}

        <div className="flex justify-end pt-4">
          <Button type="submit" isLoading={updateMutation.isPending} className="font-mono uppercase tracking-wider min-w-32 rounded-none">
            <Save className="w-4 h-4 mr-2" />
            {t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
