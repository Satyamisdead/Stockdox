
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

    const processRedirect = async () => {
      try {
        const result = await getRedirectResult(firebaseAuthInstance);
        if (result) {
          // A successful login via redirect has occurred.
          console.log("FirebaseProvider: Handled redirect result for user:", result.user.uid);
          toast({ title: "Signed In", description: "You have been successfully signed in." });
          // onAuthStateChanged will handle setting the user and loading state.
        }
      } catch (error: any) {
        console.error("FirebaseProvider: Error getting redirect result", error);
        toast({
          title: "Sign In Failed",
          description: error.message || "An unexpected error occurred during sign-in.",
          variant: "destructive"
        });
      } finally {
        // Clear the pending key regardless of outcome.
        sessionStorage.removeItem(REDIRECT_PENDING_KEY);
      }
    };
    
    // Check if a redirect was initiated from our app.
    if (sessionStorage.getItem(REDIRECT_PENDING_KEY)) {
        processRedirect();
    }
    
    const unsubscribe = firebaseAuthInstance.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false); // This is the single source of truth for when auth is ready.
    });
    
    return () => unsubscribe();
  }, [toast]);

  return (
    <FirebaseContext.Provider value={{ auth: firebaseAuthInstance, user, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
};
