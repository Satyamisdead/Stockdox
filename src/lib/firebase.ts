
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, AppleAuthProvider, EmailAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let db: Firestore | undefined = undefined;
let googleProvider: GoogleAuthProvider | undefined = undefined;
let appleProvider: AppleAuthProvider | undefined = undefined;
const emailProvider = typeof window !== "undefined" ? EmailAuthProvider.PROVIDER_ID : undefined;

if (typeof window !== "undefined") {
  console.log("Firebase Service: Attempting client-side initialization.");

  const missingKeys = Object.entries(firebaseConfigValues)
    .filter(([key, value]) => !value || typeof value !== 'string')
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    console.error(
      "Firebase Service: Firebase configuration is incomplete. The following NEXT_PUBLIC_FIREBASE_ environment variables are missing or invalid in .env.local: " +
      missingKeys.join(", ") +
      ". Firebase will not be initialized."
    );
  } else {
    console.log("Firebase Service: All Firebase configuration values found in environment variables.");
    
    // Type assertion after check, as we know all values are strings
    const completeFirebaseConfig = firebaseConfigValues as { [key: string]: string };

    if (!getApps().length) {
      try {
        console.log("Firebase Service: Calling initializeApp...");
        app = initializeApp(completeFirebaseConfig);
        console.log("Firebase Service: initializeApp successful. Project ID:", app.options.projectId);
      } catch (initError) {
        console.error("Firebase Service: initializeApp failed:", initError);
        app = undefined; // Ensure app is undefined on failure
      }
    } else {
      app = getApp();
      console.log("Firebase Service: getApp() successful (already initialized). Project ID:", app.options.projectId);
    }

    if (app) {
      try {
        console.log("Firebase Service: Calling getAuth...");
        auth = getAuth(app);
        console.log("Firebase Service: getAuth successful.");
        googleProvider = new GoogleAuthProvider(); // Initialize provider only if auth is successful
        appleProvider = new AppleAuthProvider();
      } catch (authError) {
        console.error("Firebase Service: getAuth failed:", authError);
        console.error(
          "Firebase Service: This often indicates an issue with the Firebase configuration (e.g., invalid API key or authDomain) " +
          "or that the Firebase Authentication API is not enabled in your Firebase project console. " +
          "Please double-check your project settings and .env.local file."
        );
        auth = undefined; // Ensure auth is undefined on failure
        googleProvider = undefined;
        appleProvider = undefined;
      }

      try {
        console.log("Firebase Service: Calling getFirestore...");
        db = getFirestore(app);
        console.log("Firebase Service: getFirestore successful.");
      } catch (firestoreError) {
        console.error("Firebase Service: getFirestore failed:", firestoreError);
        db = undefined; // Ensure db is undefined on failure
      }
    } else {
      console.error(
        "Firebase Service: Firebase app initialization failed. Auth and Firestore cannot be initialized."
      );
    }
  }
} else {
  console.log("Firebase Service: Not on client-side, skipping Firebase initialization.");
}

export { app, auth, db, googleProvider, appleProvider, emailProvider };
