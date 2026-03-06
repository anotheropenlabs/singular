
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Dynamic import to avoid bundling issues in edge runtime if any code leaks there
        const { collectTraffic } = await import('@/lib/jobs/traffic-collector');
        const { startTrafficResetScheduler } = await import('@/lib/jobs/traffic-reset');

        console.log('[Instrumentation] Starting traffic collector loop...');

        // Prevent multiple intervals in dev mode HMR
        if (!(global as any).__traffic_loop_started) {
            (global as any).__traffic_loop_started = true;

            const runTrafficLoop = async () => {
                try {
                    await collectTraffic();
                } catch (e) {
                    console.error('[Instrumentation] Traffic collection failed:', e);
                }

                // Dynamic interval: Read from DB or default to 2000ms
                let interval = 2000;
                try {
                    // We need to import db dynamically to ensure it's initialized
                    const { db, settings } = await import('@/lib/db');
                    const { eq } = await import('drizzle-orm');
                    const setting = await db.select().from(settings).where(eq(settings.key, 'app_traffic_collection_interval')).get();
                    if (setting?.value) interval = parseInt(setting.value);
                } catch (e) {
                    // Fallback to default if DB fails
                }

                setTimeout(runTrafficLoop, interval);
            };

            // Start loop async to prevent blocking startup
            Promise.resolve().then(runTrafficLoop);
        }

        // Start traffic reset scheduler (node-cron based)
        if (!(global as any).__traffic_reset_started) {
            (global as any).__traffic_reset_started = true;
            try {
                await startTrafficResetScheduler();
                console.log('[Instrumentation] Traffic reset scheduler started.');
            } catch (e) {
                console.error('[Instrumentation] Traffic reset scheduler failed:', e);
            }
        }

        // Start traffic cleanup scheduler (logs retention)
        if (!(global as any).__traffic_cleanup_started) {
            (global as any).__traffic_cleanup_started = true;
            try {
                const { startTrafficCleanupScheduler } = await import('@/lib/jobs/traffic-cleanup');
                await startTrafficCleanupScheduler();
                console.log('[Instrumentation] Traffic cleanup scheduler started.');
            } catch (e) {
                console.error('[Instrumentation] Traffic cleanup scheduler failed:', e);
            }
        }

        // Start provider refresh scheduler (Client Mode - auto update subscriptions)
        if (!(global as any).__provider_refresh_started) {
            (global as any).__provider_refresh_started = true;
            try {
                const { startProviderRefreshScheduler } = await import('@/lib/jobs/provider-refresh');
                await startProviderRefreshScheduler();
                console.log('[Instrumentation] Provider refresh scheduler started.');
            } catch (e) {
                console.error('[Instrumentation] Provider refresh scheduler failed:', e);
            }
        }
    }
}
