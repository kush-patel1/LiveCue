// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateEmail, updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, addDoc, getDocs, query, where, writeBatch, updateDoc, arrayUnion, onSnapshot, deleteDoc } from "firebase/firestore";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Google Analytics via Firebase — no extra account needed. Guarded by
// isSupported() so it no-ops in unsupported environments (e.g. some in-app
// browsers) instead of throwing. Data appears in Firebase console → Analytics.
isAnalyticsSupported()
  .then((ok) => { if (ok) getAnalytics(app); })
  .catch(() => {});

export { auth, db, createUserWithEmailAndPassword, setDoc, doc, collection, addDoc, getDocs, query, where, writeBatch, updateDoc, arrayUnion, onSnapshot, deleteDoc, updateEmail, updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider, updateProfile };