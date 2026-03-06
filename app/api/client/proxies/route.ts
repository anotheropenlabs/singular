
import { NextRequest, NextResponse } from 'next/server';
import { getProxies } from '@/lib/daemon/clash-api';
import { getSession } from '@/lib/auth';

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const proxies = await getProxies();
    return NextResponse.json({ success: true, data: proxies });
}
