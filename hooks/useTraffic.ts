import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface TrafficPoint {
    time: string;
    up: number;
    down: number;
}

// Store previous totals to calculate speed
let lastUploadTotal = 0;
let lastDownloadTotal = 0;
let lastTime = Date.now();

export function useTraffic() {
    const { settings } = useSystemSettings();
    const refreshInterval = settings?.app_traffic_refresh_interval
        ? parseInt(settings.app_traffic_refresh_interval, 10)
        : 5000;

    const [history, setHistory] = useState<TrafficPoint[]>([]);
    // Use a separate state for current speed to display in the header
    const [currentSpeed, setCurrentSpeed] = useState({ up: 0, down: 0 });

    const { data } = useQuery({
        queryKey: ['traffic'],
        queryFn: async () => {
            const res = await fetch('/api/connections?summary=true');
            const json = await res.json();
            const now = Date.now();
            const timeDiff = (now - lastTime) / 1000; // seconds

            const currentUpTotal = json.data?.uploadTotal || 0;
            const currentDownTotal = json.data?.downloadTotal || 0;

            // Calculate speed (bytes per second)
            // Handle first run or restart (if current < last)
            let upSpeed = 0;
            let downSpeed = 0;

            if (lastTime > 0 && timeDiff > 0 && lastUploadTotal > 0 && lastDownloadTotal > 0 && currentUpTotal >= lastUploadTotal && currentDownTotal >= lastDownloadTotal) {
                upSpeed = (currentUpTotal - lastUploadTotal) / timeDiff;
                downSpeed = (currentDownTotal - lastDownloadTotal) / timeDiff;
            }

            // Update refs
            lastUploadTotal = currentUpTotal;
            lastDownloadTotal = currentDownTotal;
            lastTime = now;

            return {
                up: upSpeed,
                down: downSpeed,
                totalUp: currentUpTotal,
                totalDown: currentDownTotal
            };
        },
        refetchInterval: refreshInterval,
    });

    useEffect(() => {
        if (data) {
            const now = new Date();
            const point = {
                time: now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                up: data.up,
                down: data.down,
            };

            setCurrentSpeed({ up: data.up, down: data.down });

            setHistory(prev => {
                const newHistory = [...prev, point];
                return newHistory.slice(-50); // Keep last 50 points (approx 2.5 mins history)
            });
        }
    }, [data]);

    return { current: currentSpeed, history };
}
