import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { 
      success: false, 
      message: "Individual scraper endpoints are deprecated. Please use the manual sync fallback (/api/sync/all) or the GitHub Actions workflow." 
    },
    { status: 410 }
  );
}
