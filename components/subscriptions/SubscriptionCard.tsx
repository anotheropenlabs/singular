'use client';

import { Copy, QrCode, Check } from 'lucide-react';
import { useState } from 'react';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import type { NodeUser } from '@/types';
import QRCode from 'react-qr-code';

interface SubscriptionCardProps {
  user: NodeUser;
  subscriptionUrl: string;
}

export default function SubscriptionCard({ user, subscriptionUrl }: SubscriptionCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(subscriptionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Panel className="p-6 border border-[var(--border-color)] bg-[var(--bg-base)]">
      <div className="flex items-center justify-between mb-4 border-b border-[var(--border-color)] pb-4">
        <h3 className="text-[var(--text-primary)] font-mono font-bold uppercase tracking-wider">{user.username}</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="rounded-none border border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[#10b981]">
            {copied ? <Check className="w-4 h-4 text-[#10b981]" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowQr(!showQr)} className="rounded-none border border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <QrCode className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-3">
        <p className="text-[var(--text-secondary)] text-[10px] uppercase font-mono break-all tracking-widest leading-relaxed select-all">{subscriptionUrl}</p>
      </div>
      {showQr && (
        <div className="mt-6 pt-6 border-t border-[var(--border-color)] border-dashed flex justify-center">
          <div className="bg-white p-4">
            {subscriptionUrl ? (
                <QRCode 
                    value={subscriptionUrl} 
                    size={200} 
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                />
            ) : (
                <p className="text-gray-900 text-sm">No subscription URL available</p>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}
