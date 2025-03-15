// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDIXIql505q9RQBJiOQ5DiuwZvwVG5VFSg",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "livecue-93be0.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "livecue-93be0",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "livecue-93be0.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "152972388399",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:152972388399:web:598ca78cd0a91a1e57feda",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-GBTH4LQ001"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, createUserWithEmailAndPassword, setDoc, doc };