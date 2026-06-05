import { NextResponse } from "next/server";
import { syncUnstopEvents } from "@/lib/scrapers/unstop";
import { Event } from "@/lib/types";

// Set dynamic configuration to ensure this runs server-side on request without static caching
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    console.log("API Route triggered: Scrape Unstop events...");
    const result = await syncUnstopEvents();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully synchronized ${result.count} events from Unstop.`,
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
    console.error("Unstop Scraper API Route failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to trigger Unstop scraper sync process";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
