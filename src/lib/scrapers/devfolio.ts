import { chromium } from "playwright";
import { RawScrapedHackathon, normalizeHackathon } from "./normalize";
import { adminDb } from "../firebase-admin";
import { Event } from "../types";

/**
 * Headless browser scraper that queries https://devfolio.co/hackathons structurally
 * and synchronizes live events into the Cloud Firestore 'events' database.
 */
export async function syncDevfolioEvents({ writeToDb = true }: { writeToDb?: boolean } = {}) {
  console.log("Starting Playwright headless Chromium Devfolio scraper...");
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    
    // Configure realistic screen bounds and User Agent on the browser context to bypass bot prevention
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 }
    });
    
    const page = await context.newPage();

    console.log("Navigating to Devfolio hackathons directory...");
    await page.goto("https://devfolio.co/hackathons", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(5000);

    console.log("Parsing card containers structurally...");

    // Scrape dynamically loaded items
    const scrapedList: RawScrapedHackathon[] = await page.evaluate(() => {
      const list: RawScrapedHackathon[] = [];
      const anchors = Array.from(document.querySelectorAll("a"));

      anchors.forEach((a: HTMLAnchorElement) => {
        const href = a.href;
        
        // Match both absolute and relative path structures pointing to specific hackathons
        const isHackathonDetail = href.includes("/hackathons/") || 
                                  (href.includes(".devfolio.co") && !href.includes("devfolio.co/hackathons"));
        
        if (!isHackathonDetail) return;

        // Structural header lookup
        const heading = a.querySelector("h2, h3, h4, h5, [class*='title'], [class*='Heading']");
        const titleText = heading ? heading.textContent?.trim() : a.innerText.trim().split("\n")[0];
        
        if (!titleText || titleText.length < 3) return;

        // Eliminate double additions of the same href node
        if (list.some((item) => item.url === href)) return;

        // Extract banner logo
        const img = a.querySelector("img");
        const bannerImage = img ? img.src : "";

        // Extract chips and badges relative to this link card
        const tags: string[] = [];
        const spans = Array.from(a.querySelectorAll("span, div[class*='badge'], div[class*='chip']"));
        spans.forEach((span: Element) => {
          const text = span.textContent?.trim() || "";
          if (
            text &&
            text.length > 1 &&
            text.length < 20 &&
            !text.includes("Starts") &&
            !text.includes("Ends") &&
            !text.includes("Apply")
          ) {
            tags.push(text);
          }
        });

        // Scan text arrays for dates and location parameters
        let dateText = "";
        let locationText = "Online";
        
        const textLines = a.innerText.split("\n").map((t) => t.trim()).filter(Boolean);
        textLines.forEach((line) => {
          if (line.includes("Online") || line.includes("Virtual")) {
            locationText = "Online";
          } else if (line.match(/^[a-zA-Z]+ \d+/)) {
            // E.g. "Jun 14, 2026" or "Nov 12 - 14"
            dateText = line;
          } else if (line.includes(",") && line.length < 30) {
            // E.g. "Pune, India" or "Mumbai"
            locationText = line;
          }
        });

        // Resolve organizer name from internal selectors if visible
        let organizer = "Devfolio Host";
        const orgEl = a.querySelector("[class*='organizer'], [class*='by']");
        if (orgEl) {
          organizer = orgEl.textContent?.trim() || "Devfolio Host";
        } else {
          // Parse relative text
          const foundBy = textLines.find((line) => line.toLowerCase().startsWith("by "));
          if (foundBy) {
            organizer = foundBy.substring(3).trim();
          }
        }

        list.push({
          title: titleText,
          url: href,
          bannerImage,
          tags: Array.from(new Set(tags)).slice(0, 4),
          organizer,
          dateText,
          locationText,
        });
      });

      return list;
    });

    console.log(`Scraper discovered ${scrapedList.length} total hackathons. Normalizing...`);

    let successCount = 0;
    const syncedEvents: Event[] = [];

    // Use Firestore writeBatch for atomic bulk writes (max 500 per batch)
    const BATCH_SIZE = 500;
    const allNormalized = [];

    for (const raw of scrapedList) {
      try {
        const event = normalizeHackathon(raw);
        allNormalized.push(event);
      } catch (err) {
        console.error(`Failed to normalize Devfolio document:`, err);
      }
    }

    // Commit in batch chunks
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
        console.log(`Batch committed: ${chunk.length} Devfolio events (total: ${successCount})`);
      }
    } else {
      successCount = allNormalized.length;
      syncedEvents.push(...allNormalized);
    }

    console.log(`Ingestion completed: ${successCount}/${scrapedList.length} events synced successfully.`);
    return { success: true, count: successCount, events: syncedEvents };
  } catch (error: unknown) {
    console.error("Playwright Devfolio crawler encountered an error:", error);
    return { success: false, error: String(error) };
  } finally {
    if (browser) {
      await browser.close();
      console.log("Playwright browser closed safely.");
    }
  }
}
