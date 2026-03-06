import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { proxyNode } from '@/lib/db/schema';
import { inArray, eq } from 'drizzle-orm';
import { testTcpLatency } from '@/lib/tools/latency'; // We'll prefer TCP for speed
import { getSetting } from '@/lib/settings';
import { SETTINGS_KEYS, DEFAULT_SINGBOX_SETTINGS } from '@/lib/settings-defaults';

// POST /api/proxies/latency — Batch test latency
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let { node_ids } = body; // Array of IDs. If empty, test all enabled nodes.

        let nodesToTest;

        if (node_ids && Array.isArray(node_ids) && node_ids.length > 0) {
            nodesToTest = await db.select().from(proxyNode)
                .where(inArray(proxyNode.id, node_ids))
                .all();
        } else {
            // Test all enabled nodes
            nodesToTest = await db.select().from(proxyNode)
                .where(eq(proxyNode.enabled, true))
                .all();
        }

        if (nodesToTest.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        // Concurrency limit
        const CONCURRENCY = 10;
        const results: Record<number, number> = {};

        // Get timeout setting
        const timeoutStr = await getSetting(SETTINGS_KEYS.APP_URL_TEST_TIMEOUT, DEFAULT_SINGBOX_SETTINGS.app_url_test_timeout);
        const timeoutMs = parseInt(timeoutStr, 10) || 5000;

        // Chunk processing
        for (let i = 0; i < nodesToTest.length; i += CONCURRENCY) {
            const chunk = nodesToTest.slice(i, i + CONCURRENCY);
            await Promise.all(chunk.map(async (node) => {
                // Determine port and host for testing
                // Usually server:server_port is enough
                const latency = await testTcpLatency(node.server, node.port, timeoutMs);

                // Update DB only if valid
                if (latency > -1) {
                    await db.update(proxyNode)
                        .set({ latency })
                        .where(eq(proxyNode.id, node.id));
                    results[node.id] = latency;
                } else {
                    // Optionally record failure as -1 or NULL or very high number
                    // We'll set -1 to indicate timeout/error
                    await db.update(proxyNode)
                        .set({ latency: -1 })
                        .where(eq(proxyNode.id, node.id));
                    results[node.id] = -1;
                }
            }));
        }

        return NextResponse.json({ success: true, data: results });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
