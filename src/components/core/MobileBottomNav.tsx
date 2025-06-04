
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, User, Eye, LogOut, Gamepad2, Newspaper } from "lucide-react"; 
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export default function MobileBottomNav() {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  if (!isMobile) {
    return null;
  }

  // Do not show bottom nav on signin/signup pages for better UX
  if (pathname === "/signin" || pathname === "/signup") {
    return null;
  }

  const handleSignOut = async () => {
    if (auth) {
      try {
        await signOut(auth);
        toast({ title: "Signed Out", description: "You have been successfully signed out." });
        router.push('/'); 
        router.refresh(); 
      } catch (error) {
        console.error("Sign out error:", error);
        toast({ title: "Sign Out Error", description: "Failed to sign out. Please try again.", variant: "destructive" });
      }
    } else {
      toast({ title: "Error", description: "Authentication service not available.", variant: "destructive" });
    }
  };
  
  const navItemsBase = [
    { id: 'home', href: "/", label: "Home", icon: Home, requiresAuth: false },
    { id: 'games', href: "/games", label: "Games", icon: Gamepad2, requiresAuth: false },
    { id: 'news', href: "/news", label: "News", icon: Newspaper, requiresAuth: false },
  ];

  let dynamicItems = [];
  if (user && !loading) {
    dynamicItems.push({ id: 'watchlist', href: "/watchlist", label: "Watchlist", icon: Eye, requiresAuth: true });
    dynamicItems.push({ id: 'logout', label: "Logout", icon: LogOut, action: handleSignOut, requiresAuth: true });
  } else if (!loading && !user) {
    dynamicItems.push({ id: 'signin', href: "/signin", label: "Sign In", icon: User, requiresAuth: false });
  }
  
  const navItems = [...navItemsBase, ...dynamicItems];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border/60 shadow-md md:hidden z-50">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => {
          const isActive = item.href ? (pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/")) : false;
          // Specific check for home to avoid it being active for all sub-routes
          const isHomeActive = item.href === "/" && pathname === "/";
          const finalIsActive = item.href === "/" ? isHomeActive : isActive;
          
          if (item.action) {
            return (
              <button
                key={item.id}
                onClick={item.action}
                aria-label={item.label}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full text-sm pt-1 pb-0.5",
                  "text-muted-foreground hover:text-primary transition-colors"
                )}
              >
                <item.icon className="h-5 w-5 mb-0.5" />
                <span className="text-[11px] leading-tight">{item.label}</span>
              </button>
            );
          } else if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full text-sm pt-1 pb-0.5",
                  finalIsActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                )}
              >
                <item.icon className={cn("h-5 w-5 mb-0.5", finalIsActive ? "text-primary" : "")} />
                <span className="text-[11px] leading-tight">{item.label}</span>
              </Link>
            );
          }
          return null;
        })}
      </div>
    </nav>
  );
}
