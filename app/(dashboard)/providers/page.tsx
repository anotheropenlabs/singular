'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { Provider } from '@/types';
import { useProviders, useProviderMutations } from '@/hooks/useProviders';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { SUBSCRIPTION_TYPES, type SubscriptionType } from '@/lib/providers/parser';
import { EmptyState } from '@/components/ui/EmptyState';
import {
    Plus,
    RefreshCw,
    Trash2,
    Edit3,
    Globe,
    Clock,
    Server,
    ToggleLeft,
    ToggleRight,
    Rss,
    ExternalLink,
    Loader2,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

export default function ProvidersPage() {
    const { t } = useI18n();
    const { data: providers = [], isLoading: loading } = useProviders();
    const { createProvider, updateProvider, refreshProvider, deleteProvider, toggleProvider } = useProviderMutations();

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [refreshingId, setRefreshingId] = useState<number | null>(null);
    const [refreshResults, setRefreshResults] = useState<Map<number, { added: number; updated: number; deleted: number }>>(new Map());

    // Form state
    const [formName, setFormName] = useState('');
    const [formUrl, setFormUrl] = useState('');
    const [formUserAgent, setFormUserAgent] = useState('sing-box');
    const [formInterval, setFormInterval] = useState(24); // hours
    const [formSubscriptionType, setFormSubscriptionType] = useState<SubscriptionType>('auto');

    const resetForm = () => {
        setFormName('');
        setFormUrl('');
        setFormUserAgent('sing-box');
        setFormInterval(24);
        setFormSubscriptionType('auto');
    };

    const openEditModal = (provider: Provider) => {
        setEditingProvider(provider);
        setFormName(provider.name);
        setFormUrl(provider.url);
        setFormUserAgent(provider.user_agent || 'sing-box');
        setFormInterval(Math.round((provider.update_interval || 86400) / 3600));
        setFormSubscriptionType(((provider as any).subscription_type as SubscriptionType) || 'auto');
        setShowAddModal(true);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingProvider(null);
        resetForm();
    };

    const handleSubmit = async () => {
        if (!formName.trim() || !formUrl.trim()) return;

        const payload = {
            name: formName,
            url: formUrl,
            user_agent: formUserAgent,
            subscription_type: formSubscriptionType,
            update_interval: formInterval * 3600,
        };

        if (editingProvider) {
            updateProvider.mutate(
                { id: editingProvider.id, data: payload },
                {
                    onSuccess: () => { toast.success(t('providers.update_success')); closeModal(); },
                    onError: (err: any) => toast.error(err.message || t('common.error'))
                }
            );
        } else {
            createProvider.mutate(payload, {
                onSuccess: (res: any) => {
                    toast.success(t('providers.add_success').replace('{count}', res.nodes_parsed?.toString() || '0'));
                    closeModal();
                },
                onError: (err: any) => toast.error(err.message || t('common.error'))
            });
        }
    };

    const handleRefresh = async (id: number) => {
        setRefreshingId(id);
        refreshProvider.mutate(id, {
            onSuccess: (data: any) => {
                const { added = 0, updated = 0, deleted = 0, node_count = 0 } = data || {};
                setRefreshResults(new Map(refreshResults).set(id, { added, updated, deleted }));

                const messageParts = [];
                if (added > 0) messageParts.push(`+${added}`);
                if (updated > 0) messageParts.push(`~${updated}`);
                if (deleted > 0) messageParts.push(`-${deleted}`);

                const message = messageParts.length > 0
                    ? `${node_count} nodes (${messageParts.join(', ')})`
                    : `${node_count} nodes`;

                toast.success(message);
                setRefreshingId(null);
            },
            onError: (err: any) => {
                toast.error(err.message || t('providers.fetch_error'));
                setRefreshingId(null);
            }
        });
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        deleteProvider.mutate(deletingId, {
            onSuccess: () => {
                toast.success(t('providers.delete_success'));
                setDeletingId(null);
            },
            onError: (err: any) => toast.error(err.message || t('common.error')),
            onSettled: () => setDeletingId(null)
        });
    };

    const handleToggleEnabled = async (provider: Provider) => {
        toggleProvider.mutate({ id: provider.id, enabled: !provider.enabled }, {
            onError: (err: any) => toast.error(err.message || t('common.error'))
        });
    };

    const formatLastUpdate = (timestamp: number | null) => {
        if (!timestamp) return t('providers.never_updated');
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMs / 3600000);
        const diffDay = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return t('providers.time.just_now', 'Just now');
        if (diffMin < 60) return t('providers.time.mins_ago', '{min}m ago').replace('{min}', diffMin.toString());
        if (diffHour < 24) return t('providers.time.hours_ago', '{hour}h ago').replace('{hour}', diffHour.toString());
        return t('providers.time.days_ago', '{day}d ago').replace('{day}', diffDay.toString());
    };

    const getTypeColor = (type: string): string => {
        const colors: Record<string, string> = {
            vless: 'text-blue-400',
            vmess: 'text-purple-400',
            trojan: 'text-green-400',
            shadowsocks: 'text-cyan-400',
            hysteria2: 'text-orange-400',
            tuic: 'text-yellow-400',
        };
        return colors[type] || 'text-neutral-400';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-sing-blue animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <PageHeader
                title={t('common.providers')}
                subtitle={t('providers.subtitle', 'Manage proxy providers')}
                actions={
                    <Button onClick={() => { resetForm(); setShowAddModal(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('providers.add')}
                    </Button>
                }
            />

            {/* Provider Cards */}
            {providers.length === 0 ? (
                <EmptyState
                    icon={Rss}
                    title={t('providers.no_providers')}
                    description={t('providers.no_providers_desc')}
                />
            ) : (
                <div className="grid gap-4">
                    {providers.map((p) => (
                        <Panel key={p.id} className="p-5 border border-[var(--border-color)] bg-[var(--bg-base)]">
                            <div className="flex items-start justify-between gap-4">
                                {/* Left: Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`w-2 h-2 ${p.enabled ? 'bg-green-400' : 'bg-neutral-600'}`} />
                                        <h3 className="text-lg font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider truncate">
                                            {p.name}
                                        </h3>
                                        <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] shrink-0">
                                            {p.node_count} {t('providers.node_count')}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-wide text-[var(--text-secondary)] mb-3">
                                        <Globe className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{p.url}</span>
                                    </div>

                                    <div className="flex items-center gap-4 text-[10px] font-mono tracking-wide text-[var(--text-secondary)]">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{t('providers.last_update')}: {formatLastUpdate(p.last_update_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <RefreshCw className="w-3 h-3" />
                                            <span>{t('providers.update_interval')}: {Math.round(p.update_interval / 3600)}h</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Server className="w-3 h-3" />
                                            <span>UA: {p.user_agent || 'sing-box'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)] font-mono uppercase text-[10px] tracking-widest">
                                                {(p as any).subscription_type || 'auto'}
                                            </span>
                                        </div>
                                        {refreshResults.get(p.id) && (
                                            <div className="flex items-center gap-1 text-sing-blue">
                                                <span className="text-green-400">+{refreshResults.get(p.id)!.added}</span>
                                                <span className="text-yellow-400">~{refreshResults.get(p.id)!.updated}</span>
                                                <span className="text-red-400">-{refreshResults.get(p.id)!.deleted}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleToggleEnabled(p)}
                                        className="hover:border-[var(--border-color)]"
                                        title={p.enabled ? t('providers.enabled') : t('providers.disabled')}
                                    >
                                        {p.enabled ? (
                                            <ToggleRight className="w-5 h-5 text-[#10b981]" />
                                        ) : (
                                            <ToggleLeft className="w-5 h-5 text-[var(--text-secondary)]" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRefresh(p.id)}
                                        disabled={refreshingId === p.id}
                                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]"
                                        title={t('providers.refresh')}
                                    >
                                        <RefreshCw className={`w-4 h-4 ${refreshingId === p.id ? 'animate-spin' : ''}`} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEditModal(p)}
                                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]"
                                        title={t('common.edit')}
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setDeletingId(p.id)}
                                        className="hover:border-sing-red/30 hover:bg-sing-red/10 text-[var(--text-secondary)] hover:text-sing-red"
                                        title={t('common.delete')}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Panel>
                    ))}
                </div>
            )}

            {/* Add / Edit Modal */}
            <Modal
                open={showAddModal}
                onClose={closeModal}
                title={editingProvider ? t('providers.edit') : t('providers.add')}
            >
                <div className="space-y-4">
                    <Input
                        label={t('providers.name')}
                        placeholder="My Subscription"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                    />
                    <Input
                        label={t('providers.url')}
                        placeholder="https://example.com/subscribe?token=..."
                        value={formUrl}
                        onChange={(e) => setFormUrl(e.target.value)}
                    />
                    <Input
                        label={t('providers.user_agent')}
                        placeholder="sing-box"
                        value={formUserAgent}
                        onChange={(e) => setFormUserAgent(e.target.value)}
                    />
                    <div>
                        <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase mb-2">
                            {t('providers.subscription_format', 'Subscription Format')}
                        </label>
                        <select
                            value={formSubscriptionType}
                            onChange={(e) => setFormSubscriptionType(e.target.value as SubscriptionType)}
                            className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-primary)] appearance-none"
                        >
                            {SUBSCRIPTION_TYPES.map(_t => (
                                <option key={_t.value} value={_t.value} className="bg-[var(--bg-base)]">
                                    {_t.label} — {t(`providers.type.${_t.value}` as any, _t.defaultDesc)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label={`${t('providers.update_interval')} (${t('providers.interval_hours').replace('{hours}', '')})`}
                        type="number"
                        placeholder="24"
                        value={formInterval.toString()}
                        onChange={(e) => setFormInterval(parseInt(e.target.value) || 24)}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={closeModal}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={createProvider.isPending || updateProvider.isPending || !formName.trim() || !formUrl.trim()}
                        >
                            {(createProvider.isPending || updateProvider.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingProvider ? t('common.update') : t('common.add')}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirm */}
            <ConfirmDialog
                open={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={handleDelete}
                title={t('providers.delete_confirm')}
                description={t('providers.delete_desc')}
                isLoading={deleteProvider.isPending}
            />
        </div>
    );
}
