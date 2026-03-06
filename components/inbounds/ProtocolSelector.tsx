'use client';

import { cn } from '@/lib/utils';
import { Globe, Zap, Shield, Lock, Radio, Layers } from 'lucide-react';

interface ProtocolSelectorProps {
  value: string;
  onChange: (value: string) => void;
  mode?: 'server' | 'client';
}

const serverProtocols = [
  { id: 'vless', name: 'VLESS', icon: Globe, color: 'text-sing-blue', desc: 'Lightweight & Efficient' },
  { id: 'vmess', name: 'VMess', icon: Zap, color: 'text-sing-purple', desc: 'Versatile Standard' },
  { id: 'trojan', name: 'Trojan', icon: Shield, color: 'text-sing-green', desc: 'HTTPS Mimicry' },
  { id: 'shadowsocks', name: 'Shadowsocks', icon: Lock, color: 'text-sing-cyan', desc: 'Proven Encryption' },
  { id: 'hysteria2', name: 'Hysteria2', icon: Zap, color: 'text-sing-yellow', desc: 'UDP Optimization' },
];

const clientProtocols = [
  { id: 'mixed', name: 'Mixed', icon: Layers, color: 'text-sing-blue', desc: 'HTTP & SOCKS' },
  { id: 'tun', name: 'TUN', icon: Radio, color: 'text-sing-green', desc: 'Virtual Network' },
  { id: 'socks', name: 'SOCKS', icon: Radio, color: 'text-sing-yellow', desc: 'SOCKS5 Proxy' },
  { id: 'http', name: 'HTTP', icon: Globe, color: 'text-sing-cyan', desc: 'HTTP Proxy' },
];

export default function ProtocolSelector({ value, onChange, mode = 'server' }: ProtocolSelectorProps) {
  const protocols = mode === 'client' ? clientProtocols : serverProtocols;

  return (
    <div className="relative">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {protocols.map((p) => {
          const isSelected = value === p.id;
          const Icon = p.icon;
          
          return (
            <div
              key={p.id}
              onClick={() => onChange(p.id)}
              className={cn(
                "cursor-pointer group relative overflow-hidden rounded-xl border transition-all duration-200 snap-start shrink-0",
                "min-w-[140px] p-3",
                isSelected 
                  ? "bg-white/10 border-white/20 shadow-lg ring-2 ring-sing-blue/50" 
                  : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
              )}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className={cn(
                  "p-2.5 rounded-lg transition-all",
                  isSelected ? "bg-white/10 scale-110" : "bg-white/5 group-hover:bg-white/10 group-hover:scale-105"
                )}>
                  <Icon className={cn("w-5 h-5", p.color)} />
                </div>
                <div className="flex flex-col">
                   <span className={cn(
                      "font-semibold text-sm transition-colors",
                      isSelected ? "text-white" : "text-gray-300 group-hover:text-white"
                   )}>
                      {p.name}
                   </span>
                   <span className="text-[10px] text-gray-500 group-hover:text-gray-400 mt-0.5">
                      {p.desc}
                   </span>
                </div>
              </div>
              
            </div>
          );
        })}
      </div>
      {/* Scroll indicator */}
      <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-sing-dark to-transparent pointer-events-none" />
    </div>
  );
}
