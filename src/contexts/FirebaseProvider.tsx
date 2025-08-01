
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
  // State to specifically track if we are waiting for a redirect result.
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  useEffect(() => {
    if (!firebaseAuthInstance) {
      console.warn("FirebaseProvider: Firebase Auth instance is not available.");
      setLoading(false);
      setIsProcessingRedirect(false);
      return;
    }

    const processRedirect = async () => {
      try {
        const result = await getRedirectResult(firebaseAuthInstance);
        if (result) {
          // A successful login via redirect has occurred.
          // onAuthStateChanged will soon fire with the new user.
          console.log("FirebaseProvider: Handled redirect result for user:", result.user.uid);
          toast({ title: "Signed In", description: "You have been successfully signed in." });
        }
        // If result is null, it means no redirect was in progress or it was cancelled.
        // We don't need to do anything here, as onAuthStateChanged will provide the correct user state (or null).
      } catch (error: any) {
        console.error("FirebaseProvider: Error getting redirect result", error);
        toast({
          title: "Sign In Failed",
          description: error.message || "An unexpected error occurred during sign-in.",
          variant: "destructive"
        });
      } finally {
        // Crucially, we mark the redirect processing as complete.
        setIsProcessingRedirect(false);
      }
    };
    
    processRedirect();
    
    const unsubscribe = firebaseAuthInstance.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      // Only set loading to false AFTER the redirect has been processed.
      if (!isProcessingRedirect) {
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [toast, isProcessingRedirect]); // Depend on isProcessingRedirect

  // Keep the app in a loading state until both the redirect is processed AND the auth state is known.
  const finalLoadingState = loading || isProcessingRedirect;

  return (
    <FirebaseContext.Provider value={{ auth: firebaseAuthInstance, user, loading: finalLoadingState }}>
      {children}
    </FirebaseContext.Provider>
  );
};
