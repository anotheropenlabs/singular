'use client';

import { Server, Edit, Trash2, Power } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Inbound } from '@/types';

interface InboundCardProps {
  inbound: Inbound;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

export default function InboundCard({ inbound, onEdit, onDelete, onToggle }: InboundCardProps) {
  return (
    <Card className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-500/20 rounded-lg">
          <Server className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium">{inbound.tag}</h3>
            <Badge variant={inbound.enabled ? 'success' : 'default'}>
              {inbound.enabled ? 'Active' : 'Disabled'}
            </Badge>
          </div>
          <p className="text-white/50 text-sm">
            {inbound.protocol.toUpperCase()} : {inbound.port}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <Power className={`w-4 h-4 ${inbound.enabled ? 'text-green-400' : 'text-white/50'}`} />
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
