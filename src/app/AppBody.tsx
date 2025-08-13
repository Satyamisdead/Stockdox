
"use client";

import SiteHeader from '@/components/core/SiteHeader';
import SiteFooter from '@/components/core/SiteFooter';
import MobileBottomNav from '@/components/core/MobileBottomNav';
import ChatbotLauncher from '@/components/chatbot/ChatbotLauncher';
import { useAuth } from '@/hooks/useAuth';
import Loading from './loading';
import AuthOverlay from '@/components/auth/AuthOverlay';
import WatchlistMonitor from '@/components/market/WatchlistMonitor';

export default function AppBody({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <AuthOverlay />;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 pt-6 md:pt-8 pb-20 md:pb-8">
        {children}
      </main>
      <SiteFooter />
      <MobileBottomNav />
      <ChatbotLauncher />
      <WatchlistMonitor />
    </>
  );
}
