'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import AdminLogin from '@/components/auth/AdminLogin';
import AdminSignup from '@/components/auth/AdminSignup';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Stethoscope } from 'lucide-react';

type AuthView = 'welcome' | 'login' | 'signup';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('welcome');

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !userData || userData.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="mb-8 flex items-center gap-2 text-primary">
            <Stethoscope size={40} />
            <h1 className="font-headline text-4xl font-bold">Second Friend</h1>
        </div>
        
        {authView === 'welcome' && (
          <div className="w-full max-w-sm text-center">
            <h2 className="font-headline text-2xl mb-4">Admin Portal</h2>
            <p className="text-muted-foreground mb-6">Please log in or sign up to continue.</p>
            <div className="flex flex-col gap-4">
              <Button size="lg" onClick={() => setAuthView('login')}>Login</Button>
              <Button size="lg" variant="outline" onClick={() => setAuthView('signup')}>Sign Up</Button>
            </div>
          </div>
        )}
        
        {authView === 'login' && <AdminLogin onBack={() => setAuthView('welcome')} />}
        {authView === 'signup' && <AdminSignup onBack={() => setAuthView('welcome')} />}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
