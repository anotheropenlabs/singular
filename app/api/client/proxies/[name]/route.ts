
import { NextRequest, NextResponse } from 'next/server';
import { selectProxy } from '@/lib/daemon/clash-api';
import { getSession } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { name: string } }) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const selectorName = decodeURIComponent(params.name);
    try {
        const body = await request.json();
        const { proxy } = body;

        if (!proxy) {
            return NextResponse.json({ error: 'Proxy name required' }, { status: 400 });
        }

        const success = await selectProxy(selectorName, proxy);
        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, error: 'Failed to select proxy' }, { status: 500 });
        }
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
