import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Guard: only initialize Firebase when all required credentials are present.
// This prevents auth/invalid-api-key crashes during Vercel's build / SSR phase.
const hasCredentials = !!(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (hasCredentials) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // Minimal stub for build-time SSR — NEXT_PUBLIC_* vars are injected at runtime
  // in the browser so real Firebase calls always happen client-side.
  app =
    getApps().length === 0
      ? initializeApp({ projectId: "build-placeholder" }, "placeholder")
      : getApps()[0];
  auth = {} as Auth;
  db = {} as Firestore;
}

export { app, auth, db, hasCredentials };
