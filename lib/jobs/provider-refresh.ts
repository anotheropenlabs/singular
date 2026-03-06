import cron, { type ScheduledTask } from 'node-cron';
import { db, provider, proxyNode } from '@/lib/db';
import { eq, and, lte, inArray, sql } from 'drizzle-orm';
import { parseSubscription } from '@/lib/providers/parser';

let scheduledTask: ScheduledTask | null = null;

// 每 10 分钟检查一次是否有需要更新的订阅
const CHECK_INTERVAL = '*/10 * * * *';

export async function startProviderRefreshScheduler() {
    if (scheduledTask) {
        scheduledTask.stop();
    }

    // 启动时立即检查一次
    await checkAndRefreshProviders();

    scheduledTask = cron.schedule(CHECK_INTERVAL, async () => {
        try {
            await checkAndRefreshProviders();
        } catch (e) {
            console.error('[Provider Refresh] Check failed:', e);
        }
    });

    console.log('[Provider Refresh] Scheduler started (check interval: 10min)');
}

export async function reloadProviderRefreshScheduler() {
    await startProviderRefreshScheduler();
}

async function checkAndRefreshProviders() {
    const now = Math.floor(Date.now() / 1000);

    // 查找启用且到期的订阅
    const dueProviders = await db.select()
        .from(provider)
        .where(and(
            eq(provider.enabled, true),
            // last_update_at must not be null
            sql`${provider.last_update_at} IS NOT NULL`,
            lte(sql`${provider.last_update_at}`, sql`CAST(${now} - ${provider.update_interval} AS INTEGER)`)
        ))
        .all();

    if (dueProviders.length > 0) {
        console.log(`[Provider Refresh] Found ${dueProviders.length} provider(s) due for update`);
    }

    for (const p of dueProviders) {
        console.log(`[Provider Refresh] Updating: ${p.name}`);
        await refreshProvider(p.id);
    }
}

export async function refreshProvider(providerId: number): Promise<{
    success: boolean;
    nodeCount?: number;
    added?: number;
    updated?: number;
    deleted?: number;
    error?: string;
}> {
    try {
        const providerData = await db.select()
            .from(provider)
            .where(eq(provider.id, providerId))
            .get();

        if (!providerData) {
            return { success: false, error: 'Provider not found' };
        }

        // 1. Fetch subscription content
        const response = await fetch(providerData.url, {
            headers: {
                'User-Agent': providerData.user_agent || 'sing-box',
            },
        });

        if (!response.ok) {
            return {
                success: false,
                error: `Failed to fetch: ${response.status} ${response.statusText}`
            };
        }

        const content = await response.text();

        // 2. Parse nodes
        const parsedNodes = parseSubscription(content, (providerData as any).subscription_type || 'auto');

        if (parsedNodes.length === 0) {
            return { success: false, error: 'No valid proxy nodes found' };
        }

        // 3. Get existing nodes
        const existingNodes = await db.select()
            .from(proxyNode)
            .where(eq(proxyNode.provider_id, providerId))
            .all();

        // 4. Build lookup index (server:port:type)
        const existingMap = new Map(
            existingNodes.map(n => [`${n.server}:${n.port}:${n.type}`, n])
        );

        // 5. Compare and categorize
        const toInsert: Array<{
            provider_id: number;
            name: string;
            type: string;
            server: string;
            port: number;
            config: string;
        }> = [];
        const toUpdate: Array<{ id: number; name: string; config: string }> = [];
        const existingKeys = new Set<string>();

        for (const node of parsedNodes) {
            const key = `${node.server}:${node.port}:${node.type}`;
            existingKeys.add(key);

            if (existingMap.has(key)) {
                // Existing: update config, keep latency
                toUpdate.push({
                    id: existingMap.get(key)!.id,
                    name: node.name,
                    config: JSON.stringify(node.config),
                });
            } else {
                // New: insert
                toInsert.push({
                    provider_id: providerId,
                    name: node.name,
                    type: node.type,
                    server: node.server,
                    port: node.port,
                    config: JSON.stringify(node.config),
                });
            }
        }

        // 6. Find nodes that no longer exist
        const toDelete = existingNodes
            .filter(n => !existingKeys.has(`${n.server}:${n.port}:${n.type}`))
            .map(n => n.id);

        // 7. Execute changes
        if (toDelete.length > 0) {
            await db.delete(proxyNode).where(inArray(proxyNode.id, toDelete));
        }

        for (const node of toUpdate) {
            await db.update(proxyNode)
                .set({ name: node.name, config: node.config })
                .where(eq(proxyNode.id, node.id));
        }

        for (const node of toInsert) {
            await db.insert(proxyNode).values(node);
        }

        // 8. Update provider metadata
        const now = Math.floor(Date.now() / 1000);
        await db.update(provider)
            .set({
                last_update_at: now,
                node_count: existingNodes.length - toDelete.length + toInsert.length,
            })
            .where(eq(provider.id, providerId));

        console.log(
            `[Provider Refresh] Updated ${providerData.name}: ` +
            `+${toInsert.length}, ~${toUpdate.length}, -${toDelete.length}`
        );

        return {
            success: true,
            nodeCount: existingNodes.length - toDelete.length + toInsert.length,
            added: toInsert.length,
            updated: toUpdate.length,
            deleted: toDelete.length,
        };
    } catch (e: any) {
        console.error(`[Provider Refresh] Refresh failed for provider ${providerId}:`, e);
        return {
            success: false,
            error: e.message || 'Unknown error'
        };
    }
}
