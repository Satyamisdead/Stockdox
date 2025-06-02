
import type { Metadata } from 'next';
import './globals.css';
import { FirebaseProvider } from '@/contexts/FirebaseProvider';
import { Toaster } from '@/components/ui/toaster';
import SiteHeader from '@/components/core/SiteHeader';
import SiteFooter from '@/components/core/SiteFooter';
import MobileBottomNav from '@/components/core/MobileBottomNav';
import InstallPWAHandler from '@/components/core/InstallPWAHandler';

export const metadata: Metadata = {
  title: 'Stockdox',
  description: 'Real-time stock and cryptocurrency tracking application',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        <meta name="application-name" content="Stockdox" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Stockdox" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#FFD700" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <FirebaseProvider>
          <SiteHeader />
          {/* Adjusted main content padding:
              Mobile: pt-16 (4rem) to account for sticky h-14 mobile header + some space
              Desktop: pt-8 (2rem) as header is taller (h-16) but layout is different
              Bottom padding accounts for mobile nav (pb-20 = 5rem) or standard footer (md:pb-8 = 2rem)
          */}
          <main className="flex-grow container mx-auto px-4 pt-16 md:pt-8 pb-20 md:pb-8">
            {children}
          </main>
          <SiteFooter />
          <MobileBottomNav />
          <InstallPWAHandler />
          <Toaster />
        </FirebaseProvider>
      </body>
    </html>
  );
}
