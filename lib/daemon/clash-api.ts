
import { getSettings } from '@/lib/settings';
import { SETTINGS_KEYS } from '../settings-defaults';


export interface ClashProxy {
    name: string;
    type: string;
    history: { time: string; delay: number }[];
    udp: boolean;
    now?: string;
    all?: string[];
}

export interface ClashConfig {
    port: number;
    'socks-port': number;
    'redir-port': number;
    'tproxy-port': number;
    'mixed-port': number;
    'allow-lan': boolean;
    'bind-address': string;
    mode: string;
    'log-level': string;
    ipv6: boolean;
}

export interface Connection {
    id: string;
    metadata: {
        network: string;
        type: string;
        sourceIP: string;
        destinationIP: string;
        sourcePort: string;
        destinationPort: string;
        host: string;
        dnsMode: string;
        processPath: string;
        inbound?: string;
        inboundName?: string;
        inboundUser?: string;
    };
    upload: number;
    download: number;
    start: string;
    chains: string[];
    rule: string;
    rulePayload: string;
}

interface ClashProxiesResponse {
    proxies: Record<string, ClashProxy>;
}

interface ClashConnectionsResponse {
    downloadTotal: number;
    uploadTotal: number;
    connections: Connection[];
}

async function getClashConfigHeaders() {
    const cfg = await getSettings([SETTINGS_KEYS.SINGBOX_CLASH_API_PORT, SETTINGS_KEYS.SINGBOX_CLASH_API_SECRET]);
    const port = cfg[SETTINGS_KEYS.SINGBOX_CLASH_API_PORT] || '9090';
    const secret = cfg[SETTINGS_KEYS.SINGBOX_CLASH_API_SECRET] || '';

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (secret) headers['Authorization'] = `Bearer ${secret}`;

    return { params: { port, secret }, headers };
}

// Proxies
export async function getProxies(): Promise<Record<string, ClashProxy>> {
    const { params, headers } = await getClashConfigHeaders();
    try {
        const res = await fetch(`http://127.0.0.1:${params.port}/proxies`, { headers, next: { revalidate: 0 } });
        if (!res.ok) return {};
        const data: ClashProxiesResponse = await res.json();
        return data.proxies;
    } catch (e) { return {}; }
}

export async function selectProxy(selector: string, proxy: string): Promise<boolean> {
    const { params, headers } = await getClashConfigHeaders();
    try {
        const res = await fetch(`http://127.0.0.1:${params.port}/proxies/${encodeURIComponent(selector)}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ name: proxy })
        });
        return res.ok;
    } catch (e) { return false; }
}

export interface ProxyDelayResult {
    delay: number;
    error?: string;
    status?: number;
}

export async function getProxyDelay(proxyName: string, url = 'http://www.gstatic.com/generate_204', timeout?: number): Promise<ProxyDelayResult> {
    const { params, headers } = await getClashConfigHeaders();

    let finalTimeout = timeout;
    if (!finalTimeout) {
        const setting = await getSettings([SETTINGS_KEYS.APP_URL_TEST_TIMEOUT]);
        finalTimeout = parseInt(setting[SETTINGS_KEYS.APP_URL_TEST_TIMEOUT] || '5000');
    }

    try {
        const search = new URLSearchParams({ url, timeout: finalTimeout.toString() });
        const res = await fetch(`http://127.0.0.1:${params.port}/proxies/${encodeURIComponent(proxyName)}/delay?${search}`, { headers });
        if (!res.ok) {
            let message = res.statusText || `HTTP ${res.status}`;
            return { delay: 0, error: message, status: res.status };
        }
        const data = await res.json();
        return { delay: data.delay || 0 };
    } catch (e) {
        return { delay: 0, error: e instanceof Error ? e.message : 'Network error', status: 503 };
    }
}

// Configs
export async function getConfig(): Promise<ClashConfig | null> {
    const { params, headers } = await getClashConfigHeaders();
    try {
        const res = await fetch(`http://127.0.0.1:${params.port}/configs`, { headers, next: { revalidate: 0 } });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) { return null; }
}

export async function updateConfig(config: Partial<ClashConfig>): Promise<boolean> {
    const { params, headers } = await getClashConfigHeaders();
    try {
        const res = await fetch(`http://127.0.0.1:${params.port}/configs`, {
            method: 'PATCH', // Clash API uses PATCH for partial update
            headers,
            body: JSON.stringify(config)
        });
        return res.ok;
    } catch (e) { return false; }
}

// Connections
export async function getConnections(): Promise<ClashConnectionsResponse | null> {
    const { params, headers } = await getClashConfigHeaders();
    try {
        const res = await fetch(`http://127.0.0.1:${params.port}/connections`, { headers, next: { revalidate: 0 } });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) { return null; }
}

export async function closeConnection(id: string): Promise<boolean> {
    const { params, headers } = await getClashConfigHeaders();
    try {
        const res = await fetch(`http://127.0.0.1:${params.port}/connections/${id}`, { method: 'DELETE', headers });
        return res.ok;
    } catch (e) { return false; }
}

export async function closeAllConnections(): Promise<boolean> {
    const { params, headers } = await getClashConfigHeaders();
    try {
        const res = await fetch(`http://127.0.0.1:${params.port}/connections`, { method: 'DELETE', headers });
        return res.ok;
    } catch (e) { return false; }
}

// Version
export async function getVersion(): Promise<{ version: string } | null> {
    const { params, headers } = await getClashConfigHeaders();
    try {
        const res = await fetch(`http://127.0.0.1:${params.port}/version`, { headers, next: { revalidate: 0 } });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) { return null; }
}
