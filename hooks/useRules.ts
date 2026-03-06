import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api-client';

export interface RoutingRule {
    id: number;
    name?: string;
    category: string;
    type: string;
    value: string;
    outbound: string;
    priority: number;
    enabled: boolean;
}

export interface DnsServer {
    id: number;
    tag: string;
    type: string;
    server: string;
    detour?: string;
    enabled: boolean;
    sort_order: number;
}

export interface DnsRule {
    id: number;
    name?: string;
    type: string;
    value: string;
    server: string;
    priority: number;
    enabled: boolean;
}

// --- Queries ---

export function useRules(category: string) {
    return useQuery({
        queryKey: ['rules', category],
        queryFn: () => fetcher<RoutingRule[]>(`/api/rules?category=${category}`),
        enabled: category === 'route',
    });
}

export function useDnsRules(enabled: boolean) {
    return useQuery({
        queryKey: ['dns-rules'],
        queryFn: () => fetcher<DnsRule[]>('/api/dns-rules'),
        enabled,
    });
}

export function useDnsServers(enabled: boolean) {
    return useQuery({
        queryKey: ['dns-servers'],
        queryFn: () => fetcher<DnsServer[]>('/api/dns'),
        enabled,
    });
}

export function useGroupNames() {
    return useQuery({
        queryKey: ['groups-names'],
        queryFn: () => fetcher<{ name: string }[]>('/api/groups'),
    });
}

export function useDnsServerTags() {
    return useQuery({
        queryKey: ['dns-server-tags'],
        queryFn: async () => {
            const data = await fetcher<DnsServer[]>('/api/dns');
            return data.map(s => s.tag);
        }
    });
}

// --- Mutations ---

export function useRuleMutations() {
    const queryClient = useQueryClient();

    const saveRule = useMutation({
        mutationFn: async (data: any) => {
            const url = data.id ? `/api/rules/${data.id}` : '/api/rules';
            const method = data.id ? 'PUT' : 'POST';
            return fetcher(url, { method, body: JSON.stringify(data) });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
    });

    const deleteRule = useMutation({
        mutationFn: async (id: number) => fetcher(`/api/rules/${id}`, { method: 'DELETE' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
    });

    const toggleRule = useMutation({
        mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
            return fetcher(`/api/rules/${id}?autoReload=true`, {
                method: 'PUT',
                body: JSON.stringify({ enabled }),
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
    });

    return { saveRule, deleteRule, toggleRule };
}

export function useDnsRuleMutations() {
    const queryClient = useQueryClient();

    const saveDnsRule = useMutation({
        mutationFn: async (data: any) => {
            const url = data.id ? `/api/dns-rules/${data.id}` : '/api/dns-rules';
            const method = data.id ? 'PUT' : 'POST';
            return fetcher(url, { method, body: JSON.stringify(data) });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dns-rules'] }),
    });

    const deleteDnsRule = useMutation({
        mutationFn: async (id: number) => fetcher(`/api/dns-rules/${id}`, { method: 'DELETE' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dns-rules'] }),
    });

    const toggleDnsRule = useMutation({
        mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
            return fetcher(`/api/dns-rules/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ enabled }),
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dns-rules'] }),
    });

    return { saveDnsRule, deleteDnsRule, toggleDnsRule };
}

export function useDnsServerMutations() {
    const queryClient = useQueryClient();

    const saveDnsServer = useMutation({
        mutationFn: async (data: any) => {
            const url = data.id ? `/api/dns/${data.id}` : '/api/dns';
            const method = data.id ? 'PUT' : 'POST';
            return fetcher(url, { method, body: JSON.stringify(data) });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dns-servers'] }),
    });

    const deleteDnsServer = useMutation({
        mutationFn: async (id: number) => fetcher(`/api/dns/${id}`, { method: 'DELETE' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dns-servers'] }),
    });

    const toggleDnsServer = useMutation({
        mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
            return fetcher(`/api/dns/${id}?autoReload=true`, {
                method: 'PUT',
                body: JSON.stringify({ enabled }),
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dns-servers'] }),
    });

    return { saveDnsServer, deleteDnsServer, toggleDnsServer };
}
