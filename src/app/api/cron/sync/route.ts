import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron Proxy — triggered on schedule, calls the Railway scraper worker.
 * This avoids running Playwright inside Vercel's serverless functions.
 */
export async function GET(request: Request) {
  // Verify this is a legitimate Vercel Cron invocation
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workerUrl = process.env.RAILWAY_WORKER_URL;

  if (!workerUrl) {
    console.error("RAILWAY_WORKER_URL is not configured.");
    return NextResponse.json(
      { success: false, message: "Worker URL not configured" },
      { status: 500 }
    );
  }

  try {
    console.log("Cron triggered: calling Railway scraper worker...");
    const res = await fetch(`${workerUrl}/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-kairo-sync-key": cronSecret || "",
      },
    });

    const data = await res.json();
    console.log("Railway worker response:", data);

    return NextResponse.json({
      success: true,
      message: "Cron sync triggered via Railway worker",
      workerResponse: data,
    });
  } catch (error: any) {
    console.error("Cron sync failed:", error);
    return NextResponse.json(
      { success: false, message: String(error) },
      { status: 500 }
    );
  }
}
