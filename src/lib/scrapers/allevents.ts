import { adminDb } from "../firebase-admin";
import { normalizeAllEventsEvent } from "./normalize";
import https from "https";

// Target cities mapped to AllEvents URL slugs
const CITIES = [
  { original: "bengaluru", slug: "bangalore" },
  { original: "mumbai", slug: "mumbai" },
  { original: "delhi-ncr", slug: "new-delhi" },
  { original: "hyderabad", slug: "hyderabad" },
  { original: "pune", slug: "pune" },
];

const CATEGORIES = ["concerts", "comedy-shows", "food-drinks", "parties"];

function fetchHtml(url: string): Promise<{ status: number; html: string }> {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      }
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve({ status: res.statusCode || 500, html: data }));
    }).on("error", reject);
  });
}

function extractEvents(html: string): any[] {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]["@type"] === "Event") {
        return parsed;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  return [];
}

export async function syncAllEvents(options: { writeToDb?: boolean } = { writeToDb: true }) {
  console.log("Starting AllEvents.in Sync...");
  let totalSaved = 0;
  let totalDuplicates = 0;
  const scrapedEvents: Event[] = [];

  for (const cityObj of CITIES) {
    for (const category of CATEGORIES) {
      const url = `https://allevents.in/${cityObj.slug}/${category}`;
      console.log(`Fetching AllEvents: ${url}`);
      
      try {
        const { status, html } = await fetchHtml(url);
        if (status !== 200) {
          console.warn(`AllEvents returned ${status} for ${url}`);
          continue;
        }

        const rawEvents = extractEvents(html);
        console.log(`Extracted ${rawEvents.length} events from ${url}`);

        if (rawEvents.length === 0) continue;

        for (const raw of rawEvents) {
          try {
            const eventData = normalizeAllEventsEvent(raw, category, cityObj.original);
            scrapedEvents.push(eventData);
          } catch (e) {
            console.error("Error normalizing AllEvents event:", e);
          }
        }
        // Small delay between categories to be polite
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`Failed to scrape AllEvents for ${url}:`, err);
      }
    }
  }

  if (options.writeToDb && scrapedEvents.length > 0) {
    const batch = adminDb.batch();
    let batchCount = 0;

    for (const eventData of scrapedEvents) {
      const existingQuery = await adminDb
        .collection("events")
        .where("source", "==", "AllEvents")
        .where("id", "==", eventData.id)
        .get();

      if (!existingQuery.empty) {
        const docRef = existingQuery.docs[0].ref;
        batch.update(docRef, { lastUpdated: new Date().toISOString() });
        totalDuplicates++;
      } else {
        const docRef = adminDb.collection("events").doc(eventData.id);
        batch.set(docRef, eventData);
        totalSaved++;
      }
      
      batchCount++;
      if (batchCount === 490) {
        await batch.commit();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    const result = {
      scraper: "AllEvents",
      saved: totalSaved,
      duplicates: totalDuplicates,
      totalProcessed: totalSaved + totalDuplicates,
      duration: "Fast Fetch",
    };
    
    await adminDb.collection("scrape_logs").add({
      ...result,
      timestamp: new Date().toISOString(),
    });
    console.log("AllEvents Direct Write Sync Complete:", result);
  }

  return {
    success: true,
    count: scrapedEvents.length,
    saved: totalSaved,
    events: scrapedEvents,
  };
}
