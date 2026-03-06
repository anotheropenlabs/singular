import cron, { type ScheduledTask } from 'node-cron';
import { db, nodeUser, settings } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

/**
 * Traffic reset scheduling module.
 * 
 * Checks traffic_reset_mode and traffic_reset_day from settings,
 * and resets all users' traffic_used to 0 according to schedule.
 * 
 * Modes:
 * - none: No automatic reset
 * - daily: Reset at midnight every day
 * - weekly: Reset at midnight on day 0 (Sunday)
 * - monthly: Reset at midnight on traffic_reset_day of each month
 * - yearly: Reset at midnight on Jan 1st
 */

let scheduledTask: ScheduledTask | null = null;

async function getResetConfig(): Promise<{ mode: string; day: string }> {
    const modeSetting = await db.select().from(settings).where(eq(settings.key, 'app_traffic_reset_mode')).get();
    const daySetting = await db.select().from(settings).where(eq(settings.key, 'app_traffic_reset_day')).get();
    return {
        mode: modeSetting?.value || 'monthly',
        day: daySetting?.value || '1',
    };
}

function buildCronExpression(mode: string, day: string): string | null {
    switch (mode) {
        case 'daily':
            return '0 0 * * *';           // Midnight every day
        case 'weekly':
            return '0 0 * * 0';           // Midnight every Sunday
        case 'monthly':
            return `0 0 ${day} * *`;      // Midnight on specified day
        case 'yearly':
            return '0 0 1 1 *';           // Midnight on Jan 1st
        case 'none':
        default:
            return null;
    }
}

async function resetAllTraffic() {
    try {
        const result = db.update(nodeUser)
            .set({ traffic_used: 0 })
            .run();

        console.log(`[Traffic Reset] Reset traffic for all users. Affected rows: ${result.changes}`);
    } catch (e) {
        console.error('[Traffic Reset] Failed to reset traffic:', e);
    }
}

export async function startTrafficResetScheduler() {
    // Stop existing schedule if any
    if (scheduledTask) {
        scheduledTask.stop();
        scheduledTask = null;
    }

    const { mode, day } = await getResetConfig();
    const cronExpr = buildCronExpression(mode, day);

    if (!cronExpr) {
        console.log('[Traffic Reset] Mode is "none", scheduler not started.');
        return;
    }

    console.log(`[Traffic Reset] Scheduling with mode="${mode}", day="${day}", cron="${cronExpr}"`);

    scheduledTask = cron.schedule(cronExpr, async () => {
        console.log(`[Traffic Reset] Running scheduled reset (mode=${mode})...`);
        await resetAllTraffic();
    });
}

/**
 * Call this to reload the scheduler after settings change.
 */
export async function reloadTrafficResetScheduler() {
    await startTrafficResetScheduler();
}
