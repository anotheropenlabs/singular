import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { get, all, run } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import type { NodeUser } from '@/types';

// GET /api/users
export async function GET() {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const users = all<NodeUser>('SELECT * FROM node_user ORDER BY created_at DESC');
  return NextResponse.json({ success: true, data: users });
}

// POST /api/users
export async function POST(request: NextRequest) {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { username, password, traffic_limit, expire_at, allowed_inbounds } = body;

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    // Check if username exists
    const existing = get<NodeUser>('SELECT id FROM node_user WHERE username = ?', [username]);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 400 }
      );
    }

    const uuid = uuidv4();
    const result = run(
      `INSERT INTO node_user (username, uuid, password, traffic_limit, expire_at, allowed_inbounds)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        username,
        uuid,
        password || null,
        traffic_limit || 0,
        expire_at || null,
        allowed_inbounds ? JSON.stringify(allowed_inbounds) : null,
      ]
    );

    return NextResponse.json({
      success: true,
      data: { id: result.lastInsertRowid, uuid },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
