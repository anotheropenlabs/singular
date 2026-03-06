'use client';

import { ArrowRight, Hash, Layers, ShieldBan, Terminal, X, XCircle } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import Button from '@/components/ui/Button';

interface Connection {
    id: string;
    metadata: {
        network: string;
        type: string;
        sourceIP: string;
        destinationIP: string;
        sourcePort: string;
        destinationPort: string;
        host: string;
        processPath: string;
        inbound?: string;
        inboundName?: string;
        inboundUser?: string;
        [key: string]: any;
    };
    upload: number;
    download: number;
    start: string;
    chains: string[];
    rule: string;
    rulePayload: string;
    [key: string]: any;
    status?: 'active' | 'closed';
    closedAt?: string;
}

interface ConnectionListProps {
    connections: Connection[];
    onClose: (id: string) => void;
    visibleFields: Set<string>;
    gridTemplateColumns: string;
    scrollRef: React.RefObject<HTMLDivElement | null>;
}

export default function ConnectionList({ connections, onClose, visibleFields, gridTemplateColumns, scrollRef }: ConnectionListProps) {
    const rowVirtualizer = useVirtualizer({
        count: connections.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 48,
        overscan: 20,
    });
    const getDuration = (start: string, end?: string) => {
        const diff = (end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime();
        const s = Math.floor(diff / 1000);
        if (s < 60) return `${s}s`;
        const m = Math.floor(s / 60);
        if (m < 60) return `${m}m`;
        return `${Math.floor(m / 60)}h`;
    };

    return (
        <div
            style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative'
            }}
            className="divide-y divide-[var(--border-color)]/30"
        >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const conn = connections[virtualItem.index];
                const net = conn.metadata.network?.toLowerCase();
                const isTcp = net === 'tcp';
                const isUdp = net === 'udp';
                const isClosed = conn.status === 'closed';

                return (
                    <div
                        key={conn.id}
                        style={{
                            gridTemplateColumns,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start}px)`,
                        }}
                        className={cn(
                            "group grid gap-4 items-center px-4 py-3 transition-all duration-300 border-b border-transparent hover:border-[var(--border-color)] relative overflow-hidden",
                            virtualItem.index % 2 === 0 ? "bg-[var(--bg-surface)]/30" : "bg-transparent",
                            "hover:bg-[var(--bg-surface-hover)] shadow-none hover:shadow-lg hover:shadow-black/20",
                            isClosed ? "opacity-40" : ""
                        )}
                    >
                        {/* Scanline on hover */}
                        <div className="absolute inset-0 w-full h-[1px] bg-[var(--accent-primary)]/10 -translate-y-full group-hover:animate-[scan_3s_linear_infinite] pointer-events-none opacity-0 group-hover:opacity-100" />
                        
                        {/* Status side-indicator */}
                        <div className={cn(
                            "absolute left-0 top-1 bottom-1 w-[2px] transition-all duration-300 group-hover:w-[3px]",
                            isClosed ? "bg-[var(--text-secondary)]/30" : isTcp ? "bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(var(--accent-primary-rgb),0.5)]" : isUdp ? "bg-[var(--status-warning)] shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-[var(--border-color)]"
                        )} />
                        {/* 1. NET */}
                        {visibleFields.has('net') && (
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className={cn("w-1.5 h-1.5 rounded-none", isClosed ? "bg-[var(--text-secondary)]/50" : isTcp ? "bg-[var(--accent-primary)]" : isUdp ? "bg-[var(--status-warning)]" : "bg-[var(--text-secondary)]")} />
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                                        {conn.metadata.network || '---'}
                                    </span>
                                </div>
                                {conn.metadata.type && (
                                    <span className="text-[8px] font-mono text-[var(--text-secondary)]/60 mt-0.5 ml-3" title={conn.metadata.type}>
                                        {conn.metadata.type}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* 2. SOURCE */}
                        {visibleFields.has('source') && (
                            <div className="flex flex-col min-w-0 pr-2">
                                <span className={cn("text-[11px] font-mono truncate", isClosed ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]")}>
                                    {conn.metadata.sourceIP}
                                    {conn.metadata.sourcePort && <span className="text-[var(--text-secondary)]/60 ml-0.5">:{conn.metadata.sourcePort}</span>}
                                </span>
                                {conn.metadata.inbound && (
                                    <span className="text-[9px] font-mono text-[var(--text-secondary)] mt-0.5 truncate" title={conn.metadata.inboundUser ? `${conn.metadata.inbound} (${conn.metadata.inboundUser})` : conn.metadata.inbound}>
                                        IN: {conn.metadata.inbound}{conn.metadata.inboundUser ? ` (${conn.metadata.inboundUser})` : ''}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* 3. DESTINATION */}
                        {visibleFields.has('destination') && (
                            <div className="flex flex-col min-w-0 pr-2 justify-center">
                                <div className="flex items-center min-w-0 max-w-full">
                                    <span className={cn("text-[11px] font-mono truncate", isClosed ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]")} title={conn.metadata.destinationIP}>
                                        {conn.metadata.destinationIP}
                                        {conn.metadata.destinationPort && <span className="text-[var(--text-secondary)]/60 ml-0.5">:{conn.metadata.destinationPort}</span>}
                                    </span>
                                </div>
                                {/* Process Info (Small) */}
                                {conn.metadata.processPath && (
                                    <span className="text-[9px] font-mono text-[var(--text-secondary)]/70 truncate mt-0.5 max-w-[150px]" title={conn.metadata.processPath}>
                                        {conn.metadata.processPath.split(/[/\\]/).pop()}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* 3.5. HOST */}
                        {visibleFields.has('host') && (
                            <div className="flex flex-col min-w-0 pr-2 justify-center">
                                {conn.metadata.host && conn.metadata.host !== conn.metadata.destinationIP ? (
                                    <span className={cn("text-[11px] font-mono truncate", isClosed ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]")} title={conn.metadata.host}>
                                        {conn.metadata.host}
                                    </span>
                                ) : (
                                    <span className="text-[11px] font-mono text-[var(--text-secondary)]/50 truncate">-</span>
                                )}
                            </div>
                        )}

                        {/* 4. RULE */}
                        {visibleFields.has('rule') && (
                            <div className="flex flex-col min-w-0 pr-2 justify-center">
                                {conn.rule ? (
                                    <>
                                        <span className="text-[10px] font-mono text-[var(--text-secondary)] truncate" title={conn.rule}>{conn.rule}</span>
                                        {conn.rulePayload && <span className="text-[9px] font-mono text-[var(--text-secondary)]/60 truncate mt-0.5" title={conn.rulePayload}>{conn.rulePayload}</span>}
                                    </>
                                ) : (
                                    <span className="text-[10px] font-mono text-[var(--text-secondary)]/50 truncate">-</span>
                                )}
                            </div>
                        )}

                        {/* 5. CHAIN */}
                        {visibleFields.has('chain') && (
                            <div className="flex items-center min-w-0 pr-2">
                                {conn.chains && conn.chains.length > 0 ? (
                                    <div className="flex items-center gap-1 overflow-hidden">
                                        {[...conn.chains].reverse().map((chain, idx) => (
                                            <div key={idx} className="flex items-center gap-1 shrink-0">
                                                <span className={cn(
                                                    "text-[9px] font-mono font-bold uppercase tracking-tighter px-1",
                                                    isClosed ? "text-[var(--text-secondary)]" : idx === 0 ? "text-[var(--text-primary)]" : "text-[var(--accent-primary)]/70"
                                                )} title={chain}>
                                                    {chain}
                                                </span>
                                                {idx < conn.chains.length - 1 && (
                                                    <ArrowRight className="w-2.5 h-2.5 text-[var(--text-secondary)]/30 shrink-0" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-mono text-[var(--text-secondary)]/50 truncate">-</span>
                                )  }
                            </div>
                        )}

                        {/* 6. TRAFFIC_IO */}
                        {visibleFields.has('traffic') && (
                            <div className="flex flex-col min-w-0 gap-1.5 pr-4">
                                <div className="space-y-0.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={cn("text-[10px] font-mono font-bold leading-none", isClosed ? "text-[var(--text-secondary)]" : "text-[var(--status-success)]")}>DL: {formatBytes(conn.download)}</span>
                                        <div className="h-[2px] flex-1 bg-[var(--status-success)]/10 rounded-full overflow-hidden max-w-[40px]">
                                            <div className="h-full bg-[var(--status-success)] animate-pulse" style={{ width: conn.download > 0 ? '40%' : '0%' }} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={cn("text-[9px] font-mono leading-none", isClosed ? "text-[var(--text-secondary)]/60" : "text-[var(--accent-primary)]")}>UP: {formatBytes(conn.upload)}</span>
                                        <div className="h-[2px] flex-1 bg-[var(--accent-primary)]/10 rounded-full overflow-hidden max-w-[40px]">
                                            <div className="h-full bg-[var(--accent-primary)]" style={{ width: conn.upload > 0 ? '25%' : '0%' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 7. DURATION */}
                        {visibleFields.has('time') && (
                            <div className="text-right">
                                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                                    {getDuration(conn.start, conn.closedAt)}
                                </span>
                            </div>
                        )}

                        {/* 8. ACT */}
                        {visibleFields.has('act') && (
                            <div className="flex items-center justify-end opacity-20 group-hover:opacity-100 transition-opacity">
                                {!isClosed ? (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onClose(conn.id)}
                                        className="w-6 h-6 text-[var(--text-secondary)] hover:text-[var(--status-error)] transition-none border-none"
                                        title="TERMINATE_CONN"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                ) : (
                                    <span className="text-[10px] font-mono text-[var(--text-secondary)]/50 uppercase tracking-widest block w-6 text-center" title="CLOSED">
                                        -
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
