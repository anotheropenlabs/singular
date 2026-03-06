'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Shield, Upload, FileKey, Calendar, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import Panel from '../ui/Panel';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Certificate } from '@/types';
import { EmptyState } from '../ui/EmptyState';

export default function CertificateTable() {
  const queryClient = useQueryClient();
  const { data: certificates, isLoading } = useQuery<Certificate[]>({
    queryKey: ['certificates'],
    queryFn: async () => {
      const res = await fetch('/api/certificates');
      const json = await res.json();
      return json.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/certificates/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
  });

  if (isLoading) {
    return <div className="animate-pulse h-40 bg-[var(--bg-surface)] border border-[var(--border-color)]" />;
  }

  if (!certificates || certificates.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title="No Certificates"
        description="Upload your TLS certificates to manage secure connections."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {certificates.map((cert) => {
        const isExpired = new Date(cert.expires_at) < new Date();
        const daysLeft = Math.ceil((new Date(cert.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <Panel key={cert.id} className="p-5 flex flex-col gap-4 group border border-[var(--border-color)] bg-[var(--bg-base)]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)]">
                  <FileKey className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono font-bold text-[var(--text-primary)] text-base uppercase tracking-wider truncate max-w-[150px]">{cert.name}</h3>
                  <p className="text-[10px] text-[var(--text-secondary)] font-mono tracking-widest mt-1 truncate max-w-[150px]">{cert.domain}</p>
                </div>
              </div>
              <Badge variant={isExpired ? 'error' : 'success'} className="rounded-none font-mono">
                {isExpired ? 'Expired' : 'Valid'}
              </Badge>
            </div>

            <div className="space-y-2 text-[10px] font-mono tracking-wide text-[var(--text-secondary)] uppercase">
              <div className="flex justify-between items-center bg-[var(--bg-surface)] px-2 py-1 border border-[var(--border-color)]">
                <span>Type</span>
                <span className="text-[var(--text-primary)]">{cert.type}</span>
              </div>
              <div className="flex justify-between items-center bg-[var(--bg-surface)] px-2 py-1 border border-[var(--border-color)]">
                <span>Expires</span>
                <span className={isExpired ? 'text-sing-red' : daysLeft < 30 ? 'text-sing-yellow' : 'text-[#10b981]'}>
                  {format(new Date(cert.expires_at), 'yyyy-MM-dd')} ({daysLeft}d)
                </span>
              </div>
              <div className="flex justify-between items-center bg-[var(--bg-surface)] px-2 py-1 border border-[var(--border-color)]">
                <span>Auto Renew</span>
                <span className="text-[var(--text-primary)]">{cert.auto_renew ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-color)] flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  if (confirm('Are you sure you want to delete this certificate?')) {
                    deleteMutation.mutate(cert.id);
                  }
                }}
                className="rounded-none border border-transparent hover:border-sing-red/30 hover:bg-sing-red/10 text-[var(--text-secondary)] hover:text-sing-red transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
