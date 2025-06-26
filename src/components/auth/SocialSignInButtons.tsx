
"use client";

import { Button } from "@/components/ui/button";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, type AuthError } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Chrome, Loader2 } from "lucide-react";
import { useState } from "react";

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
        description: `Firebase authentication for Google Sign-In is not configured.`,
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
        {isLoadingGoogle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome className="h-4 w-4" />}
         Sign in with Google
      </Button>
    </div>
  );
}
