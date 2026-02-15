'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);

  useEffect(() => {
    checkSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkSetup = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        router.push('/');
        return;
      }
    } catch {}

    setLoading(false);
  };

  const handleSetup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/setup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCredentials(data.data);
        setSetupComplete(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <p className="text-white/50">Loading...</p>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-bold text-white mb-4 text-center">
        Welcome to SingUI
      </h1>

      {setupComplete ? (
        <div className="space-y-4">
          <p className="text-white/70 text-center">
            Setup complete! Here are your credentials:
          </p>
          <div className="bg-white/5 rounded-lg p-4 space-y-2">
            <p className="text-white">
              <span className="text-white/50">Username:</span> {credentials?.username}
            </p>
            <p className="text-white">
              <span className="text-white/50">Password:</span> {credentials?.password}
            </p>
          </div>
          <p className="text-yellow-400 text-sm text-center">
            Please save these credentials and change the password after login.
          </p>
          <Button
            className="w-full"
            onClick={() => router.push('/login')}
          >
            Go to Login
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-white/70 text-center">
            This will create the default admin account and initialize settings.
          </p>
          <Button
            className="w-full"
            onClick={handleSetup}
            disabled={loading}
          >
            {loading ? 'Setting up...' : 'Start Setup'}
          </Button>
        </div>
      )}
    </Card>
  );
}
