
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, EmailAuthProvider, type Auth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore"; // Uncomment if using Firestore for watchlist etc.
// import { getMessaging } from "firebase/messaging"; // Uncomment if using FCM

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (typeof window !== "undefined") { // Ensure Firebase is initialized only on the client side
  
  console.log(
    "Firebase Service: Attempting to initialize. API Key starts with:", 
    firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 5) + "..." : "UNDEFINED"
  );

  if (!firebaseConfig.apiKey) {
    console.error(
      "CRITICAL Firebase Error: NEXT_PUBLIC_FIREBASE_API_KEY is missing. " +
      "Firebase cannot be initialized. Please check your .env.local file, " +
      "ensure the variable is correctly named (NEXT_PUBLIC_FIREBASE_API_KEY), " +
      "and restart your Next.js development server."
    );
  } else if (
    firebaseConfig.apiKey === "YOUR_API_KEY" || // Common placeholder
    firebaseConfig.apiKey === "AIzaSyXXXXXXXXXXXXXXXXXXXXXXX" || // Common placeholder
    firebaseConfig.apiKey.includes("XXXX") // Common placeholder pattern
  ) {
     console.warn(
      "Firebase Warning: The API key (NEXT_PUBLIC_FIREBASE_API_KEY) looks like a placeholder. " +
      "Please ensure you are using your actual Firebase project API key from the Firebase console."
    );
  }

  if (firebaseConfig.apiKey) { // Only attempt to initialize if an API key is present
    if (!getApps().length) {
      try {
        app = initializeApp(firebaseConfig);
        console.log("Firebase Service: initializeApp successful.");
      } catch (initError) {
        console.error("Firebase Service: initializeApp failed:", initError);
        // app will remain undefined
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
          "Please double-check your NEXT_PUBLIC_FIREBASE_API_KEY and other project settings in .env.local. " +
          "Ensure the Firebase Authentication API is enabled in your Firebase project console."
        );
        // auth will remain undefined
      }
    } else if (firebaseConfig.apiKey) { 
      // This case means app initialization failed despite an API key being present.
      console.error(
          "Firebase Service: `getAuth` cannot be called because Firebase app initialization failed. " +
          "Check for previous `initializeApp` errors in the console."
      );
    }
  } else {
    // API key was missing, critical error already logged. No app, no auth.
    console.warn("Firebase Service: Skipping Firebase initialization and auth setup due to missing API key.");
  }
} else {
  console.log("Firebase Service: Not on client, skipping Firebase initialization.");
}

const googleProvider = typeof window !== "undefined" && auth ? new GoogleAuthProvider() : undefined;
const emailProvider = typeof window !== "undefined" ? EmailAuthProvider.PROVIDER_ID : undefined;


export { app, auth, googleProvider, emailProvider /*, db, messaging */ };
