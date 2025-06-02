"use client";

import type { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { Auth } from 'firebase/auth';
import React, { createContext, useEffect, useState, ReactNode } from 'react';

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
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <FirebaseContext.Provider value={{ auth, user, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
};
