
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ChatRoomWindow from './ChatRoomWindow';
import { Bot } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function ChatbotLauncher() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLauncherClick = () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please sign in to use the AI chatbot.',
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push('/signin?redirect=/')}>
            Sign In
          </Button>
        ),
      });
      return;
    }
    setIsChatOpen(true);
  };

  if (!isMounted || loading) {
    return null;
  }

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed right-4 bottom-20 md:right-6 md:bottom-6 h-16 w-16 rounded-full shadow-lg z-50 flex items-center justify-center animate-pulse hover:animate-none"
        onClick={handleLauncherClick}
        aria-label="Open Stockdox AI Chat"
      >
        <Bot className="h-8 w-8" />
      </Button>
      {user && <ChatRoomWindow isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />}
    </>
  );
}
