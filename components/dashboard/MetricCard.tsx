import { LucideIcon, Info } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import { createPortal } from 'react-dom';
import Panel from '../ui/GlassCard';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  breakdown?: Record<string, number>;
  chartData?: number[];
  tooltip?: string;
}

export default function MetricCard({ title, value, icon: Icon, trend, className, color = 'blue', breakdown, chartData, tooltip }: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ 
        x: rect.left + rect.width / 2, 
        y: rect.top 
    });
    setShowTooltip(true);
  };

  const colorMap = {
    blue: 'text-[#3b82f6] border-[#3b82f6]/30',
    green: 'text-[#10b981] border-[#10b981]/30',
    purple: 'text-[#a855f7] border-[#a855f7]/30',
    orange: 'text-[#f59e0b] border-[#f59e0b]/30',
  };

  const chartColor = {
      blue: '#3b82f6',
      green: '#10b981',
      purple: '#a855f7',
      orange: '#f59e0b'
  }[color];

  const processedChartData = chartData?.map(val => ({ val }));

  return (
    <Panel 
        className={cn("hover:border-[#3f3f46] transition-none rounded-none border-[#27272a] bg-[#09090b]", className)}
        innerClassName="h-full flex flex-col justify-between"
    >
      <div className="flex justify-between items-start z-10 p-4">
        <div>
            <div className="flex items-center gap-1.5 mb-1 text-[#71717a]">
                <p className="text-xs font-mono font-medium uppercase tracking-wider">{title}</p>
                {tooltip && (
                    <>
                        <Info
                            className="w-3.5 h-3.5 hover:text-[#e4e4e7] cursor-help transition-colors"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={() => setShowTooltip(false)}
                        />
                        {showTooltip && typeof document !== 'undefined' && createPortal(
                            <div 
                                className="fixed z-[9999] w-56 p-2 rounded-none bg-[#000000] border border-[#27272a] shadow-2xl pointer-events-none"
                                style={{
                                    left: tooltipPos.x,
                                    top: tooltipPos.y - 8,
                                    transform: 'translate(-50%, -100%)'
                                }}
                            >
                                <p className="text-[10px] font-mono text-[#a1a1aa] leading-tight">{tooltip}</p>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#000000] border-b border-r border-[#27272a] rotate-45" />
                            </div>,
                            document.body
                        )}
                    </>
                )}
            </div>
            <h3 className="text-2xl font-mono font-bold text-[#f4f4f5] tracking-tight">{value}</h3>
            
            {trend && (
            <div className="flex items-center mt-2 gap-2">
                <span className={cn(
                "font-mono font-bold text-[10px] px-1 py-0.5 uppercase tracking-wider",
                trend.direction === 'up' ? "bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30" : 
                trend.direction === 'down' ? "bg-[#e11d48]/10 text-[#e11d48] border border-[#e11d48]/30" : 
                "bg-[#27272a]/50 text-[#a1a1aa] border border-[#3f3f46]"
                )}>
                {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'} {Math.abs(trend.value)}%
                </span>
                <span className="text-[10px] font-mono text-[#71717a] uppercase">{trend.label}</span>
            </div>
            )}
        </div>
        
        <div className={cn("p-2 border rounded-none bg-[#000000]/50", colorMap[color])}>
            <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
      </div>

      {/* Embedded Chart */}
      {chartData && chartData.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-60 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={processedChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartColor} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <YAxis domain={[0, 'dataMax + 10']} hide />
                    <Area 
                        type="step" 
                        dataKey="val" 
                        stroke={chartColor} 
                        strokeWidth={1} 
                        fill={`url(#gradient-${color})`}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      )}

      {breakdown && Object.keys(breakdown).length > 0 && (
          <div className="absolute bottom-2 left-4 right-4 pt-2 border-t border-[#27272a] flex flex-wrap gap-x-4 gap-y-1 z-10">
            {Object.entries(breakdown).map(([key, count]) => (
                <div key={key} className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="text-[#71717a] uppercase tracking-widest">{key}</span>
                    <span className="text-[#e4e4e7] font-bold">{count}</span>
                </div>
            ))}
          </div>
      )}
    </Panel>
  );
}
