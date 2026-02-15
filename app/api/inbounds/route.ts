import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { get, all, run } from '@/lib/db';
import type { Inbound } from '@/types';

export async function GET() {
  const admin = await getSession();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const inbounds = all<Inbound>('SELECT * FROM inbound ORDER BY created_at DESC');

    return NextResponse.json({
      success: true,
      data: inbounds,
    });
  } catch (error) {
    console.error('Get inbounds error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = await getSession();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { tag, protocol, port, config } = body;

    // Validate required fields
    if (!tag || !protocol || !port || !config) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: tag, protocol, port, config' },
        { status: 400 }
      );
    }

    // Validate port is a number and in valid range
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return NextResponse.json(
        { success: false, error: 'Port must be a number between 1 and 65535' },
        { status: 400 }
      );
    }

    // Check for port conflict
    const existingPort = get<{ id: number }>(
      'SELECT id FROM inbound WHERE port = ?',
      [portNum]
    );
    if (existingPort) {
      return NextResponse.json(
        { success: false, error: 'Port is already in use by another inbound' },
        { status: 400 }
      );
    }

    // Check for tag conflict
    const existingTag = get<{ id: number }>(
      'SELECT id FROM inbound WHERE tag = ?',
      [tag]
    );
    if (existingTag) {
      return NextResponse.json(
        { success: false, error: 'Tag is already in use by another inbound' },
        { status: 400 }
      );
    }

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

    // Insert the inbound
    const result = run(
      `INSERT INTO inbound (tag, protocol, port, config, enabled)
       VALUES (?, ?, ?, ?, 1)`,
      [tag, protocol, portNum, configStr]
    );

    return NextResponse.json({
      success: true,
      data: { id: result.lastInsertRowid },
    });
  } catch (error) {
    console.error('Create inbound error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
