import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your unique Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyDD9ZXZHqHuXhnadFJ50Ri-pL1cmqhuqV8",
  authDomain: "ai-practice-coach.firebaseapp.com",
  projectId: "ai-practice-coach",
  storageBucket: "ai-practice-coach.firebasestorage.app",
  messagingSenderId: "256745664335",
  appId: "1:256745664335:web:fbc77530dbb143e2761f3a"
};

// Initialize Firebase ONCE
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services for other files to use
export const auth = getAuth(app);
export const db = getFirestore(app);