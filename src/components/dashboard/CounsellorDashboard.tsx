'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Session, SessionTag } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, CheckCircle, HeartPulse, MessageSquare, MoreHorizontal, Users } from 'lucide-react';

const tagIcons: Record<SessionTag, React.ReactNode> = {
  stress: <HeartPulse className="mr-2 h-4 w-4" />,
  academics: <BookOpen className="mr-2 h-4 w-4" />,
  relationship: <Users className="mr-2 h-4 w-4" />,
  other: <MoreHorizontal className="mr-2 h-4 w-4" />,
};

export default function CounsellorDashboard() {
  const { userData } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [pendingSessions, setPendingSessions] = React.useState<Session[]>([]);
  const [activeSessions, setActiveSessions] = React.useState<Session[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userData) return;

    // Listener for pending sessions - simplified query
    const pendingQuery = query(collection(db, 'sessions'), where('status', '==', 'pending'));
    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
      // Sort on the client side
      sessionsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setPendingSessions(sessionsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching pending sessions: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch pending session requests.' });
        setLoading(false);
    });

    // Listener for active sessions for this counsellor
    const activeQuery = query(collection(db, 'sessions'), where('counsellorId', '==', userData.uid), where('status', '==', 'active'), orderBy('updatedAt', 'desc'));
    const unsubscribeActive = onSnapshot(activeQuery, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
      setActiveSessions(sessionsData);
    }, (error) => {
        console.error("Error fetching active sessions: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your active sessions.' });
    });

    return () => {
      unsubscribePending();
      unsubscribeActive();
    };
  }, [userData]);

  const handleAcceptSession = async (sessionId: string) => {
    if (!userData) return;
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        counsellorId: userData.uid,
        counsellorName: userData.name,
        status: 'active',
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Session Accepted', description: 'You can now chat with the student.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to accept session.' });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      <h1 className="font-headline text-3xl font-bold">Counsellor Dashboard</h1>
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests">Session Requests</TabsTrigger>
          <TabsTrigger value="active">My Active Sessions</TabsTrigger>
        </TabsList>
        <TabsContent value="requests" className="mt-6">
          <SessionList sessions={pendingSessions} onAccept={handleAcceptSession} emptyMessage="No pending session requests." />
        </TabsContent>
        <TabsContent value="active" className="mt-6">
          <SessionList sessions={activeSessions} router={router} emptyMessage="You have no active sessions." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface SessionListProps {
  sessions: Session[];
  emptyMessage: string;
  onAccept?: (sessionId: string) => void;
  router?: any;
}

function SessionList({ sessions, emptyMessage, onAccept, router }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <h3 className="text-xl font-semibold">{emptyMessage}</h3>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sessions.map(session => (
        <Card key={session.id}>
          <CardHeader>
            <CardTitle className="truncate">{session.title}</CardTitle>
            <CardDescription>
              From: {session.studentName} | {session.createdAt ? `Requested ${formatDistanceToNow(session.createdAt.toDate())} ago` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="capitalize flex items-center">{tagIcons[session.tag]} {session.tag}</Badge>
          </CardContent>
          <CardFooter>
            {session.status === 'pending' && onAccept && (
              <Button className="w-full" onClick={() => onAccept(session.id)}>
                <CheckCircle className="mr-2 h-4 w-4" /> Accept Session
              </Button>
            )}
            {session.status === 'active' && router && (
              <Button className="w-full" onClick={() => router.push(`/chat/${session.id}`)}>
                <MessageSquare className="mr-2 h-4 w-4" /> Open Chat
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
