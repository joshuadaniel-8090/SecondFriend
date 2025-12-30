import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'counsellor' | 'admin';

export interface AppUser {
  uid: string;
  email: string | null;
  name: string;
  role: UserRole;
  collegeId?: string | null; // For students and counsellors
  department?: string; // Student-specific
  year?: number; // Student-specific
  specialization?: string; // Counsellor-specific
  experience?: number; // Counsellor-specific
  status?: 'active' | 'inactive';
}

export interface College {
    id: string;
    name: string;
    domain: string;
    location: string;
    status: 'active' | 'inactive';
    createdAt: Timestamp;
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
  collegeId?: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: Timestamp;
}
