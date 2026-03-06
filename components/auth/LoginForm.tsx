
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { useI18n } from '@/lib/i18n';
import { Zap } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || t('auth.login_failed'));
        return;
      }

      router.push('/');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-8 backdrop-blur-3xl bg-glass/40 border-glass-border shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sing-blue/20 text-sing-blue mb-4 ring-1 ring-sing-blue/30">
             <Zap className="w-6 h-6 fill-current" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Sing<span className="text-sing-blue">UI</span>
          </h1>
          <p className="text-sing-text-secondary text-sm">{t('auth.login_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={t('auth.username')}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('auth.username')}
            required
            autoFocus
          />
          <Input
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <div className="p-3 rounded-lg bg-sing-red/10 border border-sing-red/20 text-sing-red text-xs text-center font-medium">
                {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            isLoading={loading}
            size="lg"
          >
            {t('auth.login_button')}
          </Button>
        </form>
    </GlassCard>
  );
}
