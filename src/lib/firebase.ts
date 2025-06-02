import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from "firebase/auth";
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

let app: FirebaseApp;

if (typeof window !== "undefined") { // Ensure Firebase is initialized only on the client side
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} else {
  // Mock app for server-side rendering if needed, or handle appropriately
  // For this app, Firebase services will primarily be used client-side
}


// Client-side services
const auth = typeof window !== "undefined" ? getAuth(app!) : undefined;
// const db = typeof window !== "undefined" ? getFirestore(app!) : undefined;
// const messaging = typeof window !== "undefined" && app ? getMessaging(app) : undefined; // Check app existence

const googleProvider = typeof window !== "undefined" ? new GoogleAuthProvider() : undefined;
const emailProvider = EmailAuthProvider.PROVIDER_ID;


export { app, auth, googleProvider, emailProvider /*, db, messaging */ };
