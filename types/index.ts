// Admin
export interface Admin {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

// Settings
export interface Setting {
  key: string;
  value: string;
}

export interface AppSettings {
  server_host: string;
  subscription_host: string;
  subscription_port: string;
  singbox_binary_path: string;
  singbox_config_path: string;
  clash_api_port: string;
  clash_api_secret: string;
  traffic_reset_mode: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  traffic_reset_day: string;
}

// Inbound
export interface Inbound {
  id: number;
  tag: string;
  protocol: Protocol;
  port: number;
  config: string; // JSON string
  enabled: boolean;
  created_at: string;
  updated_at: string;
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

// User
export interface NodeUser {
  id: number;
  username: string;
  uuid: string;
  password: string | null;
  traffic_limit: number;
  traffic_used: number;
  expire_at: string | null;
  enabled: boolean;
  allowed_inbounds: string | null; // JSON array of inbound IDs
  created_at: string;
}

// IP Blacklist
export interface IPBlacklist {
  id: number;
  ip: string;
  reason: string | null;
  created_at: string;
}

// Login Attempt
export interface LoginAttempt {
  id: number;
  ip: string;
  username: string | null;
  success: boolean;
  created_at: string;
}

// Audit Log
export interface AuditLog {
  id: number;
  action: string;
  target: string | null;
  details: string | null;
  ip: string;
  created_at: string;
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
