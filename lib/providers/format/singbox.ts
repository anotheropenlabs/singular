/**
 * format/singbox.ts — Sing-box JSON format handler
 *
 * Accepts: JSON with `outbounds` array
 * Skips: routing/built-in outbounds (direct, block, dns, selector, urltest, fallback)
 */
import { FormatHandler, ParsedNode } from '../types';

// We want to capture groups ('selector', 'urltest') and basic types ('direct', 'block', 'dns')
// so we don't have a SKIP_TYPES list anymore.

export const singboxHandler: FormatHandler = {
    format: 'singbox',

    detect(raw: string): boolean {
        if (!raw.startsWith('{')) return false;
        try {
            const json = JSON.parse(raw);
            return Array.isArray(json.outbounds);
        } catch {
            return false;
        }
    },

    parse(raw: string): ParsedNode[] {
        const json = JSON.parse(raw);
        const outbounds: any[] = json.outbounds || [];

        return outbounds
            .filter(ob => ob && ob.type)
            .map(ob => ({
                name: ob.tag || `${ob.type}-unnamed`,
                type: ob.type,
                // Server and port might be undefined for group types, which is fine
                server: ob.server || '',
                port: Number(ob.server_port) || 0,
                config: ob,
            }));
    },
};
