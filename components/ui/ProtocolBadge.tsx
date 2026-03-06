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
            'bg-[var(--text-primary)]/5 text-[var(--text-secondary)] border-[var(--border-color)] uppercase font-mono px-2 py-0.5 rounded-none',
            className
        )}>
            {label}
        </span>
    );
}
