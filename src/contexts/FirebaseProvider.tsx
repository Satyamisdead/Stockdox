
"use client";

import type { User } from 'firebase/auth';
import { auth as firebaseAuthInstance, getRedirectResult } from '@/lib/firebase';
import type { Auth } from 'firebase/auth';
import React, { createContext, useEffect, useState, type ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface FirebaseContextType {
  auth: Auth | undefined;
  user: User | null;
  loading: boolean;
}

export const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start as true
  const { toast } = useToast();

  useEffect(() => {
    if (!firebaseAuthInstance) {
      console.warn("FirebaseProvider: Firebase Auth instance is not available.");
      setLoading(false);
      return;
    }

    // This function will be called once to process any pending redirect
    const processRedirectResult = async () => {
      try {
        const result = await getRedirectResult(firebaseAuthInstance);
        if (result) {
          // User successfully signed in via redirect.
          // onAuthStateChanged will handle setting the user state.
          toast({ title: "Signed In", description: "Login successful! Redirecting..." });
        }
      } catch (error) {
        console.error("Error processing redirect result", error);
        // Handle specific errors if necessary, e.g., account-exists-with-different-credential
      }
    };

    // First, process the redirect.
    processRedirectResult();

    // Then, set up the state listener. This is the source of truth.
    // It will fire after getRedirectResult completes and sets the user,
    // and also on initial page load if the user was already signed in.
    const unsubscribe = firebaseAuthInstance.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false); // Set loading to false only AFTER the first auth state has been determined.
    });
    
    // Clean up the subscription on component unmount
    return () => unsubscribe();
  }, [toast]);

  return (
    <FirebaseContext.Provider value={{ auth: firebaseAuthInstance, user, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
};
