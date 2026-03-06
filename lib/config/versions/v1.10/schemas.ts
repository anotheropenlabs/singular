
import { z } from 'zod';

// Zod Schemas for Sing-box v1.10

// --- Common ---
export const portSchema = z.number().int().min(1).max(65535);

// --- User Schemas ---
export const vlessUserSchema = z.object({
    name: z.string().optional(),
    uuid: z.string().uuid(),
    flow: z.string().optional(),
});

export const vmessUserSchema = z.object({
    name: z.string().optional(),
    uuid: z.string().uuid(),
    alterId: z.number().int().default(0),
});

export const simpleUserSchema = z.object({
    name: z.string().optional(),
    password: z.string().min(1),
});

// --- TLS & Transport ---
export const tlsConfigSchema = z.object({
    enabled: z.boolean().optional(),
    server_name: z.string().optional(),
    alpn: z.array(z.string()).optional(),
    min_version: z.string().optional(),
    max_version: z.string().optional(),
    certificate_path: z.string().optional(),
    key_path: z.string().optional(),
    acme: z.object({
        domain: z.array(z.string()).optional(),
        data_directory: z.string().optional(),
        email: z.string().email().optional(),
        provider: z.string().optional(),
    }).optional(),
    reality: z.object({
        enabled: z.boolean().optional(),
        handshake: z.object({
            server: z.string(),
            server_port: portSchema.optional(),
        }),
        private_key: z.string(),
        short_id: z.array(z.string()).optional(),
    }).optional(),
}).optional();

export const transportSchema = z.object({
    type: z.enum(['http', 'grpc', 'ws', 'quic']).optional(),
    path: z.string().optional(),
    service_name: z.string().optional(),
    headers: z.record(z.string(), z.string()).optional(),
}).optional();

// --- Inbounds ---

const baseInboundSchema = z.object({
    tag: z.string().min(1),
    listen: z.string().default('::'),
    listen_port: portSchema,
    sniff: z.boolean().optional(),
    sniff_override_destination: z.boolean().optional(),
});

export const inboundVLessSchema = baseInboundSchema.extend({
    type: z.literal('vless'),
    users: z.array(vlessUserSchema),
    tls: tlsConfigSchema,
    transport: transportSchema,
});

export const inboundVMessSchema = baseInboundSchema.extend({
    type: z.literal('vmess'),
    users: z.array(vmessUserSchema),
    tls: tlsConfigSchema,
    transport: transportSchema,
});

export const inboundTrojanSchema = baseInboundSchema.extend({
    type: z.literal('trojan'),
    users: z.array(simpleUserSchema),
    tls: tlsConfigSchema,
    transport: transportSchema,
});

export const inboundShadowsocksSchema = baseInboundSchema.extend({
    type: z.literal('shadowsocks'),
    method: z.string(),
    password: z.string(),
    network: z.enum(['tcp', 'udp']).optional(),
});

export const inboundHysteria2Schema = baseInboundSchema.extend({
    type: z.literal('hysteria2'),
    users: z.array(simpleUserSchema).optional(),
    up_mbps: z.number().optional(),
    down_mbps: z.number().optional(),
    obfs: z.object({
        type: z.literal('salamander'),
        password: z.string(),
    }).optional(),
    tls: tlsConfigSchema,
});

export const inboundSchema = z.discriminatedUnion('type', [
    inboundVLessSchema,
    inboundVMessSchema,
    inboundTrojanSchema,
    inboundShadowsocksSchema,
    inboundHysteria2Schema,
]);

// --- Main Config ---

export const singBoxConfigV110Schema = z.object({
    log: z.object({
        level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'panic']).optional(),
        timestamp: z.boolean().optional(),
    }).optional(),
    dns: z.any().optional(),
    inbounds: z.array(inboundSchema).optional(),
    outbounds: z.array(z.any()).optional(),
    route: z.any().optional(),
    experimental: z.any().optional(),
});
