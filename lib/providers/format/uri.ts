/**
 * format/uri.ts — URI list format handler (plain-text & base64)
 *
 * Supports parsing multiple protocol URIs by dynamically looking up
 * the registered protocol definitions from the central registry.
 */
import { FormatHandler, ParsedNode } from '../types';
import { getAllProtocols } from '../../protocols/registry';

// ── URI dispatch ────────────────────────────────────────────────────────────

export function parseUri(uri: string): ParsedNode | null {
    const u = uri.trim();
    for (const protocol of getAllProtocols()) {
        if (protocol.parseUri && protocol.aliases) {
            for (const prefix of protocol.aliases) {
                if (u.startsWith(prefix)) {
                    try {
                        const parsed = protocol.parseUri(u);
                        if (parsed) return parsed;
                    } catch {
                        // ignore and try next
                    }
                }
            }
        }
    }
    return null;
}

function parseUriList(content: string): ParsedNode[] {
    return content
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l && l.includes('://'))
        .map(parseUri)
        .filter(Boolean) as ParsedNode[];
}

// ── Format handlers ─────────────────────────────────────────────────────────

export const uriHandler: FormatHandler = {
    format: 'uri',

    detect(raw: string): boolean {
        return raw.includes('://') && getAllProtocols().some(p =>
            p.aliases?.some(prefix => raw.includes(prefix))
        );
    },

    parse(raw: string): ParsedNode[] {
        return parseUriList(raw);
    },
};

export const base64Handler: FormatHandler = {
    format: 'base64',

    detect(raw: string): boolean {
        // Looks like base64 but not JSON/YAML
        if (raw.startsWith('{') || raw.startsWith('[') || raw.includes('proxies:')) return false;
        // Must be valid base64 that decodes to URI lines
        try {
            const decoded = Buffer.from(raw.trim(), 'base64').toString('utf-8');
            return decoded.includes('://');
        } catch {
            return false;
        }
    },

    parse(raw: string): ParsedNode[] {
        const decoded = Buffer.from(raw.trim(), 'base64').toString('utf-8');
        return parseUriList(decoded);
    },
};
