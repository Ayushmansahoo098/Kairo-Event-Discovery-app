import { chromium } from "playwright";
import { RawScrapedMLHEvent, normalizeMLHEvent, cleanupExpiredEvents } from "./normalize";
import { adminDb } from "../firebase-admin";
import { Event } from "../types";

/**
 * Headless browser scraper that crawls live hackathons from MLH (Major League Hacking),
 * discovers the active season dynamically, normalizes data, and syncs to Cloud Firestore.
 */
export async function syncMLHEvents({ writeToDb = true }: { writeToDb?: boolean } = {}) {
  console.log("Starting Playwright headless Chromium MLH scraper...");
  let browser;
  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;
  const ingestedEvents: Event[] = [];

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

    // 1. Dynamic Season URL Discovery
    let targetUrl = `https://mlh.com/seasons/${new Date().getFullYear()}/events`;
    try {
      console.log("Discovering MLH season URL dynamically...");
      await page.goto("https://mlh.io/seasons", {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });
      await page.waitForTimeout(2000);
      
      const discoveredUrl = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll("a"));
        // Search for link pointing to events of current season (e.g. /seasons/2026/events)
        const seasonLink = anchors.find(a => a.href && /\/seasons\/\d{4}\/events/.test(a.href));
        return seasonLink ? seasonLink.href : null;
      });

      if (discoveredUrl) {
        targetUrl = discoveredUrl;
        console.log(`Discovered active MLH season URL dynamically: ${targetUrl}`);
      } else {
        console.log(`Dynamic discovery returned no matching links. Using year fallback: ${targetUrl}`);
      }
    } catch (discErr) {
      console.warn("Failed to dynamically discover MLH season page, utilizing calendar year fallback:", discErr);
    }

    // 2. Load Events Page
    console.log(`Navigating to MLH listings: ${targetUrl} ...`);
    await page.goto(targetUrl, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page.waitForTimeout(4000);

    // 3. Extract event structures
    const scrapedList: RawScrapedMLHEvent[] = await page.evaluate(() => {
      const list: RawScrapedMLHEvent[] = [];
      const anchors = Array.from(document.querySelectorAll("a[itemtype='https://schema.org/Event']"));

      anchors.forEach((a: Element) => {
        const title = a.querySelector("h4")?.textContent?.trim() || "";
        if (!title || title.length < 3) return;

        const url = a.querySelector("meta[itemprop='url']")?.getAttribute("content") || (a as HTMLAnchorElement).href;
        
        // Exclude duplicate urls in page
        if (list.some(item => item.url === url)) return;

        const image = a.querySelector("meta[itemprop='image']")?.getAttribute("content") || a.querySelector("img")?.src || "";
        const startDate = a.querySelector("meta[itemprop='startDate']")?.getAttribute("content") || "";
        const endDate = a.querySelector("meta[itemprop='endDate']")?.getAttribute("content") || "";
        
        const locName = a.querySelector("div[itemprop='location'] span[itemprop='name']")?.textContent?.trim() || "";
        const country = a.querySelector("meta[itemprop='addressCountry']")?.getAttribute("content") || "";
        const location = locName && country ? `${locName}, ${country}` : (locName || "Online");

        // Collect labels/chips inside card wrapper
        const tags: string[] = [];
        const chips = Array.from(a.querySelectorAll(".rounded-full"));
        chips.forEach((c) => {
          const t = c.textContent?.trim();
          if (t && t.length > 1 && t.length < 20) {
            tags.push(t);
          }
        });

        list.push({
          title,
          url,
          startDate,
          endDate,
          image,
          location,
          tags: Array.from(new Set(tags)),
        });
      });

      return list;
    });

    console.log(`Discover process parsed ${scrapedList.length} raw MLH events. Normalizing and syncing...`);

    const allNormalized: Event[] = [];
    for (const raw of scrapedList) {
      try {
        const event = normalizeMLHEvent(raw);
        allNormalized.push(event);
      } catch (err) {
        failureCount++;
        console.error("Failed to normalize MLH event:", err);
      }
    }

    // 4. Batch sync database logic
    let cleanupCount = 0;
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
        ingestedEvents.push(...chunk);
        console.log(`Batch committed: ${chunk.length} MLH events (total: ${successCount})`);
      }

      // Cleanup sweeper sweep trigger
      const cleanupRes = await cleanupExpiredEvents();
      cleanupCount = cleanupRes.count ?? 0;

      // Log telemetry run in database
      try {
        await adminDb.collection("scrape_logs").add({
          source: "MLH",
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
          successCount,
          failureCount,
          cleanupCount,
          duration,
          status: "success",
        });
      } catch (logErr) {
        console.error("Failed to write MLH scrape log:", logErr);
      }
    } else {
      successCount = allNormalized.length;
      ingestedEvents.push(...allNormalized);
    }

    return {
      success: true,
      count: successCount,
      failureCount,
      cleanupCount,
      duration,
      events: ingestedEvents,
    };
  } catch (error: unknown) {
    console.error("MLH scraper encountered a fatal crawl error:", error);
    const duration = Math.round((Date.now() - startTime) / 1000);
    if (writeToDb) {
      try {
        await adminDb.collection("scrape_logs").add({
          source: "MLH",
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
        console.error("Telemetry failed to write MLH scraper crash logs:", logErr);
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
      console.log("Playwright browser for MLH closed successfully.");
    }
  }
}
