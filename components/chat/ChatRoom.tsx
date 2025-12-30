'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, query, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Session, Message } from '@/lib/types';
import { format } from 'date-fns';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Send, XCircle, ArrowLeft, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatRoomProps {
  sessionId: string;
}

export default function ChatRoom({ sessionId }: ChatRoomProps) {
  const { user, userData } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [session, setSession] = React.useState<Session | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newMessage, setNewMessage] = React.useState('');
  const scrollAreaViewportRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Session listener
    const sessionRef = doc(db, 'sessions', sessionId);
    const unsubscribeSession = onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        const sessionData = { id: doc.id, ...doc.data() } as Session;
        // Security check
        if (user && (user.uid === sessionData.studentId || user.uid === sessionData.counsellorId)) {
          setSession(sessionData);
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'You are not authorized to view this session.' });
          router.replace('/'); 
        }
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Session not found.' });
        router.replace('/');
      }
      setLoading(false);
    });

    // Messages listener
    const messagesQuery = query(collection(db, `sessions/${sessionId}/messages`), orderBy('createdAt', 'asc'));
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(messagesData);
    });

    return () => {
      unsubscribeSession();
      unsubscribeMessages();
    };
  }, [sessionId, user, router, toast]);
  
  React.useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaViewportRef.current) {
        scrollAreaViewportRef.current.scrollTop = scrollAreaViewportRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user || !userData) return;

    await addDoc(collection(db, `sessions/${sessionId}/messages`), {
      text: newMessage,
      senderId: user.uid,
      senderName: userData.name,
      createdAt: serverTimestamp(),
    });

    setNewMessage('');
  };

  const handleCloseSession = async () => {
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
  
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  if (loading) return <div className="flex-grow flex items-center justify-center"><LoadingSpinner /></div>;
  if (!session) return <div className="flex-grow flex items-center justify-center"><p>Session not found or you are not authorized.</p></div>;

  const otherUserName = user?.uid === session.studentId ? session.counsellorName : session.studentName;

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
      <Card className="flex-grow flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                  <ArrowLeft />
                  <span className="sr-only">Go back</span>
              </Button>
              <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${otherUserName}`} alt={otherUserName} />
                    <AvatarFallback>{getInitials(otherUserName || 'U')}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                      <CardTitle className="font-headline text-lg">{otherUserName}</CardTitle>
                      <CardDescription className="text-xs">{session.title}</CardDescription>
                  </div>
              </div>
          </div>
          {userData?.role === 'counsellor' && session.status === 'active' && (
            <Button variant="outline" size="sm" onClick={handleCloseSession}>
              <XCircle className="mr-2 h-4 w-4" /> Close Session
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex-grow p-0 overflow-hidden">
          <ScrollArea className="h-full">
             <div ref={scrollAreaViewportRef} className="h-full px-6 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <MessageSquare size={48} className="mb-4" />
                    <h3 className="text-lg font-semibold">No messages yet.</h3>
                    <p className="text-sm">
                        {session.status === 'active' 
                            ? "Be the first to say hello!" 
                            : "The conversation history will appear here."}
                    </p>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={cn('flex items-end gap-2', msg.senderId === user?.uid ? 'justify-end' : '')}>
                  <div className={cn(
                    'group relative max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl', 
                    msg.senderId === user?.uid 
                      ? 'bg-primary text-primary-foreground rounded-br-none' 
                      : 'bg-muted rounded-bl-none'
                  )}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={cn("text-xs mt-1 opacity-70", msg.senderId === user?.uid ? 'text-right' : 'text-left')}>
                      {msg.createdAt ? format(msg.createdAt.toDate(), 'p') : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        {session.status === 'active' && (
          <CardFooter className="border-t pt-6">
            <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
              <Input 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                autoComplete="off"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </CardFooter>
        )}
        {session.status === 'closed' && (
           <CardFooter className="border-t pt-4 pb-4">
              <p className="text-center text-muted-foreground w-full text-sm">This session has been closed. You can no longer send messages.</p>
           </CardFooter>
        )}
      </Card>
    </div>
  );
}
