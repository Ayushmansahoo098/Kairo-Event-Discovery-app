import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync/runSync";

export const dynamic = "force-dynamic";

export async function POST() {
  console.log("Manual Sync Fallback API Route `/api/sync/all` Triggered...");
  try {
    const runBms = process.env.ENABLE_EXPERIMENTAL_BMS === "true";
    const result = await runSync({ runBms });
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    console.error("Manual Sync Fallback API Route failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to trigger sync fallback process." },
      { status: 500 }
    );
  }
}
