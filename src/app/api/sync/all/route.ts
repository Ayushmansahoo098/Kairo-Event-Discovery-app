import { NextResponse } from "next/server";
import { syncDevfolioEvents } from "@/lib/scrapers/devfolio";
import { syncUnstopEvents } from "@/lib/scrapers/unstop";
import { syncHackerEarthEvents } from "@/lib/scrapers/hackerearth";
import { syncEventbriteEvents } from "@/lib/scrapers/eventbrite";
import { adminDb } from "@/lib/firebase-admin";

// Set dynamic configuration to ensure this runs server-side on request without static caching
export const dynamic = "force-dynamic";

// Maximum lock age in ms before considering it stale (20 minutes)
const LOCK_STALE_THRESHOLD_MS = 20 * 60 * 1000;

export async function POST() {
  const startTime = Date.now();
  console.log("Unified Synchronizer API Route Triggered: Running all ingestions sequentially...");

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
    // Continue anyway — lock mechanism is best-effort
  }

  const summaries: Record<string, any> = {};
  let totalSynced = 0;
  let totalFailures = 0;
  let totalCleaned = 0;

  try {
    // 1. Run Devfolio Playwright Scraper
    try {
      console.log("Ingesting Devfolio Hackathons...");
      const res = await syncDevfolioEvents();
      summaries["Devfolio"] = {
        success: res.success,
        count: res.count || 0,
        error: res.error || null,
      };
      totalSynced += res.count || 0;
    } catch (err: any) {
      console.error("Devfolio Sync failed inside unified runner:", err);
      summaries["Devfolio"] = { success: false, count: 0, error: String(err) };
      totalFailures++;
    }

    // 2. Run Unstop Playwright Scraper
    try {
      console.log("Ingesting Unstop Competitions...");
      const res = await syncUnstopEvents();
      summaries["Unstop"] = {
        success: res.success,
        count: res.count || 0,
        cleanupCount: res.cleanupCount || 0,
        error: res.error || null,
      };
      totalSynced += res.count || 0;
      totalCleaned += res.cleanupCount || 0;
    } catch (err: any) {
      console.error("Unstop Sync failed inside unified runner:", err);
      summaries["Unstop"] = { success: false, count: 0, error: String(err) };
      totalFailures++;
    }

    // 3. Run HackerEarth Playwright Scraper
    try {
      console.log("Ingesting HackerEarth Challenges...");
      const res = await syncHackerEarthEvents();
      summaries["HackerEarth"] = {
        success: res.success,
        count: res.count || 0,
        cleanupCount: res.cleanupCount || 0,
        error: res.error || null,
      };
      totalSynced += res.count || 0;
      totalCleaned += res.cleanupCount || 0;
    } catch (err: any) {
      console.error("HackerEarth Sync failed inside unified runner:", err);
      summaries["HackerEarth"] = { success: false, count: 0, error: String(err) };
      totalFailures++;
    }

    // 4. Run Eventbrite poller API
    try {
      console.log("Ingesting Eventbrite Catalog...");
      const res = await syncEventbriteEvents();
      summaries["Eventbrite"] = {
        success: res.success,
        count: res.count || 0,
        cleanupCount: res.cleanupCount || 0,
        error: res.error || null,
      };
      totalSynced += res.count || 0;
      totalCleaned += res.cleanupCount || 0;
    } catch (err: any) {
      console.error("Eventbrite Sync failed inside unified runner:", err);
      summaries["Eventbrite"] = { success: false, count: 0, error: String(err) };
      totalFailures++;
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    // Write dynamic Telemetry entry for unified job sync
    try {
      await adminDb.collection("scrape_logs").add({
        source: "Unified Sync All",
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        successCount: totalSynced,
        failureCount: totalFailures,
        cleanupCount: totalCleaned,
        duration,
        status: totalFailures === 0 ? "success" : "partial_success",
        details: summaries,
      });
      console.log("Unified Telemetry recorded in Firestore.");
    } catch (logErr) {
      console.error("Unified telemetry logging failed:", logErr);
    }

    return NextResponse.json({
      success: true,
      message: `Sequentially completed all ingestions in ${duration} seconds.`,
      totalEventsSynced: totalSynced,
      cleanupCounts: totalCleaned,
      durationSeconds: duration,
      status: totalFailures === 0 ? "success" : "partial_success",
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
