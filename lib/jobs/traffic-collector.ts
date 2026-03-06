import { getConnections } from '@/lib/daemon/clash-api';
import { db, nodeUser, trafficStats } from '@/lib/db';
import { eq, or, sql } from 'drizzle-orm';
import { userIdCache } from '@/lib/cache';
import { getSettings, getSystemMode } from '@/lib/settings';
import { SETTINGS_KEYS } from '../settings-defaults';

// In-memory state to track last seen values for active connections
// Key: Connection ID, Value: { upload: number, download: number }
const connectionStates = new Map<string, { upload: number; download: number }>();

function resolveUserId(username: string, ttl: number): number | null {
    if (!username) return null;
    const cached = userIdCache.get(username);
    if (cached !== undefined) return cached;

    const user = db.select({ id: nodeUser.id })
        .from(nodeUser)
        .where(or(eq(nodeUser.username, username), eq(nodeUser.uuid, username)))
        .get();

    const id = user?.id ?? null;
    userIdCache.set(username, id, ttl);
    return id;
}


export async function collectTraffic() {
    try {
        const data = await getConnections();
        const activeIds = new Set<string>();
        const timestamp = Math.floor(Date.now() / 1000);

        if (!data) return;

        const mode = await getSystemMode();

        // Fetch TTL settings from DB outside of synchronous transaction
        const settings = await getSettings([SETTINGS_KEYS.APP_TRAFFIC_USER_CACHE_TTL_MINS]);
        const userTtlMins = parseInt(settings[SETTINGS_KEYS.APP_TRAFFIC_USER_CACHE_TTL_MINS]) || 5;
        const userTtlMs = userTtlMins * 60_000;

        // Execute database updates in a single transaction to prevent event loop blocking
        db.transaction((tx) => {
            const updates = new Map<number, number>();

            for (const conn of data.connections) {
                activeIds.add(conn.id);

                const currentUpload = conn.upload;
                const currentDownload = conn.download;

                let deltaUpload = 0;
                let deltaDownload = 0;

                const lastState = connectionStates.get(conn.id);

                if (lastState) {
                    deltaUpload = currentUpload - lastState.upload;
                    deltaDownload = currentDownload - lastState.download;
                } else {
                    deltaUpload = 0;
                    deltaDownload = 0;
                }

                if (deltaUpload < 0) deltaUpload = currentUpload;
                if (deltaDownload < 0) deltaDownload = currentDownload;

                if (deltaUpload === 0 && deltaDownload === 0) {
                    connectionStates.set(conn.id, { upload: currentUpload, download: currentDownload });
                    continue;
                }

                const username = conn.metadata.inboundUser;

                const userId = resolveUserId(username ?? '', userTtlMs);

                // 1. Log stats
                tx.insert(trafficStats).values({
                    user_id: userId,
                    upload: deltaUpload,
                    download: deltaDownload,
                    timestamp: timestamp
                }).run();

                // 2. Accumulate User Usage for batching
                if (userId) {
                    const currentTotal = updates.get(userId) || 0;
                    updates.set(userId, currentTotal + deltaUpload + deltaDownload);
                }

                connectionStates.set(conn.id, { upload: currentUpload, download: currentDownload });
            }

            // 3. Update all accumulated User Usages
            for (const [userId, traffic] of Array.from(updates.entries())) {
                tx.update(nodeUser)
                    .set({
                        traffic_used: sql`${nodeUser.traffic_used} + ${traffic}`
                    })
                    .where(eq(nodeUser.id, userId))
                    .run();
            }
        });

        // Cleanup closed connections
        for (const id of Array.from(connectionStates.keys())) {
            if (!activeIds.has(id)) {
                connectionStates.delete(id);
            }
        }

    } catch (e) {
        console.error('Traffic collection failed:', e);
    }
}
