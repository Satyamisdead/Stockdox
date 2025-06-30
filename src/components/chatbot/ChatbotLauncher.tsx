
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ChatRoomWindow from './ChatRoomWindow';

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
        className="fixed right-4 bottom-20 md:right-6 md:bottom-6 h-14 w-14 rounded-full shadow-lg z-50 animate-pulse hover:animate-none"
        onClick={() => setIsChatOpen(true)}
        aria-label="Open Stockdox AI Chat"
      >
        <span className="font-bold text-xl">AI</span>
      </Button>
      <ChatRoomWindow isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
