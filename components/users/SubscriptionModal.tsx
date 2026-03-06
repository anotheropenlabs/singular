'use client';

import { useState, useEffect } from 'react';
import { NodeUser } from '@/types';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { X, Copy, Check, Globe, Link2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface SubscriptionModalProps {
  user: NodeUser | null;
  onClose: () => void;
}

export default function SubscriptionModal({ user, onClose }: SubscriptionModalProps) {
  const { t } = useI18n();
  const [copiedSub, setCopiedSub] = useState(false);
  const [copiedLinks, setCopiedLinks] = useState(false);
  const [subUrl, setSubUrl] = useState('');
  const [nodeLinks, setNodeLinks] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const url = `${window.location.origin}/api/sub/${user.uuid}`;
      setSubUrl(url);
      
      // Fetch node links
      setLoading(true);
      fetch(url)
        .then(res => res.text())
        .then(text => {
          try {
             setNodeLinks(atob(text));
          } catch(e) {
             setNodeLinks('Failed to parse subscription content');
          }
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!user) return null;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <GlassCard className="w-full max-w-lg p-6 space-y-6" variant="elevated">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-sing-blue/20 flex items-center justify-center text-sing-blue">
                <Globe className="w-5 h-5" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-white">Subscription</h2>
               <p className="text-xs text-sing-text-secondary">For {user.username}</p>
             </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="w-8 h-8 text-[var(--text-secondary)] hover:text-[var(--status-error)] border-none"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-sing-text-secondary">Subscription URL</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-sm text-sing-text-primary break-all font-mono">
                {subUrl}
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => copyToClipboard(subUrl, setCopiedSub)}
                className={cn(
                    "h-9 w-9 flex-shrink-0 transition-all",
                    copiedSub ? "text-[var(--status-success)] border-[var(--status-success)] bg-[var(--status-success)]/10" : ""
                )}
              >
                {copiedSub ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-sing-text-secondary flex justify-between">
               <span>Nodes ({nodeLinks.split('\n').filter(Boolean).length})</span>
            </label>
            <div className="relative">
              <textarea 
                readOnly
                value={loading ? 'Loading...' : nodeLinks}
                className="w-full h-32 bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-sing-text-secondary font-mono resize-none focus:outline-none"
              />
              <div className="absolute top-2 right-2">
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => copyToClipboard(nodeLinks, setCopiedLinks)}
                   className={cn(
                       "h-7 px-2",
                       copiedLinks ? "text-[var(--status-success)] border-[var(--status-success)] bg-[var(--status-success)]/10" : ""
                   )}
                 >
                   {copiedLinks ? <Check className="w-3 h-3 mr-1.5" /> : <Copy className="w-3 h-3 mr-1.5" />}
                   {copiedLinks ? 'Copied' : 'Copy All'}
                 </Button>
              </div>
            </div>
          </div>
          
          <div className="bg-sing-blue/10 rounded-xl p-3 text-xs text-sing-blue">
            <p>Paste the Subscription URL into your client (v2rayNG, Clash, Shadowrocket) to auto-update nodes.</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
