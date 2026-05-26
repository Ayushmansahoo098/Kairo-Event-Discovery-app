import { NextResponse } from "next/server";
import { syncHackerEarthEvents } from "@/lib/scrapers/hackerearth";

// Set dynamic configuration to ensure this runs server-side on request without static caching
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    console.log("API Route triggered: Scrape HackerEarth challenges...");
    const result = await syncHackerEarthEvents();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully synchronized ${result.count} events from HackerEarth.`,
        count: result.count,
        failureCount: result.failureCount,
        cleanupCount: result.cleanupCount,
        duration: result.duration,
        events: result.events?.map((e: any) => ({ id: e.id, title: e.title, category: e.category, city: e.city })),
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
  } catch (error: any) {
    console.error("HackerEarth Scraper API Route failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to trigger HackerEarth scraper sync process",
      },
      { status: 500 }
    );
  }
}
