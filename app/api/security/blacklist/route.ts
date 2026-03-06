
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, ipBlacklist } from '@/lib/db';
import { desc } from 'drizzle-orm';
import { logAction } from '@/lib/audit';
import { getClientIP } from '@/lib/security';

export async function GET() {
    const admin = await getSession();

    if (!admin) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const list = await db.select().from(ipBlacklist).orderBy(desc(ipBlacklist.created_at));

        return NextResponse.json({
            success: true,
            data: list,
        });
    } catch (error) {
        console.error('Get blacklist error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const admin = await getSession();

    if (!admin) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const { ip, reason } = body;

        if (!ip) {
            return NextResponse.json(
                { success: false, error: 'IP address is required' },
                { status: 400 }
            );
        }

        // Basic IP validation (simple regex or library)
        // For now simple check
        if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip) && !ip.includes(':')) {
            return NextResponse.json(
                { success: false, error: 'Invalid IP address format' },
                { status: 400 }
            );
        }

        try {
            const result = await db.insert(ipBlacklist).values({
                ip,
                reason
            }).returning();

            // Log Audit
            const clientIp = await getClientIP();
            await logAction('BLOCK_IP', ip, { reason, id: result[0].id }, clientIp);

            return NextResponse.json({
                success: true,
                data: result[0],
            });
        } catch (e: any) {
            if (e.message.includes('UNIQUE constraint failed')) {
                return NextResponse.json(
                    { success: false, error: 'IP is already blacklisted' },
                    { status: 409 }
                );
            }
            throw e;
        }

    } catch (error) {
        console.error('Add blacklist error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
