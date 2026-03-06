'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { formatBytes } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface UserTrafficData {
  username: string;
  upload: number;
  download: number;
  total: number;
}

import { useSystemSettings } from '@/hooks/useSystemSettings';

export default function TopUsersChart() {
  const { t } = useI18n();
  const { settings } = useSystemSettings();
  const refreshInterval = settings ? parseInt(settings.app_traffic_refresh_interval || '5000') : 5000;

  const { data, isLoading } = useQuery({
    queryKey: ['traffic-top-users'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/top');
      if (!res.ok) throw new Error('Failed to fetch top users');
      const json = await res.json();
      return (json.data?.users || []) as UserTrafficData[];
    },
    refetchInterval: refreshInterval, 
  });

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center text-white/30">
        Loading chart...
      </div>
    );
  }

  if (!data || data.length === 0) {
      return (
        <div className="h-[300px] flex items-center justify-center text-white/30">
          No user traffic data available
        </div>
      );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="username" 
            type="category" 
            stroke="rgba(255,255,255,0.7)" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ backgroundColor: '#000000CC', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(8px)' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: number | undefined) => [formatBytes(value), 'Total Traffic']}
            labelStyle={{ color: '#fff' }}
          />
          <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : 'rgba(59, 130, 246, 0.5)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
