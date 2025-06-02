
import type { Metadata } from 'next';
import './globals.css';
import { FirebaseProvider } from '@/contexts/FirebaseProvider';
import { Toaster } from '@/components/ui/toaster';
import SiteHeader from '@/components/core/SiteHeader';
import SiteFooter from '@/components/core/SiteFooter';
import MobileBottomNav from '@/components/core/MobileBottomNav'; // Added import

export const metadata: Metadata = {
  title: 'Stockdox',
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
          <main className="flex-grow container mx-auto px-4 py-8 pb-20 md:pb-8"> {/* Added bottom padding for mobile nav */}
            {children}
          </main>
          <SiteFooter />
          <MobileBottomNav /> {/* Added MobileBottomNav */}
          <Toaster />
        </FirebaseProvider>
      </body>
    </html>
  );
}
