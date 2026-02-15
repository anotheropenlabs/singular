import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { get, run } from '@/lib/db';
import type { NodeUser } from '@/types';

// GET /api/users/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const user = get<NodeUser>('SELECT * FROM node_user WHERE id = ?', [id]);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: user });
}

// PUT /api/users/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { username, password, traffic_limit, expire_at, enabled, allowed_inbounds } = body;

  const existing = get<NodeUser>('SELECT id FROM node_user WHERE id = ?', [id]);
  if (!existing) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }

  // Check username conflict
  if (username) {
    const conflict = get<NodeUser>(
      'SELECT id FROM node_user WHERE username = ? AND id != ?',
      [username, id]
    );
    if (conflict) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 400 }
      );
    }
  }

  run(
    `UPDATE node_user SET
      username = COALESCE(?, username),
      password = COALESCE(?, password),
      traffic_limit = COALESCE(?, traffic_limit),
      expire_at = COALESCE(?, expire_at),
      enabled = COALESCE(?, enabled),
      allowed_inbounds = COALESCE(?, allowed_inbounds)
    WHERE id = ?`,
    [
      username,
      password,
      traffic_limit,
      expire_at,
      enabled,
      allowed_inbounds ? JSON.stringify(allowed_inbounds) : null,
      id,
    ]
  );

  return NextResponse.json({ success: true });
}

// DELETE /api/users/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  run('DELETE FROM node_user WHERE id = ?', [id]);

  return NextResponse.json({ success: true });
}
