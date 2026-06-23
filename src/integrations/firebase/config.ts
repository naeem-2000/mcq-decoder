import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyBVk1HMHsjI5Uc79AprnDfvizaHt9TOCe0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "mcq-decoder.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "mcq-decoder",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "mcq-decoder.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "664074686590",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:664074686590:web:d148a57fb9d8f4eaf1c82f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-7NK1PE6XMG",
};

export const firebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
