import { ProtocolDefinition } from './types';
import { Lock } from 'lucide-react';
import { z } from 'zod';
import { safeDecodeURIComponent } from './utils';

export const shadowsocks: ProtocolDefinition = {
    id: 'shadowsocks',
    aliases: ['ss://'],
    name: 'Shadowsocks',
    color: 'text-sing-cyan',
    icon: Lock,
    description: 'Secure socks5-like protocol.',

    sections: [
        {
            id: 'credentials',
            title: 'Credentials',
            fields: [
                {
                    key: 'method',
                    label: 'Method',
                    type: 'select',
                    options: [
                        { label: 'AES-128-GCM', value: 'aes-128-gcm' },
                        { label: 'AES-256-GCM', value: 'aes-256-gcm' },
                        { label: 'ChaCha20-Poly1305', value: 'chacha20-ietf-poly1305' },
                        { label: '2022-BLAKE3-AES-128-GCM', value: '2022-blake3-aes-128-gcm' },
                        { label: '2022-BLAKE3-AES-256-GCM', value: '2022-blake3-aes-256-gcm' },
                    ],
                    defaultValue: 'aes-256-gcm'
                },
                {
                    key: 'password',
                    label: 'Password',
                    type: 'password',
                    placeholder: 'Required',
                    required: true
                }
            ]
        }
    ],

    schema: z.object({
        method: z.string().min(1, 'Method is required'),
        password: z.string().min(1, 'Password is required'),
    }),

    toSingBoxConfig: (data) => {
        return {
            type: 'shadowsocks',
            method: data.method,
            password: data.password,
        };
    },

    fromSingBoxConfig: (json) => {
        return {
            method: json.method,
            password: json.password,
        };
    },

    generateLink: (inbound, user, host) => {
        const config = JSON.parse(inbound.config);
        // SS usually single user per port in simple setup, or password per user?
        // Sing-box SS inbound: "users": [{"name", "password"}] if multi-user? No, SS is single password typically unless using multi-user plugins.
        // Wait, Sing-box SS implementation:
        // "password": "..." (single)
        // OR "users": [...] (2022 format?)
        // Our schema only supports `method` and `password` at inbound level.
        // So all users share the password? 
        // If `config.password` exists, use it. `user.password` might be irrelevant for SS in this simple mode.
        // BUT, if we want multi-user SS, we need 2022 or specific setup.
        // Assuming simple single-password SS for now as per schema.

        const method = config.method;
        const password = config.password;

        const userInfo = btoa(`${method}:${password}`);
        const safeName = encodeURIComponent(`${inbound.tag}`);

        return `ss://${userInfo}@${host}:${inbound.port}#${safeName}`;
    },

    parseUri: (uri: string) => {
        // ss://base64(method:password)@host:port#remark   (SIP002)
        // ss://base64(method:password@host:port)#remark   (legacy)
        const hashIdx = uri.indexOf('#');
        const remarkRaw = hashIdx > -1 ? uri.slice(hashIdx + 1) : '';
        const main = hashIdx > -1 ? uri.slice(5, hashIdx) : uri.slice(5);

        let method: string, password: string, server: string, port: number;

        try {
            if (main.includes('@')) {
                // SIP002: base64(method:password)@host:port
                const atIdx = main.lastIndexOf('@');
                const creds = Buffer.from(main.slice(0, atIdx), 'base64').toString('utf-8');
                const colonIdx = creds.indexOf(':');
                method = creds.slice(0, colonIdx);
                password = creds.slice(colonIdx + 1);
                const [h, p] = main.slice(atIdx + 1).split(':');
                server = h; port = parseInt(p);
            } else {
                // Legacy: base64(method:password@host:port)
                const decoded = Buffer.from(main, 'base64').toString('utf-8');
                const atIdx = decoded.lastIndexOf('@');
                const creds = decoded.slice(0, atIdx);
                const colonIdx = creds.indexOf(':');
                method = creds.slice(0, colonIdx);
                password = creds.slice(colonIdx + 1);
                const [h, p] = decoded.slice(atIdx + 1).split(':');
                server = h; port = parseInt(p);
            }
        } catch {
            return null;
        }

        if (!server || !port || isNaN(port)) return null;
        const name = remarkRaw ? safeDecodeURIComponent(remarkRaw) : `ss-${server}:${port}`;
        const config: any = { type: 'shadowsocks', tag: name, server, server_port: port, method, password };
        return { name, type: 'shadowsocks', server, port, config };
    }
};
