import { chromium } from "playwright";
import { RawScrapedUnstopEvent, normalizeUnstopEvent, cleanupExpiredEvents } from "./normalize";
import { adminDb } from "../firebase-admin";
import { Event } from "../types";

/**
 * Headless browser scraper that crawls live hackathons and coding competitions structurally
 * from https://unstop.com/hackathons, maps them into standard schemas, and saves to Cloud Firestore.
 * Triggers the Expired Events Cleanup sweep post-sync.
 */
export async function syncUnstopEvents({ writeToDb = true }: { writeToDb?: boolean } = {}) {
  console.log("Starting Playwright headless Chromium Unstop scraper...");
  let browser;
  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();

    console.log("Navigating to Unstop hackathons listing...");
    await page.goto("https://unstop.com/hackathons", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait for dynamic Angular layout compiling and API XHR responses to populate
    await page.waitForTimeout(5000);

    // Dynamic scroll evaluation to trigger lazy-load nodes
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(2000);

    console.log("Parsing Unstop card containers structurally...");

    // Scrape loaded card wrappers
    const scrapedList: RawScrapedUnstopEvent[] = await page.evaluate(() => {
      const list: RawScrapedUnstopEvent[] = [];
      const anchors = Array.from(document.querySelectorAll("a"));

      anchors.forEach((a: HTMLAnchorElement) => {
        const href = a.href;
        
        // Match standard relative or absolute paths for competitions, quizzes, and hackathons
        const isCompetition = href.includes("/competitions/") || href.includes("/hackathons/");
        if (!isCompetition) return;

        // Extract title (headings or bold label layers)
        const heading = a.querySelector("h2, h3, h4, h5, [class*='title'], [class*='Heading'], .title");
        const titleText = heading ? heading.textContent?.trim() : "";
        if (!titleText || titleText.length < 3) return;

        // Eliminate double parsing
        if (list.some((item) => item.url === href)) return;

        // Extract image
        const img = a.querySelector("img");
        const bannerImage = img ? img.src : "";

        // Extract tags and badges relative to this link card
        const tags: string[] = [];
        const spans = Array.from(a.querySelectorAll("span, div[class*='badge'], div[class*='chip'], .badge"));
        spans.forEach((span: Element) => {
          const text = span.textContent?.trim() || "";
          if (
            text &&
            text.length > 1 &&
            text.length < 25 &&
            !text.includes("Apply") &&
            !text.includes("Register") &&
            !text.includes("Interested")
          ) {
            tags.push(text);
          }
        });

        // Scan text arrays for dates, locations, organizers, and event categories
        let dateText = "";
        let locationText = "Online";
        let eventType = "Hackathon";
        
        const textLines = a.innerText.split("\n").map((t) => t.trim()).filter(Boolean);
        textLines.forEach((line) => {
          const lower = line.toLowerCase();
          if (lower.includes("online") || lower.includes("virtual")) {
            locationText = "Online";
          } else if (
            lower.match(/^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/) || 
            lower.includes("deadline") || 
            lower.includes("ends") ||
            lower.includes("days left")
          ) {
            dateText = line;
          } else if (lower.includes(",") && line.length < 35) {
            locationText = line;
          }
        });

        // Resolve organizer name
        let organizer = "Unstop Host";
        const orgEl = a.querySelector("[class*='organizer'], [class*='host'], [class*='by']");
        if (orgEl) {
          organizer = orgEl.textContent?.trim() || "Unstop Host";
        } else {
          // Fallback organizer parsing
          const potentialOrg = textLines.find((line) => line.length > 3 && line.length < 40 && !line.includes("Deadline") && !line.includes("Starts"));
          if (potentialOrg) organizer = potentialOrg;
        }

        // Determine event type
        const foundType = tags.find((t) => 
          t.toLowerCase().includes("workshop") || 
          t.toLowerCase().includes("competition") || 
          t.toLowerCase().includes("quiz") || 
          t.toLowerCase().includes("hackathon")
        );
        if (foundType) eventType = foundType;

        list.push({
          title: titleText,
          url: href,
          bannerImage,
          tags: Array.from(new Set(tags)).slice(0, 4),
          organizer,
          dateText,
          locationText,
          eventType,
        });
      });

      return list;
    });

    console.log(`Scraper discovered ${scrapedList.length} Unstop events. Normalizing and syncing...`);

    const syncedEvents: Event[] = [];

    // Use Firestore writeBatch for atomic bulk writes (max 500 per batch)
    const BATCH_SIZE = 500;
    const allNormalized = [];

    for (const raw of scrapedList) {
      try {
        const event = normalizeUnstopEvent(raw);
        allNormalized.push(event);
      } catch (err) {
        failureCount++;
        console.error(`Failed to normalize Unstop event:`, err);
      }
    }

    // Commit in batch chunks
    let cleanupCount = 0;
    if (writeToDb) {
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
        console.log(`Batch committed: ${chunk.length} Unstop events (total: ${successCount})`);
      }
      // Trigger central database expired events pruning sweeper post-sync!
      const cleanupRes = await cleanupExpiredEvents();
      cleanupCount = cleanupRes.count ?? 0;
    } else {
      successCount = allNormalized.length;
      syncedEvents.push(...allNormalized);
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    return {
      success: true,
      count: successCount,
      failureCount,
      cleanupCount,
      duration,
      events: syncedEvents,
    };
  } catch (error: unknown) {
    console.error("Playwright Unstop scraper encountered a terminal error:", error);
    return {
      success: false,
      error: String(error),
      failureCount: 1,
      duration: Math.round((Date.now() - startTime) / 1000),
    };
  } finally {
    if (browser) {
      await browser.close();
      console.log("Playwright browser closed successfully.");
    }
  }
}
