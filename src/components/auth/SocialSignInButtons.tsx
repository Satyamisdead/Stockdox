
"use client";

import { Button } from "@/components/ui/button";
import { auth, googleProvider, appleProvider } from "@/lib/firebase";
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

// Inline SVG for Google Icon
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.531,44,28.718,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);

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
    const providerName = provider === googleProvider ? "Google" : "Apple";

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
      // This key helps the FirebaseProvider know a redirect was initiated.
      sessionStorage.setItem(REDIRECT_PENDING_KEY, 'true');
      await signInWithRedirect(auth, provider);
      // The user is redirected away. The loading indicator will persist until the page unloads.
    } catch (error) {
      // This catch block will typically handle immediate errors, like misconfiguration.
      sessionStorage.removeItem(REDIRECT_PENDING_KEY);
      const authError = error as AuthError;
      let errorMessage = authError.message || `Failed to start sign in with ${providerName}.`;
      if (authError.code === 'auth/unauthorized-domain') {
          errorMessage = "This domain is not authorized for sign-in. Please add it to your Firebase project's settings.";
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
