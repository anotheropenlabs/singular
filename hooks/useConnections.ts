import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api-client';
import { useSystemSettings } from '@/hooks/useSystemSettings';

export function useConnections() {
    const { settings } = useSystemSettings();
    const refreshInterval = settings?.app_connections_refresh_interval
        ? parseInt(settings.app_connections_refresh_interval, 10)
        : 2000;

    return useQuery({
        queryKey: ['connections'],
        queryFn: async () => {
            const data = await fetcher<any>('/api/connections');
            return {
                connections: data?.connections || [],
                downloadTotal: data?.downloadTotal || 0,
                uploadTotal: data?.uploadTotal || 0
            };
        },
        refetchInterval: refreshInterval,
    });
}

export function useConnectionMutations() {
    const queryClient = useQueryClient();

    const closeConnection = useMutation({
        mutationFn: (id: string) => fetcher(`/api/connections/${id}`, { method: 'DELETE' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
    });

    const closeAllConnections = useMutation({
        mutationFn: () => fetcher(`/api/connections`, { method: 'DELETE' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
    });

    return { closeConnection, closeAllConnections };
}
