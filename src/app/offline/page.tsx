
"use client";

import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <WifiOff className="h-20 w-20 text-muted-foreground mb-6" />
      <h1 className="text-3xl font-bold font-headline text-primary mb-2">You are offline</h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8">
        It seems there is a problem with your network connection. This page can't be loaded. 
        Please check your connection and try again.
      </p>
      <Button onClick={() => window.location.reload()} size="lg">
        Try Again
      </Button>
    </div>
  );
}
