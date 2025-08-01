
"use client";

import type { User } from 'firebase/auth';
import { auth as firebaseAuthInstance } from '@/lib/firebase';
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

  useEffect(() => {
    if (!firebaseAuthInstance) {
      console.warn("FirebaseProvider: Firebase Auth instance is not available.");
      setLoading(false);
      return;
    }

    // onAuthStateChanged is the single source of truth for the user's login state.
    // It fires after a redirect is processed and on initial load.
    const unsubscribe = firebaseAuthInstance.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false); // Auth state is now confirmed, loading is complete.
    });
    
    // Clean up the subscription on component unmount
    return () => unsubscribe();
  }, []);

  return (
    <FirebaseContext.Provider value={{ auth: firebaseAuthInstance, user, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
};
