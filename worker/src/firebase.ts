import admin from "firebase-admin";

const isConfigured =
  !!process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PROJECT_ID !== "YOUR_PROJECT_ID_HERE" &&
  !!process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_PRIVATE_KEY !== "YOUR_PRIVATE_KEY_HERE";

if (!admin.apps.length && isConfigured) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    console.log("✅ Firebase Admin initialized successfully.");
  } catch (err) {
    console.error("❌ Firebase Admin initialization failed:", err);
  }
} else if (!isConfigured) {
  console.warn("⚠️ Firebase credentials not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.");
}

export const adminDb = admin.apps.length ? admin.firestore() : (null as any);
