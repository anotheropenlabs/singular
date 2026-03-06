import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { proxyNode, proxyGroup, rawConfig } from '@/lib/db/schema';
import { parseSubscription, detectFormat, type SubscriptionType } from '@/lib/providers/parser';
import { getSystemMode } from '@/lib/settings';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let rawContent: string;
        let subscriptionType: SubscriptionType = (body.type as SubscriptionType) || 'auto';

        if (typeof body.content === 'string') {
            rawContent = body.content;
        } else if (body.config && typeof body.config === 'object') {
            rawContent = JSON.stringify(body.config);
            subscriptionType = 'singbox';
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid body: expected { content: string } or legacy { config: object }' },
                { status: 400 }
            );
        }

        const mode = body.mode || 'append';
        const currentMode = await getSystemMode();
        const stats: Record<string, number> = {
            nodes: 0, groups: 0, rules: 0, dns: 0, dnsRules: 0,
            raw_blocks_saved: 0, raw_inbounds: 0, raw_route: 0, raw_dns: 0, raw_experimental: 0
        };

        const parsedNodes = parseSubscription(rawContent, subscriptionType);
        const detectedFormat = detectFormat(rawContent) || subscriptionType;

        const GROUP_TYPES = new Set(['selector', 'urltest', 'fallback']);
        const BASIC_TYPES = new Set(['direct', 'block', 'dns', 'any']);

        if (mode === 'overwrite') {
            // Remove existing manually-added (provider_id IS NULL) nodes/groups (Not implemented out of caution)
        }

        for (const node of parsedNodes) {
            const cfg = node.config || {};

            if (GROUP_TYPES.has(node.type)) {
                await db.insert(proxyGroup).values({
                    name: node.name,
                    side: currentMode,
                    type: node.type,
                    node_filter: null,
                    config: JSON.stringify(cfg),
                    sort_order: stats.groups,
                }).onConflictDoNothing();

                stats.groups++;
            } else {
                if (!BASIC_TYPES.has(node.type) && (!node.server || !node.port)) continue;

                await db.insert(proxyNode).values({
                    name: node.name,
                    side: currentMode,
                    type: node.type,
                    server: node.server || '',
                    port: Number(node.port) || 0,
                    config: JSON.stringify(cfg),
                    enabled: true,
                    provider_id: null,
                }).onConflictDoNothing();

                stats.nodes++;
            }
        }

        const isSingbox = detectedFormat === 'singbox' ||
            (rawContent.trimStart().startsWith('{') && (() => {
                try {
                    const parsed = JSON.parse(rawContent);
                    return !!parsed.outbounds || !!parsed.inbounds || !!parsed.route || !!parsed.dns;
                } catch { return false; }
            })());

        if (isSingbox) {
            let singboxConfig: any;
            try { singboxConfig = JSON.parse(rawContent); } catch { singboxConfig = {}; }

            const rawTypes = ['inbounds', 'route', 'dns', 'experimental'];

            for (const type of rawTypes) {
                if (singboxConfig[type]) {
                    const wrappedData = { [type]: singboxConfig[type] };
                    await db.insert(rawConfig).values({
                        side: currentMode,
                        type: type,
                        content: JSON.stringify(wrappedData, null, 2),
                    }).onConflictDoUpdate({
                        target: [rawConfig.side, rawConfig.type],
                        set: {
                            content: JSON.stringify(wrappedData, null, 2),
                            updated_at: Math.floor(Date.now() / 1000)
                        }
                    });
                    stats.raw_blocks_saved++;
                    stats[`raw_${type}`] = 1;
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                imported: stats,
                format: detectedFormat,
                message: `Imported: ${stats.nodes} nodes, ${stats.groups} groups, and saved ${stats.raw_blocks_saved} raw configuration blocks(dns / route / inbounds / experimental).`,
            },
        });
    } catch (error: any) {
        console.error('[Import] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
