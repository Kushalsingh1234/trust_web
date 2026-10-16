// Firebase Configuration for Rashtriya Sanatan Sanskar Seva Sansthan (Trust)
// Initialized with secure environment variables and fallback production credentials
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD770YCyZ4ZokrlYJnlJ8agqOdaSzoGvTY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "trust-77f44.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "trust-77f44",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "trust-77f44.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "158554104499",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:158554104499:web:37709ff8e64c80d9c046c6"
};

// Initialize Firebase safely without duplicate initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
