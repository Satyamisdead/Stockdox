import AuthForm from "@/components/auth/AuthForm";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
       <div className="w-full max-w-md p-6 rounded-lg shadow-xl bg-card">
        <AuthForm mode="signup" />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
