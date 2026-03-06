import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { certificates } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { logAction } from '@/lib/audit';
import { getClientIP } from '@/lib/security';
import { getSystemMode } from '@/lib/settings';
import { withAuth, successResponse, errorResponse } from '@/lib/api-response';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export const DELETE = withAuth(async (request: NextRequest, session: any, { params }: RouteParams) => {
    const { id } = await params;
    const certId = parseInt(id, 10);

    if (isNaN(certId)) {
        return errorResponse('Invalid certificate ID', 400);
    }

    const existing = await db.select().from(certificates).where(eq(certificates.id, certId)).get();

    if (!existing) {
        return errorResponse('Certificate not found', 404);
    }

    // 检查是否有节点在使用此证书
    // Inbounds logic moved to raw config parsing; simplified check for now

    await db.delete(certificates).where(eq(certificates.id, certId)).run();

    // Log Audit
    const clientIp = await getClientIP();
    await logAction('DELETE_CERTIFICATE', existing.name, { id: certId }, clientIp);

    return successResponse(null);
});
