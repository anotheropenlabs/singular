/**
 * base.ts — Shared abstract base for ALL sing-box strategies (server + client).
 */

import { ConfigGeneratorStrategy, ConfigGeneratorContext, SingBoxConfig } from '../strategy';

export type DnsFormat = 'legacy' | 'typed';

export abstract class BaseStrategy implements ConfigGeneratorStrategy {
    abstract version: string;

    protected dnsFormat: DnsFormat = 'legacy';

    abstract generate(context: ConfigGeneratorContext): SingBoxConfig;

    protected generateLog(settings: Map<string, string>): any {
        return {
            disabled: settings.get('log_disabled') === 'true',
            level: settings.get('log_level') || 'info',
            timestamp: settings.get('log_timestamp') !== 'false',
            output: settings.get('log_path') || 'sing-box.log',
        };
    }

    protected generateDNS(dnsServers: any[], settings: Map<string, string>, dnsRules: any[] = []): any {
        const servers = dnsServers.length > 0
            ? dnsServers // Use native arrays directly without transforming
            : this.defaultDNSServers();

        let rules: any[];

        if (dnsRules.length > 0) {
            rules = dnsRules; // Native rules
        } else {
            rules = [
                { outbound: 'any', server: servers[0]?.tag || 'remote' },
            ];
            const localServer = servers.find(
                (s: any) => s.tag === 'local' || s.type === 'local' || s.address === 'local'
            );
            if (localServer) {
                rules.push({ geosite: ['cn'], server: localServer.tag || 'local' });
            }
        }

        const dns: any = {
            servers,
            rules,
            final: servers[0]?.tag || 'remote',
        };
        if (settings.get('dns_strategy')) dns.strategy = settings.get('dns_strategy');
        return dns;
    }

    private dnsEntryLegacy(s: any): any {
        const methodMap: Record<string, string> = {
            udp: 'udp', tcp: 'tcp', tls: 'dot', https: 'doh', quic: 'quic',
        };
        if (s.type === 'local' || s.server === 'local') {
            return { tag: s.tag, address: 'local' };
        }
        const entry: any = { tag: s.tag, address: s.server };
        if (s.type && methodMap[s.type]) entry.method = methodMap[s.type];
        if (s.detour) entry.detour = s.detour;
        return entry;
    }

    private dnsEntryTyped(s: any): any {
        let extra: any = {};
        try { extra = s.config ? JSON.parse(s.config) : {}; } catch { }

        const type = s.type || 'udp';
        if (type === 'local' || s.server === 'local') {
            return { type: 'local', tag: s.tag };
        }

        const entry: any = { type, tag: s.tag, server: s.server };
        const match = (s.server || '').match(/^(.+):(\d+)$/);
        if (match) {
            entry.server = match[1];
            entry.server_port = parseInt(match[2]);
        }
        if (type === 'https' && extra.path) entry.path = extra.path;
        if (s.detour) entry.detour = s.detour;
        if (extra.address_resolver) entry.address_resolver = extra.address_resolver;
        return entry;
    }

    protected defaultDNSServers(): any[] {
        if (this.dnsFormat === 'typed') {
            return [
                { type: 'udp', tag: 'remote', server: '8.8.8.8' },
                { type: 'local', tag: 'local' },
            ];
        }
        return [
            { tag: 'remote', address: '8.8.8.8' },
            { tag: 'local', address: 'local' },
        ];
    }

    protected generateExperimental(settings: Map<string, string>, experimentalConfig: any = {}): any {
        const defaultExp = {
            clash_api: {
                external_controller: `127.0.0.1:${settings.get('clash_api_port') || '9090'}`,
                external_ui: 'ui',
                secret: settings.get('clash_api_secret') || '',
                default_mode: settings.get('clash_api_default_mode') || 'rule',
            },
            cache_file: {
                enabled: true,
                path: 'cache.db',
                store_fakeip: false,
            },
        };

        // Shallow merge top level properties. Merge nested clash_api / cache_file properly if they exist.
        return {
            ...defaultExp,
            ...experimentalConfig,
            clash_api: {
                ...defaultExp.clash_api,
                ...(experimentalConfig.clash_api || {})
            },
            cache_file: {
                ...defaultExp.cache_file,
                ...(experimentalConfig.cache_file || {})
            }
        };
    }
}
