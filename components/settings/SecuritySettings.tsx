'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Panel from '@/components/ui/Panel';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Shield, Trash2, AlertTriangle, Plus, Search, Ban, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { fetcher } from '@/lib/api-client';
import SectionHeader from '@/components/ui/SectionHeader';

const blacklistSchema = z.object({
  ip: z.string().min(1, 'IP Address is required').regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|:/, 'Invalid IP format'),
  reason: z.string().optional(),
});

type BlacklistFormValues = z.infer<typeof blacklistSchema>;

export default function SecuritySettings() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BlacklistFormValues>({
    resolver: zodResolver(blacklistSchema)
  });

  const { data: blacklist, isLoading } = useQuery({
    queryKey: ['blacklist'],
    queryFn: async () => {
      const data = await fetcher<any>('/api/security/blacklist');
      return data || [];
    }
  });

  const addMutation = useMutation({
    mutationFn: async (data: BlacklistFormValues) => {
      return fetcher('/api/security/blacklist', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success(t('security.add_success'));
      reset();
      queryClient.invalidateQueries({ queryKey: ['blacklist'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return fetcher(`/api/security/blacklist/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast.success(t('security.remove_success'));
      queryClient.invalidateQueries({ queryKey: ['blacklist'] });
    },
    onError: () => {
      toast.error(t('common.error'));
    }
  });

  const onSubmit = (data: BlacklistFormValues) => {
    addMutation.mutate(data);
  };

  const filteredList = blacklist?.filter((item: any) => 
    item.ip.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full">
      <div className="mb-2">
        <h2 className="text-2xl font-mono font-bold text-[var(--text-primary)] uppercase tracking-tight mb-1">{t('security.title')}</h2>
        <p className="text-[var(--text-secondary)] text-sm font-mono tracking-wide">{t('security.subtitle')}</p>
      </div>

      <Panel variant="elevated" className="p-6">
        <section>
            <SectionHeader
                icon={Ban}
                title={t('security.add_blacklist')}
                description="Instantly deny access to suspicious addresses"
                color="red"
                variant="primary"
            />
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 bg-[var(--bg-base)] border border-[var(--border-color)] space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                        label={t('security.ip_address')} 
                        placeholder="e.x. 1.2.3.4" 
                        error={errors.ip?.message}
                        {...register('ip')}
                    />
                     <Input 
                        label={t('security.reason')} 
                        placeholder={t('security.reason_placeholder')} 
                        error={errors.reason?.message}
                        {...register('reason')}
                    />
                </div>
                <div className="flex justify-end">
                    <Button type="submit" variant="danger" isLoading={addMutation.isPending} className="font-mono uppercase tracking-wider rounded-none">
                        <Lock className="w-4 h-4 mr-2" />
                        {t('security.block_ip')}
                    </Button>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)] font-mono">
                    {t('security.block_desc')}
                </p>
            </form>
        </section>
      </Panel>

      {/* Blocked List */}
      <Panel variant="elevated" className="p-6">
        <section>
            <SectionHeader
                icon={Shield}
                title={t('security.blocked_ips')}
                description="List of active network enforcement rules"
                color="accent"
                variant="primary"
            />
            
            {!filteredList || filteredList.length === 0 ? (
                <div className="text-center py-8 mt-6 text-[var(--text-secondary)] bg-[var(--bg-base)] border border-dashed border-[var(--border-color)] font-mono text-sm">
                    <p>{t('security.no_blocked_ips')}</p>
                </div>
            ) : (
                <div className="space-y-2 mt-6">
                    <AnimatePresence mode="popLayout">
                        {filteredList.map((block: any) => (
                            <motion.div 
                                key={block.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center justify-between p-3 bg-[var(--bg-base)] border border-[var(--border-color)] hover:border-sing-red/50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-sing-red/10 flex items-center justify-center text-sing-red font-mono text-xs border border-sing-red/20">
                                        IP
                                    </div>
                                    <div>
                                        <p className="font-mono text-[var(--text-primary)] font-bold text-sm tracking-wide">{block.ip}</p>
                                        <p className="text-xs text-[var(--text-secondary)] font-mono">{block.reason}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] text-[var(--text-secondary)] font-mono hidden md:block">
                                        {new Date(block.added_at).toLocaleString()}
                                    </span>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => deleteMutation.mutate(block.id)}
                                        isLoading={deleteMutation.isPending}
                                        className="text-[var(--text-secondary)] hover:text-sing-red hover:bg-sing-red/10 rounded-none border border-transparent hover:border-sing-red/30 h-8 w-8"
                                        title={t('common.delete')}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </section>
      </Panel>
    </div>
  );
}
