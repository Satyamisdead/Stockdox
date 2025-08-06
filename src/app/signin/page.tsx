
"use client";

import AuthForm from "@/components/auth/AuthForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/app/loading";


export default function SignInPage() {
  const isMobile = useIsMobile();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // This effect redirects a user who is ALREADY logged in.
    // It will run after the auth state is confirmed by the provider.
    if (!authLoading && user) {
      const redirectPath = searchParams.get('redirect') || '/';
      router.push(redirectPath);
    }
  }, [user, authLoading, router, searchParams]);

  // The loading gate:
  // Show a loader if the auth state is still loading, OR if a user object
  // exists (which means we are about to redirect).
  if (authLoading || user) {
    return <Loading />;
  }

  // Only if auth is done loading and there is no user, we show the form.
  return (
    <div className="relative flex flex-grow items-center justify-center py-8 sm:py-12 overflow-hidden">
        {/* Background Video */}
        <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover -z-10"
            src="https://cdn.pixelbin.io/v2/throbbing-poetry-5e04c1/original/abstract_particle_background_V_J_loop_4k.mp4"
        />
        <div className="absolute top-0 left-0 w-full h-full bg-black/60 -z-10" />

        <div className="w-full max-w-md p-6 sm:p-8 rounded-lg shadow-xl bg-card/80 backdrop-blur-lg animate-auth-card-in [perspective:800px]">
            {isMobile && (
            <Button variant="ghost" asChild className="mb-6 -ml-2 self-start">
                <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
                </Link>
            </Button>
            )}
            <AuthForm mode="signin" />
            <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign up
            </Link>
            </p>
        </div>
    </div>
  );
}
