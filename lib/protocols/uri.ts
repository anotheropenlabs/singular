import { Inbound, NodeUser } from '@/types';
import { getProtocol } from './registry';

export function generateUri(inbound: Inbound, user: NodeUser, host: string = 'example.com'): string {
    const config = JSON.parse(inbound.config);
    const address = host; // ideally this comes from system settings or env
    const port = inbound.port;
    const remark = encodeURIComponent(inbound.tag);

    switch (inbound.protocol) {
        case 'vless': {
            // vless://uuid@host:port?security=...&type=...#remark
            const uuid = user.uuid;
            let params = [];

            if (config.tls?.enabled) {
                params.push('security=tls');
                if (config.tls.server_name) params.push(`sni=${config.tls.server_name}`);
                if (config.tls.reality?.enabled) {
                    params.push('security=reality');
                    params.push(`pbk=${config.tls.reality.public_key}`);
                    if (config.tls.reality.short_id) params.push(`sid=${config.tls.reality.short_id}`);
                }
            } else {
                params.push('security=none');
            }

            if (config.transport?.type === 'ws') {
                params.push('type=ws');
                if (config.transport.path) params.push(`path=${encodeURIComponent(config.transport.path)}`);
                if (config.transport.headers?.Host) params.push(`host=${encodeURIComponent(config.transport.headers.Host)}`);
            } else if (config.transport?.type === 'grpc') {
                params.push('type=grpc');
                if (config.transport.service_name) params.push(`serviceName=${encodeURIComponent(config.transport.service_name)}`);
            } else {
                params.push('type=tcp');
            }

            return `vless://${uuid}@${address}:${port}?${params.join('&')}#${remark}`;
        }
        case 'vmess': {
            // VMess usually uses a base64 encoded JSON
            const vmessConfig = {
                v: "2",
                ps: inbound.tag,
                add: address,
                port: port,
                id: user.uuid,
                aid: "0",
                scy: "auto",
                net: config.transport?.type || "tcp",
                type: "none",
                host: config.transport?.headers?.Host || "",
                path: config.transport?.path || "",
                tls: config.tls?.enabled ? "tls" : "",
                sni: config.tls?.server_name || "",
                alpn: ""
            };
            return `vmess://${Buffer.from(JSON.stringify(vmessConfig)).toString('base64')}`;
        }
        case 'trojan': {
            // trojan://password@host:port?security=...#remark
            const password = user.uuid; // trojan uses uuid/password interchangeably in simple setups
            let params = [];

            if (config.tls?.enabled) {
                params.push('security=tls');
                if (config.tls.server_name) params.push(`sni=${config.tls.server_name}`);
            }

            if (config.transport?.type === 'ws') {
                params.push('type=ws');
                if (config.transport.path) params.push(`path=${encodeURIComponent(config.transport.path)}`);
                if (config.transport.headers?.Host) params.push(`host=${encodeURIComponent(config.transport.headers.Host)}`);
            } else if (config.transport?.type === 'grpc') {
                params.push('type=grpc');
                if (config.transport.service_name) params.push(`serviceName=${encodeURIComponent(config.transport.service_name)}`);
            }

            return `trojan://${password}@${address}:${port}?${params.join('&')}#${remark}`;
        }
        case 'shadowsocks': {
            // ss://base64(method:password)@host:port#remark
            const method = config.method || 'aes-256-gcm';
            // User-specific password or shared? Usually SS is per-port or uses a plugin. 
            // Standard SS doesn't support multi-user on single port easily without plugins like v2ray-plugin.
            // Assuming simplified single-user or handling elsewhere.
            // For now, let's assume the config has the password, OR we use user UUID as password if intended.
            const password = config.password || user.uuid;
            const creds = Buffer.from(`${method}:${password}`).toString('base64');
            return `ss://${creds}@${address}:${port}#${remark}`;
        }
        case 'hysteria2':
        case 'hysteria':
        case 'tuic':
        default: {
            // Use protocol registry's generateLink if available
            const protocolDef = getProtocol(inbound.protocol);
            if (protocolDef?.generateLink) {
                return protocolDef.generateLink(inbound, user, address);
            }
            return `${inbound.protocol}://${user.uuid}@${address}:${port}#${remark}`;
        }
    }
}

export function generateSingboxConfig(inbounds: Inbound[], user: NodeUser, host: string = 'example.com'): object {
    const outbounds = inbounds.map(inbound => {
        const config = JSON.parse(inbound.config);

        // Transform inbound config to outbound config for the client
        const outbound: any = {
            type: inbound.protocol,
            tag: inbound.tag,
            server: host,
            server_port: inbound.port,
        };

        if (inbound.protocol === 'vless') {
            outbound.uuid = user.uuid;
            outbound.flow = config.flow || '';
        } else if (inbound.protocol === 'vmess') {
            outbound.uuid = user.uuid;
            outbound.security = 'auto';
        } else if (inbound.protocol === 'trojan') {
            outbound.password = user.uuid;
        } else if (inbound.protocol === 'shadowsocks') {
            outbound.method = config.method;
            outbound.password = config.password || user.uuid;
        } else if (inbound.protocol === 'hysteria2') {
            outbound.password = user.password || config.users?.[0]?.password || '';
            if (config.up_mbps) outbound.up_mbps = config.up_mbps;
            if (config.down_mbps) outbound.down_mbps = config.down_mbps;
            if (config.obfs?.type === 'salamander') {
                outbound.obfs = {
                    type: 'salamander',
                    password: config.obfs.password,
                };
            }
        } else if (inbound.protocol === 'tuic') {
            outbound.uuid = user.uuid;
            outbound.password = user.password || config.users?.[0]?.password || '';
            outbound.congestion_control = config.congestion_control || 'bbr';
            outbound.udp_relay_mode = config.udp_relay_mode || 'native';
        }

        // TLS
        if (config.tls?.enabled) {
            outbound.tls = {
                enabled: true,
                server_name: config.tls.server_name,
                utls: { enabled: true, fingerprint: 'chrome' },
            };
            if (config.tls.reality?.enabled) {
                outbound.tls.reality = {
                    enabled: true,
                    public_key: config.tls.reality.public_key,
                    short_id: config.tls.reality.short_id,
                };
            }
        }

        // Transport
        if (config.transport) {
            outbound.transport = {
                type: config.transport.type,
                ...config.transport
            };
        }

        return outbound;
    });

    return {
        log: {
            level: 'info',
            timestamp: true,
        },
        dns: {
            servers: [
                { tag: 'google', address: '8.8.8.8', detachable: true },
                { tag: 'local', address: 'local', detachable: true }
            ],
            rules: [
                { outbound: 'any', server: 'google' }
            ]
        },
        inbounds: [
            {
                type: 'tun',
                tag: 'tun-in',
                interface_name: 'tun0',
                inet4_address: '172.19.0.1/30',
                auto_route: true,
                strict_route: true,
                stack: 'system'
            }
        ],
        outbounds: [
            ...outbounds,
            { type: 'direct', tag: 'direct' },
            { type: 'dns', tag: 'dns-out' }
        ],
        route: {
            rules: [
                { protocol: 'dns', outbound: 'dns-out' },
                { outbound: 'direct', geoip: ['private'] }
            ],
            auto_detect_interface: true
        }
    };
}
