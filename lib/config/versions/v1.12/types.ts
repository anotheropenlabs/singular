
// Sing-box v1.12+ Configuration Types

import { LogConfig, ExperimentalConfig, InboundTLSConfig, V2RayTransportConfig, MultiplexConfig } from '../v1.10/types';

export interface SingBoxConfigV112 {
    log?: LogConfig;
    dns?: DNSConfigV112;
    inbounds?: InboundConfigV112[];
    outbounds?: any[];
    route?: RouteConfigV112;
    experimental?: ExperimentalConfig;
}

export interface DNSConfigV112 {
    servers?: DNSServerV112[];
    rules?: DNSRuleV112[];
    final?: string;
    strategy?: 'prefer_ipv4' | 'prefer_ipv6' | 'ipv4_only' | 'ipv6_only';
    disable_cache?: boolean;
    disable_expire?: boolean;
    independent_cache?: boolean;
}

export type DNSServerV112 =
    | { type: 'local'; tag?: string; detachable?: boolean }
    | { type: 'tcp'; tag?: string; server: string; server_port?: number; detachable?: boolean }
    | { type: 'udp'; tag?: string; server: string; server_port?: number; detachable?: boolean }
    | { type: 'tls'; tag?: string; server: string; server_port?: number; detachable?: boolean }
    | { type: 'https'; tag?: string; server: string; server_port?: number; path?: string; detachable?: boolean }
    | { type: 'quic'; tag?: string; server: string; server_port?: number; detachable?: boolean };

export interface DNSRuleV112 {
    inbound?: string[];
    domain?: string[];
    domain_suffix?: string[];
    domain_keyword?: string[];
    domain_regex?: string[];
    geosite?: string[];
    source_ip_cidr?: string[];
    ip_cidr?: string[];
    geoip?: string[];
    server: string;
    disable_cache?: boolean;
    rewrite_ttl?: number;
}

export interface BaseInboundV112 {
    type: string;
    tag: string;
    listen?: string;
    listen_port?: number;
}

export interface InboundVLESSV112 extends BaseInboundV112 {
    type: 'vless';
    users: Array<{ name?: string; uuid: string; flow?: string; }>;
    tls?: InboundTLSConfig;
    transport?: V2RayTransportConfig;
}

export interface InboundVMessV112 extends BaseInboundV112 {
    type: 'vmess';
    users: Array<{ name?: string; uuid: string; alterId?: number; }>;
    tls?: InboundTLSConfig;
    transport?: V2RayTransportConfig;
}

export interface InboundTrojanV112 extends BaseInboundV112 {
    type: 'trojan';
    users: Array<{ name?: string; password: string; }>;
    tls?: InboundTLSConfig;
    transport?: V2RayTransportConfig;
    multiplex?: MultiplexConfig;
}

export interface InboundShadowsocksV112 extends BaseInboundV112 {
    type: 'shadowsocks';
    method: string;
    password: string;
    network?: 'tcp' | 'udp';
    multiplex?: MultiplexConfig;
}

export interface InboundHysteria2V112 extends BaseInboundV112 {
    type: 'hysteria2';
    users?: Array<{ name?: string; password: string; }>;
    up_mbps?: number;
    down_mbps?: number;
    obfs?: { type: 'salamander'; password: string; };
    tls?: InboundTLSConfig;
    ignore_client_bandwidth?: boolean;
}

export type InboundConfigV112 =
    | InboundVLESSV112
    | InboundVMessV112
    | InboundTrojanV112
    | InboundShadowsocksV112
    | InboundHysteria2V112;

export interface RouteConfigV112 {
    rules?: RouteRuleV112[];
    final?: string;
    auto_detect_interface?: boolean;
}

export interface RouteRuleV112 {
    inbound?: string[];
    protocol?: string[];
    domain?: string[];
    action?: 'route' | 'route-options' | 'reject' | 'dns' | 'sniff' | 'resolve';
    outbound?: string;
    timeout?: string;
    strategy?: string;
}
