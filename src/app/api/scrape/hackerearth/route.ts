import { NextResponse } from "next/server";
import { syncHackerEarthEvents } from "@/lib/scrapers/hackerearth";
import { Event } from "@/lib/types";
import { triggerEmbeddingsSync } from "@/lib/recommendations";


// Set dynamic configuration to ensure this runs server-side on request without static caching
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    console.log("API Route triggered: Scrape HackerEarth challenges...");
    const result = await syncHackerEarthEvents();

    if (result.success) {
      await triggerEmbeddingsSync();
      return NextResponse.json({
        success: true,
        message: `Successfully synchronized ${result.count} events from HackerEarth.`,
        count: result.count,
        failureCount: result.failureCount,
        cleanupCount: result.cleanupCount,
        duration: result.duration,
        events: result.events?.map((e: Event) => ({ id: e.id, title: e.title, category: e.category, city: e.city })),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Scraper completed with an unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("HackerEarth Scraper API Route failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to trigger HackerEarth scraper sync process";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
