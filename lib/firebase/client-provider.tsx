'use client';
import { ReactNode } from 'react';
import { AuthProvider } from '@/components/auth/AuthProvider';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  
  return <AuthProvider>{children}</AuthProvider>;
}
