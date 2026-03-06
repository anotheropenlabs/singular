import { useQuery, useMutation } from '@tanstack/react-query';
import { fetcher } from '@/lib/api-client';
import { NodeUser } from '@/types';
import { SubscriptionType } from '@/lib/providers/types';

export function useClientConfigPreview() {
    return useQuery({
        queryKey: ['client-config-preview'],
        queryFn: () => fetcher<any>('/api/client/config'),
        refetchOnWindowFocus: false,
    });
}

export function useClientConfigMutations() {
    const importConfig = useMutation({
        mutationFn: (payload: { content: string; type: SubscriptionType; mode: 'append' | 'overwrite' }) =>
            fetcher<{ imported: any; format: string; message: string }>('/api/client/config/import', {
                method: 'POST',
                body: JSON.stringify(payload),
            }),
    });

    return { importConfig };
}
