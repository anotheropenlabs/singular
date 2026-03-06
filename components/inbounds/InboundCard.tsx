'use client';

import { Inbound } from '@/types';
import Panel from '../ui/Panel';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Pencil, Trash2, Power, Globe, Terminal, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useI18n } from '@/lib/i18n';

interface InboundCardProps {
  inbound: Inbound;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

export default function InboundCard({ inbound, onEdit, onDelete, onToggle }: InboundCardProps) {
  const { t } = useI18n();
  const protocolColors: Record<string, string> = {
    vless: 'text-sing-blue bg-sing-blue/10 border-sing-blue/30',
    vmess: 'text-sing-purple bg-sing-purple/10 border-sing-purple/30',
    trojan: 'text-sing-green bg-sing-green/10 border-sing-green/30',
    shadowsocks: 'text-sing-cyan bg-sing-cyan/10 border-sing-cyan/30',
    mixed: 'text-sing-yellow bg-sing-yellow/10 border-sing-yellow/30',
  };

  return (
    <Panel 
      variant="default"
      hoverable
      className="p-5 flex flex-col gap-4 group h-full"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between w-full">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 border", protocolColors[inbound.protocol] || 'text-[var(--text-primary)] bg-[var(--bg-surface-hover)] border-[var(--border-color)]')}>
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-[var(--text-primary)] text-lg leading-tight uppercase tracking-tight">{inbound.tag}</h3>
            <span className="text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-wider">
              {inbound.protocol}
            </span>
          </div>
        </div>
        <Badge variant={inbound.enabled ? 'success' : 'outline'} className="rounded-none">
          {inbound.enabled ? t('connections.active') : t('common.disabled', 'Disabled')} 
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-[var(--text-secondary)] mt-1">
        <div className="flex flex-col gap-1 p-2 bg-[var(--bg-base)] border border-[var(--border-color)]">
            <span className="text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-wider">{t('inbounds.port')}</span>
            <span className="font-mono font-bold text-[var(--text-primary)] flex items-center gap-1.5 text-sm">
                <Terminal className="w-3 h-3 text-[var(--accent-primary)]" />
                {inbound.port}
            </span>
        </div>
        <div className="flex flex-col gap-1 p-2 bg-[var(--bg-base)] border border-[var(--border-color)]">
            <span className="text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-wider">{t('inbounds.protocol')}</span>
            <span className="font-mono font-bold text-[var(--text-primary)] truncate text-sm uppercase" title={inbound.protocol}>
               {inbound.protocol}
            </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1 pt-3 mt-auto border-t border-[var(--border-color)] opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          title={inbound.enabled ? t('common.disable', 'Disable') : t('common.enable', 'Enable')}
          className="rounded-none hover:bg-[var(--bg-surface-hover)]"
        >
          <Power className={cn("w-4 h-4", inbound.enabled ? "text-sing-green" : "text-[var(--text-secondary)]")} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          title={t('common.edit')}
          className="rounded-none hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title={t('common.delete')}
          className="rounded-none text-[var(--text-secondary)] hover:text-sing-red hover:bg-sing-red/10 border border-transparent hover:border-sing-red/30"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Panel>
  );
}
