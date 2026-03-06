'use client';

import { NodeUser } from '@/types';
import Panel from '../ui/Panel';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Pencil, Trash2, Power, RotateCw, User, Shield, Activity, Share2 } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface UserCardProps {
  user: NodeUser;
  onEdit: () => void;
  onDelete: () => void;
  onResetTraffic: () => void;
  onRegenerateUuid: () => void;
  onShare: () => void;
  onToggle: () => void;
}

export default function UserCard({ user, onEdit, onDelete, onResetTraffic, onRegenerateUuid, onShare, onToggle }: UserCardProps) {
  const { t } = useI18n();
  const isExpired = user.expire_at && new Date(user.expire_at) < new Date();
  
  const up = user.up || 0;
  const down = user.down || 0;
  const usagePercent = user.traffic_limit > 0 ? ((up + down) / user.traffic_limit) * 100 : 0;
  
  return (
    <Panel variant="default" hoverable className="p-5 flex flex-col gap-4 group h-full">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-bold text-[var(--text-primary)] text-lg uppercase tracking-wider">{user.username}</h3>
              <Badge variant={user.enabled && !isExpired ? 'success' : 'error'} className="rounded-none font-mono">
                {isExpired ? t('users.expiration') : user.enabled ? t('connections.active') : t('common.disabled', 'Disabled')}
              </Badge>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-mono tracking-widest">{user.uuid}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
             variant="ghost" 
             size="icon" 
             onClick={onToggle} 
             title={user.enabled ? t('common.disable', 'Disable') : t('common.enable', 'Enable')}
             className={cn("rounded-none border border-transparent hover:border-[var(--border-color)]", user.enabled ? 'text-sing-green' : 'text-[var(--text-secondary)]')}
          >
             <Power className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onRegenerateUuid} title={t('users.regenerate_uuid')} className="rounded-none border border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <Shield className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onShare} title={t('dashboard.subscriptions')} className="rounded-none border border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onResetTraffic} title={t('users.reset_traffic')} className="rounded-none border border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onEdit} title={t('common.edit')} className="rounded-none border border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} title={t('common.delete')} className="rounded-none border border-transparent hover:border-sing-red/30 text-[var(--text-secondary)] hover:text-sing-red bg-transparent hover:bg-sing-red/10">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="col-span-2 p-3 bg-[var(--bg-base)] border border-[var(--border-color)]">
          <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase text-[var(--text-secondary)] mb-2 tracking-wider">
            <span>{t('users.traffic_usage')}</span>
            <span className="text-[var(--text-primary)] bg-[var(--bg-surface)] px-1.5 py-0.5 border border-[var(--border-color)]">
              {formatBytes(user.up + user.down)} / {user.traffic_limit > 0 ? formatBytes(user.traffic_limit) : t('common.unlimited', 'Unlimited')}
            </span>
          </div>
          <div className="h-1 bg-[var(--bg-surface)] border border-[var(--border-color)] w-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                usagePercent > 90 ? "bg-sing-red" : usagePercent > 70 ? "bg-sing-yellow" : "bg-[var(--accent-primary)]"
              )}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}
