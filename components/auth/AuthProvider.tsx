'use client';

import * as React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import type { AppUser } from '@/lib/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface AuthContextType {
  user: User | null;
  userData: AppUser | null;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [userData, setUserData] = React.useState<AppUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        // Now also fetch the user's role from Firestore
        const userDocRef = doc(db, 'users', authUser.uid);
        const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
             if (doc.exists()) {
                setUserData(doc.data() as AppUser);
            } else {
                setUserData(null);
            }
            setLoading(false);
        });
         return () => unsubscribeFirestore();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center">
              <LoadingSpinner />
          </div>
      )
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => React.useContext(AuthContext);
