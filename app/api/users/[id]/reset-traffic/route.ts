import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { get, run } from '@/lib/db';
import type { NodeUser } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const user = get<NodeUser>('SELECT id FROM node_user WHERE id = ?', [id]);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }

  run('UPDATE node_user SET traffic_used = 0 WHERE id = ?', [id]);

  return NextResponse.json({ success: true });
}
