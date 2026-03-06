import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { certificates } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { logAction } from '@/lib/audit';
import { getSystemMode } from '@/lib/settings';
import { getClientIP } from '@/lib/security';
import fs from 'fs/promises';
import { withAuth, successResponse, errorResponse } from '@/lib/api-response';

export const GET = withAuth(async () => {
    const certs = await db.select().from(certificates).orderBy(desc(certificates.created_at)).all();

    return successResponse(certs);
});

export const POST = withAuth(async (request: NextRequest) => {
    const body = await request.json();
    const { name, domain, cert_path, key_path } = body;

    if (!name || !domain || !cert_path || !key_path) {
        return errorResponse('Missing required fields', 400);
    }

    // Verify files exist
    try {
        await fs.access(cert_path);
        await fs.access(key_path);
    } catch {
        return errorResponse('Certificate or key file not found on server', 400);
    }

    // Check for unique name manually to avoid 500 error propagation
    const existing = await db.select().from(certificates).where(eq(certificates.name, name)).get();
    if (existing) {
        return errorResponse('Certificate name already exists', 400);
    }

    const result = await db.insert(certificates).values({
        name,
        type: 'manual', // Default to manual for file paths
        domain,
        cert_path,
        key_path,
        expires_at: 0, // Unknown expiration for manual paths
        auto_renew: false
    }).returning({ id: certificates.id }).get();

    // Log Audit
    const ip = await getClientIP();
    await logAction('CREATE_CERTIFICATE', name, { id: result?.id }, ip);

    return successResponse({ id: result?.id });
});
