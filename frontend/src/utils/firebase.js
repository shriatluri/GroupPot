// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxS3yOYGklUi8ROi7y1OQeIIaNNe1z3eI",
  authDomain: "grouppot.firebaseapp.com",
  projectId: "grouppot",
  storageBucket: "grouppot.firebasestorage.app",
  messagingSenderId: "557833133285",
  appId: "1:557833133285:web:7cc413ec3c6ecfacd1c80c",
  measurementId: "G-8ERPDC8W80"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Authentication
export const db = getFirestore(app); // Firestore for database
export const auth = getAuth(app);    // Firebase Authentication