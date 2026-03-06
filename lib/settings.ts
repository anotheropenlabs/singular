import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { settingsCache } from '@/lib/cache';

const SETTINGS_TTL = 60_000; // 1 分钟缓存

export async function getSetting(key: string, defaultValue = ''): Promise<string> {
    const cached = settingsCache.get(key);
    if (cached !== undefined) return cached;

    try {
        const row = await db.select().from(settings).where(eq(settings.key, key)).get();
        const value = row?.value ?? defaultValue;
        settingsCache.set(key, value, SETTINGS_TTL);
        return value;
    } catch {
        return defaultValue;
    }
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    const missing: string[] = [];

    for (const key of keys) {
        const cached = settingsCache.get(key);
        if (cached !== undefined) {
            result[key] = cached;
        } else {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        try {
            const rows = await db.select().from(settings).all();
            for (const row of rows) {
                if (missing.includes(row.key)) {
                    const value = row.value ?? '';
                    settingsCache.set(row.key, value, SETTINGS_TTL);
                    result[row.key] = value;
                }
            }
        } catch { }
    }

    // Fill defaults for any still missing
    for (const key of keys) {
        if (!(key in result)) result[key] = '';
    }

    return result;
}

export function invalidateSetting(key: string): void {
    settingsCache.invalidate(key);
}

export function invalidateAllSettings(): void {
    settingsCache.invalidateAll();
}

export async function getSystemMode(): Promise<'server' | 'client'> {
    const mode = await getSetting('system_mode', 'server');
    return mode as 'server' | 'client';
}
