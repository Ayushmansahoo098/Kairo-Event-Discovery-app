import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, increment, setDoc, getDoc } from "firebase/firestore";

/**
 * Kairo — Enhanced User Interaction Analytics Engine
 *
 * Tracks user engagement events (views, saves, registrations, searches, category clicks)
 * to power feed learning, trending algorithms, and the recommendation engine.
 * Data is written to Firestore collections:
 *
 * - `analytics_events`: Individual interaction records
 * - `trending_tags`: Tag/category popularity counters
 * - `source_popularity`: Source engagement counters
 * - `events`: Event documents (increments views/saves/regs and updates popularityScore)
 */

export type InteractionAction = 
  | "view" 
  | "save" 
  | "register" 
  | "search" 
  | "category_click"
  | "recommendations_served"
  | "recommendation_click"
  | "recommendation_save"
  | "recommendation_register";

interface InteractionPayload {
  userId?: string;
  eventId?: string; // Optional for search/category_click
  action: InteractionAction;
  category?: string;
  source?: string;
  tags?: string[];
  query?: string;      // Present if action == "search"
  dwellTime?: number;  // Present if action == "view" (dwell time in seconds)
  isRecommendation?: boolean; // Flag to identify recommendation funnel origin
  recommendedEvents?: { eventId: string; category: string }[]; // For batch served logging
}

/**
 * Log a user interaction event and update aggregate counters.
 * Runs entirely client-side using the Firebase Web SDK.
 */
export async function logInteractionEvent(payload: InteractionPayload): Promise<void> {
  const { userId, eventId, action, category, source, tags, query, dwellTime, isRecommendation, recommendedEvents } = payload;

  // Map standard actions to recommendation-specific actions if flagged
  let finalAction = action;
  if (isRecommendation) {
    if (action === "view") finalAction = "recommendation_click";
    else if (action === "save") finalAction = "recommendation_save";
    else if (action === "register") finalAction = "recommendation_register";
  }

  try {
    // 1. Write individual interaction record in analytics_events
    await addDoc(collection(db, "analytics_events"), {
      userId: userId || "anonymous",
      eventId: eventId || null,
      action: finalAction,
      category: category || "unknown",
      source: source || "unknown",
      timestamp: new Date().toISOString(),
      query: query || null,
      dwellTime: dwellTime !== undefined ? dwellTime : null,
      isRecommendation: isRecommendation || false,
      recommendedEvents: recommendedEvents || null,
    });

    const isView = finalAction === "view" || finalAction === "recommendation_click";
    const isSave = finalAction === "save" || finalAction === "recommendation_save";
    const isRegister = finalAction === "register" || finalAction === "recommendation_register";

    // 2. Update event aggregates and compute popularityScore dynamically
    if (eventId && (isView || isSave || isRegister)) {
      try {
        const eventRef = doc(db, "events", eventId);
        const eventSnap = await getDoc(eventRef);
        
        if (eventSnap.exists()) {
          const data = eventSnap.data();
          const currentViews = (data.viewsCount || 0) + (isView ? 1 : 0);
          const currentSaves = (data.savesCount || 0) + (isSave ? 1 : 0);
          const currentRegs = (data.registrationsCount || 0) + (isRegister ? 1 : 0);
          
          // Compute popularity score: Views + Saves * 5 + Registrations * 10
          const popularityScore = currentViews + (currentSaves * 5) + (currentRegs * 10);
          
          const updatePayload: Record<string, unknown> = {
            popularityScore,
          };
          
          if (isView) updatePayload.viewsCount = increment(1);
          if (isSave) updatePayload.savesCount = increment(1);
          if (isRegister) updatePayload.registrationsCount = increment(1);
          
          await updateDoc(eventRef, updatePayload);
        }
      } catch (err) {
        console.error("Failed to update event popularity aggregate fields:", err);
      }
    }

    // 3. Update tag popularity counters (for trending algorithm input)
    if (tags && tags.length > 0) {
      for (const tag of tags.slice(0, 4)) {
        const tagRef = doc(db, "trending_tags", tag.toLowerCase());
        const tagDoc = await getDoc(tagRef);
        
        const isClick = isView || finalAction === "category_click";
        const isBookmark = isSave;

        if (tagDoc.exists()) {
          const updateData: Record<string, any> = {
            lastInteraction: new Date().toISOString(),
          };
          if (isClick) updateData.clickCount = increment(1);
          if (isBookmark) updateData.bookmarkCount = increment(1);

          await updateDoc(tagRef, updateData);
        } else {
          await setDoc(tagRef, {
            tag: tag.toLowerCase(),
            clickCount: isClick ? 1 : 0,
            bookmarkCount: isBookmark ? 1 : 0,
            lastInteraction: new Date().toISOString(),
          });
        }
      }
    }

    // 4. Update source popularity counters
    if (source) {
      const sourceRef = doc(db, "source_popularity", source);
      const sourceDoc = await getDoc(sourceRef);
      
      const isClick = isView || finalAction === "category_click";
      const isBookmark = isSave;

      if (sourceDoc.exists()) {
        const updateData: Record<string, any> = {
          lastInteraction: new Date().toISOString(),
        };
        if (isClick) updateData.clickCount = increment(1);
        if (isBookmark) updateData.bookmarkCount = increment(1);

        await updateDoc(sourceRef, updateData);
      } else {
        await setDoc(sourceRef, {
          source,
          clickCount: isClick ? 1 : 0,
          bookmarkCount: isBookmark ? 1 : 0,
          lastInteraction: new Date().toISOString(),
        });
      }
    }

    // 5. Invalidate user recommendations cache (fire-and-forget)
    if (userId && userId !== "anonymous") {
      const apiBase = process.env.NEXT_PUBLIC_RECOMMENDATION_API_URL || "http://localhost:8000";
      void fetch(`${apiBase}/recommendations/invalidate?userId=${userId}`, {
        method: "POST"
      }).catch(() => {});
    }
  } catch (error) {
    // Analytics failures should never block the user experience
    console.error("Analytics log failed (non-blocking):", error);
  }
}
