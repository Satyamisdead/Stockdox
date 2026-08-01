
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { auth, db } from "@/lib/firebase";
import { signOut, deleteUser, type AuthError } from "firebase/auth";
import { collection, query, orderBy, limit, onSnapshot, deleteDoc, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Loading from "@/app/loading";
import { LogOut, User, Trash2, Loader2, ArrowLeft, History, TrendingUp, TrendingDown, Bell, ArrowUp, ArrowDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { getPredictionHistory, type PredictionRecord } from "@/services/predictionHistoryService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";

const PredictionIcon = ({ prediction, className }: { prediction: PredictionRecord['prediction'], className?: string }) => {
    switch (prediction) {
        case 'Buy': return <TrendingUp className={cn("h-4 w-4 text-green-500", className)} />;
        case 'Sell': return <TrendingDown className={cn("h-4 w-4 text-red-500", className)} />;
        default: return null;
    }
};

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [predictionHistory, setPredictionHistory] = useState<PredictionRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(true);
  const [isClearingNotifs, setIsClearingNotifs] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin?redirect=/profile");
      return;
    }

    if (user) {
      setIsLoadingHistory(true);
      getPredictionHistory(user.uid)
          .then(setPredictionHistory)
          .finally(() => setIsLoadingHistory(false));

      // Sync user notifications log in real-time
      if (db) {
        setIsLoadingNotifs(true);
        const notifsRef = collection(db, 'users', user.uid, 'notifications');
        const q = query(notifsRef, orderBy('timestamp', 'desc'), limit(50));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const list: any[] = [];
          snapshot.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          setNotifications(list);
          setIsLoadingNotifs(false);
        }, (err) => {
          console.error("Failed to sync notifications log:", err);
          setIsLoadingNotifs(false);
        });

        return () => unsubscribe();
      }
    }
  }, [user, authLoading, router]);

  const handleClearNotifications = async () => {
    if (!user || !db) return;
    setIsClearingNotifs(true);
    try {
      const notifsRef = collection(db, 'users', user.uid, 'notifications');
      const snapshot = await getDocs(notifsRef);
      const batchPromises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(batchPromises);
      toast({
        title: "History Cleared",
        description: "Your notification logs have been successfully cleared."
      });
    } catch (err) {
      console.error("Failed to clear notifications:", err);
      toast({
        title: "Error",
        description: "Failed to clear notifications logs.",
        variant: "destructive"
      });
    } finally {
      setIsClearingNotifs(false);
    }
  };

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
  
  const handleDeleteAccount = async () => {
    if (!user) {
        toast({ title: "Error", description: "No user is signed in.", variant: "destructive" });
        return;
    }

    setIsDeleting(true);
    try {
        await deleteUser(user);
        toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
        router.push('/');
        router.refresh();
    } catch (error) {
        const authError = error as AuthError;
        let description = "An unexpected error occurred. Please try again.";
        if (authError.code === 'auth/requires-recent-login') {
            description = "This is a sensitive operation and requires recent authentication. Please sign out, sign back in, and try again.";
        }
        console.error("Account deletion error:", authError);
        toast({ title: "Deletion Failed", description, variant: "destructive" });
    } finally {
        setIsDeleting(false);
    }
  };

  if (authLoading || !user) {
    return <Loading />;
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
        {isMobile && (
             <Button variant="ghost" onClick={() => router.back()} className="mb-2 -ml-2 self-start">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
        )}
        <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary font-headline">My Profile</h1>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your personal account details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">User ID</span>
                    <span className="font-mono text-xs bg-muted p-1 rounded">{user.uid}</span>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSignOut} variant="outline">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Prediction History
                </CardTitle>
                <CardDescription>A log of your recent AI-generated predictions.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72 w-full pr-4">
                    {isLoadingHistory ? (
                        <div className="space-y-3">
                           {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <div className="space-y-1">
                                             <Skeleton className="h-4 w-24" />
                                             <Skeleton className="h-3 w-32" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-5 w-16" />
                                </div>
                            ))}
                        </div>
                    ) : predictionHistory.length > 0 ? (
                        <ul className="space-y-2">
                            {predictionHistory.map((item, index) => (
                                <li key={index} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50">
                                    <div className="flex items-center gap-3 font-medium">
                                        <PredictionIcon prediction={item.prediction} />
                                        <Link href={`/asset/${item.assetId}`} className="hover:underline">
                                            <span>{item.assetName} ({item.assetSymbol})</span>
                                        </Link>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={cn(
                                            "font-semibold",
                                            item.prediction === "Buy" && "text-green-500",
                                            item.prediction === "Sell" && "text-red-500"
                                        )}>{item.prediction}</span>
                                        <span className="text-xs text-muted-foreground w-24 text-right">
                                            {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <div className="text-center py-10">
                            <p className="text-muted-foreground">No prediction history found.</p>
                            <p className="text-xs text-muted-foreground mt-1">View an asset to start generating predictions.</p>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        Notification Log
                    </CardTitle>
                    <CardDescription>A real-time log of your price alerts and watchlist updates.</CardDescription>
                </div>
                {notifications.length > 0 && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={isClearingNotifs} 
                        onClick={handleClearNotifications}
                        className="text-muted-foreground hover:text-destructive h-8"
                    >
                        {isClearingNotifs ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                        Clear Logs
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72 w-full pr-4">
                    {isLoadingNotifs ? (
                        <div className="space-y-3">
                           {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <div className="space-y-1">
                                             <Skeleton className="h-4 w-24" />
                                             <Skeleton className="h-3 w-32" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length > 0 ? (
                        <ul className="space-y-3">
                            {notifications.map((item, index) => (
                                <li key={item.id || index} className="flex items-start justify-between text-sm p-2.5 rounded-md bg-card/40 border border-border/20 hover:bg-muted/30">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 shrink-0">
                                            {item.type === 'price_up' && <ArrowUp className="h-4 w-4 text-[#00D600]" />}
                                            {item.type === 'price_down' && <ArrowDown className="h-4 w-4 text-rose-500" />}
                                            {item.type === 'random' && <Bell className="h-4 w-4 text-[#FFE600]" />}
                                        </div>
                                        <div>
                                             <p className="font-semibold text-primary">{item.title}</p>
                                             <p className="text-xs text-muted-foreground mt-0.5">{item.message}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4 shrink-0 font-medium">
                                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <div className="text-center py-10">
                            <p className="text-muted-foreground">No recent notifications.</p>
                            <p className="text-xs text-muted-foreground mt-1">Notifications triggered by watched stocks will appear here.</p>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>

        <Card className="border-destructive">
             <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Manage irreversible account actions.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">Delete Your Account</p>
                        <p className="text-sm text-muted-foreground">Once you delete your account, there is no going back. Please be certain.</p>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Account
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your
                                    account and remove your data from our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
