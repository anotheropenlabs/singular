
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { desc, sql, gte, sum, eq, and } from 'drizzle-orm';
import { getSystemMode } from '@/lib/settings';
import { db, nodeUser } from '@/lib/db';

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const mode = await getSystemMode();
        // Top 5 Users by total traffic
        const topUsers = await db.select({
            username: nodeUser.username,
            upload: nodeUser.up,
            download: nodeUser.down,
            total: sql<number>`${nodeUser.up} + ${nodeUser.down}`
        })
            .from(nodeUser)
            .where(eq(nodeUser.side, mode))
            .orderBy(desc(sql`${nodeUser.up} + ${nodeUser.down}`))
            .limit(5);

        return NextResponse.json({
            success: true,
            data: {
                users: topUsers,
            }
        });
    } catch (error) {
        console.error('Analytics top error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
