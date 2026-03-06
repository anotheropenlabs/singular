'use client';

import { memo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Zap, Check, X, Clock } from 'lucide-react';

// ========================================
// Types
// ========================================

export type TestStatus = 'idle' | 'testing' | 'completed' | 'error';

export interface LatencyTestProgressProps {
    status: TestStatus;
    progress: number; // 0-100
    tested?: number;
    total?: number;
    onRetry?: () => void;
}

// ========================================
// Mini Progress Bar Component
// ========================================

interface MiniProgressBarProps {
    progress: number;
    color?: string;
    animated?: boolean;
}

export const MiniProgressBar = memo(({ progress, color = '#6366f1', animated = true }: MiniProgressBarProps) => {
    return (
        <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
                className={cn(
                    "h-full rounded-full transition-all duration-300 ease-out",
                    animated && progress > 0 && progress < 100 && "animate-pulse"
                )}
                style={{
                    width: `${Math.min(100, Math.max(0, progress))}%`,
                    backgroundColor: color,
                }}
            >
                {/* Shimmer effect when active */}
                {animated && progress > 0 && progress < 100 && (
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_1s_infinite]" />
                    </div>
                )}
            </div>
        </div>
    );
});

MiniProgressBar.displayName = 'MiniProgressBar';

// ========================================
// Test Status Indicator
// ========================================

interface TestStatusIndicatorProps {
    status: TestStatus;
    progress?: number;
    size?: 'sm' | 'md' | 'lg';
}

export const TestStatusIndicator = memo(({ status, progress = 0, size = 'md' }: TestStatusIndicatorProps) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    const getIcon = () => {
        switch (status) {
            case 'testing':
                return <Loader2 className={cn("w-full h-full", sizeClasses[size])} />;
            case 'completed':
                return <Check className={cn("w-full h-full", sizeClasses[size])} />;
            case 'error':
                return <X className={cn("w-full h-full", sizeClasses[size])} />;
            default:
                return <Clock className={cn("w-full h-full", sizeClasses[size])} />;
        }
    };

    const getColor = () => {
        switch (status) {
            case 'testing':
                return 'text-sing-blue';
            case 'completed':
                return 'text-sing-green';
            case 'error':
                return 'text-sing-red';
            default:
                return 'text-white/40';
        }
    };

    return (
        <div className={cn(
            "flex items-center justify-center rounded-full",
            getColor(),
            status === 'testing' && "animate-spin"
        )}>
            {getIcon()}
        </div>
    );
});

TestStatusIndicator.displayName = 'TestStatusIndicator';

// ========================================
// Node Test Progress Component
// ========================================

interface NodeTestProgressProps {
    status: 'pending' | 'testing' | 'success' | 'error' | 'timeout';
    latency?: number;
}

export const NodeTestProgress = memo(({ status, latency }: NodeTestProgressProps) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'testing':
                return { color: 'border-sing-blue bg-sing-blue/10', icon: Loader2, animate: true };
            case 'success':
                return { color: 'border-sing-green bg-sing-green/10 text-sing-green', icon: Check, animate: false };
            case 'error':
            case 'timeout':
                return { color: 'border-sing-red bg-sing-red/10 text-sing-red', icon: X, animate: false };
            default:
                return { color: 'border-white/10 bg-white/5', icon: null, animate: false };
        }
    };

    const config = getStatusConfig();

    return (
        <div className={cn(
            "relative w-full h-1 rounded-full overflow-hidden border transition-all duration-300",
            config.color
        )}>
            {status === 'testing' && (
                <div className="absolute inset-0 flex items-center">
                    <div className="h-full w-1/3 animate-[progress-loading_1s_infinite]" style={{
                        background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.6), transparent)',
                    }} />
                </div>
            )}
            {config.icon && (
                <div className={cn(
                    "absolute right-0 top-1/2 -translate-y-1/2 p-0.5 rounded-full flex items-center justify-center",
                    status === 'testing' && 'animate-spin w-3 h-3'
                )}>
                    <config.icon className={cn("w-2 h-2 text-current", status === 'testing' && 'animate-spin')} />
                </div>
            )}
        </div>
    );
});

NodeTestProgress.displayName = 'NodeTestProgress';

// ========================================
// Test Wave Animation
// ========================================

interface TestWaveProps {
    active: boolean;
    color?: string;
    size?: number;
}

export const TestWave = memo(({ active, color = '#6366f1', size = 100 }: TestWaveProps) => {
    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {active && (
                <>
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className={cn(
                                "absolute rounded-full border pointer-events-none",
                                active ? "animate-wave-expand" : ""
                            )}
                            style={{
                                width: size,
                                height: size,
                                borderColor: color,
                                borderWidth: `${2 - i * 0.5}px`,
                                opacity: 0.8 - i * 0.2,
                                animationDelay: `${i * 0.3}s`,
                            }}
                        />
                    ))}
                </>
            )}
            {/* Center pulse */}
            <div
                className={cn(
                    "absolute rounded-full transition-all duration-300",
                    active ? "bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg animate-pulse" : "bg-white/10"
                )}
                style={{
                    width: size * 0.4,
                    height: size * 0.4,
                }}
            >
                {active && (
                    <Zap className="absolute inset-0 m-auto w-1/2 h-1/2 text-white" />
                )}
            </div>
        </div>
    );
});

TestWave.displayName = 'TestWave';

// ========================================
// Main Latency Test Progress Component
// ========================================

const LatencyTestProgress = memo(({
    status,
    progress,
    tested = 0,
    total = 0,
    onRetry,
}: LatencyTestProgressProps) => {
    const [showRetry, setShowRetry] = useState(false);

    useEffect(() => {
        if (status === 'error') {
            const timer = setTimeout(() => setShowRetry(true), 500);
            return () => clearTimeout(timer);
        } else {
            setShowRetry(false);
        }
    }, [status]);

    if (status === 'idle') {
        return (
            <div className="flex items-center gap-2 text-white/40 text-sm">
                <Clock className="w-4 h-4" />
                <span>点击测试延迟</span>
            </div>
        );
    }

    if (status === 'completed') {
        return (
            <div className="flex items-center gap-2 text-sing-green text-sm">
                <Check className="w-4 h-4" />
                <span>测试完成</span>
            </div>
        );
    }

    if (status === 'error' && showRetry && onRetry) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sing-red text-sm">
                    <X className="w-4 h-4" />
                    <span>测试失败</span>
                </div>
                <button
                    onClick={onRetry}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-sing-blue/20 text-sing-blue border border-sing-blue/30 hover:bg-sing-blue/30 transition-colors"
                >
                    重试
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            {/* Animated icon */}
            <div className="relative w-8 h-8">
                <Loader2 className="w-full h-full text-sing-blue animate-spin" />
                {/* Outer ring pulse */}
                <div className="absolute inset-0 rounded-full border-2 border-sing-blue/30 animate-ping" />
            </div>

            {/* Progress info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white/70">
                        {status === 'testing' ? '正在测试延迟...' : ''}
                    </span>
                    <span className="text-xs font-mono text-white/50">
                        {total > 0 ? `${tested}/${total}` : `${progress}%`}
                    </span>
                </div>
                <MiniProgressBar progress={progress} color="#6366f1" />
            </div>
        </div>
    );
});

LatencyTestProgress.displayName = 'LatencyTestProgress';

// ========================================
// Radial Test Progress Component
// ========================================

interface RadialTestProgressProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    showValue?: boolean;
    value?: string | number;
}

export const RadialTestProgress = memo(({
    progress,
    size = 80,
    strokeWidth = 6,
    color = '#6366f1',
    showValue = true,
    value,
}: RadialTestProgressProps) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {/* Background ring */}
            <svg width={size} height={size} className="rotate-[-90deg]" style={{ transformOrigin: 'center' }}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
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
                    className="transition-all duration-300 ease-out"
                    style={{
                        filter: `drop-shadow(0 0 8px ${color}40)`,
                    }}
                />
            </svg>

            {/* Center content */}
            {showValue && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-white font-mono">
                        {value !== undefined ? value : `${Math.round(progress)}%`}
                    </span>
                </div>
            )}
        </div>
    );
});

RadialTestProgress.displayName = 'RadialTestProgress';

// ========================================
// Test Results Summary Component
// ========================================

export interface TestResultsSummary {
    total: number;
    success: number;
    failed: number;
    timeout: number;
    avgLatency?: number;
    minLatency?: number;
    maxLatency?: number;
}

interface TestSummaryProps {
    results: TestResultsSummary;
}

export const TestSummary = memo(({ results }: TestSummaryProps) => {
    const successRate = results.total > 0 ? (results.success / results.total) * 100 : 0;

    return (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white">测试结果</h4>
                <span className="text-xs text-white/40">{results.total} 个节点</span>
            </div>

            {/* Status indicators */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 rounded-lg bg-sing-green/10 border border-sing-green/20">
                    <p className="text-lg font-bold text-sing-green font-mono">{results.success}</p>
                    <p className="text-[10px] text-white/40">正常</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-sing-red/10 border border-sing-red/20">
                    <p className="text-lg font-bold text-sing-red font-mono">{results.failed}</p>
                    <p className="text-[10px] text-white/40">失败</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-sing-yellow/10 border border-sing-yellow/20">
                    <p className="text-lg font-bold text-sing-yellow font-mono">{results.timeout}</p>
                    <p className="text-[10px] text-white/40">超时</p>
                </div>
            </div>

            {/* Success rate bar */}
            <div className="space-y-3">
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/60">成功率</span>
                        <span className="text-xs font-mono text-sing-green">{successRate.toFixed(0)}%</span>
                    </div>
                    <MiniProgressBar progress={successRate} color="#4ade80" />
                </div>

                {results.avgLatency !== undefined && (
                    <div className="pt-2 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-[10px] text-white/40">平均</p>
                            <p className="text-sm font-mono text-white">{results.avgLatency}ms</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-white/40">最快</p>
                            <p className="text-sm font-mono text-sing-green">{results.minLatency}ms</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-white/40">最慢</p>
                            <p className="text-sm font-mono text-sing-orange">{results.maxLatency}ms</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

TestSummary.displayName = 'TestSummary';

export default LatencyTestProgress;
