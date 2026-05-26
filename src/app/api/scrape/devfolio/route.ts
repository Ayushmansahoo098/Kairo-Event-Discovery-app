import { NextResponse } from "next/server";
import { syncDevfolioEvents } from "@/lib/scrapers/devfolio";

// Set dynamic configuration to ensure this runs server-side on request without static caching
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    console.log("API Route triggered: Scrape Devfolio hackathons...");
    const result = await syncDevfolioEvents();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully synchronized ${result.count} hackathons from Devfolio.`,
        count: result.count,
        events: result.events?.map((e: any) => ({ id: e.id, title: e.title, city: e.city })),
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
    console.error("Scraper API Route failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to trigger scraper sync process",
      },
      { status: 500 }
    );
  }
}
