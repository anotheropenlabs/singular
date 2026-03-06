CREATE TABLE `admin` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_username_unique` ON `admin` (`username`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action` text NOT NULL,
	`target` text,
	`details` text,
	`ip` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_created` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`domain` text NOT NULL,
	`cert_path` text NOT NULL,
	`key_path` text NOT NULL,
	`expires_at` integer NOT NULL,
	`auto_renew` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_name_unique` ON `certificates` (`name`);--> statement-breakpoint
CREATE TABLE `dns_config` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`side` text NOT NULL,
	`independent_cache` integer DEFAULT false NOT NULL,
	`final_server` text,
	`strategy` text,
	`disable_cache` integer DEFAULT false NOT NULL,
	`disable_expire` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dns_config_side_unique` ON `dns_config` (`side`);--> statement-breakpoint
CREATE TABLE `dns_rule` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`side` text DEFAULT 'server' NOT NULL,
	`name` text,
	`type` text NOT NULL,
	`value` text NOT NULL,
	`server` text NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_dns_rule_side_priority` ON `dns_rule` (`side`,`priority`);--> statement-breakpoint
CREATE TABLE `dns_server` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`side` text DEFAULT 'server' NOT NULL,
	`tag` text NOT NULL,
	`type` text NOT NULL,
	`server` text NOT NULL,
	`detour` text,
	`config` text,
	`enabled` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dns_server_tag_unique` ON `dns_server` (`tag`);--> statement-breakpoint
CREATE INDEX `idx_dns_server_side` ON `dns_server` (`side`);--> statement-breakpoint
CREATE TABLE `inbound` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`side` text DEFAULT 'server' NOT NULL,
	`tag` text NOT NULL,
	`protocol` text NOT NULL,
	`port` integer NOT NULL,
	`config` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`certificate_id` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`certificate_id`) REFERENCES `certificates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inbound_tag_unique` ON `inbound` (`tag`);--> statement-breakpoint
CREATE INDEX `idx_inbound_certificate` ON `inbound` (`certificate_id`);--> statement-breakpoint
CREATE TABLE `ip_blacklist` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ip` text NOT NULL,
	`reason` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ip_blacklist_ip_unique` ON `ip_blacklist` (`ip`);--> statement-breakpoint
CREATE INDEX `idx_ip_blacklist_ip` ON `ip_blacklist` (`ip`);--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ip` text NOT NULL,
	`username` text,
	`success` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_login_attempts_ip_created` ON `login_attempts` (`ip`,`created_at`);--> statement-breakpoint
CREATE TABLE `node_user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`uuid` text NOT NULL,
	`password` text,
	`traffic_limit` integer DEFAULT 0 NOT NULL,
	`traffic_used` integer DEFAULT 0 NOT NULL,
	`expire_at` integer,
	`enabled` integer DEFAULT true NOT NULL,
	`allowed_inbounds` text,
	`up` integer DEFAULT 0 NOT NULL,
	`down` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `node_user_username_unique` ON `node_user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `node_user_uuid_unique` ON `node_user` (`uuid`);--> statement-breakpoint
CREATE INDEX `idx_node_user_uuid` ON `node_user` (`uuid`);--> statement-breakpoint
CREATE TABLE `provider` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`side` text DEFAULT 'client' NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`user_agent` text DEFAULT 'sing-box',
	`subscription_type` text DEFAULT 'auto' NOT NULL,
	`update_interval` integer DEFAULT 86400 NOT NULL,
	`last_update_at` integer,
	`node_count` integer DEFAULT 0 NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `proxy_group` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`side` text DEFAULT 'client' NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`node_filter` text,
	`config` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `proxy_group_name_unique` ON `proxy_group` (`name`);--> statement-breakpoint
CREATE TABLE `proxy_node` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`side` text DEFAULT 'client' NOT NULL,
	`provider_id` integer,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`server` text NOT NULL,
	`port` integer NOT NULL,
	`config` text NOT NULL,
	`latency` integer,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`provider_id`) REFERENCES `provider`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_proxy_node_provider` ON `proxy_node` (`provider_id`);--> statement-breakpoint
CREATE TABLE `route_config` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`side` text NOT NULL,
	`geoip_download_url` text,
	`geosite_download_url` text,
	`final_outbound` text,
	`auto_detect_interface` integer DEFAULT true NOT NULL,
	`override_android_vpn` integer DEFAULT false NOT NULL,
	`default_mark` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `route_config_side_unique` ON `route_config` (`side`);--> statement-breakpoint
CREATE TABLE `routing_rule` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`side` text DEFAULT 'server' NOT NULL,
	`name` text,
	`category` text DEFAULT 'route' NOT NULL,
	`type` text NOT NULL,
	`value` text NOT NULL,
	`outbound` text NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`enabled` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_routing_rule_side_category` ON `routing_rule` (`side`,`category`);--> statement-breakpoint
CREATE INDEX `idx_routing_rule_priority` ON `routing_rule` (`priority`);--> statement-breakpoint
CREATE TABLE `rule_set` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`side` text DEFAULT 'client' NOT NULL,
	`tag` text NOT NULL,
	`type` text NOT NULL,
	`format` text DEFAULT 'binary' NOT NULL,
	`url` text,
	`path` text,
	`download_detour` text,
	`update_interval` text,
	`enabled` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rule_set_tag_unique` ON `rule_set` (`tag`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
--> statement-breakpoint
CREATE TABLE `traffic_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`inbound_id` integer,
	`upload` integer DEFAULT 0,
	`download` integer DEFAULT 0,
	`timestamp` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `node_user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`inbound_id`) REFERENCES `inbound`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_traffic_stats_timestamp` ON `traffic_stats` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_traffic_stats_user` ON `traffic_stats` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_traffic_stats_user_time` ON `traffic_stats` (`user_id`,`timestamp`);