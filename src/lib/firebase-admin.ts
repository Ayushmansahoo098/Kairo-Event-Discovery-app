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
  } catch (err) {
    console.error("Firebase Admin initialization error:", err);
  }
}

// Export adminDb safely. If not initialized, return a proxy or a dummy object that logs errors,
// so that the build finishes successfully but runtime calls fail gracefully with instructions.
export const adminDb = (() => {
  if (admin.apps.length) {
    return admin.firestore();
  }
  
  // Return a proxy that intercepts database calls to prevent build crashes
  const handler: ProxyHandler<object> = {
    get(target, prop) {
      if (prop === "then") {
        return undefined; // Avoid blocking promise-like checks
      }
      return () => {
        console.warn(`Firestore Admin DB method "${String(prop)}" was called but firebase-admin is not initialized. Please configure your FIREBASE_ env variables in .env.local.`);
        return new Proxy({}, handler);
      };
    }
  };

  return new Proxy({} as object, handler) as unknown as admin.firestore.Firestore;
})();

