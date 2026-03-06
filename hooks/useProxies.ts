import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api-client';

export interface ClashProxy {
    name: string;
    type: string;
    history: { time: string; delay: number }[];
    udp: boolean;
    now?: string;
    all?: string[];
}

export function useProxies() {
    return useQuery({
        queryKey: ['client-proxies'],
        queryFn: async () => {
            return fetcher<Record<string, ClashProxy>>('/api/client/proxies');
        }
    });
}

export function useSelectProxy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ group, proxy }: { group: string; proxy: string }) => {
            return fetcher(`/api/client/proxies/${encodeURIComponent(group)}`, {
                method: 'PUT',
                body: JSON.stringify({ proxy })
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client-proxies'] });
        }
    });
}

export function useTestProxy() {
    return useMutation({
        mutationFn: async (proxyName: string) => {
            return fetcher<{ delay: number; success: boolean; error?: string }>(`/api/client/proxies/${encodeURIComponent(proxyName)}/delay`);
        }
    });
}
