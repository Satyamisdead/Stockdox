
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ChatRoomWindow from './ChatRoomWindow';
import { Bot } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ChatbotLauncher() {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLauncherClick = () => {
    // With the vault-style login, we know `user` will exist if this component is rendered.
    // The check becomes simpler.
    setIsChatOpen(true);
  };

  if (!isMounted || !user) {
    // Don't render the button if not mounted or if somehow rendered without a user.
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
      <ChatRoomWindow isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
