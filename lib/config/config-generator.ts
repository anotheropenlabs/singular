import { db } from "@/lib/db";

import { settings, certificates, provider, proxyNode, proxyGroup, rawConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Certificate, NodeUser, Inbound } from '@/types';
import { ConfigGeneratorContext, ConfigGeneratorStrategy } from './generator/strategy';

// Server strategies
import { ServerV110Strategy } from './generator/strategies/server_v1.10';
import { ServerV111Strategy } from './generator/strategies/server_v1.11';
import { ServerV112Strategy } from './generator/strategies/server_v1.12';
import { ServerV113Strategy } from './generator/strategies/server_v1.13';

// Client strategies
import { ClientV110Strategy } from './generator/strategies/client_v1.10';
import { ClientV111Strategy } from './generator/strategies/client_v1.11';
import { ClientV112Strategy } from './generator/strategies/client_v1.12';
import { ClientV113Strategy } from './generator/strategies/client_v1.13';

import { getSingBoxVersion } from './version';
import { SETTINGS_KEYS, DEFAULT_SINGBOX_SETTINGS } from '@/lib/settings-defaults';

function getStrategy(version: string, mode: 'server' | 'client'): ConfigGeneratorStrategy {
    if (mode === 'client') {
        if (version.startsWith('1.13')) return new ClientV113Strategy();
        if (version.startsWith('1.12')) return new ClientV112Strategy();
        if (version.startsWith('1.11')) return new ClientV111Strategy();
        return new ClientV110Strategy();
    }
    // Server
    if (version.startsWith('1.13')) return new ServerV113Strategy();
    if (version.startsWith('1.12')) return new ServerV112Strategy();
    if (version.startsWith('1.11')) return new ServerV111Strategy();
    return new ServerV110Strategy();
}

export async function generateConfig(): Promise<string> {
    const settingsList = await db.select().from(settings);
    const settingsMap = new Map(settingsList.map(s => [s.key, s.value || '']));
    const certificatesList = await db.select().from(certificates);
    const certificatesMap = new Map<number, Certificate>(certificatesList.map(c => [c.id, c]));

    // Inject defaults
    if (!settingsMap.has(SETTINGS_KEYS.SINGBOX_LOG_LEVEL)) settingsMap.set(SETTINGS_KEYS.SINGBOX_LOG_LEVEL, DEFAULT_SINGBOX_SETTINGS.singbox_log_level);
    if (!settingsMap.has(SETTINGS_KEYS.SINGBOX_LOG_TIMESTAMP)) settingsMap.set(SETTINGS_KEYS.SINGBOX_LOG_TIMESTAMP, DEFAULT_SINGBOX_SETTINGS.singbox_log_timestamp);
    if (!settingsMap.has(SETTINGS_KEYS.SINGBOX_LOG_PATH)) settingsMap.set(SETTINGS_KEYS.SINGBOX_LOG_PATH, DEFAULT_SINGBOX_SETTINGS.singbox_log_path);

    const targetVersion = await getSingBoxVersion();
    const mode = (settingsMap.get('system_mode') as 'server' | 'client') || 'server';

    // 3. fetch rawConfigs
    const rawConfigs = await db.select().from(rawConfig).where(eq(rawConfig.side, mode)).all();
    const rawMap = rawConfigs.reduce((acc, curr) => {
        try {
            const parsed = JSON.parse(curr.content);
            // Backward compatibility: If the DB has { "inbounds": [...] }, extract the inner value.
            // If it is already [...] (legacy unwrapped), leave it as is.
            acc[curr.type] = (typeof parsed === 'object' && parsed !== null && curr.type in parsed)
                ? parsed[curr.type]
                : parsed;
        } catch {
            acc[curr.type] = null;
        }
        return acc;
    }, {} as Record<string, any>);

    // Replace old DB fetches with parsing the raw map
    const inbounds = (rawMap['inbounds'] || []) as Inbound[];
    const users = (rawMap['users'] || []) as NodeUser[];
    const dnsServers = rawMap['dns']?.servers || [];
    const dnsRules = rawMap['dns']?.rules || [];
    const routingRules = rawMap['route']?.rules || [];
    const routeConfig = rawMap['route'] || {};
    const dnsConfig = rawMap['dns'] || {};
    const experimentalConfig = rawMap['experimental'] || {};

    let context: ConfigGeneratorContext;

    if (mode === 'client') {
        const providersList = await db.select().from(provider);
        const proxiesList = await db.select().from(proxyNode).where(eq(proxyNode.enabled, true));
        const groupsList = await db.select().from(proxyGroup).orderBy(proxyGroup.sort_order);

        context = {
            mode: 'client',
            settings: settingsMap,
            certificates: certificatesMap,
            providers: providersList,
            proxies: proxiesList,
            groups: groupsList,
            routes: routingRules,
            dnsServers: dnsServers,
            dnsRules: dnsRules,
            inbounds: inbounds,
            routeConfig,
            dnsConfig,
            experimentalConfig,
        };
    } else {
        context = {
            mode: 'server',
            settings: settingsMap,
            certificates: certificatesMap,
            inbounds: inbounds,
            users: users,
            dnsServers: dnsServers,
            dnsRules: dnsRules,
            routes: routingRules,
            routeConfig,
            dnsConfig,
            experimentalConfig,
        };
    }

    const strategy = getStrategy(targetVersion, mode);
    console.log(`[Config Generator]strategy = ${strategy.version} mode = ${mode} target = ${targetVersion} `);

    const config = strategy.generate(context);
    return JSON.stringify(config, null, 2);
}
