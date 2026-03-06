/**
 * lib/cache.ts — 轻量级 TTL 内存缓存
 * 避免频繁查询数据库获取不常变化的配置值
 */

interface CacheEntry<V> {
    value: V;
    expires: number;
}

export class TTLCache<K, V> {
    private map = new Map<K, CacheEntry<V>>();

    set(key: K, value: V, ttlMs: number): void {
        this.map.set(key, { value, expires: Date.now() + ttlMs });
    }

    get(key: K): V | undefined {
        const entry = this.map.get(key);
        if (!entry) return undefined;
        if (Date.now() > entry.expires) {
            this.map.delete(key);
            return undefined;
        }
        return entry.value;
    }

    invalidate(key: K): void {
        this.map.delete(key);
    }

    invalidateAll(): void {
        this.map.clear();
    }

    has(key: K): boolean {
        return this.get(key) !== undefined;
    }
}

// Singleton caches
export const settingsCache = new TTLCache<string, string>();
export const userIdCache = new TTLCache<string, number | null>();
export const inboundIdCache = new TTLCache<string, number | null>();
