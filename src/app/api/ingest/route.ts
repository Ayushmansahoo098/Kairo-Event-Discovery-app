import { NextResponse } from "next/server";
import { syncEventbriteEvents } from "@/lib/scrapers/eventbrite";

// Set dynamic configuration to ensure this runs server-side on request without static caching
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await syncEventbriteEvents();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully synchronized ${result.count} events from Eventbrite.`,
        count: result.count,
        failureCount: result.failureCount,
        cleanupCount: result.cleanupCount,
        duration: result.duration,
        events: result.events?.map((e: any) => ({ id: e.id, title: e.title, category: e.category })),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Eventbrite ingestion completed with an unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Eventbrite Ingestion API Route failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to trigger Eventbrite ingestion process",
      },
      { status: 500 }
    );
  }
}
