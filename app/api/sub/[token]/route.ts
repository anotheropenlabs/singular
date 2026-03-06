import { NextRequest, NextResponse } from 'next/server';
import { db, nodeUser, settings } from '@/lib/db';
import { rawConfig } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { generateSubscriptionContent } from '@/lib/links';
import { getSystemMode } from '@/lib/settings';
import type { Inbound } from '@/types';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params;

    // 1. Validate Token (Find User by UUID as token for now, or specific sub token)
    // Using user.uuid as the subscription token simplest for now
    const user = await db.select().from(nodeUser).where(and(eq(nodeUser.uuid, token), eq(nodeUser.enabled, true))).get();

    if (!user) {
        return new NextResponse('Invalid Token', { status: 401 });
    }

    // 2. Get User's Inbounds
    const mode = await getSystemMode();
    const rawRecord = await db.select().from(rawConfig).where(and(eq(rawConfig.side, mode), eq(rawConfig.type, 'inbounds'))).get();
    let allInbounds: any[] = [];
    if (rawRecord && rawRecord.content) {
        try {
            const parsed = JSON.parse(rawRecord.content);
            allInbounds = (parsed && typeof parsed === 'object' && 'inbounds' in parsed) ? parsed.inbounds : parsed;
            if (!Array.isArray(allInbounds)) allInbounds = [];
        } catch (e) { }
    }

    let inboundsList: Inbound[] = allInbounds.map((inc, index) => ({
        id: index,
        side: mode,
        tag: inc.tag || `inbound-${index}`,
        protocol: inc.type || 'mixed',
        port: inc.listen_port || 0,
        config: JSON.stringify(inc),
        enabled: true,
        created_at: 0,
        updated_at: 0
    }));

    const allowedIds = user.allowed_inbounds ? JSON.parse(user.allowed_inbounds) : null;
    // Note: since numeric IDs are gone, if filtering by ID is still required we'll skip it for now
    // Future implementation: filter by inbound.tag


    // 3. Get Server Host
    const serverHostSetting = await db.select().from(settings).where(eq(settings.key, 'app_server_host')).get();
    const serverHost = serverHostSetting?.value || request.headers.get('host')?.split(':')[0] || 'localhost';

    // 4. Generate Content
    const content = generateSubscriptionContent(inboundsList, user, serverHost);

    return new NextResponse(content, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Profile-Update-Interval': '24',
            'Subscription-Userinfo': `upload=${user.up}; download=${user.down}; total=${user.traffic_limit}; expire=${user.expire_at ? new Date(user.expire_at).getTime() / 1000 : 0}`,
        }
    });
}
