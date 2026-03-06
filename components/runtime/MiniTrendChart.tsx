'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

// ========================================
// Types
// ========================================

export interface TrendDataPoint {
    value: number;
    timestamp: number;
}

// ========================================
// Mini Trend Chart Component
// ========================================

interface MiniTrendChartProps {
    data: TrendDataPoint[];
    color?: string;
    height?: number;
    showGradient?: boolean;
    strokeWidth?: number;
    smooth?: boolean;
}

const MiniTrendChart = memo(({
    data,
    color = '#6366f1',
    height = 32,
    showGradient = true,
    strokeWidth = 1.5,
    smooth = true,
}: MiniTrendChartProps) => {
    if (!data || data.length < 2) {
        return (
            <svg width="100%" height={height} className="opacity-30">
                <line
                    x1="0" y1={height / 2}
                    x2="100%" y2={height / 2}
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                />
            </svg>
        );
    }

    const width = 100;
    const padding = 2;

    // Normalize data to fit the SVG view
    const min = Math.min(...data.map(d => d.value));
    const max = Math.max(...data.map(d => d.value));
    const range = max - min || 1;

    const getX = (index: number) => padding + (index / (data.length - 1)) * (width - padding * 2);
    const getY = (value: number) => height - padding - ((value - min) / range) * (height - padding * 2);

    // Generate path
    const points = data.map((d, i) => [getX(i), getY(d.value)]);

    let pathD = '';
    if (smooth && points.length > 2) {
        // Catmull-Rom spline for smooth curves
        pathD = generateSmoothPath(points);
    } else {
        // Simple line
        pathD = `M ${points.map(p => p.join(',')).join(' L ')}`;
    }

    // Generate area path for gradient fill
    const areaD = `${pathD} L ${points[points.length - 1][0]},${height} L ${points[0][0]},${height} Z`;

    // Get trend direction for arrow indicator
    const firstAvg = data.slice(0, Math.ceil(data.length / 3)).reduce((a, b) => a + b.value, 0) / Math.ceil(data.length / 3);
    const lastAvg = data[data.length - 1].value;
    const trend = lastAvg > firstAvg ? 'up' : lastAvg < firstAvg ? 'down' : 'flat';

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
            <defs>
                <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>

            {/* Area fill */}
            {showGradient && (
                <path
                    d={areaD}
                    fill={`url(#gradient-${color.replace('#', '')})`}
                />
            )}

            {/* Line */}
            <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn(
                    "drop-shadow-[0_0_4px_rgba(99,102,241,0.3)]"
                )}
            />

            {/* End dot */}
            <circle
                cx={points[points.length - 1][0]}
                cy={points[points.length - 1][1]}
                r={2}
                fill={color}
                className="animate-glow-pulse"
            />

            {/* Trend indicator */}
            <g
                transform={`translate(${width - 10}, 6)`}
                className={cn(
                    "transition-opacity",
                    trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
                )}
            >
                <path
                    d={
                        trend === 'up'
                            ? "M0 5 L4 0 L8 5"
                            : trend === 'down'
                                ? "M0 0 L4 5 L8 0"
                                : "M2 0 L6 5 M2 5 L6 0"
                    }
                    fill="none"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>
        </svg>
    );
});

MiniTrendChart.displayName = 'MiniTrendChart';

// ========================================
// Utility: Generate Smooth Path
// ========================================

function generateSmoothPath(points: [number, number][]): string {
    if (points.length < 2) return '';

    // Catmull-Rom to cubic Bezier conversion
    const formatPoint = (p: [number, number]) => p.join(',');

    let path = `M ${formatPoint(points[0])}`;

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];

        const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
        const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
        const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
        const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${formatPoint(p2)}`;
    }

    return path;
}

// ========================================
// Histogram Bar Chart Component
// ========================================

interface MiniHistogramProps {
    data: number[];
    color?: string;
    height?: number;
    gap?: number;
}

export const MiniHistogram = memo(({
    data,
    color = '#6366f1',
    height = 20,
    gap = 2,
}: MiniHistogramProps) => {
    if (!data || data.length === 0) {
        return (
            <svg width="100%" height={height} className="opacity-30">
                <line
                    x1="0" y1={height / 2}
                    x2="100%" y2={height / 2}
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                />
            </svg>
        );
    }

    const max = Math.max(...data) || 1;
    const barWidth = (100 / data.length) - gap;

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${100} ${height}`} preserveAspectRatio="none">
            {data.map((value, i) => {
                const barHeight = (value / max) * (height - 4);
                const x = i * (100 / data.length) + gap / 2;
                const y = height - barHeight - 2;

                return (
                    <g key={i}>
                        <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            rx={Math.min(barWidth / 2, 2)}
                            fill={color}
                            className="transition-all duration-300"
                            opacity={0.6 + (value / max) * 0.4}
                        />
                    </g>
                );
            })}
        </svg>
    );
});

MiniHistogram.displayName = 'MiniHistogram';

// ========================================
// Gauge/Progress Ring Component
// ========================================

interface MiniGaugeProps {
    value: number; // 0-100
    color?: string;
    size?: number;
    strokeWidth?: number;
    showLabel?: boolean;
}

export const MiniGauge = memo(({
    value,
    color = '#4ade80',
    size = 40,
    strokeWidth = 4,
    showLabel = false,
}: MiniGaugeProps) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
            {/* Background ring */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={strokeWidth}
            />
            {/* Progress ring */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-700 ease-out"
                style={{
                    filter: `drop-shadow(0 0 4px ${color})`
                }}
            />
            {showLabel && (
                <text
                    x={size / 2}
                    y={size / 2}
                    fill="white"
                    fontSize={size / 3}
                    fontWeight="600"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="rotate-[90deg]"
                >
                    {Math.round(value)}%
                </text>
            )}
        </svg>
    );
});

MiniGauge.displayName = 'MiniGauge';

export default MiniTrendChart;
