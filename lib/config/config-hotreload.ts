import { generateConfig } from './config-generator';
import { restartService, getConfigPath } from '@/lib/daemon/process-manager';
import fs from 'fs/promises';

export interface ReloadResult {
    success: boolean;
    message?: string;
    error?: string;
}

let isReloading = false;

export async function regenerateConfigAndReload(): Promise<ReloadResult> {
    // Prevent concurrent reloads
    if (isReloading) {
        return { success: false, error: 'Config reload already in progress' };
    }

    isReloading = true;

    try {
        console.log('[Config Reload] Generating new configuration...');

        // 1. Generate new config
        const config = await generateConfig();

        // 2. Write to file
        const configPath = await getConfigPath();
        await fs.writeFile(configPath, config, 'utf-8');

        console.log(`[Config Reload] Config written to ${configPath}`);

        // 3. Restart service
        console.log('[Config Reload] Restarting sing-box...');
        await restartService();

        console.log('[Config Reload] Service restarted successfully');

        return { success: true, message: 'Configuration regenerated and service reloaded' };
    } catch (e: any) {
        console.error('[Config Reload] Failed:', e);
        return { success: false, error: e.message || 'Unknown error' };
    } finally {
        isReloading = false;
    }
}

/**
 * Check if a reload is currently in progress
 */
export function isReloadInProgress(): boolean {
    return isReloading;
}
