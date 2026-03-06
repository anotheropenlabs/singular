import type { Metadata } from 'next';
import '@fontsource/geist-sans';
import '@fontsource/geist-mono';
import './globals.css';

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
        </ThemeProvider>
      </body>
    </html>
  );
}
