import type { Metadata } from 'next';
import './globals.css';
import { FirebaseProvider } from '@/contexts/FirebaseProvider';
import { Toaster } from '@/components/ui/toaster';
import SiteHeader from '@/components/core/SiteHeader';
import SiteFooter from '@/components/core/SiteFooter';

export const metadata: Metadata = {
  title: 'MarketPulse',
  description: 'Real-time stock and cryptocurrency tracking application',
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
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <FirebaseProvider>
          <SiteHeader />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <SiteFooter />
          <Toaster />
        </FirebaseProvider>
      </body>
    </html>
  );
}
