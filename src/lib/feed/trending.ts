import { Event } from "../types";
import { getSourcePriority } from "./dedupe";

/**
 * Calculates a dynamic, real-time trending score for an event.
 * Combines deadline urgency, source quality, sync recency, bookmark interactions, and future click metrics.
 */
export function calculateTrendingScore(
  event: Event,
  bookmarkCount: number = 0,
  clickCount: number = 0
): number {
  let score = 0;

  // 1. Ingestion Recency Freshness (up to 50 points)
  const lastUpdatedStr = event.lastUpdated;
  if (lastUpdatedStr) {
    try {
      const lastUpdatedTime = new Date(lastUpdatedStr).getTime();
      const hoursSinceSync = (Date.now() - lastUpdatedTime) / (1000 * 60 * 60);
      score += Math.max(0, 48 - hoursSinceSync) * 1.0;
    } catch {
      // Ignore
    }
  }

  // 2. Deadline Urgency (up to 40 points)
  // Urgency peaks for events in the next 10 days
  if (event.date) {
    try {
      const eventTime = new Date(event.date).getTime();
      const daysToEvent = (eventTime - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysToEvent >= 0 && daysToEvent <= 30) {
        score += Math.max(0, 20 - daysToEvent) * 2;
      }
    } catch {
      // Ignore
    }
  }

  // 3. Source Quality (up to 30 points)
  const sourceName = event.source || "";
  const sourcePriority = getSourcePriority(sourceName);
  score += sourcePriority * 3;

  // 4. Bookmark Save Count Popularity (20 points per save)
  score += bookmarkCount * 20;

  // 5. Future Click Interactions Telemetry (5 points per click, future-ready)
  score += clickCount * 5;

  // 6. Category Relevance Boost (up to 20 points)
  if (event.category === "hackathon") {
    score += 20;
  } else if (event.category === "workshop") {
    score += 15;
  } else if (event.category === "startup") {
    score += 10;
  }

  return Math.round(score);
}

/**
 * Computes trending scores across all events, updates isTrending flags for the top 15% scored events,
 * and saves/caches trending scores on the events objects.
 */
export function updateTrendingEvents(
  events: Event[],
  bookmarkCounts: Record<string, number> = {}
): Event[] {
  const scoredEvents = events.map((event) => {
    const bookmarks = bookmarkCounts[event.id] || 0;
    const trendingScore = calculateTrendingScore(event, bookmarks);
    return {
      ...event,
      trendingScore,
    } as Event & { trendingScore: number };
  });

  // Sort by trending score descending
  const sorted = [...scoredEvents].sort((a, b) => b.trendingScore - a.trendingScore);

  // Set top 15% (or minimum top 3) events as trending
  const thresholdIndex = Math.max(3, Math.floor(sorted.length * 0.15));

  return scoredEvents.map((event) => {
    const isTopTrending = sorted.slice(0, thresholdIndex).some((s) => s.id === event.id);
    return {
      ...event,
      isTrending: isTopTrending,
    };
  });
}
