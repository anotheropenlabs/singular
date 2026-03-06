import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { getConnections, closeAllConnections } from '@/lib/daemon/clash-api';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const summary = searchParams.get('summary') === 'true';

    // @ts-ignore
    return withAuth(request as any, async () => {
        const data = await getConnections();

        if (summary) {
            return NextResponse.json({
                success: true,
                data: {
                    downloadTotal: data?.downloadTotal ?? 0,
                    uploadTotal: data?.uploadTotal ?? 0,
                }
            });
        }

        return NextResponse.json({ success: true, data: data ?? { downloadTotal: 0, uploadTotal: 0, connections: [] } });
    });
}

export async function DELETE(request: Request) {
    // @ts-ignore
    return withAuth(request as any, async () => {
        const success = await closeAllConnections();
        if (!success) {
            return NextResponse.json({ success: false, error: 'Failed to close connections' }, { status: 500 });
        }
        return NextResponse.json({ success: true, data: { status: 'closed' } });
    });
}
