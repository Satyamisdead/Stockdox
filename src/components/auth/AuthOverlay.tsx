
"use client";

import { useState } from "react";
import AuthForm from "@/components/auth/AuthForm";
import Link from "next/link";

export default function AuthOverlay() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const toggleMode = () => {
    setMode(prevMode => (prevMode === "signin" ? "signup" : "signin"));
  };

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
            <AuthForm mode={mode} />
            <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button onClick={toggleMode} className="font-medium text-primary hover:underline focus:outline-none">
                    {mode === "signin" ? "Sign up" : "Sign in"}
                </button>
            </p>
        </div>
    </div>
  );
}
