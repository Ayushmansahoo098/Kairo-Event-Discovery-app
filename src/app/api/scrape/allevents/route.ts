import { NextResponse } from "next/server";
import { syncAllEvents } from "@/lib/scrapers/allevents";

export async function GET(req: Request) {
  try {
    const res = await syncAllEvents();
    return NextResponse.json({ success: true, data: res });
  } catch (error: any) {
    console.error("AllEvents manual sync failed:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
