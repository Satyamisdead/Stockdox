
"use client";

import type { User } from 'firebase/auth';
import { auth as firebaseAuthInstance } from '@/lib/firebase'; // Renamed import to avoid conflict
import { getRedirectResult } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import React, { createContext, useEffect, useState, type ReactNode } from 'react';

interface FirebaseContextType {
  auth: Auth | undefined;
  user: User | null;
  loading: boolean;
}

export const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHandlingRedirect, setIsHandlingRedirect] = useState(true);

  useEffect(() => {
    if (!firebaseAuthInstance) {
      console.warn("FirebaseProvider: Firebase Auth instance is not available. User state will not be managed.");
      setLoading(false);
      setIsHandlingRedirect(false);
      return;
    }

    // First, handle potential redirect results
    getRedirectResult(firebaseAuthInstance)
      .then((result) => {
        if (result) {
          // This means a redirect sign-in just completed.
          // The onAuthStateChanged listener below will handle setting the user.
          console.log("FirebaseProvider: Handled redirect result for user:", result.user.uid);
        }
      })
      .catch((error) => {
        console.error("FirebaseProvider: Error getting redirect result", error);
      })
      .finally(() => {
        setIsHandlingRedirect(false);
      });

    const unsubscribe = firebaseAuthInstance.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      // We only stop the main loading indicator once the redirect check is also done.
      if (!isHandlingRedirect) {
          setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Combine auth loading and redirect handling for the final loading state
  useEffect(() => {
    if (!isHandlingRedirect) {
        setLoading(false);
    }
  }, [isHandlingRedirect]);


  return (
    <FirebaseContext.Provider value={{ auth: firebaseAuthInstance, user, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
};
