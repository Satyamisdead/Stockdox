
"use client";

import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, User } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import { stockdoxChat, type StockdoxChatInput } from '@/ai/flows/stockdox-chat-flow';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


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
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Add initial welcome message from AI when chat opens and messages are empty
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialAiMessage: Message = {
        id: Date.now().toString() + 'ai-initial',
        sender: 'ai',
        text: "Hello! I am Stockdox AI, created by Alston Tahir and powered by Satyam Tiwari. How can I assist you with your financial queries today?",
        timestamp: new Date(),
      };
      setMessages([initialAiMessage]);
    }
  }, [isOpen]); // Removed messages.length from dependency to avoid re-triggering on new messages

  const handleSendMessage = async () => {
    if (currentMessage.trim() === '' || isLoadingAI) return;

    const userMessageText = currentMessage.trim();
    const newUserMessage: Message = {
      id: Date.now().toString() + Math.random().toString(36).substring(7) + 'user',
      sender: 'user',
      text: userMessageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    setCurrentMessage('');
    setIsLoadingAI(true);

    try {
      const chatInput: StockdoxChatInput = { message: userMessageText };
      const aiResponseData = await stockdoxChat(chatInput);
      
      const aiResponse: Message = {
        id: Date.now().toString() + Math.random().toString(36).substring(7) + 'ai',
        sender: 'ai',
        text: aiResponseData.reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error calling Stockdox AI flow:", error);
      const errorResponse: Message = {
        id: Date.now().toString() + 'ai-error',
        sender: 'ai',
        text: "I'm sorry, I encountered a technical difficulty. Please try again later.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        setTimeout(() => { // Ensure DOM update before scrolling
          viewport.scrollTop = viewport.scrollHeight;
        }, 0);
      }
    }
  }, [messages]);
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100); 
    }
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md flex flex-col p-0 outline-none ring-0 focus:ring-0 focus:outline-none" 
        aria-describedby={undefined}
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking on a toast (often appears above the sheet)
          const target = e.target as HTMLElement;
          if (target.closest('[data-radix-toast-provider]')) {
            e.preventDefault();
          }
        }}
      >
        <SheetHeader className="p-4 border-b bg-card">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  AI
                </AvatarFallback>
              </Avatar>
              <SheetTitle className="text-primary font-headline">Stockdox AI</SheetTitle>
            </div>
            {/* The default SheetContent close button will be used. No need for a custom one here. */}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-grow p-4 space-y-1 bg-background" ref={scrollAreaRef}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-end mb-3 w-full", 
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.sender === 'ai' && (
                <Avatar className="h-7 w-7 mr-2 self-start shrink-0">
                   <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs">
                    AI
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={cn("flex flex-col", msg.sender === 'user' ? 'items-end' : 'items-start', "max-w-[85%]")}>
                <div
                  className={cn(
                    "p-2.5 rounded-xl shadow-md text-sm leading-relaxed",
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-card text-card-foreground rounded-bl-none border'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <p className={cn(
                  "text-xs mt-1",
                  msg.sender === 'user' ? 'text-right pr-1 text-muted-foreground/70' : 'text-left pl-1 text-muted-foreground/70'
                  )}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.sender === 'user' && (
                 <Avatar className="h-7 w-7 ml-2 self-start shrink-0">
                   <AvatarFallback className="bg-accent text-accent-foreground">
                    <User size={16} />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoadingAI && (
            <div className="flex items-center justify-start mb-3 w-full">
               <Avatar className="h-7 w-7 mr-2 self-start shrink-0">
                  <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs">
                    AI
                  </AvatarFallback>
                </Avatar>
              <div className="p-2.5 rounded-xl shadow-md bg-card text-card-foreground rounded-bl-none border flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Stockdox AI is typing...</span>
              </div>
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
              disabled={isLoadingAI}
            />
            <Button type="submit" size="default" disabled={!currentMessage.trim() || isLoadingAI} className="px-4">
              {isLoadingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="hidden sm:inline ml-2">{isLoadingAI ? "Sending..." : "Send"}</span>
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
