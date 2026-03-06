import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { proxyGroup } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { regenerateConfigAndReload } from '@/lib/config/config-hotreload';
import { withAuth, successResponse, errorResponse } from '@/lib/api-response';

// PATCH /api/groups/reorder — Batch update group sort order
export const PATCH = withAuth(async (request: NextRequest) => {
    const body = await request.json();
    const { orders } = body; // Array of { id, sort_order } objects

    if (!Array.isArray(orders) || orders.length === 0) {
        return errorResponse('orders array is required', 400);
    }

    const autoReload = request.nextUrl.searchParams.get('autoReload') === 'true';

    // Update each group's sort_order atomically in a single transaction
    await db.transaction(async (tx) => {
        for (const item of orders) {
            const { id, sort_order } = item;
            if (typeof id !== 'number' || typeof sort_order !== 'number') continue;

            await tx.update(proxyGroup)
                .set({ sort_order })
                .where(eq(proxyGroup.id, id))
                .run();
        }
    });

    // Auto reload config if requested
    if (autoReload) {
        const reloadResult = await regenerateConfigAndReload();
        if (!reloadResult.success) {
            console.warn('[Groups Reorder API] Auto reload failed:', reloadResult.error);
        }
    }

    return successResponse(null);
});
