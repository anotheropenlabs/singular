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
        blue: 'text-[var(--accent-primary)] border-[var(--accent-primary)]/30',
        green: 'text-[var(--status-success)] border-[var(--status-success)]/30',
        purple: 'text-[#a855f7] border-[#a855f7]/30', // 紫色在主题中未定义，暂时保持原色或查找接近的
        orange: 'text-[var(--status-warning)] border-[var(--status-warning)]/30',
    };

    const chartColor = {
        blue: 'var(--accent-primary)',
        green: 'var(--status-success)',
        purple: '#a855f7',
        orange: 'var(--status-warning)'
    }[color];

    const processedChartData = chartData?.map(val => ({ val }));

    return (
        <Panel
            className={cn("hover:border-[var(--bg-surface-hover)] transition-none rounded-none border-[var(--border-color)] bg-[var(--bg-surface)]", className)}
            innerClassName="h-full flex flex-col justify-between"
        >
            <div className="flex justify-between items-start z-10 p-4">
                <div>
                    <div className="flex items-center gap-1.5 mb-1 text-[var(--text-secondary)]">
                        <p className="text-xs font-mono font-medium uppercase tracking-wider">{title}</p>
                        {tooltip && (
                            <>
                                <Info
                                    className="w-3.5 h-3.5 hover:text-[var(--text-primary)] cursor-help transition-colors"
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={() => setShowTooltip(false)}
                                />
                                {showTooltip && typeof document !== 'undefined' && createPortal(
                                    <div
                                        className="fixed z-[9999] w-56 p-2 rounded-none bg-[var(--bg-base)] border border-[var(--border-color)] shadow-2xl pointer-events-none"
                                        style={{
                                            left: tooltipPos.x,
                                            top: tooltipPos.y - 8,
                                            transform: 'translate(-50%, -100%)'
                                        }}
                                    >
                                        <p className="text-[10px] font-mono text-[var(--text-secondary)] leading-tight">{tooltip}</p>
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--bg-base)] border-b border-r border-[var(--border-color)] rotate-45" />
                                    </div>,
                                    document.body
                                )}
                            </>
                        )}
                    </div>
                    <h3 className="text-2xl font-mono font-bold text-[var(--text-primary)] tracking-tight">{value}</h3>

                    {trend && (
                        <div className="flex items-center mt-2 gap-2">
                            <span className={cn(
                                "font-mono font-bold text-[10px] px-1 py-0.5 uppercase tracking-wider",
                                trend.direction === 'up' ? "bg-[var(--status-success)]/10 text-[var(--status-success)] border border-[var(--status-success)]/30" :
                                    trend.direction === 'down' ? "bg-[var(--status-error)]/10 text-[var(--status-error)] border border-[var(--status-error)]/30" :
                                        "bg-[var(--bg-surface-hover)]/50 text-[var(--text-secondary)] border border-[var(--border-color)]"
                            )}>
                                {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'} {Math.abs(trend.value)}%
                            </span>
                            <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">{trend.label}</span>
                        </div>
                    )}
                </div>

                <div className={cn("p-2 border rounded-none bg-[var(--bg-base)]/50", colorMap[color])}>
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
                                    <stop offset="0%" stopColor={`var(--${color === 'blue' ? 'accent-primary' : color === 'green' ? 'status-success' : 'status-warning'})`} stopOpacity={0.4} />
                                    <stop offset="100%" stopColor={`var(--${color === 'blue' ? 'accent-primary' : color === 'green' ? 'status-success' : 'status-warning'})`} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <YAxis domain={[0, 'dataMax + 10']} hide />
                            <Area
                                type="step"
                                dataKey="val"
                                stroke={`var(--${color === 'blue' ? 'accent-primary' : color === 'green' ? 'status-success' : 'status-warning'})`}
                                strokeWidth={1}
                                fill={`url(#gradient-${color})`}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {breakdown && Object.keys(breakdown).length > 0 && (
                <div className="absolute bottom-2 left-4 right-4 pt-2 border-t border-[var(--border-color)] flex flex-wrap gap-x-4 gap-y-1 z-10">
                    {Object.entries(breakdown).map(([key, count]) => (
                        <div key={key} className="flex items-center gap-1.5 text-[10px] font-mono">
                            <span className="text-[var(--text-secondary)] uppercase tracking-widest">{key}</span>
                            <span className="text-[var(--text-primary)] font-bold">{count}</span>
                        </div>
                    ))}
                </div>
            )}
        </Panel>
    );
}
