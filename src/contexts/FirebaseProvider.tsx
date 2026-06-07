
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

    const processAuth = async () => {
        try {
            // First, process any redirect result that might be pending.
            const result = await getRedirectResult(firebaseAuthInstance);
            if (result) {
                // This means a user just signed in via redirect.
                // onAuthStateChanged will handle setting the user.
                toast({ title: "Signed In", description: "Login successful!" });
            }
        } catch (error) {
            console.error("Error processing redirect result", error);
            toast({ title: "Sign In Error", description: "Could not complete sign-in via redirect.", variant: "destructive" });
        } finally {
             // Now that any redirect is handled, set up the real-time auth state listener.
            const unsubscribe = firebaseAuthInstance.onAuthStateChanged((currentUser) => {
                setUser(currentUser);
                setLoading(false); // Set loading to false only after the initial user state is determined.
            });
            
            // The function returned here will be called on unmount.
            return () => unsubscribe();
        }
    };

    processAuth();
    
  }, [toast]);

  return (
    <FirebaseContext.Provider value={{ auth: firebaseAuthInstance, user, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
};
