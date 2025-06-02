"use client";

import { Button } from "@/components/ui/button";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, AuthError } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Chrome } from "lucide-react"; // Using Chrome as a generic browser/Google icon

export default function SocialSignInButtons() {
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    if (!auth || !googleProvider) {
      toast({ title: "Error", description: "Authentication service not available.", variant: "destructive" });
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/');
      toast({ title: "Success", description: "Signed in with Google successfully." });
    } catch (error) {
      const authError = error as AuthError;
      console.error("Google sign-in error:", authError);
      toast({ title: "Sign In Error", description: authError.message || "Failed to sign in with Google.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-2">
      <Button variant="outline" className="w-full gap-2" onClick={handleGoogleSignIn}>
        <Chrome className="h-4 w-4" /> Sign in with Google
      </Button>
    </div>
  );
}
