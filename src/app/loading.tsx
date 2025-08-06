
"use client";

import { cn } from "@/lib/utils";

// New loader component
const StockdoxLoader = () => {
  return (
    <div className="flex items-end justify-center space-x-1.5 h-12 w-16" aria-label="Loading content">
      <span
        className={cn(
          "h-6 w-2.5 bg-primary rounded-t-sm animate-bar-loader",
          "[animation-delay:-0.4s]"
        )}
      />
      <span
        className={cn(
          "h-10 w-2.5 bg-primary rounded-t-sm animate-bar-loader",
          "[animation-delay:-0.2s]"
        )}
      />
      <span
        className={cn(
          "h-7 w-2.5 bg-primary rounded-t-sm animate-bar-loader",
          "[animation-delay:-0.6s]"
        )}
       />
      <span
        className={cn(
          "h-9 w-2.5 bg-primary rounded-t-sm animate-bar-loader",
          "[animation-delay:0s]"
        )}
       />
    </div>
  );
};


export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <StockdoxLoader />
      <p className="text-sm text-muted-foreground mt-2 animate-pulse">Loading Data...</p>
    </div>
  );
}
