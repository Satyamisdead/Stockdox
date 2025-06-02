
"use client";

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPWAHandler() {
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { toast, dismiss } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      console.log("beforeinstallprompt event fired");
      setDeferredInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  useEffect(() => {
    if (deferredInstallPrompt && isMobile && typeof window !== 'undefined' && !(window.matchMedia('(display-mode: standalone)').matches)) {
      const toastId = "install-pwa-toast";
      toast({
        id: toastId,
        title: 'Install Stockdox App?',
        description: 'Add Stockdox to your home screen for a better experience.',
        action: (
          <Button
            variant="default"
            size="sm"
            onClick={async () => {
              if (deferredInstallPrompt) {
                try {
                  await deferredInstallPrompt.prompt();
                  const { outcome } = await deferredInstallPrompt.userChoice;
                  if (outcome === 'accepted') {
                    console.log('User accepted the A2HS prompt');
                    toast({ title: 'Success', description: 'App installed successfully!' });
                  } else {
                    console.log('User dismissed the A2HS prompt');
                  }
                } catch (error) {
                  console.error('Error during A2HS prompt:', error);
                   toast({ title: 'Error', description: 'Could not install app.', variant: 'destructive' });
                } finally {
                  setDeferredInstallPrompt(null); // Clear the prompt
                  dismiss(toastId); // Dismiss the install prompt toast
                }
              }
            }}
          >
            <Download className="mr-2 h-4 w-4" /> Install
          </Button>
        ),
        duration: 20000, // Keep toast longer for user to interact
      });
    }
  }, [deferredInstallPrompt, isMobile, toast, dismiss]);

  return null; // This component does not render anything itself
}
