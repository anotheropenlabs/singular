import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { proxyGroup } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { regenerateConfigAndReload } from '@/lib/config/config-hotreload';
import { getSystemMode } from '@/lib/settings';
import { withAuth, successResponse, errorResponse } from '@/lib/api-response';

// GET /api/groups/[id] — Get single group
export const GET = withAuth(async (
    request: NextRequest,
    session: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params;
    const groupId = parseInt(id, 10);
    const mode = await getSystemMode();
    const group = await db.select().from(proxyGroup).where(and(eq(proxyGroup.id, groupId), eq(proxyGroup.side, mode))).get();

    if (!group) {
        return errorResponse('Group not found', 404);
    }

    return successResponse(group);
});

// PUT /api/groups/[id] — Update group
export const PUT = withAuth(async (
    request: NextRequest,
    session: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params;
    const groupId = parseInt(id, 10);
    const body = await request.json();
    const { name, type, node_filter, config, sort_order } = body;
    const autoReload = request.nextUrl.searchParams.get('autoReload') === 'true';
    const mode = await getSystemMode();

    const existing = await db.select({ id: proxyGroup.id }).from(proxyGroup).where(and(eq(proxyGroup.id, groupId), eq(proxyGroup.side, mode))).get();
    if (!existing) {
        return errorResponse('Group not found', 404);
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (node_filter !== undefined) updates.node_filter = node_filter;
    if (config !== undefined) updates.config = typeof config === 'string' ? config : JSON.stringify(config);
    if (sort_order !== undefined) updates.sort_order = sort_order;

    await db.update(proxyGroup).set(updates).where(and(eq(proxyGroup.id, groupId), eq(proxyGroup.side, mode))).run();
    const updated = await db.select().from(proxyGroup).where(and(eq(proxyGroup.id, groupId), eq(proxyGroup.side, mode))).get();

    // Auto reload config if requested
    if (autoReload) {
        const reloadResult = await regenerateConfigAndReload();
        if (!reloadResult.success) {
            console.warn('[Groups API] Auto reload failed:', reloadResult.error);
        }
    }

    return successResponse(updated);
});

// DELETE /api/groups/[id] — Delete group
export const DELETE = withAuth(async (
    request: NextRequest,
    session: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params;
    const groupId = parseInt(id, 10);
    const autoReload = request.nextUrl.searchParams.get('autoReload') === 'true';

    const mode = await getSystemMode();

    const existing = await db.select({ id: proxyGroup.id }).from(proxyGroup).where(and(eq(proxyGroup.id, groupId), eq(proxyGroup.side, mode))).get();
    if (!existing) {
        return errorResponse('Group not found', 404);
    }

    await db.delete(proxyGroup).where(and(eq(proxyGroup.id, groupId), eq(proxyGroup.side, mode))).run();

    // Auto reload config if requested
    if (autoReload) {
        const reloadResult = await regenerateConfigAndReload();
        if (!reloadResult.success) {
            console.warn('[Groups API] Auto reload failed:', reloadResult.error);
        }
    }

    return successResponse(null);
});
