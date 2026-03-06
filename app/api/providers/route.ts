import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { provider, proxyNode } from '@/lib/db/schema';
import { parseSubscription } from '@/lib/providers/parser';
import { getSystemMode } from '@/lib/settings';
import { eq } from 'drizzle-orm';
import { withAuth, successResponse, errorResponse } from '@/lib/api-response';

// GET /api/providers — List all providers
export const GET = withAuth(async () => {
    const mode = await getSystemMode();
    const providers = await db.select().from(provider).where(eq(provider.side, mode)).all();
    return successResponse(providers);
});

// POST /api/providers — Add new provider (fetch + parse + store nodes)
export const POST = withAuth(async (request: NextRequest) => {
    const body = await request.json();
    const { name, url, user_agent, update_interval } = body;

    if (!name || !url) {
        return errorResponse('Name and URL are required', 400);
    }

    // 1. Fetch subscription content
    let response;
    try {
        response = await fetch(url, {
            headers: {
                'User-Agent': user_agent || 'sing-box',
            },
            signal: AbortSignal.timeout(15000)
        });
    } catch (e: any) {
        return errorResponse(`Network Error: ${e.message}`, 400);
    }

    if (!response.ok) {
        return errorResponse(`Failed to fetch subscription: ${response.status} ${response.statusText}`, 400);
    }

    const content = await response.text();

    // 2. Parse nodes
    const parsedNodes = parseSubscription(content);

    if (parsedNodes.length === 0) {
        return errorResponse('No valid proxy nodes found in the subscription content', 400);
    }

    // 3. Insert provider
    const mode = await getSystemMode();
    const result = await db.insert(provider).values({
        side: mode,
        name,
        url,
        user_agent: user_agent || 'sing-box',
        update_interval: update_interval || 86400,
        last_update_at: Math.floor(Date.now() / 1000),
        node_count: parsedNodes.length,
    }).returning().get();

    if (!result) {
        return errorResponse('Failed to create provider', 500);
    }

    const newProvider = result;

    // 4. Insert parsed nodes transactionally (better-sqlite3 sync transaction)
    db.transaction((tx) => {
        for (const node of parsedNodes) {
            tx.insert(proxyNode).values({
                side: mode,
                provider_id: newProvider.id,
                name: node.name,
                type: node.type,
                server: node.server,
                port: node.port,
                config: JSON.stringify(node.config),
            }).run();
        }
    });

    return successResponse({
        ...newProvider,
        nodes_parsed: parsedNodes.length,
    });
});
