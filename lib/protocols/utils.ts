export function safeDecodeURIComponent(s: string): string {
    try { return decodeURIComponent(s); } catch { return s; }
}

export type TlsConfig = { enabled: true; server_name?: string; insecure?: boolean; alpn?: string[]; utls?: any; reality?: any };
export type TransportConfig = { type: string;[k: string]: any };

/**
 * Build TLS config from common share-link query params.
 */
export function buildTls(params: URLSearchParams, server: string): TlsConfig | undefined {
    const security = params.get('security');
    if (!security || security === 'none') return undefined;

    const tls: TlsConfig = { enabled: true };
    const sni = params.get('sni') || params.get('peer') || server;
    if (sni) tls.server_name = sni;
    if (params.get('insecure') === '1') tls.insecure = true;
    if (params.get('alpn')) tls.alpn = params.get('alpn')!.split(',').map(s => s.trim());
    if (params.get('fp')) tls.utls = { enabled: true, fingerprint: params.get('fp') };

    if (security === 'reality') {
        tls.reality = { enabled: true } as any;
        if (params.get('pbk')) tls.reality.public_key = params.get('pbk');
        if (params.get('sid')) tls.reality.short_id = params.get('sid');
    }

    return tls;
}

/**
 * Build transport config from common share-link query params.
 */
export function buildTransport(params: URLSearchParams): TransportConfig | undefined {
    const type = params.get('type') || params.get('net');
    if (!type || type === 'tcp' || type === 'raw') return undefined;

    if (type === 'ws') {
        const t: TransportConfig = { type: 'ws', path: safeDecodeURIComponent(params.get('path') || '/') };
        const host = params.get('host');
        if (host) t.headers = { Host: safeDecodeURIComponent(host) };
        return t;
    }
    if (type === 'grpc') {
        return { type: 'grpc', service_name: safeDecodeURIComponent(params.get('serviceName') || params.get('path') || '') };
    }
    if (type === 'h2' || type === 'http') {
        const t: TransportConfig = { type: 'http', path: safeDecodeURIComponent(params.get('path') || '/') };
        const host = params.get('host');
        if (host) t.host = [safeDecodeURIComponent(host)];
        return t;
    }
    if (type === 'httpupgrade') {
        return { type: 'httpupgrade', path: safeDecodeURIComponent(params.get('path') || '/') };
    }
    return undefined;
}
