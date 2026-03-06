export interface SingBoxSettingsValues {
    // ==========================================
    // 1. Core Daemon & Paths
    // ==========================================
    app_system_config_mode: 'auto' | 'manual';
    singbox_binary_path: string;
    singbox_config_path: string;
    singbox_log_path: string;
    singbox_log_level: string;
    singbox_log_timestamp: string;

    // ==========================================
    // 2. Control API (Clash)
    // ==========================================
    singbox_clash_api_port: string;
    singbox_clash_api_secret: string;

    // ==========================================
    // 3. UI Dashboard Refresh Intervals (ms)
    // ==========================================
    app_traffic_refresh_interval: string;
    app_connections_refresh_interval: string;
    app_system_stats_refresh_interval: string;

    // ==========================================
    // 4. Data Collection, Database & Cache Rules
    // ==========================================
    app_traffic_collection_interval: string;
    app_traffic_retention_days: string;
    app_traffic_user_cache_ttl_mins: string;
    app_traffic_inbound_cache_ttl_mins: string;

    // ==========================================
    // 5. Subscription & Server Integration
    // ==========================================
    app_server_host: string;
    app_subscription_host: string;
    app_subscription_port: string;

    // ==========================================
    // 6. User Traffic Reset Rules
    // ==========================================
    app_traffic_reset_mode: string;
    app_traffic_reset_day: string;

    // ==========================================
    // 7. Proxy Test Parameters
    // ==========================================
    app_url_test_timeout: string;
}

export const SETTINGS_KEYS = {
    APP_SYSTEM_CONFIG_MODE: 'app_system_config_mode',
    SINGBOX_BINARY_PATH: 'singbox_binary_path',
    SINGBOX_CONFIG_PATH: 'singbox_config_path',
    SINGBOX_LOG_PATH: 'singbox_log_path',
    SINGBOX_LOG_LEVEL: 'singbox_log_level',
    SINGBOX_LOG_TIMESTAMP: 'singbox_log_timestamp',
    SINGBOX_CLASH_API_PORT: 'singbox_clash_api_port',
    SINGBOX_CLASH_API_SECRET: 'singbox_clash_api_secret',
    APP_TRAFFIC_REFRESH_INTERVAL: 'app_traffic_refresh_interval',
    APP_CONNECTIONS_REFRESH_INTERVAL: 'app_connections_refresh_interval',
    APP_SYSTEM_STATS_REFRESH_INTERVAL: 'app_system_stats_refresh_interval',
    APP_TRAFFIC_COLLECTION_INTERVAL: 'app_traffic_collection_interval',
    APP_TRAFFIC_RETENTION_DAYS: 'app_traffic_retention_days',
    APP_TRAFFIC_USER_CACHE_TTL_MINS: 'app_traffic_user_cache_ttl_mins',
    APP_TRAFFIC_INBOUND_CACHE_TTL_MINS: 'app_traffic_inbound_cache_ttl_mins',
    APP_SERVER_HOST: 'app_server_host',
    APP_SUBSCRIPTION_HOST: 'app_subscription_host',
    APP_SUBSCRIPTION_PORT: 'app_subscription_port',
    APP_TRAFFIC_RESET_MODE: 'app_traffic_reset_mode',
    APP_TRAFFIC_RESET_DAY: 'app_traffic_reset_day',
    APP_URL_TEST_TIMEOUT: 'app_url_test_timeout',
} as const;

export const DEFAULT_SINGBOX_SETTINGS: SingBoxSettingsValues = {
    // Core
    app_system_config_mode: 'auto',
    singbox_binary_path: 'sing-box',
    singbox_config_path: 'config.json',
    singbox_log_path: 'sing-box.log',
    singbox_log_level: 'info',
    singbox_log_timestamp: 'true',

    // API
    singbox_clash_api_port: '9090',
    singbox_clash_api_secret: '',

    // Dashboard UI Intervals
    app_traffic_refresh_interval: '5000',
    app_connections_refresh_interval: '2000',
    app_system_stats_refresh_interval: '5000',

    // DB & Caches
    app_traffic_collection_interval: '2000',
    app_traffic_retention_days: '1',
    app_traffic_user_cache_ttl_mins: '5',
    app_traffic_inbound_cache_ttl_mins: '10',

    // Subscription
    app_server_host: '',
    app_subscription_host: '',
    app_subscription_port: '80',

    // Reset Rules
    app_traffic_reset_mode: 'monthly',
    app_traffic_reset_day: '1',

    // Latency tests
    app_url_test_timeout: '5000',
};
