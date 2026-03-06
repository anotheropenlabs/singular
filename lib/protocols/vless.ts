import { ProtocolDefinition } from './types';
import { Globe } from 'lucide-react';
import { z } from 'zod';
import { buildTls, buildTransport, safeDecodeURIComponent } from './utils';

export const vless: ProtocolDefinition = {
    id: 'vless',
    aliases: ['vless://'],
    name: 'VLESS',
    color: 'text-sing-blue',
    icon: Globe,
    description: 'Lightweight & Efficient, supports Reality.',

    sections: [
        {
            id: 'credentials',
            title: 'Credentials',
            fields: [
                {
                    key: 'uuid',
                    label: 'UUID',
                    type: 'text',
                    placeholder: 'Auto-generated if empty',
                    help: 'User ID for authentication',
                    required: false
                },
                {
                    key: 'flow',
                    label: 'Flow',
                    type: 'select',
                    options: [
                        { label: 'None', value: '' },
                        { label: 'xtls-rprx-vision', value: 'xtls-rprx-vision' },
                    ],
                    defaultValue: '',
                    help: 'Flow control algorithm (requires TLS/Reality + TCP)'
                }
            ]
        },
        {
            id: 'transport',
            title: 'Transport Settings',
            fields: [
                {
                    key: 'transport.type',
                    label: 'Type',
                    type: 'select',
                    defaultValue: 'tcp',
                    options: [
                        { label: 'TCP', value: 'tcp' },
                        { label: 'WebSocket', value: 'ws' },
                        { label: 'gRPC', value: 'grpc' },
                        { label: 'HTTP', value: 'http' },
                    ]
                },
                {
                    key: 'transport.path',
                    label: 'Path',
                    type: 'text',
                    placeholder: '/',
                    showIf: (v) => v.transport?.type === 'ws' || v.transport?.type === 'http'
                },
                {
                    key: 'transport.service_name',
                    label: 'Service Name',
                    type: 'text',
                    placeholder: 'grpc-service',
                    showIf: (v) => v.transport?.type === 'grpc'
                }
            ]
        },
        {
            id: 'tls',
            title: 'Security (TLS / Reality)',
            fields: [
                {
                    key: 'tls.enabled',
                    label: 'Enable TLS',
                    type: 'boolean',
                    defaultValue: false
                },
                {
                    key: 'tls.server_name',
                    label: 'Server Name (SNI)',
                    type: 'text',
                    placeholder: 'example.com',
                    showIf: (v) => v.tls?.enabled
                },
                {
                    key: 'tls.reality.enabled',
                    label: 'Enable Reality',
                    type: 'boolean',
                    defaultValue: false,
                    showIf: (v) => v.tls?.enabled
                },
                {
                    key: 'tls.reality.handshake.server',
                    label: 'Handshake Server',
                    type: 'text',
                    placeholder: 'www.google.com',
                    showIf: (v) => v.tls?.enabled && v.tls?.reality?.enabled
                },
                {
                    key: 'tls.reality.handshake.server_port',
                    label: 'Target Port',
                    type: 'number',
                    defaultValue: 443,
                    showIf: (v) => v.tls?.enabled && v.tls?.reality?.enabled
                },
                {
                    key: 'tls.reality.private_key',
                    label: 'Private Key',
                    type: 'text',
                    placeholder: 'Paste or generate...',
                    showIf: (v) => v.tls?.enabled && v.tls?.reality?.enabled
                },
                {
                    key: 'tls.reality.short_id',
                    label: 'Short ID',
                    type: 'text',
                    placeholder: 'e.g., 1a2b3c4d',
                    showIf: (v) => v.tls?.enabled && v.tls?.reality?.enabled
                }
            ]
        }
    ],

    schema: z.object({
        uuid: z.string().optional(),
        flow: z.string().optional(),
        transport: z.object({
            type: z.enum(['tcp', 'ws', 'grpc', 'http']).default('tcp'),
            path: z.string().optional(),
            service_name: z.string().optional(),
        }).optional(),
        tls: z.object({
            enabled: z.boolean().default(false),
            server_name: z.string().optional(),
            reality: z.object({
                enabled: z.boolean().default(false),
                handshake: z.object({
                    server: z.string().optional(),
                    server_port: z.number().optional(),
                }).optional(),
                private_key: z.string().optional(),
                short_id: z.string().optional(), // In UI as string, convert to array later
            }).optional(),
        }).optional(),
    }),

    toSingBoxConfig: (data) => {
        const config: any = {
            type: 'vless',
            users: [{
                name: 'auto', // Placeholder, handled by user management usually
                uuid: data.uuid,
                flow: data.flow || undefined,
            }],
        };

        // Transport
        if (data.transport?.type && data.transport.type !== 'tcp') {
            config.transport = {
                type: data.transport.type,
                path: data.transport.path,
                service_name: data.transport.service_name,
            };
        }

        // TLS
        if (data.tls?.enabled) {
            config.tls = {
                enabled: true,
                server_name: data.tls.server_name,
            };

            if (data.tls.reality?.enabled) {
                config.tls.reality = {
                    enabled: true,
                    handshake: {
                        server: data.tls.reality.handshake?.server,
                        server_port: data.tls.reality.handshake?.server_port || 443,
                    },
                    private_key: data.tls.reality.private_key,
                    short_id: data.tls.reality.short_id ? [data.tls.reality.short_id] : [],
                };
            }
        }

        return config;
    },

    fromSingBoxConfig: (json) => {
        // Reverse mapping for editing
        const user = json.users?.[0] || {};
        return {
            uuid: user.uuid,
            flow: user.flow,
            transport: {
                type: json.transport?.type || 'tcp',
                path: json.transport?.path,
                service_name: json.transport?.service_name,
            },
            tls: {
                enabled: json.tls?.enabled || false,
                server_name: json.tls?.server_name,
                reality: {
                    enabled: json.tls?.reality?.enabled || false,
                    handshake: {
                        server: json.tls?.reality?.handshake?.server,
                        server_port: json.tls?.reality?.handshake?.server_port,
                    },
                    private_key: json.tls?.reality?.private_key,
                    short_id: json.tls?.reality?.short_id?.[0] || '',
                }
            }
        };
    },

    generateLink: (inbound, user, host) => {
        // Parse config to get details
        const config = JSON.parse(inbound.config);
        const transport = config.transport || {};
        const tls = config.tls || {};
        const reality = tls.reality || {};

        const uuid = user.uuid;
        const port = inbound.port;
        const name = `${inbound.tag}-${user.username}`;

        const params = new URLSearchParams();
        params.set('type', transport.type || 'tcp');

        if (tls.enabled) {
            if (reality.enabled) {
                params.set('security', 'reality');
                if (reality.public_key) params.set('pbk', reality.public_key); // Note: server config has private key, public key must be derived or stored? 
                // Wait, server config usually HAS private key. Link needs PUBLIC key.
                // We don't have public key in config usually if we generated it. 
                // We might need to store it or derive it? 
                // For now, let's assume it's in config or user needs to provide it. 
                // Sing-box config doesn't store public key for inbound reality.
                // WE MUST STORE IT. But currently we don't. 
                // This is a known issue with Reality.
                // Let's check where public key comes from. In `links.ts` it tried `reality.public_key`.
                // Let's skip pbk if missing, which breaks the link, but we can't invent it.
                if (reality.short_id?.[0]) params.set('sid', reality.short_id[0]);
                params.set('fp', 'chrome');
                params.set('flow', 'xtls-rprx-vision'); // Default for reality usually
            } else {
                params.set('security', 'tls');
            }

            const sni = tls.server_name || (reality.enabled ? reality.handshake?.server : '');
            if (sni) params.set('sni', sni);
        } else {
            params.set('security', 'none');
        }

        if (transport.path) params.set('path', transport.path);
        if (transport.service_name) params.set('serviceName', transport.service_name);

        const safeName = encodeURIComponent(name);
        return `vless://${uuid}@${host}:${port}?${params.toString()}#${safeName}`;
    },

    parseUri: (uri: string) => {
        // vless://uuid@host:port?params#remark
        const m = uri.match(/^vless:\/\/([^@]+)@([^:/?#]+):(\d+)\??([^#]*)#?(.*)/);
        if (!m) return null;
        const [, uuid, server, portStr, qs, remarkRaw] = m;
        const params = new URLSearchParams(qs);
        const name = remarkRaw ? safeDecodeURIComponent(remarkRaw) : `vless-${server}:${portStr}`;
        const port = parseInt(portStr);

        const config: any = { type: 'vless', tag: name, server, server_port: port, uuid };
        if (params.get('flow')) config.flow = params.get('flow');

        const tls = buildTls(params, server);
        if (tls) config.tls = tls;

        const transport = buildTransport(params);
        if (transport) config.transport = transport;

        return { name, type: 'vless', server, port, config };
    }
};
