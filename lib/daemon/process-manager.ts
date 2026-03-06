import os from 'os';
import { db, settings } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { ProcessStrategy } from './process/strategy';
import { WindowsStrategy } from './process/platform/windows';
import { LinuxStrategy } from './process/platform/linux';
import { MacOSStrategy } from './process/platform/macos';

// Factory to get correct strategy
function getProcessStrategy(): ProcessStrategy {
    const platform = os.platform();
    switch (platform) {
        case 'win32':
            return new WindowsStrategy();
        case 'darwin':
            return new MacOSStrategy();
        case 'linux':
            return new LinuxStrategy();
        default:
            // Default to Linux strategy as it's most generic for POSIX
            return new LinuxStrategy();
    }
}

const strategy = getProcessStrategy();


import { DEFAULT_SINGBOX_SETTINGS, SETTINGS_KEYS } from '@/lib/settings-defaults';
import fs from 'fs';

export async function getSingboxPath(): Promise<string> {
    // Check mode
    const mode = await db.select().from(settings).where(eq(settings.key, SETTINGS_KEYS.APP_SYSTEM_CONFIG_MODE)).get();
    if (mode?.value === 'manual') {
        const setting = await db.select().from(settings).where(eq(settings.key, SETTINGS_KEYS.SINGBOX_BINARY_PATH)).get();
        if (setting?.value) return setting.value;
    }
    return strategy.getBinaryPath() || DEFAULT_SINGBOX_SETTINGS.singbox_binary_path;
}

export async function getConfigPath(): Promise<string> {
    const mode = await db.select().from(settings).where(eq(settings.key, SETTINGS_KEYS.APP_SYSTEM_CONFIG_MODE)).get();
    if (mode?.value === 'manual') {
        const setting = await db.select().from(settings).where(eq(settings.key, SETTINGS_KEYS.SINGBOX_CONFIG_PATH)).get();
        if (setting?.value) return setting.value;
    }
    return strategy.getConfigPath() || DEFAULT_SINGBOX_SETTINGS.singbox_config_path;
}

export async function getLogPath(): Promise<string> {
    const mode = await db.select().from(settings).where(eq(settings.key, SETTINGS_KEYS.APP_SYSTEM_CONFIG_MODE)).get();

    // 1. DB Setting (Only in Manual Mode)
    if (mode?.value === 'manual') {
        const setting = await db.select().from(settings).where(eq(settings.key, SETTINGS_KEYS.SINGBOX_LOG_PATH)).get();
        if (setting?.value) return setting.value;
    }

    // 2. Config File explicit output
    try {
        const configPath = await getConfigPath();
        if (fs.existsSync(configPath)) {
            const configContent = fs.readFileSync(configPath, 'utf-8');
            // Basic parsing
            const config = JSON.parse(configContent);
            if (config.log?.output) {
                return config.log.output;
            }
        }
    } catch (e) {
        console.warn('Failed to parse config for log path:', e);
    }

    // 3. Default
    return DEFAULT_SINGBOX_SETTINGS.singbox_log_path;
}

// getVersion removed, use lib/singbox/version.ts instead

export async function startService(): Promise<void> {
    const binPath = await getSingboxPath();
    const configPath = await getConfigPath();
    return strategy.start(binPath, configPath);
}

export async function stopService(): Promise<void> {
    return strategy.stop();
}

export async function restartService(): Promise<void> {
    await stopService();
    // Tiny delay to ensure port release
    await new Promise(r => setTimeout(r, 1000));
    await startService();
}

export async function getServiceStatus(): Promise<'running' | 'stopped' | 'error'> {
    return strategy.getStatus();
}

import pidusage from 'pidusage';

export async function getPid(): Promise<number | null> {
    return strategy.getPid();
}

export async function getResourceUsage(): Promise<{ cpu: number; memory: number; pid: number | null; elapsed: number }> {
    try {
        const pid = await strategy.getPid();
        if (!pid) return { cpu: 0, memory: 0, pid: null, elapsed: 0 };

        const stats = await pidusage(pid);
        return {
            cpu: stats.cpu,
            memory: stats.memory, // in bytes
            pid: pid,
            elapsed: stats.elapsed // in ms
        };
    } catch (e) {
        // console.error('Failed to get process stats:', e);
        return { cpu: 0, memory: 0, pid: null, elapsed: 0 };
    }
}
