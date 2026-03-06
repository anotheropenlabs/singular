
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';

// --- Database Types (Inferred from Drizzle Schema) ---
// We keep this file to serve as a central export point for types used throughout the app.
// This decouples the app from the specific ORM implementation details (mostly).

export type Admin = InferSelectModel<typeof schema.admin>;
export type NewAdmin = InferInsertModel<typeof schema.admin>;

export type Setting = InferSelectModel<typeof schema.settings>;

export interface Inbound {
  id: number;
  side: string;
  tag: string;
  protocol: string;
  port: number;
  config: string; // JSON string
  enabled: boolean;
  certificate_id?: number | null;
  created_at: number;
  updated_at: number;
}
export type NewInbound = Omit<Inbound, 'id' | 'created_at' | 'updated_at'>;

export type NodeUser = InferSelectModel<typeof schema.nodeUser>;
export type NewNodeUser = InferInsertModel<typeof schema.nodeUser>;

export type IPBlacklist = InferSelectModel<typeof schema.ipBlacklist>;
export type LoginAttempt = InferSelectModel<typeof schema.loginAttempts>;
export type AuditLog = InferSelectModel<typeof schema.auditLogs>;
export type TrafficStats = InferSelectModel<typeof schema.trafficStats>;
export type Certificate = InferSelectModel<typeof schema.certificates>;

// Client Mode Types
export type Provider = InferSelectModel<typeof schema.provider>;
export type NewProvider = InferInsertModel<typeof schema.provider>;
export type ProxyNode = InferSelectModel<typeof schema.proxyNode>;
export type NewProxyNode = InferInsertModel<typeof schema.proxyNode>;
export type ProxyGroup = InferSelectModel<typeof schema.proxyGroup>;
export type NewProxyGroup = InferInsertModel<typeof schema.proxyGroup>;

// --- App Types ---

export type SystemMode = 'server' | 'client';

export interface AppSettings {
  app_server_host: string;
  app_subscription_host: string;
  app_subscription_port: string;
  singbox_binary_path: string;
  singbox_config_path: string;
  singbox_clash_api_port: string;
  singbox_clash_api_secret: string;
  app_traffic_reset_mode: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  app_traffic_reset_day: string;
}

export type Protocol = 'vless' | 'vmess' | 'trojan' | 'shadowsocks' | 'hysteria2' | 'hysteria' | 'tuic';

export interface InboundConfig {
  type: Protocol;
  tag: string;
  listen: string;
  listen_port: number;
  users?: unknown[];
  tls?: unknown;
  transport?: unknown;
  [key: string]: unknown;
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
