import { z } from 'zod';

// ── User Validators ────────────────────────────────────────────────────────

export const userSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().optional(),
    traffic_limit: z.number().int().min(0).optional().default(0),
    expire_at: z.number().int().nullable().optional(),
    enabled: z.boolean().optional().default(true),
    allowed_inbounds: z.array(z.number()).optional(),
});

export type UserFormValues = z.infer<typeof userSchema>;

// ── Inbound Validators ─────────────────────────────────────────────────────

export const inboundSchema = z.object({
    tag: z.string().min(1, 'Tag is required'),
    protocol: z.string().min(1, 'Protocol is required'),
    port: z.number().int().min(1).max(65535),
    config: z.record(z.unknown()).optional(),
    enabled: z.boolean().optional().default(true),
    certificate_id: z.number().nullable().optional(),
});

export type InboundFormValues = z.infer<typeof inboundSchema>;
