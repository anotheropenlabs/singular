import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { proxyGroup } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, group_ids } = body;

        if (!Array.isArray(group_ids) || group_ids.length === 0) {
            return NextResponse.json({ error: 'Invalid group_ids' }, { status: 400 });
        }

        if (action === 'delete') {
            const result = await db.delete(proxyGroup).where(inArray(proxyGroup.id, group_ids));
            return NextResponse.json({ success: true, count: result.changes });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Batch groups error:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}
