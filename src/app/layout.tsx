
import type { Metadata } from 'next';
import './globals.css';
import { FirebaseProvider } from '@/contexts/FirebaseProvider';
import { Toaster } from '@/components/ui/toaster';
import SiteHeader from '@/components/core/SiteHeader';
import SiteFooter from '@/components/core/SiteFooter';
import MobileBottomNav from '@/components/core/MobileBottomNav';
import InstallPWAHandler from '@/components/core/InstallPWAHandler';
import ChatbotLauncher from '@/components/chatbot/ChatbotLauncher';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002'; // Fallback for local dev

export const metadata: Metadata = {
  title: 'Stockdox',
  description: 'Real-time stock and cryptocurrency tracking application. Your go-to PWA for market insights.',
  manifest: '/manifest.json',
  metadataBase: new URL(siteUrl), // Required for absolute image URLs in Open Graph
  openGraph: {
    title: 'Stockdox',
    description: 'Real-time stock and cryptocurrency tracking application. Your go-to PWA for market insights.',
    url: siteUrl,
    siteName: 'Stockdox',
    images: [
      {
        url: '/og-image.png', // Path relative to the public folder
        width: 1200,
        height: 630,
        alt: 'Stockdox App Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stockdox',
    description: 'Real-time stock and cryptocurrency tracking application. Your go-to PWA for market insights.',
    images: ['/og-image.png'], // Path relative to the public folder
    // creator: '@yourtwitterhandle', // Optional: Add your Twitter handle
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
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
        
        {/* PWA Meta Tags - some are covered by Next.js metadata, others can remain for full control */}
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

        {/* Viewport settings for responsiveness */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background text-foreground">
        <FirebaseProvider>
          <SiteHeader />
          {/* Main content padding:
              pt-16 (header) / pb-20 (mobile nav) for mobile
              pt-8 (header) / md:pb-8 (footer) for desktop
          */}
          <main className="flex-grow container mx-auto px-4 pt-16 md:pt-8 pb-20 md:pb-8">
            {children}
          </main>
          <SiteFooter />
          <MobileBottomNav />
          <InstallPWAHandler />
          <ChatbotLauncher />
          <Toaster />
        </FirebaseProvider>
      </body>
    </html>
  );
}
