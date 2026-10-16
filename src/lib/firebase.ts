// Firebase SDK configuration for Moon - Keep it stylish
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyA8QFOL7A4WKMHexTIPKXCujcuBczPTrTc",
  authDomain: "moon---keep-it-stylish.firebaseapp.com",
  projectId: "moon---keep-it-stylish",
  storageBucket: "moon---keep-it-stylish.firebasestorage.app",
  messagingSenderId: "603421425615",
  appId: "1:603421425615:web:a3402c5cd7d5860b961cba"
};

// Initialize Firebase safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
