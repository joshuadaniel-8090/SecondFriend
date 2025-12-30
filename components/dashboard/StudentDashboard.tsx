'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Session, SessionTag } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, HeartPulse, MessageSquare, MoreHorizontal, PlusCircle, Users, XCircle } from 'lucide-react';

const sessionFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.').max(100, 'Title is too long.'),
  tag: z.enum(['stress', 'academics', 'relationship', 'other']),
});

const tagIcons: Record<SessionTag, React.ReactNode> = {
  stress: <HeartPulse className="mr-2 h-4 w-4" />,
  academics: <BookOpen className="mr-2 h-4 w-4" />,
  relationship: <Users className="mr-2 h-4 w-4" />,
  other: <MoreHorizontal className="mr-2 h-4 w-4" />,
};

export default function StudentDashboard() {
  const { userData } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const form = useForm<z.infer<typeof sessionFormSchema>>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      title: '',
      tag: 'stress',
    },
  });

  React.useEffect(() => {
    if (!userData) return;

    const q = query(
      collection(db, 'sessions'),
      where('studentId', '==', userData.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const sessionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
      setSessions(sessionsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching sessions: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch sessions.' });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData, toast]);
  
  async function onSubmit(values: z.infer<typeof sessionFormSchema>) {
    if (!userData) return;
    
    try {
      await addDoc(collection(db, 'sessions'), {
        studentId: userData.uid,
        studentName: userData.name,
        title: values.title,
        tag: values.tag,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Success', description: 'New session request created.' });
      form.reset();
      setIsFormOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create session.' });
    }
  }

  const handleCancelSession = async (sessionId: string) => {
    try {
      await deleteDoc(doc(db, 'sessions', sessionId));
      toast({
        title: 'Request Cancelled',
        description: 'Your session request has been successfully cancelled.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to cancel the request. Please try again.',
      });
    }
  };


  const activeSessions = sessions.filter(s => s.status === 'active');
  const pendingSessions = sessions.filter(s => s.status === 'pending');
  const closedSessions = sessions.filter(s => s.status === 'closed');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold">Your Dashboard</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-headline">Request a New Session</DialogTitle>
              <DialogDescription>Describe your issue to connect with a counsellor.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Title</FormLabel>
                    <FormControl><Input placeholder="e.g., Feeling overwhelmed with exams" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tag" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Concern</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="stress">Stress</SelectItem>
                        <SelectItem value="academics">Academics</SelectItem>
                        <SelectItem value="relationship">Relationship</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full">Submit Request</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-8">
          {sessions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <h3 className="text-xl font-semibold">No sessions yet</h3>
                <p className="text-muted-foreground mt-2">Click "New Session" to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <SessionSection title="Active Sessions" sessions={activeSessions} router={router} />
              <SessionSection title="Pending Requests" sessions={pendingSessions} router={router} onCancel={handleCancelSession} />
              <SessionSection title="Closed Sessions" sessions={closedSessions} router={router} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SessionSection({ title, sessions, router, onCancel }: { title: string, sessions: Session[], router: any, onCancel?: (sessionId: string) => void }) {
  if (sessions.length === 0) return null;

  return (
    <section>
      <h2 className="font-headline text-2xl font-semibold mb-4">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map(session => (
          <Card key={session.id}>
            <CardHeader>
              <CardTitle className="truncate">{session.title}</CardTitle>
              <CardDescription>
                {session.createdAt ? `Created ${formatDistanceToNow(session.createdAt.toDate())} ago` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize flex items-center">{tagIcons[session.tag]} {session.tag}</Badge>
              <Badge variant={session.status === 'active' ? 'default' : session.status === 'pending' ? 'outline' : 'secondary'} className="capitalize">{session.status}</Badge>
            </CardContent>
            <CardFooter>
              {session.status === 'active' && (
                <Button className="w-full" onClick={() => router.push(`/chat/${session.id}`)}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Open Chat
                </Button>
              )}
               {session.status === 'pending' && (
                <div className="flex flex-col w-full gap-2">
                    <p className="text-sm text-muted-foreground text-center w-full">Waiting for a counsellor...</p>
                    {onCancel && (
                      <Button variant="destructive" className="w-full" onClick={() => onCancel(session.id)}>
                          <XCircle className="mr-2 h-4 w-4" /> Cancel Request
                      </Button>
                    )}
                </div>
              )}
               {session.status === 'closed' && (
                <Button variant="outline" className="w-full" onClick={() => router.push(`/chat/${session.id}`)}>
                  <MessageSquare className="mr-2 h-4 w-4" /> View Chat
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
