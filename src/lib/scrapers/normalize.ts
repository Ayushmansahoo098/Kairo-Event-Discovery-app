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

export interface RawScrapedMLHEvent {
  title: string;
  url: string;
  startDate?: string;
  endDate?: string;
  image?: string;
  location?: string;
  tags?: string[];
}

export interface RawScrapedGDGEvent {
  title: string;
  url: string;
  bannerImage?: string;
  dateText?: string;
  city?: string;
  locationText?: string;
  description?: string;
  organizer?: string;
  tags?: string[];
}

export interface RawScrapedLumaEvent {
  title: string;
  url: string;
  bannerImage?: string;
  date?: string;
  time?: string;
  location?: string;
  city?: string;
  organizer?: string;
  description?: string;
  tags?: string[];
}

/**
 * Standardizes a date text string (e.g., "Jun 14, 2026", "Jul 04 - 06, 2026") into YYYY-MM-DD.
 * Falls back gracefully to standard current/future date if unparseable.
 */
export function normalizeDate(dateText?: string): string {
  const currentYear = new Date().getFullYear();
  if (!dateText) {
    return new Date().toISOString().split("T")[0];
  }
  
  try {
    // 1. Clean the string: remove time patterns
    let cleaned = dateText.replace(/\s+/g, " ");
    cleaned = cleaned.replace(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm|ist|utc)?/gi, "");
    cleaned = cleaned.replace(/\b\d{1,2}\s*(?:am|pm)\b/gi, "");
    
    // Remove prefixes
    cleaned = cleaned.replace(/(starts\s+on|ends\s+on|deadline|register\s+by|ends\s+in|days\s+left):?/gi, "").trim();

    const months: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
    };

    const formatResult = (mStr: string, dStr: string, yStr?: string) => {
      const month = months[mStr.toLowerCase().substring(0, 3)];
      if (!month) return null;
      
      const day = dStr.padStart(2, "0");
      
      let year = currentYear;
      if (yStr) {
        const parsedYear = parseInt(yStr, 10);
        if (yStr.length === 2) {
          year = 2000 + parsedYear;
        } else if (yStr.length === 4) {
          year = parsedYear;
        }
      }
      return `${year}-${month}-${day}`;
    };

    // Swap order: Try Day-First Match first!
    // E.g. "15 Jun 26", "20 Jun 2026", "15 Jun"
    const dayFirstMatch = cleaned.match(/\b(\d{1,2})\s+([a-zA-Z]{3,})(?:\s*,?\s*\b(\d{2,4})\b)?/i);
    if (dayFirstMatch) {
      const [, dStr, mStr, yStr] = dayFirstMatch;
      const res = formatResult(mStr, dStr, yStr);
      if (res) return res;
    }

    // Try Month-First Match second: e.g. "Jun 14, 2026", "Jun 14", "Nov 12 - 14"
    const monthFirstMatch = cleaned.match(/\b([a-zA-Z]{3,})\s+(\d{1,2})(?:\s*-\s*\d{1,2})?(?:\s*,?\s*\b(\d{2,4})\b)?/i);
    if (monthFirstMatch) {
      const [, mStr, dStr, yStr] = monthFirstMatch;
      const res = formatResult(mStr, dStr, yStr);
      if (res) return res;
    }

    // 4. Relative dates (e.g. "ends in 5 days")
    const relativeDaysMatch = dateText.match(/\b(\d+)\s+days?\b/i);
    if (relativeDaysMatch) {
      const days = parseInt(relativeDaysMatch[1], 10);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      return targetDate.toISOString().split("T")[0];
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
 * Maps a raw scraped MLH hackathon into Kairo Event Schema.
 */
export function normalizeMLHEvent(raw: RawScrapedMLHEvent): Event & { lastUpdated: string; source: string; expiresAt: string } {
  let slug = raw.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (raw.url) {
    try {
      const urlObj = new URL(raw.url);
      const paths = urlObj.pathname.split("/").filter(Boolean);
      if (paths.length > 0) {
        slug = paths[paths.length - 1];
      }
    } catch {
      // Ignore
    }
  }

  const id = `mlh-${slug}`;
  const isOnline = !raw.location || 
                   raw.location.toLowerCase().includes("online") || 
                   raw.location.toLowerCase().includes("digital") || 
                   raw.location.toLowerCase().includes("virtual");

  const city = isOnline ? "Online" : (raw.location?.split(",")[0].trim() || "Worldwide");
  const date = raw.startDate ? raw.startDate.split("T")[0] : new Date().toISOString().split("T")[0];
  const expiresAt = raw.endDate ? raw.endDate.split("T")[0] : date;

  return {
    id,
    title: raw.title.trim(),
    description: `Participate in ${raw.title.trim()}! A premier hackathon from Major League Hacking (MLH). Expand your skills, collaborate with other builders, and create cool projects.`,
    bannerImage: getCategoryBanner("hackathon", raw.image),
    date,
    time: "09:00 AM",
    location: raw.location?.trim() || "Online Event",
    city,
    isOnline,
    category: "hackathon" as Category,
    organizer: "Major League Hacking",
    registrationUrl: raw.url,
    tags: raw.tags && raw.tags.length > 0 
      ? raw.tags.map((t) => t.trim().toLowerCase()) 
      : ["mlh", "hackathon", "builder", "coding"],
    isTrending: false,
    source: "MLH",
    expiresAt,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Maps a raw scraped GDG event into Kairo Event Schema.
 */
export function normalizeGDGEvent(raw: RawScrapedGDGEvent): Event & { lastUpdated: string; source: string; expiresAt: string } {
  let slug = raw.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (raw.url) {
    try {
      const urlObj = new URL(raw.url);
      const paths = urlObj.pathname.split("/").filter(Boolean);
      if (paths.length > 0) {
        slug = paths[paths.length - 1];
      }
    } catch {
      // Ignore
    }
  }

  const id = `gdg-${slug}`;
  const isOnline = !raw.locationText || 
                   raw.locationText.toLowerCase().includes("online") || 
                   raw.locationText.toLowerCase().includes("virtual");

  const city = isOnline ? "Online" : (raw.city || raw.locationText?.split(",")[0].trim() || "Bangalore");
  
  let category: Category = "meetup";
  const titleLower = raw.title.toLowerCase();
  if (titleLower.includes("workshop") || titleLower.includes("bootcamp") || titleLower.includes("hands-on")) {
    category = "workshop";
  } else if (titleLower.includes("conference") || titleLower.includes("summit") || titleLower.includes("io extended")) {
    category = "workshop";
  }

  const date = normalizeDate(raw.dateText);

  return {
    id,
    title: raw.title.trim(),
    description: raw.description?.trim() || `Join the Google Developer Group community for ${raw.title.trim()}! Connect with fellow developers, learn about new technologies, and share your experiences.`,
    bannerImage: getCategoryBanner(category, raw.bannerImage),
    date,
    time: "10:00 AM",
    location: raw.locationText?.trim() || "Online Event",
    city,
    isOnline,
    category,
    organizer: raw.organizer?.trim() || "Google Developer Groups",
    registrationUrl: raw.url,
    tags: raw.tags && raw.tags.length > 0 
      ? raw.tags.map((t) => t.trim().toLowerCase()) 
      : ["gdg", "google", "developer", "meetup", "tech"],
    isTrending: false,
    source: "GDG",
    expiresAt: date,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Maps a raw scraped Luma event into Kairo Event Schema.
 */
export function normalizeLumaEvent(raw: RawScrapedLumaEvent): Event & { lastUpdated: string; source: string; expiresAt: string } {
  let slug = raw.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (raw.url) {
    try {
      const urlObj = new URL(raw.url);
      const paths = urlObj.pathname.split("/").filter(Boolean);
      if (paths.length > 0) {
        slug = paths[paths.length - 1];
      }
    } catch {
      // Ignore
    }
  }

  const id = `luma-${slug}`;
  const isOnline = !raw.location || 
                   raw.location.toLowerCase().includes("online") || 
                   raw.location.toLowerCase().includes("virtual");

  const city = isOnline ? "Online" : (raw.city || raw.location?.split(",")[0].trim() || "Bangalore");

  let category: Category = "meetup";
  const titleLower = raw.title.toLowerCase();
  const descLower = (raw.description || "").toLowerCase();
  
  if (titleLower.includes("hackathon") || descLower.includes("hackathon")) {
    category = "hackathon";
  } else if (titleLower.includes("workshop") || titleLower.includes("bootcamp") || descLower.includes("workshop")) {
    category = "workshop";
  } else if (titleLower.includes("startup") || titleLower.includes("pitch") || titleLower.includes("founder") || descLower.includes("startup") || descLower.includes("founder")) {
    category = "startup";
  } else if (titleLower.includes("conference") || titleLower.includes("summit")) {
    category = "workshop";
  }

  const date = raw.date ? raw.date.split("T")[0] : new Date().toISOString().split("T")[0];

  return {
    id,
    title: raw.title.trim(),
    description: raw.description?.trim() || `Join us for "${raw.title.trim()}" hosted on Luma! Network with tech professionals, engage in learning opportunities, and build community connections.`,
    bannerImage: getCategoryBanner(category, raw.bannerImage),
    date,
    time: raw.time || "06:30 PM",
    location: raw.location?.trim() || "Online Event",
    city,
    isOnline,
    category,
    organizer: raw.organizer?.trim() || "Luma Organizer",
    registrationUrl: raw.url,
    tags: raw.tags && raw.tags.length > 0 
      ? raw.tags.map((t) => t.trim().toLowerCase()) 
      : ["luma", "meetup", "tech", "networking"],
    isTrending: false,
    source: "Luma",
    expiresAt: date,
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
    const nowStr = new Date().toISOString();
    
    // Prune cutoff: 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    const querySnapshot = await adminDb.collection("events").get();
    let expireCount = 0;
    let pruneCount = 0;

    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const eventDate = data.date; // YYYY-MM-DD
      const expiresAt = data.expiresAt; // YYYY-MM-DD
      const status = data.status || "active";
      const expiredAt = data.expiredAt;

      const targetDate = expiresAt || eventDate;

      if (status === "active" && targetDate && targetDate < todayStr) {
        // Soft expire
        await docSnapshot.ref.update({
          status: "expired",
          expiredAt: nowStr,
          lastUpdated: nowStr
        });
        expireCount++;
        console.log(`Soft expired event: "${data.title}" (${docSnapshot.id})`);
      } else if (status === "expired") {
        // Hard prune if expired for more than 30 days
        const compareTime = expiredAt || data.lastUpdated || nowStr;
        if (compareTime < thirtyDaysAgoStr) {
          await docSnapshot.ref.delete();
          pruneCount++;
          console.log(`Hard pruned event older than 30 days: "${data.title}" (${docSnapshot.id})`);
        }
      }
    }

    console.log(`Sweep finished: Soft-expired ${expireCount} events, Hard-pruned ${pruneCount} events.`);
    return { success: true, count: expireCount + pruneCount, expiredCount: expireCount, prunedCount: pruneCount };
  } catch (error) {
    console.error("Expired events cleanup encountered an error:", error);
    return { success: false, error: String(error) };
  }
}
