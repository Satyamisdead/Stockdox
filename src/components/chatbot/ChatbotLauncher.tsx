
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import ChatRoomWindow from './ChatRoomWindow';

export default function ChatbotLauncher() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed right-4 bottom-20 md:right-6 md:bottom-6 h-14 w-14 rounded-full shadow-lg z-50 animate-pulse hover:animate-none"
        onClick={() => setIsChatOpen(true)}
        aria-label="Open Stockdox AI Chat"
      >
        <Bot className="h-7 w-7" />
      </Button>
      <ChatRoomWindow isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}

