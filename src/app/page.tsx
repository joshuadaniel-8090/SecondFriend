'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Home() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && userData) {
        if (userData.role === 'student') {
          router.replace('/student/dashboard');
        } else if (userData.role === 'counsellor') {
          router.replace('/counsellor/dashboard');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [user, userData, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  );
}
