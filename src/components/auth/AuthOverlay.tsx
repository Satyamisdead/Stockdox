
"use client";

import { useState } from "react";
import AuthForm from "@/components/auth/AuthForm";

export default function AuthOverlay() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const toggleMode = () => {
    setMode(prevMode => (prevMode === "signin" ? "signup" : "signin"));
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex items-center justify-center p-6 py-12 select-none">
      <div className="w-full max-w-sm flex flex-col justify-between min-h-[90vh]">
        <AuthForm mode={mode} onToggleMode={toggleMode} />
      </div>
    </div>
  );
}

