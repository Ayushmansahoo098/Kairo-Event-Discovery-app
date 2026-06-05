import { Category, Event } from "../../lib/types";
import { adminDb } from "../firebase-admin";


export interface RawScrapedHackathon {
  title: string;
  url: string;
  bannerImage?: string;
  tags?: string[];
  organizer?: string;
  dateText?: string; // e.g. "Jun 14, 2026", "Dec 05 - 07, 2026"
  locationText?: string; // e.g. "Online", "Mumbai, India", "Bangalore"
}

export interface RawScrapedUnstopEvent {
  title: string;
  url: string;
  bannerImage?: string;
  organizer?: string;
  locationText?: string;
  eventType?: string;
  tags?: string[];
  dateText?: string; // registration deadline/date
}

export interface RawScrapedHackerEarthEvent {
  title: string;
  url: string;
  bannerImage?: string;
  organizer?: string;
  locationText?: string;
  eventType?: string;
  tags?: string[];
  dateText?: string; // deadline/date string
}

/**
 * Standardizes a date text string (e.g., "Jun 14, 2026", "Jul 04 - 06, 2026") into YYYY-MM-DD.
 * Falls back gracefully to standard current/future date if unparseable.
 */
export function normalizeDate(dateText?: string): string {
  if (!dateText) {
    return new Date().toISOString().split("T")[0];
  }
  try {
    const cleaned = dateText.replace(/\s+/g, " ").trim();
    // E.g. "Jun 14, 2026" or "Jun 14 - 16, 2026"
    // Extract month and year, and use first day for ranges
    const match = cleaned.match(/([a-zA-Z]+)\s+(\d+)(?:\s*-\s*\d+)?,\s*(\d{4})/);
    if (match) {
      const [, monthStr, dayStr, yearStr] = match;
      const months: Record<string, string> = {
        jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
        jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
      };
      const month = months[monthStr.toLowerCase().substring(0, 3)] || "06";
      const day = dayStr.padStart(2, "0");
      return `${yearStr}-${month}-${day}`;
    }
  } catch (err) {
    console.error("Failed to parse scraper date text:", dateText, err);
  }
  return new Date().toISOString().split("T")[0];
}

/**
 * Standardizes event banners to guarantee active high-relevance fallbacks.
 */
export function getCategoryBanner(category: string, image?: string): string {
  if (image && image.startsWith("http")) return image;
  if (category === "startup") return "/images/startup.png";
  if (category === "workshop") return "/images/workshop.png";
  if (category === "meetup") return "/images/meetup.png";
  return "/images/hackathon.png";
}

/**
 * Maps a raw scraped Devfolio hackathon into the strict Kairo Event database schema.
 */
export function normalizeHackathon(raw: RawScrapedHackathon): Event & { lastUpdated: string; source: string } {
  let slug = raw.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (raw.url) {
    try {
      const urlObj = new URL(raw.url);
      if (urlObj.hostname.includes("devfolio.co")) {
        const paths = urlObj.pathname.split("/").filter(Boolean);
        if (paths.length > 0) {
          slug = paths[paths.length - 1];
        }
      } else {
        slug = urlObj.hostname.split(".")[0];
      }
    } catch {
      // Ignore
    }
  }
  
  const id = `devfolio-${slug}`;
  const isOnline = !raw.locationText || 
                   raw.locationText.toLowerCase().includes("online") || 
                   raw.locationText.toLowerCase().includes("virtual");
                   
  const city = isOnline ? "Online" : (raw.locationText?.split(",")[0].trim() || "Bangalore");

  return {
    id,
    title: raw.title.trim(),
    description: `Join ${raw.title.trim()} on Devfolio! This premier hackathon runs ${raw.dateText || "upcoming weeks"} as a live ${isOnline ? "virtual" : "in-person"} tech challenge. Build, collaborate, and compete with developer cohorts.`,
    bannerImage: getCategoryBanner("hackathon", raw.bannerImage),
    date: normalizeDate(raw.dateText),
    time: "09:00 AM",
    location: raw.locationText?.trim() || "Online Event",
    city,
    isOnline,
    category: "hackathon" as Category,
    organizer: raw.organizer?.trim() || "Devfolio Community",
    registrationUrl: raw.url,
    tags: raw.tags && raw.tags.length > 0 
      ? raw.tags.map((t) => t.trim().toLowerCase()) 
      : ["hackathon", "builder", "nerd-mode"],
    isTrending: false,
    source: "Devfolio",
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Maps a raw scraped Unstop competition into Kairo Event Schema.
 */
export function normalizeUnstopEvent(raw: RawScrapedUnstopEvent): Event & { lastUpdated: string; source: string; sourceId: string; expiresAt: string } {
  let slug = raw.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  let sourceId = "unstop-generic";
  if (raw.url) {
    try {
      const urlObj = new URL(raw.url);
      const paths = urlObj.pathname.split("/").filter(Boolean);
      if (paths.length > 0) {
        slug = paths[paths.length - 1];
        sourceId = slug;
      }
    } catch {
      // Ignore
    }
  }

  const id = `unstop-${slug}`;
  const isOnline = !raw.locationText || 
                   raw.locationText.toLowerCase().includes("online") || 
                   raw.locationText.toLowerCase().includes("virtual");

  const city = isOnline ? "Online" : (raw.locationText?.split(",")[0].trim() || "Delhi");
  
  // Parse eventType categories dynamically
  let category: Category = "hackathon";
  const typeStr = (raw.eventType || "").toLowerCase();
  if (typeStr.includes("workshop")) {
    category = "workshop";
  } else if (typeStr.includes("startup") || typeStr.includes("pitch")) {
    category = "startup";
  } else if (typeStr.includes("conference") || typeStr.includes("seminar")) {
    category = "workshop";
  }

  const expiresAt = normalizeDate(raw.dateText);

  return {
    id,
    sourceId,
    title: raw.title.trim(),
    description: `Participate in ${raw.title.trim()} hosted on Unstop! Category: ${raw.eventType || "Competition"}. Challenge your skills, team up with peers, and win rewards.`,
    bannerImage: getCategoryBanner(category, raw.bannerImage),
    date: expiresAt, // Default event display date to registration deadline
    time: "09:00 AM",
    location: raw.locationText?.trim() || "Online Event",
    city,
    isOnline,
    category,
    organizer: raw.organizer?.trim() || "Unstop Host",
    registrationUrl: raw.url,
    tags: raw.tags && raw.tags.length > 0 
      ? raw.tags.map((t) => t.trim().toLowerCase()) 
      : ["unstop", "competition", "nerd-mode", typeStr || "challenge"],
    isTrending: false,
    source: "Unstop",
    expiresAt,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Maps a raw scraped HackerEarth challenge into Kairo Event Schema.
 */
export function normalizeHackerEarthEvent(raw: RawScrapedHackerEarthEvent): Event & { 
  lastUpdated: string; 
  source: string; 
  sourceId: string; 
  expiresAt: string;
  isExpired: boolean;
  image: string;
} {
  let slug = raw.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  let sourceId = "hackerearth-generic";
  if (raw.url) {
    try {
      const urlObj = new URL(raw.url);
      const paths = urlObj.pathname.split("/").filter(Boolean);
      if (paths.length > 0) {
        slug = paths[paths.length - 1];
        sourceId = slug;
      }
    } catch {
      // Ignore
    }
  }

  const id = `hackerearth-${slug}`;
  const isOnline = !raw.locationText || 
                   raw.locationText.toLowerCase().includes("online") || 
                   raw.locationText.toLowerCase().includes("virtual");

  const city = isOnline ? "Online" : (raw.locationText?.split(",")[0].trim() || "Bangalore");
  
  let category: Category = "hackathon";
  const typeStr = (raw.eventType || "").toLowerCase();
  if (typeStr.includes("workshop") || typeStr.includes("webinar") || typeStr.includes("seminar")) {
    category = "workshop";
  } else if (typeStr.includes("startup") || typeStr.includes("pitch") || typeStr.includes("entrepreneurship")) {
    category = "startup";
  } else if (typeStr.includes("hiring") || typeStr.includes("job") || typeStr.includes("placement")) {
    category = "startup";
  } else if (typeStr.includes("meetup")) {
    category = "meetup";
  }

  const expiresAt = normalizeDate(raw.dateText);
  const bannerImage = getCategoryBanner(category, raw.bannerImage);

  return {
    id,
    sourceId,
    title: raw.title.trim(),
    description: `Participate in ${raw.title.trim()} hosted on HackerEarth! Category: ${raw.eventType || "Challenge"}. Elevate your coding capabilities, network with peers, and showcase your solutions.`,
    bannerImage,
    image: bannerImage,
    date: expiresAt,
    time: "09:00 AM",
    location: raw.locationText?.trim() || "Online Event",
    city,
    isOnline,
    category,
    organizer: raw.organizer?.trim() || "HackerEarth Partner",
    registrationUrl: raw.url,
    tags: raw.tags && raw.tags.length > 0 
      ? raw.tags.map((t) => t.trim().toLowerCase()) 
      : ["hackerearth", "challenge", "nerd-mode", typeStr || "hackathon"],
    isTrending: false,
    source: "HackerEarth",
    expiresAt,
    isExpired: false,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Sweeps the entire Firestore 'events' collection and deletes documents whose 
 * event date or registration deadline has passed.
 */
export async function cleanupExpiredEvents() {
  console.log("Sweep: Cleaning up expired events from Firestore database...");
  try {
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const querySnapshot = await adminDb.collection("events").get();
    let deleteCount = 0;

    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const eventDate = data.date; // YYYY-MM-DD
      const expiresAt = data.expiresAt; // YYYY-MM-DD
      
      const targetDate = expiresAt || eventDate;
      if (targetDate && targetDate < todayStr) {
        await docSnapshot.ref.delete();
        deleteCount++;
        console.log(`Pruned expired event: "${data.title}" (${docSnapshot.id})`);
      }
    }

    console.log("Sweep finished: Removed " + deleteCount + " expired events.");
    return { success: true, count: deleteCount };
  } catch (error) {
    console.error("Expired events cleanup encountered an error:", error);
    return { success: false, error: String(error) };
  }
}
