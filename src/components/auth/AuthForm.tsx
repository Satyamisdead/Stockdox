
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
  type AuthError
} from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import SocialSignInButtons from "./SocialSignInButtons";
import { useState } from "react";
import { Loader2 } from "lucide-react";

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
  // Hook for showing toasts (notifications)
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handler for form submission (email/password sign-in/sign-up)
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (!auth) { 
      toast({ 
        title: "Firebase Not Configured", 
        description: "The app is not connected to Firebase. Please see the developer console (F12) for instructions on how to set up your .env.local file.", 
        variant: "destructive",
        duration: 10000,
      });
      setIsLoading(false);
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
      const redirectPath = searchParams.get('redirect');
      const targetPath = redirectPath && redirectPath.startsWith('/') ? redirectPath : '/';
      // Redirect to the target path or home page on success
      router.push(targetPath);
      router.refresh(); // Refresh to ensure layout updates with new auth state
    } catch (error) {
      const authError = error as AuthError;
      let errorMessage = authError.message || `Failed to ${mode}. Please try again.`;
      // Customize messages for common errors
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (authError.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already in use.';
      } else if (authError.code === 'auth/network-request-failed') {
          errorMessage = "A network error occurred. Please ensure you are online and check if your domain is authorized in Firebase Authentication settings.";
      } else if (authError.code === 'auth/unauthorized-domain') {
          errorMessage = "This domain is not authorized for sign-in. Please add it to your Firebase project's settings.";
      }
      console.error(`${mode} error:`, authError.code, authError.message);
      toast({ title: `${mode === "signup" ? "Sign Up" : "Sign In"} Error`, description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  // Render the authentication form
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold font-headline">{mode === "signin" ? "Welcome Back" : "Create an Account"}</h1>
        {/* Conditional subtitle based on mode */}
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
                {/* Label and input for email */}
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
                {/* Label and input for password */}
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input placeholder="••••••••" {...field} type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Submit button with loading indicator */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </Button>
          {/* Divider or "Or continue with" section */}
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
      {/* Social sign-in buttons component */}
      <SocialSignInButtons />
    </div>
  );
}
