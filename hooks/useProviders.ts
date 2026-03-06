import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api-client';
import { Provider } from '@/types';

export function useProviders() {
    return useQuery({
        queryKey: ['providers'],
        queryFn: () => fetcher<Provider[]>('/api/providers'),
    });
}

export function useProviderMutations() {
    const queryClient = useQueryClient();

    const createProvider = useMutation({
        mutationFn: (data: any) => fetcher('/api/providers', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['providers'] }),
    });

    const updateProvider = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => fetcher(`/api/providers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['providers'] }),
    });

    const refreshProvider = useMutation({
        mutationFn: (id: number) => fetcher<{ added: number; updated: number; deleted: number; node_count: number }>(`/api/providers/${id}/refresh`, { method: 'POST' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['providers'] }),
    });

    const deleteProvider = useMutation({
        mutationFn: (id: number) => fetcher(`/api/providers/${id}`, { method: 'DELETE' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['providers'] }),
    });

    const toggleProvider = useMutation({
        mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => fetcher(`/api/providers/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ enabled }),
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['providers'] }),
    });

    return { createProvider, updateProvider, refreshProvider, deleteProvider, toggleProvider };
}
