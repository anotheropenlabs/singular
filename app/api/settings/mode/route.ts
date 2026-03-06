import { NextRequest } from 'next/server';
import { db, settings } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { SystemMode } from '@/types';
import { withAuth, successResponse, errorResponse } from '@/lib/api-response';

const SETTING_KEY = 'system_mode';
const VALID_MODES: SystemMode[] = ['server', 'client'];

export const GET = withAuth(async () => {
    const row = await db.select().from(settings).where(eq(settings.key, SETTING_KEY)).get();
    const mode: SystemMode = (row?.value as SystemMode) || 'server';

    return successResponse({ mode });
});

export const PUT = withAuth(async (request: NextRequest) => {
    const body = await request.json();
    const { mode } = body;

    if (!mode || !VALID_MODES.includes(mode)) {
        return errorResponse(`Invalid mode. Must be one of: ${VALID_MODES.join(', ')}`, 400);
    }

    // Upsert the setting
    const existing = await db.select().from(settings).where(eq(settings.key, SETTING_KEY)).get();
    if (existing) {
        await db.update(settings).set({ value: mode }).where(eq(settings.key, SETTING_KEY)).run();
    } else {
        await db.insert(settings).values({ key: SETTING_KEY, value: mode }).run();
    }



    return successResponse({ mode });
});
