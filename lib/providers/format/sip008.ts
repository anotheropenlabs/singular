/**
 * format/sip008.ts — SIP008 Shadowsocks JSON format handler
 *
 * Accepts: { servers: [...] } or Array of server objects
 * Reference: https://github.com/shadowsocks/shadowsocks-org/wiki/SIP008-Online-Configuration-Delivery
 */
import { FormatHandler, ParsedNode } from '../types';

export const sip008Handler: FormatHandler = {
    format: 'sip008',

    detect(raw: string): boolean {
        if (!raw.startsWith('{') && !raw.startsWith('[')) return false;
        try {
            const json = JSON.parse(raw);
            const servers = Array.isArray(json) ? json : json.servers;
            return Array.isArray(servers) && servers.length > 0 && servers[0]?.method !== undefined;
        } catch {
            return false;
        }
    },

    parse(raw: string): ParsedNode[] {
        const json = JSON.parse(raw);
        const servers: any[] = Array.isArray(json) ? json : (json.servers || []);

        return servers
            .filter(s => s.server && s.server_port)
            .map(s => {
                const name = s.remarks || s.id || `ss-${s.server}:${s.server_port}`;
                const config: any = {
                    type: 'shadowsocks',
                    tag: name,
                    server: s.server,
                    server_port: Number(s.server_port),
                    method: s.method,
                    password: s.password,
                };
                if (s.plugin) {
                    config.plugin = s.plugin;
                    config.plugin_opts = s.plugin_opts;
                }
                return { name, type: 'shadowsocks', server: s.server, port: Number(s.server_port), config };
            });
    },
};
