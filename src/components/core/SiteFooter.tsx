
"use client"; // Added "use client" for the hook

import { useIsMobile } from "@/hooks/use-mobile"; // Added import

export default function SiteFooter() {
  const isMobile = useIsMobile(); // Added hook

  if (isMobile) { // Conditionally render footer
    return null;
  }

  return (
    <footer className="py-6 md:px-8 md:py-0 border-t border-border/40">
      <div className="container flex flex-col items-center justify-center gap-4 md:h-20 md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground">
          &copy; {new Date().getFullYear()} Stockdox. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
