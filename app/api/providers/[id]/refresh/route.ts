import { NextResponse, NextRequest } from 'next/server';
import { db, provider } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { refreshProvider } from '@/lib/jobs/provider-refresh';

// POST /api/providers/[id]/refresh — Re-fetch and re-parse subscription (incremental update)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const providerId = parseInt(id, 10);

        // Check if provider exists
        const providerData = await db.select()
            .from(provider)
            .where(eq(provider.id, providerId))
            .get();

        if (!providerData) {
            return NextResponse.json(
                { success: false, error: 'Provider not found' },
                { status: 404 }
            );
        }

        // Perform refresh with incremental update
        const result = await refreshProvider(providerId);

        if (result.success) {
            return NextResponse.json({
                success: true,
                data: {
                    node_count: result.nodeCount,
                    added: result.added || 0,
                    updated: result.updated || 0,
                    deleted: result.deleted || 0,
                    updated_at: Math.floor(Date.now() / 1000),
                },
            });
        }

        return NextResponse.json(
            { success: false, error: result.error || 'Refresh failed' },
            { status: 400 }
        );
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
