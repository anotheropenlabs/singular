
import { SingBoxConfigV110, InboundConfig, RouteConfig, RouteRule, BaseInbound } from '../v1.10/types';

// v1.11: sniff and domain_strategy on inbounds are DEPRECATED (moved to Route Rules).
// Route Rules gain 'action' field.

export interface SingBoxConfigV111 extends Omit<SingBoxConfigV110, 'inbounds' | 'route'> {
    inbounds?: InboundConfigV111[];
    route?: RouteConfigV111;
}

export interface RouteConfigV111 extends Omit<RouteConfig, 'rules'> {
    rules?: RouteRuleV111[];
}

export interface RouteRuleV111 extends RouteRule {
    action?: 'route' | 'route-options' | 'reject' | 'dns' | 'sniff' | 'resolve';
    timeout?: string;
    strategy?: 'prefer_ipv4' | 'prefer_ipv6' | 'ipv4_only' | 'ipv6_only';
}

export type InboundConfigV111 = InboundConfig;
