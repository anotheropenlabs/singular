import { useQuery } from '@tanstack/react-query';
import { fetcher } from '@/lib/api-client';

export function useAuditLogs(page: number, limit: number, search: string) {
    return useQuery({
        queryKey: ['audit-logs', page, search],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search: search
            });
            const data = await fetcher<any[]>(`/api/audit?${params}`);
            return data || [];
        },
        placeholderData: (prev: any) => prev
    });
}

export function useSystemLogs() {
    return useQuery({
        queryKey: ['system-logs'],
        queryFn: async () => {
            const data = await fetcher<string>('/api/logs');
            return data;
        },
        enabled: false, // Often fetched manually on mount or handled via subscription
    });
}
