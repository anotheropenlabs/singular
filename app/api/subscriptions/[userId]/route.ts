import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { get, all } from '@/lib/db';
import type { NodeUser, Inbound, Setting } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = await params;
  const user = get<NodeUser>('SELECT * FROM node_user WHERE id = ?', [userId]);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }

  // Get allowed inbounds
  const allowedIds = user.allowed_inbounds ? JSON.parse(user.allowed_inbounds) : null;
  let inbounds: Inbound[];

  if (allowedIds && allowedIds.length > 0) {
    const placeholders = allowedIds.map(() => '?').join(',');
    inbounds = all<Inbound>(
      `SELECT * FROM inbound WHERE enabled = 1 AND id IN (${placeholders})`,
      allowedIds
    );
  } else {
    inbounds = all<Inbound>('SELECT * FROM inbound WHERE enabled = 1');
  }

  // Get settings
  const subscriptionHost = get<Setting>(
    "SELECT value FROM settings WHERE key = 'subscription_host'"
  );
  const serverHost = get<Setting>(
    "SELECT value FROM settings WHERE key = 'server_host'"
  );
  const subscriptionPort = get<Setting>(
    "SELECT value FROM settings WHERE key = 'subscription_port'"
  );

  const host = subscriptionHost?.value || serverHost?.value || 'localhost';
  const port = subscriptionPort?.value || '80';

  const subscriptionUrl = `http://${host}:${port}/sub/${user.uuid}`;

  return NextResponse.json({
    success: true,
    data: {
      user,
      inbounds,
      subscriptionUrl,
      formats: ['json', 'base64'],
    },
  });
}
