import { NextRequest } from 'next/server';
import { db, settings } from '@/lib/db';
import { withAuth, successResponse } from '@/lib/api-response';

export const GET = withAuth(async () => {
    const settingsList = await db.select().from(settings).all();
    const settingsMap: Record<string, string | null> = {};
    settingsList.forEach(s => settingsMap[s.key] = s.value);
    return successResponse(settingsMap);
});

export const PUT = withAuth(async (request: NextRequest) => {
    const body = await request.json();

    // Use transaction for batch updates
    db.transaction((tx) => {
        for (const [key, value] of Object.entries(body)) {
            tx.insert(settings)
                .values({ key, value: String(value) })
                .onConflictDoUpdate({ target: settings.key, set: { value: String(value) } })
                .run();
        }
    });

    return successResponse(null);
});
