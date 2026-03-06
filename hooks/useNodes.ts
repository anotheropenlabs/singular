import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api-client';
import { ProxyNode as DbProxyNode } from '@/types';

export type ProxyNode = DbProxyNode & { provider_name?: string };

interface Provider {
    id: number;
    name: string;
}

export function useProxyNodes(selectedProvider: number | null) {
    return useQuery<ProxyNode[]>({
        queryKey: ['proxy-nodes', selectedProvider],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (selectedProvider) params.set('provider_id', selectedProvider.toString());
            return fetcher<ProxyNode[]>(`/api/proxies?${params}`);
        },
        refetchOnWindowFocus: false,
    });
}

export function useProvidersList() {
    return useQuery<Provider[]>({
        queryKey: ['providers-list'],
        queryFn: () => fetcher<Provider[]>('/api/providers'),
        refetchOnWindowFocus: false,
    });
}

export function useNodeMutations() {
    const queryClient = useQueryClient();

    const testLatency = useMutation({
        mutationFn: (nodeId?: number) => {
            const body = nodeId ? { node_ids: [nodeId] } : { node_ids: [] };
            return fetcher('/api/proxies/latency', {
                method: 'POST',
                body: JSON.stringify(body),
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proxy-nodes'] }),
    });

    const addNodes = useMutation({
        mutationFn: (data: any) => fetcher<{ count: number }>('/api/proxies', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proxy-nodes'] }),
    });

    const toggleEnabled = useMutation({
        mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => fetcher(`/api/proxies/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ enabled }),
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proxy-nodes'] }),
    });

    const deleteNode = useMutation({
        mutationFn: (id: number) => fetcher(`/api/proxies/${id}`, { method: 'DELETE' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proxy-nodes'] }),
    });

    const editNode = useMutation({
        mutationFn: ({ id, config }: { id: number; config: any }) => fetcher(`/api/proxies/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ config }),
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proxy-nodes'] }),
    });

    const batchNodes = useMutation({
        mutationFn: ({ action, node_ids, payload }: { action: 'delete' | 'toggle'; node_ids: number[]; payload?: any }) =>
            fetcher(`/api/proxies/batch`, {
                method: 'POST',
                body: JSON.stringify({ action, node_ids, payload }),
            }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proxy-nodes'] }),
    });

    return { testLatency, addNodes, toggleEnabled, deleteNode, editNode, batchNodes };
}
