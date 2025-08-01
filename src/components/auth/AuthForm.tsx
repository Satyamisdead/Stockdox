
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase"; // Direct import
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  getRedirectResult,
  type AuthError
} from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import SocialSignInButtons from "./SocialSignInButtons";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Loading from "@/app/loading";
import { useAuth } from "@/hooks/useAuth";


// Define the form schema using Zod
const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type AuthFormProps = {
  mode: "signin" | "signup";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    // This is the core of the fix. It runs once when the form loads.
    const checkRedirect = async () => {
      // Guard against running this before Firebase auth is initialized.
      if (!auth) {
        // This might happen on a hard refresh. We wait for the auth object.
        // The effect will re-run when auth becomes available via the useAuth hook.
        return;
      }
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // A user has successfully signed in via redirect.
          // The FirebaseProvider's onAuthStateChanged will handle the user state.
          // We just need to wait and not show the form.
          // The parent page's useEffect will handle redirecting to dashboard.
          toast({ title: "Signed In", description: "Login successful! Redirecting..." });
          // We keep `isCheckingRedirect` as true to show the loader until redirection happens.
        } else {
          // No redirect result, it's safe to show the form.
          setIsCheckingRedirect(false);
        }
      } catch (error) {
        console.error("Error checking redirect result", error);
        const authError = error as AuthError;
        let description = "An error occurred during sign in.";
        if (authError.code === 'auth/account-exists-with-different-credential') {
          description = "An account already exists with the same email address but different sign-in credentials. Try signing in with the original method."
        }
        toast({ title: "Sign In Error", description: description, variant: "destructive" });
        setIsCheckingRedirect(false); // Show form even on error
      }
    };

    checkRedirect();
  }, [toast, auth]); // Depend on the auth object to ensure it's initialized

  useEffect(() => {
    // Redirect if user is already logged in (and we are not in the middle of a check)
    if (!authLoading && user && !isCheckingRedirect) {
      const redirectPath = searchParams.get('redirect') || '/';
      router.push(redirectPath);
    }
  }, [user, authLoading, isCheckingRedirect, router, searchParams]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    if (!auth) { 
      toast({ 
        title: "Firebase Not Configured", 
        description: "The app is not connected to Firebase.", 
        variant: "destructive",
        duration: 10000,
      });
      setIsSubmitting(false);
      return;
    }
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, values.email, values.password);
        toast({ title: "Success", description: "Account created successfully! Redirecting..." });
      } else {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({ title: "Success", description: "Signed in successfully! Redirecting..." });
      }
      // The parent page's useEffect will handle the redirect.
    } catch (error) {
      const authError = error as AuthError;
      let errorMessage = authError.message || `Failed to ${mode}. Please try again.`;
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (authError.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already in use.';
      } else if (authError.code === 'auth/network-request-failed') {
          errorMessage = "A network error occurred. Please check your connection.";
      } else if (authError.code === 'auth/unauthorized-domain') {
          errorMessage = "This domain is not authorized for sign-in.";
      }
      console.error(`${mode} error:`, authError.code, authError.message);
      toast({ title: `${mode === "signup" ? "Sign Up" : "Sign In"} Error`, description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show a full-page loader while checking auth state or redirect result
  if (isCheckingRedirect || authLoading) {
    return <Loading />;
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold font-headline">{mode === "signin" ? "Welcome Back" : "Create an Account"}</h1>
        <p className="text-muted-foreground">
          {mode === "signin" ? "Sign in to access your Stockdox dashboard." : "Enter your email and password to sign up."}
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" {...field} type="email" autoComplete="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input placeholder="••••••••" {...field} type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </Button>
        </form>
      </Form>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <SocialSignInButtons />
    </div>
  );
}
