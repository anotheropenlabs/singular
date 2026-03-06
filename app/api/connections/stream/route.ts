import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';
import { SETTINGS_KEYS } from '@/lib/settings-defaults';
import WebSocket from 'ws';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Optional: Add basic auth check here if needed via cookies
    // const cookieStore = cookies();
    // if (!cookieStore.get('auth_token')) return new NextResponse('Unauthorized', { status: 401 });

    const cfg = await getSettings([SETTINGS_KEYS.SINGBOX_CLASH_API_PORT, SETTINGS_KEYS.SINGBOX_CLASH_API_SECRET]);
    const port = cfg[SETTINGS_KEYS.SINGBOX_CLASH_API_PORT] || '9090';
    const secret = cfg[SETTINGS_KEYS.SINGBOX_CLASH_API_SECRET] || '';

    let url = `ws://127.0.0.1:${port}/connections`;
    if (secret) {
        url += `?token=${encodeURIComponent(secret)}`;
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const ws = new WebSocket(url);

    const tryWrite = (str: string) => {
        try {
            writer.write(encoder.encode(str)).catch(() => ws.close());
        } catch (e) {
            ws.close();
        }
    };

    ws.on('open', () => {
        tryWrite(`: connected\n\n`);
    });

    ws.on('message', (data) => {
        tryWrite(`data: ${data.toString()}\n\n`);
    });

    ws.on('close', () => {
        writer.close().catch(() => { });
    });

    ws.on('error', (err) => {
        tryWrite(`event: error\ndata: ${err.message}\n\n`);
        writer.close().catch(() => { });
    });

    request.signal.addEventListener('abort', () => {
        ws.close();
        writer.close().catch(() => { });
    });

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Transfer-Encoding': 'chunked'
        },
    });
}
