
import { NextRequest, NextResponse } from 'next/server';
import { getProxyDelay } from '@/lib/daemon/clash-api';
import { getSession } from '@/lib/auth';

const ALLOWED_TEST_URLS = [
    'http://www.gstatic.com/generate_204',
    'http://cp.cloudflare.com',
    'https://www.google.com/generate_204',
    'http://connectivitycheck.gstatic.com/generate_204',
];

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const proxyName = decodeURIComponent(params.name);
    const searchParams = request.nextUrl.searchParams;
    const rawUrl = searchParams.get('url') || ALLOWED_TEST_URLS[0];

    // SSRF protection: only allow whitelisted URLs
    if (!ALLOWED_TEST_URLS.includes(rawUrl)) {
        return NextResponse.json({ error: 'URL not allowed' }, { status: 400 });
    }

    // Timeout: verify valid range if provided, otherwise undefined (let clash-api read setting)
    let timeout: number | undefined;
    const timeoutParam = searchParams.get('timeout');

    if (timeoutParam) {
        const parsed = parseInt(timeoutParam);
        if (!isNaN(parsed) && parsed > 0) {
            timeout = Math.min(60000, parsed); // specific request cap
        }
    }

    const result = await getProxyDelay(proxyName, rawUrl, timeout);

    if (result.error) {
        return NextResponse.json(
            { success: false, error: result.error },
            { status: result.status ?? 503 }
        );
    }

    return NextResponse.json({ success: true, data: result.delay });
}
