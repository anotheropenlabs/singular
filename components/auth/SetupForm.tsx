
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { useI18n } from '@/lib/i18n';
import { ShieldCheck, Copy, Check } from 'lucide-react';
import { fetcher } from '@/lib/api-client';

export default function SetupForm() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const data = await fetcher<any>('/api/auth/setup', { method: 'POST' });
      setCredentials(data);
      setSetupComplete(true);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
      if (!credentials) return;
      const text = `Username: ${credentials.username}\nPassword: ${credentials.password}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GlassCard className="p-8 backdrop-blur-3xl bg-glass/40 border-glass-border shadow-2xl">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sing-green/20 text-sing-green mb-4 ring-1 ring-sing-green/30">
             <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {setupComplete ? t('auth.setup_success') : t('auth.setup_title')}
        </h1>
        <p className="text-sing-text-secondary text-sm">
          {setupComplete ? t('auth.credentials_subtitle') : t('auth.setup_subtitle')}
        </p>
      </div>

      {setupComplete ? (
        <div className="space-y-6">
          <div className="bg-black/40 rounded-xl p-5 space-y-3 font-mono text-sm border border-white/5 relative group">
            <button 
                onClick={copyToClipboard}
                className="absolute top-2 right-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
            >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <div className="flex justify-between items-center">
              <span className="text-sing-text-tertiary">{t('auth.username')}:</span>
              <span className="text-white select-all">{credentials?.username}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sing-text-tertiary">{t('auth.password')}:</span>
              <span className="text-white select-all">{credentials?.password}</span>
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-sing-yellow/10 border border-sing-yellow/20 text-sing-yellow text-xs text-center">
             Please save these credentials securely.
          </div>

          <Button
            className="w-full"
            onClick={() => router.push('/login')}
            size="lg"
          >
            {t('auth.login_button')}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-sing-text-secondary text-center text-sm">
             Click below to initialize the system and generate your admin credentials.
          </p>
          <Button
            className="w-full"
            onClick={handleSetup}
            isLoading={loading}
            size="lg"
          >
            {t('auth.setup_button')}
          </Button>
        </div>
      )}
    </GlassCard>
  );
}
