
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
import { Send, ArrowLeft, MessageSquare, Phone, PhoneOff, PhoneIncoming, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useWebRTC } from '@/hooks/useWebRTC';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../ui/alert-dialog';
import CallView from './CallView';

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
  const remoteVideoRef = React.useRef<HTMLAudioElement>(null);

  const {
    startCall,
    endCall,
    acceptCall,
    rejectCall,
    call,
    remoteStream,
    toggleMute,
    isMuted,
  } = useWebRTC(sessionId, user?.uid, remoteVideoRef);

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
      if (call) {
        endCall();
      }
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

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  if (loading) return <div className="flex-grow flex items-center justify-center"><LoadingSpinner /></div>;
  if (!session) return <div className="flex-grow flex items-center justify-center"><p>Session not found or you are not authorized.</p></div>;

  const otherUserName = user?.uid === session.studentId ? session.counsellorName : session.studentName;
  const isStudent = userData?.role === 'student';
  const isCounsellor = userData?.role === 'counsellor';
  const isSessionActive = session?.status === 'active';
  
  const isCallRinging = call?.status === 'ringing';
  const isCallConnected = call?.status === 'connected';
  const isMyCall = call?.studentId === user?.uid;

  const IncomingCallModal = () => {
    if (!isCallRinging || isMyCall) return null;

    return (
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-center text-2xl">Incoming Call</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              You have an incoming call from {session.studentName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center items-center py-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${session.studentName}`} alt={session.studentName} />
                <AvatarFallback className="text-3xl">{getInitials(session.studentName || 'S')}</AvatarFallback>
              </Avatar>
          </div>
          <AlertDialogFooter className="sm:justify-center gap-4">
            <Button onClick={rejectCall} variant="destructive" size="lg" className="flex-1">
              <PhoneOff className="mr-2 h-5 w-5" /> Decline
            </Button>
            <Button onClick={acceptCall} size="lg" className="bg-green-500 hover:bg-green-600 flex-1">
               <PhoneIncoming className="mr-2 h-5 w-5" /> Accept
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  const CallButton = () => {
     if (isCallConnected || isCallRinging) return null;
     if (isStudent && session.status === 'active') {
      return (
        <Button variant="outline" size="sm" onClick={startCall}>
          <Phone className="sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Start Call</span>
        </Button>
      );
    }
    return null;
  }

  if (isCallConnected && session) {
    return (
        <CallView 
            sessionTitle={session.title}
            otherUserName={otherUserName || 'User'}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onEndCall={endCall}
        />
    )
  }


  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
      <IncomingCallModal />
      <Card className="flex-grow flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
             <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave this page?</AlertDialogTitle>
                    <AlertDialogDescription>
                      If you have an active call, it will be disconnected. Are you sure you want to go back?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Stay</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (call) endCall();
                        router.back();
                      }}
                    >
                      Leave
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${otherUserName}`} alt={otherUserName} />
                <AvatarFallback>{getInitials(otherUserName || 'U')}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="font-headline text-base sm:text-lg truncate">{otherUserName}</CardTitle>
                <CardDescription className="text-xs truncate">{session.title}</CardDescription>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isCallRinging && isMyCall && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground animate-pulse">Ringing...</span>
                <Button variant="destructive" size="sm" onClick={endCall}>
                  Cancel Request
                </Button>
              </div>
            )}
            <CallButton />
            {isCounsellor && isSessionActive && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                    <XCircle className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently end the session for both you and the student. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCloseSession}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      End Session
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
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
                disabled={!!call}
              />
              <Button type="submit" size="icon" disabled={!!call}>
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
      <audio ref={remoteVideoRef} autoPlay playsInline className="hidden"></audio>
    </div>
  );
}
