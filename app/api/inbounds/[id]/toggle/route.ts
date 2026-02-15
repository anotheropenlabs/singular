import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { get, run } from '@/lib/db';
import type { Inbound } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
      'SELECT id, enabled FROM inbound WHERE id = ?',
      [inboundId]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Inbound not found' },
        { status: 404 }
      );
    }

    // Toggle the enabled status
    const newEnabled = existing.enabled ? 0 : 1;

    run(
      'UPDATE inbound SET enabled = ?, updated_at = datetime("now") WHERE id = ?',
      [newEnabled, inboundId]
    );

    return NextResponse.json({
      success: true,
      data: { enabled: newEnabled === 1 },
    });
  } catch (error) {
    console.error('Toggle inbound error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
