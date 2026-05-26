import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, increment, setDoc, getDoc } from "firebase/firestore";

/**
 * Kairo — Lightweight User Interaction Analytics Engine
 *
 * Tracks user engagement events (clicks, bookmarks) to power feed learning
 * and trending algorithms. Data is written to Firestore collections:
 *
 * - `analytics_events`: Individual interaction records
 * - `trending_tags`: Tag/category popularity counters
 * - `source_popularity`: Source engagement counters (Devfolio, Unstop, etc.)
 */

export type InteractionAction = "click" | "bookmark";

interface InteractionPayload {
  userId?: string;
  eventId: string;
  action: InteractionAction;
  category?: string;
  source?: string;
  tags?: string[];
}

/**
 * Log a user interaction event and update aggregate counters.
 * Runs entirely client-side using the Firebase Web SDK.
 */
export async function logInteractionEvent(payload: InteractionPayload): Promise<void> {
  const { userId, eventId, action, category, source, tags } = payload;

  try {
    // 1. Write individual interaction record
    await addDoc(collection(db, "analytics_events"), {
      userId: userId || "anonymous",
      eventId,
      action,
      category: category || "unknown",
      source: source || "unknown",
      timestamp: new Date().toISOString(),
    });

    // 2. Update tag popularity counters (for trending algorithm input)
    if (tags && tags.length > 0) {
      for (const tag of tags.slice(0, 4)) {
        const tagRef = doc(db, "trending_tags", tag.toLowerCase());
        const tagDoc = await getDoc(tagRef);
        if (tagDoc.exists()) {
          await updateDoc(tagRef, {
            [`${action}Count`]: increment(1),
            lastInteraction: new Date().toISOString(),
          });
        } else {
          await setDoc(tagRef, {
            tag: tag.toLowerCase(),
            clickCount: action === "click" ? 1 : 0,
            bookmarkCount: action === "bookmark" ? 1 : 0,
            lastInteraction: new Date().toISOString(),
          });
        }
      }
    }

    // 3. Update source popularity counters
    if (source) {
      const sourceRef = doc(db, "source_popularity", source);
      const sourceDoc = await getDoc(sourceRef);
      if (sourceDoc.exists()) {
        await updateDoc(sourceRef, {
          [`${action}Count`]: increment(1),
          lastInteraction: new Date().toISOString(),
        });
      } else {
        await setDoc(sourceRef, {
          source,
          clickCount: action === "click" ? 1 : 0,
          bookmarkCount: action === "bookmark" ? 1 : 0,
          lastInteraction: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    // Analytics failures should never block the user experience
    console.error("Analytics log failed (non-blocking):", error);
  }
}
