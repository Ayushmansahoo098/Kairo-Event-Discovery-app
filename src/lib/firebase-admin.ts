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

// Export adminDb safely. If not initialized, return a mock database object that logs warnings but doesn't crash,
// allowing in-memory operations and local testing of scrapers without Firebase credentials.
export const adminDb = (() => {
  if (admin.apps.length) {
    return admin.firestore();
  }

  // Mock DocumentSnapshot
  const mockDocSnap = {
    exists: false,
    data: () => ({}),
    id: "mock-id",
  };

  // Mock QuerySnapshot
  const mockQuerySnap = {
    empty: true,
    docs: [],
    forEach: () => {},
  };

  // Mock DocumentReference
  const mockDocRef = {
    get: async () => mockDocSnap,
    set: async () => {},
    update: async () => {},
    delete: async () => {},
  };

  // Mock CollectionReference
  const mockCollectionRef = {
    doc: () => mockDocRef,
    add: async () => mockDocRef,
    where: () => mockCollectionRef,
    orderBy: () => mockCollectionRef,
    limit: () => mockCollectionRef,
    select: () => mockCollectionRef,
    get: async () => {
      console.warn("Firestore Admin DB: returning mock empty query snapshot (firebase-admin is not initialized).");
      return mockQuerySnap;
    },
  };

  // Mock WriteBatch
  const mockBatch = {
    set: () => {},
    update: () => {},
    delete: () => {},
    commit: async () => {},
  };

  // Mock Firestore DB
  const mockDb = {
    collection: () => mockCollectionRef,
    batch: () => mockBatch,
  };

  return mockDb as unknown as admin.firestore.Firestore;
})();

