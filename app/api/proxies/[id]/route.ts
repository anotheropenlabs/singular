import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { proxyNode } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSystemMode } from '@/lib/settings';
import { withAuth, successResponse, errorResponse } from '@/lib/api-response';

// GET /api/proxies/[id] — Get single proxy
export const GET = withAuth(async (
    request: NextRequest,
    session: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params;
    const nodeId = parseInt(id, 10);
    const mode = await getSystemMode();
    const node = await db.select().from(proxyNode).where(and(eq(proxyNode.id, nodeId), eq(proxyNode.side, mode))).get();

    if (!node) {
        return errorResponse('Proxy not found', 404);
    }

    return successResponse(node);
});

// PUT /api/proxies/[id] — Update proxy
export const PUT = withAuth(async (
    request: NextRequest,
    session: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params;
    const nodeId = parseInt(id, 10);
    const { searchParams } = new URL(request.url);
    const autoReload = searchParams.get('autoReload') === 'true';

    const body = await request.json();
    const { name, type, server, port, config, enabled } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (server !== undefined) updates.server = server;
    if (port !== undefined) updates.port = parseInt(port, 10);
    if (config !== undefined) updates.config = typeof config === 'string' ? config : JSON.stringify(config);
    if (enabled !== undefined) updates.enabled = enabled;

    const mode = await getSystemMode();
    await db.update(proxyNode).set(updates).where(and(eq(proxyNode.id, nodeId), eq(proxyNode.side, mode))).run();

    // Auto reload config if requested
    if (autoReload) {
        const { regenerateConfigAndReload } = await import('@/lib/config/config-hotreload');
        const reloadResult = await regenerateConfigAndReload();
        if (!reloadResult.success) {
            console.warn('[Proxies API] Auto reload failed:', reloadResult.error);
        }
    }

    const updated = await db.select().from(proxyNode).where(and(eq(proxyNode.id, nodeId), eq(proxyNode.side, mode))).get();
    return successResponse(updated);
});

// DELETE /api/proxies/[id] — Delete proxy
export const DELETE = withAuth(async (
    request: NextRequest,
    session: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params;
    const nodeId = parseInt(id, 10);
    const { searchParams } = new URL(request.url);
    const autoReload = searchParams.get('autoReload') === 'true';

    const mode = await getSystemMode();
    await db.delete(proxyNode).where(and(eq(proxyNode.id, nodeId), eq(proxyNode.side, mode))).run();

    // Auto reload config if requested
    if (autoReload) {
        const { regenerateConfigAndReload } = await import('@/lib/config/config-hotreload');
        const reloadResult = await regenerateConfigAndReload();
        if (!reloadResult.success) {
            console.warn('[Proxies API] Auto reload failed:', reloadResult.error);
        }
    }

    return successResponse(null);
});

// PATCH /api/proxies/[id]/enable — Toggle proxy enabled state
export const PATCH = withAuth(async (
    request: NextRequest,
    session: any,
    { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params;
    const nodeId = parseInt(id, 10);
    const { searchParams } = new URL(request.url);
    const autoReload = searchParams.get('autoReload') === 'true';

    const body = await request.json();
    const { enabled } = body;

    const mode = await getSystemMode();
    await db.update(proxyNode).set({ enabled: !!enabled }).where(and(eq(proxyNode.id, nodeId), eq(proxyNode.side, mode))).run();

    // Auto reload config if requested
    if (autoReload) {
        const { regenerateConfigAndReload } = await import('@/lib/config/config-hotreload');
        const reloadResult = await regenerateConfigAndReload();
        if (!reloadResult.success) {
            console.warn('[Proxies API] Auto reload failed:', reloadResult.error);
        }
    }

    return successResponse(null);
});
