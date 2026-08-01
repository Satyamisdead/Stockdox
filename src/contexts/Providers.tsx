
"use client";

import { FirebaseProvider } from '@/contexts/FirebaseProvider';
import { WatchlistProvider } from '@/contexts/WatchlistContext';
import { type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FirebaseProvider>
      <WatchlistProvider>
        {children}
      </WatchlistProvider>
    </FirebaseProvider>
  );
}
