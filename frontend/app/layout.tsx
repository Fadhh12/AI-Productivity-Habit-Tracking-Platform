import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/auth';
import { ConfirmProvider } from '@/lib/confirm';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'),
  title: { default: 'Continuum', template: '%s | Continuum' },
  description: 'Bangun kebiasaan produktif tanpa takut gagal.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Continuum',
    locale: 'id_ID',
    title: 'Continuum: kebiasaan baik tanpa rasa bersalah',
    description: 'Habit tracker dengan AI coach. Bolos sehari bukan kegagalan.',
  },
  twitter: { card: 'summary_large_image' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Continuum',
  },
};

export const viewport: Viewport = {
  themeColor: '#16171D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            // The worker caches app files and would fight hot reloading, so it only runs in production builds;
            // in development, remove any worker left over from an earlier production run.
            __html:
              process.env.NODE_ENV === 'production'
                ? `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `
                : `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
                caches.keys().then((keys) => keys.filter((k) => k.startsWith('continuum-')).forEach((k) => caches.delete(k)));
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
