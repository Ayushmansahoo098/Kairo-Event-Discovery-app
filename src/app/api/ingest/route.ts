import { NextResponse } from "next/server";
import { syncEventbriteEvents } from "@/lib/scrapers/eventbrite";
import { Event } from "@/lib/types";
import { triggerEmbeddingsSync } from "@/lib/recommendations";


// Set dynamic configuration to ensure this runs server-side on request without static caching
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await syncEventbriteEvents();

    if (result.success) {
      await triggerEmbeddingsSync();
      return NextResponse.json({
        success: true,
        message: `Successfully synchronized ${result.count} events from Eventbrite.`,
        count: result.count,
        failureCount: result.failureCount,
        cleanupCount: result.cleanupCount,
        duration: result.duration,
        events: result.events?.map((e: Event) => ({ id: e.id, title: e.title, category: e.category })),
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
  } catch (error: unknown) {
    console.error("Eventbrite Ingestion API Route failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to trigger Eventbrite ingestion process";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
