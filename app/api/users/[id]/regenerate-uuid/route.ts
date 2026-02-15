import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { get, run } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
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

  const newUuid = uuidv4();
  run('UPDATE node_user SET uuid = ? WHERE id = ?', [newUuid, id]);

  return NextResponse.json({ success: true, data: { uuid: newUuid } });
}
