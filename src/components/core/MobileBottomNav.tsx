
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function MobileBottomNav() {
  const isMobile = useIsMobile();
  const pathname = usePathname();

  if (!isMobile) {
    return null;
  }

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search-mobile", label: "Search", icon: Search },
    { href: "/signup", label: "Profile", icon: User },
  ];

  // Do not show bottom nav on signin/signup pages for better UX
  if (pathname === "/signin" || pathname === "/signup") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border/60 shadow-md md:hidden z-50">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full text-sm",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              <item.icon className={cn("h-6 w-6 mb-0.5", isActive ? "text-primary" : "")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
