
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { signOut, deleteUser, type AuthError } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Loading from "@/app/loading";
import { LogOut, User, Trash2, Loader2, ArrowLeft, Bell, BellRing } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getAlertPreferences, saveAlertPreferences, type AlertCondition } from "@/services/userPreferenceService";
import { Skeleton } from "@/components/ui/skeleton";


export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const isMobile = useIsMobile();
  const [alertPref, setAlertPref] = useState<AlertCondition>('none');
  const [isSavingPref, setIsSavingPref] = useState(false);
  const [isLoadingPref, setIsLoadingPref] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin?redirect=/profile");
    }
  }, [user, authLoading, router]);

  const fetchPrefs = useCallback(async () => {
    if (user) {
      setIsLoadingPref(true);
      try {
        const prefs = await getAlertPreferences(user.uid);
        setAlertPref(prefs.condition);
      } catch (error) {
        console.error("Failed to fetch alert preferences", error);
        toast({ title: "Error", description: "Could not load alert preferences.", variant: "destructive" });
      } finally {
        setIsLoadingPref(false);
      }
    }
  }, [user, toast]);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

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

  const handleSavePreferences = async () => {
    if (!user) return;
    setIsSavingPref(true);
    try {
        await saveAlertPreferences(user.uid, { condition: alertPref });
        toast({ title: "Preferences Saved", description: "Your alert settings have been updated." });
    } catch (error) {
        toast({ title: "Save Failed", description: "Could not save your preferences. Please try again.", variant: "destructive" });
    } finally {
        setIsSavingPref(false);
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
                <CardTitle>Set Alert Preferences</CardTitle>
                <CardDescription>Choose when to be notified about assets in your watchlist.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingPref ? (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                           <Skeleton className="h-4 w-4 rounded-full" />
                           <Skeleton className="h-4 w-48" />
                        </div>
                        <div className="flex items-center space-x-2">
                           <Skeleton className="h-4 w-4 rounded-full" />
                           <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="flex items-center space-x-2">
                           <Skeleton className="h-4 w-4 rounded-full" />
                           <Skeleton className="h-4 w-40" />
                        </div>
                    </div>
                ) : (
                    <RadioGroup value={alertPref} onValueChange={(val) => setAlertPref(val as AlertCondition)}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="increase" id="increase" />
                            <Label htmlFor="increase" className="cursor-pointer">On Price Increase</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="decrease" id="decrease" />
                            <Label htmlFor="decrease" className="cursor-pointer">On Price Decrease</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="any" id="any" />
                            <Label htmlFor="any" className="cursor-pointer">On Any Change</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="none" id="none" />
                            <Label htmlFor="none" className="cursor-pointer text-muted-foreground">Turn off all alerts</Label>
                        </div>
                    </RadioGroup>
                )}
            </CardContent>
             <CardFooter>
                 <Button onClick={handleSavePreferences} disabled={isSavingPref}>
                    {isSavingPref && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Preferences
                </Button>
            </CardFooter>
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
