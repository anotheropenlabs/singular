
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { generateConfig } from '@/lib/config/config-generator';
import { getConfigPath } from '@/lib/daemon/process-manager';
import fs from 'fs/promises';

export async function POST(request: Request) {
    // @ts-ignore
    return withAuth(request as any, async () => {
        try {
            console.log('[API] Regenerating sing-box config from database...');
            const configContent = await generateConfig();
            const configPath = await getConfigPath();
            await fs.writeFile(configPath, configContent, 'utf-8');
            console.log(`[API] Config regenerated at ${configPath}`);

            return NextResponse.json({ success: true, message: 'Configuration regenerated successfully from database' });
        } catch (error: any) {
            console.error('[API] Config regeneration failed:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
    });
}
