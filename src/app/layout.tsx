import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ISKCON Sadhana Card Portal',
  description: 'Time-based Vaishnava Sadhana Record & Date-Range Reporting PWA',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.png',
    shortcut: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#ea580c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} h-full`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Sadhana Card" />
        <meta name="application-name" content="Sadhana Card" />
        <meta name="theme-color" content="#ea580c" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
        <Navbar />
        <PwaInstallPrompt />
        <main className="flex-1 pb-16">{children}</main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
          <p className="font-semibold text-slate-700">
            For the Pleasure of Guru, Srila Prabhupada & Sri Sri Gaur Natraj Dayal Nitai &bull; ISKCON Greater Noida
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Raw Time Source of Truth &bull; Excel Rule Calculation Engine &bull; Interval-Aware Target Scaling
          </p>
        </footer>
      </body>
    </html>
  );
}
