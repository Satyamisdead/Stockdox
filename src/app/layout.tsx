
import './globals.css';
import { Providers } from '@/contexts/Providers';
import { Toaster } from '@/components/ui/toaster';
import AppBody from './AppBody'; // Import the new component

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
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background text-foreground">
        <Providers>
          <AppBody>
            {children}
          </AppBody>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
