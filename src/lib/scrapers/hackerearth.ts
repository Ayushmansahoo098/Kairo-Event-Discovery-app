import { chromium } from "playwright";
import { RawScrapedHackerEarthEvent, normalizeHackerEarthEvent, cleanupExpiredEvents } from "./normalize";
import { adminDb } from "../firebase-admin";

/**
 * Headless browser scraper that crawls live hackathons, competitive programming, and hiring challenges
 * from https://www.hackerearth.com/challenges/, maps them to Kairo Event schemas, and saves to Firestore.
 * Triggers the Expired Events Cleanup sweeper and writes telemetry logs to the 'scrape_logs' collection.
 */
export async function syncHackerEarthEvents() {
  console.log("Starting Playwright headless Chromium HackerEarth scraper...");
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
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();

    console.log("Navigating to HackerEarth challenges listing...");
    await page.goto("https://www.hackerearth.com/challenges/", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait for challenge blocks to populate
    await page.waitForTimeout(5000);

    // Scroll to lazy-load more challenges
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(2000);

    console.log("Parsing HackerEarth challenge cards structurally...");

    // Extract raw events from elements
    const scrapedList: RawScrapedHackerEarthEvent[] = await page.evaluate(() => {
      const list: any[] = [];
      const anchors = Array.from(document.querySelectorAll("a"));

      anchors.forEach((a: HTMLAnchorElement) => {
        const href = a.href;
        if (!href) return;

        // Ensure we target valid challenges subpaths
        const isChallenge = href.includes("/challenges/") || href.includes("/challenge/");
        if (!isChallenge) return;

        // Strip landing pages, dashboards, and indexes
        const urlParts = href.split("/").filter(Boolean);
        if (urlParts.length < 5) return; // e.g. ["https:", "www.hackerearth.com", "challenges"] is too short

        // Eliminate double parsing
        if (list.some((item) => item.url === href)) return;

        // Extract Title
        const titleEl = a.querySelector(".challenge-name, .challenge-list-title, h1, h2, h3, h4, h5, [class*='title']");
        const titleText = titleEl ? titleEl.textContent?.trim() : "";
        if (!titleText || titleText.length < 3) return;

        // Extract Banner image
        const img = a.querySelector("img");
        const bannerImage = img ? img.src : "";

        // Collect tags and badges inside the card
        const tags: string[] = [];
        const spans = Array.from(a.querySelectorAll("span, div[class*='badge'], div[class*='chip'], .challenge-type, .challenge-status"));
        spans.forEach((span: any) => {
          const text = span.textContent?.trim() || "";
          if (
            text &&
            text.length > 1 &&
            text.length < 25 &&
            !text.includes("Apply") &&
            !text.includes("Register")
          ) {
            tags.push(text);
          }
        });

        // Scan text blocks for dates and organizers
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
            lower.includes("ends on") || 
            lower.includes("deadline") ||
            lower.includes("starts on")
          ) {
            dateText = line.replace(/Ends on|Starts on/gi, "").trim();
          } else if (lower.includes(",") && line.length < 35) {
            locationText = line;
          }
        });

        // Resolve challenge type based on URL path
        if (href.includes("/hiring/")) {
          eventType = "Hiring Challenge";
        } else if (href.includes("/competitive/")) {
          eventType = "Competitive Programming";
        } else if (href.includes("/hackathon/")) {
          eventType = "Hackathon";
        }

        // Search for potential sponsor/organizer label
        let organizer = "HackerEarth Partner";
        const orgEl = a.querySelector("[class*='company'], [class*='organizer'], [class*='sponsor']");
        if (orgEl) {
          organizer = orgEl.textContent?.trim() || "HackerEarth Partner";
        } else {
          // Parse potential organization text lines
          const potentialOrg = textLines.find((line) => 
            line.length > 3 && 
            line.length < 30 && 
            !line.toLowerCase().includes("ends") && 
            !line.toLowerCase().includes("starts") &&
            !line.toLowerCase().includes("challenges")
          );
          if (potentialOrg) organizer = potentialOrg;
        }

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

    console.log(`Scraper discovered ${scrapedList.length} HackerEarth events. Normalizing and syncing...`);

    const syncedEvents: any[] = [];

    // Use Firestore writeBatch for atomic bulk writes (max 500 per batch)
    const BATCH_SIZE = 500;
    const allNormalized = [];

    for (const raw of scrapedList) {
      try {
        const event = normalizeHackerEarthEvent(raw);
        allNormalized.push(event);
      } catch (err) {
        failureCount++;
        console.error(`Failed to normalize HackerEarth event:`, err);
      }
    }

    // Commit in batch chunks
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
      console.log(`Batch committed: ${chunk.length} HackerEarth events (total: ${successCount})`);
    }

    // Trigger cleanup sweeper post-sync
    const cleanupRes = await cleanupExpiredEvents();
    const duration = Math.round((Date.now() - startTime) / 1000);
    const cleanupCount = cleanupRes.success ? cleanupRes.count : 0;

    // Observability Logging
    try {
      await adminDb.collection("scrape_logs").add({
        source: "HackerEarth",
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        successCount,
        failureCount,
        cleanupCount,
        duration,
        status: successCount > 0 ? "success" : "failed",
      });
      console.log("Scrape telemetry log recorded successfully in Firestore.");
    } catch (logErr) {
      console.error("Telemetry logger failed to save log document:", logErr);
    }

    return {
      success: true,
      count: successCount,
      failureCount,
      cleanupCount,
      duration,
      events: syncedEvents,
    };
  } catch (error: any) {
    console.error("HackerEarth Playwright crawler crashed:", error);
    const duration = Math.round((Date.now() - startTime) / 1000);

    // Fail telemetry logging
    try {
      await adminDb.collection("scrape_logs").add({
        source: "HackerEarth",
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
      console.error("Telemetry failed log write:", logErr);
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
      console.log("Playwright browser closed safely.");
    }
  }
}
