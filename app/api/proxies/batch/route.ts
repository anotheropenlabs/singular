import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { proxyNode } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import { getSystemMode } from '@/lib/settings';
import { withAuth, successResponse, errorResponse } from '@/lib/api-response';

export const POST = withAuth(async (request: NextRequest) => {
    const body = await request.json();
    const { action, node_ids, payload } = body;

    if (!Array.isArray(node_ids) || node_ids.length === 0) {
        return errorResponse('Valid node_ids array is required', 400);
    }

    const mode = await getSystemMode();

    if (action === 'delete') {
        const result = await db.delete(proxyNode)
            .where(inArray(proxyNode.id, node_ids))
            .returning();
        return successResponse(result, { count: result.length, action: 'deleted' });
    }

    if (action === 'toggle') {
        if (typeof payload?.enabled !== 'boolean') {
            return errorResponse('payload.enabled boolean is required for toggle action', 400);
        }

        // Drizzle SQLite update doesn't return the updated rows easily in batch with returning() on some drivers, but we can do a standard update 
        const result = await db.update(proxyNode)
            .set({ enabled: payload.enabled })
            .where(inArray(proxyNode.id, node_ids))
            .returning();

        return successResponse(result, { count: result.length, action: 'toggled' });
    }

    return errorResponse('Invalid action', 400);
});
