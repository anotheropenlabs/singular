import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { getConfigPath, getSingboxPath } from '@/lib/daemon/process-manager';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // @ts-ignore
    return withAuth(request as any, async () => {
        try {
            const configPath = await getConfigPath();
            const content = await fs.readFile(configPath, 'utf-8');
            return NextResponse.json({ success: true, content });
        } catch (error: any) {
            return NextResponse.json({ success: false, error: "Failed to read config file" }, { status: 500 });
        }
    });
}

export async function POST(request: Request) {
    // @ts-ignore
    return withAuth(request as any, async () => {
        try {
            const { content } = await request.json();
            const configPath = await getConfigPath();
            const binPath = await getSingboxPath();

            // 1. Validate JSON syntax
            try {
                JSON.parse(content);
            } catch {
                return NextResponse.json({ success: false, error: "Invalid JSON syntax" }, { status: 400 });
            }

            // 2. Validate with sing-box check (optional but recommended)
            // We'll write to a temp file first
            const tempPath = `${configPath}.temp`;
            await fs.writeFile(tempPath, content, 'utf-8');

            try {
                await execAsync(`${binPath} check -c ${tempPath}`);
            } catch (e: any) {
                await fs.unlink(tempPath);
                return NextResponse.json({ success: false, error: `Sing-box validation failed: ${e.stderr || e.message}` }, { status: 400 });
            }

            // 3. Move temp to actual
            await fs.rename(tempPath, configPath);

            return NextResponse.json({ success: true, message: "Configuration saved successfully" });
        } catch (error: any) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
    });
}
