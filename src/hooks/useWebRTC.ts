
'use client';

import * as React from 'react';
import { db } from '@/lib/firebase/config';
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  query,
  where,
  limit,
  orderBy,
  deleteDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import type { Call } from '@/lib/types';
import { useToast } from './use-toast';

const servers = {
  iceServers: [
    {
      urls: [
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTC(
  sessionId: string,
  userId: string | undefined,
  remoteVideoRef: React.RefObject<HTMLAudioElement>
) {
  const { toast } = useToast();
  const [call, setCall] = React.useState<Call | null>(null);
  const [callId, setCallId] = React.useState<string | null>(null);
  const [isMuted, setIsMuted] = React.useState(false);

  const pcRef = React.useRef<RTCPeerConnection | null>(null);
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const callCollectionRef = React.useMemo(() => collection(db, 'sessions', sessionId, 'calls'), [sessionId]);


  const cleanup = React.useCallback(async () => {
    // Stop all local media tracks
    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
    }

    // Close the peer connection
    if (pcRef.current) {
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
        pcRef.current.close();
        pcRef.current = null;
    }

    // Clear remote audio
    if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
    }
    
    // Reset component state
    setCall(null);
    setCallId(null);
    setIsMuted(false);

    // After a short delay, delete the call document from Firestore to clean up.
    // This gives the other client a chance to see the 'ended' status.
    if(callId) {
        setTimeout(async () => {
            const callDocRef = doc(callCollectionRef, callId);
            const offerCandidatesRef = collection(callDocRef, 'offerCandidates');
            const answerCandidatesRef = collection(callDocRef, 'answerCandidates');
            
            const batch = writeBatch(db);
            const offerCandidates = await getDocs(offerCandidatesRef);
            offerCandidates.forEach(doc => batch.delete(doc.ref));

            const answerCandidates = await getDocs(answerCandidatesRef);
            answerCandidates.forEach(doc => batch.delete(doc.ref));

            batch.delete(callDocRef);
            await batch.commit();
        }, 1000);
    }
  }, [callId, callCollectionRef, remoteVideoRef]);
  
  // Listen for the active call document
  React.useEffect(() => {
    if (!sessionId) return;
    const q = query(callCollectionRef, where('status', 'in', ['ringing', 'connected']), limit(1));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const activeCallDoc = snapshot.docs[0];
        const activeCall = { id: activeCallDoc.id, ...activeCallDoc.data() } as Call;
        if (activeCall.id !== callId) {
            setCallId(activeCall.id);
        }
        setCall(activeCall);
      } else {
        if(call?.status === 'connected' && callId) {
            cleanup();
        }
      }
    });

    return unsubscribe;
  }, [sessionId, callId, call?.status, cleanup, callCollectionRef]);


  // Main WebRTC Logic & State Machine
  React.useEffect(() => {
    if (!callId || !userId || !call) {
      return;
    }
    
    if (call.status === 'ended') {
        cleanup();
        return;
    }

    const initializePeerConnection = async () => {
        if (pcRef.current) return; // Already initialized

        pcRef.current = new RTCPeerConnection(servers);

        try {
            localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current.getTracks().forEach((track) => {
                pcRef.current?.addTrack(track, localStreamRef.current!);
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Mic required', description: 'Audio permissions are required for calls.' });
            return;
        }

        pcRef.current.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };
    };

    const handleCaller = async () => {
        await initializePeerConnection();
        if(!pcRef.current) return;

        const callDocRef = doc(callCollectionRef, callId);
        const offerCandidatesRef = collection(callDocRef, 'offerCandidates');
        const answerCandidatesRef = collection(callDocRef, 'answerCandidates');

        pcRef.current.onicecandidate = (event) => {
          event.candidate && addDoc(offerCandidatesRef, event.candidate.toJSON());
        };

        const offerDescription = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offerDescription);
        await updateDoc(callDocRef, { offer: { sdp: offerDescription.sdp, type: offerDescription.type } });

        onSnapshot(callDocRef, (snapshot) => {
            const data = snapshot.data();
             if (pcRef.current && pcRef.current.signalingState === 'have-local-offer' && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                pcRef.current.setRemoteDescription(answerDescription);
            }
        });

        onSnapshot(answerCandidatesRef, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    pcRef.current?.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                }
            });
        });
    };

    const handleCallee = async () => {
        if (!call?.offer) return;
        await initializePeerConnection();
        if(!pcRef.current) return;
        
        const callDocRef = doc(callCollectionRef, callId);
        const offerCandidatesRef = collection(callDocRef, 'offerCandidates');
        const answerCandidatesRef = collection(callDocRef, 'answerCandidates');

        pcRef.current.onicecandidate = (event) => {
            event.candidate && addDoc(answerCandidatesRef, event.candidate.toJSON());
        };

        await pcRef.current.setRemoteDescription(new RTCSessionDescription(call.offer));
        const answerDescription = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answerDescription);
        await updateDoc(callDocRef, { answer: { type: answerDescription.type, sdp: answerDescription.sdp } });

        onSnapshot(offerCandidatesRef, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    pcRef.current?.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                }
            });
        });
    };
    
    // Determine role and execute corresponding WebRTC logic
    if (call.status === 'ringing' && call.studentId === userId) {
        handleCaller();
    } else if (call.status === 'connected' && call.counsellorId === userId) {
        handleCallee();
    }
  
  }, [call?.status, callId, userId, toast, callCollectionRef, remoteVideoRef, call, cleanup]);


  const startCall = async () => {
    if (!userId) return;
    const q = query(callCollectionRef, where('status', 'in', ['ringing', 'connected']), limit(1));
    const existingCalls = await getDocs(q);
    if (!existingCalls.empty) {
        toast({ variant: 'destructive', title: 'Call in Progress', description: 'A call is already active in this session.'});
        return;
    }
    
    await addDoc(callCollectionRef, {
      studentId: userId,
      status: 'ringing',
      createdAt: serverTimestamp(),
    });
  };

  const acceptCall = async () => {
    if (!callId || !userId) return;
    const callDocRef = doc(callCollectionRef, callId);
    await updateDoc(callDocRef, { 
        status: 'connected',
        counsellorId: userId,
    });
  };
  
  const endCall = async () => {
    if (!callId) return;
    const callDocRef = doc(callCollectionRef, callId);
    await updateDoc(callDocRef, { status: 'ended' });
    // The useEffect listening to call status will handle cleanup
  };
  
  const rejectCall = async () => {
      if (!callId) return;
      const callDocRef = doc(callCollectionRef, callId);
      await updateDoc(callDocRef, { status: 'ended' });
      toast({ title: "Call Declined" });
  }
  
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      });
    }
  };

  return { startCall, endCall, acceptCall, rejectCall, toggleMute, isMuted, call };
}
