/**
 * format/clash.ts — Clash/Mihomo YAML format handler
 *
 * Accepts: YAML with `proxies:` section
 * Converts Clash proxy entries → sing-box outbound config
 *
 * The parser is line-based to avoid shipping a full YAML parser dependency.
 * It handles both block-style and inline ({...}) proxy entries.
 */
import { FormatHandler, ParsedNode } from '../types';

// ── Type mapping: Clash type → sing-box type ───────────────────────────────
const TYPE_MAP: Record<string, string> = {
    ss: 'shadowsocks',
    ssr: 'shadowsocksr',
    vmess: 'vmess',
    vless: 'vless',
    trojan: 'trojan',
    hysteria: 'hysteria',
    hysteria2: 'hysteria2',
    tuic: 'tuic',
    wireguard: 'wireguard',
    http: 'http',
    socks5: 'socks',
};

export const clashHandler: FormatHandler = {
    format: 'clash',

    detect(raw: string): boolean {
        return raw.includes('proxies:') && (raw.includes('- name:') || raw.includes('- {'));
    },

    parse(raw: string): ParsedNode[] {
        const proxies = extractClashProxies(raw);
        return proxies.map(clashProxyToNode).filter(Boolean) as ParsedNode[];
    },
};

// ── YAML proxy extraction (line-based) ───────────────────────────────────────

function extractClashProxies(content: string): Record<string, any>[] {
    const result: Record<string, any>[] = [];
    const lines = content.split('\n');

    let inProxies = false;
    let current: Record<string, any> | null = null;
    let currentIndent = 0;

    for (const rawLine of lines) {
        const line = rawLine.trimEnd();
        const trimmed = line.trimStart();
        const indent = line.length - trimmed.length;

        if (/^proxies:\s*$/.test(trimmed)) {
            inProxies = true;
            continue;
        }

        // Leaving proxies section
        if (inProxies && indent === 0 && trimmed && !trimmed.startsWith('-')) {
            if (current) { result.push(current); current = null; }
            inProxies = false;
            continue;
        }

        if (!inProxies) continue;

        // Inline entry: - { name: ..., type: ..., ... }
        if (/^\s*-\s*\{/.test(line)) {
            if (current) result.push(current);
            const jsonStr = line.replace(/^\s*-\s*/, '')
                .replace(/'/g, '"')
                .replace(/,\s*([a-zA-Z_-]+):/g, ',"$1":')
                .replace(/\{([a-zA-Z_-]+):/g, '{"$1":');
            try { current = JSON.parse(jsonStr); } catch { current = null; }
            continue;
        }

        // Block entry start: - name: xxx
        if (/^\s*-\s+name:/.test(line)) {
            if (current) result.push(current);
            current = {};
            currentIndent = indent;
            const m = line.match(/name:\s*(['"]?)(.+)\1\s*$/);
            if (m) current.name = m[2].trim();
            continue;
        }

        // Property of current block entry
        if (current && indent > currentIndent && /^\s+\S/.test(line)) {
            const m = trimmed.match(/^([a-zA-Z_-]+):\s*(.*)$/);
            if (m) {
                const key = m[1];
                let val: any = m[2].trim().replace(/^['"]|['"]$/g, '');
                if (val === 'true') val = true;
                else if (val === 'false') val = false;
                else if (/^\d+$/.test(val)) val = parseInt(val, 10);
                else if (val === '') val = undefined;
                current[key] = val;
            }
        }
    }

    if (current) result.push(current);
    return result;
}

// ── Clash proxy → ParsedNode ───────────────────────────────────────────────

function clashProxyToNode(proxy: Record<string, any>): ParsedNode | null {
    if (!proxy.name || !proxy.type || !proxy.server || !proxy.port) return null;

    const type = TYPE_MAP[proxy.type] || proxy.type;
    const config: any = {
        type,
        tag: proxy.name,
        server: proxy.server,
        server_port: Number(proxy.port),
    };

    // Protocol-specific fields
    switch (type) {
        case 'vless':
            config.uuid = proxy.uuid;
            if (proxy.flow) config.flow = proxy.flow;
            break;
        case 'vmess':
            config.uuid = proxy.uuid;
            config.alter_id = proxy.alterId ?? 0;
            config.security = proxy.cipher || proxy.security || 'auto';
            break;
        case 'trojan':
            config.password = proxy.password;
            break;
        case 'shadowsocks':
            config.method = proxy.cipher;
            config.password = proxy.password;
            break;
        case 'hysteria2':
            config.password = proxy.password || proxy.auth;
            if (proxy.up) config.up_mbps = parseInt(String(proxy.up)) || undefined;
            if (proxy.down) config.down_mbps = parseInt(String(proxy.down)) || undefined;
            break;
        case 'tuic':
            config.uuid = proxy.uuid;
            config.password = proxy.password;
            config.congestion_control = proxy['congestion-controller'] || 'bbr';
            config.udp_relay_mode = proxy['udp-relay-mode'] || 'native';
            break;
        case 'http':
        case 'socks':
            if (proxy.username) config.username = proxy.username;
            if (proxy.password) config.password = proxy.password;
            break;
    }

    // TLS
    if (proxy.tls) {
        config.tls = {
            enabled: true,
            server_name: proxy.sni || proxy.servername || proxy.server,
        };
        if (proxy['skip-cert-verify']) config.tls.insecure = true;
        if (proxy.alpn) {
            config.tls.alpn = Array.isArray(proxy.alpn)
                ? proxy.alpn
                : String(proxy.alpn).split(',').map(s => s.trim());
        }
        if (proxy['reality-opts']) {
            config.tls.reality = {
                enabled: true,
                public_key: proxy['reality-opts']['public-key'],
                short_id: proxy['reality-opts']['short-id'],
            };
        }
        if (proxy.fingerprint) {
            config.tls.utls = { enabled: true, fingerprint: proxy.fingerprint };
        }
    }

    // Transport
    const net = proxy.network;
    if (net === 'ws' || proxy['ws-opts']) {
        config.transport = {
            type: 'ws',
            path: proxy['ws-opts']?.path || '/',
            headers: proxy['ws-opts']?.headers || {},
            max_early_data: proxy['ws-opts']?.['max-early-data'],
        };
    } else if (net === 'grpc' || proxy['grpc-opts']) {
        config.transport = {
            type: 'grpc',
            service_name: proxy['grpc-opts']?.['grpc-service-name'] || '',
        };
    } else if (net === 'h2' || proxy['h2-opts']) {
        config.transport = {
            type: 'http',
            host: proxy['h2-opts']?.host || [],
            path: proxy['h2-opts']?.path || '/',
        };
    } else if (net === 'http' || proxy['http-opts']) {
        config.transport = {
            type: 'http',
            host: proxy['http-opts']?.headers?.Host || [],
            path: proxy['http-opts']?.path?.[0] || '/',
        };
    }

    return { name: proxy.name, type, server: proxy.server, port: Number(proxy.port), config };
}
