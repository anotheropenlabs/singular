import { NextRequest, NextResponse } from 'next/server';
import { db, nodeUser, settings } from '@/lib/db';
import { rawConfig } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { Inbound } from '@/types';
import { generateUri, generateSingboxConfig } from '@/lib/protocols/uri';
import { getSystemMode } from '@/lib/settings';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';

  // Resolve host from settings: subscription_host > server_host > request host
  const subscriptionHostSetting = await db.select().from(settings).where(eq(settings.key, 'app_subscription_host')).get();
  const serverHostSetting = await db.select().from(settings).where(eq(settings.key, 'app_server_host')).get();
  const requestHost = request.headers.get('host')?.split(':')[0] || 'example.com';
  const host = subscriptionHostSetting?.value || serverHostSetting?.value || requestHost;

  // Find user by UUID
  const user = await db.select().from(nodeUser).where(and(eq(nodeUser.uuid, userId), eq(nodeUser.enabled, true))).get();

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check if expired
  if (user.expire_at && new Date(user.expire_at * 1000) < new Date()) {
    // user.expire_at is number (unix timestamp in seconds) from Drizzle schema, 
    // but Typescript might think it's date if I didn't update types fully? 
    // Schema says integer. `nodeUser.expire_at` is number | null.
    // Date constructor takes ms. So * 1000.
    return NextResponse.json({ error: 'User expired' }, { status: 403 });
  }

  // Check traffic limit
  if (user.traffic_limit > 0 && user.traffic_used >= user.traffic_limit) {
    return NextResponse.json({ error: 'Traffic limit exceeded' }, { status: 403 });
  }

  // Get allowed inbounds (mocked from raw_config)
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

  // Generate config based on format
  if (format === 'base64') {
    const uris = inboundsList.map(inbound => generateUri(inbound, user, host));
    const base64 = Buffer.from(uris.join('\n')).toString('base64');
    return new NextResponse(base64, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${user.username}.txt"`,
      },
    });
  }

  // JSON format (sing-box native)
  const config = generateSingboxConfig(inboundsList, user, host);
  return NextResponse.json(config);
}
