import { db } from "./firebase";
import { doc, writeBatch } from "firebase/firestore";
import { events } from "./mock-data";

/**
 * Seeds the Firestore database with the high-quality mock events list.
 * Can be run client-side via a dev toggle, browser console, or API.
 */
export async function seedDatabase() {
  try {
    console.log("Starting Firestore events seeding...");
    const batch = writeBatch(db);
    
    events.forEach((event) => {
      const eventRef = doc(db, "events", event.id);
      batch.set(eventRef, {
        ...event,
        createdAt: new Date() // Add tracking timestamp
      });
    });
    
    await batch.commit();
    console.log("Firestore database seeded successfully with", events.length, "events!");
    return { success: true, count: events.length };
  } catch (error) {
    console.error("Firestore database seeding failed:", error);
    return { success: false, error: String(error) };
  }
}
