import { NextResponse } from "next/server";
import { syncDevfolioEvents } from "@/lib/scrapers/devfolio";
import { syncUnstopEvents } from "@/lib/scrapers/unstop";
import { syncHackerEarthEvents } from "@/lib/scrapers/hackerearth";
import { syncEventbriteEvents } from "@/lib/scrapers/eventbrite";
import { syncMeetupEvents } from "@/lib/scrapers/meetup";
import { adminDb } from "@/lib/firebase-admin";
import { Event } from "@/lib/types";
import crypto from "crypto";
import { triggerEmbeddingsSync } from "@/lib/recommendations";


export const dynamic = "force-dynamic";

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
  if (s.includes("unstop")) return 8;
  if (s.includes("hackerearth")) return 7;
  if (s.includes("eventbrite")) return 5;
  if (s.includes("meetup")) return 4;
  return 0;
}

function getCanonicalId(title: string, date: string): string {
  const slug = title.toLowerCase()
    .replace(/^(devfolio|unstop|hackerearth|eventbrite|meetup)\s+/i, "")
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

export async function POST() {
  const startTime = Date.now();
  console.log("Unified Synchronizer API Route Triggered: Running all ingestions sequentially in-memory...");

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
          return NextResponse.json(
            {
              success: false,
              message: "A sync job is currently in progress. Please try again later.",
              lockedAt: lockData.lockedAt,
              lockAgeSeconds: Math.round(lockAge / 1000),
            },
            { status: 409 }
          );
        }
        console.warn("Stale sync lock detected (older than 20 minutes). Overriding...");
      }
    }

    // Acquire the lock
    await lockRef.set({
      isActive: true,
      lockedAt: new Date().toISOString(),
      lockedBy: "api/sync/all",
    });
    console.log("Sync lock acquired successfully.");
  } catch (lockErr) {
    console.error("Failed to check/acquire sync lock:", lockErr);
  }

  const summaries: Record<string, { success: boolean; count: number; error?: string }> = {};
  const freshScrapedEvents: Event[] = [];

  try {
    // 1. Run Devfolio
    try {
      console.log("Crawling Devfolio Hackathons (in-memory)...");
      const res = await syncDevfolioEvents({ writeToDb: false });
      summaries["Devfolio"] = {
        success: res.success,
        count: res.count || 0,
        error: res.error,
      };
      if (res.success && res.events) {
        freshScrapedEvents.push(...res.events);
      }
    } catch (err: unknown) {
      console.error("Devfolio Sync failed inside unified runner:", err);
      summaries["Devfolio"] = { success: false, count: 0, error: String(err) };
    }

    // 2. Run Unstop
    try {
      console.log("Crawling Unstop Competitions (in-memory)...");
      const res = await syncUnstopEvents({ writeToDb: false });
      summaries["Unstop"] = {
        success: res.success,
        count: res.count || 0,
        error: res.error,
      };
      if (res.success && res.events) {
        freshScrapedEvents.push(...res.events);
      }
    } catch (err: unknown) {
      console.error("Unstop Sync failed inside unified runner:", err);
      summaries["Unstop"] = { success: false, count: 0, error: String(err) };
    }

    // 3. Run HackerEarth
    try {
      console.log("Crawling HackerEarth Challenges (in-memory)...");
      const res = await syncHackerEarthEvents({ writeToDb: false });
      summaries["HackerEarth"] = {
        success: res.success,
        count: res.count || 0,
        error: res.error,
      };
      if (res.success && res.events) {
        freshScrapedEvents.push(...res.events);
      }
    } catch (err: unknown) {
      console.error("HackerEarth Sync failed inside unified runner:", err);
      summaries["HackerEarth"] = { success: false, count: 0, error: String(err) };
    }

    // 4. Run Eventbrite
    try {
      console.log("Crawling Eventbrite Catalog (in-memory)...");
      const res = await syncEventbriteEvents({ writeToDb: false });
      summaries["Eventbrite"] = {
        success: res.success,
        count: res.count || 0,
        error: res.error,
      };
      if (res.success && res.events) {
        freshScrapedEvents.push(...res.events);
      }
    } catch (err: unknown) {
      console.error("Eventbrite Sync failed inside unified runner:", err);
      summaries["Eventbrite"] = { success: false, count: 0, error: String(err) };
    }

    // 5. Run Meetup
    try {
      console.log("Crawling Meetup Tech Events (in-memory)...");
      const res = await syncMeetupEvents({ writeToDb: false });
      summaries["Meetup"] = {
        success: res.success,
        count: res.count || 0,
        error: res.error,
      };
      if (res.success && res.events) {
        freshScrapedEvents.push(...res.events);
      }
    } catch (err: unknown) {
      console.error("Meetup Sync failed inside unified runner:", err);
      summaries["Meetup"] = { success: false, count: 0, error: String(err) };
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

    // ─── Fetch existing events from Firestore ───
    console.log("Fetching existing events from Firestore...");
    const dbEventsSnapshot = await adminDb.collection("events").get();
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
        // We found matches! Preserve dynamic telemetry and compute merged counts.
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
        // New event!
        freshEvent.status = "active";
        freshEvent.contentHash = calculateContentHash(freshEvent);
        freshEvent.lastUpdated = new Date().toISOString();
        eventsToUpdate.push(freshEvent);
      }
    }

    // ─── Expire events not found in crawl ───
    const newlyExpiredEvents: Event[] = [];
    const activeDbEventsCount = existingEvents.filter(e => e.status === "active").length;

    if (mergedScrapedEvents.size === 0 && activeDbEventsCount > 0) {
      console.warn(`Safety Threshold Triggered: Scrapers returned 0 events, but there are ${activeDbEventsCount} active events in the database. Skipping expiration sweep to prevent accidental data loss.`);
    } else {
      for (const dbEvent of dbEventsToProcess) {
        if (dbEvent.status === "active") {
          newlyExpiredEvents.push({
            ...dbEvent,
            status: "expired",
            expiredAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          });
        }
      }
    }

    // ─── Prune expired events older than 30 days ───
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    const expiredSnapshot = await adminDb.collection("events")
      .where("status", "==", "expired")
      .get();

    const docIdsToPrune: string[] = [];
    for (const docSnapshot of expiredSnapshot.docs) {
      const data = docSnapshot.data();
      const expiredAt = data.expiredAt;
      if (expiredAt && expiredAt < thirtyDaysAgoStr) {
        docIdsToPrune.push(docSnapshot.id);
      }
    }

    // ─── Batch DB execution ───
    const BATCH_SIZE = 500;
    
    // Deletes
    const allDeletes = [...docIdsToDelete, ...docIdsToPrune];
    for (let i = 0; i < allDeletes.length; i += BATCH_SIZE) {
      const chunk = allDeletes.slice(i, i + BATCH_SIZE);
      const batch = adminDb.batch();
      for (const id of chunk) {
        batch.delete(adminDb.collection("events").doc(id));
      }
      await batch.commit();
      console.log(`Batch deleted ${chunk.length} stale/duplicate documents.`);
    }

    // Writes
    const allWrites = [...eventsToUpdate, ...newlyExpiredEvents];
    for (let i = 0; i < allWrites.length; i += BATCH_SIZE) {
      const chunk = allWrites.slice(i, i + BATCH_SIZE);
      const batch = adminDb.batch();
      for (const event of chunk) {
        batch.set(adminDb.collection("events").doc(event.id), event);
      }
      await batch.commit();
      console.log(`Batch wrote/updated ${chunk.length} event documents.`);
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
        expiredCount: newlyExpiredEvents.length,
        prunedCount: docIdsToPrune.length,
        deletedDuplicatesCount: docIdsToDelete.length,
        duration,
        status: totalSuccessfulScrapers === Object.keys(summaries).length ? "success" : "partial_success",
        details: summaries,
      });
      console.log("Unified Telemetry recorded in Firestore.");
    } catch (logErr) {
      console.error("Unified telemetry logging failed:", logErr);
    }

    // Trigger embeddings sync on recommendation server
    await triggerEmbeddingsSync();

    return NextResponse.json({
      success: true,
      message: `Successfully completed ingest pipeline.`,
      stats: {
        totalScraped: freshScrapedEvents.length,
        deduplicatedScraped: mergedScrapedEvents.size,
        writtenUpdates: eventsToUpdate.length,
        skippedWrites: skipCount,
        newlyExpired: newlyExpiredEvents.length,
        prunedExpired: docIdsToPrune.length,
        deletedDuplicates: docIdsToDelete.length,
        durationSeconds: duration,
      },
      summaries,
    });
  } finally {
    // ─── Release the concurrency lock ───
    try {
      await lockRef.set({
        isActive: false,
        releasedAt: new Date().toISOString(),
        lastCompletedBy: "api/sync/all",
      });
      console.log("Sync lock released successfully.");
    } catch (releaseLockErr) {
      console.error("Failed to release sync lock:", releaseLockErr);
    }
  }
}
