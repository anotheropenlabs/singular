import { cn } from '@/lib/utils';
import { getAllProtocols } from '@/lib/protocols/registry';

// ProtocolBadge - displays a color-coded protocol label
// Usage: <ProtocolBadge type="vless" />
//        <ProtocolBadge type="hysteria2" className="..." />

const FALLBACK_MAP: Record<string, string> = {
    'direct': 'DIRECT',
    'urltest': 'URLTEST',
    'selector': 'SELECTOR',
    'block': 'BLOCK',
};

export function getProtocolLabel(type: string): string {
    const lower = type.toLowerCase();
    const protocols = getAllProtocols();
    
    // Exact match or alias match
    const found = protocols.find(p => p.id === lower || p.aliases?.some(a => lower.startsWith(a.replace('://', ''))));
    if (found) return found.name.toUpperCase();
    
    return FALLBACK_MAP[lower] ?? type.toUpperCase();
}

interface ProtocolBadgeProps {
    type: string;
    className?: string;
}

export default function ProtocolBadge({ type, className }: ProtocolBadgeProps) {
    const label = getProtocolLabel(type);

    return (
        <span className={cn(
            'inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold tracking-wider border shrink-0',
            'bg-white-[0.03] text-white/50 border-white/5',
            className
        )}>
            {label}
        </span>
    );
}
