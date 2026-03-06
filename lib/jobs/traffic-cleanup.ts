
import cron, { type ScheduledTask } from 'node-cron';
import { db, settings, trafficStats } from '@/lib/db';
import { eq, lt, sql } from 'drizzle-orm';

let scheduledTask: ScheduledTask | null = null;

async function getRetentionDays(): Promise<number> {
    const setting = await db.select().from(settings).where(eq(settings.key, 'app_traffic_retention_days')).get();
    return setting?.value ? parseInt(setting.value) : 1; // Default to 1 day if not set
}

export async function cleanupTrafficStats() {
    try {
        const days = await getRetentionDays();
        // Calculate cutoff timestamp: Current time - (days * 24 * 60 * 60)
        const cutoff = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);

        const result = db.delete(trafficStats)
            .where(lt(trafficStats.timestamp, cutoff))
            .run();

        if (result.changes > 0) {
            console.log(`[Traffic Cleanup] Deleted ${result.changes} records older than ${days} days (timestamp < ${cutoff}).`);
        }
    } catch (e) {
        console.error('[Traffic Cleanup] Failed to cleanup stats:', e);
    }
}

export async function startTrafficCleanupScheduler() {
    if (scheduledTask) {
        scheduledTask.stop();
    }

    // Run every hour at minute 0
    const cronExpr = '0 * * * *';

    console.log(`[Traffic Cleanup] Scheduler started. Cron: "${cronExpr}"`);

    // Run once immediately on startup to clean up any backlog
    await cleanupTrafficStats();

    scheduledTask = cron.schedule(cronExpr, async () => {
        await cleanupTrafficStats();
    });
}
