
import path from 'path';

export const SINGBOX_DEFAULTS = {
    BINARY_NAME: 'sing-box',
    CONFIG_FILE: 'config.json',
    LOG_FILE: 'sing-box.log',
    // Default paths relative to CWD if not specified
    BINARY_PATH: 'sing-box', // Assumes in PATH or CWD
    CONFIG_PATH: 'config.json',
    LOG_PATH: 'sing-box.log',
};

export const SETTING_KEYS = {
    BINARY_PATH: 'singbox_binary_path',
    CONFIG_PATH: 'singbox_config_path',
    LOG_PATH: 'singbox_log_path',
};

export const LOG_DEFAULTS = {
    LEVEL: 'info',
    TIMESTAMP: true,
};
