
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
import { useState } from "react";
import { Loader2 } from "lucide-react";
import StockdoxLogo from "./StockdoxLogo";

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
  onToggleMode: () => void;
};

export default function AuthForm({ mode, onToggleMode }: AuthFormProps) {
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
    <div className="flex flex-col flex-grow w-full max-w-sm mx-auto select-none">
      {/* Top Animated SVG Logo */}
      <div className="flex justify-center mb-6">
        <img
          src="/anilogo.svg"
          alt="Stockdox Animated Logo"
          className="w-64 h-36 object-contain"
        />
      </div>

      {/* Welcome Title */}
      <div className="flex flex-col items-center space-y-2 text-center mb-8">
        <div className="flex items-center justify-center gap-3">
          <StockdoxLogo variant="icon" />
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-headline">
            {mode === "signin" ? "Welcome Back" : "Create Account"}
          </h1>
          <StockdoxLogo variant="icon" />
        </div>
        <p className="text-sm font-medium text-neutral-500">
          {mode === "signin" ? "Sign in to access your Stockdox dashboard." : "Enter your details to create an account."}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
           {mode === "signup" && (
            <FormField
              control={form.control as any}
              name="fullName"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-semibold text-neutral-300">Full Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John Doe" 
                      {...field} 
                      autoComplete="name"
                      className="bg-black border border-black focus-visible:ring-1 focus-visible:ring-[#FFE600] focus-visible:ring-offset-0 focus-visible:border-black rounded-xl h-12 text-white placeholder-neutral-700 px-4"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-xs" />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-semibold text-neutral-300">Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="you@example.com" 
                    {...field} 
                    type="email" 
                    autoComplete="email" 
                    className="bg-black border border-black focus-visible:ring-1 focus-visible:ring-[#FFE600] focus-visible:ring-offset-0 focus-visible:border-black rounded-xl h-12 text-white placeholder-neutral-700 px-4"
                  />
                </FormControl>
                <FormMessage className="text-red-500 text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-semibold text-neutral-300">Password</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="••••••••" 
                    {...field} 
                    type="password" 
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} 
                    className="bg-black border border-black focus-visible:ring-1 focus-visible:ring-[#FFE600] focus-visible:ring-offset-0 focus-visible:border-black rounded-xl h-12 text-white placeholder-neutral-700 px-4"
                  />
                </FormControl>
                <FormMessage className="text-red-500 text-xs" />
              </FormItem>
            )}
          />
          
          {/* Yellow Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-between w-full h-12 px-4 bg-[#FFE600] text-black font-extrabold rounded-xl hover:bg-[#FFE600]/95 active:scale-[0.99] transition-all disabled:opacity-50 select-none shadow-md mt-6"
          >
            <StockdoxLogo variant="button-logo" className="w-12 h-8" />
            <span className="flex items-center gap-2 font-extrabold font-headline text-base tracking-wide">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin text-black" />}
              {mode === "signin" ? "Sign In" : "Sign Up"}
            </span>
            <StockdoxLogo variant="button-logo" className="w-12 h-8" />
          </button>
        </form>
      </Form>

      {/* Switch Mode Link */}
      <p className="mt-6 text-center text-sm font-medium text-neutral-400">
        {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
        <button 
          onClick={onToggleMode} 
          type="button"
          className="font-semibold text-[#FFE600] hover:underline focus:outline-none"
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>

      {/* Bottom STOCKDOX Branding */}
      <div className="mt-auto pt-16 pb-4 flex justify-center items-center">
        <span className="text-white text-5xl tracking-widest font-bebas uppercase select-none">
          STOCK<span className="text-[#00D600]">DOX</span>
        </span>
      </div>
    </div>
  );
}

