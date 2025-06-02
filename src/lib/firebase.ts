
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, EmailAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore"; // Added Firestore import

const firebaseConfig = {
  apiKey: "AIzaSyCw1LrhLFPYwPasxlVP6pkagbF3kdSwXkA", // Hardcoded API key
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined; // Added Firestore instance

if (typeof window !== "undefined") { 
  
  console.log(
    "Firebase Service: Attempting to initialize with hardcoded API Key."
  );

  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      console.log("Firebase Service: initializeApp successful.");
    } catch (initError) {
      console.error("Firebase Service: initializeApp failed:", initError);
    }
  } else {
    app = getApp();
    console.log("Firebase Service: getApp() successful (already initialized).");
  }

  if (app) {
    try {
      auth = getAuth(app);
      console.log("Firebase Service: getAuth successful.");
    } catch (authError) {
      console.error("Firebase Service: getAuth failed:", authError);
      console.error(
        "Firebase Service: This often indicates an issue with the Firebase configuration (e.g., invalid API key) " +
        "even if initializeApp did not throw an immediate error. " +
        "Please double-check your project settings in the Firebase console. " +
        "Ensure the Firebase Authentication API is enabled in your Firebase project console."
      );
    }
    try {
      db = getFirestore(app); // Initialize Firestore
      console.log("Firebase Service: getFirestore successful.");
    } catch (firestoreError) {
      console.error("Firebase Service: getFirestore failed:", firestoreError);
    }
  } else { 
    console.error(
        "Firebase Service: Firebase app initialization failed. Auth and Firestore cannot be initialized. " +
        "Check for previous `initializeApp` errors in the console."
    );
  }
} else {
  console.log("Firebase Service: Not on client, skipping Firebase initialization.");
}

const googleProvider = typeof window !== "undefined" && auth ? new GoogleAuthProvider() : undefined;
const emailProvider = typeof window !== "undefined" ? EmailAuthProvider.PROVIDER_ID : undefined;


export { app, auth, db, googleProvider, emailProvider };
