/**
 * providers/types.ts
 *
 * Types shared across the subscription-parsing pipeline.
 */

/**
 * Explicit subscription type, selectable by the user in the UI.
 *
 *  auto      — detect automatically (default)
 *  base64    — raw base64-encoded list of proxy URIs
 *  uri       — plain-text list of proxy URIs (one per line)
 *  singbox   — sing-box JSON with an `outbounds` array
 *  clash     — Clash/Mihomo YAML with a `proxies` section
 *  sip008    — SIP008 Shadowsocks JSON ({servers: [...]})
 */
export type SubscriptionType = 'auto' | 'base64' | 'uri' | 'singbox' | 'clash' | 'sip008';

export const SUBSCRIPTION_TYPES: { value: SubscriptionType; label: string; descriptionKey: string; defaultDesc: string }[] = [
    { value: 'auto', label: 'Auto', descriptionKey: 'providers.type.auto', defaultDesc: 'Auto detect format (Recommended)' },
    { value: 'base64', label: 'Base64', descriptionKey: 'providers.type.base64', defaultDesc: 'Base64 encoded URI list' },
    { value: 'uri', label: 'URI List', descriptionKey: 'providers.type.uri', defaultDesc: 'Plain-text proxy URI list' },
    { value: 'singbox', label: 'Sing-box', descriptionKey: 'providers.type.singbox', defaultDesc: 'Sing-box JSON (with outbounds)' },
    { value: 'clash', label: 'Clash/Mihomo', descriptionKey: 'providers.type.clash', defaultDesc: 'Clash YAML (with proxies)' },
    { value: 'sip008', label: 'SIP008', descriptionKey: 'providers.type.sip008', defaultDesc: 'SIP008 Shadowsocks JSON' },
];

import { OutboundNode } from '../protocols/types';

/** Unified node representation used across all parsers */
export type ParsedNode = OutboundNode;

/** A format handler can parse a raw string into ParsedNode[] */
export interface FormatHandler {
    /** Unique format identifier */
    readonly format: SubscriptionType;
    /** Returns true if this handler can parse the given raw content */
    detect(raw: string): boolean;
    /** Parse raw content into nodes. Throws if content is malformed. */
    parse(raw: string): ParsedNode[];
}
