import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, nodeUser } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(id);
  const user = await db.select({ id: nodeUser.id }).from(nodeUser).where(eq(nodeUser.id, userId)).get();

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }

  await db.update(nodeUser).set({ traffic_used: 0 }).where(eq(nodeUser.id, userId));

  return NextResponse.json({ success: true });
}
