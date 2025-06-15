
"use client";

import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X, Bot } from 'lucide-react'; // Ensured Bot is imported
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface ChatRoomWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatRoomWindow({ isOpen, onClose }: ChatRoomWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    if (currentMessage.trim() === '') return;

    const newUserMessage: Message = {
      id: Date.now().toString() + Math.random().toString(36).substring(7) + 'user',
      sender: 'user',
      text: currentMessage.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    const userMsg = currentMessage.trim(); // Capture before clearing
    setCurrentMessage('');

    // Mock AI response
    setTimeout(() => {
      let aiText = "I'm processing your request... One moment.";
      if (userMsg.toLowerCase().includes("hello") || userMsg.toLowerCase().includes("hi")) {
        aiText = "Hello there! How can I assist you with market data today?";
      } else if (userMsg.toLowerCase().includes("stockdox") || userMsg.toLowerCase().includes("app")) {
        aiText = "Stockdox is your friendly assistant for market insights! Ask me about stocks, crypto, or news.";
      } else if (userMsg.toLowerCase().includes("help")) {
        aiText = "You can ask me for stock prices, news, or general information. For example, 'What's the price of AAPL?' or 'Latest news on Bitcoin'.";
      } else if (userMsg.toLowerCase().includes("thank")) {
        aiText = "You're welcome! Let me know if there's anything else.";
      } else {
         aiText = `I received: "${userMsg}". I'm still learning to process complex requests. Try asking about a specific stock symbol.`;
      }

      const aiResponse: Message = {
        id: Date.now().toString() + Math.random().toString(36).substring(7) + 'ai',
        sender: 'ai',
        text: aiText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1200);
  };

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      // Access the viewport element within ScrollArea
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100); // Delay focus slightly for transition
    }
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 outline-none ring-0 focus:ring-0 focus:outline-none" aria-describedby={undefined}>
        <SheetHeader className="p-4 border-b bg-card">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-primary font-headline">Stockdox AI</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <X className="h-5 w-5" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-grow p-4 space-y-3 bg-background" ref={scrollAreaRef}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col mb-3",
                msg.sender === 'user' ? 'items-end' : 'items-start'
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] p-3 rounded-xl shadow-md text-sm leading-relaxed",
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-card text-card-foreground rounded-bl-none border'
                )}
              >
                <p>{msg.text}</p>
              </div>
              <p className={cn(
                "text-xs mt-1.5",
                msg.sender === 'user' ? 'text-right pr-1 text-muted-foreground/80' : 'text-left pl-1 text-muted-foreground/80'
                )}
              >
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot size={48} className="mb-4 text-primary/50" />
              <p className="font-semibold">Welcome to Stockdox AI!</p>
              <p className="text-sm mt-1">
                Ask me about market trends, specific stocks, or crypto news.
              </p>
              <p className="text-xs mt-3">e.g., "What is the price of Bitcoin?"</p>
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <Input
              ref={inputRef}
              type="text"
              placeholder="Ask Stockdox AI..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              className="flex-grow bg-background focus:ring-primary/50"
              autoComplete="off"
            />
            <Button type="submit" size="default" disabled={!currentMessage.trim()} className="px-4">
              <Send className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
