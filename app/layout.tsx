import type { Metadata } from 'next';
import '@fontsource/geist-sans';
import '@fontsource/geist-mono';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Singular - sing-box Management Panel',
  description: 'Web management panel for sing-box proxy',
};

import Providers from './providers';
import { isIPBlocked, getClientIP } from '@/lib/security';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ip = await getClientIP();
  const blocked = await isIPBlocked(ip);

  if (blocked) {
    return (
      <html lang="en">
        <body className="font-sans bg-black text-white antialiased">
          <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-white">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4 font-mono">403 Forbidden</h1>
              <p className="text-neutral-400 font-mono">Your IP address ({ip}) has been blocked.</p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans bg-black text-white antialiased selection:bg-sing-blue/30">
        <ThemeProvider>
          <Providers>{children}</Providers>
          <Toaster
            theme="dark"
            position="top-center"
            toastOptions={{
              style: {
                background: 'rgba(17, 24, 39, 0.9)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '12px',
                borderRadius: '1rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
