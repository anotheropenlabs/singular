
import { sqliteTable, integer, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Helper for current timestamp in seconds (Unix)
const currentTimestamp = sql`(strftime('%s', 'now'))`;

export const admin = sqliteTable('admin', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull().unique(),
    password_hash: text('password_hash').notNull(),
    created_at: integer('created_at').notNull().default(currentTimestamp),
});

export const settings = sqliteTable('settings', {
    key: text('key').primaryKey(),
    value: text('value'),
});

// The inbound table is removed in favor of raw_config

export const nodeUser = sqliteTable('node_user', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull().unique(),
    uuid: text('uuid').notNull().unique(),
    password: text('password'),
    traffic_limit: integer('traffic_limit').notNull().default(0),
    traffic_used: integer('traffic_used').notNull().default(0),
    expire_at: integer('expire_at'), // Unix timestamp
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    allowed_inbounds: text('allowed_inbounds'), // JSON array
    up: integer('up').notNull().default(0),
    down: integer('down').notNull().default(0),
    created_at: integer('created_at').notNull().default(currentTimestamp),
}, (table) => {
    return {
        uuidIdx: index('idx_node_user_uuid').on(table.uuid),
    };
});

export const ipBlacklist = sqliteTable('ip_blacklist', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    ip: text('ip').notNull().unique(),
    reason: text('reason'),
    created_at: integer('created_at').notNull().default(currentTimestamp),
}, (table) => {
    return {
        ipIdx: index('idx_ip_blacklist_ip').on(table.ip),
    };
});

export const loginAttempts = sqliteTable('login_attempts', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    ip: text('ip').notNull(),
    username: text('username'),
    success: integer('success', { mode: 'boolean' }).notNull().default(false),
    created_at: integer('created_at').notNull().default(currentTimestamp),
}, (table) => {
    return {
        ipCreatedIdx: index('idx_login_attempts_ip_created').on(table.ip, table.created_at),
    };
});

export const auditLogs = sqliteTable('audit_logs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    action: text('action').notNull(),
    target: text('target'),
    details: text('details'), // JSON string
    ip: text('ip'),
    created_at: integer('created_at').notNull().default(currentTimestamp),
}, (table) => {
    return {
        createdIdx: index('idx_audit_logs_created').on(table.created_at),
    };
});

export const trafficStats = sqliteTable('traffic_stats', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    user_id: integer('user_id').references(() => nodeUser.id, { onDelete: 'set null' }),
    // inbound_id is removed as inbound table is deleted
    upload: integer('upload').default(0),
    download: integer('download').default(0),
    timestamp: integer('timestamp').notNull().default(currentTimestamp),
}, (table) => {
    return {
        timestampIdx: index('idx_traffic_stats_timestamp').on(table.timestamp),
        userIdIdx: index('idx_traffic_stats_user').on(table.user_id),
        // Composite index for user+time range queries (e.g. "user traffic in last 7 days")
        userTimeIdx: index('idx_traffic_stats_user_time').on(table.user_id, table.timestamp),
    };
});

export const certificates = sqliteTable('certificates', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    type: text('type').notNull(),
    domain: text('domain').notNull(),
    cert_path: text('cert_path').notNull(),
    key_path: text('key_path').notNull(),
    expires_at: integer('expires_at').notNull(),
    auto_renew: integer('auto_renew', { mode: 'boolean' }).notNull().default(false),
    created_at: integer('created_at').notNull().default(currentTimestamp),
});

// ==================== Global Singbox Modules (Raw JSON) ====================

// For highly complex modules like inbounds, route, dns, and experimental
export const rawConfig = sqliteTable('raw_config', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    side: text('side').notNull().default('server'), // 'server' | 'client'
    type: text('type').notNull(), // 'inbounds' | 'route' | 'dns' | 'experimental'
    content: text('content').notNull(), // Pure JSON string
    updated_at: integer('updated_at').notNull().default(currentTimestamp),
}, (table) => ({
    sideTypeIdx: uniqueIndex('idx_raw_config_side_type').on(table.side, table.type),
}));

// ==================== Outbounds / Nodes (Client Mode) ====================

// 订阅源 (Providers) — 客户端消费远程订阅
export const provider = sqliteTable('provider', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    side: text('side').notNull().default('client'),
    name: text('name').notNull(),
    url: text('url').notNull(),
    user_agent: text('user_agent').default('sing-box'),
    subscription_type: text('subscription_type').notNull().default('auto'), // auto/base64/uri/singbox/clash/sip008
    update_interval: integer('update_interval').notNull().default(86400), // seconds
    last_update_at: integer('last_update_at'),
    node_count: integer('node_count').notNull().default(0),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    created_at: integer('created_at').notNull().default(currentTimestamp),
});

// 代理节点 — 从订阅解析或手动添加
export const proxyNode = sqliteTable('proxy_node', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    side: text('side').notNull().default('client'),
    provider_id: integer('provider_id').references(() => provider.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(), // vless/vmess/trojan/shadowsocks/hysteria2/tuic...
    server: text('server').notNull(),
    port: integer('port').notNull(),
    config: text('config').notNull(), // JSON: full outbound config
    latency: integer('latency'), // ms, NULL = untested
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    created_at: integer('created_at').notNull().default(currentTimestamp),
}, (table) => {
    return {
        providerIdx: index('idx_proxy_node_provider').on(table.provider_id),
    };
});

// 代理组 — Selector / URLTest / Fallback
export const proxyGroup = sqliteTable('proxy_group', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    side: text('side').notNull().default('client'),
    name: text('name').notNull().unique(),
    type: text('type').notNull(), // selector / urltest / fallback
    node_filter: text('node_filter'), // filter expression for dynamic matching
    config: text('config'), // JSON: { test_url, interval, tolerance, ... }
    sort_order: integer('sort_order').notNull().default(0),
});

// Removed routingRule, dnsServer, and dnsRule in favor of raw_config

