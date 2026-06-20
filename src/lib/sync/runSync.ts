import { adminDb } from "@/lib/firebase-admin";
import { Event } from "@/lib/types";
import crypto from "crypto";
import { triggerRecommendationRefresh } from "@/lib/recommendations";
import { syncEventbriteEvents } from "@/lib/scrapers/eventbrite";
import { syncAllEvents } from "@/lib/scrapers/allevents";

export interface SyncOptions {
  runBms?: boolean;
}

const LOCK_STALE_THRESHOLD_MS = 20 * 60 * 1000;

function getJaccardSimilarity(str1: string, str2: string): number {
  const getTokens = (str: string) => {
    return new Set(str.toLowerCase().replace(/[^a-z0-9\s]+/g, "").split(/\s+/).filter(Boolean));
  };
  const set1 = getTokens(str1);
  const set2 = getTokens(str2);
  if (set1.size === 0 || set2.size === 0) return 0;
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

function getSourcePriority(source?: string): number {
  if (!source) return 0;
  const s = source.toLowerCase();
  if (s.includes("devfolio")) return 10;
  if (s.includes("mlh")) return 9;
  if (s.includes("gdg")) return 8;
  if (s.includes("unstop")) return 7;
  if (s.includes("hackerearth")) return 6;
  if (s.includes("luma")) return 5;
  if (s.includes("meetup")) return 4;
  if (s.includes("eventbrite")) return 3;
  if (s.includes("bookmyshow")) return 2;
  if (s.includes("allevents")) return 1;
  return 0;
}

function getCanonicalId(title: string, date: string): string {
  const slug = title.toLowerCase()
    .replace(/^(devfolio|mlh|gdg|unstop|hackerearth|luma|meetup|eventbrite|bookmyshow|allevents)\s+/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  
  const year = date.split("-")[0];
  if (slug.includes(year) || slug.includes(date)) {
    return slug;
  }
  return `${slug}-${date}`;
}

function calculateContentHash(event: Event): string {
  const dataToHash = JSON.stringify({
    title: event.title,
    description: event.description,
    date: event.date,
    sources: event.sources || [],
    sourceUrls: event.sourceUrls || {},
    location: event.location,
    city: event.city,
    isOnline: event.isOnline,
    category: event.category,
    organizer: event.organizer,
    tags: event.tags || [],
  });
  return crypto.createHash("sha256").update(dataToHash).digest("hex");
}

function mergeTwoEvents(target: Event, src: Event) {
  const targetSources = new Set(target.sources || []);
  if (target.source) targetSources.add(target.source);
  if (src.source) targetSources.add(src.source);
  if (src.sources) src.sources.forEach(s => targetSources.add(s));
  target.sources = Array.from(targetSources);

  const targetSourceUrls = { ...(target.sourceUrls || {}) };
  if (target.source && target.registrationUrl) targetSourceUrls[target.source] = target.registrationUrl;
  if (src.source && src.registrationUrl) targetSourceUrls[src.source] = src.registrationUrl;
  if (src.sourceUrls) Object.assign(targetSourceUrls, src.sourceUrls);
  target.sourceUrls = targetSourceUrls;

  const tagsSet = new Set([...(target.tags || []), ...(src.tags || [])]);
  target.tags = Array.from(tagsSet).slice(0, 6);

  const targetPriority = getSourcePriority(target.source);
  const srcPriority = getSourcePriority(src.source);
  if (srcPriority > targetPriority) {
    target.title = src.title;
    target.description = src.description;
    target.bannerImage = src.bannerImage;
    target.date = src.date;
    target.time = src.time;
    target.location = src.location;
    target.city = src.city;
    target.isOnline = src.isOnline;
    target.category = src.category;
    target.organizer = src.organizer;
    target.registrationUrl = src.registrationUrl;
    target.source = src.source;
  }
}

export async function runSync(options: SyncOptions = {}) {
  const startTime = Date.now();
  console.log("Shared Ingestion Sync Pipeline execution started...");

  // Check Playwright availability
  let playwrightAvailable = false;
  try {
    require.resolve("playwright");
    playwrightAvailable = true;
  } catch {}

  if (!playwrightAvailable) {
    return {
      success: false,
      message: "Scrapers are managed by GitHub Actions. Manual sync unavailable in this environment.",
    };
  }

  // ─── Concurrency Lock Check ───
  const lockRef = adminDb.collection("locks").doc("sync");
  try {
    const lockDoc = await lockRef.get();
    if (lockDoc.exists) {
      const lockData = lockDoc.data();
      if (lockData?.isActive) {
        const lockedAt = lockData.lockedAt ? new Date(lockData.lockedAt).getTime() : 0;
        const lockAge = Date.now() - lockedAt;
        if (lockAge < LOCK_STALE_THRESHOLD_MS) {
          console.warn("Sync lock is active. Another sync job is in progress.");
          return {
            success: false,
            message: "A sync job is currently in progress. Please try again later.",
            lockAgeSeconds: Math.round(lockAge / 1000),
          };
        }
        console.warn("Stale sync lock detected. Overriding...");
      }
    }

    // Acquire the lock
    await lockRef.set({
      isActive: true,
      lockedAt: new Date().toISOString(),
      lockedBy: "runSync",
    });
    console.log("Sync lock acquired successfully.");
  } catch (lockErr) {
    console.error("Failed to check/acquire sync lock:", lockErr);
  }

  const summaries: Record<string, { success: boolean; count: number; error?: string | null }> = {};
  const freshScrapedEvents: Event[] = [];
  let browser: any = null;

  try {
    if (playwrightAvailable) {
      try {
        console.log("Launching shared Playwright browser instance...");
        const { chromium } = await import("playwright");
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
      } catch (browserErr) {
        console.error("Failed to launch Playwright browser:", browserErr);
        playwrightAvailable = false;
      }
    }

    const sourcesToPreserve: string[] = [];

    // 1. Run Devfolio (Playwright)
    if (playwrightAvailable) {
      try {
        console.log("Crawling Devfolio Hackathons (in-memory)...");
        const { syncDevfolioEvents } = await import("@/lib/scrapers/devfolio");
        const res = await syncDevfolioEvents({ writeToDb: false, browser });
        summaries["Devfolio"] = { success: res.success, count: res.count || 0, error: res.error || null };
        if (res.success && res.events) {
          freshScrapedEvents.push(...res.events);
        } else {
          sourcesToPreserve.push("devfolio");
        }
      } catch (err: any) {
        console.error("Devfolio Sync failed:", err);
        summaries["Devfolio"] = { success: false, count: 0, error: String(err) };
        sourcesToPreserve.push("devfolio");
      }
    } else {
      summaries["Devfolio"] = { success: false, count: 0, error: "Playwright browser not available." };
      sourcesToPreserve.push("devfolio");
    }

    // 2. Run MLH (Playwright)
    if (playwrightAvailable) {
      try {
        console.log("Crawling MLH Hackathons (in-memory)...");
        const { syncMLHEvents } = await import("@/lib/scrapers/mlh");
        const res = await syncMLHEvents({ writeToDb: false, browser });
        summaries["MLH"] = { success: res.success, count: res.count || 0, error: res.error || null };
        if (res.success && res.events) {
          freshScrapedEvents.push(...res.events);
        } else {
          sourcesToPreserve.push("mlh");
        }
      } catch (err: any) {
        console.error("MLH Sync failed:", err);
        summaries["MLH"] = { success: false, count: 0, error: String(err) };
        sourcesToPreserve.push("mlh");
      }
    } else {
      summaries["MLH"] = { success: false, count: 0, error: "Playwright browser not available." };
      sourcesToPreserve.push("mlh");
    }

    // 3. Run GDG (Playwright)
    if (playwrightAvailable) {
      try {
        console.log("Crawling GDG Events (in-memory)...");
        const { syncGDGEvents } = await import("@/lib/scrapers/gdg");
        const res = await syncGDGEvents({ writeToDb: false, browser });
        summaries["GDG"] = { success: res.success, count: res.count || 0, error: res.error || null };
        if (res.success && res.events) {
          freshScrapedEvents.push(...res.events);
        } else {
          sourcesToPreserve.push("gdg");
        }
      } catch (err: any) {
        console.error("GDG Sync failed:", err);
        summaries["GDG"] = { success: false, count: 0, error: String(err) };
        sourcesToPreserve.push("gdg");
      }
    } else {
      summaries["GDG"] = { success: false, count: 0, error: "Playwright browser not available." };
      sourcesToPreserve.push("gdg");
    }

    // 4. Run Unstop (Playwright)
    if (playwrightAvailable) {
      try {
        console.log("Crawling Unstop Competitions (in-memory)...");
        const { syncUnstopEvents } = await import("@/lib/scrapers/unstop");
        const res = await syncUnstopEvents({ writeToDb: false, browser });
        summaries["Unstop"] = { success: res.success, count: res.count || 0, error: res.error || null };
        if (res.success && res.events) {
          freshScrapedEvents.push(...res.events);
        } else {
          sourcesToPreserve.push("unstop");
        }
      } catch (err: any) {
        console.error("Unstop Sync failed:", err);
        summaries["Unstop"] = { success: false, count: 0, error: String(err) };
        sourcesToPreserve.push("unstop");
      }
    } else {
      summaries["Unstop"] = { success: false, count: 0, error: "Playwright browser not available." };
      sourcesToPreserve.push("unstop");
    }

    // 5. Run HackerEarth (Playwright)
    if (playwrightAvailable) {
      try {
        console.log("Crawling HackerEarth Challenges (in-memory)...");
        const { syncHackerEarthEvents } = await import("@/lib/scrapers/hackerearth");
        const res = await syncHackerEarthEvents({ writeToDb: false, browser });
        summaries["HackerEarth"] = { success: res.success, count: res.count || 0, error: res.error || null };
        if (res.success && res.events) {
          freshScrapedEvents.push(...res.events);
        } else {
          sourcesToPreserve.push("hackerearth");
        }
      } catch (err: any) {
        console.error("HackerEarth Sync failed:", err);
        summaries["HackerEarth"] = { success: false, count: 0, error: String(err) };
        sourcesToPreserve.push("hackerearth");
      }
    } else {
      summaries["HackerEarth"] = { success: false, count: 0, error: "Playwright browser not available." };
      sourcesToPreserve.push("hackerearth");
    }

    // 6. Run Luma (Playwright)
    if (playwrightAvailable) {
      try {
        console.log("Crawling Luma Events (in-memory)...");
        const { syncLumaEvents } = await import("@/lib/scrapers/luma");
        const res = await syncLumaEvents({ writeToDb: false, browser });
        summaries["Luma"] = { success: res.success, count: res.count || 0, error: res.error || null };
        if (res.success && res.events) {
          freshScrapedEvents.push(...res.events);
        } else {
          sourcesToPreserve.push("luma");
        }
      } catch (err: any) {
        console.error("Luma Sync failed:", err);
        summaries["Luma"] = { success: false, count: 0, error: String(err) };
        sourcesToPreserve.push("luma");
      }
    } else {
      summaries["Luma"] = { success: false, count: 0, error: "Playwright browser not available." };
      sourcesToPreserve.push("luma");
    }

    // 7. Run Meetup (Playwright)
    if (playwrightAvailable) {
      try {
        console.log("Crawling Meetup Tech Events (in-memory)...");
        const { syncMeetupEvents } = await import("@/lib/scrapers/meetup");
        const res = await syncMeetupEvents({ writeToDb: false, browser });
        summaries["Meetup"] = { success: res.success, count: res.count || 0, error: res.error || null };
        if (res.success && res.events) {
          freshScrapedEvents.push(...res.events);
        } else {
          sourcesToPreserve.push("meetup");
        }
      } catch (err: any) {
        console.error("Meetup Sync failed:", err);
        summaries["Meetup"] = { success: false, count: 0, error: String(err) };
        sourcesToPreserve.push("meetup");
      }
    } else {
      summaries["Meetup"] = { success: false, count: 0, error: "Playwright browser not available." };
      sourcesToPreserve.push("meetup");
    }

    // 8. Run Eventbrite (API - No Playwright dependency)
    try {
      console.log("Crawling Eventbrite Catalog (in-memory)...");
      const res = await syncEventbriteEvents({ writeToDb: false });
      summaries["Eventbrite"] = { success: res.success, count: res.count || 0, error: res.error || null };
      if (res.success && res.events) {
        freshScrapedEvents.push(...res.events);
      } else {
        sourcesToPreserve.push("eventbrite");
      }
    } catch (err: any) {
      console.error("Eventbrite Sync failed:", err);
      summaries["Eventbrite"] = { success: false, count: 0, error: String(err) };
      sourcesToPreserve.push("eventbrite");
    }

    // 9. Run BookMyShow (Experimental - Gated behind flag)
    if (options.runBms) {
      if (playwrightAvailable) {
        try {
          console.log("Crawling BookMyShow Events (in-memory)...");
          const { syncBMSEvents } = await import("@/lib/scrapers/bookmyshow");
          const res = await syncBMSEvents({ writeToDb: false, browser });
          summaries["BookMyShow"] = { success: res.success, count: res.count || 0, error: res.error || null };
          if (res.success && res.events) {
            freshScrapedEvents.push(...res.events);
          } else {
            sourcesToPreserve.push("bookmyshow");
          }
        } catch (err: any) {
          console.error("BookMyShow Sync failed:", err);
          summaries["BookMyShow"] = { success: false, count: 0, error: String(err) };
          sourcesToPreserve.push("bookmyshow");
        }
      } else {
        summaries["BookMyShow"] = { success: false, count: 0, error: "Playwright browser not available." };
        sourcesToPreserve.push("bookmyshow");
      }
    }

    // 10. Run AllEvents (HTTP - No Playwright dependency)
    try {
      console.log("Crawling AllEvents.in (in-memory)...");
      const res = await syncAllEvents({ writeToDb: false });
      summaries["AllEvents"] = { success: res.success, count: res.count || 0, error: null };
      if (res.success && res.events) {
        freshScrapedEvents.push(...res.events);
      } else {
        sourcesToPreserve.push("allevents");
      }
    } catch (err: any) {
      console.error("AllEvents Sync failed:", err);
      summaries["AllEvents"] = { success: false, count: 0, error: String(err) };
      sourcesToPreserve.push("allevents");
    }

    console.log(`Aggregated ${freshScrapedEvents.length} raw events in-memory. Starting cross-source deduplication...`);

    // ─── Deduplicate and Merge Scraped Events ───
    const mergedScrapedEvents: Map<string, Event> = new Map();

    for (const event of freshScrapedEvents) {
      let matchedCanonicalId: string | null = null;
      
      for (const [canonicalId, mergedEvent] of mergedScrapedEvents.entries()) {
        const isUrlMatch = event.registrationUrl === mergedEvent.registrationUrl || 
                           (event.sourceUrls && mergedEvent.sourceUrls && 
                            Object.values(event.sourceUrls).some(u => Object.values(mergedEvent.sourceUrls!).includes(u)));
        
        const isTitleDateMatch = getJaccardSimilarity(event.title, mergedEvent.title) >= 0.7 && 
                                 event.date === mergedEvent.date;
                                 
        if (isUrlMatch || isTitleDateMatch) {
          matchedCanonicalId = canonicalId;
          break;
        }
      }
      
      if (matchedCanonicalId) {
        const target = mergedScrapedEvents.get(matchedCanonicalId)!;
        mergeTwoEvents(target, event);
      } else {
        const canonicalId = getCanonicalId(event.title, event.date);
        const newMergedEvent: Event = {
          ...event,
          id: canonicalId,
          sources: event.sources || (event.source ? [event.source] : []),
          sourceUrls: event.sourceUrls || (event.source ? { [event.source]: event.registrationUrl } : {}),
          status: "active",
        };
        mergedScrapedEvents.set(canonicalId, newMergedEvent);
      }
    }

    console.log(`Deduplicated down to ${mergedScrapedEvents.size} canonical events in-memory.`);

    // Filter out completed events from scraped events so we don't save them
    const todayStr = new Date().toISOString().split("T")[0];
    for (const [canonicalId, freshEvent] of mergedScrapedEvents.entries()) {
      const targetDate = freshEvent.expiresAt || freshEvent.date;
      if (targetDate && targetDate < todayStr) {
        mergedScrapedEvents.delete(canonicalId);
      }
    }

    // ─── Fetch existing events from Firestore ───
    console.log("Fetching existing events from Firestore...");
    const dbEventsSnapshot = await adminDb.collection("events").select(
      "registrationUrl", "sourceUrls", "title", "date", "status", 
      "viewsCount", "savesCount", "registrationsCount", "popularityScore", 
      "embedding", "contentHash", "createdAt", "lastUpdated", "source", "expiresAt"
    ).get();
    const existingEvents = dbEventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));

    const dbEventsToProcess = [...existingEvents];
    const eventsToUpdate: Event[] = [];
    const docIdsToDelete: string[] = [];
    let skipCount = 0;

    for (const [canonicalId, freshEvent] of mergedScrapedEvents.entries()) {
      const matchingDbEvents = dbEventsToProcess.filter(dbEvent => {
        const isIdMatch = dbEvent.id === canonicalId;
        const isUrlMatch = dbEvent.registrationUrl === freshEvent.registrationUrl || 
                           (dbEvent.sourceUrls && freshEvent.sourceUrls && 
                            Object.values(dbEvent.sourceUrls).some(u => Object.values(freshEvent.sourceUrls!).includes(u)));
        const isTitleDateMatch = getJaccardSimilarity(dbEvent.title, freshEvent.title) >= 0.7 && 
                                 dbEvent.date === freshEvent.date;
        return isIdMatch || isUrlMatch || isTitleDateMatch;
      });

      if (matchingDbEvents.length > 0) {
        let viewsCount = 0;
        let savesCount = 0;
        let registrationsCount = 0;
        let popularityScore = 0;
        let embedding: number[] | undefined = undefined;

        for (const dbEvent of matchingDbEvents) {
          viewsCount = Math.max(viewsCount, dbEvent.viewsCount || 0);
          savesCount = Math.max(savesCount, dbEvent.savesCount || 0);
          registrationsCount = Math.max(registrationsCount, dbEvent.registrationsCount || 0);
          popularityScore = Math.max(popularityScore, dbEvent.popularityScore || 0);
          if (dbEvent.embedding) {
            embedding = dbEvent.embedding;
          }
          if (dbEvent.id !== canonicalId) {
            docIdsToDelete.push(dbEvent.id);
          }
        }

        freshEvent.viewsCount = viewsCount;
        freshEvent.savesCount = savesCount;
        freshEvent.registrationsCount = registrationsCount;
        freshEvent.popularityScore = popularityScore;
        if (embedding) {
          freshEvent.embedding = embedding;
        }

        const newHash = calculateContentHash(freshEvent);
        freshEvent.contentHash = newHash;

        const primaryDbEvent = matchingDbEvents.find(e => e.id === canonicalId);
        if (primaryDbEvent && primaryDbEvent.contentHash === newHash && primaryDbEvent.status === "active") {
          skipCount++;
        } else {
          freshEvent.lastUpdated = new Date().toISOString();
          freshEvent.createdAt = primaryDbEvent?.createdAt || primaryDbEvent?.lastUpdated || new Date().toISOString();
          freshEvent.status = "active";
          eventsToUpdate.push(freshEvent);
        }

        matchingDbEvents.forEach(dbEvent => {
          const idx = dbEventsToProcess.findIndex(e => e.id === dbEvent.id);
          if (idx !== -1) {
            dbEventsToProcess.splice(idx, 1);
          }
        });
      } else {
        freshEvent.status = "active";
        freshEvent.contentHash = calculateContentHash(freshEvent);
        freshEvent.lastUpdated = new Date().toISOString();
        freshEvent.createdAt = new Date().toISOString();
        eventsToUpdate.push(freshEvent);
      }
    }

    // ─── Delete events not found in crawl / completed events ───
    const activeDbEventsCount = existingEvents.filter(e => e.status === "active").length;

    if (mergedScrapedEvents.size === 0 && activeDbEventsCount > 0) {
      console.warn(`Safety Threshold Triggered: Scrapers returned 0 events, but there are ${activeDbEventsCount} active events in the database. Skipping expiration sweep to prevent accidental data loss.`);
    } else {
      for (const dbEvent of dbEventsToProcess) {
        const eventSource = (dbEvent.source || "").toLowerCase();
        if (sourcesToPreserve.includes(eventSource)) {
          // Skip expiration sweep for failed/empty scrapers
          continue;
        }

        // Hard prune stale missing events immediately
        docIdsToDelete.push(dbEvent.id);
      }
    }

    // ─── Query and prune any existing expired events ───
    const expiredSnapshot = await adminDb.collection("events")
      .where("status", "==", "expired")
      .get();

    for (const docSnapshot of expiredSnapshot.docs) {
      docIdsToDelete.push(docSnapshot.id);
    }

    // ─── Batch DB execution ───
    const BATCH_SIZE = 500;
    
    // Deletes
    for (let i = 0; i < docIdsToDelete.length; i += BATCH_SIZE) {
      const chunk = docIdsToDelete.slice(i, i + BATCH_SIZE);
      const batch = adminDb.batch();
      for (const id of chunk) {
        batch.delete(adminDb.collection("events").doc(id));
      }
      await batch.commit();
      console.log(`Batch deleted ${chunk.length} stale/duplicate/expired documents.`);
    }

    // Writes for fresh/updated events (Full overwrite)
    for (let i = 0; i < eventsToUpdate.length; i += BATCH_SIZE) {
      const chunk = eventsToUpdate.slice(i, i + BATCH_SIZE);
      const batch = adminDb.batch();
      for (const event of chunk) {
        batch.set(adminDb.collection("events").doc(event.id), event);
      }
      await batch.commit();
      console.log(`Batch wrote/updated ${chunk.length} fresh event documents.`);
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    const totalSuccessfulScrapers = Object.values(summaries).filter((s) => s.success).length;

    // Write unified telemetry scrape log
    try {
      await adminDb.collection("scrape_logs").add({
        source: "Unified Sync All",
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        successCount: eventsToUpdate.length,
        skipCount,
        expiredCount: 0,
        prunedCount: docIdsToDelete.length,
        deletedDuplicatesCount: docIdsToDelete.length,
        duration,
        status: totalSuccessfulScrapers === Object.keys(summaries).length ? "success" : "partial_success",
        details: summaries,
      });
      console.log("Unified Telemetry recorded in Firestore.");
    } catch (logErr) {
      console.error("Unified telemetry logging failed:", logErr);
    }

    // Trigger embeddings sync and reload on recommendation server
    await triggerRecommendationRefresh();

    return {
      success: true,
      message: `Successfully completed ingest pipeline.`,
      stats: {
        totalScraped: freshScrapedEvents.length,
        deduplicatedScraped: mergedScrapedEvents.size,
        writtenUpdates: eventsToUpdate.length,
        skippedWrites: skipCount,
        newlyExpired: 0,
        prunedExpired: docIdsToDelete.length,
        deletedDuplicates: docIdsToDelete.length,
        durationSeconds: duration,
      },
      summaries,
    };
  } finally {
    if (browser) {
      console.log("Closing shared Playwright browser instance...");
      await browser.close().catch((err: any) => console.error("Error closing shared browser:", err));
    }
    // ─── Release the concurrency lock ───
    try {
      await lockRef.set({
        isActive: false,
        releasedAt: new Date().toISOString(),
        lastCompletedBy: "runSync",
      });
      console.log("Sync lock released successfully.");
    } catch (releaseLockErr) {
      console.error("Failed to release sync lock:", releaseLockErr);
    }
  }
}
