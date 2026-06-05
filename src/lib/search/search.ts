import { Event } from "../types";

export interface SearchFilters {
  category?: string | null;
  city?: string | null;
  isOnline?: boolean | null;
  source?: string | null;
  tag?: string | null;
}

/**
 * Executes fuzzy search queries and dimension-based filter reductions over a list of events.
 * Performs search matches across title, organizer, tags, description, and categories.
 */
export function searchEvents(
  query: string,
  filters: SearchFilters,
  events: Event[]
): Event[] {
  let result = events;

  // 1. Category Filter
  if (filters.category) {
    result = result.filter((e) => e.category === filters.category);
  }

  // 2. City Filter
  if (filters.city) {
    result = result.filter(
      (e) => e.city.toLowerCase() === filters.city!.toLowerCase()
    );
  }

  // 3. Online / Offline Filter
  if (filters.isOnline !== undefined && filters.isOnline !== null) {
    result = result.filter((e) => e.isOnline === filters.isOnline);
  }

  // 4. Source Filter (Devfolio, Unstop, HackerEarth, Eventbrite)
  if (filters.source) {
    result = result.filter((e) => {
      const src = e.source || "";
      return src.toLowerCase() === filters.source!.toLowerCase();
    });
  }

  // 5. Specific Tag Filter
  if (filters.tag) {
    result = result.filter((e) =>
      e.tags.some((t) => t.toLowerCase() === filters.tag!.toLowerCase())
    );
  }

  // 6. Fuzzy Text Query
  if (query.trim()) {
    const q = query.toLowerCase().trim();
    result = result.filter((e) => {
      const titleMatch = e.title.toLowerCase().includes(q);
      const descMatch = e.description.toLowerCase().includes(q);
      const organizerMatch = e.organizer.toLowerCase().includes(q);
      const categoryMatch = e.category.toLowerCase().includes(q);
      const cityMatch = e.city.toLowerCase().includes(q);
      const tagsMatch = e.tags.some((t) => t.toLowerCase().includes(q));

      return (
        titleMatch ||
        descMatch ||
        organizerMatch ||
        categoryMatch ||
        cityMatch ||
        tagsMatch
      );
    });
  }

  return result;
}
