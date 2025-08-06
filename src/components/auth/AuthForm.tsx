
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
  updateProfile,
  type AuthError,
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import SocialSignInButtons from "./SocialSignInButtons";
import { useState } from "react";
import { Loader2 } from "lucide-react";

// Define form schemas using Zod
const baseSchema = {
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
};

const signInSchema = z.object(baseSchema);

const signUpSchema = z.object({
  ...baseSchema,
  fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

type AuthFormProps = {
  mode: "signin" | "signup";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = mode === 'signup' ? signUpSchema : signInSchema;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      ...(mode === 'signup' && { fullName: "" }),
    },
  });
  
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
        const signUpValues = values as z.infer<typeof signUpSchema>;
        const userCredential = await createUserWithEmailAndPassword(auth, signUpValues.email, signUpValues.password);
        await updateProfile(userCredential.user, {
          displayName: signUpValues.fullName
        });
        toast({ title: "Success", description: "Account created successfully! Welcome." });
      } else {
        const signInValues = values as z.infer<typeof signInSchema>;
        await signInWithEmailAndPassword(auth, signInValues.email, signInValues.password);
        toast({ title: "Success", description: "Signed in successfully! Welcome back." });
      }
      // The root layout's effect will handle showing the main app content.
    } catch (error) {
      const authError = error as AuthError;
      let errorMessage = authError.message || `Failed to ${mode}. Please try again.`;
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
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

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold font-headline">{mode === "signin" ? "Welcome Back" : "Create an Account"}</h1>
        <p className="text-muted-foreground">
          {mode === "signin" ? "Sign in to access your Stockdox dashboard." : "Enter your details to create an account."}
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
           {mode === "signup" && (
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} autoComplete="name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
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
