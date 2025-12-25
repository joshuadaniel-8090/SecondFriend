'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import Header from '@/components/shared/Header';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (userData?.role !== 'student') {
        // Redirect non-students, perhaps to their own dashboard or an error page
        router.replace('/counsellor/dashboard');
      }
    }
  }, [user, userData, loading, router]);

  if (loading || !user || !userData || userData.role !== 'student') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
