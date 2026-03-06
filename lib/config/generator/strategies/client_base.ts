import { BaseStrategy } from './base';
import { ConfigGeneratorContext, SingBoxConfig } from '../strategy';

export abstract class ClientBaseStrategy extends BaseStrategy {
    protected stripInboundSniff = false;

    generate(context: ConfigGeneratorContext): SingBoxConfig {
        if (context.mode !== 'client') {
            throw new Error(`${this.constructor.name} requires client mode`);
        }
        const { settings, proxies = [], groups = [], routes = [], dnsServers = [], dnsRules = [], experimentalConfig = {}, inbounds = [], routeConfig = {}, dnsConfig = {} } = context;
        const outbounds = this.generateOutbounds(proxies, groups);

        const routeBlock = {
            ...routeConfig, // Bring in 'rule_set', 'default_domain_resolver', etc.
            ...this.generateClientRoute(routes, outbounds, settings) // Overwrites with processed 'rules', 'final' logic
        };

        return {
            log: this.generateLog(settings),
            dns: {
                ...dnsConfig,
                ...this.generateDNS(dnsServers, settings, dnsRules)
            },
            inbounds: this.generateInbounds(settings, inbounds),
            outbounds,
            route: routeBlock,
            experimental: this.generateExperimental(settings, experimentalConfig),
        };
    }

    protected generateInbounds(settings: Map<string, string>, rawInbounds: any[] = []): any[] {
        if (rawInbounds && rawInbounds.length > 0) {
            return rawInbounds;
        }

        const inbounds: any[] = [];

        const mixedInbound: any = {
            type: 'mixed',
            tag: 'mixed-in',
            listen: '::',
            listen_port: parseInt(settings.get('mixed_port') || '2080'),
        };
        if (!this.stripInboundSniff) {
            mixedInbound.sniff = true;
            mixedInbound.sniff_override_destination = true;
        }
        inbounds.push(mixedInbound);

        if (settings.get('tun_enabled') === 'true') {
            const tunInbound: any = {
                type: 'tun',
                tag: 'tun-in',
                interface_name: settings.get('tun_interface') || 'utun',
                inet4_address: settings.get('tun_inet4') || '172.19.0.1/30',
                auto_route: true,
                strict_route: true,
                stack: settings.get('tun_stack') || 'system',
            };
            if (!this.stripInboundSniff) {
                tunInbound.sniff = true;
                tunInbound.sniff_override_destination = true;
            }
            const inet6 = settings.get('tun_inet6');
            if (inet6) tunInbound.inet6_address = inet6;
            inbounds.push(tunInbound);
        }

        return inbounds;
    }

    protected generateOutbounds(proxies: any[], groups: any[]): any[] {
        const outbounds: any[] = [];
        const proxyTags = new Set<string>();

        // 1. Render all basic proxy nodes (including direct, block)
        for (const p of proxies) {
            try {
                const config = p.config ? JSON.parse(p.config) : {};
                const outbound: any = {
                    ...config,
                    type: p.type,
                    tag: p.name,
                };

                // If the user's config didn't include server/port, grab from table columns if applicable
                if (!outbound.server && p.server) outbound.server = p.server;
                if (!outbound.server_port && p.port) outbound.server_port = p.port;

                outbounds.push(outbound);
                proxyTags.add(p.name);
            } catch (e) {
                console.error(`[Client] Failed to parse proxy ${p.name}`, e);
            }
        }

        // 2. Render all proxy groups
        for (const g of [...groups].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))) {
            try {
                const config = g.config ? JSON.parse(g.config) : {};
                const outbound: any = {
                    ...config,
                    type: g.type,
                    tag: g.name,
                };

                let members: string[] = config.outbounds || [];

                if (g.node_filter) {
                    try {
                        const regex = new RegExp(g.node_filter);
                        const matched = proxies.filter(p => regex.test(p.name)).map(p => p.name);
                        members = Array.from(new Set([...members, ...matched]));
                    } catch { }
                }

                // Filter out non-existent node references only if there's an enforced subset constraint
                const validMembers = members.filter(tag => proxyTags.has(tag));
                if (validMembers.length === 0 && config.outbounds && config.outbounds.length > 0) {
                    console.warn(`[Client] Group ${g.name} has no valid members, warning`);
                    // We'll still keep the user's config as intact as possible instead of discarding the group
                    outbound.outbounds = members;
                } else if (members.length > 0) {
                    outbound.outbounds = members;
                }

                // Only groups that actually output multiple options might have their members validated tightly
                // Let the native rule validator inside singbox catch edge cases instead of aggressively stripping

                outbounds.push(outbound);
                proxyTags.add(g.name);
            } catch (e) {
                console.error(`[Client] Failed to process group ${g.name}`, e);
            }
        }

        return outbounds;
    }

    protected generateClientRoute(routes: any[], outbounds: any[], settings: Map<string, string>): any {
        const rules: any[] = [];

        // Just push all native sing-box rules exactly as they were written in the raw config
        rules.push(...routes);

        const groupTags = outbounds
            .filter(o => ['selector', 'urltest', 'fallback'].includes(o.type))
            .map(o => o.tag);
        const finalOutbound = settings.get('route_final') ||
            groupTags.find(t => /proxy|select|global/i.test(t)) ||
            groupTags[0] ||
            'direct';

        return {
            rules,
            final: finalOutbound,
            auto_detect_interface: true,
        };
    }
}
