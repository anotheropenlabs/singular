'use client';

import { 
  Server, 
  Users, 
  Activity, 
  Cpu,
  MemoryStick,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import TrafficTrendChart from '@/components/analytics/TrafficTrendChart';

import Button from '@/components/ui/Button';
import Panel from '@/components/ui/GlassCard';
import MetricCard from '@/components/dashboard/MetricCard';
import Select from '@/components/ui/Select';
import { useSystemStats, useSystemMutations } from '@/hooks/useSystemStats';
import { useSystemMode } from '@/hooks/useSystemSettings';
import { cn, formatBytes } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useState } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';

const TRAFFIC_RANGES = [
  { key: 'analytics.range_30m', minutes: 30 },
  { key: 'analytics.range_1h',  minutes: 60 },
  { key: 'analytics.range_6h',  minutes: 360 },
  { key: 'analytics.range_24h', minutes: 1440 },
  { key: 'analytics.range_7d',  minutes: 10080 },
] as const;



export default function DashboardPage() {
  const { t } = useI18n();
  const { data: stats, refetch, connectionHistory, cpuHistory, memoryHistory } = useSystemStats();
  const { executeAction } = useSystemMutations();
  const { data: systemMode = 'server' } = useSystemMode();
  const isServer = systemMode === 'server';
  const [confirmAction, setConfirmAction] = useState<'start' | 'stop' | 'restart' | null>(null);
  const [trafficMinutes, setTrafficMinutes] = useState<number>(1440);

  const handleExecuteAction = () => {
    if (!confirmAction) return;
    executeAction.mutate(confirmAction, {
      onSuccess: () => {
        toast.success(t('common.success'));
        refetch();
        setConfirmAction(null);
      },
      onError: (err: any) => {
        toast.error(err.message || t('common.error'));
        setConfirmAction(null);
      }
    });
  };

  const handleActionClick = (action: 'start' | 'stop' | 'restart') => {
    setConfirmAction(action);
  };

  return (
    <div className="space-y-6">
      {/* Strict Header */}
      <PageHeader
        title="Sing-box Kernel"
        subtitle={t('dashboard.subtitle')}
        actions={
          <>
            {/* System Status Block */}
            <div className={cn(
                "px-3 py-1 flex items-center gap-2 border font-mono text-xs uppercase tracking-widest font-bold",
                stats?.status === 'running' 
                    ? "border-[#10b981]/50 text-[#10b981] bg-[#10b981]/10" 
                    : "border-[#e11d48]/50 text-[#e11d48] bg-[#e11d48]/10"
            )}>
                <div className={cn("w-1.5 h-1.5 rounded-none", stats?.status === 'running' ? "bg-[#10b981]" : "bg-[#e11d48]")} />
                {stats?.status || 'UNKNOWN'}
            </div>
            {stats?.status === 'running' && (
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleActionClick('restart')}
                    isLoading={executeAction.isPending && confirmAction === 'restart'}
                >
                    {t('dashboard.restart_core')}
                </Button>
            )}
          </>
        }
      />

      <div className={`grid gap-4 grid-cols-2 ${isServer ? 'md:grid-cols-3 lg:grid-cols-5' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
        <MetricCard 
          title={t('dashboard.inbounds')}
          value={stats?.inbounds || 0} 
          icon={Server} 
          color="blue"
          breakdown={stats?.inboundsProtocol}
          className="h-32"
        />
        {isServer && (
          <MetricCard 
            title={t('dashboard.users')} 
            value={stats?.users || 0} 
            icon={Users} 
            color="purple"
            className="h-32"
          />
        )}
        <MetricCard 
          title={t('dashboard.connections')} 
          value={stats?.connections || 0} 
          icon={Activity} 
          color="green"
          className="h-32"
          chartData={connectionHistory}
        />
        <MetricCard 
          title={t('dashboard.cpu')} 
          value={stats?.cpu || '0%'} 
          icon={Cpu} 
          color="blue"
          className="h-32"
          chartData={cpuHistory}
          tooltip={t('dashboard.cpu_tooltip')}
        />
        <MetricCard 
          title={t('dashboard.memory')} 
          value={stats?.memory?.split(' / ')[0] || '0 MB'} 
          icon={MemoryStick} 
          color="purple"
          className="h-32"
          chartData={memoryHistory}
          tooltip={t('dashboard.memory_tooltip')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative h-[450px]">
          <Panel className="absolute inset-0 p-5" variant="elevated" innerClassName="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 gap-4">
                <div className="min-w-0">
                   <h3 className="text-sm font-mono font-bold text-[#e4e4e7] uppercase tracking-wider">{t('dashboard.traffic_overview')}</h3>
                   <p className="text-[10px] font-mono text-[#71717a] mt-1 uppercase">BANDWIDTH CONSUMPTION OVER TIME</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    {/* DL / UL totals */}
                    <div className="flex gap-4 text-[10px] font-mono tracking-widest font-bold">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-[#3b82f6] shrink-0" />
                            <span className="text-[#a1a1aa] whitespace-nowrap">DL {formatBytes(stats?.traffic?.totalDown || 0)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-[#22d3ee] shrink-0" />
                            <span className="text-[#a1a1aa] whitespace-nowrap">UL {formatBytes(stats?.traffic?.totalUp || 0)}</span>
                        </div>
                    </div>
                    {/* Time range selector */}
                    <Select
                      value={trafficMinutes}
                      onChange={(e) => setTrafficMinutes(Number(e.target.value))}
                      className="h-7 text-[10px] py-0 w-36"
                    >
                      {TRAFFIC_RANGES.map((r) => (
                        <option key={r.minutes} value={r.minutes}>{t(r.key)}</option>
                      ))}
                    </Select>
                </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              <TrafficTrendChart
                hideRangeSelector
                minutes={trafficMinutes}
                onMinutesChange={setTrafficMinutes}
              />
            </div>
          </Panel>
        </div>

        <div className="relative h-[450px]">
          <Panel className="absolute inset-0 p-5 flex flex-col" variant="elevated">
             <div className="mb-6">
                <h3 className="text-sm font-mono font-bold text-[#e4e4e7] uppercase tracking-wider">{t('dashboard.system_status')}</h3>
                <p className="text-[10px] font-mono text-[#71717a] mt-1 uppercase">RUNTIME ENVIRONMENT DETAILS</p>
             </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-4">
               {/* Hexdump / Raw Data Style Area */}
               <div className="bg-[#000000] border border-[#27272a] p-4 text-xs font-mono text-[#a1a1aa] leading-relaxed select-text overflow-hidden">
                   <div className="flex justify-between border-b border-[#27272a] pb-2 mb-2">
                      <span className="text-[#71717a]">VERSION_INF</span>
                      <span className="text-[#3b82f6] font-bold">{stats?.version || 'UNKNOWN'}</span>
                   </div>
                   <div className="flex justify-between border-b border-[#27272a] pb-2 mb-2">
                      <span className="text-[#71717a]">UPTIME_DUR</span>
                      <span className="text-[#e4e4e7]">{stats?.uptime || '0s'}</span>
                   </div>
                   <div className="flex justify-between border-b border-[#27272a] pb-2 mb-2">
                      <span className="text-[#71717a]">BIN_ARCH</span>
                      <span className="text-[#e4e4e7]">amd64 (Expected)</span>
                   </div>
                   <div className="flex justify-between border-[#27272a]">
                      <span className="text-[#71717a]">PROC_MEM</span>
                      <span className="text-[#e4e4e7]">{stats?.memory || 'N/A'}</span>
                   </div>
               </div>

                <div className="mt-auto grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={() => handleActionClick('stop')} disabled={stats?.status !== 'running'}>
                        HALT ENGINE
                    </Button>
                    <Button variant="primary" onClick={() => handleActionClick('start')} disabled={stats?.status === 'running'}>
                        BOOT ENGINE
                    </Button>
                </div>
            </div>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleExecuteAction}
        title={t('dashboard.confirm_service')}
        description={t('dashboard.confirm_service_desc').replace('{action}', confirmAction || '')}
        confirmLabel={t('common.confirm')}
        variant={confirmAction === 'stop' ? 'danger' : 'primary'}
        isLoading={executeAction.isPending}
      />
    </div>
  );
}
