import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { closeConnection } from '@/lib/daemon/clash-api';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    // @ts-ignore
    return withAuth(request as any, async () => {
        await closeConnection(params.id);
        return NextResponse.json({ success: true });
    });
}
