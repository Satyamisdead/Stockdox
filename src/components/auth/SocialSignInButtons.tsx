
"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { auth, googleProvider } from "@/lib/firebase"; // Import providers
import { signInWithPopup, type AuthError } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState } from "react";

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
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" {...props}>
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-1.842.038-3.54 1.182-4.446 2.972-1.938 3.823-.48 9.576 1.482 12.65 1.002 1.562 2.08 3.323 3.516 3.323.019 0 1.482-.019 1.482-.019.019 0 1.501.019 1.501.019 1.417 0 2.535-1.742 3.516-3.323 1.98-3.055 3.457-8.808 1.482-12.65-.964-1.842-2.673-3.01-4.526-2.972-.589-.02-1.138.038-1.723.038-.285.019-.551.057-.801.057Zm.057-3.416c.038 0 .057.019.095.019.133.019.248.019.382.019.782 0 1.482-.362 2.02-.915-.982-.763-2.23-1.182-3.419-1.22-.648-.038-1.277.172-1.763.458.172.648.515 1.258 1.048 1.649.229.172.477.267.744.267.114 0 .229-.019.324-.038Z"/>
    </svg>
);


export default function SocialSignInButtons() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingApple, setIsLoadingApple] = useState(false);

  const handleSignIn = async (providerName: 'google' | 'apple') => {
    if (providerName === 'google') setIsLoadingGoogle(true);
    if (providerName === 'apple') setIsLoadingApple(true);

    if (providerName === 'apple') {
      toast({
        title: "Coming Soon",
        description: "Sign in with Apple is not yet available.",
        variant: "default"
      });
      setIsLoadingApple(false);
      return;
    }

    try {
      if (providerName === 'google' && auth && googleProvider) {
        await signInWithPopup(auth, googleProvider);
        toast({ title: "Success", description: `Signed in with Google successfully.` });
      } else {
         toast({
          title: "Error",
          description: `Sign in with ${providerName} is not configured correctly.`,
          variant: "destructive"
        });
        return;
      }

      const redirectPath = searchParams.get('redirect');
      const targetPath = redirectPath && redirectPath.startsWith('/') ? redirectPath : '/';
      router.push(targetPath);
      router.refresh();
    } catch (error) {
      const authError = error as AuthError;
      let errorMessage = authError.message || `Failed to sign in with Google.`;
      if (authError.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in process was cancelled.';
      } else if (authError.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with the same email address but different sign-in credentials. Try signing in with a different method.';
      } else if (authError.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Multiple sign-in attempts detected. Please try again.';
      }
      console.error(`Google sign-in error:`, authError.code, authError.message);
      toast({ title: "Sign In Error", description: errorMessage, variant: "destructive" });
    } finally {
      if (providerName === 'google') setIsLoadingGoogle(false);
      if (providerName === 'apple') setIsLoadingApple(false);
    }

  };

  return (
    <div className="space-y-2">
      <Button variant="outline" className="w-full gap-2" onClick={() => handleSignIn('google')} disabled={isLoadingGoogle || isLoadingApple}>
        {isLoadingGoogle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
         Sign in with Google
      </Button>
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => handleSignIn('apple')}
        disabled={isLoadingGoogle || isLoadingApple}>
        {isLoadingApple ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AppleIcon className="h-5 w-5" />}
         Sign in with Apple
      </Button>
    </div>
  );
}
