
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider, EmailAuthProvider, type Auth, getRedirectResult } from "firebase/auth";
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
let appleProvider: OAuthProvider | undefined = undefined;
const emailProvider = typeof window !== "undefined" ? EmailAuthProvider.PROVIDER_ID : undefined;

if (typeof window !== "undefined") {
  // This code only runs on the client-side

  const missingKeys = Object.entries(firebaseConfigValues)
    .filter(([key, value]) => !value || typeof value !== 'string')
    .map(([key]) => key.replace('NEXT_PUBLIC_', ''));

  if (missingKeys.length > 0) {
    // This detailed error is crucial for developers in the local environment.
    console.error(
`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
Firebase Service: Firebase configuration is incomplete.
This is expected for a new project setup in a development environment.

To fix this, create a file named '.env.local' in the root of your project
and add your Firebase project's configuration values to it.

You can get these values from the Firebase console:
Project Settings > General > Your apps > Web app > SDK setup and configuration.

Example .env.local file:
--------------------------------------------------------------------------
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1234567890"
NEXT_PUBLIC_FIREBASE_APP_ID="1:1234567890:web:abcd..."
--------------------------------------------------------------------------

The following keys seem to be missing from your environment:
${missingKeys.map(k => `NEXT_PUBLIC_${k}`).join("\n")}

After creating the file, you MUST restart your development server.
Firebase will not be initialized until this is fixed.
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`
    );
  } else {
    // All keys are present, proceed with initialization.
    console.log("Firebase Service: All Firebase configuration values found. Attempting to initialize.");
    
    const completeFirebaseConfig = firebaseConfigValues as { [key: string]: string };

    if (!getApps().length) {
      try {
        app = initializeApp(completeFirebaseConfig);
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
  }
} else {
  // This is the server-side log
  console.log("Firebase Service: Not on client-side, skipping Firebase initialization.");
}

export { app, auth, db, googleProvider, appleProvider, emailProvider, getRedirectResult };
