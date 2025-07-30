
"use client";

import type { User } from 'firebase/auth';
import { auth as firebaseAuthInstance } from '@/lib/firebase';
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

    getRedirectResult(firebaseAuthInstance)
      .then((result) => {
        if (result) {
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
      if (!isHandlingRedirect) {
          setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [isHandlingRedirect]);

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
