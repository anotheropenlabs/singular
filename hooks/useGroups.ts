import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api-client';
import { ProxyGroup, ProxyNode } from '@/types';

export function useGroupsData() {
    return useQuery({
        queryKey: ['groups-data'],
        queryFn: async () => {
            const [groups, proxies] = await Promise.all([
                fetcher<ProxyGroup[]>('/api/groups'),
                fetcher<ProxyNode[]>('/api/proxies'),
            ]);
            return { groups, proxies };
        },
    });
}

export function useGroupMutations() {
    const queryClient = useQueryClient();

    const createGroup = useMutation({
        mutationFn: (data: any) => fetcher('/api/groups', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups-data'] }),
    });

    const updateGroup = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => fetcher(`/api/groups/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups-data'] }),
    });

    const deleteGroup = useMutation({
        mutationFn: (id: number) => fetcher(`/api/groups/${id}`, { method: 'DELETE' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups-data'] }),
    });

    const reorderGroups = useMutation({
        mutationFn: (orders: { id: number; sort_order: number }[]) => fetcher('/api/groups/reorder', {
            method: 'PATCH',
            body: JSON.stringify({ orders }),
        }),
        // We might not want to invalidate aggressively to avoid jitter if optimistic update is used,
        // but for now we'll just invalidate. The UI uses optimistic updates internally.
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups-data'] }),
    });

    const batchDeleteGroups = useMutation({
        mutationFn: (data: { action: 'delete'; group_ids: number[] }) => fetcher('/api/groups/batch', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups-data'] }),
    });

    return { createGroup, updateGroup, deleteGroup, batchDeleteGroups, reorderGroups };
}
