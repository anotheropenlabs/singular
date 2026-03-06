import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { proxyGroup } from '@/lib/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { regenerateConfigAndReload } from '@/lib/config/config-hotreload';
import { getSystemMode } from '@/lib/settings';
import { withAuth, successResponse, errorResponse } from '@/lib/api-response';

// GET /api/groups — List all proxy groups
export const GET = withAuth(async () => {
    const mode = await getSystemMode();
    const groups = await db.select().from(proxyGroup).where(eq(proxyGroup.side, mode)).orderBy(desc(proxyGroup.sort_order)).all();
    return successResponse(groups);
});

// POST /api/groups — Create a new proxy group
export const POST = withAuth(async (request: NextRequest) => {
    const body = await request.json();
    const { name, type, node_filter, config, sort_order } = body;
    const autoReload = request.nextUrl.searchParams.get('autoReload') === 'true';

    if (!name || !type) {
        return errorResponse('Name and type are required', 400);
    }

    const mode = await getSystemMode();

    const existing = await db.select({ id: proxyGroup.id })
        .from(proxyGroup)
        .where(and(eq(proxyGroup.name, name), eq(proxyGroup.side, mode)))
        .get();

    if (existing) {
        return errorResponse('Group name already exists', 409);
    }

    const result = await db.insert(proxyGroup).values({
        side: mode,
        name,
        type,
        node_filter: node_filter || null,
        config: config ? JSON.stringify(config) : null,
        sort_order: sort_order || 0,
    }).returning().get();

    // Auto reload config if requested
    if (autoReload) {
        const reloadResult = await regenerateConfigAndReload();
        if (!reloadResult.success) {
            console.warn('[Groups API] Auto reload failed:', reloadResult.error);
        }
    }

    return successResponse(result);
});
