
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { signOut, deleteUser, type AuthError } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Loading from "@/app/loading";
import { LogOut, User, Trash2, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin?redirect=/profile");
    }
  }, [user, authLoading, router]);

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
