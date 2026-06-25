import { chromium, Browser } from "playwright";
import { RawScrapedInsiderEvent, normalizeInsiderEvent } from "./normalize";
import { adminDb } from "../firebase-admin";
import { Event } from "../types";
import fs from "fs";
import path from "path";

/**
 * Headless browser scraper that crawls live events from Paytm Insider / District by Zomato,
 * normalizes them, and syncs to Cloud Firestore.
 */
export async function syncInsiderEvents({ 
  writeToDb = true,
  browser: externalBrowser
}: { 
  writeToDb?: boolean;
  browser?: Browser;
} = {}) {
  console.log("Starting Playwright headless Chromium Paytm Insider/District scraper...");
  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;
  const ingestedEvents: Event[] = [];
  let browser = externalBrowser;
  let context = null;

  try {
    if (!browser) {
      const userDataDir = path.resolve("./.insider_profile");
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
    }

    const page = context ? (context.pages().length > 0 ? context.pages()[0] : await context.newPage()) : await browser!.newPage();
    console.log("Navigating to District (Paytm Insider) events listing...");
    
    // We scrape the main events directory which lists major upcoming city and national events
    await page.goto("https://www.district.in/events/", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Wait for the scripts to load and populate the page
    await page.waitForTimeout(6000);

    console.log("Extracting event cards from District by Zomato...");
    const rawEvents: RawScrapedInsiderEvent[] = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll("a"));
      // Look for event cards pointing to /events/ that contain event metadata
      const eventAnchors = anchors.filter((a) => {
        const href = a.getAttribute("href") || "";
        const text = a.innerText || "";
        // Match standard ticket buying details
        return href.includes("/events/") && (href.includes("-buy-tickets") || text.includes("₹") || text.split("\n").length >= 3);
      });

      return eventAnchors.map((a: HTMLAnchorElement) => {
        const href = a.href;
        const text = a.innerText || "";
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

        const img = a.querySelector("img");
        const bannerImage = img ? img.src || img.getAttribute("src") || img.getAttribute("data-src") || "" : "";

        // Remove booking CTA text lines
        const cleanLines = lines.filter(line => {
          const l = line.toLowerCase();
          return !l.includes("book tickets") && !l.includes("book your tickets") && !l.includes("buy tickets") && !l.includes("onwards");
        });

        let offer = "";
        let dateText = "";
        let title = "";
        let venue = "";
        let priceText = "";

        let currentIndex = 0;
        // Check for discount tags at the beginning (e.g. "Flat 30% off" or "15% OFF")
        if (cleanLines[currentIndex] && (
          cleanLines[currentIndex].toLowerCase().includes("off") || 
          cleanLines[currentIndex].toLowerCase().includes("free") || 
          cleanLines[currentIndex].toLowerCase().includes("up to") ||
          cleanLines[currentIndex].toLowerCase().includes("get 1")
        )) {
          offer = cleanLines[currentIndex];
          currentIndex++;
        }

        // Parse date/time line
        if (cleanLines[currentIndex]) {
          dateText = cleanLines[currentIndex];
          currentIndex++;
        }

        // Parse title
        if (cleanLines[currentIndex]) {
          title = cleanLines[currentIndex];
          currentIndex++;
        }

        // Parse venue / location (can contain city)
        if (cleanLines[currentIndex]) {
          venue = cleanLines[currentIndex];
          currentIndex++;
        }

        // Parse price (which might contain ₹)
        const priceLine = cleanLines.find((l, idx) => idx >= currentIndex && l.includes("₹"));
        if (priceLine) {
          priceText = priceLine;
        } else if (cleanLines[currentIndex]) {
          priceText = cleanLines[currentIndex];
        }

        // Fallback city detection from venue
        let city = "Online";
        const locationLower = venue.toLowerCase();
        if (locationLower.includes("bengaluru") || locationLower.includes("bangalore")) {
          city = "Bengaluru";
        } else if (locationLower.includes("mumbai")) {
          city = "Mumbai";
        } else if (locationLower.includes("delhi") || locationLower.includes("ncr") || locationLower.includes("noida") || locationLower.includes("gurgaon") || locationLower.includes("gurugram")) {
          city = "Delhi";
        } else if (locationLower.includes("pune")) {
          city = "Pune";
        } else if (locationLower.includes("hyderabad")) {
          city = "Hyderabad";
        }

        return {
          title: title || href.split("/events/")[1]?.split("-buy-tickets")[0]?.replace(/-/g, " ") || "Paytm Insider Event",
          url: href,
          bannerImage,
          venue: venue || "District Venue",
          city,
          categoryText: offer || "Entertainment",
          priceText: priceText || "Price details online",
          dateText: dateText
        };
      });
    });

    console.log(`Insider Scraper discovered ${rawEvents.length} raw event cards. Normalizing...`);

    for (const raw of rawEvents) {
      try {
        const normalized = normalizeInsiderEvent(raw);
        if (!ingestedEvents.some((e) => e.id === normalized.id)) {
          ingestedEvents.push(normalized);
        }
      } catch (err) {
        failureCount++;
        console.error(`Failed to normalize Paytm Insider event "${raw.title}":`, err);
      }
    }

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
        console.log(`Batch committed: ${chunk.length} Paytm Insider events (Total: ${successCount})`);
      }
    } else {
      successCount = ingestedEvents.length;
    }

    console.log(`Paytm Insider scraper execution finished. Synced ${successCount} events.`);
    return { success: true, count: successCount, events: ingestedEvents };
  } catch (error) {
    console.error("Paytm Insider/District crawler encountered an error:", error);
    return { success: false, error: String(error) };
  } finally {
    if (context) {
      await context.close().catch((err) => console.error("Error closing persistent context:", err));
    }
  }
}
