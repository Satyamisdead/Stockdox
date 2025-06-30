
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ChatRoomWindow from './ChatRoomWindow';
import { Bot } from 'lucide-react';

export default function ChatbotLauncher() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed right-4 bottom-20 md:right-6 md:bottom-6 h-16 w-16 rounded-full shadow-lg z-50 flex items-center justify-center animate-pulse hover:animate-none"
        onClick={() => setIsChatOpen(true)}
        aria-label="Open Stockdox AI Chat"
      >
        <Bot className="h-8 w-8" />
      </Button>
      <ChatRoomWindow isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
