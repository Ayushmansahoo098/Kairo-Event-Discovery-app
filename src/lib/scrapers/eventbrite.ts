import { Category, Event } from "../types";
import { cleanupExpiredEvents } from "./normalize";
import { adminDb } from "../firebase-admin";

const EVENTBRITE_TOKEN = "RML67REZA27DEFDI7GTH";

interface EventbriteSearchItem {
  id: string;
  name: string;
  summary: string;
  url: string;
  start_date: string;
  start_time: string;
  is_online_event: boolean;
  image_id?: string;
  locations?: Array<{ name: string; type: string }>;
  tags?: Array<{ display_name: string }>;
}

/**
 * Polls Eventbrite API for conferences, startups, and webinars, standardizes data models,
 * saves synchronized entries directly to Firestore, runs cleaning sweeps, and logs sync stats.
 */
export async function syncEventbriteEvents({ writeToDb = true }: { writeToDb?: boolean } = {}) {
  console.log("Triggering Eventbrite Event Ingestion Layer...");
  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;
  const ingestedEvents: Event[] = [];

  try {
    const searchQueries = [
      { query: "conferences", category: "workshop" as Category },
      { query: "startup events", category: "startup" as Category },
      { query: "webinars", category: "workshop" as Category },
    ];

    for (const item of searchQueries) {
      console.log(`Polling Eventbrite for query: "${item.query}"...`);
      
      const searchRes = await fetch(
        `https://www.eventbriteapi.com/v3/destination/search/?token=${EVENTBRITE_TOKEN}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_search: {
              q: item.query,
            },
          }),
        }
      );

      if (!searchRes.ok) {
        console.error(`Eventbrite search failed for query "${item.query}":`, searchRes.statusText);
        continue;
      }

      const searchData = await searchRes.json();
      const rawEvents = searchData.events || [];

      if (!Array.isArray(rawEvents)) {
        console.error(`Eventbrite events is not an array for query "${item.query}":`, rawEvents);
        continue;
      }

      console.log(`Found ${rawEvents.length} events for query: "${item.query}"`);

      // Retrieve top 5 matches
      for (const raw of rawEvents.slice(0, 5) as EventbriteSearchItem[]) {
        try {
          let bannerImage = "";

          // Resolve CDN logo if logo ID exists
          if (raw.image_id) {
            const detailRes = await fetch(
              `https://www.eventbriteapi.com/v3/events/${raw.id}/?expand=logo&token=${EVENTBRITE_TOKEN}`
            );
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              bannerImage = detailData.logo?.original?.url || "";
            }
          }

          // Fallback image formats
          if (!bannerImage) {
            if (item.category === "startup") {
              bannerImage = "/images/startup.png";
            } else {
              bannerImage = "/images/workshop.png";
            }
          }

          // Resolve city name
          let city = "Online";
          if (!raw.is_online_event && raw.locations && raw.locations.length > 0) {
            const locationItem = raw.locations.find(
              (l) => l.type === "locality" || l.type === "region" || l.type === "country"
            );
            city = locationItem ? locationItem.name : "Bangalore";
          }

          const date = raw.start_date || new Date().toISOString().split("T")[0];
          
          const mappedEvent: Event = {
            id: `eb-${raw.id}`,
            title: raw.name,
            description: raw.summary || "No description provided.",
            bannerImage: bannerImage,
            date: date,
            time: raw.start_time || "09:00 AM",
            location: raw.is_online_event ? "Online Event" : city,
            city: city,
            isOnline: raw.is_online_event,
            category: item.category,
            organizer: "Eventbrite Organizer",
            registrationUrl: raw.url,
            tags: raw.tags?.slice(0, 4).map((t) => t.display_name.toLowerCase()) || [item.query],
            isTrending: false,
            source: "Eventbrite",
            expiresAt: date,
            lastUpdated: new Date().toISOString(),
          };

          successCount++;
          ingestedEvents.push(mappedEvent);
          console.log(`Successfully parsed Eventbrite: ${mappedEvent.title} (${mappedEvent.id})`);
        } catch (eventErr) {
          failureCount++;
          console.error(`Failed to ingest Eventbrite event ${raw.id}:`, eventErr);
        }
      }
    }

    let cleanupCount = 0;
    const duration = Math.round((Date.now() - startTime) / 1000);

    if (writeToDb) {
      // Batch commit all collected events for write efficiency
      if (ingestedEvents.length > 0) {
        try {
          const BATCH_SIZE = 500;
          for (let i = 0; i < ingestedEvents.length; i += BATCH_SIZE) {
            const chunk = ingestedEvents.slice(i, i + BATCH_SIZE);
            const batch = adminDb.batch();
            for (const event of chunk) {
              const docRef = adminDb.collection("events").doc(event.id);
              batch.set(docRef, event);
            }
            await batch.commit();
            console.log(`Eventbrite batch committed: ${chunk.length} events`);
          }
        } catch (batchErr) {
          console.error("Eventbrite batch commit failed:", batchErr);
        }
      }

      const cleanupRes = await cleanupExpiredEvents();
      cleanupCount = cleanupRes.count ?? 0;

      // Telemetry log to 'scrape_logs'
      try {
        await adminDb.collection("scrape_logs").add({
          source: "Eventbrite",
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
          successCount,
          failureCount,
          cleanupCount,
          duration,
          status: "success",
        });
      } catch (logErr) {
        console.error("Telemetry failed to write for Eventbrite:", logErr);
      }
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
    console.error("Eventbrite sync crashed:", error);
    const duration = Math.round((Date.now() - startTime) / 1000);
    if (writeToDb) {
      try {
        await adminDb.collection("scrape_logs").add({
          source: "Eventbrite",
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
        console.error("Telemetry log write failed for Eventbrite crash:", logErr);
      }
    }

    return {
      success: false,
      error: String(error),
      failureCount: 1,
      duration,
    };
  }
}
