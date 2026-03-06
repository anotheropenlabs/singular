'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Activity, Search, RefreshCw, X, XCircle, Hash, Terminal, Settings2 } from 'lucide-react';
import ConnectionList from '@/components/connections/ConnectionList';
import { useConnectionMutations } from '@/hooks/useConnections';
import { useConnectionsStore, Connection } from '@/hooks/useConnectionsStore';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import Panel from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';

type ColumnKey = 'net' | 'source' | 'destination' | 'host' | 'rule' | 'chain' | 'traffic' | 'time' | 'act';
type FilterKey = 'host' | 'process' | 'inbound' | 'chain' | 'rule';

interface FilterConfig {
    key: FilterKey;
    label: string;
    prefix: string;
}

interface ColumnConfig {
    key: ColumnKey;
    label: string;
    default: boolean;
}

const PROTOCOLS = [
    { key: 'tcp', label: 'TCP' },
    { key: 'udp', label: 'UDP' },
];

function getFilters(t: (key: string) => string): FilterConfig[] {
    return [
        { key: 'host', label: t('connections.fields.host'), prefix: 'host:' },
        { key: 'process', label: t('connections.fields.process'), prefix: 'process:' },
        { key: 'inbound', label: t('connections.fields.inbound'), prefix: 'inbound:' },
        { key: 'chain', label: t('connections.fields.chain'), prefix: 'chain:' },
        { key: 'rule', label: t('connections.fields.rule'), prefix: 'rule:' },
    ];
}

function getColumns(t: (key: string) => string): ColumnConfig[] {
    return [
        { key: 'net', label: 'Net / Inbound', default: true },
        { key: 'source', label: 'Source', default: true },
        { key: 'destination', label: 'Destination / Process', default: true },
        { key: 'host', label: 'Host', default: true },
        { key: 'rule', label: 'Rule', default: true },
        { key: 'chain', label: 'Chain', default: true },
        { key: 'traffic', label: 'Traffic IO', default: true },
        { key: 'time', label: 'Time', default: true },
        { key: 'act', label: 'Action', default: true },
    ];
}

export default function ConnectionsPage() {
    const { t } = useI18n();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [confirmCloseAll, setConfirmCloseAll] = useState(false);
    const [showColumns, setShowColumns] = useState(false);

    // History Tracking State
    const [visibleFields, setVisibleFields] = useState<Set<ColumnKey>>(
        new Set(getColumns(t).filter(f => f.default).map(f => f.key))
    );

    const FILTERS = useMemo(() => getFilters(t), [t]);
    const COLUMNS = useMemo(() => getColumns(t), [t]);
    const { closeConnection, closeAllConnections } = useConnectionMutations();
    const { connections: allConnections, updateConnections, clearConnections } = useConnectionsStore();

    const [isLoading, setIsLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Connection History Cache via WebSocket/SSE Stream
    useEffect(() => {
        let eventSource: EventSource | null = null;
        let reconnectTimer: NodeJS.Timeout;

        const connect = () => {
            eventSource = new EventSource('/api/connections/stream');
            
            eventSource.onopen = () => {
                setIsLoading(false);
            };

            eventSource.onmessage = (event) => {
                try {
                    // Ignore keep-alive string
                    if (event.data === 'connected') return;
                    const data = JSON.parse(event.data);
                    if (data.connections) {
                        updateConnections(data.connections, data.downloadTotal, data.uploadTotal);
                    }
                } catch (err) {}
            };

            eventSource.onerror = () => {
                eventSource?.close();
                // Try to reconnect silently
                reconnectTimer = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            eventSource?.close();
            clearTimeout(reconnectTimer);
        };
    }, [updateConnections]);

    const connections = useMemo(() => {
        let filtered = allConnections;
        const terms = searchTerm.toLowerCase().split(/\s+/).filter(t => t);

        for (const term of terms) {
            let match = false;

            if (term === 'tcp:' || term === 'tcp') {
                filtered = filtered.filter((c: any) => c.metadata?.network?.toLowerCase() === 'tcp');
                match = true;
            } else if (term === 'udp:' || term === 'udp') {
                filtered = filtered.filter((c: any) => c.metadata?.network?.toLowerCase() === 'udp');
                match = true;
            }

            if (!match) {
                for (const filter of FILTERS) {
                    if (term.startsWith(filter.prefix)) {
                        const value = term.slice(filter.prefix.length);
                        if (filter.key === 'host') {
                            filtered = filtered.filter((c: any) => c.metadata?.host?.toLowerCase().includes(value));
                        } else if (filter.key === 'process') {
                            filtered = filtered.filter((c: any) => c.metadata?.processPath?.toLowerCase().includes(value));
                        } else if (filter.key === 'inbound') {
                            filtered = filtered.filter((c: any) =>
                                c.metadata?.inbound?.toLowerCase().includes(value) ||
                                c.metadata?.inboundName?.toLowerCase().includes(value)
                            );
                        } else if (filter.key === 'chain') {
                            filtered = filtered.filter((c: any) => c.chains?.some((ch: string) => ch.toLowerCase().includes(value)));
                        } else if (filter.key === 'rule') {
                            filtered = filtered.filter((c: any) => c.rule?.toLowerCase().includes(value));
                        }
                        match = true;
                        break;
                    }
                }
            }

            if (!match && term) {
                filtered = filtered.filter((conn: any) =>
                    conn.metadata?.host?.toLowerCase().includes(term) ||
                    conn.metadata?.destinationIP?.includes(term) ||
                    conn.metadata?.sourceIP?.includes(term) ||
                    conn.chains?.some((c: string) => c.toLowerCase().includes(term)) ||
                    conn.rule?.toLowerCase().includes(term)
                );
            }
        }
        return filtered;
    }, [allConnections, searchTerm, FILTERS]);

    const handleQuickFilter = (filter: string) => {
        setSearchTerm(prev => {
            const existing = prev.trim();
            if (existing === '') return filter;
            const terms = existing.split(/\s+/).filter(t => t);
            const newTerms = terms.filter(t => {
                if (filter === 'tcp:' && t === 'udp:') return false;
                if (filter === 'udp:' && t === 'tcp:') return false;
                if (filter.startsWith('host:') && t.startsWith('host:')) return false;
                if (filter.startsWith('process:') && t.startsWith('process:')) return false;
                if (filter.startsWith('inbound:') && t.startsWith('inbound:')) return false;
                if (filter.startsWith('chain:') && t.startsWith('chain:')) return false;
                if (filter.startsWith('rule:') && t.startsWith('rule:')) return false;
                return true;
            });
            newTerms.push(filter);
            return newTerms.join(' ');
        });
    };

    const handleFieldToggle = (field: ColumnKey) => {
        setVisibleFields(prev => {
            const next = new Set(prev);
            next.has(field) ? next.delete(field) : next.add(field);
            return next;
        });
    };

    const gridCols = useMemo(() => {
        return [
            visibleFields.has('net') ? '80px' : '',
            visibleFields.has('source') ? 'minmax(180px, 2fr)' : '',
            visibleFields.has('destination') ? 'minmax(180px, 2fr)' : '',
            visibleFields.has('host') ? 'minmax(200px, 1.5fr)' : '',
            visibleFields.has('rule') ? 'minmax(140px, 1fr)' : '',
            visibleFields.has('chain') ? 'minmax(160px, 1.5fr)' : '',
            visibleFields.has('traffic') ? 'minmax(120px, 1.2fr)' : '',
            visibleFields.has('time') ? '60px' : '',
            visibleFields.has('act') ? '40px' : '',
        ].filter(Boolean).join(' ');
    }, [visibleFields]);

    return (
        <div className="space-y-4 max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)]">
            <PageHeader
                title="Active Connections"
                subtitle={t('connections.subtitle')}
                actions={
                    <>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setConfirmCloseAll(true)}
                            disabled={!allConnections.length || closeAllConnections.isPending}
                            className="gap-1.5"
                            title="Close All Connections"
                        >
                            <X className={cn("w-3.5 h-3.5", closeAllConnections.isPending && "animate-spin")} />
                            CLOSE_ALL
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => clearConnections()}
                            className="gap-1.5"
                            title="Clear Logs"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            CLEAR_LIST
                        </Button>
                    </>
                }
            />

            {/* Controls Bar */}
            <div className="flex justify-between items-center gap-4 flex-shrink-0 bg-[#09090b] border border-[#27272a] p-2 relative">
                <div className="flex flex-1 items-center gap-2 max-w-2xl relative">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
                        <input
                            type="text"
                            placeholder="FILTER_CONNECTIONS... (e.g. tcp: host:google.com)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                            className={cn(
                                "w-full bg-[#000000] border border-[#27272a] h-9 pl-9 pr-9 text-sm font-mono text-[#e4e4e7] placeholder:text-[#52525b] focus:outline-none transition-none rounded-none",
                                searchFocused && "border-[#3b82f6]"
                            )}
                        />
                        {searchTerm && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSearchTerm('');
                                }}
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 text-[#71717a] hover:text-[#e4e4e7] hover:bg-transparent transition-none"
                            >
                                <XCircle className="w-3.5 h-3.5" />
                            </Button>
                        )}
                    </div>

                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowColumns(!showColumns)}
                            className={cn("w-9 h-9 flex-shrink-0 rounded-none border border-[#27272a] bg-[#000000]", showColumns ? "border-[#3b82f6] text-[#3b82f6]" : "text-[#71717a] hover:text-[#e4e4e7]")}
                            title="Toggle Columns"
                        >
                            <Settings2 className="w-4 h-4" />
                        </Button>

                        {/* Column Toggle Dropdown */}
                        {showColumns && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-[#000000] border border-[#3b82f6] p-2 shadow-2xl z-50">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3b82f6] block px-2 py-1">COLUMNS</span>
                                    <div className="flex flex-col">
                                        {COLUMNS.map((f) => (
                                            <button
                                                key={f.key}
                                                onClick={() => handleFieldToggle(f.key)}
                                                className="flex items-center gap-3 px-2 py-1.5 text-xs font-mono text-left w-full hover:bg-[#18181b] transition-none group"
                                            >
                                                <div className={cn(
                                                    "w-3.5 h-3.5 border flex items-center justify-center rounded-[2px]",
                                                    visibleFields.has(f.key)
                                                        ? "bg-[#3b82f6] border-[#3b82f6] text-[#000000]"
                                                        : "border-[#3f3f46] text-transparent group-hover:border-[#71717a]"
                                                )}>
                                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <span className={visibleFields.has(f.key) ? "text-[#e4e4e7]" : "text-[#71717a] group-hover:text-[#a1a1aa]"}>{f.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Filter Dropdown */}
                {searchFocused && (
                    <div className="absolute top-full left-0 mt-1 w-full max-w-2xl bg-[#000000] border border-[#27272a] p-4 shadow-2xl z-50">
                        <div className="space-y-4">
                            {/* Protocols */}
                            <div>
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#71717a] mb-2 block">PROTO_FILTER</span>
                                <div className="flex gap-2">
                                    {PROTOCOLS.map((p) => (
                                        <Button
                                            variant="ghost"
                                            key={p.key}
                                            onClick={() => handleQuickFilter(p.key + ':')}
                                            className="h-auto px-3 py-1 bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#a1a1aa] hover:border-[#3b82f6] hover:text-[#3b82f6] hover:bg-[#09090b] transition-none rounded-none"
                                        >
                                            {p.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Fields */}
                            <div>
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#71717a] mb-2 block">DATA_TUPLES</span>
                                <div className="flex gap-2 flex-wrap">
                                    {FILTERS.map((f) => (
                                        <Button
                                            variant="ghost"
                                            key={f.key}
                                            onClick={() => handleQuickFilter(f.prefix)}
                                            className="h-auto px-3 py-1 bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#a1a1aa] hover:border-[#3b82f6] hover:text-[#3b82f6] hover:bg-[#09090b] transition-none flex items-center gap-1.5 rounded-none"
                                        >
                                            {f.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter and visibility tags */}
            </div>

            {/* Active filters */}
            {searchTerm && (
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase">
                    <span className="text-[#52525b]">ACTIVE_FILTERS:</span>
                    <div className="flex gap-1.5 flex-wrap">
                        {searchTerm.toLowerCase().split(/\s+/).filter(t => t).map((term, i) => (
                            <Button
                                variant="ghost"
                                key={i}
                                onClick={() => {
                                    const terms = searchTerm.split(/\s+/).filter(t => t);
                                    terms.splice(i, 1);
                                    setSearchTerm(terms.join(' '));
                                }}
                                className="h-auto px-1.5 py-0.5 border border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#3b82f6] hover:bg-[#e11d48]/10 hover:border-[#e11d48]/30 hover:text-[#e11d48] transition-none flex items-center gap-1 rounded-none"
                            >
                                {term}
                                <X className="w-2.5 h-2.5" />
                            </Button>
                        ))}
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => setSearchTerm('')}
                        className="h-auto p-0 text-[#71717a] hover:text-[#e4e4e7] hover:bg-transparent ml-2 rounded-none transition-none"
                    >
                        [CLEAR]
                    </Button>
                </div>
            )}

            {/* Connection List */}
            <div
                ref={scrollRef}
                className="flex-1 min-h-0 overflow-auto bg-[#000000] border border-[#27272a] scrollbar-thin scrollbar-thumb-[#27272a] hover:scrollbar-thumb-[#3f3f46] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [-ms-overflow-style:none]"
            >
                <div className="min-w-full w-fit">
                    <div
                        className="sticky top-0 z-10 grid gap-4 px-4 py-3 border-b border-[#27272a] bg-[#09090b] text-[10px] font-medium text-[#52525b] uppercase tracking-wider items-center flex-shrink-0 border-l-2 border-transparent shadow-lg shadow-black/40"
                        style={{ gridTemplateColumns: gridCols }}
                    >
                        {visibleFields.has('net') && <div>NET</div>}
                        {visibleFields.has('source') && <div>SOURCE</div>}
                        {visibleFields.has('destination') && <div>DESTINATION</div>}
                        {visibleFields.has('host') && <div>HOST</div>}
                        {visibleFields.has('rule') && <div>RULE</div>}
                        {visibleFields.has('chain') && <div>CHAIN</div>}
                        {visibleFields.has('traffic') && <div className="text-left">TRAFFIC_IO</div>}
                        {visibleFields.has('time') && <div className="text-right">TIME</div>}
                        {visibleFields.has('act') && <div className="text-right">ACT</div>}
                    </div>

                    {isLoading && connections.length === 0 ? (
                        <div className="flex justify-center items-center h-64 w-full">
                            <div className="w-2 h-4 bg-[#e4e4e7] animate-pulse" />
                        </div>
                    ) : connections.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-[#71717a] font-mono w-full">
                            <Activity className="w-8 h-8 mb-4 opacity-20" />
                            <p className="text-xs tracking-widest uppercase">[{searchTerm ? 'NO_MATCHING_CONNS' : 'NO_ACTIVE_CONNECTIONS'}]</p>
                        </div>
                    ) : (
                        <ConnectionList
                            connections={connections}
                            onClose={(id) => closeConnection.mutate(id)}
                            visibleFields={visibleFields}
                            gridTemplateColumns={gridCols}
                            scrollRef={scrollRef}
                        />
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={confirmCloseAll}
                onClose={() => setConfirmCloseAll(false)}
                onConfirm={() => {
                    closeAllConnections.mutate();
                    setConfirmCloseAll(false);
                }}
                title={t('connections.close_all_confirm_title', 'Close All Active Connections?')}
                description={t('connections.close_all_confirm_desc', 'Are you sure you want to forcibly terminate all active network connections? This will immediately drop traffic for all users.')}
                confirmLabel={t('connections.close_all_button', 'Close All')}
                isLoading={closeAllConnections.isPending}
            />
        </div>
    );
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))}${sizes[i]}`;
}
