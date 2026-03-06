import { BaseStrategy } from './base';
import { ConfigGeneratorContext, SingBoxConfig } from '../strategy';
import { inboundSchema } from '../../versions/v1.10/schemas';

export abstract class ServerBaseStrategy extends BaseStrategy {
    /** v1.11+: migrate sniff/domain_strategy from inbounds to route rules */
    protected migrateSniff = false;

    /** v1.12+: validate inbounds against strict v1.12 schema */
    protected strictInboundValidation = false;

    generate(context: ConfigGeneratorContext): SingBoxConfig {
        if (context.mode !== 'server') {
            throw new Error(`${this.constructor.name} requires server mode`);
        }
        const { inbounds, users, settings, certificates } = context;
        const dnsServers = context.dnsServers || [];
        const routes = context.routes || [];

        const config: SingBoxConfig = {
            log: this.generateLog(settings),
            dns: this.generateDNS(dnsServers, settings),
            inbounds: [],
            outbounds: [
                { type: 'direct', tag: 'direct' },
                { type: 'block', tag: 'block' },
            ],
            route: this.generateServerRoute(routes),
            experimental: this.generateExperimental(settings),
        };

        for (const ib of inbounds) {
            const processed = this.processInbound(ib, users, certificates);
            if (processed) config.inbounds!.push(processed);
        }

        if (this.migrateSniff && config.inbounds && config.route) {
            config.inbounds = this.performSniffMigration(config.inbounds, config.route);
        }

        if (this.strictInboundValidation && config.inbounds) {
            config.inbounds = this.performStrictValidation(config.inbounds);
        }

        return config;
    }

    protected processInbound(ib: any, users: any[], certificates: Map<number, any>): any | null {
        try {
            const rawConfig = JSON.parse(ib.config);
            const fullInbound: any = {
                type: ib.protocol,
                tag: ib.tag,
                listen: '::',
                listen_port: ib.port,
                ...rawConfig,
            };

            this.injectUsers(fullInbound, ib, users);
            this.injectCertificate(fullInbound, ib, certificates);

            const result = inboundSchema.safeParse(fullInbound);
            if (!result.success) {
                console.error(`[Server] Validation failed for inbound ${ib.tag}:`, result.error.format());
                return null;
            }
            return result.data;
        } catch (e) {
            console.error(`[Server] Failed to process inbound ${ib.tag}`, e);
            return null;
        }
    }

    protected injectUsers(fullInbound: any, inbound: any, users: any[]) {
        const usersForInbound = users.filter(u => {
            try {
                const allowed = u.allowed_inbounds ? JSON.parse(u.allowed_inbounds) : [];
                return Array.isArray(allowed) && allowed.includes(inbound.id);
            } catch { return false; }
        });
        if (usersForInbound.length === 0) return;
        if (!fullInbound.users) fullInbound.users = [];

        for (const u of usersForInbound) {
            if (inbound.protocol === 'vless' || inbound.protocol === 'vmess') {
                fullInbound.users.push({ name: u.username, uuid: u.uuid });
            } else {
                fullInbound.users.push({ name: u.username, password: u.password || u.uuid });
            }
        }
    }

    protected injectCertificate(fullInbound: any, inbound: any, certificates: Map<number, any>) {
        if (!inbound.certificate_id || !certificates) return;
        const cert = certificates.get(inbound.certificate_id);
        if (!cert) return;

        if (!fullInbound.tls) fullInbound.tls = { enabled: true };
        fullInbound.tls.certificate_path = cert.cert_path;
        fullInbound.tls.key_path = cert.key_path;
        if (!fullInbound.tls.server_name && cert.domain) {
            fullInbound.tls.server_name = cert.domain;
        }
    }

    protected performSniffMigration(inbounds: any[], route: any): any[] {
        const cleanInbounds: any[] = [];
        for (const ib of inbounds) {
            const { sniff, sniff_override_destination, domain_strategy, ...rest } = ib;
            cleanInbounds.push(rest);

            if (sniff) {
                if (!route.rules) route.rules = [];
                route.rules.unshift({ inbound: [ib.tag], action: 'sniff', timeout: '300ms' });
            }
            if (domain_strategy) {
                if (!route.rules) route.rules = [];
                route.rules.unshift({ inbound: [ib.tag], action: 'resolve', strategy: domain_strategy });
            }
        }
        return cleanInbounds;
    }

    protected performStrictValidation(inbounds: any[]): any[] {
        return inbounds;
    }

    protected generateServerRoute(routes: any[]): any {
        const rules: any[] = [];
        const sorted = [...routes].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
        for (const r of sorted) {
            if (!r.outbound) continue;
            rules.push({ [r.type]: [r.value], outbound: r.outbound });
        }
        return { rules, auto_detect_interface: true };
    }
}
