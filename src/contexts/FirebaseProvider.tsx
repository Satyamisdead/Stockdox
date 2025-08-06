
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

    const processRedirect = async () => {
      try {
        const result = await getRedirectResult(firebaseAuthInstance);
        if (result) {
          toast({ title: "Signed In", description: "Login successful!" });
        }
      } catch (error) {
        console.error("Error processing redirect result", error);
        toast({ title: "Sign In Error", description: "Could not complete sign-in via redirect.", variant: "destructive" });
      }
    };

    processRedirect();

    const unsubscribe = firebaseAuthInstance.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [toast]);

  return (
    <FirebaseContext.Provider value={{ auth: firebaseAuthInstance, user, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
};
