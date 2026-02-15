import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { get, run } from '@/lib/db';
import type { Inbound } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const admin = await getSession();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const inboundId = parseInt(id, 10);

    if (isNaN(inboundId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid inbound ID' },
        { status: 400 }
      );
    }

    const inbound = get<Inbound>(
      'SELECT * FROM inbound WHERE id = ?',
      [inboundId]
    );

    if (!inbound) {
      return NextResponse.json(
        { success: false, error: 'Inbound not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: inbound,
    });
  } catch (error) {
    console.error('Get inbound error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const admin = await getSession();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const inboundId = parseInt(id, 10);

    if (isNaN(inboundId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid inbound ID' },
        { status: 400 }
      );
    }

    // Check if inbound exists
    const existing = get<Inbound>(
      'SELECT * FROM inbound WHERE id = ?',
      [inboundId]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Inbound not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { tag, protocol, port, config, enabled } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];

    if (tag !== undefined) {
      // Check for tag conflict (excluding current inbound)
      const tagConflict = get<{ id: number }>(
        'SELECT id FROM inbound WHERE tag = ? AND id != ?',
        [tag, inboundId]
      );
      if (tagConflict) {
        return NextResponse.json(
          { success: false, error: 'Tag is already in use by another inbound' },
          { status: 400 }
        );
      }
      updates.push('tag = ?');
      values.push(tag);
    }

    if (protocol !== undefined) {
      updates.push('protocol = ?');
      values.push(protocol);
    }

    if (port !== undefined) {
      const portNum = parseInt(port, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return NextResponse.json(
          { success: false, error: 'Port must be a number between 1 and 65535' },
          { status: 400 }
        );
      }

      // Check for port conflict (excluding current inbound)
      const portConflict = get<{ id: number }>(
        'SELECT id FROM inbound WHERE port = ? AND id != ?',
        [portNum, inboundId]
      );
      if (portConflict) {
        return NextResponse.json(
          { success: false, error: 'Port is already in use by another inbound' },
          { status: 400 }
        );
      }
      updates.push('port = ?');
      values.push(portNum);
    }

    if (config !== undefined) {
      // Validate config is valid JSON
      let configStr: string;
      if (typeof config === 'string') {
        try {
          JSON.parse(config);
          configStr = config;
        } catch {
          return NextResponse.json(
            { success: false, error: 'Config must be valid JSON' },
            { status: 400 }
          );
        }
      } else {
        configStr = JSON.stringify(config);
      }
      updates.push('config = ?');
      values.push(configStr);
    }

    if (enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(enabled ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push('updated_at = datetime("now")');
    values.push(inboundId);

    run(
      `UPDATE inbound SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update inbound error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const admin = await getSession();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const inboundId = parseInt(id, 10);

    if (isNaN(inboundId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid inbound ID' },
        { status: 400 }
      );
    }

    // Check if inbound exists
    const existing = get<Inbound>(
      'SELECT id FROM inbound WHERE id = ?',
      [inboundId]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Inbound not found' },
        { status: 404 }
      );
    }

    run('DELETE FROM inbound WHERE id = ?', [inboundId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete inbound error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
