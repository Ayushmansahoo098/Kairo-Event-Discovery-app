import { chromium } from "playwright";
import { adminDb } from "../firebase-admin";
import { Event } from "../types";
import { RawScrapedBMSEvent, normalizeBMSEvent, cleanupExpiredEvents } from "./normalize";
import fs from "fs";
import path from "path";

/**
 * Headless browser scraper that crawls live events from BookMyShow (bookmyshow.com),
 * targeting major cities, normalizes them, and syncs to Cloud Firestore.
 * Implements anti-bot evasion and extracts the date watermark from images.
 */
export async function syncBMSEvents({ writeToDb = true }: { writeToDb?: boolean } = {}) {
  console.log("Starting Playwright headless Chromium BookMyShow scraper...");
  const cities = ["bengaluru", "mumbai", "delhi-ncr", "hyderabad", "pune"];
  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;
  const ingestedEvents: Event[] = [];
  let context;

  try {
    let cityIndex = 0;
    if (writeToDb) {
      const stateRef = adminDb.collection("locks").doc("bms_state");
      const stateDoc = await stateRef.get();
      if (stateDoc.exists) {
        cityIndex = stateDoc.data()?.cityIndex || 0;
      }
      // Update for next run
      await stateRef.set({ cityIndex: (cityIndex + 1) % cities.length });
    }

    const city = cities[cityIndex % cities.length];
    console.log(`Crawling BookMyShow events for city: ${city} (Index: ${cityIndex})...`);

    const userDataDir = path.resolve("./.bms_profile");
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }

    context = await chromium.launchPersistentContext(userDataDir, {
      headless: true,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu"
      ],
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
      locale: "en-US",
      timezoneId: "Asia/Kolkata",
      ignoreDefaultArgs: ["--enable-automation"]
    });

    // Disable navigator.webdriver
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    let page;
    let cityRawEvents: RawScrapedBMSEvent[] = [];
      
    let success = false;

      // Retry up to 3 times for the chosen city in case of transient Cloudflare blocks
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
          console.log(`[City: ${city}] Navigation attempt ${attempt}...`);
          
          await page.goto(`https://in.bookmyshow.com/explore/events-${city}`, {
            waitUntil: "domcontentloaded",
            timeout: 25000,
          });

          // Wait for dynamic layout scripts to hydrate
          await page.waitForTimeout(6000);

          const pageText = await page.evaluate(() => document.body.innerText);
          const isErrorPage = pageText.includes("Sorry for bug-ging") || pageText.includes("Sorry, you have been blocked") || pageText.includes("Attention Required");

          if (isErrorPage) {
            console.warn(`[City: ${city}] Encountered "Sorry for bug-ging" Cloudflare block. Retrying...`);
            if (attempt < 3) {
              await new Promise((resolve) => setTimeout(resolve, 3000));
            }
            continue;
          }

          // Extract event card elements from successful load
          const cards: RawScrapedBMSEvent[] = await page.evaluate((currentCity) => {
            const anchors = Array.from(document.querySelectorAll("a"));
            // Look for anchors pointing to /events/ that contain multiple lines or price info
            const gridAnchors = anchors.filter((a) => {
              const href = a.getAttribute("href") || "";
              const text = a.innerText || "";
              return href.includes("/events/") && (text.includes("₹") || text.split("\n").length >= 3);
            });

            return gridAnchors.map((a: HTMLAnchorElement) => {
              const href = a.href;
              const text = a.innerText || "";
              const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

              const img = a.querySelector("img");
              const bannerImage = img ? img.src || img.getAttribute("src") || img.getAttribute("data-src") || "" : "";

              // InnerText Lines Map:
              // Line 0: Title
              // Line 1: Venue/Location
              // Line 2: Category (or subcategory)
              // Line 3: Price Text (contains ₹)
              const title = lines[0] || "";
              const venue = lines[1] || "";
              const categoryText = lines[2] || "";
              const priceText = lines[3] || "";

              return {
                title,
                url: href,
                bannerImage,
                venue,
                city: currentCity,
                categoryText,
                priceText,
              };
            });
          }, city);

          cityRawEvents = cards;
          console.log(`[City: ${city}] Successfully scraped ${cityRawEvents.length} raw cards on attempt ${attempt}.`);
          success = true;
          break;
        } catch (err) {
          console.error(`[City: ${city}] Attempt ${attempt} failed with error:`, err);
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        }
      }

      if (!success) {
        console.error(`[City: ${city}] Failed to crawl BookMyShow explore page after 3 attempts.`);
        failureCount++;
      } else {
        // Process watermark date strings for successfully scraped items
        for (const raw of cityRawEvents) {
          try {
            let watermarkDateText = "";
            
            if (raw.bannerImage) {
              const match = raw.bannerImage.match(/ie-([a-zA-Z0-9%=-]+)/);
              if (match) {
                try {
                  const base64Str = decodeURIComponent(match[1]);
                  watermarkDateText = Buffer.from(base64Str, "base64").toString("utf-8");
                } catch (e) {
                  // Ignore decoding errors
                }
              }
            }

            raw.watermarkDateText = watermarkDateText;
            const normalized = normalizeBMSEvent(raw);
            
            if (!ingestedEvents.some((e) => e.id === normalized.id)) {
              ingestedEvents.push(normalized);
            }
          } catch (err) {
            failureCount++;
            console.error(`Failed to normalize BookMyShow event: "${raw.title}"`, err);
          }
        }
      }

    console.log(`BookMyShow scraper crawling finished. Total normalized events: ${ingestedEvents.length}`);

    let cleanupCount = 0;
    const duration = Math.round((Date.now() - startTime) / 1000);

    if (writeToDb && ingestedEvents.length > 0) {
      const BATCH_SIZE = 500;
      for (let i = 0; i < ingestedEvents.length; i += BATCH_SIZE) {
        const chunk = ingestedEvents.slice(i, i + BATCH_SIZE);
        const batch = adminDb.batch();
        for (const event of chunk) {
          const docRef = adminDb.collection("events").doc(event.id);
          batch.set(docRef, event);
        }
        await batch.commit();
        successCount += chunk.length;
        console.log(`Batch committed: ${chunk.length} BookMyShow events (total: ${successCount})`);
      }

      const cleanupRes = await cleanupExpiredEvents();
      cleanupCount = cleanupRes.count ?? 0;

      try {
        await adminDb.collection("scrape_logs").add({
          source: "BookMyShow",
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
          successCount,
          failureCount,
          cleanupCount,
          duration,
          status: "success",
        });
      } catch (logErr) {
        console.error("Failed to write BookMyShow scrape log:", logErr);
      }
    } else {
      successCount = ingestedEvents.length;
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
    console.error("BookMyShow scraper encountered a terminal failure:", error);
    const duration = Math.round((Date.now() - startTime) / 1000);
    if (writeToDb) {
      try {
        await adminDb.collection("scrape_logs").add({
          source: "BookMyShow",
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
        console.error("Failed to write BookMyShow scraper crash log:", logErr);
      }
    }
    return {
      success: false,
      error: String(error),
      failureCount: 1,
      duration,
    };
  } finally {
    if (context) {
      await context.close();
      console.log("Playwright context for BookMyShow closed successfully.");
    }
  }
}
