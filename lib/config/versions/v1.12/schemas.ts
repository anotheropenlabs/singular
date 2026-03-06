
import { z } from 'zod';
import {
    singBoxConfigV110Schema,
    portSchema,
    vlessUserSchema,
    vmessUserSchema,
    simpleUserSchema,
    tlsConfigSchema,
    transportSchema
} from '../v1.10/schemas';

// --- Inbounds v1.12 (Strict Output — NO sniff) ---
const baseInboundSchemaV112 = z.object({
    tag: z.string().min(1),
    listen: z.string().default('::'),
    listen_port: portSchema,
});

export const inboundVLessSchemaV112 = baseInboundSchemaV112.extend({
    type: z.literal('vless'),
    users: z.array(vlessUserSchema),
    tls: tlsConfigSchema,
    transport: transportSchema,
});

export const inboundVMessSchemaV112 = baseInboundSchemaV112.extend({
    type: z.literal('vmess'),
    users: z.array(vmessUserSchema),
    tls: tlsConfigSchema,
    transport: transportSchema,
});

export const inboundTrojanSchemaV112 = baseInboundSchemaV112.extend({
    type: z.literal('trojan'),
    users: z.array(simpleUserSchema),
    tls: tlsConfigSchema,
    transport: transportSchema,
    multiplex: z.any().optional(),
});

export const inboundShadowsocksSchemaV112 = baseInboundSchemaV112.extend({
    type: z.literal('shadowsocks'),
    method: z.string(),
    password: z.string(),
    network: z.enum(['tcp', 'udp']).optional(),
});

export const inboundHysteria2SchemaV112 = baseInboundSchemaV112.extend({
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

export const inboundSchemaV112 = z.discriminatedUnion('type', [
    inboundVLessSchemaV112,
    inboundVMessSchemaV112,
    inboundTrojanSchemaV112,
    inboundShadowsocksSchemaV112,
    inboundHysteria2SchemaV112,
]);

// --- DNS v1.12 ---
export const dnsServerSchemaV112 = z.union([
    z.object({ type: z.literal('local'), tag: z.string().optional() }),
    z.object({ type: z.literal('tcp'), server: z.string(), server_port: portSchema.optional(), tag: z.string().optional() }),
    z.object({ type: z.literal('udp'), server: z.string(), server_port: portSchema.optional(), tag: z.string().optional() }),
    z.object({ type: z.literal('tls'), server: z.string(), server_port: portSchema.optional(), tag: z.string().optional() }),
    z.object({ type: z.literal('https'), server: z.string(), server_port: portSchema.optional(), path: z.string().optional(), tag: z.string().optional() }),
    z.object({ type: z.literal('quic'), server: z.string(), server_port: portSchema.optional(), tag: z.string().optional() }),
]);

export const singBoxConfigV112Schema = z.object({
    log: singBoxConfigV110Schema.shape.log,
    dns: z.object({
        servers: z.array(dnsServerSchemaV112).optional(),
        rules: z.any().optional(),
        final: z.string().optional(),
        strategy: z.string().optional(),
    }).optional(),
    inbounds: z.array(inboundSchemaV112).optional(),
    outbounds: z.array(z.any()).optional(),
    route: z.object({
        rules: z.array(z.object({
            inbound: z.array(z.string()).optional(),
            action: z.enum(['route', 'route-options', 'reject', 'dns', 'sniff', 'resolve']).optional(),
            outbound: z.string().optional(),
        }).passthrough()).optional()
    }).optional(),
    experimental: z.any().optional(),
});
