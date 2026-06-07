
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Eye, Gamepad2, Newspaper } from "lucide-react"; 
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function MobileBottomNav() {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { user } = useAuth();

  // If not mobile or if no user is logged in, don't render the nav bar.
  if (!isMobile || !user) {
    return null;
  }

  const navItems = [
    { id: 'home', href: "/", label: "Home", icon: Home },
    { id: 'take-a-break', href: "/games", label: "Take a Break", icon: Gamepad2 },
    { id: 'news', href: "/news", label: "News", icon: Newspaper },
    { id: 'watchlist', href: "/watchlist", label: "Watchlist", icon: Eye },
    { id: 'profile', href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border shadow-lg md:hidden z-50">
      <div className="flex justify-around items-stretch h-full">
        {navItems.map((item) => {
          const isActive = item.href ? (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))) : false;
          const isHomeActive = item.href === "/" && pathname === "/";
          const finalIsActive = item.href === "/" ? isHomeActive : isActive;
          
          const itemClasses = cn(
            "flex flex-col items-center justify-center flex-1 h-full text-sm pt-1 pb-0.5 transition-colors duration-150 ease-in-out",
            finalIsActive 
              ? "bg-accent text-primary" 
              : "text-muted-foreground hover:text-primary hover:bg-accent/50"
          );

          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={itemClasses}
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
