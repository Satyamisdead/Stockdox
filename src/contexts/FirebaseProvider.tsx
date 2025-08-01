
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
      // Check if a redirect was initiated from our app
      if (sessionStorage.getItem(REDIRECT_PENDING_KEY) === 'true') {
        try {
          const result = await getRedirectResult(firebaseAuthInstance);
          // Clear the flag immediately after processing
          sessionStorage.removeItem(REDIRECT_PENDING_KEY);
          if (result) {
            // A successful login via redirect has occurred.
            // onAuthStateChanged will handle setting the user.
            console.log("FirebaseProvider: Handled redirect result for user:", result.user.uid);
            toast({ title: "Signed In", description: "You have been successfully signed in." });
          } 
          // If result is null, it means the user came back without signing in.
          // onAuthStateChanged will correctly report a null user, so no explicit action or toast is needed here.
          // This prevents the "cancelled" toast on a normal page load.
        } catch (error: any) {
          sessionStorage.removeItem(REDIRECT_PENDING_KEY);
          console.error("FirebaseProvider: Error getting redirect result", error);
          toast({
            title: "Sign In Failed",
            description: error.message || "An unexpected error occurred during sign-in.",
            variant: "destructive"
          });
        }
      }
    };
    
    // Process the redirect as soon as the provider mounts
    processRedirect();
    
    // This listener is the ultimate source of truth for the user's auth state.
    // It will fire after getRedirectResult completes and sets the session.
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
