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
        if (ms <= 0) return 'text-[#52525b]';
        if (ms < 300) return 'text-[#10b981]';
        if (ms < 600) return 'text-[#f59e0b]';
        if (ms < 1000) return 'text-[#ea580c]';
        return 'text-[#e11d48]';
    };

    return (
        <div
            className={cn(
                "group relative w-full px-2 py-1.5 border transition-none cursor-pointer rounded-none",
                isTesting
                    ? "bg-[#3b82f6]/5 border-[#3b82f6]/20"
                    : isSelected
                        ? "bg-[#3b82f6]/10 border-[#3b82f6]/50"
                        : "bg-[#000000] border-[#27272a] hover:bg-[#09090b] hover:border-[#3f3f46]"
            )}
            onClick={onSelect}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className={cn(
                        "text-xs font-mono truncate transition-none",
                        isSelected ? "text-[#f4f4f5] font-bold" : "text-[#a1a1aa] group-hover:text-[#e4e4e7]"
                    )}>
                        {name}
                    </span>
                </div>

                <Button
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onTest(e); }}
                    className={cn(
                        "shrink-0 h-auto flex items-center gap-0.5 px-1 py-0.5 border border-transparent transition-none",
                        isTesting ? "cursor-wait" : "cursor-pointer hover:border-[#27272a] hover:bg-[#18181b]"
                    )}
                    title={isFailed ? `${failError} — CLICK_TO_RETEST` : 'TEST_NODE_LATENCY'}
                >
                    {isTesting ? (
                        <Radio className="w-3.5 h-3.5 text-[#3b82f6] animate-pulse" />
                    ) : isFailed ? (
                        <span className="px-1 py-0.5 bg-[#e11d48]/10 text-[9px] font-mono font-bold text-[#e11d48] uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis max-w-[60px]">
                            {typeof failError === 'string' ? failError.toUpperCase() : 'ERR'}
                        </span>
                    ) : (
                        <>
                            <span className={cn(
                                "text-xs font-mono font-bold transition-none",
                                "group-hover:text-[#3b82f6] " + getLatencyColor(latency)
                            )}>
                                {latency > 0 ? latency : '---'}
                            </span>
                            {latency > 0 && (
                                <span className="text-[9px] text-[#52525b] font-mono group-hover:text-[#3b82f6]/50">ms</span>
                            )}
                        </>
                    )}
                </Button>
            </div>
            {/* secondary row for tags */}
            <div className="flex justify-between items-center mt-1.5 opacity-60">
                 <ProtocolBadge type={type} className="scale-90 origin-left border-none bg-transparent p-0 text-[#71717a] group-hover:text-[#a1a1aa]" />
                 {udp && <span className="text-[8px] font-mono text-[#71717a] border border-[#27272a] px-1 group-hover:border-[#3f3f46]">UDP</span>}
            </div>
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
        <Panel variant="elevated" className="rounded-none border border-[#27272a] overflow-hidden mb-4">
            <div
                onClick={onToggle}
                className="w-full px-4 py-2 flex items-center justify-between bg-[#09090b] hover:bg-[#18181b] border-b border-[#27272a] transition-none cursor-pointer group"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-mono font-bold text-[#f4f4f5] truncate uppercase tracking-tight">{name}</h2>
                        <span className="text-[10px] font-mono text-[#71717a] border border-[#27272a] px-1 bg-[#000000]">
                            {proxies.length}
                        </span>
                        <ProtocolBadge type={type} className="scale-90 border-[#27272a]" />
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {displayLatency > 0 && (
                        <span className="text-xs font-mono font-bold text-[#10b981]">
                            {displayLatency}ms
                        </span>
                    )}
                    
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => onGroupTest(name, e)}
                        className="w-6 h-6 border border-transparent hover:border-[#3f3f46] text-[#52525b] hover:text-[#3b82f6] transition-none focus:outline-none focus:text-[#3b82f6]"
                        title="BATCH_TEST_LATENCY"
                    >
                        <Zap className="w-3.5 h-3.5" />
                    </Button>

                    <Button variant="ghost" size="icon" className="w-6 h-6 text-[#52525b] group-hover:text-[#a1a1aa] hover:bg-transparent hover:text-[#e4e4e7]">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-[2px] bg-[#000000] grid gap-[2px] grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
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
            variant="ghost"
            onClick={onToggle}
            className={cn(
                'flex items-center gap-1.5 h-9 px-3 border border-[#27272a] bg-[#000000] text-xs font-mono transition-none',
                sortBy !== 'default'
                    ? 'text-[#3b82f6] border-[#3b82f6]/50 hover:text-[#3b82f6]/80 hover:bg-[#18181b]' 
                    : 'text-[#a1a1aa] hover:border-[#3f3f46] hover:text-[#e4e4e7] hover:bg-[#18181b]'
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
            <input 
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="FILTER_PROXIES..."
                className="w-full bg-[#000000] border border-[#27272a] h-9 pl-9 pr-9 text-sm font-mono text-[#e4e4e7] placeholder:text-[#52525b] focus:outline-none focus:border-[#3b82f6] transition-none rounded-none"
            />
            {value && (
                <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 text-[#71717a] hover:text-[#e4e4e7] hover:bg-transparent transition-none"
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
                            size="icon"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            title="REFRESH_PROXIES"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin text-[#3b82f6]")} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleToggleAll}
                            className="gap-1.5"
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
                        <RefreshCw className="w-8 h-8 text-[#52525b] animate-spin mb-4" />
                        <p className="text-xs font-mono text-[#71717a] uppercase tracking-widest">[LOADING_PROXIES...]</p>
                    </div>
                ) : processedGroups.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[#71717a] font-mono">
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
