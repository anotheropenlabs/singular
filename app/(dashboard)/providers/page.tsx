'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { Provider } from '@/types';
import { useProviders, useProviderMutations } from '@/hooks/useProviders';
import Panel from '@/components/ui/GlassCard';
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
        if (!timestamp) return 'NEVER';
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMs / 3600000);
        const diffDay = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return 'JUST_NOW';
        if (diffMin < 60) return `${diffMin}M_AGO`;
        if (diffHour < 24) return `${diffHour}H_AGO`;
        return `${diffDay}D_AGO`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-2 h-4 bg-[var(--text-primary)] animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-4 max-w-7xl mx-auto">
            <PageHeader
                title="PROVIDERS"
                subtitle={t('providers.subtitle', 'Manage proxy providers')}
                actions={
                    <Button variant="outline" size="sm" onClick={() => { resetForm(); setShowAddModal(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        NEW_PROVIDER
                    </Button>
                }
            />

            {/* Provider Cards */}
            {providers.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-[var(--text-secondary)] font-mono border border-dashed border-[var(--border-color)] bg-[var(--bg-base)]">
                    <Rss className="w-8 h-8 mb-4 opacity-20" />
                    <p className="text-xs tracking-widest uppercase">[NO_PROVIDERS_FOUND]</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {providers.map((p) => (
                        <Panel
                            key={p.id}
                            variant="elevated"
                            hoverable
                            className="group transition-all duration-200"
                        >
                            <div className="flex items-start justify-between gap-4 p-5">
                                {/* Left: Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-1.5 h-1.5 rounded-full ${p.enabled ? 'bg-[var(--status-success)] shadow-[0_0_8px_var(--status-success)]' : 'bg-[var(--text-secondary)]'}`} />
                                        <h3 className="text-lg font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider truncate">
                                            {p.name}
                                        </h3>
                                        <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-color)] shrink-0">
                                            {p.node_count} NODES
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-wide text-[var(--text-secondary)] mb-4">
                                        <Globe className="w-3 h-3 shrink-0 opacity-50" />
                                        <span className="truncate opacity-80">{p.url}</span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:flex lg:items-center gap-x-6 gap-y-2 text-[10px] font-mono tracking-wide text-[var(--text-secondary)]">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3 h-3 opacity-50" />
                                            <span className="uppercase">UPDATE: {formatLastUpdate(p.last_update_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <RefreshCw className="w-3 h-3 opacity-50" />
                                            <span className="uppercase">INTERVAL: {Math.round(p.update_interval / 3600)}H</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Server className="w-3 h-3 opacity-50" />
                                            <span className="uppercase truncate max-w-[100px]">AGENT: {p.user_agent || 'sing-box'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-1.5 py-0.5 bg-[var(--bg-base)] border border-[var(--border-color)] text-[var(--text-secondary)] font-mono uppercase text-[9px] tracking-widest">
                                                {(p as any).subscription_type || 'auto'}
                                            </span>
                                            {refreshResults.get(p.id) && (
                                                <div className="flex items-center gap-1.5 ml-2">
                                                    <span className="text-[var(--status-success)]">+{refreshResults.get(p.id)!.added}</span>
                                                    <span className="text-[var(--status-warning)]">~{refreshResults.get(p.id)!.updated}</span>
                                                    <span className="text-[var(--status-error)]">-{refreshResults.get(p.id)!.deleted}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex items-center gap-1 shrink-0 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleToggleEnabled(p)}
                                        className="w-10 h-8 border font-mono text-[9px] uppercase transition-all"
                                    >
                                        {p.enabled ? (
                                            <span className="text-[var(--status-success)] font-bold">ON</span>
                                        ) : (
                                            <span className="text-[var(--text-secondary)]">OFF</span>
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRefresh(p.id)}
                                        disabled={refreshingId === p.id}
                                        className="w-8 h-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                        title="REFRESH_DATA"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${refreshingId === p.id ? 'animate-spin' : ''}`} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEditModal(p)}
                                        className="w-8 h-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                        title="EDIT_PROVIDER"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setDeletingId(p.id)}
                                        className="w-8 h-8 hover:text-[var(--status-error)] hover:bg-[var(--status-error)]/10 text-[var(--text-secondary)]"
                                        title="DELETE_PROVIDER"
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
                title={editingProvider ? 'MOD_PROVIDER_CFG' : 'NEW_PROVIDER_DEF'}
            >
                <div className="space-y-4">
                    <Input
                        label="PROVIDER_IDENTIFIER"
                        placeholder="e.g. My Subscription"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                    />
                    <Input
                        label="SUBSCRIPTION_ENDPOINT"
                        placeholder="https://example.com/subscribe?token=..."
                        value={formUrl}
                        onChange={(e) => setFormUrl(e.target.value)}
                    />
                    <Input
                        label="USER_AGENT_STRING"
                        placeholder="sing-box"
                        value={formUserAgent}
                        onChange={(e) => setFormUserAgent(e.target.value)}
                    />
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono font-medium text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                            SUB_FORMAT_SPEC
                        </label>
                        <select
                            value={formSubscriptionType}
                            onChange={(e) => setFormSubscriptionType(e.target.value as SubscriptionType)}
                            className="w-full h-9 rounded-none bg-[var(--bg-base)] border border-[var(--border-color)] px-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] uppercase appearance-none"
                        >
                            {SUBSCRIPTION_TYPES.map(_t => (
                                <option key={_t.value} value={_t.value} className="bg-[var(--bg-base)]">
                                    {_t.label} — {t(`providers.type.${_t.value}` as any, _t.defaultDesc).toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label={`REFRESH_INTERVAL (HOURS)`}
                        type="number"
                        placeholder="24"
                        value={formInterval.toString()}
                        onChange={(e) => setFormInterval(parseInt(e.target.value) || 24)}
                    />
                    <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-color)] mt-6">
                        <Button variant="ghost" onClick={closeModal}>
                            ABORT
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={createProvider.isPending || updateProvider.isPending || !formName.trim() || !formUrl.trim()}
                        >
                            {(createProvider.isPending || updateProvider.isPending) && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                            {editingProvider ? 'COMMIT_UPDATE' : 'EXECUTE_ADD'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirm */}
            <ConfirmDialog
                open={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={handleDelete}
                title="TERMINATE_PROVIDER"
                description="Are you sure you want to permanently delete this subscription provider?"
                isLoading={deleteProvider.isPending}
            />
        </div>
    );
}
