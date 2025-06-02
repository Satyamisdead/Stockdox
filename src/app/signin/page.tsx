
import AuthForm from "@/components/auth/AuthForm";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex flex-grow items-center justify-center py-8 sm:py-12">
      <div className="w-full max-w-md p-6 rounded-lg shadow-xl bg-card">
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
