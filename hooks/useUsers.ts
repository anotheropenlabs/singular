import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api-client';
import { NodeUser, Inbound } from '@/types';
import { UserFormValues } from '@/lib/config/validators';

export function useUsersData() {
    return useQuery({
        queryKey: ['users-data'],
        queryFn: async () => {
            const [users, inbounds] = await Promise.all([
                fetcher<NodeUser[]>('/api/users'),
                fetcher<Inbound[]>('/api/inbounds'),
            ]);
            return { users, inbounds };
        },
    });
}

export function useUserMutations() {
    const queryClient = useQueryClient();

    const createUser = useMutation({
        mutationFn: (data: UserFormValues) => fetcher('/api/users', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users-data'] }),
    });

    const updateUser = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UserFormValues }) => fetcher(`/api/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users-data'] }),
    });

    const deleteUser = useMutation({
        mutationFn: (id: number) => fetcher(`/api/users/${id}`, { method: 'DELETE' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users-data'] }),
    });

    const resetUserTraffic = useMutation({
        mutationFn: (id: number) => fetcher(`/api/users/${id}/reset-traffic`, { method: 'POST' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users-data'] }),
    });

    const regenerateUserUuid = useMutation({
        mutationFn: (id: number) => fetcher(`/api/users/${id}/regenerate-uuid`, { method: 'POST' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users-data'] }),
    });

    const toggleUser = useMutation({
        mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => fetcher(`/api/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ enabled }),
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users-data'] }),
    });

    return { createUser, updateUser, deleteUser, resetUserTraffic, regenerateUserUuid, toggleUser };
}
