import { NextResponse } from 'next/server';
import { db, rawConfig } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { getSystemMode } from '@/lib/settings';
import { withAuth, successResponse } from '@/lib/api-response';
import type { Inbound } from '@/types';

/**
 * GET /api/inbounds
 * 兼容性路由：从 rawConfig 获取 inbounds 数据
 */
export const GET = withAuth(async () => {
    const mode = await getSystemMode();
    const rawRecord = await db.select()
        .from(rawConfig)
        .where(and(eq(rawConfig.side, mode), eq(rawConfig.type, 'inbounds')))
        .get();

    let inbounds: Inbound[] = [];

    if (rawRecord && rawRecord.content) {
        try {
            const parsed = JSON.parse(rawRecord.content);
            const rawInbounds = (parsed && typeof parsed === 'object' && 'inbounds' in parsed)
                ? parsed.inbounds
                : (Array.isArray(parsed) ? parsed : []);

            if (Array.isArray(rawInbounds)) {
                inbounds = rawInbounds.map((inc: any, index: number) => ({
                    id: index, // 合成 ID 以兼容前端
                    side: mode,
                    tag: inc.tag || `inbound-${index}`,
                    protocol: inc.type || 'mixed',
                    port: inc.listen_port || 0,
                    config: JSON.stringify(inc),
                    enabled: true,
                    created_at: Math.floor(Date.now() / 1000),
                    updated_at: Math.floor(Date.now() / 1000)
                }));
            }
        } catch (e) {
            console.error('[API] Failed to parse inbounds from rawConfig:', e);
        }
    }

    return successResponse(inbounds);
});
