
"use client";

import { Button } from "@/components/ui/button";
import { auth, appleProvider } from "@/lib/firebase";
import { signInWithRedirect, type AuthError } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Inline SVG for Apple Icon
const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24px" height="24px" {...props} fill="currentColor">
    <path d="M19.3,13.7c-0.6,1.8-2,3.3-3.8,3.3c-1.3,0-2.2-0.6-3.4-0.6s-2.2,0.6-3.5,0.6c-1.8,0-3.4-1.6-4-3.4 C3.6,11.5,4.3,6.8,7.6,5.3C8.8,4.7,10.4,4.5,12,4.5c0.5,0,1.1,0.1,1.6,0.2c0.4,0.1,0.8,0.2,1.2,0.4c-1.1,0.9-1.8,2.3-1.8,3.8 c0,0.2,0,0.3,0,0.5c0.2,0,0.3,0,0.5,0c1.7,0,3.2-1,4.2-2.3C19.7,8.2,19.9,11.3,19.3,13.7z" />
    <path d="M12.1,4.1C11.1,4.1,9.9,4.4,8.9,4.8C8.3,4.1,8,3.1,8.3,2.2C9.5,2.4,10.8,2.8,11.8,3.6C11.9,3.7,12,3.9,12.1,4.1z" />
  </svg>
);

const REDIRECT_PENDING_KEY = 'firebase-redirect-pending';

export default function SocialSignInButtons() {
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  const handleRedirectSignIn = async (provider: any) => {
    setIsSigningIn(true);
    const providerName = provider.providerId.includes('apple') ? "Apple" : "Google";

    if (!auth || !provider) {
      toast({
        title: "Firebase Not Configured",
        description: `${providerName} sign-in is not available. Please check your developer console.`,
        variant: "destructive",
        duration: 10000,
      });
      setIsSigningIn(false);
      return;
    }

    try {
      // Set a flag in session storage to indicate a redirect is about to happen.
      sessionStorage.setItem(REDIRECT_PENDING_KEY, 'true');
      await signInWithRedirect(auth, provider);
      // The user is redirected away. The loading indicator will persist until the page unloads.
    } catch (error) {
      // This catch block will typically handle immediate errors, like misconfiguration.
      sessionStorage.removeItem(REDIRECT_PENDING_KEY); // Clean up on immediate error
      const authError = error as AuthError;
      let errorMessage = authError.message || `Failed to start sign in with ${providerName}.`;
      if (authError.code === 'auth/unauthorized-domain') {
          errorMessage = "This domain is not authorized for sign-in. Please add it to your Firebase project's settings.";
      } else if (authError.code === 'auth/network-request-failed') {
          errorMessage = "A network error occurred. Please ensure you are online.";
      }
      console.error(`${providerName} sign-in error:`, authError.code, authError.message);
      toast({ title: "Sign In Error", description: errorMessage, variant: "destructive" });
      setIsSigningIn(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button variant="outline" className="w-full gap-2" onClick={() => handleRedirectSignIn(appleProvider)} disabled={isSigningIn}>
        {isSigningIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AppleIcon className="h-5 w-5" />}
        Sign in with Apple
      </Button>
    </div>
  );
}
