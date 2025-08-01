
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
    // This effect now only handles redirecting an already-logged-in user.
    // The complex logic of handling a new redirect-login is inside AuthForm.
    if (!authLoading && user) {
      const redirectPath = searchParams.get('redirect') || '/';
      router.push(redirectPath);
    }
  }, [user, authLoading, router, searchParams]);

  // We show a loader if auth state is loading, or if a user object exists
  // (which means we are about to redirect).
  if (authLoading || user) {
    return <Loading />;
  }

  return (
    <div className="flex flex-grow items-center justify-center py-8 sm:py-12">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-lg shadow-xl bg-card animate-auth-card-in">
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
