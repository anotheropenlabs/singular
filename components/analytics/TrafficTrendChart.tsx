'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { formatBytes } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import Select from '@/components/ui/Select';

interface TrafficData {
  time: string;
  upload: number;
  download: number;
}

const TIME_RANGES = [
  { key: 'analytics.range_30m', minutes: 30 },
  { key: 'analytics.range_1h',  minutes: 60 },
  { key: 'analytics.range_6h',  minutes: 360 },
  { key: 'analytics.range_24h', minutes: 1440 },
  { key: 'analytics.range_7d',  minutes: 10080 },
] as const;

interface TrafficTrendChartProps {
  /** 隐藏内置的时间选择器（当父组件自行渲染时使用） */
  hideRangeSelector?: boolean;
  /** 受控的时间范围（分钟），不传则组件内部管理 */
  minutes?: number;
  /** minutes 变化时的回调 */
  onMinutesChange?: (minutes: number) => void;
}

export default function TrafficTrendChart({
  hideRangeSelector = false,
  minutes: minutesProp,
  onMinutesChange,
}: TrafficTrendChartProps = {}) {
  const { t } = useI18n();
  const { settings } = useSystemSettings();
  const refreshInterval = settings ? parseInt(settings.app_traffic_refresh_interval || '5000') : 5000;

  const [internalMinutes, setInternalMinutes] = useState<number>(1440);
  const activeMinutes = minutesProp ?? internalMinutes;

  const handleSelect = (m: number) => {
    if (onMinutesChange) {
      onMinutesChange(m);
    } else {
      setInternalMinutes(m);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['traffic-trend', activeMinutes],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/trend?minutes=${activeMinutes}`);
      if (!res.ok) throw new Error('Failed to fetch trend');
      const json = await res.json();
      return json.data as TrafficData[];
    },
    refetchInterval: refreshInterval,
  });

  const chartData = data?.map(item => {
    const date = new Date(item.time);
    const showMinutes = activeMinutes <= 360;
    const label = showMinutes
      ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      : `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:00`;
    return { ...item, timeDisplay: label };
  }) || [];

  // Flatline placeholder when no data
  let renderData = chartData;
  if (renderData.length === 0) {
    const now = new Date();
    const intervalMs = activeMinutes <= 60 ? 60000 : activeMinutes <= 360 ? 300000 : 900000;
    const count = 12;
    renderData = Array.from({ length: count }).map((_, i) => {
      const d = new Date(now.getTime() - (count - 1 - i) * intervalMs);
      return {
        timeDisplay: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
        upload: 0,
        download: 0,
        time: d.toISOString(),
      };
    });
  }

  const chart = (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={renderData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="timeDisplay"
          stroke="rgba(255,255,255,0.2)"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          tick={{ fontFamily: 'monospace' }}
        />
        <YAxis
          stroke="rgba(255,255,255,0.2)"
          fontSize={10}
          tickFormatter={(v) => formatBytes(v, 0)}
          tickLine={false}
          axisLine={false}
          width={72}
          tick={{ fontFamily: 'monospace' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#000000CC',
            borderColor: 'rgba(255,255,255,0.1)',
            borderRadius: '0',
            backdropFilter: 'blur(8px)',
            fontFamily: 'monospace',
            fontSize: '11px',
          }}
          itemStyle={{ color: '#fff' }}
          formatter={(value: number | undefined) => [formatBytes(value), '']}
          labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
        />
        <Area
          type="monotone"
          dataKey="download"
          name={t('dashboard.download') || 'Download'}
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorDown)"
          strokeWidth={1.5}
        />
        <Area
          type="monotone"
          dataKey="upload"
          name={t('dashboard.upload') || 'Upload'}
          stroke="#10b981"
          fillOpacity={1}
          fill="url(#colorUp)"
          strokeWidth={1.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  if (hideRangeSelector) {
    // 父组件负责高度容器，我们只负责撑满它
    return (
      <div className="w-full h-full">
        {isLoading
          ? <div className="h-full flex items-center justify-center text-[var(--text-secondary)] text-xs font-mono">LOADING...</div>
          : chart
        }
      </div>
    );
  }

  // 独立使用时，自带选择器 + 固定高度
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex justify-end">
        <Select
          value={activeMinutes}
          onChange={(e) => handleSelect(Number(e.target.value))}
          className="h-7 text-[10px] py-0 w-36"
        >
          {TIME_RANGES.map((r) => (
            <option key={r.minutes} value={r.minutes}>{t(r.key)}</option>
          ))}
        </Select>
      </div>
      <div className="h-[300px] w-full">
        {isLoading
          ? <div className="h-full flex items-center justify-center text-[var(--text-secondary)] text-xs font-mono">LOADING...</div>
          : chart
        }
      </div>
    </div>
  );
}
