import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { rawConfig } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSystemMode } from '@/lib/settings';

const ALLOWED_TYPES = ['inbounds', 'route', 'dns', 'experimental'];

export async function GET(
    request: NextRequest,
    { params }: { params: { type: string } }
) {
    try {
        const { type } = params;
        if (!ALLOWED_TYPES.includes(type)) {
            return NextResponse.json({ success: false, error: 'Invalid config type' }, { status: 400 });
        }

        const mode = await getSystemMode();

        const record = await db.select().from(rawConfig)
            .where(and(eq(rawConfig.side, mode), eq(rawConfig.type, type)))
            .get();

        const defaultContents: Record<string, any> = {
            inbounds: [],
            route: { rules: [] },
            dns: { servers: [], rules: [] },
            experimental: {}
        };

        let contentObj = { [type]: defaultContents[type] };
        if (record && record.content) {
            try {
                const parsed = JSON.parse(record.content);
                // backward compatibility: if unwrapped, wrap it
                if (typeof parsed === 'object' && parsed !== null && type in parsed) {
                    contentObj = parsed;
                } else {
                    contentObj = { [type]: parsed };
                }
            } catch (e) {
                contentObj = { [type]: { _parseError: true, raw: record.content } };
            }
        }

        return NextResponse.json({ success: true, data: contentObj });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { type: string } }
) {
    try {
        const { type } = params;
        if (!ALLOWED_TYPES.includes(type)) {
            return NextResponse.json({ success: false, error: 'Invalid config type' }, { status: 400 });
        }

        const body = await request.json();

        // We expect body.content to be a valid JSON object or array. 
        // If they send raw string, body shouldn't be parsed. 
        // For UI purposes, we'll expect the client to send { content: object | array }
        if (body.content === undefined) {
            return NextResponse.json({ success: false, error: 'Missing content field' }, { status: 400 });
        }

        let contentStr = '';
        if (typeof body.content === 'string') {
            const parsed = JSON.parse(body.content);
            if (typeof parsed === 'object' && parsed !== null && type in parsed) {
                contentStr = JSON.stringify(parsed, null, 2); // Save exactly the wrapped form
            } else {
                contentStr = JSON.stringify({ [type]: parsed }, null, 2); // Force wrap
            }
        } else {
            if (typeof body.content === 'object' && body.content !== null && type in body.content) {
                contentStr = JSON.stringify(body.content, null, 2);
            } else {
                contentStr = JSON.stringify({ [type]: body.content }, null, 2);
            }
        }

        const mode = await getSystemMode();

        await db.insert(rawConfig).values({
            side: mode,
            type: type,
            content: contentStr,
        }).onConflictDoUpdate({
            target: [rawConfig.side, rawConfig.type],
            set: {
                content: contentStr,
                updated_at: Math.floor(Date.now() / 1000)
            }
        });

        return NextResponse.json({ success: true, message: 'Saved successfully' });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
