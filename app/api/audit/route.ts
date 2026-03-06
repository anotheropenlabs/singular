
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, auditLogs } from '@/lib/db';
import { desc, like, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    const admin = await getSession();

    if (!admin) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';

        const offset = (page - 1) * limit;

        let logs;

        if (search) {
            logs = await db.select().from(auditLogs)
                .where(
                    or(
                        like(auditLogs.action, `%${search}%`),
                        like(auditLogs.target, `%${search}%`),
                        like(auditLogs.ip, `%${search}%`)
                    )
                )
                .orderBy(desc(auditLogs.created_at))
                .limit(limit)
                .offset(offset);
        } else {
            logs = await db.select().from(auditLogs)
                .orderBy(desc(auditLogs.created_at))
                .limit(limit)
                .offset(offset);
        }

        return NextResponse.json({
            success: true,
            data: logs,
            meta: {
                page,
                limit
            }
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
