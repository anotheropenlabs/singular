import { useQuery, useMutation } from '@tanstack/react-query';
import { fetcher } from '@/lib/api-client';

export function useSubscriptionUrl() {
    return useMutation({
        mutationFn: (userId: number) => fetcher<{ subscriptionUrl: string }>(`/api/subscriptions/${userId}`),
    });
}
