import { ProtocolDefinition } from './types';
import { Zap } from 'lucide-react';
import { z } from 'zod';
import { safeDecodeURIComponent } from './utils';

export const vmess: ProtocolDefinition = {
    id: 'vmess',
    aliases: ['vmess://'],
    name: 'VMess',
    color: 'text-sing-purple',
    icon: Zap,
    description: 'Versatile, standard proxy protocol.',

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
                    required: false
                },
                {
                    key: 'security',
                    label: 'Security',
                    type: 'select',
                    options: [
                        { label: 'Auto', value: 'auto' },
                        { label: 'AES-128-GCM', value: 'aes-128-gcm' },
                        { label: 'Chacha20-Poly1305', value: 'chacha20-poly1305' },
                        { label: 'None', value: 'none' },
                    ],
                    defaultValue: 'auto'
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
            title: 'Security (TLS)',
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
                    key: 'tls.certificate',
                    label: 'Certificate Path',
                    type: 'text',
                    placeholder: '/path/to/cert.pem',
                    showIf: (v) => v.tls?.enabled
                },
                {
                    key: 'tls.key',
                    label: 'Key Path',
                    type: 'text',
                    placeholder: '/path/to/key.pem',
                    showIf: (v) => v.tls?.enabled
                }
            ]
        }
    ],

    schema: z.object({
        uuid: z.string().optional(),
        security: z.string().default('auto'),
        transport: z.object({
            type: z.enum(['tcp', 'ws', 'grpc', 'http']).default('tcp'),
            path: z.string().optional(),
            service_name: z.string().optional(),
        }).optional(),
        tls: z.object({
            enabled: z.boolean().default(false),
            server_name: z.string().optional(),
            certificate: z.string().optional(),
            key: z.string().optional(),
        }).optional(),
    }),

    toSingBoxConfig: (data) => {
        const config: any = {
            type: 'vmess',
            users: [{
                name: 'auto',
                uuid: data.uuid,
                security: data.security || 'auto',
                alterId: 0, // Enforce 0 for VMessAEAD
            }],
        };

        if (data.transport?.type && data.transport.type !== 'tcp') {
            config.transport = {
                type: data.transport.type,
                path: data.transport.path,
                service_name: data.transport.service_name,
            };
        }

        if (data.tls?.enabled) {
            config.tls = {
                enabled: true,
                server_name: data.tls.server_name,
                certificate: data.tls.certificate, // Path to cert
                key: data.tls.key, // Path to key
            };
        }

        return config;
    },

    fromSingBoxConfig: (json) => {
        const user = json.users?.[0] || {};
        return {
            uuid: user.uuid,
            security: user.security,
            transport: {
                type: json.transport?.type || 'tcp',
                path: json.transport?.path,
                service_name: json.transport?.service_name,
            },
            tls: {
                enabled: json.tls?.enabled || false,
                server_name: json.tls?.server_name,
                certificate: json.tls?.certificate,
                key: json.tls?.key,
            }
        };
    },

    generateLink: (inbound, user, host) => {
        const config = JSON.parse(inbound.config);
        const transport = config.transport || {};
        const tls = config.tls || {};

        const vmessConfig = {
            v: "2",
            ps: `${inbound.tag}-${user.username}`,
            add: host,
            port: inbound.port,
            id: user.uuid,
            aid: "0",
            scy: "auto",
            net: transport.type || "tcp",
            type: "none",
            host: transport.headers?.host || tls.server_name || "",
            path: transport.path || "",
            tls: tls.enabled ? "tls" : "",
            sni: tls.server_name || "",
            alpn: "",
            fp: ""
        };

        return "vmess://" + btoa(JSON.stringify(vmessConfig));
    },

    parseUri: (uri: string) => {
        try {
            const json = JSON.parse(Buffer.from(uri.slice(8), 'base64').toString('utf-8'));
            const name = json.ps || `vmess-${json.add}:${json.port}`;
            const port = parseInt(json.port);
            const config: any = {
                type: 'vmess',
                tag: name,
                server: json.add,
                server_port: port,
                uuid: json.id,
                alter_id: parseInt(json.aid) || 0,
                security: json.scy || json.cipher || 'auto',
            };

            if (json.tls === 'tls') {
                config.tls = { enabled: true, server_name: json.sni || json.host || json.add };
                if (json.alpn) config.tls.alpn = String(json.alpn).split(',');
                if (json.fp) config.tls.utls = { enabled: true, fingerprint: json.fp };
            }

            const net = json.net;
            if (net === 'ws') {
                config.transport = { type: 'ws', path: json.path || '/', headers: json.host ? { Host: json.host } : {} };
            } else if (net === 'grpc') {
                config.transport = { type: 'grpc', service_name: json.path || '' };
            } else if (net === 'h2') {
                config.transport = { type: 'http', host: json.host ? [json.host] : [], path: json.path || '/' };
            }

            return { name, type: 'vmess', server: json.add, port, config };
        } catch {
            return null;
        }
    }
};
