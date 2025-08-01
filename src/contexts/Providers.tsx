
"use client";

import { FirebaseProvider } from '@/contexts/FirebaseProvider';
import { type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FirebaseProvider>
      {children}
    </FirebaseProvider>
  );
}
