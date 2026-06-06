import { chromium } from "playwright";
import { adminDb } from "../firebase-admin";
import { Event, Category } from "../types";
import { getCategoryBanner, normalizeDate } from "./normalize";

export interface RawScrapedMeetupEvent {
  title: string;
  url: string;
  bannerImage?: string;
  organizer?: string;
  locationText?: string;
  dateText?: string;
  description?: string;
}

function cleanMeetupDateText(dateText?: string): string {
  if (!dateText) return "";
  try {
    // Meetup formats typically look like:
    // "SAT, JUN 14 · 10:00 AM IST"
    // "Mon, Jun 15, 6:30 PM"
    // "Wednesday, June 17, 2026"
    const cleanedParts = dateText.split("·")[0].split("@")[0].split(",").map(s => s.trim()).filter(Boolean);
    
    // Filter out day of week and times
    let parts = cleanedParts.filter(part => {
      const p = part.toLowerCase();
      return !["mon", "tue", "wed", "thu", "fri", "sat", "sun", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].includes(p) &&
             !p.includes(":") && !p.includes("pm") && !p.includes("am");
    });
    
    if (parts.length === 0 && cleanedParts.length > 0) {
      parts = cleanedParts;
    }
    
    let datePart = parts[0] || "";
    // If it doesn't contain a year (like "JUN 14" or "June 15"), append current year
    if (datePart && !datePart.match(/\d{4}/)) {
      datePart = `${datePart}, 2026`;
    }
    return datePart;
  } catch {
    return dateText;
  }
}

export function normalizeMeetupEvent(raw: RawScrapedMeetupEvent): Event & { lastUpdated: string; source: string } {
  let slug = raw.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (raw.url) {
    try {
      const urlObj = new URL(raw.url);
      const paths = urlObj.pathname.split("/").filter(Boolean);
      if (paths.length >= 3 && paths[paths.length - 2] === "events") {
        slug = `${paths[paths.length - 3]}-${paths[paths.length - 1]}`;
      } else if (paths.length > 0) {
        slug = paths[paths.length - 1];
      }
    } catch {
      // Ignore
    }
  }

  const id = `meetup-${slug}`;
  const isOnline = !raw.locationText || 
                   raw.locationText.toLowerCase().includes("online") || 
                   raw.locationText.toLowerCase().includes("virtual");

  const city = isOnline ? "Online" : (raw.locationText?.split(",")[0].trim() || "Bangalore");
  
  let category: Category = "meetup";
  const titleLower = raw.title.toLowerCase();
  const descLower = (raw.description || "").toLowerCase();
  if (
    titleLower.includes("startup") || 
    titleLower.includes("pitch") || 
    titleLower.includes("founder") ||
    titleLower.includes("vc") ||
    descLower.includes("startup") ||
    descLower.includes("pitch")
  ) {
    category = "startup";
  } else if (titleLower.includes("workshop") || titleLower.includes("bootcamp") || titleLower.includes("learn") || titleLower.includes("class")) {
    category = "workshop";
  } else if (titleLower.includes("hackathon")) {
    category = "hackathon";
  }

  const cleanedDate = cleanMeetupDateText(raw.dateText);
  const date = normalizeDate(cleanedDate);

  return {
    id,
    title: raw.title.trim(),
    description: raw.description?.trim() || `Join the tech community for "${raw.title.trim()}"! Network with developers, share ideas, and learn about the latest industry trends. Hosted by ${raw.organizer || "Meetup Organizer"}.`,
    bannerImage: getCategoryBanner(category, raw.bannerImage),
    date,
    time: "06:30 PM", // Default evening meetup time
    location: raw.locationText?.trim() || "Online Event",
    city,
    isOnline,
    category,
    organizer: raw.organizer?.trim() || "Meetup Community Group",
    registrationUrl: raw.url,
    tags: ["meetup", "community", category, "networking"],
    isTrending: false,
    source: "Meetup",
    expiresAt: date,
    lastUpdated: new Date().toISOString(),
  };
}

export async function syncMeetupEvents({ writeToDb = true }: { writeToDb?: boolean } = {}) {
  console.log("Starting Playwright headless Chromium Meetup scraper...");
  let browser;
  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;
  const syncedEvents: Event[] = [];

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();

    console.log("Navigating to Meetup tech search directory...");
    await page.goto("https://www.meetup.com/find/?source=EVENTS&keywords=tech", {
      waitUntil: "networkidle",
      timeout: 45000,
    });

    await page.waitForTimeout(5000);

    // Scroll to lazy load
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 3);
    });
    await page.waitForTimeout(2000);

    console.log("Parsing Meetup cards structurally...");
    const scrapedList: RawScrapedMeetupEvent[] = await page.evaluate(() => {
      const list: RawScrapedMeetupEvent[] = [];
      const anchors = Array.from(document.querySelectorAll("a"));

      anchors.forEach((a: HTMLAnchorElement) => {
        const href = a.href;
        if (!href) return;

        const isEventLink = href.includes("/events/") || href.includes("/event/");
        if (!isEventLink) return;

        if (list.some((item) => item.url === href)) return;

        const titleEl = a.querySelector("h2, h3, h4, h5, [class*='title'], [data-testid='event-title']");
        const titleText = titleEl ? titleEl.textContent?.trim() : "";
        if (!titleText || titleText.length < 3) return;

        const img = a.querySelector("img");
        const bannerImage = img ? img.src : "";

        const textLines = a.innerText.split("\n").map((t) => t.trim()).filter(Boolean);
        
        let dateText = "";
        let locationText = "Online";
        let organizer = "Meetup Group";

        textLines.forEach((line) => {
          const lower = line.toLowerCase();
          if (lower.includes("online") || lower.includes("virtual")) {
            locationText = "Online";
          } else if (lower.includes("group") || lower.includes("hosted by") || lower.includes("by ")) {
            organizer = line.replace(/hosted by|by /gi, "").trim();
          } else if (
            lower.match(/^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|mon|tue|wed|thu|fri|sat|sun)/) ||
            lower.includes("today") ||
            lower.includes("tomorrow")
          ) {
            dateText = line;
          } else if (lower.includes(",") && line.length < 40) {
            locationText = line;
          }
        });

        const groupEl = a.querySelector("[class*='group'], [class*='host']");
        if (groupEl) {
          organizer = groupEl.textContent?.trim() || organizer;
        }

        list.push({
          title: titleText,
          url: href,
          bannerImage,
          organizer,
          dateText,
          locationText,
        });
      });

      return list;
    });

    console.log(`Scraper discovered ${scrapedList.length} Meetup events. Normalizing...`);

    const allNormalized: Event[] = [];
    for (const raw of scrapedList.slice(0, 10)) {
      try {
        const event = normalizeMeetupEvent(raw);
        allNormalized.push(event);
      } catch (err) {
        failureCount++;
        console.error(`Failed to normalize Meetup event:`, err);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    if (writeToDb && allNormalized.length > 0) {
      const BATCH_SIZE = 500;
      for (let i = 0; i < allNormalized.length; i += BATCH_SIZE) {
        const chunk = allNormalized.slice(i, i + BATCH_SIZE);
        const batch = adminDb.batch();
        for (const event of chunk) {
          const docRef = adminDb.collection("events").doc(event.id);
          batch.set(docRef, event);
        }
        await batch.commit();
        successCount += chunk.length;
        syncedEvents.push(...chunk);
        console.log(`Batch committed: ${chunk.length} Meetup events (total: ${successCount})`);
      }

      // Telemetry log to 'scrape_logs'
      try {
        await adminDb.collection("scrape_logs").add({
          source: "Meetup",
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
          successCount,
          failureCount,
          cleanupCount: 0,
          duration,
          status: "success",
        });
      } catch (logErr) {
        console.error("Telemetry failed to write for Meetup:", logErr);
      }
    } else {
      successCount = allNormalized.length;
      syncedEvents.push(...allNormalized);
    }

    return {
      success: true,
      count: successCount,
      failureCount,
      duration,
      events: syncedEvents,
    };
  } catch (error: unknown) {
    console.error("Meetup sync crashed:", error);
    const duration = Math.round((Date.now() - startTime) / 1000);
    if (writeToDb) {
      try {
        await adminDb.collection("scrape_logs").add({
          source: "Meetup",
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
          successCount: 0,
          failureCount: 1,
          cleanupCount: 0,
          duration,
          status: "failed",
          error: String(error),
        });
      } catch (logErr) {
        console.error("Telemetry log write failed for Meetup crash:", logErr);
      }
    }

    return {
      success: false,
      error: String(error),
      failureCount: 1,
      duration,
    };
  } finally {
    if (browser) {
      await browser.close();
      console.log("Playwright Meetup browser closed safely.");
    }
  }
}
