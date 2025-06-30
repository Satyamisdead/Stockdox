
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
  },
  icons: {
    icon: '/favicon.svg',
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
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Stockdox" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" /> 
        <meta name="apple-mobile-web-app-title" content="Stockdox" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#000000" /> 
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" /> 

        {/* Viewport settings for responsiveness */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background text-foreground">
        <FirebaseProvider>
          <SiteHeader />
          <main className="flex-grow container mx-auto px-4 pt-6 md:pt-8 pb-20 md:pb-8">
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
