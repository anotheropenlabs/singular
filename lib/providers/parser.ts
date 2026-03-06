/**
 * parser.ts — Subscription Parser (Main Entry Point)
 *
 * Architecture: registry of FormatHandler, dispatched by SubscriptionType.
 *
 * Usage:
 *   parseSubscription(rawContent)                     // auto-detect
 *   parseSubscription(rawContent, 'clash')            // explicit format
 *   parseSubscription(rawContent, 'base64')           // force base64 decode
 *
 * Adding a new format: create a FormatHandler in format/ and register it below.
 */

import { SubscriptionType, FormatHandler, ParsedNode } from './types';
import { singboxHandler } from './format/singbox';
import { sip008Handler } from './format/sip008';
import { clashHandler } from './format/clash';
import { uriHandler, base64Handler } from './format/uri';

// ── Re-exports for convenience ────────────────────────────────────────────────
export type { SubscriptionType, ParsedNode };
export { SUBSCRIPTION_TYPES } from './types';

// ── Handler registry (auto-detect order matters) ──────────────────────────────
//
// Detection order for 'auto' mode:
//  1. singbox  — starts with '{' + has outbounds[]
//  2. sip008   — JSON with servers[] of SS entries
//  3. clash    — contains 'proxies:' + '- name:'
//  4. base64   — looks like base64, decodes to URIs
//  5. uri      — plain text URI lines
//
const HANDLERS: FormatHandler[] = [
    singboxHandler,
    sip008Handler,
    clashHandler,
    base64Handler,
    uriHandler,
];

const HANDLER_MAP = new Map<SubscriptionType, FormatHandler>(
    HANDLERS.map(h => [h.format, h])
);

// ── Main entry ────────────────────────────────────────────────────────────────

/**
 * Parse a raw subscription string into an array of `ParsedNode` objects.
 *
 * @param raw     Raw content fetched from provider URL
 * @param type    Format hint from user ('auto' = auto-detect). Defaults to 'auto'.
 * @returns       Array of parsed proxy nodes in sing-box outbound format
 */
export function parseSubscription(
    raw: string,
    type: SubscriptionType = 'auto',
): ParsedNode[] {
    const content = raw.trim();
    if (!content) return [];

    if (type === 'auto') {
        return autoDetect(content);
    }

    const handler = HANDLER_MAP.get(type);
    if (!handler) {
        console.warn(`[Parser] Unknown format type: ${type}, falling back to auto-detect`);
        return autoDetect(content);
    }

    try {
        return handler.parse(content);
    } catch (err) {
        console.error(`[Parser] Handler '${type}' failed:`, err);
        // Graceful fallback to auto-detect on explicit type failure
        return autoDetect(content);
    }
}

/** Auto-detect format and parse */
function autoDetect(content: string): ParsedNode[] {
    for (const handler of HANDLERS) {
        if (handler.detect(content)) {
            try {
                const nodes = handler.parse(content);
                if (nodes.length > 0) {
                    console.log(`[Parser] Detected format: ${handler.format}, parsed ${nodes.length} nodes`);
                    return nodes;
                }
            } catch (err) {
                console.warn(`[Parser] Handler '${handler.format}' detected but failed to parse:`, err);
            }
        }
    }

    console.warn('[Parser] Failed to detect format, returning empty result');
    return [];
}

/**
 * Detect the subscription format of raw content (without parsing).
 * Useful for UI hints or debugging.
 */
export function detectFormat(raw: string): SubscriptionType | null {
    const content = raw.trim();
    for (const handler of HANDLERS) {
        if (handler.detect(content)) return handler.format;
    }
    return null;
}
