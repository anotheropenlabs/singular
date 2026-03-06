'use client';

import { ArrowRight, Hash, Layers, ShieldBan, Terminal, X, XCircle } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';

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
            className="divide-y divide-[#18181b]"
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
                            "group grid gap-4 items-center px-4 py-2 transition-none hover:bg-[#09090b]",
                            isClosed ? "border-l-2 border-l-[#3f3f46] opacity-50" : (isTcp ? "border-l-2 border-l-[#3b82f6]" : isUdp ? "border-l-2 border-l-[#f59e0b]" : "border-l-2 border-l-[#3f3f46]")
                        )}
                    >
                        {/* 1. NET */}
                        {visibleFields.has('net') && (
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className={cn("w-1.5 h-1.5 rounded-none", isClosed ? "bg-[#52525b]" : isTcp ? "bg-[#3b82f6]" : isUdp ? "bg-[#f59e0b]" : "bg-[#71717a]")} />
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#71717a]">
                                        {conn.metadata.network || '---'}
                                    </span>
                                </div>
                                {conn.metadata.type && (
                                    <span className="text-[8px] font-mono text-[#52525b] mt-0.5 ml-3" title={conn.metadata.type}>
                                        {conn.metadata.type}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* 2. SOURCE */}
                        {visibleFields.has('source') && (
                            <div className="flex flex-col min-w-0 pr-2">
                                <span className={cn("text-[11px] font-mono truncate", isClosed ? "text-[#71717a]" : "text-[#e4e4e7]")}>
                                    {conn.metadata.sourceIP}
                                    {conn.metadata.sourcePort && <span className="text-[#52525b] ml-0.5">:{conn.metadata.sourcePort}</span>}
                                </span>
                                {conn.metadata.inbound && (
                                    <span className="text-[9px] font-mono text-[#71717a] mt-0.5 truncate" title={conn.metadata.inboundUser ? `${conn.metadata.inbound} (${conn.metadata.inboundUser})` : conn.metadata.inbound}>
                                        IN: {conn.metadata.inbound}{conn.metadata.inboundUser ? ` (${conn.metadata.inboundUser})` : ''}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* 3. DESTINATION */}
                        {visibleFields.has('destination') && (
                            <div className="flex flex-col min-w-0 pr-2 justify-center">
                                 <div className="flex items-center min-w-0 max-w-full">
                                    <span className={cn("text-[11px] font-mono truncate", isClosed ? "text-[#71717a]" : "text-[#e4e4e7]")} title={conn.metadata.destinationIP}>
                                        {conn.metadata.destinationIP}
                                        {conn.metadata.destinationPort && <span className="text-[#52525b] ml-0.5">:{conn.metadata.destinationPort}</span>}
                                    </span>
                                </div>
                                {/* Process Info (Small) */}
                                {conn.metadata.processPath && (
                                    <span className="text-[9px] font-mono text-[#71717a] truncate mt-0.5 max-w-[150px]" title={conn.metadata.processPath}>
                                        {conn.metadata.processPath.split(/[/\\]/).pop()}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* 3.5. HOST */}
                        {visibleFields.has('host') && (
                            <div className="flex flex-col min-w-0 pr-2 justify-center">
                                {conn.metadata.host && conn.metadata.host !== conn.metadata.destinationIP ? (
                                    <span className={cn("text-[11px] font-mono truncate", isClosed ? "text-[#71717a]" : "text-[#e4e4e7]")} title={conn.metadata.host}>
                                        {conn.metadata.host}
                                    </span>
                                ) : (
                                    <span className="text-[11px] font-mono text-[#71717a] truncate">-</span>
                                )}
                            </div>
                        )}

                        {/* 4. RULE */}
                        {visibleFields.has('rule') && (
                            <div className="flex flex-col min-w-0 pr-2 justify-center">
                                {conn.rule ? (
                                    <>
                                        <span className="text-[10px] font-mono text-[#a1a1aa] truncate" title={conn.rule}>{conn.rule}</span>
                                        {conn.rulePayload && <span className="text-[9px] font-mono text-[#71717a] truncate mt-0.5" title={conn.rulePayload}>{conn.rulePayload}</span>}
                                    </>
                                ) : (
                                    <span className="text-[10px] font-mono text-[#71717a] truncate">-</span>
                                )}
                            </div>
                        )}

                        {/* 5. CHAIN */}
                        {visibleFields.has('chain') && (
                            <div className="flex items-center min-w-0 pr-2">
                                {conn.chains && conn.chains.length > 0 ? (
                                    <div className="flex items-center overflow-x-auto w-full pb-1 -mb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                        <div className={cn("flex flex-nowrap shrink-0 rounded border divide-x overflow-hidden", isClosed ? "border-[#52525b]/30 bg-[#52525b]/10 divide-[#52525b]/30" : "border-[#3b82f6]/30 bg-[#3b82f6]/10 divide-[#3b82f6]/30")}>
                                            {[...conn.chains].reverse().map((chain, idx) => (
                                                <span key={idx} className={cn("text-[9px] font-mono truncate px-1.5 py-0.5 max-w-[100px]", isClosed ? "text-[#71717a]" : "text-[#3b82f6]")} title={chain}>
                                                    {chain}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-mono text-[#71717a] truncate">-</span>
                                )}
                            </div>
                        )}

                        {/* 6. TRAFFIC_IO */}
                        {visibleFields.has('traffic') && (
                            <div className="flex flex-col min-w-0">
                                <span className={cn("text-[11px] font-mono truncate", isClosed ? "text-[#71717a]" : "text-[#10b981]")}>DL: {formatBytes(conn.download)}</span>
                                <span className={cn("text-[9px] font-mono truncate", isClosed ? "text-[#52525b]" : "text-[#3b82f6]")}>UP: {formatBytes(conn.upload)}</span>
                            </div>
                        )}

                        {/* 7. DURATION */}
                        {visibleFields.has('time') && (
                            <div className="text-right">
                                 <span className="text-[11px] font-mono text-[#71717a]">
                                    {getDuration(conn.start, conn.closedAt)}
                                </span>
                            </div>
                        )}

                        {/* 8. ACT */}
                        {visibleFields.has('act') && (
                            <div className="flex items-center justify-end opacity-20 group-hover:opacity-100 transition-opacity">
                                {!isClosed ? (
                                    <button
                                        onClick={() => onClose(conn.id)}
                                        className="w-6 h-6 flex items-center justify-center hover:bg-[#e11d48]/10 text-[#a1a1aa] hover:text-[#e11d48] transition-none rounded-none"
                                        title="TERMINATE_CONN"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                ) : (
                                    <span className="text-[10px] font-mono text-[#52525b] uppercase tracking-widest block w-6 text-center" title="CLOSED">
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
