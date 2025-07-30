
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
      console.warn("FirebaseProvider: Firebase Auth instance is not available. User state will not be managed.");
      setLoading(false);
      return;
    }

    const redirectPending = sessionStorage.getItem(REDIRECT_PENDING_KEY) === 'true';

    getRedirectResult(firebaseAuthInstance)
      .then((result) => {
        sessionStorage.removeItem(REDIRECT_PENDING_KEY);
        if (result) {
          console.log("FirebaseProvider: Handled redirect result for user:", result.user.uid);
          toast({ title: "Signed In", description: "You have been successfully signed in." });
        } else if (redirectPending) {
          // If a redirect was pending but we got no result, the user likely navigated back.
          toast({
            title: "Sign In Cancelled",
            description: "You did not complete the sign-in process.",
            variant: "default"
          });
        }
      })
      .catch((error: AuthError) => {
        sessionStorage.removeItem(REDIRECT_PENDING_KEY);
        console.error("FirebaseProvider: Error getting redirect result", error);
        toast({
          title: "Sign In Failed",
          description: error.message || "An unexpected error occurred during sign-in.",
          variant: "destructive"
        });
      })
      .finally(() => {
        // Auth state will be set by onAuthStateChanged
      });

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
