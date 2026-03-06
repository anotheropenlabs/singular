import { NextResponse, NextRequest } from 'next/server';
import { generateConfig } from '@/lib/config/config-generator';

/**
 * GET /api/client/config
 * 
 * Generates a complete sing-box client configuration using the existing
 * version-aware generator infrastructure (supports v1.10/v1.11/v1.12/v1.13).
 * 
 * The generator automatically:
 * - Reads system mode and sing-box version from settings
 * - Applies the correct version-specific strategy (ClientV12Strategy for client mode)
 * - Handles proxy groups, nodes, routing rules, DNS servers
 * 
 * Query params:
 * - ?download=1  → triggers file download with Content-Disposition header
 */
export async function GET(request: NextRequest) {
    try {
        const configJson = await generateConfig();

        const { searchParams } = new URL(request.url);
        if (searchParams.get('download') === '1') {
            return new NextResponse(configJson, {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': 'attachment; filename="singular-config.json"',
                },
            });
        }

        const config = JSON.parse(configJson);
        return NextResponse.json({ success: true, data: config });
    } catch (error: any) {
        console.error('[Config Generate]', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
