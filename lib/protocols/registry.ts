import { ProtocolDefinition } from './types';
import { Globe, Zap, Shield, Lock, Radio } from 'lucide-react';
import { vless } from './vless';
import { vmess } from './vmess';
import { trojan } from './trojan';
import { shadowsocks } from './shadowsocks';
import { hysteria2 } from './hysteria2';
import { tuic } from './tuic';
import { mixed } from './mixed';
import { tun } from './tun';
import { socks } from './socks';
import { http } from './http';

// Registry Map
const protocols: Record<string, ProtocolDefinition> = {};

export function registerProtocol(def: ProtocolDefinition) {
    protocols[def.id] = def;
}

// Auto-register core protocols
registerProtocol(vless);
registerProtocol(vmess);
registerProtocol(trojan);
registerProtocol(shadowsocks);
registerProtocol(hysteria2);
registerProtocol(tuic);
registerProtocol(mixed);
registerProtocol(tun);
registerProtocol(socks);
registerProtocol(http);

export function getProtocol(id: string): ProtocolDefinition | undefined {
    return protocols[id];
}

export function getAllProtocols(): ProtocolDefinition[] {
    return Object.values(protocols);
}

// Initial Metadata for Selector (Lightweight)
// This can be derived from getAllProtocols but kept for simple imports
export const protocolMetadata = [
    { id: 'vless', name: 'VLESS', icon: Globe, color: 'text-sing-blue', desc: 'Lightweight & Efficient' },
    { id: 'vmess', name: 'VMess', icon: Zap, color: 'text-sing-purple', desc: 'Versatile Standard' },
    { id: 'trojan', name: 'Trojan', icon: Shield, color: 'text-sing-green', desc: 'HTTPS Mimicry' },
    { id: 'shadowsocks', name: 'Shadowsocks', icon: Lock, color: 'text-sing-cyan', desc: 'Proven Encryption' },
    { id: 'socks', name: 'SOCKS', icon: Radio, color: 'text-sing-yellow', desc: 'Generic Proxy' },
];
