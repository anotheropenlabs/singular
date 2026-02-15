import { NextRequest, NextResponse } from 'next/server';
import { get, all } from '@/lib/db';
import type { NodeUser, Inbound } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';

  // Find user by UUID
  const user = get<NodeUser>('SELECT * FROM node_user WHERE uuid = ? AND enabled = 1', [userId]);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check if expired
  if (user.expire_at && new Date(user.expire_at) < new Date()) {
    return NextResponse.json({ error: 'User expired' }, { status: 403 });
  }

  // Check traffic limit
  if (user.traffic_limit > 0 && user.traffic_used >= user.traffic_limit) {
    return NextResponse.json({ error: 'Traffic limit exceeded' }, { status: 403 });
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

  // Generate config based on format
  if (format === 'base64') {
    const uris = inbounds.map(inbound => generateUri(inbound, user));
    const base64 = Buffer.from(uris.join('\n')).toString('base64');
    return new NextResponse(base64, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${user.username}.txt"`,
      },
    });
  }

  // JSON format (sing-box native)
  const config = generateSingboxConfig(inbounds, user);
  return NextResponse.json(config);
}

function generateUri(inbound: Inbound, user: NodeUser): string {
  // TODO: Implement proper URI generation for each protocol
  // This is a placeholder implementation
  return `${inbound.protocol}://${user.uuid}@example.com:${inbound.port}#${inbound.tag}`;
}

function generateSingboxConfig(inbounds: Inbound[], user: NodeUser): object {
  // TODO: Implement proper sing-box config generation
  // This is a placeholder
  return {
    log: { level: 'info' },
    inbounds: inbounds.map(inbound => {
      const config = JSON.parse(inbound.config);
      return {
        ...config,
        users: [{ uuid: user.uuid }],
      };
    }),
    outbounds: [{ type: 'direct', tag: 'direct' }],
  };
}
