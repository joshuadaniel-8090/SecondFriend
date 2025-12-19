// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDNWTWtDfYO5f7XIwIIdearY55-WlqADJQ",
  authDomain: "secondfriend-41a6f.firebaseapp.com",
  projectId: "secondfriend-41a6f",
  storageBucket: "secondfriend-41a6f.firebasestorage.app",
  messagingSenderId: "279145570900",
  appId: "1:279145570900:web:8b9cee2eabca726d0783c1",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
