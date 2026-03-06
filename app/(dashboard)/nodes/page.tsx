'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Panel from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/layout/PageHeader';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Checkbox } from '@/components/ui/Checkbox';
import {
    Globe, RefreshCw, Filter, Zap, Search, ArrowUpDown, Trash2,
    Edit3, Link, Info, CheckSquare, Square
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import ProtocolBadge from '@/components/ui/ProtocolBadge';
import { getAllProtocols } from '@/lib/protocols/registry';
import { useProxyNodes, useProvidersList, useNodeMutations } from '@/hooks/useNodes';

interface ProxyNode {
    id: number;
    name: string;
    type: string;
    server: string;
    port: number;
    latency?: number | null;
    enabled: boolean;
    provider_id?: number | null;
    provider_name?: string;
    config?: any;
}



export default function NodesPage() {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
    const [testingAll, setTestingAll] = useState(false);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'default' | 'name' | 'latency'>('default');

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [addMode, setAddMode] = useState<'url' | 'manual'>('url');
    const [addSubmitting, setAddSubmitting] = useState(false);

    // Form state
    const [addUrl, setAddUrl] = useState('');
    const [addName, setAddName] = useState('');
    const [addServer, setAddServer] = useState('');
    const [addPort, setAddPort] = useState('');
    const [addType, setAddType] = useState('vless');

    const { data: nodes = [], isLoading, refetch } = useProxyNodes(selectedProvider);
    const { data: providers = [] } = useProvidersList();
    const { testLatency, addNodes, toggleEnabled, deleteNode, editNode, batchNodes } = useNodeMutations();

    const [deletingNodeId, setDeletingNodeId] = useState<number | null>(null);

    const testLatencyMutation = testLatency;
    const addNodesMutation = addNodes;
    const toggleEnabledMutation = toggleEnabled;
    const deleteNodeMutation = deleteNode;
    const editNodeMutation = editNode;

    const [testingNodeIds, setTestingNodeIds] = useState<Set<number>>(new Set());
    const [selectedNodeIds, setSelectedNodeIds] = useState<Set<number>>(new Set());
    const [batchActionType, setBatchActionType] = useState<'delete' | null>(null);

    // Toast wrappers for mutations
    const handleTestAll = () => {
        setTestingAll(true);
        testLatency.mutate(undefined, {
            onSettled: () => setTestingAll(false),
            onError: (err: any) => toast.error(err.message || t('common.error'))
        });
    };

    const getLatencyColor = (latency?: number | null) => {
        if (!latency) return 'text-[#71717a]'; // null, 0, undefined
        if (latency < 0) return 'text-[#e11d48]'; // -1 for error/timeout
        if (latency < 150) return 'text-[#10b981]';
        if (latency < 400) return 'text-[#f59e0b]';
        return 'text-[#e11d48]';
    };

    const formatLatency = (latency?: number | null) => {
        if (!latency) return '---';
        if (latency < 0) return 'ERR'; // Display ERR for failed tests
        return `${latency}ms`;
    };

    const handleAddSubmit = async () => {
        if (addMode === 'url' && !addUrl.trim()) return;
        if (addMode === 'manual' && (!addName.trim() || !addServer.trim() || !addPort)) return;

        setAddSubmitting(true);
        const payload = addMode === 'url'
            ? { url: addUrl }
            : {
                name: addName,
                type: addType,
                server: addServer,
                port: addPort,
                config: {},
            };

        addNodes.mutate(payload, {
            onSuccess: (data: any) => {
                toast.success(`Added ${data.count} node(s)`);
                setShowAddModal(false);
                resetAddForm();
            },
            onError: (err: any) => toast.error(err.message || 'Failed to add nodes'),
            onSettled: () => setAddSubmitting(false)
        });
    };

    const handleDelete = () => {
        if (!deletingNodeId) return;
        deleteNode.mutate(deletingNodeId, {
            onSuccess: () => { toast.success('Node deleted'); setDeletingNodeId(null); },
            onError: (err: any) => { toast.error(err.message || 'Failed to delete node'); setDeletingNodeId(null); }
        });
    };

    const handleEditSave = () => {
        if (!editNodeId) return;
        try {
            const parsed = JSON.parse(editConfigRaw);
            editNode.mutate({ id: editNodeId, config: parsed }, {
                onSuccess: () => { toast.success('Node config updated'); setEditNodeId(null); },
                onError: (err: any) => toast.error(err.message || 'Failed to update config')
            });
        } catch (e) {
            toast.error('Invalid JSON configuration');
        }
    };

    const handleTestSingle = (id: number) => {
        setTestingNodeIds(prev => new Set(prev).add(id));
        testLatency.mutate(id, {
            onSettled: () => {
                setTestingNodeIds(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            },
            onError: (err: any) => toast.error(err.message || t('common.error'))
        });
    };

    const handleToggleEnabled = (id: number, enabled: boolean) => {
        toggleEnabled.mutate({ id, enabled }, {
            onError: (err: any) => toast.error(err.message || t('common.error'))
        });
    };

    const [editNodeId, setEditNodeId] = useState<number | null>(null);
    const [editConfigRaw, setEditConfigRaw] = useState('');
    const [isEditReadOnly, setIsEditReadOnly] = useState(false);

    const openEditModal = (node: ProxyNode) => {
        setEditNodeId(node.id);
        setIsEditReadOnly(!!node.provider_id);
        let configStr = '';
        if (typeof node.config === 'string') {
            try {
                configStr = JSON.stringify(JSON.parse(node.config), null, 4);
            } catch {
                configStr = node.config;
            }
        } else {
            configStr = JSON.stringify(node.config, null, 4);
        }
        setEditConfigRaw(configStr || '{\n\n}');
    };



    const resetAddForm = () => {
        setAddUrl('');
        setAddName('');
        setAddServer('');
        setAddPort('');
        setAddType('vless');
        setAddSubmitting(false);
    };

    // Filtered + sorted nodes
    const displayNodes = useMemo(() => {
        let result = nodes;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(n =>
                n.name.toLowerCase().includes(q) ||
                n.server.toLowerCase().includes(q)
            );
        }
        // Separate disabled nodes to end
        const enabled = result.filter(n => n.enabled);
        const disabled = result.filter(n => !n.enabled);

        const sortFunc = (a: ProxyNode, b: ProxyNode) => {
            if (sortBy === 'latency') {
                if (!a.latency && !b.latency) return 0;
                if (!a.latency) return 1;
                if (!b.latency) return -1;
                return a.latency - b.latency;
            }
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            }
            return 0; // default: no explicit sort
        };

        if (sortBy === 'default') {
            return [...enabled, ...disabled];
        }
        return [...enabled.sort(sortFunc), ...disabled.sort(sortFunc)];
    }, [nodes, search, sortBy]);

    // Multi-select handlers
    const isAllSelected = displayNodes.length > 0 && selectedNodeIds.size === displayNodes.length;
    const isSomeSelected = selectedNodeIds.size > 0 && selectedNodeIds.size < displayNodes.length;

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedNodeIds(new Set());
        } else {
            setSelectedNodeIds(new Set(displayNodes.map(n => n.id)));
        }
    };

    const toggleSelectNode = (id: number) => {
        setSelectedNodeIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBatchDelete = () => {
        if (selectedNodeIds.size === 0) return;
        batchNodes.mutate({ action: 'delete', node_ids: Array.from(selectedNodeIds) }, {
            onSuccess: (data: any) => {
                toast.success(`Deleted ${data.count} node(s)`);
                setSelectedNodeIds(new Set());
                setBatchActionType(null);
            },
            onError: (err: any) => {
                toast.error(err.message || 'Failed to delete nodes');
                setBatchActionType(null);
            }
        });
    };

    const handleBatchToggle = (enabled: boolean) => {
        if (selectedNodeIds.size === 0) return;
        batchNodes.mutate({ action: 'toggle', node_ids: Array.from(selectedNodeIds), payload: { enabled } }, {
            onSuccess: (data: any) => {
                toast.success(`${enabled ? 'Enabled' : 'Disabled'} ${data.count} node(s)`);
                // Optional: clear selection or keep it
            },
            onError: (err: any) => toast.error(err.message || `Failed to ${enabled ? 'enable' : 'disable'} nodes`)
        });
    };

    // Table Column Layout
    const tableGridLayout = "grid-cols-[40px_minmax(120px,1.5fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(150px,2fr)_80px_100px_120px]";

    return (
        <div className="space-y-4 max-w-7xl mx-auto flex flex-col">
            <PageHeader
                title="Proxy Nodes"
                actions={
                    selectedNodeIds.size > 0 ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                            <span className="text-[#3b82f6] font-bold text-sm mr-2">{selectedNodeIds.size} <span className="text-[#a1a1aa] text-[10px] tracking-widest font-normal ml-1 border-r border-[#27272a] pr-3 mr-1">SELECTED</span></span>
                            <Button size="sm" variant="outline" className="h-8 border-[#27272a] hover:border-[#10b981] hover:bg-transparent hover:text-[#10b981] tracking-widest text-[10px] px-3" onClick={() => handleBatchToggle(true)}>
                                ENABLE
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 border-[#27272a] hover:border-[#f59e0b] hover:bg-transparent hover:text-[#f59e0b] tracking-widest text-[10px] px-3" onClick={() => handleBatchToggle(false)}>
                                DISABLE
                            </Button>
                            <span className="text-[#27272a] mx-1">|</span>
                            <Button size="sm" variant="ghost" className="h-8 text-[#e11d48] hover:bg-transparent hover:text-[#f43f5e] tracking-widest text-[10px] px-2" onClick={() => setBatchActionType('delete')}>
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                DELETE
                            </Button>
                            <span className="text-[#27272a] mx-1">|</span>
                            {/* Option to clear selection */}
                            <Button size="sm" variant="ghost" className="h-8 text-[#71717a] hover:bg-transparent hover:text-[#e4e4e7] tracking-widest text-[10px] px-2" onClick={() => setSelectedNodeIds(new Set())}>
                                CANCEL
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleTestAll}
                                disabled={testingAll || isLoading}
                            >
                                <Zap className={cn('w-4 h-4 mr-2', testingAll && 'animate-pulse text-[#f59e0b]')} />
                                {testingAll ? t('proxies.testing') : t('proxies.test_latency')}
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => { resetAddForm(); setShowAddModal(true); }}
                            >
                                NEW ENDPOINT
                            </Button>
                        </>
                    )
                }
            />

            {/* Controls Bar */}
            <div className="flex justify-between items-center gap-4 flex-shrink-0 bg-[#09090b] border border-[#27272a] p-2">
                <div className="flex flex-1 items-center max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="FILTER_ENDPOINTS..."
                        className="w-full bg-[#000000] border border-[#27272a] h-9 pl-9 pr-3 text-sm font-mono text-[#e4e4e7] placeholder:text-[#52525b] focus:outline-none focus:border-[#3b82f6] transition-none"
                    />
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Provider Filter */}
                    {providers.length > 0 && (
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono text-[#71717a] mr-2">PROVIDER:</span>
                            <Button
                                variant="ghost"
                                onClick={() => setSelectedProvider(null)}
                                className={cn(
                                    'h-auto px-2 py-1 text-[10px] font-mono border uppercase tracking-widest rounded-none transition-none',
                                    selectedProvider === null
                                        ? 'bg-[#e4e4e7]/10 text-[#e4e4e7] border-[#e4e4e7]/30 hover:bg-[#e4e4e7]/20 hover:text-[#e4e4e7]'
                                        : 'bg-transparent text-[#71717a] border-[#27272a] hover:border-[#3f3f46] hover:bg-[#18181b]'
                                )}
                            >
                                ALL
                            </Button>
                            {providers.map((p) => (
                                <Button
                                    variant="ghost"
                                    key={p.id}
                                    onClick={() => setSelectedProvider(p.id)}
                                    className={cn(
                                        'h-auto px-2 py-1 text-[10px] font-mono border uppercase tracking-widest rounded-none transition-none',
                                        selectedProvider === p.id
                                            ? 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30 hover:bg-[#3b82f6]/20 hover:text-[#3b82f6]'
                                            : 'bg-transparent text-[#71717a] border-[#27272a] hover:border-[#3f3f46] hover:bg-[#18181b]'
                                    )}
                                >
                                    {p.name}
                                </Button>
                            ))}
                        </div>
                    )}

                </div>
            </div>

            {/* Data Grid */}
            <Panel variant="elevated" className="w-full rounded-none relative pb-16">
                {/* Table Header */}
                <div className={cn("grid gap-4 px-4 py-3 border-b border-[#27272a] text-[10px] font-medium text-[#52525b] uppercase tracking-wider items-center", tableGridLayout)}>
                    <div className="flex items-center justify-center">
                        <Checkbox 
                            checked={isAllSelected}
                            indeterminate={isSomeSelected}
                            onCheckedChange={toggleSelectAll}
                        />
                    </div>
                    <div 
                        className="cursor-pointer hover:text-[#e4e4e7] flex items-center gap-1 group"
                        onClick={() => setSortBy(s => s === 'name' ? 'default' : 'name')}
                    >
                        IDENTIFIER
                        <ArrowUpDown className={cn("w-3 h-3 transition-colors", sortBy === 'name' ? "text-[#3b82f6]" : "text-[#52525b] opacity-40 group-hover:opacity-100")} />
                    </div>
                    <div>TYPE</div>
                    <div>SOURCE</div>
                    <div>SERVER</div>
                    <div>PORT</div>
                    <div 
                        className="flex items-center gap-1 group relative"
                    >
                        <div 
                            className="cursor-pointer hover:text-[#e4e4e7] flex items-center gap-1"
                            onClick={() => setSortBy(s => s === 'latency' ? 'default' : 'latency')}
                        >
                            LATENCY
                            <ArrowUpDown className={cn("w-3 h-3 transition-colors", sortBy === 'latency' ? "text-[#3b82f6]" : "text-[#52525b] opacity-40 group-hover:opacity-100")} />
                        </div>
                        <div className="group/tip relative flex items-center cursor-help">
                            <Info className="w-3 h-3 text-[#52525b] hover:text-[#a1a1aa]" />
                            <div className="absolute opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity bg-[#18181b] border border-[#27272a] text-[#a1a1aa] px-2 py-1.5 rounded-none text-[10px] whitespace-nowrap right-0 top-full mt-1 z-50 normal-case tracking-normal">
                                Tested via TCP ping to Target Addr
                            </div>
                        </div>
                    </div>
                    <div>ACTIONS</div>
                </div>

                {/* Table Body */}
                <div className="bg-[#000000]">
                    {isLoading ? (
                        <div className="p-8 text-center flex justify-center items-center h-48">
                            <div className="w-2 h-4 bg-[#e4e4e7] animate-pulse" />
                        </div>
                    ) : displayNodes.length === 0 ? (
                        <div className="p-12 min-h-[300px] flex flex-col items-center justify-center text-[#71717a] font-mono">
                            <Globe className="w-8 h-8 mb-4 opacity-20" />
                            <p className="text-xs tracking-widest uppercase">[{search ? 'NO_MATCHING_ENDPOINTS' : 'NO_ENDPOINTS_FOUND'}]</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#27272a]/50">
                            {displayNodes?.map((node) => (
                                <div 
                                    key={node.id} 
                                    className={cn(
                                        "grid gap-4 px-4 py-3 items-center hover:bg-[#27272a]/20 transition-colors group",
                                        tableGridLayout,
                                        selectedNodeIds.has(node.id) && "bg-[#3b82f6]/5 hover:bg-[#3b82f6]/10",
                                        !node.enabled && 'opacity-30 grayscale'
                                    )}
                                >
                                    {/* 0. Checkbox */}
                                    <div className="flex items-center justify-center">
                                        <Checkbox 
                                            checked={selectedNodeIds.has(node.id)}
                                            onCheckedChange={() => toggleSelectNode(node.id)}
                                        />
                                    </div>

                                    {/* 1. Identifier */}
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-mono text-[#e4e4e7] truncate">{node.name}</span>
                                    </div>

                                    {/* 2. Type */}
                                    <div className="w-full">
                                        <ProtocolBadge type={node.type} className="w-fit" />
                                    </div>

                                    {/* 3. Provider/SRC */}
                                    <div className="font-mono text-[10px] text-[#71717a] truncate uppercase">
                                        {node.provider_name || '---'}
                                    </div>

                                    {/* 4. Server */}
                                    <div className="font-mono text-xs text-[#a1a1aa] truncate">
                                        {node.server}
                                    </div>

                                    {/* 5. Port */}
                                    <div className="font-mono text-[10px] text-[#52525b]">
                                        {node.port}
                                    </div>

                                    {/* 6. Latency */}
                                    <div className={cn('text-xs font-mono', getLatencyColor(node.latency))}>
                                        {formatLatency(node.latency)}
                                    </div>

                                    {/* 7. Actions */}
                                    <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleTestSingle(node.id)}
                                            disabled={testingNodeIds.has(node.id)}
                                            className="w-6 h-6 hover:bg-[#18181b]"
                                        >
                                            <Zap className={cn("w-3 h-3 text-[#a1a1aa]", testingNodeIds.has(node.id) && "animate-pulse text-[#f59e0b]")} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleToggleEnabled(node.id, !node.enabled)}
                                            className={cn(
                                                "w-10 h-6 border font-mono text-[10px]",
                                                node.enabled 
                                                    ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/20 hover:text-[#10b981]" 
                                                    : "text-[#71717a] border-[#27272a] hover:border-[#3f3f46] hover:bg-[#18181b] hover:text-[#a1a1aa]"
                                            )}
                                        >
                                            {node.enabled ? 'ON' : 'OFF'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditModal(node)}
                                            className="w-6 h-6 hover:bg-[#18181b] text-[#a1a1aa]"
                                            title="View / Edit Details"
                                        >
                                            <Edit3 className="w-3 h-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeletingNodeId(node.id)}
                                            className="w-6 h-6 hover:bg-[#e11d48]/10 hover:text-[#e11d48] text-[#a1a1aa]"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Panel>

            {/* Add Node Modal (Keep logic, update styling to match) */}
            <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="NEW ENDPOINT">
                <div className="space-y-4">
                    {/* Mode Tabs */}
                    <div className="flex border border-[#27272a] bg-[#000000] p-0.5">
                        <Button
                            variant="ghost"
                            onClick={() => setAddMode('url')}
                            className={cn(
                                'flex-1 h-auto py-1.5 px-3 text-xs font-mono font-bold uppercase rounded-none transition-none',
                                addMode === 'url' ? 'bg-[#e4e4e7] text-[#000000] hover:bg-[#e4e4e7] hover:text-[#000000]' : 'text-[#71717a] hover:bg-[#18181b] hover:text-[#a1a1aa]'
                            )}
                        >
                            URI IMPORT
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setAddMode('manual')}
                            className={cn(
                                'flex-1 h-auto py-1.5 px-3 text-xs font-mono font-bold uppercase rounded-none transition-none border-l border-[#27272a]',
                                addMode === 'manual' ? 'bg-[#e4e4e7] text-[#000000] hover:bg-[#e4e4e7] hover:text-[#000000]' : 'text-[#71717a] hover:bg-[#18181b] hover:text-[#a1a1aa]'
                            )}
                        >
                            RAW CONFIG
                        </Button>
                    </div>

                    {addMode === 'url' ? (
                        <div>
                            <Input
                                label="SUBSCRIPTION URI"
                                placeholder="vmess:// / vless:// / https://..."
                                value={addUrl}
                                onChange={e => setAddUrl(e.target.value)}
                            />
                            <p className="text-[10px] font-mono text-[#52525b] mt-2 uppercase tracking-widest">
                                BASE64 DECODING SUPPORTED NATIVELY
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Input
                                label="IDENTIFIER"
                                placeholder="e.g. US-WEST-01"
                                value={addName}
                                onChange={e => setAddName(e.target.value)}
                            />
                            <div className="grid grid-cols-4 gap-3">
                                <div className="col-span-1">
                                    <label className="text-xs font-mono font-medium text-[#71717a] uppercase tracking-wider block mb-1.5">PROTO</label>
                                    <select
                                        value={addType}
                                        onChange={e => setAddType(e.target.value as any)}
                                        className="w-full h-9 rounded-none bg-[#09090b] border border-[#27272a] px-2 text-xs font-mono text-[#e4e4e7] focus:outline-none focus:border-[#3b82f6 uppercase]"
                                    >
                                        {getAllProtocols().filter(p => !['mixed', 'tun', 'http'].includes(p.id)).map(p => (
                                            <option key={p.id} value={p.id} className="uppercase bg-[#000000]">{p.id}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        label="TARGET_ADDR"
                                        placeholder="ip or hostname"
                                        value={addServer}
                                        onChange={e => setAddServer(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Input
                                        label="PORT"
                                        type="number"
                                        placeholder="443"
                                        value={addPort}
                                        onChange={e => setAddPort(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t border-[#27272a] mt-6">
                        <Button variant="ghost" onClick={() => setShowAddModal(false)}>ABORT</Button>
                        <Button
                            variant="primary"
                            onClick={handleAddSubmit}
                            disabled={addSubmitting ||
                                (addMode === 'url' && !addUrl.trim()) ||
                                (addMode === 'manual' && (!addName.trim() || !addServer.trim()))
                            }
                        >
                            {addSubmitting && <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />}
                            EXECUTE_ADD
                        </Button>
                    </div>
                </div>
            </Modal>
            {/* Edit / Detail Modal */}
            <Modal open={!!editNodeId} onClose={() => setEditNodeId(null)} title="NODE DETAILS / EDIT">
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-mono text-[#71717a] uppercase tracking-wider">RAW CONFIGURATION (JSON)</p>
                        {isEditReadOnly && <span className="text-[10px] font-mono text-[#f59e0b] px-2 py-0.5 border border-[#f59e0b]/30 bg-[#f59e0b]/10 uppercase tracking-widest">READ-ONLY (PROVIDER MANAGED)</span>}
                    </div>
                    <textarea
                        value={editConfigRaw}
                        onChange={e => setEditConfigRaw(e.target.value)}
                        readOnly={isEditReadOnly}
                        className={cn(
                            "w-full h-64 bg-[#000000] border border-[#27272a] p-3 text-xs font-mono text-[#e4e4e7] focus:outline-none focus:border-[#3b82f6] resize-none",
                            isEditReadOnly && "opacity-80 focus:border-[#27272a] cursor-not-allowed"
                        )}
                        spellCheck={false}
                    />
                    <div className="flex justify-end gap-2 pt-4 border-t border-[#27272a] mt-6">
                        <Button variant="ghost" onClick={() => setEditNodeId(null)}>
                            {isEditReadOnly ? 'CLOSE' : 'CANCEL'}
                        </Button>
                        {!isEditReadOnly && (
                            <Button
                                variant="primary"
                                onClick={handleEditSave}
                                disabled={editNodeMutation.isPending}
                            >
                                {editNodeMutation.isPending && <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />}
                                SAVE CONFIG
                            </Button>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Confirm Dialog for Single Node */}
            <ConfirmDialog
                open={!!deletingNodeId}
                onClose={() => setDeletingNodeId(null)}
                onConfirm={handleDelete}
                title="TERMINATE_ENDPOINT"
                description="Are you sure you want to permanently delete this proxy node?"
                isLoading={deleteNodeMutation.isPending}
            />

            {/* Confirm Dialog for Batch Delete */}
            <ConfirmDialog
                open={batchActionType === 'delete'}
                onClose={() => setBatchActionType(null)}
                onConfirm={handleBatchDelete}
                title="TERMINATE MULTIPLE ENDPOINTS"
                description={`Are you sure you want to delete ${selectedNodeIds.size} selected nodes? This action cannot be undone.`}
                isLoading={batchNodes.isPending}
            />
        </div>
    );
}
