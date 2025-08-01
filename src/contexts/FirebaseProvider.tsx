
"use client";

import type { User } from 'firebase/auth';
import { auth as firebaseAuthInstance } from '@/lib/firebase';
import { getRedirectResult, type AuthError } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import React, { createContext, useEffect, useState, type ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface FirebaseContextType {
  auth: Auth | undefined;
  user: User | null;
  loading: boolean;
}

const REDIRECT_PENDING_KEY = 'firebase-redirect-pending';

export const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!firebaseAuthInstance) {
      console.warn("FirebaseProvider: Firebase Auth instance is not available.");
      setLoading(false);
      return;
    }

    const redirectPending = sessionStorage.getItem(REDIRECT_PENDING_KEY) === 'true';

    // This block handles the result of the redirect.
    if (redirectPending) {
        getRedirectResult(firebaseAuthInstance)
        .then((result) => {
            sessionStorage.removeItem(REDIRECT_PENDING_KEY);
            if (result) {
                console.log("FirebaseProvider: Handled redirect result for user:", result.user.uid);
                toast({ title: "Signed In", description: "You have been successfully signed in." });
            }
            // If result is null, it means the user came back without signing in.
            // Per the request, we no longer show a "cancelled" toast here.
            // onAuthStateChanged will simply reflect the user's non-logged-in state.
        })
        .catch((error: AuthError) => {
            sessionStorage.removeItem(REDIRECT_PENDING_KEY);
            console.error("FirebaseProvider: Error getting redirect result", error);
            toast({
            title: "Sign In Failed",
            description: error.message || "An unexpected error occurred during sign-in.",
            variant: "destructive"
            });
        });
    }

    // This listener is the source of truth for the user's auth state.
    const unsubscribe = firebaseAuthInstance.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false); // Auth state is now definitive
    });
    
    return () => unsubscribe();
  }, [toast]);

  return (
    <FirebaseContext.Provider value={{ auth: firebaseAuthInstance, user, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
};
