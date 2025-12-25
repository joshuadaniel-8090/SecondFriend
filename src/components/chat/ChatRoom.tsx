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
import { Send, XCircle } from 'lucide-react';
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
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

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
          router.replace('/'); // Not authorized
        }
      } else {
        router.replace('/'); // Not found
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
  }, [sessionId, user, router]);
  
  React.useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
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

  return (
    <Card className="flex-grow flex flex-col h-full w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1.5">
          <CardTitle className="font-headline">{session.title}</CardTitle>
          <CardDescription>
            Chatting with {user?.uid === session.studentId ? session.counsellorName : session.studentName}
          </CardDescription>
        </div>
        {userData?.role === 'counsellor' && session.status === 'active' && (
          <Button variant="outline" size="sm" onClick={handleCloseSession}>
            <XCircle className="mr-2 h-4 w-4" /> Close Session
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-20rem)]" ref={scrollAreaRef}>
          <div className="p-6 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={cn('flex items-end gap-2', msg.senderId === user?.uid ? 'justify-end' : '')}>
                {msg.senderId !== user?.uid && (
                  <Avatar className="h-8 w-8">
                     <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${msg.senderName}`} alt={msg.senderName} />
                     <AvatarFallback>{getInitials(msg.senderName)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                  'max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl', 
                  msg.senderId === user?.uid 
                    ? 'bg-primary text-primary-foreground rounded-br-none' 
                    : 'bg-muted rounded-bl-none'
                )}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={cn("text-xs mt-1 opacity-70", msg.senderId === user?.uid ? 'text-right' : 'text-left')}>
                    {msg.createdAt ? format(msg.createdAt.toDate(), 'p') : ''}
                  </p>
                </div>
                 {msg.senderId === user?.uid && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${msg.senderName}`} alt={msg.senderName} />
                    <AvatarFallback>{getInitials(msg.senderName)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground pt-12">
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      {session.status === 'active' && (
        <CardFooter>
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
         <CardFooter>
            <p className="text-center text-muted-foreground w-full">This session has been closed.</p>
         </CardFooter>
      )}
    </Card>
  );
}
