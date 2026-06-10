import { chromium, Browser } from "playwright";
import { RawScrapedGDGEvent, normalizeGDGEvent, cleanupExpiredEvents } from "./normalize";
import { adminDb } from "../firebase-admin";
import { Event } from "../types";

/**
 * Headless browser scraper that crawls live Google Developer Group (GDG) events
 * from https://gdg.community.dev/events/, normalizes data, and syncs to Cloud Firestore.
 */
export async function syncGDGEvents({ 
  writeToDb = true,
  browser: externalBrowser
}: { 
  writeToDb?: boolean;
  browser?: Browser;
} = {}) {
  console.log("Starting Playwright headless Chromium GDG scraper...");
  let browser = externalBrowser;
  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;
  const ingestedEvents: Event[] = [];

  try {
    if (!browser) {
      browser = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu"
        ],
      });
    }

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();

    console.log("Navigating to GDG Events list...");
    await page.goto("https://gdg.community.dev/events/", {
      waitUntil: "networkidle",
      timeout: 45000,
    });
    
    // Wait for the dynamic Bevy list to finish loading and rendering React elements
    await page.waitForTimeout(5000);

    // Scroll to trigger lazy loading of more events
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(2000);

    console.log("Parsing GDG cards structurally...");

    const scrapedList: RawScrapedGDGEvent[] = await page.evaluate(() => {
      const list: RawScrapedGDGEvent[] = [];
      const cards = Array.from(document.querySelectorAll(".row.event.eventRectangle"));

      cards.forEach((card) => {
        const titleEl = card.querySelector("h4");
        const title = titleEl ? titleEl.textContent?.trim() : "";
        if (!title || title.length < 3) return;

        const anchor = card.querySelector("a[href*='/events/details/']") as HTMLAnchorElement | null;
        let url = anchor ? anchor.href : "";
        if (url && url.startsWith("/")) {
          url = `https://gdg.community.dev${url}`;
        }
        if (!url) return;

        // Prevent duplicates
        if (list.some(item => item.url === url)) return;

        const img = card.querySelector("img");
        const bannerImage = img ? img.src : "";

        const dateEl = card.querySelector("[class*='dateText']");
        const dateText = dateEl ? dateEl.textContent?.trim() : "";

        const chapterEl = card.querySelector(".chapter-link");
        const city = chapterEl ? chapterEl.textContent?.trim() : "";
        const locationText = city || "Online";

        const descEl = card.querySelector("[class*='description']");
        const description = descEl ? descEl.textContent?.trim() : "";

        const organizer = city ? `${city} Google Developer Group` : "Google Developer Groups";

        // Extract tags inside the chip wrapper
        const tags: string[] = [];
        const tagElements = Array.from(card.querySelectorAll("[class*='tag'], [class*='chip']"));
        tagElements.forEach((tEl) => {
          const text = tEl.textContent?.trim();
          if (text && text.length > 1 && text.length < 30 && !text.includes("Registration") && !text.includes("View details")) {
            tags.push(text);
          }
        });

        list.push({
          title,
          url,
          bannerImage,
          dateText,
          city,
          locationText,
          description,
          organizer,
          tags: Array.from(new Set(tags)),
        });
      });

      return list;
    });

    console.log(`GDG Scraper discovered ${scrapedList.length} events. Normalizing and syncing...`);

    const allNormalized: Event[] = [];
    for (const raw of scrapedList) {
      try {
        const event = normalizeGDGEvent(raw);
        allNormalized.push(event);
      } catch (err) {
        failureCount++;
        console.error("Failed to normalize GDG event:", err);
      }
    }

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
        console.log(`Batch committed: ${chunk.length} GDG events (total: ${successCount})`);
      }

      const cleanupRes = await cleanupExpiredEvents();
      cleanupCount = cleanupRes.count ?? 0;

      try {
        await adminDb.collection("scrape_logs").add({
          source: "GDG",
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
          successCount,
          failureCount,
          cleanupCount,
          duration,
          status: "success",
        });
      } catch (logErr) {
        console.error("Failed to write GDG scrape log:", logErr);
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
    console.error("GDG scraper encountered a terminal failure:", error);
    const duration = Math.round((Date.now() - startTime) / 1000);
    if (writeToDb) {
      try {
        await adminDb.collection("scrape_logs").add({
          source: "GDG",
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
        console.error("Failed to write GDG scraper crash log:", logErr);
      }
    }
    return {
      success: false,
      error: String(error),
      failureCount: 1,
      duration,
    };
  } finally {
    if (browser && !externalBrowser) {
      await browser.close();
      console.log("Playwright browser for GDG closed successfully.");
    }
  }
}
