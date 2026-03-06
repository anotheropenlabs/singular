/**
 * strategy.ts — Core interfaces for the versioned sing-box config generator pattern.
 *
 * Used by: BaseStrategy (and all sub-strategies), ConfigGeneratorContext (config-generator.ts)
 */

import type { Certificate } from '@/types';

/** Shared context passed to all strategy generate() calls */
export interface ConfigGeneratorContext {
    mode: 'server' | 'client';
    settings: Map<string, string>;
    certificates: Map<number, Certificate>;

    // Server-only
    users?: any[];

    // Client-only
    providers?: any[];
    proxies?: any[];
    groups?: any[];

    // Shared
    inbounds?: any[];
    routes?: any[];
    dnsServers?: any[];
    dnsRules?: any[];
    routeConfig?: any;
    dnsConfig?: any;
    experimentalConfig?: any;
}

/** Top-level sing-box config shape */
export interface SingBoxConfig {
    log?: any;
    dns?: any;
    inbounds?: any[];
    outbounds?: any[];
    route?: any;
    experimental?: any;
    ntp?: any;
}

/** Strategy interface — each version class implements this */
export interface ConfigGeneratorStrategy {
    version: string;
    generate(context: ConfigGeneratorContext): SingBoxConfig;
}
