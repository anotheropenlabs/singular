import { ProtocolDefinition } from './types';
import { Shield } from 'lucide-react';
import { z } from 'zod';
import { buildTransport, safeDecodeURIComponent } from './utils';

export const trojan: ProtocolDefinition = {
    id: 'trojan',
    aliases: ['trojan://'],
    name: 'Trojan',
    color: 'text-sing-green',
    icon: Shield,
    description: 'Unidentifiable mechanism that mimics HTTPS.',

    sections: [
        {
            id: 'credentials',
            title: 'Credentials',
            fields: [
                {
                    key: 'password',
                    label: 'Password',
                    type: 'password',
                    placeholder: 'Required',
                    required: true
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
                    defaultValue: true, // Trojan requires TLS usually, but Sing-box structure separates it
                    help: 'Trojan usually requires TLS'
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
        password: z.string().min(1, 'Password is required'),
        transport: z.object({
            type: z.enum(['tcp', 'ws', 'grpc', 'http']).default('tcp'),
            path: z.string().optional(),
            service_name: z.string().optional(),
        }).optional(),
        tls: z.object({
            enabled: z.boolean().default(true),
            server_name: z.string().optional(),
            certificate: z.string().optional(),
            key: z.string().optional(),
        }).optional(),
    }),

    toSingBoxConfig: (data) => {
        const config: any = {
            type: 'trojan',
            users: [{
                name: 'auto',
                password: data.password,
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
                certificate: data.tls.certificate,
                key: data.tls.key,
            };
        }

        return config;
    },

    fromSingBoxConfig: (json) => {
        const user = json.users?.[0] || {};
        return {
            password: user.password,
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

        const password = user.password || ''; // Inbound config has generic password, users table has user specific? 
        // Wait, Trojan usually shares password or has multiple users with passwords.
        // In current model, Trojan User in `node_user` table implies we use `user.password`.
        // Sing-box trojan inbound `users` array has passwords.
        // If we are generating link for a specific user, we use THAT user's password.

        const params = new URLSearchParams();

        if (tls.enabled) {
            params.set('security', 'tls');
            if (tls.server_name) params.set('sni', tls.server_name);
        }

        params.set('type', transport.type || 'tcp');
        if (transport.path) params.set('path', transport.path);
        if (transport.service_name) params.set('serviceName', transport.service_name);

        const safeName = encodeURIComponent(`${inbound.tag}-${user.username}`);
        return `trojan://${password}@${host}:${inbound.port}?${params.toString()}#${safeName}`;
    },

    parseUri: (uri: string) => {
        // trojan://password@host:port?params#remark
        const m = uri.match(/^trojan:\/\/([^@]+)@([^:/?#]+):(\d+)\??([^#]*)#?(.*)/);
        if (!m) return null;
        const [, password, server, portStr, qs, remarkRaw] = m;
        const params = new URLSearchParams(qs);
        const name = remarkRaw ? safeDecodeURIComponent(remarkRaw) : `trojan-${server}:${portStr}`;
        const port = parseInt(portStr);

        const config: any = {
            type: 'trojan',
            tag: name,
            server,
            server_port: port,
            password: safeDecodeURIComponent(password),
        };

        // Trojan always has TLS
        const tls: any = { enabled: true, server_name: params.get('sni') || server };
        if (params.get('insecure') === '1') tls.insecure = true;
        if (params.get('alpn')) tls.alpn = params.get('alpn')!.split(',').map(s => s.trim());
        if (params.get('fp')) tls.utls = { enabled: true, fingerprint: params.get('fp') };
        config.tls = tls;

        const transport = buildTransport(params);
        if (transport) config.transport = transport;

        return { name, type: 'trojan', server, port, config };
    }
};
