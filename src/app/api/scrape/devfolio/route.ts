import { NextResponse } from "next/server";
import { syncDevfolioEvents } from "@/lib/scrapers/devfolio";
import { Event } from "@/lib/types";
import { triggerEmbeddingsSync } from "@/lib/recommendations";


// Set dynamic configuration to ensure this runs server-side on request without static caching
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    console.log("API Route triggered: Scrape Devfolio hackathons...");
    const result = await syncDevfolioEvents();

    if (result.success) {
      await triggerEmbeddingsSync();
      return NextResponse.json({
        success: true,
        message: `Successfully synchronized ${result.count} hackathons from Devfolio.`,
        count: result.count,
        events: result.events?.map((e: Event) => ({ id: e.id, title: e.title, city: e.city })),
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
    console.error("Scraper API Route failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to trigger scraper sync process";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
