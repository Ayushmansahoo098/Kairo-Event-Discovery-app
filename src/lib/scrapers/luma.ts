import { chromium } from "playwright";
import { RawScrapedLumaEvent, normalizeLumaEvent, cleanupExpiredEvents } from "./normalize";
import { adminDb } from "../firebase-admin";
import { Event } from "../types";

/**
 * Headless browser scraper that crawls live tech events from Luma (luma.com),
 * targeting major tech cities, normalizes them, and syncs to Cloud Firestore.
 * Implements a 3-tier parsing hierarchy: API/JSON intercept -> __NEXT_DATA__ payload -> DOM scraping.
 */
export async function syncLumaEvents({ writeToDb = true }: { writeToDb?: boolean } = {}) {
  console.log("Starting Playwright headless Chromium Luma scraper...");
  const cities = ["bengaluru", "mumbai", "new-delhi"];
  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;
  const ingestedEvents: Event[] = [];
  let browser;

  try {
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

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 }
    });

    for (const city of cities) {
      console.log(`Crawling Luma events for city: ${city}...`);
      const page = await context.newPage();
      
      const scrapedEventsForCity: RawScrapedLumaEvent[] = [];
      const interceptedJsonEvents: RawScrapedLumaEvent[] = [];

      // 1. Priority 1: Network Request / JSON Interception
      page.on("response", async (response) => {
        const url = response.url();
        try {
          if (url.includes("api.luma.com") && response.status() === 200) {
            const contentType = response.headers()["content-type"] || "";
            if (contentType.includes("json")) {
              const json = await response.json();
              
              // Inspect if this looks like a place data payload with an events array
              const eventList = json?.data?.events || json?.events || json?.entries;
              if (Array.isArray(eventList)) {
                console.log(`[Priority 1] Intercepted event list payload on API URL: ${url}`);
                eventList.forEach((item: any) => {
                  const evObj = item.event || item;
                  if (evObj && evObj.name && evObj.url) {
                    const host = item.calendar?.name || evObj.personal_user?.name || item.hosts?.[0]?.name || "Luma Host";
                    interceptedJsonEvents.push({
                      title: evObj.name,
                      url: evObj.url.startsWith("http") ? evObj.url : `https://luma.com/${evObj.url}`,
                      bannerImage: evObj.cover_url || "",
                      date: evObj.start_at || "",
                      time: evObj.start_at ? new Date(evObj.start_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "06:30 PM",
                      location: evObj.geo_address_info?.city_state || evObj.geo_address_info?.city || "Online",
                      city: evObj.location_type === "online" ? "Online" : (evObj.geo_address_info?.city || city),
                      organizer: host,
                      description: evObj.description || "",
                      tags: ["luma", "meetup", city],
                    });
                  }
                });
              }
            }
          }
        } catch (err) {
          // Ignore parse errors on irrelevant assets
        }
      });

      try {
        await page.goto(`https://lu.ma/${city}`, {
          waitUntil: "networkidle",
          timeout: 30000,
        });
        await page.waitForTimeout(4000);

        // Scroll page slightly to trigger hydration or lazy loads
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 3);
        });
        await page.waitForTimeout(2000);

        if (interceptedJsonEvents.length > 0) {
          console.log(`[Priority 1] Successfully loaded ${interceptedJsonEvents.length} events from intercepted API JSON.`);
          scrapedEventsForCity.push(...interceptedJsonEvents);
        } else {
          // 2. Priority 2: __NEXT_DATA__ Hydration Script Tag
          console.log("[Priority 2] Attempting hydration payload (__NEXT_DATA__) parsing...");
          const nextDataPayload = await page.evaluate(() => {
            const script = document.getElementById("__NEXT_DATA__");
            if (!script) return null;
            try {
              const json = JSON.parse(script.textContent);
              // Traverse into typical Luma Next.js discover events array
              const events = json.props?.pageProps?.initialData?.data?.events || [];
              if (Array.isArray(events) && events.length > 0) {
                return events.map((item: any) => {
                  const ev = item.event;
                  if (!ev) return null;
                  const hostName = item.calendar?.name || ev.personal_user?.name || item.hosts?.[0]?.name || "Luma Host";
                  return {
                    title: ev.name || "",
                    url: ev.url ? (ev.url.startsWith("http") ? ev.url : `https://luma.com/${ev.url}`) : "",
                    bannerImage: ev.cover_url || "",
                    date: ev.start_at || "",
                    time: ev.start_at ? new Date(ev.start_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "06:30 PM",
                    location: ev.geo_address_info?.city_state || ev.geo_address_info?.city || "Online",
                    city: ev.location_type === "online" ? "Online" : (ev.geo_address_info?.city || ""),
                    organizer: hostName,
                    description: ev.description || "",
                  };
                }).filter(Boolean);
              }
            } catch (err) {
              return null;
            }
            return null;
          });

          if (nextDataPayload && nextDataPayload.length > 0) {
            console.log(`[Priority 2] Extracted ${nextDataPayload.length} events from __NEXT_DATA__ script payload.`);
            scrapedEventsForCity.push(...(nextDataPayload as RawScrapedLumaEvent[]));
          } else {
            // 3. Priority 3: DOM Scraping Fallback
            console.log("[Priority 3] Falling back to standard DOM scraping parsing...");
            const domScraped = await page.evaluate(() => {
              const list: any[] = [];
              const cards = Array.from(document.querySelectorAll(".content-card"));
              
              cards.forEach((card) => {
                const link = card.querySelector("a.event-link") as HTMLAnchorElement | null;
                const href = link ? link.href : "";
                if (!href) return;
                
                const title = card.querySelector("h3")?.textContent?.trim() || "";
                const img = card.querySelector("img");
                const bannerImage = img ? img.src : "";
                
                const time = card.querySelector(".event-time span")?.textContent?.trim() || "06:30 PM";
                const organizer = card.querySelector(".attr .text-ellipses")?.textContent?.trim()?.replace(/^by\s+/i, "") || "Luma Host";
                
                const attrs = Array.from(card.querySelectorAll(".attr"));
                const location = attrs[1] ? attrs[1].textContent?.trim() : "Online Event";
                
                list.push({
                  title,
                  url: href,
                  bannerImage,
                  date: new Date().toISOString(), // Fallback to current date if heading extraction is complex
                  time,
                  location,
                  organizer,
                  description: `Join us for this exciting meetup event: "${title}"`,
                });
              });
              return list;
            });

            if (domScraped && domScraped.length > 0) {
              console.log(`[Priority 3] Extracted ${domScraped.length} events from DOM fallback query.`);
              scrapedEventsForCity.push(...domScraped);
            }
          }
        }

        console.log(`Discovered ${scrapedEventsForCity.length} raw Luma events for city "${city}".`);
        
        // Push distinct city events into total ingested events array
        scrapedEventsForCity.forEach((raw) => {
          // Normalize and check
          try {
            // Ensure city field is set if blank
            if (!raw.city) raw.city = city;
            const normalized = normalizeLumaEvent(raw);
            if (!ingestedEvents.some(e => e.id === normalized.id)) {
              ingestedEvents.push(normalized);
            }
          } catch (err) {
            failureCount++;
            console.error(`Failed to normalize Luma event from city "${city}":`, err);
          }
        });

      } catch (pageErr) {
        console.error(`Luma scraper failed on city page "${city}", skipping to next city...`, pageErr);
      } finally {
        await page.close();
      }
    }

    console.log(`Luma scraper crawling ended. Total normalized events: ${ingestedEvents.length}`);

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
        console.log(`Batch committed: ${chunk.length} Luma events (total: ${successCount})`);
      }

      const cleanupRes = await cleanupExpiredEvents();
      cleanupCount = cleanupRes.count ?? 0;

      try {
        await adminDb.collection("scrape_logs").add({
          source: "Luma",
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
          successCount,
          failureCount,
          cleanupCount,
          duration,
          status: "success",
        });
      } catch (logErr) {
        console.error("Failed to write Luma scrape log:", logErr);
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
    console.error("Luma scraper encountered a terminal failure:", error);
    const duration = Math.round((Date.now() - startTime) / 1000);
    if (writeToDb) {
      try {
        await adminDb.collection("scrape_logs").add({
          source: "Luma",
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
        console.error("Failed to write Luma scraper crash log:", logErr);
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
      console.log("Playwright browser for Luma closed successfully.");
    }
  }
}
