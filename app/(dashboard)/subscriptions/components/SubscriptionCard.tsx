'use client';

import { Copy, QrCode, Check } from 'lucide-react';
import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { NodeUser } from '@/types';

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
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">{user.username}</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowQr(!showQr)}>
            <QrCode className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="bg-white/5 rounded-lg p-3">
        <p className="text-white/50 text-xs font-mono break-all">{subscriptionUrl}</p>
      </div>
      {showQr && (
        <div className="mt-4 flex justify-center">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-gray-900 text-sm text-center">QR Code placeholder</p>
            {/* TODO: Implement QR code generation */}
          </div>
        </div>
      )}
    </Card>
  );
}
