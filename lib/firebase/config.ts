import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFirebaseConfig } from './get-firebase-config';

// Initialize Firebase
const firebaseConfig = getFirebaseConfig();

const app =
  !getApps().length && firebaseConfig
    ? initializeApp(firebaseConfig)
    : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, firebaseConfig };
