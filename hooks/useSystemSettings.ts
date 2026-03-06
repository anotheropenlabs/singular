
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { fetcher } from '@/lib/api-client';
import { SingBoxSettingsValues, DEFAULT_SINGBOX_SETTINGS } from '@/lib/settings-defaults';

export function useSystemSettings() {
    const queryClient = useQueryClient();
    const { t } = useI18n();

    const { data: settings, isLoading } = useQuery({
        queryKey: ['system-settings'],
        queryFn: async () => {
            const data = await fetcher<SingBoxSettingsValues>('/api/settings');
            return data;
        },
        // Merge with defaults to ensure values exist
        select: (data) => ({ ...DEFAULT_SINGBOX_SETTINGS, ...data }),
    });

    const updateMutation = useMutation({
        mutationFn: async (newSettings: Partial<SingBoxSettingsValues>) => {
            return fetcher('/api/settings', {
                method: 'PUT',
                body: JSON.stringify(newSettings),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-settings'] });
            // toast.success(t('settings.save_success')); // Let the component handle success toast if needed
        },
        onError: () => {
            toast.error(t('common.error'));
        },
    });

    return {
        settings,
        isLoading,
        updateSettings: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
    };
}

export function useSystemMode() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['system-mode'],
        queryFn: async () => {
            const data = await fetcher<{ mode: 'server' | 'client' }>('/api/settings/mode');
            return data?.mode || 'server';
        },
        staleTime: Infinity, // Mode rarely changes without explicit user action
    });

    const setMode = useMutation({
        mutationFn: (mode: 'server' | 'client') => fetcher('/api/settings/mode', {
            method: 'PUT',
            body: JSON.stringify({ mode })
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-mode'] });
        }
    });

    return { ...query, setMode };
}
