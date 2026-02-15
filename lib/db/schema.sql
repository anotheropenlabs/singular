-- SingUI Database Schema
-- SQLite with better-sqlite3

-- Admin table for authentication
CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Settings table for key-value configuration
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Inbound table for sing-box inbound configurations
CREATE TABLE IF NOT EXISTS inbound (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag TEXT UNIQUE NOT NULL,
    protocol TEXT NOT NULL,
    port INTEGER NOT NULL,
    config TEXT NOT NULL, -- JSON string
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Node users table for VPN/proxy users
CREATE TABLE IF NOT EXISTS node_user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    uuid TEXT UNIQUE NOT NULL,
    password TEXT,
    traffic_limit INTEGER NOT NULL DEFAULT 0, -- bytes, 0 = unlimited
    traffic_used INTEGER NOT NULL DEFAULT 0, -- bytes
    expire_at INTEGER, -- Unix timestamp, NULL = never expires
    enabled INTEGER NOT NULL DEFAULT 1,
    allowed_inbounds TEXT, -- JSON array of inbound IDs
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- IP blacklist table
CREATE TABLE IF NOT EXISTS ip_blacklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT UNIQUE NOT NULL,
    reason TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Login attempts table for security monitoring
CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL,
    username TEXT,
    success INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Audit logs table for tracking actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    target TEXT,
    details TEXT, -- JSON string
    ip TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_created
    ON login_attempts(ip, created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created
    ON audit_logs(created_at);
