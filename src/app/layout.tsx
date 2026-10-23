import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TrackVest — Personal Investment Portfolio Tracker',
  description: 'Track your investments simply. Modern personal digital portfolio notebook without complex trading interfaces.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  userScalable: false,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-brand-100 selection:text-brand-900 overscroll-none">
        {children}
      </body>
    </html>
  );
}

