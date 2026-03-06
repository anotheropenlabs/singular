'use client';

import { useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { ProxyGroup, ProxyNode } from '@/types';
import Panel from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/layout/PageHeader';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
    Plus,
    Trash2,
    Layers,
    Loader2,
    GripVertical,
    Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGroupsData, useGroupMutations } from '@/hooks/useGroups';

export default function GroupsPage() {
    const { t } = useI18n();
    const { data, isLoading: loading } = useGroupsData();
    const { createGroup, updateGroup, deleteGroup, reorderGroups, batchDeleteGroups } = useGroupMutations();
    
    const groups = data?.groups || [];
    const proxies = data?.proxies || [];
    
    // Modal & Form State
    const [showModal, setShowModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<ProxyGroup | null>(null);
    const [formName, setFormName] = useState('');
    const [formType, setFormType] = useState('selector');
    const [formMethod, setFormMethod] = useState<'static' | 'filter'>('static');
    const [formFilter, setFormFilter] = useState('');
    const [formSelectedProxies, setFormSelectedProxies] = useState<string[]>([]);
    const [formTestUrl, setFormTestUrl] = useState('http://www.gstatic.com/generate_204');
    const [formInterval, setFormInterval] = useState(300);
    const [formTolerance, setFormTolerance] = useState(50);
    const [submitting, setSubmitting] = useState(false);

    // Delete State
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Batch Selection State
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<number>>(new Set());
    const [batchActionType, setBatchActionType] = useState<'delete' | null>(null);

    // Drag & Drop State
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dropTargetId, setDropTargetId] = useState<number | null>(null);
    const [isReordering, setIsReordering] = useState(false);
    const draggedItemRef = useRef<HTMLDivElement | null>(null);

    const previewMatchedNodes = useMemo(() => {
        if (formMethod !== 'filter' || !formFilter.trim()) return [];
        try {
            const regex = new RegExp(formFilter);
            return proxies.filter(p => regex.test(p.name));
        } catch {
            return []; // Invalid regex
        }
    }, [formMethod, formFilter, proxies]);



    const resetForm = () => {
        setFormName('');
        setFormType('selector');
        setFormMethod('static');
        setFormFilter('');
        setFormSelectedProxies([]);
        setFormTestUrl('http://www.gstatic.com/generate_204');
        setFormInterval(300);
        setFormTolerance(50);
        setEditingGroup(null);
    };

    const openEditModal = (group: ProxyGroup) => {
        setEditingGroup(group);
        setFormName(group.name);
        setFormType(group.type);
        setFormFilter(group.node_filter || '');
        setFormMethod(group.node_filter ? 'filter' : 'static');

        let config: any = {};
        try {
            config = group.config ? JSON.parse(group.config) : {};
        } catch {}

        setFormSelectedProxies(config.outbounds || []);
        setFormTestUrl(config.test_url || 'http://www.gstatic.com/generate_204');
        setFormInterval(config.interval ? parseInt(config.interval) : 300); 
        setFormTolerance(config.tolerance || 50);

        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formName.trim()) return;
        setSubmitting(true);

        const config: any = {};
        if (formMethod === 'static') {
            config.outbounds = formSelectedProxies;
        }
        
        if (formType === 'urltest' || formType === 'fallback') {
            config.test_url = formTestUrl;
            config.interval = `${formInterval}s`; 
            config.tolerance = formTolerance;
        }

        const payload = {
            name: formName,
            type: formType,
            node_filter: formMethod === 'filter' ? formFilter : null,
            config,
            sort_order: editingGroup ? editingGroup.sort_order : groups.length,
        };

        try {
            if (editingGroup) {
                updateGroup.mutate(
                    { id: editingGroup.id, data: payload },
                    {
                        onSuccess: () => {
                            toast.success(t('common.save_success'));
                            setShowModal(false);
                            resetForm();
                        },
                        onError: (err: any) => toast.error(err.message || t('common.error'))
                    }
                );
            } else {
                createGroup.mutate(payload, {
                    onSuccess: () => {
                        toast.success(t('common.success'));
                        setShowModal(false);
                        resetForm();
                    },
                    onError: (err: any) => toast.error(err.message || t('common.error'))
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!deletingId) return;
        deleteGroup.mutate(deletingId, {
            onSuccess: () => {
                toast.success(t('common.delete_success'));
                setDeletingId(null);
            },
            onError: (err: any) => toast.error(err.message || t('common.error')),
            onSettled: () => setDeletingId(null)
        });
    };

    const toggleProxy = (tag: string) => {
        setFormSelectedProxies(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleBatchDelete = () => {
        if (selectedGroupIds.size === 0) return;
        const ids = Array.from(selectedGroupIds);
        batchDeleteGroups.mutate({ action: 'delete', group_ids: ids }, {
            onSuccess: (data: any) => {
                toast.success(`Deleted ${data.count || ids.length} group(s)`);
                setSelectedGroupIds(new Set());
                setBatchActionType(null);
            },
            onError: (err: any) => toast.error(err.message || 'Failed to delete groups')
        });
    };

    const handleDragStart = (e: React.DragEvent, groupId: number) => {
        setDraggedId(groupId);
        draggedItemRef.current = e.target as HTMLDivElement;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', groupId.toString());

        setTimeout(() => {
            if (draggedItemRef.current) {
                draggedItemRef.current.style.opacity = '0.5';
            }
        }, 0);
    };

    const handleDragOver = (e: React.DragEvent, groupId: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedId === groupId || draggedId === null) return;
        setDropTargetId(groupId);
    };

    const handleDragLeave = () => {
        setDropTargetId(null);
    };

    const handleDrop = async (e: React.DragEvent, targetGroupId: number) => {
        e.preventDefault();
        e.stopPropagation();

        if (draggedId === targetGroupId || draggedId === null) {
            setDraggedId(null);
            setDropTargetId(null);
            return;
        }

        setIsReordering(true);

        try {
            const currentIndex = groups.findIndex(g => g.id === draggedId);
            const targetIndex = groups.findIndex(g => g.id === targetGroupId);

            if (currentIndex === -1 || targetIndex === -1) return;

            const newGroups = [...groups];
            const [draggedGroup] = newGroups.splice(currentIndex, 1);
            newGroups.splice(targetIndex, 0, draggedGroup);

            const orders = newGroups.map((group, index) => ({
                id: group.id,
                sort_order: index
            }));

            reorderGroups.mutate(orders, {
                onError: (err: any) => toast.error(err.message || t('common.error')),
                onSettled: () => {
                    setDraggedId(null);
                    setDropTargetId(null);
                    setIsReordering(false);
                    if (draggedItemRef.current) {
                        draggedItemRef.current.style.opacity = '1';
                        draggedItemRef.current = null;
                    }
                }
            });
        } catch {
            toast.error(t('common.error'));
            setDraggedId(null);
            setDropTargetId(null);
            setIsReordering(false);
        }
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDropTargetId(null);
        if (draggedItemRef.current) {
            draggedItemRef.current.style.opacity = '1';
            draggedItemRef.current = null;
        }
    };

    return (
        <div className="space-y-4 max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)]">
            <PageHeader
                title="Proxy Groups"
                subtitle={t('groups.subtitle', 'Manage proxy selection strategies')}
                actions={
                    <div className="flex items-center gap-4">
                        {groups.length > 0 && (
                            <div className="flex items-center gap-2 mr-2 border-r border-[#27272a] pr-4">
                                <span className="text-[10px] font-mono font-medium text-[#71717a] uppercase tracking-wider">SELECT_ALL</span>
                                <div 
                                    className="w-4 h-4 border border-[#3f3f46] rounded-sm cursor-pointer flex items-center justify-center transition-none bg-[#09090b] hover:border-[#71717a]"
                                    onClick={() => {
                                        if (selectedGroupIds.size === groups.length) {
                                            setSelectedGroupIds(new Set());
                                        } else {
                                            setSelectedGroupIds(new Set(groups.map(g => g.id)));
                                        }
                                    }}
                                >
                                    {selectedGroupIds.size > 0 && selectedGroupIds.size === groups.length && <div className="w-2.5 h-2.5 bg-[#3b82f6] rounded-[1px]"></div>}
                                    {selectedGroupIds.size > 0 && selectedGroupIds.size < groups.length && <div className="w-2.5 h-[2px] bg-[#3b82f6] rounded-[1px]"></div>}
                                </div>
                            </div>
                        )}
                        {selectedGroupIds.size > 0 ? (
                            <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                                <span className="text-[#3b82f6] font-bold text-sm mr-2">{selectedGroupIds.size} <span className="text-[#a1a1aa] text-[10px] tracking-widest font-normal ml-1 border-r border-[#27272a] pr-3 mr-1">SELECTED</span></span>
                                <Button size="sm" variant="ghost" className="h-8 text-[#e11d48] hover:bg-transparent hover:text-[#f43f5e] tracking-widest text-[10px] px-2" onClick={() => setBatchActionType('delete')}>
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                    DELETE
                                </Button>
                                <span className="text-[#27272a] mx-1">|</span>
                                {/* Option to clear selection */}
                                <Button size="sm" variant="ghost" className="h-8 text-[#71717a] hover:bg-transparent hover:text-[#e4e4e7] tracking-widest text-[10px] px-2" onClick={() => setSelectedGroupIds(new Set())}>
                                    CANCEL
                                </Button>
                            </div>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => { resetForm(); setShowModal(true); }}>
                                <Plus className="w-4 h-4 mr-2" />
                                NEW_GROUP
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="flex-1 overflow-y-auto min-h-0 w-full">
                <div className="pb-8">
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="w-2 h-4 bg-[#e4e4e7] animate-pulse" />
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-[#71717a] font-mono border border-dashed border-[#27272a] bg-[#000000]">
                            <Layers className="w-8 h-8 mb-4 opacity-20" />
                            <p className="text-xs tracking-widest uppercase">[NO_PROXY_GROUPS_FOUND]</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
                            {groups.map((group, index) => {
                                let config: any = {};
                                try { config = group.config ? JSON.parse(group.config) : {}; } catch {}
                                const isDragging = draggedId === group.id;
                                const isDragOver = dropTargetId === group.id;
                                const isSelected = selectedGroupIds.has(group.id);

                                return (
                                    <div
                                        key={group.id}
                                        draggable={!isReordering && selectedGroupIds.size === 0}
                                        onDragStart={(e) => handleDragStart(e, group.id)}
                                        onDragOver={(e) => handleDragOver(e, group.id)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, group.id)}
                                        onDragEnd={handleDragEnd}
                                        className={cn(
                                            'group relative flex flex-col overflow-hidden bg-[#09090b] border transition-all duration-200 cursor-grab',
                                            isDragging ? 'opacity-30' : 'hover:-translate-y-1',
                                            isSelected ? 'border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-[#27272a] hover:border-[#3b82f6]/50 hover:shadow-lg hover:shadow-black/50',
                                            isDragOver && !isDragging && 'border-[#3b82f6] shadow-[0_0_20px_rgba(59,130,246,0.2)] scale-[1.02]'
                                        )}
                                        onClick={() => {
                                            const next = new Set(selectedGroupIds);
                                            if (next.has(group.id)) next.delete(group.id);
                                            else next.add(group.id);
                                            setSelectedGroupIds(next);
                                        }}
                                    >
                                        {/* Card Header */}
                                        <div className="flex items-center justify-between p-3 border-b border-[#27272a] bg-[#000000]">
                                            <div 
                                                className={cn(
                                                    "w-4 h-4 border rounded-sm flex items-center justify-center transition-colors shadow-inner",
                                                    isSelected ? "border-[#3b82f6] bg-[#09090b]" : "border-[#3f3f46] group-hover:border-[#71717a] bg-[#09090b]"
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const next = new Set(selectedGroupIds);
                                                    if (next.has(group.id)) next.delete(group.id);
                                                    else next.add(group.id);
                                                    setSelectedGroupIds(next);
                                                }}
                                            >
                                                {isSelected && <div className="w-2 h-2 bg-[#3b82f6] rounded-[1px]"></div>}
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <div className="text-[10px] font-mono font-medium tracking-widest text-[#52525b] mr-2">#{index + 1}</div>
                                                <span className={cn(
                                                    "text-[9px] px-1.5 py-0.5 rounded-sm font-mono tracking-widest border uppercase",
                                                    group.type === 'urltest' ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20" :
                                                    group.type === 'selector' ? "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20" :
                                                    "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20"
                                                )}>
                                                    {group.type}
                                                </span>
                                                <div className="text-[#3f3f46] group-hover:text-[#a1a1aa] transition-colors cursor-grab active:cursor-grabbing px-1" title="Drag to reorder">
                                                    <GripVertical className="w-3.5 h-3.5" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-4 flex-1 flex flex-col justify-center">
                                            <h3 className={cn(
                                                "font-mono text-base font-bold truncate mb-3 transition-colors",
                                                isSelected ? "text-[#3b82f6]" : "text-[#e4e4e7] group-hover:text-white"
                                            )}>
                                                {group.name}
                                            </h3>
                                            
                                            <div className="space-y-1.5 divide-y divide-[#18181b]/50 mt-1">
                                                <div className="flex justify-between items-center text-[10px] font-mono py-1">
                                                    <span className="text-[#71717a]">PROXIES</span>
                                                    <span className={cn(
                                                        "font-medium",
                                                        isSelected ? "text-[#3b82f6]" : "text-[#a1a1aa]"
                                                    )}>
                                                        {group.node_filter ? `FILTER[ ${group.node_filter} ]` : `COUNT[ ${config.outbounds?.length || 0} ]`}
                                                    </span>
                                                </div>
                                                {(group.type === 'urltest' || group.type === 'fallback') && (
                                                    <div className="flex justify-between items-center text-[10px] font-mono py-1">
                                                        <span className="text-[#71717a]">INTERVAL</span>
                                                        <span className="text-[#a1a1aa]">{config.interval || '300s'}</span>
                                                    </div>
                                                )}
                                                {group.type === 'urltest' && config.tolerance && (
                                                    <div className="flex justify-between items-center text-[10px] font-mono py-1">
                                                        <span className="text-[#71717a]">TOLERANCE</span>
                                                        <span className="text-[#a1a1aa]">{config.tolerance}ms</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Actions Overlay (Hover) */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2 pointer-events-none">
                                            <div className="flex gap-1 pointer-events-auto">
                                                <Button 
                                                    onClick={(e) => { e.stopPropagation(); openEditModal(group); }} 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="w-7 h-7 bg-[#18181b]/80 backdrop-blur-sm border border-[#27272a] hover:border-[#3b82f6] hover:text-[#3b82f6] hover:bg-[#000000] text-[#a1a1aa] rounded-none shadow-lg"
                                                    title="Edit Group"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button 
                                                    onClick={(e) => { e.stopPropagation(); setDeletingId(group.id); }} 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="w-7 h-7 bg-[#18181b]/80 backdrop-blur-sm border border-[#27272a] hover:border-[#e11d48] hover:text-[#e11d48] hover:bg-[#000000] text-[#a1a1aa] rounded-none shadow-lg"
                                                    title="Delete Group"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                </div>

            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editingGroup ? 'MOD_GROUP_CONFIG' : 'NEW_GROUP_DEF'}
            >
                <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
                    <Input label="GROUP_IDENTIFIER" value={formName} onChange={e => setFormName(e.target.value)} />
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono font-medium text-[#71717a] uppercase tracking-wider block mb-1">BEHAVIOR_TYPE</label>
                        <select
                            className="w-full h-9 rounded-none bg-[#09090b] border border-[#27272a] px-2 text-xs font-mono text-[#e4e4e7] focus:outline-none focus:border-[#3b82f6] uppercase"
                            value={formType}
                            onChange={(e) => setFormType(e.target.value)}
                        >
                            <option value="selector" className="bg-[#000000]">SELECTOR (MANUAL)</option>
                            <option value="urltest" className="bg-[#000000]">URLTEST (AUTO)</option>
                            <option value="fallback" className="bg-[#000000]">FALLBACK (HA)</option>
                        </select>
                    </div>

                    {(formType === 'urltest' || formType === 'fallback') && (
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#27272a]">
                            <div className="col-span-2">
                                <Input label="TEST_ENDPOINT" value={formTestUrl} onChange={e => setFormTestUrl(e.target.value)} />
                            </div>
                            <Input label="INTERVAL (SEC)" type="number" value={formInterval.toString()} onChange={e => setFormInterval(parseInt(e.target.value))} />
                            <Input label="TOLERANCE (MS)" type="number" value={formTolerance.toString()} onChange={e => setFormTolerance(parseInt(e.target.value))} />
                        </div>
                    )}

                    <div className="space-y-2 pt-2 border-t border-[#27272a]">
                        <label className="text-[10px] font-mono font-medium text-[#71717a] uppercase tracking-wider block mb-1">TARGET_SELECTION</label>
                        <div className="flex bg-[#000000] border border-[#27272a]">
                            <Button
                                variant="ghost"
                                className={cn(
                                    "flex-1 h-8 text-[10px] font-mono font-bold transition-none rounded-none border-r border-[#27272a]",
                                    formMethod === 'static' ? "bg-[#e4e4e7] text-[#000000] hover:bg-[#e4e4e7] hover:text-[#000000]" : "text-[#71717a] hover:bg-[#18181b] hover:text-[#a1a1aa]"
                                )}
                                onClick={() => setFormMethod('static')}
                            >
                                STATIC_LIST
                            </Button>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "flex-1 h-8 text-[10px] font-mono font-bold transition-none rounded-none",
                                    formMethod === 'filter' ? "bg-[#e4e4e7] text-[#000000] hover:bg-[#e4e4e7] hover:text-[#000000]" : "text-[#71717a] hover:bg-[#18181b] hover:text-[#a1a1aa]"
                                )}
                                onClick={() => setFormMethod('filter')}
                            >
                                REGEX_FILTER
                            </Button>
                        </div>
                    </div>

                    {formMethod === 'filter' ? (
                        <div className="space-y-4">
                            <Input 
                                label="PATTERN_REGEX" 
                                placeholder="e.g. HK|SG|US"
                                value={formFilter} 
                                onChange={e => setFormFilter(e.target.value)} 
                            />
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono font-medium text-[#71717a] uppercase tracking-wider block mb-1">
                                    MATCHED_NODES_PREVIEW [{previewMatchedNodes.length}]
                                </label>
                                <div className="h-40 overflow-y-auto rounded-none border border-[#27272a] bg-[#000000] p-1 shadow-inner">
                                    {previewMatchedNodes.length === 0 ? (
                                        <div className="text-center text-[10px] font-mono text-[#52525b] py-8 uppercase">[NO_NODES_MATCHED]</div>
                                    ) : (
                                        <div className="divide-y divide-[#18181b]">
                                            {previewMatchedNodes.map(p => (
                                                <div key={p.name} className="flex items-center gap-3 px-2 py-1.5 hover:bg-[#09090b] transition-none">
                                                    <div className="flex-1 min-w-0 flex items-baseline justify-between">
                                                        <div className="text-xs font-mono text-[#10b981] truncate">{p.name}</div>
                                                        <div className="text-[10px] font-mono text-[#52525b] truncate ml-2 shrink-0">{p.server}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono font-medium text-[#71717a] uppercase tracking-wider block mb-1">AVAILABLE_NODES [{formSelectedProxies.length} SELECTED]</label>
                            <div className="h-48 overflow-y-auto rounded-none border border-[#27272a] bg-[#000000] p-1 shadow-inner">
                                {proxies.length === 0 ? (
                                    <div className="text-center text-[10px] font-mono text-[#52525b] py-8 uppercase">[NO_NODES_CONFIGURED]</div>
                                ) : (
                                    <div className="divide-y divide-[#18181b]">
                                        {proxies.map(proxy => (
                                            <div 
                                                key={proxy.name}
                                                onClick={() => toggleProxy(proxy.name)}
                                                className={cn(
                                                    "flex items-center gap-3 px-2 py-1.5 cursor-pointer transition-none",
                                                    formSelectedProxies.includes(proxy.name) ? "bg-[#3b82f6]/10" : "hover:bg-[#09090b]"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-3 h-3 border rounded-none flex items-center justify-center transition-none shrink-0",
                                                    formSelectedProxies.includes(proxy.name) ? "border-[#3b82f6] bg-[#3b82f6]" : "border-[#3f3f46]"
                                                )}>
                                                    {formSelectedProxies.includes(proxy.name) && <div className="w-1.5 h-1.5 bg-[#000000]" />}
                                                </div>
                                                <div className="flex-1 min-w-0 flex items-baseline justify-between">
                                                    <div className="text-xs font-mono text-[#e4e4e7] truncate">{proxy.name}</div>
                                                    <div className="text-[10px] font-mono text-[#52525b] truncate ml-2 shrink-0">{proxy.server}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t border-[#27272a] mt-6">
                        <Button variant="ghost" onClick={() => setShowModal(false)}>ABORT</Button>
                        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            COMMIT_CFG
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Batch Delete Confirm */}
            <ConfirmDialog
                open={batchActionType === 'delete'}
                onClose={() => setBatchActionType(null)}
                onConfirm={handleBatchDelete}
                title="TERMINATE_GROUPS"
                description={`Are you sure you want to permanently delete ${selectedGroupIds.size} proxy group(s)?`}
                isLoading={batchDeleteGroups.isPending}
            />

            <ConfirmDialog
                open={!!deletingId}
                onClose={() => setDeletingId(null)}
                onConfirm={handleDelete}
                title="TERMINATE_GROUP"
                description="Are you sure you want to permanently delete this proxy group?"
                isLoading={deleteGroup.isPending}
            />
        </div>
    );
}
