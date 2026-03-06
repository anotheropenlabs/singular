import { NextRequest } from 'next/server';
import { getServiceStatus, getResourceUsage } from '@/lib/daemon/process-manager';
import { db, nodeUser } from '@/lib/db';
import { rawConfig } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';
import si from 'systeminformation';
import { getConnections } from '@/lib/daemon/clash-api';
import { withAuth, successResponse, errorResponse } from '@/lib/api-response';
import { getSystemMode } from '@/lib/settings';

export const GET = withAuth(async () => {
    // Parallel fetch for perf
    const [status, processStats, mem, connectionsData] = await Promise.all([
        getServiceStatus(),
        getResourceUsage(),
        si.mem(), // Keep system mem for Total
        getConnections().catch(() => ({ connections: [], downloadTotal: 0, uploadTotal: 0 })) // Fail safe if service is down
    ]);

    // Group inbounds by protocol from rawConfig
    const mode = await getSystemMode();
    const rawRecord = await db.select().from(rawConfig).where(and(eq(rawConfig.side, mode), eq(rawConfig.type, 'inbounds'))).get();
    let allInbounds: any[] = [];
    if (rawRecord && rawRecord.content) {
        try {
            const parsed = JSON.parse(rawRecord.content);
            allInbounds = (parsed && typeof parsed === 'object' && 'inbounds' in parsed) ? parsed.inbounds : parsed;
            if (!Array.isArray(allInbounds)) allInbounds = [];
        } catch (e) { }
    }

    const protocolBreakdown = allInbounds.reduce((acc, curr) => {
        const proto = curr.type || 'mixed';
        acc[proto] = (acc[proto] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const inboundsCount = allInbounds.length;
    const usersCount = (await db.select({ count: count() }).from(nodeUser).get())?.count || 0;

    // Format memory: Process Used / System Total
    const usedMemMB = (processStats.memory / 1024 / 1024).toFixed(1);
    const totalMemGB = (mem.total / 1024 / 1024 / 1024).toFixed(1);

    const formatUptime = (ms: number) => {
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        const h = Math.floor(m / 60);
        const d = Math.floor(h / 24);

        if (d > 0) return `${d}d ${h % 24}h`;
        if (h > 0) return `${h}h ${m % 60}m`;
        if (m > 0) return `${m}m ${s % 60}s`;
        return `${s}s`;
    };

    return successResponse({
        status,
        pid: processStats.pid,
        cpu: `${processStats.cpu.toFixed(1)}%`,
        memory: `${usedMemMB} MB / ${totalMemGB} GB`,
        memoryUsage: processStats.memory,
        memoryTotal: mem.total,
        uptime: formatUptime(processStats.elapsed),
        version: await import('@/lib/config/version').then(m => m.getSingBoxVersion()),
        inbounds: inboundsCount,
        inboundsProtocol: protocolBreakdown, // Breakdown
        users: usersCount,
        connections: connectionsData?.connections?.length || 0,
        traffic: {
            totalUp: connectionsData?.uploadTotal || 0,
            totalDown: connectionsData?.downloadTotal || 0,
        }
    });
});
