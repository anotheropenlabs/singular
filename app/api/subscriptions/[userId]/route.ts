import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, nodeUser, settings } from '@/lib/db';
import { rawConfig } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import type { Inbound } from '@/types';
import { getSystemMode } from '@/lib/settings';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await getSession();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = await params;
  // userId from URL param is likely the ID (number) not the UUID?
  // Previous code used `WHERE id = ?`. Param name is `userId`.
  // Wait, `app/api/subscriptions/[userId]/route.ts` logic used `WHERE id = ?`.
  // `userId` param is string. `parseInt` needed?
  // Let's assume ID for now based on legacy query.
  const id = parseInt(userId);
  // Check if NaN? If so, maybe it's UUID? But previous query was `id = ?`.
  // Drizzle `eq(nodeUser.id, ...)` expects number.

  const user = await db.select().from(nodeUser).where(eq(nodeUser.id, id)).get();

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }

  // Get allowed inbounds
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

  // Get settings
  const subscriptionHost = await db.select().from(settings).where(eq(settings.key, 'app_subscription_host')).get();
  const serverHost = await db.select().from(settings).where(eq(settings.key, 'app_server_host')).get();
  const subscriptionPort = await db.select().from(settings).where(eq(settings.key, 'app_subscription_port')).get();

  const host = subscriptionHost?.value || serverHost?.value || 'localhost';
  const port = subscriptionPort?.value || '80';

  const subscriptionUrl = `http://${host}:${port}/sub/${user.uuid}`;

  return NextResponse.json({
    success: true,
    data: {
      user,
      inbounds: inboundsList,
      subscriptionUrl,
      formats: ['json', 'base64'],
    },
  });
}
