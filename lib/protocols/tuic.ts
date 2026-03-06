
import { ProtocolDefinition } from './types';
import { Radio } from 'lucide-react'; // Reuse Radio or find better icon
import { z } from 'zod';
import { safeDecodeURIComponent } from './utils';

export const tuic: ProtocolDefinition = {
    id: 'tuic',
    aliases: ['tuic://'],
    name: 'TUIC',
    color: 'text-sing-orange', // Distinct color
    icon: Radio,
    description: 'QUIC-based proxy protocol.',

    sections: [
        {
            id: 'credentials',
            title: 'Credentials',
            fields: [
                {
                    key: 'uuid',
                    label: 'UUID',
                    type: 'text',
                    placeholder: 'Required',
                    required: true
                },
                {
                    key: 'password',
                    label: 'Password',
                    type: 'password',
                    placeholder: 'Required',
                    required: true
                },
                {
                    key: 'congestion_control',
                    label: 'Congestion Control',
                    type: 'select',
                    options: [
                        { label: 'BBR', value: 'bbr' },
                        { label: 'Cubic', value: 'cubic' },
                        { label: 'New Reno', value: 'new_reno' },
                    ],
                    defaultValue: 'bbr'
                },
                {
                    key: 'udp_relay_mode',
                    label: 'UDP Relay Mode',
                    type: 'select',
                    options: [
                        { label: 'Native', value: 'native' },
                        { label: 'QUIC', value: 'quic' },
                    ],
                    defaultValue: 'native'
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
                    help: 'TUIC requires TLS/QUIC'
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
        uuid: z.string().optional(),
        password: z.string().optional(),
        congestion_control: z.string().default('bbr'),
        udp_relay_mode: z.string().default('native'),
        tls: z.object({
            enabled: z.boolean().default(true),
            server_name: z.string().optional(),
            certificate: z.string().optional(),
            key: z.string().optional(),
        }).optional(),
    }),

    toSingBoxConfig: (data) => {
        const config: any = {
            type: 'tuic',
            users: [{
                name: 'auto',
                uuid: data.uuid,
                password: data.password,
            }],
            congestion_control: data.congestion_control,
            udp_relay_mode: data.udp_relay_mode,
        };

        if (data.tls?.enabled) {
            config.tls = {
                enabled: true,
                server_name: data.tls.server_name,
                certificate: data.tls.certificate,
                key: data.tls.key,
                alpn: ['h3'],
            };
        }

        return config;
    },

    fromSingBoxConfig: (json) => {
        const user = json.users?.[0] || {};
        return {
            uuid: user.uuid,
            password: user.password,
            congestion_control: json.congestion_control,
            udp_relay_mode: json.udp_relay_mode,
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

        // TUIC uses UUID + Password
        // Use user.uuid if available, else inbound config default
        const uuid = user.uuid || config.users?.[0]?.uuid;
        const password = user.password || config.users?.[0]?.password;

        const params = new URLSearchParams();
        if (tls.server_name) params.set('sni', tls.server_name);
        params.set('congestion_control', config.congestion_control || 'bbr');
        params.set('udp_relay_mode', config.udp_relay_mode || 'native');
        params.set('alpn', 'h3');

        const safeName = encodeURIComponent(`${inbound.tag}-${user.username}`);
        return `tuic://${uuid}:${password}@${host}:${inbound.port}?${params.toString()}#${safeName}`;
    },

    parseUri: (uri: string) => {
        // tuic://uuid:password@host:port?params#remark
        const m = uri.match(/^tuic:\/\/([^:]+):([^@]+)@([^:/?#]+):(\d+)\??([^#]*)#?(.*)/);
        if (!m) return null;
        const [, uuid, password, server, portStr, qs, remarkRaw] = m;
        const params = new URLSearchParams(qs);
        const name = remarkRaw ? safeDecodeURIComponent(remarkRaw) : `tuic-${server}:${portStr}`;
        const port = parseInt(portStr);

        const config: any = {
            type: 'tuic',
            tag: name,
            server,
            server_port: port,
            uuid: safeDecodeURIComponent(uuid),
            password: safeDecodeURIComponent(password),
            congestion_control: params.get('congestion_control') || params.get('cc') || 'bbr',
            udp_relay_mode: params.get('udp_relay_mode') || 'native',
            tls: { enabled: true, server_name: params.get('sni') || server },
        };
        if (params.get('alpn')) config.tls.alpn = params.get('alpn')!.split(',').map(s => s.trim());

        return { name, type: 'tuic', server, port, config };
    }
};
