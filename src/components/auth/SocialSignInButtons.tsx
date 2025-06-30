
"use client";

import { Button } from "@/components/ui/button";
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


export default function SocialSignInButtons() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    if (!auth || !googleProvider) {
      toast({
        title: "Configuration Error",
        description: "Firebase authentication for Google Sign-In is not configured.",
        variant: "destructive"
      });
      setIsLoadingGoogle(false);
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
      const redirectPath = searchParams.get('redirect');
      const targetPath = redirectPath && redirectPath.startsWith('/') ? redirectPath : '/';
      toast({ title: "Success", description: `Signed in with Google successfully.` });
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
      setIsLoadingGoogle(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button variant="outline" className="w-full gap-2" onClick={handleGoogleSignIn} disabled={isLoadingGoogle}>
        {isLoadingGoogle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
         Sign in with Google
      </Button>
    </div>
  );
}
