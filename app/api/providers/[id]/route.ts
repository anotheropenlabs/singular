import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { provider, proxyNode } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSystemMode } from '@/lib/settings';
import { withAuth, successResponse, errorResponse } from '@/lib/api-response';

// GET /api/providers/[id] — Get provider with its nodes
export const GET = withAuth(async (
    request: NextRequest,
    session: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params;
    const providerId = parseInt(id, 10);

    const mode = await getSystemMode();
    const providerData = await db.select().from(provider)
        .where(and(eq(provider.id, providerId), eq(provider.side, mode)))
        .get();

    if (!providerData) {
        return errorResponse('Provider not found', 404);
    }

    const nodes = await db.select().from(proxyNode)
        .where(and(eq(proxyNode.provider_id, providerId), eq(proxyNode.side, mode)))
        .all();

    return successResponse({ ...providerData, nodes });
});

// PUT /api/providers/[id] — Update provider settings
export const PUT = withAuth(async (
    request: NextRequest,
    session: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params;
    const providerId = parseInt(id, 10);
    const body = await request.json();
    const { name, url, user_agent, update_interval, enabled } = body;

    const mode = await getSystemMode();
    const existing = await db.select().from(provider)
        .where(and(eq(provider.id, providerId), eq(provider.side, mode)))
        .get();

    if (!existing) {
        return errorResponse('Provider not found', 404);
    }

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (url !== undefined) updates.url = url;
    if (user_agent !== undefined) updates.user_agent = user_agent;
    if (update_interval !== undefined) updates.update_interval = update_interval;
    if (enabled !== undefined) updates.enabled = enabled;

    await db.update(provider)
        .set(updates)
        .where(and(eq(provider.id, providerId), eq(provider.side, mode)))
        .run();

    const updated = await db.select().from(provider)
        .where(and(eq(provider.id, providerId), eq(provider.side, mode)))
        .get();

    return successResponse(updated);
});

// DELETE /api/providers/[id] — Delete provider (cascade deletes nodes)
export const DELETE = withAuth(async (
    request: NextRequest,
    session: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params;
    const providerId = parseInt(id, 10);

    const mode = await getSystemMode();
    const existing = await db.select().from(provider)
        .where(and(eq(provider.id, providerId), eq(provider.side, mode)))
        .get();

    if (!existing) {
        return errorResponse('Provider not found', 404);
    }

    // Nodes are cascade-deleted via FK, but just to be safe if manual delete
    await db.delete(proxyNode).where(and(eq(proxyNode.provider_id, providerId), eq(proxyNode.side, mode))).run();
    await db.delete(provider).where(and(eq(provider.id, providerId), eq(provider.side, mode))).run();

    return successResponse(null);
});
