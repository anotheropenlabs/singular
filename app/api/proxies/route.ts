import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { proxyNode, provider } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { parseSubscription, ParsedNode } from '@/lib/providers/parser';
import { getSystemMode } from '@/lib/settings';
import { withAuth, successResponse, errorResponse } from '@/lib/api-response';

// GET /api/proxies — List all proxies with their provider info
export const GET = withAuth(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('provider_id');
    const type = searchParams.get('type');

    const mode = await getSystemMode();

    // Get all nodes with provider name in one query
    const nodes = await db.select({
        id: proxyNode.id,
        name: proxyNode.name,
        type: proxyNode.type,
        server: proxyNode.server,
        port: proxyNode.port,
        config: proxyNode.config,
        enabled: proxyNode.enabled,
        latency: proxyNode.latency,
        provider_id: proxyNode.provider_id,
        provider_name: provider.name,
        side: proxyNode.side,
        created_at: proxyNode.created_at,
    })
        .from(proxyNode)
        .leftJoin(provider, eq(proxyNode.provider_id, provider.id))
        .where(eq(proxyNode.side, mode))
        .orderBy(desc(proxyNode.created_at))
        .all();

    // Apply filters after query (simple approach for now)
    let filteredNodes = nodes;
    if (providerId) {
        filteredNodes = filteredNodes.filter(n => n.provider_id === parseInt(providerId));
    }
    if (type) {
        filteredNodes = filteredNodes.filter(n => n.type === type);
    }

    return successResponse(filteredNodes);
});

// POST /api/proxies — Add proxy nodes (from subscription URI or manually)
export const POST = withAuth(async (request: NextRequest) => {
    const body = await request.json();
    const { url, subscription, name, type, server, port, config, provider_id } = body;

    let nodesToAdd: ParsedNode[] = [];

    if (url || subscription) {
        // Parse from subscription
        // If input is a protocol URI (vless://, vmess://, etc.), pass directly to parser.
        // If it's an HTTP(S) subscription URL, wrap as Base64URL for remote fetching.
        let content: string;
        if (url) {
            const isProtocolUri = /^(vless|vmess|trojan|ss|ssr|hysteria2?|tuic):\/\//i.test(url.trim());
            content = isProtocolUri ? url.trim() : `Base64URL=${encodeURIComponent(url)}`;
        } else {
            content = subscription;
        }
        nodesToAdd = parseSubscription(content);

        if (nodesToAdd.length === 0) {
            return errorResponse('No valid proxy nodes found in subscription', 400);
        }
    } else if (config) {
        // Manual node
        const parsedConfig = typeof config === 'string' ? JSON.parse(config) : config;
        nodesToAdd = [{
            name: name || 'Manual Node',
            type: type,
            server: server,
            port: parseInt(port, 10),
            config: parsedConfig,
        }];
    }

    // Insert nodes transactionally
    const mode = await getSystemMode();
    const results = db.transaction((tx) => {
        const _results = [];
        for (const node of nodesToAdd) {
            const result = tx.insert(proxyNode).values({
                side: mode,
                provider_id: provider_id || null,
                name: node.name,
                type: node.type,
                server: node.server,
                port: node.port,
                config: JSON.stringify(node.config),
                enabled: true,
            }).returning().get();
            _results.push(result);
        }
        return _results;
    });

    return successResponse(results, { count: results.length });
});
