
"use client";

import Link from 'next/link';
import Logo from './Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase'; // Direct import
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { UserCircle, LogOut, LineChart, Eye } from 'lucide-react'; // Removed Loader2
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton'; // Added Skeleton

export default function SiteHeader() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { toast } = useToast();

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
    }
  };

  if (isMobile) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-4 md:gap-6">
          <Button variant="ghost" asChild>
            <Link href="/" className="gap-1.5"><LineChart size={18}/>Dashboard</Link>
          </Button>
          {user && !authLoading && ( // Show watchlist only if user is logged in and auth is resolved
            <Button variant="ghost" asChild>
              <Link href="/watchlist" className="gap-1.5"><Eye size={18}/>Watchlist</Link>
            </Button>
          )}
          {authLoading && !user && ( // Placeholder for watchlist button if loading and no user known yet
             <Skeleton className="h-9 w-28" /> // Matches approx size of watchlist button
          )}
          
          {authLoading ? (
            <div className="flex items-center gap-2" aria-busy="true" aria-live="polite">
              <Skeleton className="h-9 w-[70px] rounded-md" /> {/* Placeholder for "Sign In" button */}
              <Skeleton className="h-9 w-[70px] rounded-md" /> {/* Placeholder for "Sign Up" button */}
            </div>
          ) : user ? (
            <> {/* Fragment to group DropdownMenu and dedicated Logout Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                      <AvatarFallback>
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : <UserCircle size={20}/>}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                      {user.email && <p className="text-xs leading-none text-muted-foreground">{user.email}</p>}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Log Out" className="h-9 w-9">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
