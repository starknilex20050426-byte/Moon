// Firebase SDK configuration for Moon - Keep it stylish
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyCLgxgQdHzEg0cqN76vVDCKt-dKbppp5vU",
  authDomain: "moon-apparel.firebaseapp.com",
  projectId: "moon-apparel",
  storageBucket: "moon-apparel.firebasestorage.app",
  messagingSenderId: "1099240286722",
  appId: "1:1099240286722:web:14f26e918f4c676715951b",
  measurementId: "G-J2TBLPH53F"
};

// Initialize Firebase safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
