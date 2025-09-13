
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider, EmailAuthProvider, type Auth, getRedirectResult, updateProfile } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCw1LrhLFPYwPasxlVP6pkagbF3kdSwXkA",
  authDomain: "stockdox.firebaseapp.com",
  projectId: "stockdox",
  storageBucket: "stockdox.firebasestorage.app",
  messagingSenderId: "418859968883",
  appId: "1:418859968883:web:6df4d25d922455ebbefd06",
  measurementId: "G-4PGH4CZQG5"
};

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let db: Firestore | undefined = undefined;
let googleProvider: GoogleAuthProvider | undefined = undefined;
let appleProvider: OAuthProvider | undefined = undefined;
const emailProvider = typeof window !== "undefined" ? EmailAuthProvider.PROVIDER_ID : undefined;

// Initialize Firebase
if (typeof window !== "undefined") {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      console.log("Firebase Service: initializeApp successful. Project ID:", app.options.projectId);
    } catch (initError) {
      console.error("Firebase Service: initializeApp failed:", initError);
      app = undefined;
    }
  } else {
    app = getApp();
    console.log("Firebase Service: getApp() successful (already initialized). Project ID:", app.options.projectId);
  }

  if (app) {
    try {
      auth = getAuth(app);
      googleProvider = new GoogleAuthProvider();
      appleProvider = new OAuthProvider('apple.com');
      console.log("Firebase Service: getAuth, Google, and Apple providers successful.");
    } catch (authError) {
      console.error("Firebase Service: getAuth failed:", authError);
      auth = undefined;
      googleProvider = undefined;
      appleProvider = undefined;
    }

    try {
      db = getFirestore(app);
      console.log("Firebase Service: getFirestore successful.");
    } catch (firestoreError) {
      console.error("Firebase Service: getFirestore failed:", firestoreError);
      db = undefined;
    }
  } else {
    console.error(
      "Firebase Service: Firebase app initialization failed. Auth and Firestore cannot be initialized."
    );
  }
} else {
  // This is the server-side log
  console.log("Firebase Service: Not on client-side, skipping Firebase initialization.");
}

export { app, auth, db, googleProvider, appleProvider, emailProvider, getRedirectResult, updateProfile };
