import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'counsellor';

export interface AppUser {
  uid: string;
  email: string | null;
  name: string;
  role: UserRole;
}

export type SessionStatus = 'pending' | 'active' | 'closed';
export type SessionTag = 'stress' | 'academics' | 'relationship' | 'other';

export interface Session {
  id: string;
  studentId: string;
  studentName: string;
  counsellorId?: string;
  counsellorName?: string;
  title: string;
  tag: SessionTag;
  status: SessionStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: Timestamp;
}
