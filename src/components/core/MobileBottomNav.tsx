
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, User, Eye } from "lucide-react"; // Added Eye for Watchlist
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth"; // Added useAuth
import { cn } from "@/lib/utils";

export default function MobileBottomNav() {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { user, loading } = useAuth(); // Get user and loading state

  if (!isMobile) {
    return null;
  }

  // Do not show bottom nav on signin/signup pages for better UX
  if (pathname === "/signin" || pathname === "/signup") {
    return null;
  }
  
  const navItems = [
    { href: "/", label: "Home", icon: Home, requiresAuth: false },
    { href: "/search-mobile", label: "Search", icon: Search, requiresAuth: false },
    // Conditional "Watchlist" or "Profile/Sign In" link
    ...(user && !loading ? [{ href: "/watchlist", label: "Watchlist", icon: Eye, requiresAuth: true }] 
                       : [{ href: "/signin", label: "Sign In", icon: User, requiresAuth: false }]),
  ];


  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border/60 shadow-md md:hidden z-50">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => {
          // If item requires auth and user is not logged in (and not loading), don't render it
          if (item.requiresAuth && !user && !loading) {
            return null;
          }

          const isActive = pathname === item.href || (item.href === "/watchlist" && pathname.startsWith("/asset")); // Consider active on asset page if coming from watchlist logic
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full text-sm pt-1 pb-0.5", // Adjusted padding
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              <item.icon className={cn("h-5 w-5 mb-0.5", isActive ? "text-primary" : "")} />
              <span className="text-[11px] leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
