
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, ipBlacklist } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { logAction } from '@/lib/audit';
import { getClientIP } from '@/lib/security';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const admin = await getSession();

    if (!admin) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const { id } = await params;
        const recordId = parseInt(id, 10);

        if (isNaN(recordId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid ID' },
                { status: 400 }
            );
        }

        const existing = await db.select().from(ipBlacklist).where(eq(ipBlacklist.id, recordId)).get();

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Record not found' },
                { status: 404 }
            );
        }

        await db.delete(ipBlacklist).where(eq(ipBlacklist.id, recordId));

        // Log Audit
        const clientIp = await getClientIP();
        await logAction('UNBLOCK_IP', existing.ip, { id: recordId }, clientIp);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete blacklist error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
