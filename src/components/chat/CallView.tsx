
'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallViewProps {
    sessionTitle: string;
    otherUserName: string;
    isMuted: boolean;
    onToggleMute: () => void;
    onEndCall: () => void;
}


const useTimer = () => {
    const [seconds, setSeconds] = React.useState(0);
  
    React.useEffect(() => {
      const interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
      return () => clearInterval(interval);
    }, []);
  
    const formatTime = (timeInSeconds: number) => {
      const mins = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
      const secs = (timeInSeconds % 60).toString().padStart(2, '0');
      return `${mins}:${secs}`;
    };
  
    return formatTime(seconds);
};


export default function CallView({ sessionTitle, otherUserName, isMuted, onToggleMute, onEndCall }: CallViewProps) {
    const callTime = useTimer();

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center text-center p-8 flex-grow">
                <p className="text-muted-foreground text-lg mb-2">{sessionTitle}</p>
                <Avatar className="h-40 w-40 mb-4">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${otherUserName}`} alt={otherUserName} />
                    <AvatarFallback className="text-5xl">{getInitials(otherUserName || 'U')}</AvatarFallback>
                </Avatar>
                <h1 className="font-headline text-4xl font-bold mb-2">{otherUserName}</h1>
                <p className="text-2xl text-muted-foreground font-mono">{callTime}</p>
            </div>
            <div className="w-full flex items-center justify-center gap-6 p-8 bg-background/80 backdrop-blur-sm border-t">
                <Button 
                    variant={isMuted ? "secondary" : "outline"} 
                    size="lg" 
                    className="rounded-full w-20 h-20"
                    onClick={onToggleMute}
                >
                    {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
                </Button>
                <Button 
                    variant="destructive" 
                    size="lg" 
                    className="rounded-full w-20 h-20"
                    onClick={onEndCall}
                >
                    <PhoneOff size={32} />
                </Button>
            </div>
        </div>
    )
}
