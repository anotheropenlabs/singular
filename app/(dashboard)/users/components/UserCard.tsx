'use client';

import { Users, Edit, Trash2, RotateCcw, Key } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { NodeUser } from '@/types';

interface UserCardProps {
  user: NodeUser;
  onEdit: () => void;
  onDelete: () => void;
  onResetTraffic: () => void;
  onRegenerateUuid: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function UserCard({
  user,
  onEdit,
  onDelete,
  onResetTraffic,
  onRegenerateUuid,
}: UserCardProps) {
  const isExpired = user.expire_at && new Date(user.expire_at) < new Date();
  const isOverLimit = user.traffic_limit > 0 && user.traffic_used >= user.traffic_limit;

  let status: 'success' | 'warning' | 'error' | 'default' = 'default';
  if (!user.enabled) status = 'default';
  else if (isExpired || isOverLimit) status = 'error';
  else status = 'success';

  return (
    <Card className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-green-500/20 rounded-lg">
          <Users className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium">{user.username}</h3>
            <Badge variant={status}>
              {!user.enabled ? 'Disabled' : isExpired ? 'Expired' : isOverLimit ? 'Limited' : 'Active'}
            </Badge>
          </div>
          <p className="text-white/50 text-sm">
            {formatBytes(user.traffic_used)}
            {user.traffic_limit > 0 && ` / ${formatBytes(user.traffic_limit)}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onResetTraffic} title="Reset Traffic">
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onRegenerateUuid} title="Regenerate UUID">
          <Key className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="w-4 h-4 text-red-400" />
        </Button>
      </div>
    </Card>
  );
}
