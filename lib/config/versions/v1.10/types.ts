
// Sing-box v1.10 Configuration Types

export interface SingBoxConfigV110 {
    log?: LogConfig;
    dns?: DNSConfig;
    inbounds?: InboundConfig[];
    outbounds?: OutboundConfig[];
    route?: RouteConfig;
    experimental?: ExperimentalConfig;
}

export interface LogConfig {
    disabled?: boolean;
    level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'panic';
    output?: string;
    timestamp?: boolean;
}

export interface DNSConfig {
    servers?: DNSServer[];
    rules?: DNSRule[];
    final?: string;
    strategy?: 'prefer_ipv4' | 'prefer_ipv6' | 'ipv4_only' | 'ipv6_only';
    disable_cache?: boolean;
    disable_expire?: boolean;
}

export interface DNSServer {
    tag?: string;
    address: string;
    method?: 'local' | 'direct' | 'doh' | 'dot' | 'tcp' | 'udp' | 'quic';
    client_subnet?: string;
}

export interface DNSRule {
    user_id?: number[];
    auth_user?: string[];
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

export type InboundConfig =
    | InboundVLESS
    | InboundVMess
    | InboundTrojan
    | InboundShadowsocks
    | InboundHysteria2
    | InboundMixed
    | InboundDirect;

export interface BaseInbound {
    type: string;
    tag: string;
    listen?: string;
    listen_port?: number;
    sniff?: boolean;
    sniff_override_destination?: boolean;
    domain_strategy?: 'prefer_ipv4' | 'prefer_ipv6' | 'ipv4_only' | 'ipv6_only';
}

export interface InboundVLESS extends BaseInbound {
    type: 'vless';
    users: Array<{ name?: string; uuid: string; flow?: string; }>;
    tls?: InboundTLSConfig;
    transport?: V2RayTransportConfig;
}

export interface InboundVMess extends BaseInbound {
    type: 'vmess';
    users: Array<{ name?: string; uuid: string; alterId?: number; }>;
    tls?: InboundTLSConfig;
    transport?: V2RayTransportConfig;
}

export interface InboundTrojan extends BaseInbound {
    type: 'trojan';
    users: Array<{ name?: string; password: string; }>;
    tls?: InboundTLSConfig;
    transport?: V2RayTransportConfig;
    multiplex?: MultiplexConfig;
}

export interface InboundShadowsocks extends BaseInbound {
    type: 'shadowsocks';
    method: string;
    password: string;
    network?: 'tcp' | 'udp';
    multiplex?: MultiplexConfig;
}

export interface InboundHysteria2 extends BaseInbound {
    type: 'hysteria2';
    users?: Array<{ name?: string; password: string; }>;
    up_mbps?: number;
    down_mbps?: number;
    obfs?: { type: 'salamander'; password: string; };
    tls?: InboundTLSConfig;
    ignore_client_bandwidth?: boolean;
}

export interface InboundMixed extends BaseInbound {
    type: 'mixed';
    users?: Array<{ username: string; password: string; }>;
    set_system_proxy?: boolean;
}

export interface InboundDirect extends BaseInbound {
    type: 'direct';
    network?: 'tcp' | 'udp';
    override_address?: string;
    override_port?: number;
}

export interface InboundTLSConfig {
    enabled?: boolean;
    server_name?: string;
    alpn?: string[];
    min_version?: string;
    max_version?: string;
    certificate_path?: string;
    key_path?: string;
    certificate?: string[];
    key?: string[];
    acme?: { domain?: string[]; data_directory?: string; default_server_name?: string; email?: string; provider?: string; }
    reality?: { enabled?: boolean; handshake?: { server: string; server_port?: number; }; private_key: string; short_id?: string[]; max_time_difference?: string; };
}

export interface V2RayTransportConfig {
    type?: 'http' | 'grpc' | 'ws' | 'quic';
    path?: string;
    headers?: Record<string, string>;
    service_name?: string;
    early_data_header_name?: string;
    max_early_data?: number;
}

export interface MultiplexConfig {
    enabled: boolean;
    padding?: boolean;
    max_connections?: number;
    min_streams?: number;
    max_streams?: number;
}

export interface OutboundConfig {
    type: string;
    tag: string;
    [key: string]: any;
}

export interface RouteConfig {
    rules?: RouteRule[];
    final?: string;
    auto_detect_interface?: boolean;
}

export interface RouteRule {
    inbound?: string[];
    protocol?: string[];
    domain?: string[];
    domain_suffix?: string[];
    domain_keyword?: string[];
    domain_regex?: string[];
    geosite?: string[];
    source_geoip?: string[];
    geoip?: string[];
    source_ip_cidr?: string[];
    ip_cidr?: string[];
    source_port?: number[];
    port?: number[];
    outbound: string;
}

export interface ExperimentalConfig {
    cache_file?: { enabled?: boolean; path?: string; store_fakeip?: boolean; };
    clash_api?: { external_controller?: string; external_ui?: string; secret?: string; default_mode?: string; };
    v2ray_api?: { listen?: string; stats?: { enabled?: boolean; inbounds?: string[]; outbounds?: string[]; users?: string[]; }; };
}
