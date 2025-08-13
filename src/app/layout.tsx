
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
