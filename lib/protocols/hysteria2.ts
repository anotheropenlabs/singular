
import { ProtocolDefinition } from './types';
import { Zap } from 'lucide-react'; // Reuse Zap or find better icon
import { z } from 'zod';
import { safeDecodeURIComponent } from './utils';

export const hysteria2: ProtocolDefinition = {
    id: 'hysteria2',
    aliases: ['hy2://', 'hysteria2://'],
    name: 'Hysteria 2',
    color: 'text-sing-red', // Distinct color
    icon: Zap,
    description: 'High performance QUIC-based protocol.',

    sections: [
        {
            id: 'credentials',
            title: 'Credentials',
            fields: [
                {
                    key: 'password', // Hysteria2 uses password auth usually, or user/pass? 
                    // Sing-box hy2 inbound: "users": [{"name", "password"}]
                    label: 'Password',
                    type: 'password',
                    placeholder: 'Required',
                    required: true
                },
                {
                    key: 'up_mbps',
                    label: 'Up Speed (Mbps)',
                    type: 'number',
                    placeholder: '100',
                    help: 'Server upload limit hint'
                },
                {
                    key: 'down_mbps',
                    label: 'Down Speed (Mbps)',
                    type: 'number',
                    placeholder: '100',
                    help: 'Server download limit hint'
                }
            ]
        },
        {
            id: 'obfs',
            title: 'Obfuscation',
            fields: [
                {
                    key: 'obfs.type',
                    label: 'Type',
                    type: 'select',
                    options: [
                        { label: 'None', value: '' },
                        { label: 'Salamander', value: 'salamander' },
                    ],
                    defaultValue: ''
                },
                {
                    key: 'obfs.password',
                    label: 'Obfs Password',
                    type: 'text',
                    placeholder: 'Required if Salamander',
                    showIf: (v) => v.obfs?.type === 'salamander'
                }
            ]
        },
        {
            id: 'tls',
            title: 'TLS',
            fields: [
                {
                    key: 'tls.enabled',
                    label: 'Enable TLS',
                    type: 'boolean',
                    defaultValue: true,
                    help: 'Hysteria2 always uses TLS/QUIC'
                },
                {
                    key: 'tls.server_name',
                    label: 'Server Name (SNI)',
                    type: 'text',
                    placeholder: 'example.com',
                },
                {
                    key: 'tls.certificate',
                    label: 'Certificate Path',
                    type: 'text',
                },
                {
                    key: 'tls.key',
                    label: 'Key Path',
                    type: 'text',
                }
            ]
        }
    ],

    schema: z.object({
        password: z.string().optional(), // Inbound level password? Or users? Assuming single user simplicity or shared secret.
        // Actually, if we follow VLESS user pattern, we should probably have 'users' array. 
        // But for UI simplicity, we often set a default user.
        // Let's assume password is required for the default user.
        up_mbps: z.number().optional(),
        down_mbps: z.number().optional(),
        obfs: z.object({
            type: z.enum(['', 'salamander']).optional(),
            password: z.string().optional(),
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
            type: 'hysteria2',
            users: [{
                name: 'auto',
                password: data.password || 'password', // Default?
            }],
            up_mbps: data.up_mbps,
            down_mbps: data.down_mbps,
        };

        if (data.obfs?.type === 'salamander') {
            config.obfs = {
                type: 'salamander',
                password: data.obfs.password,
            };
        }

        if (data.tls?.enabled) {
            config.tls = {
                enabled: true,
                server_name: data.tls.server_name,
                certificate: data.tls.certificate,
                key: data.tls.key,
                alpn: ['h3'], // Hysteria2 usually h3
            };
        }

        return config;
    },

    fromSingBoxConfig: (json) => {
        const user = json.users?.[0] || {};
        return {
            password: user.password,
            up_mbps: json.up_mbps,
            down_mbps: json.down_mbps,
            obfs: {
                type: json.obfs?.type || '',
                password: json.obfs?.password,
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
        const tls = config.tls || {};
        const obfs = config.obfs || {};

        // User password overrides inbound generic password if modeled that way.
        // In our simple model, user might not have 'password' field populated for Hy2 if we use NodeUser.uuid? 
        // NodeUser has `password` field (nullable).
        // Let's use user.password if present, else config.users[0].password?
        // Wait, NodeUser password is used for Trojan/Hy2.
        const password = user.password || config.users?.[0]?.password || '';

        const params = new URLSearchParams();
        params.set('insecure', '1'); // Usually for self-signed or just explicit
        if (tls.server_name) params.set('sni', tls.server_name);
        if (obfs.type === 'salamander') {
            params.set('obfs', 'salamander');
            if (obfs.password) params.set('obfs-password', obfs.password);
        }

        const safeName = encodeURIComponent(`${inbound.tag}-${user.username}`);
        return `hy2://${password}@${host}:${inbound.port}?${params.toString()}#${safeName}`;
    },

    parseUri: (uri: string) => {
        // hy2://auth@host:port?params#remark
        const normalized = uri.replace(/^hysteria2:\/\//, 'hy2://');
        const m = normalized.match(/^hy2:\/\/([^@]+)@([^:/?#]+):(\d+)\??([^#]*)#?(.*)/);
        if (!m) return null;
        const [, auth, server, portStr, qs, remarkRaw] = m;
        const params = new URLSearchParams(qs);
        const name = remarkRaw ? safeDecodeURIComponent(remarkRaw) : `hy2-${server}:${portStr}`;
        const port = parseInt(portStr);

        const config: any = {
            type: 'hysteria2',
            tag: name,
            server,
            server_port: port,
            password: safeDecodeURIComponent(auth),
            tls: { enabled: true, server_name: params.get('sni') || server },
        };
        if (params.get('insecure') === '1') config.tls.insecure = true;
        if (params.get('obfs') === 'salamander' && params.get('obfs-password')) {
            config.obfs = { type: 'salamander', password: params.get('obfs-password') };
        }

        return { name, type: 'hysteria2', server, port, config };
    }
};
