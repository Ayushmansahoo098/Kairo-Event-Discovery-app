import { Event } from "../types";
import { getSourcePriority } from "./dedupe";

/**
 * Calculates a dynamic relevance score for an event.
 * Higher score = higher ranking on the discovery feed.
 */
export function calculateEventScore(event: Event): number {
  let score = 0;

  // 1. Source Quality Score (up to 100 points)
  const sourceName = (event as any).source || "";
  const sourcePriority = getSourcePriority(sourceName);
  score += sourcePriority * 10;

  // 2. Freshness Score (up to 72 points)
  // Events scraped/updated very recently are given a boost
  const lastUpdatedStr = (event as any).lastUpdated;
  if (lastUpdatedStr) {
    try {
      const lastUpdatedTime = new Date(lastUpdatedStr).getTime();
      const hoursSinceSync = (Date.now() - lastUpdatedTime) / (1000 * 60 * 60);
      // Boost decays over 48 hours
      score += Math.max(0, 48 - hoursSinceSync) * 1.5;
    } catch {
      // Fallback if date is invalid
    }
  }

  // 3. Registration Deadline / Event Date Urgency (up to 60 points)
  // Upcoming events in the immediate future get scored higher to convey urgency.
  if (event.date) {
    try {
      const eventTime = new Date(event.date).getTime();
      const daysToEvent = (eventTime - Date.now()) / (1000 * 60 * 60 * 24);
      
      if (daysToEvent >= 0) {
        // Events in the next 30 days get higher urgency ranking
        score += Math.max(0, 30 - daysToEvent) * 2;
      }
    } catch {
      // Ignore
    }
  }

  // 4. Trending Score (50 points boost)
  if (event.isTrending || (event as any).trendingScore > 0) {
    score += 50;
  }

  // 5. Category Relevance (up to 30 points)
  // Focus priority on "Nerd Mode" core categories: hackathons & workshops
  if (event.category === "hackathon") {
    score += 30;
  } else if (event.category === "workshop") {
    score += 20;
  } else if (event.category === "startup") {
    score += 15;
  } else {
    score += 5;
  }

  return Math.round(score);
}

/**
 * Ranks an array of events based on their dynamically calculated scores in descending order.
 */
export function rankEvents(events: Event[]): Event[] {
  const scoredEvents = events.map((event) => {
    const score = calculateEventScore(event);
    return {
      ...event,
      _score: score, // inject temporary score for debugging or visual display
    };
  });

  return scoredEvents.sort((a, b) => b._score - a._score);
}
