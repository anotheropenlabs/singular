import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { fetcher } from '@/lib/api-client';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface SystemStats {
    inbounds: number;
    users: number;
    connections: number;
    status: 'running' | 'stopped' | 'error';
    memory: string;
    cpu: string;
    uptime: string;
    version?: string;
    pid?: number;
    memoryUsage?: number;
    memoryTotal?: number;
    inboundsProtocol?: Record<string, number>;
    traffic?: {
        totalUp: number;
        totalDown: number;
    };
}

export function useSystemStats() {
    const { settings } = useSystemSettings();
    const refreshInterval = settings?.app_system_stats_refresh_interval
        ? parseInt(settings.app_system_stats_refresh_interval, 10)
        : 5000;

    const query = useQuery({
        queryKey: ['system-stats'],
        queryFn: async (): Promise<SystemStats> => {
            const data = await fetcher<any>('/api/system/status');

            // Return data directly matching shape (API now returns all needed fields)
            return {
                status: data?.status || 'stopped',
                memory: data?.memory || '0 MB',
                cpu: data?.cpu || '0%',
                uptime: data?.uptime || '0s',
                version: data?.version,
                inbounds: data?.inbounds || 0,
                users: data?.users || 0,
                connections: data?.connections || 0,
                pid: data?.pid,
                memoryUsage: data?.memoryUsage,
                memoryTotal: data?.memoryTotal,
                inboundsProtocol: data?.inboundsProtocol,
                traffic: data?.traffic,
            };
        },
        refetchInterval: refreshInterval,
    });

    const [connectionHistory, setConnectionHistory] = useState<number[]>([]);
    const [cpuHistory, setCpuHistory] = useState<number[]>([]);
    const [memoryHistory, setMemoryHistory] = useState<number[]>([]);

    useEffect(() => {
        if (query.data) {
            setConnectionHistory(prev => {
                const newHistory = [...prev, query.data.connections];
                return newHistory.slice(-20);
            });

            // Parse CPU string "1.2%" -> 1.2
            const cpuVal = parseFloat(query.data.cpu.replace('%', '')) || 0;
            setCpuHistory(prev => {
                const newHistory = [...prev, cpuVal];
                return newHistory.slice(-20);
            });

            // Calculate Memory Percentage
            // query.data.memoryUsage is bytes, memoryTotal is bytes
            const memVal = query.data.memoryTotal && query.data.memoryUsage
                ? (query.data.memoryUsage / query.data.memoryTotal) * 100
                : 0;

            setMemoryHistory(prev => {
                const newHistory = [...prev, memVal];
                return newHistory.slice(-20);
            });
        }
    }, [query.data?.connections, query.data?.cpu, query.data?.memoryUsage]);

    return { ...query, connectionHistory, cpuHistory, memoryHistory };
}

export function useSystemMutations() {
    const queryClient = useQueryClient();

    const executeAction = useMutation({
        mutationFn: (action: 'start' | 'stop' | 'restart') => fetcher(`/api/system/${action}`, { method: 'POST' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system-stats'] }),
    });

    return { executeAction };
}
