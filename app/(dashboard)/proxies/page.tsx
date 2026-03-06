'use client';

import { memo, useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProxies, useSelectProxy, type ClashProxy } from '@/hooks/useProxies';
import { fetcher } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
    Zap,
    RefreshCw,
    Activity,
    ChevronDown,
    ChevronUp,
    Radio,
    Globe,
    SortAsc,
    Search,
    Filter,
    X,
    ChevronsDown,
    ChevronsUp
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import ProtocolBadge from '@/components/ui/ProtocolBadge';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import { useI18n } from '@/lib/i18n';
import Panel from '@/components/ui/GlassCard';

// ========================================
// Proxy Card Component
// ========================================

interface ProxyCardProps {
    name: string;
    type: string;
    latency: number;
    udp: boolean;
    isSelected: boolean;
    isTesting: boolean;
    failError: string | null;
    onSelect: () => void;
    onTest: (e: React.MouseEvent) => void;
    t: (key: string) => string;
}

const ProxyCard = memo(({
    name,
    type,
    latency,
    udp,
    isSelected,
    isTesting,
    failError,
    onSelect,
    onTest,
    t
}: ProxyCardProps) => {
    const isFailed = failError !== null;
    const getLatencyColor = (ms: number) => {
        if (ms <= 0) return 'text-[var(--text-secondary)]';
        if (ms < 300) return 'text-[var(--status-success)]';
        if (ms < 600) return 'text-[var(--status-warning)]';
        if (ms < 1000) return 'text-[var(--status-error)]';
        return 'text-[var(--status-error)]';
    };

    return (
        <div
            className={cn(
                "group relative w-full px-3 py-2 border transition-all duration-300 cursor-pointer rounded-none overflow-hidden",
                isTesting
                    ? "bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/30 animate-pulse"
                    : isSelected
                        ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/60 shadow-[0_0_15px_-5px_rgba(var(--accent-primary-rgb),0.3)]"
                        : "bg-[var(--bg-base)] border-[var(--border-color)] hover:border-[var(--text-secondary)]/50 hover:bg-[var(--bg-surface-hover)]"
            )}
            onClick={onSelect}
        >
            {/* Top-left accent */}
            <div className={cn(
                "absolute top-0 left-0 w-1 h-1 border-t border-l transition-colors duration-300",
                isSelected ? "border-[var(--accent-primary)]" : "border-transparent group-hover:border-[var(--text-secondary)]/50"
            )} />

            <div className="flex items-center justify-between gap-2 relative z-10">
                <div className="flex flex-col min-w-0">
                    <span className={cn(
                        "text-[11px] font-mono leading-tight truncate transition-colors duration-300",
                        isSelected ? "text-[var(--text-primary)] font-bold" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                    )}>
                        {name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 opacity-40 text-[9px] font-mono uppercase tracking-tighter">
                        <span className="truncate">{type}</span>
                        {udp && <span className="text-[var(--accent-primary)] font-bold">UDP</span>}
                    </div>
                </div>

                <div
                    onClick={(e) => { e.stopPropagation(); onTest(e); }}
                    className={cn(
                        "shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 transition-all duration-200 rounded-sm",
                        isTesting 
                            ? "bg-[var(--accent-primary)]/20 cursor-wait" 
                            : isFailed
                                ? "bg-[var(--status-error)]/10 text-[var(--status-error)] hover:bg-[var(--status-error)]/20"
                                : "bg-[var(--bg-surface-hover)] border border-transparent hover:border-[var(--border-color)] group-hover:bg-[var(--bg-surface)]"
                    )}
                    title={isFailed ? `${failError} — CLICK_TO_RETEST` : 'TEST_NODE_LATENCY'}
                >
                    {isTesting ? (
                        <Radio className="w-3 h-3 text-[var(--accent-primary)] animate-spin" />
                    ) : isFailed ? (
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest">
                            ERR
                        </span>
                    ) : (
                        <span className={cn(
                            "text-[10px] font-mono font-bold transition-colors flex items-baseline gap-0.5",
                            getLatencyColor(latency)
                        )}>
                            {latency > 0 ? latency : '---'}
                            <span className="text-[7px] opacity-40 font-normal uppercase">ms</span>
                        </span>
                    )}
                </div>
            </div>

            {/* Hover Scanning Line */}
            <div className="absolute inset-0 w-full h-[1px] bg-[var(--accent-primary)]/20 -translate-y-full group-hover:animate-[scan_2s_linear_infinite] pointer-events-none opacity-0 group-hover:opacity-100" />
            
            {/* Selection indicator background pulse */}
            {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent pointer-events-none animate-pulse" />
            )}
        </div>
    );
});

ProxyCard.displayName = 'ProxyCard';

// ========================================
// Proxy Group Component
// ========================================

interface ProxyGroupProps {
    name: string;
    current: string | undefined;
    proxies: Array<{ name: string; type: string; latency: number; udp: boolean }>;
    onSelect: (proxy: string) => void;
    onTest: (proxy: string, e: React.MouseEvent) => void;
    testingNodes: Set<string>;
    failedNodes: Map<string, string>;
    isExpanded: boolean;
    onToggle: () => void;
    type: string;
    onGroupTest: (groupName: string, e?: React.MouseEvent) => void;
}

const ProxyGroup = memo(({ name, current, proxies, onSelect, onTest, testingNodes, failedNodes, isExpanded, onToggle, type, onGroupTest }: ProxyGroupProps) => {
    const isSelected = (proxyName: string) => current === proxyName;
    const isUrlTest = type.toLowerCase() === 'urltest' || type.toLowerCase() === 'fallback';

    const selectedProxy = proxies.find(p => p.name === current);
    const displayLatency = selectedProxy?.latency || 0;

    if (proxies.length === 0) return null;

    return (
        <Panel variant="elevated" className="rounded-none border border-[var(--border-color)] overflow-hidden mb-6 group/pg">
            <div
                onClick={onToggle}
                className="w-full px-5 py-3 flex items-center justify-between bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border-b border-[var(--border-color)] transition-all duration-300 cursor-pointer group"
            >
                <div className="flex items-center gap-4 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <h2 className="text-[13px] font-mono font-bold text-[var(--text-primary)] truncate uppercase tracking-[0.1em]">{name}</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-mono text-[var(--text-secondary)] opacity-50 uppercase tracking-widest">{proxies.length} NODES</span>
                                <div className="w-1 h-1 rounded-full bg-[var(--border-color)]" />
                                <span className="text-[9px] font-mono text-[var(--accent-primary)] uppercase font-bold tracking-widest">{type}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    {displayLatency > 0 && (
                        <div className="flex flex-col items-end">
                             <span className="text-[11px] font-mono font-bold text-[var(--status-success)]">{displayLatency}ms</span>
                             <span className="text-[8px] font-mono text-[var(--text-secondary)] opacity-40 uppercase tracking-tighter">SELECTED_LATENCY</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 h-8 p-1 bg-[var(--bg-base)] border border-[var(--border-color)]">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => onGroupTest(name, e)}
                            className="w-6 h-6 hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)]"
                            title="BATCH_TEST_LATENCY"
                        >
                            <Zap className="w-3.5 h-3.5" />
                        </Button>

                        <div className="w-[1px] h-3 bg-[var(--border-color)]" />

                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn(
                                "w-6 h-6 transition-transform duration-300",
                                isExpanded ? "rotate-180" : ""
                            )}
                        >
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="p-3 bg-[var(--bg-base)] grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 animate-in fade-in slide-in-from-top-1 duration-300">
                    {proxies.map((proxy) => (
                        <ProxyCard
                            key={proxy.name}
                            name={proxy.name}
                            type={proxy.type}
                            latency={proxy.latency}
                            udp={proxy.udp}
                            isSelected={isSelected(proxy.name)}
                            isTesting={testingNodes.has(proxy.name)}
                            failError={failedNodes.get(proxy.name) ?? null}
                            onSelect={() => !isUrlTest && onSelect(proxy.name)}
                            onTest={(e) => onTest(proxy.name, e)}
                            t={(k) => k}
                        />
                    ))}
                </div>
            )}
        </Panel>
    );
});

ProxyGroup.displayName = 'ProxyGroup';

// ========================================
// UI Components
// ========================================

function SortButton({ sortBy, onToggle }: { sortBy: 'default' | 'latency' | 'type'; onToggle: () => void }) {
    const label = {
        'default': 'SORT: DEFAULT',
        'latency': 'SORT: LATENCY',
        'type': 'SORT: TYPE'
    }[sortBy];

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onToggle}
            className={cn(
                'flex items-center gap-1.5 h-8 px-3',
                sortBy !== 'default'
                    ? 'text-[var(--accent-primary)] border-[var(--accent-primary)]/50'
                    : 'text-[var(--text-secondary)] hover:border-[var(--text-secondary)]/30 text-[var(--text-secondary)]'
            )}
        >
            <SortAsc className="w-3.5 h-3.5" />
            <span>{label}</span>
        </Button>
    );
}

function SearchInput({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    return (
        <div className="relative group w-full flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="FILTER_PROXIES..."
                className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] h-8 pl-9 pr-9 text-[11px] font-mono text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all duration-300 focus:shadow-[0_0_15px_-5px_rgba(var(--accent-primary-rgb),0.3)] rounded-none"
            />
            {value && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-transparent transition-none"
                >
                    <X className="w-3.5 h-3.5" />
                </Button>
            )}
        </div>
    );
}

// ========================================
// Main Component
// ========================================

export default function ProxiesPage() {
    const { t } = useI18n();
    const queryClient = useQueryClient();

    // State
    const [sortBy, setSortBy] = useState<'default' | 'latency' | 'type'>('default');
    const [searchQuery, setSearchQuery] = useState('');

    const [testingNodes, setTestingNodes] = useState<Set<string>>(new Set());
    const [failedNodes, setFailedNodes] = useState<Map<string, string>>(new Map());

    // Collapse State
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [isAllCollapsed, setIsAllCollapsed] = useState(false);

    const { data: proxiesData, isLoading, isFetching, refetch } = useProxies();

    const selectMutation = useSelectProxy();

    const handleSelect = async (group: string, proxy: string) => {
        selectMutation.mutate({ group, proxy });
    };

    const performTest = async (proxyName: string) => {
        setFailedNodes(prev => { const m = new Map(prev); m.delete(proxyName); return m; });
        setTestingNodes(prev => new Set(prev).add(proxyName));
        try {
            const delay = await fetcher<number>(`/api/client/proxies/${encodeURIComponent(proxyName)}/delay`);
            if (delay > 0) {
                // Success, refetch will pick up the new delay
            } else {
                setFailedNodes(prev => new Map(prev).set(proxyName, 'Timeout'));
            }
        } catch (err: any) {
            const raw = err?.message ?? err?.data?.message ?? err;
            const errorMsg = typeof raw === 'string' ? raw : (err instanceof Error ? err.message : 'Error');
            setFailedNodes(prev => new Map(prev).set(proxyName, errorMsg.slice(0, 20)));
        } finally {
            setTestingNodes(prev => {
                const next = new Set(prev);
                next.delete(proxyName);
                return next;
            });
        }
    };

    const handleTest = async (proxyName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await performTest(proxyName);
        refetch();
    };

    const processedGroups = useMemo(() => {
        if (!proxiesData) return [];

        return Object.values(proxiesData)
            .filter(g => (g.type === 'Selector' || g.type === 'URLTest' || g.type === 'Fallback') && g.all && g.all.length > 0)
            .map(g => {
                let proxies = (g.all || []).map(name => {
                    const details = proxiesData[name];
                    const history = details?.history;
                    const latency = (history && history.length > 0) ? history[history.length - 1].delay : 0;
                    return {
                        name,
                        type: details?.type || 'unknown',
                        latency,
                        udp: details?.udp || false
                    };
                });

                proxies = proxies.filter(p => {
                    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                    return true;
                });

                if (sortBy === 'latency') {
                    proxies.sort((a, b) => {
                        if (a.latency <= 0) return 1;
                        if (b.latency <= 0) return -1;
                        return a.latency - b.latency;
                    });
                } else if (sortBy === 'type') {
                    proxies.sort((a, b) => a.type.localeCompare(b.type));
                }

                return {
                    name: g.name,
                    type: g.type,
                    current: g.now,
                    proxies
                };
            })
            .filter(g => g.proxies.length > 0)
            .sort((a, b) => {
                const priority = ['Proxy', 'GLOBAL', 'selector'];
                const aIdx = priority.findIndex(p => p.toLowerCase() === a.name.toLowerCase());
                const bIdx = priority.findIndex(p => p.toLowerCase() === b.name.toLowerCase());
                if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
                if (aIdx >= 0) return -1;
                if (bIdx >= 0) return 1;
                return a.name.localeCompare(b.name);
            });
    }, [proxiesData, sortBy, searchQuery]);

    const handleGroupTest = async (groupName: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const group = processedGroups.find(g => g.name === groupName);
        if (!group) return;

        const groupProxyNames = group.proxies.map(p => p.name);
        setTestingNodes(prev => {
            const next = new Set(prev);
            groupProxyNames.forEach(n => next.add(n));
            return next;
        });
        setFailedNodes(prev => {
            const m = new Map(prev);
            groupProxyNames.forEach(n => m.delete(n));
            return m;
        });

        // Test with concurrency limit to prevent overwhelming Clash/backend
        const CONCURRENCY = 10;
        try {
            for (let i = 0; i < groupProxyNames.length; i += CONCURRENCY) {
                const chunk = groupProxyNames.slice(i, i + CONCURRENCY);
                await Promise.allSettled(chunk.map(async (proxyName) => {
                    try {
                        const delay = await fetcher<number>(`/api/client/proxies/${encodeURIComponent(proxyName)}/delay`);
                        if (delay <= 0) {
                            setFailedNodes(prev => new Map(prev).set(proxyName, 'Timeout'));
                        }
                    } catch (err: any) {
                        const raw = err?.message ?? err?.data?.message ?? err;
                        const errorMsg = typeof raw === 'string' ? raw : (err instanceof Error ? err.message : 'Error');
                        setFailedNodes(prev => new Map(prev).set(proxyName, errorMsg.slice(0, 20)));
                    } finally {
                        setTestingNodes(prev => {
                            const next = new Set(prev);
                            next.delete(proxyName);
                            return next;
                        });
                    }
                }));
                // Update the UI progressively per chunk (e.g. every 10 nodes)
                refetch();
            }
        } catch (err) {
            console.error('Group test failed', err);
        }
    };

    useEffect(() => {
        if (processedGroups.length > 0 && expandedGroups.size === 0 && !isAllCollapsed) {
            setExpandedGroups(new Set(processedGroups.map(g => g.name)));
        }
    }, [processedGroups.length]);

    const handleToggleGroup = (groupName: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupName)) {
                next.delete(groupName);
            } else {
                next.add(groupName);
            }
            return next;
        });
    };

    const handleToggleAll = () => {
        if (expandedGroups.size > 0) {
            setExpandedGroups(new Set());
            setIsAllCollapsed(true);
        } else {
            setExpandedGroups(new Set(processedGroups.map(g => g.name)));
            setIsAllCollapsed(false);
        }
    };

    return (
        <div className="space-y-4 max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)]">
            <PageHeader
                title="Active Proxies"
                subtitle={t('runtime.subtitle')}
                actions={
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            title="REFRESH_PROXIES"
                            className="w-8"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin text-[#3b82f6]")} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleToggleAll}
                            className="gap-1.5 h-8"
                        >
                            {expandedGroups.size > 0 ? <ChevronsUp className="w-3.5 h-3.5" /> : <ChevronsDown className="w-3.5 h-3.5" />}
                            {expandedGroups.size > 0 ? 'COLLAPSE_ALL' : 'EXPAND_ALL'}
                        </Button>
                    </>
                }
            />

            <div className="flex justify-between items-center gap-4 flex-shrink-0 bg-[#09090b] border border-[#27272a] p-2">
                <div className="flex flex-1 items-center max-w-md relative">
                    <SearchInput value={searchQuery} onChange={setSearchQuery} />
                </div>
                <div className="flex items-center gap-4">
                    <SortButton sortBy={sortBy} onToggle={() => setSortBy(prev => {
                        if (prev === 'default') return 'latency';
                        if (prev === 'latency') return 'type';
                        return 'default';
                    })} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 w-full pr-1">
                {isLoading && !proxiesData ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 text-[var(--text-secondary)] animate-spin mb-4" />
                        <p className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-widest">[LOADING_PROXIES...]</p>
                    </div>
                ) : processedGroups.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] font-mono">
                        {searchQuery ? <Filter className="w-8 h-8 mb-4 opacity-20" /> : <Globe className="w-8 h-8 mb-4 opacity-20" />}
                        <p className="text-xs tracking-widest uppercase">[{searchQuery ? 'NO_MATCHING_PROXIES' : 'NO_PROXIES_AVAILABLE'}]</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {processedGroups.map((group) => (
                            <ProxyGroup
                                key={group.name}
                                name={group.name}
                                current={group.current}
                                proxies={group.proxies}
                                onSelect={(proxy) => handleSelect(group.name, proxy)}
                                onTest={handleTest}
                                testingNodes={testingNodes}
                                failedNodes={failedNodes}
                                isExpanded={expandedGroups.has(group.name)}
                                onToggle={() => handleToggleGroup(group.name)}
                                type={group.type}
                                onGroupTest={handleGroupTest}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
