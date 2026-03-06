import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { getConfig, updateConfig } from '@/lib/daemon/clash-api';

export async function GET(request: Request) {
    // @ts-ignore
    return withAuth(request as any, async () => {
        try {
            const config = await getConfig();
            return NextResponse.json({ success: true, data: config });
        } catch (error: any) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
    });
}

export async function PATCH(request: Request) {
    // @ts-ignore
    return withAuth(request as any, async () => {
        try {
            const body = await request.json();
            await updateConfig(body);
            return NextResponse.json({ success: true });
        } catch (error: any) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
    });
}
