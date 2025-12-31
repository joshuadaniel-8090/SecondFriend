'use client';

import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/components/auth/AuthProvider';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Session } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/shared/Header';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const sessionId = pathname.split('/').pop();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = doc(db, 'sessions', sessionId);
    const unsubscribe = onSnapshot(sessionRef, (doc) => {
        if (doc.exists()) {
            setSession({ id: doc.id, ...doc.data() } as Session);
        }
        setSessionLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId]);

  const handleCloseSession = async () => {
    if (!sessionId) return;
    try {
      await updateDoc(doc(db, 'sessions', sessionId), {
        status: 'closed',
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Session Closed', description: 'This session has been marked as closed.' });
      router.back();
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Could not close the session.' });
    }
  };


  if (loading || !user || sessionLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  const isCounsellor = userData?.role === 'counsellor';
  const isSessionActive = session?.status === 'active';

  return (
    <div className="flex h-screen flex-col bg-background">
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 flex flex-col">
        {children}
      </main>
    </div>
  );
}
