import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Kairo — Next.js Edge Middleware for Admin Route Protection.
 *
 * Protects:
 *  - /admin/*     (observability dashboard, admin tools)
 *  - /api/sync/*  (scraper sync triggers)
 *  - /api/scrape/* (individual scraper triggers)
 *
 * Authorization Methods:
 *  1. Session Cookie: `kairo_user_email` set by the client-side AuthProvider on login.
 *     The cookie value must match `ADMIN_EMAIL` env var.
 *  2. Cron Secret Header: `x-kairo-sync-key` must match `CRON_SECRET` env var.
 *     This allows automated cron jobs (e.g., Vercel Cron) to trigger syncs without browser auth.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only gate admin and sync API routes
  const isAdminRoute = pathname.startsWith("/admin");
  const isSyncRoute = pathname.startsWith("/api/sync") || pathname.startsWith("/api/scrape");

  if (!isAdminRoute && !isSyncRoute) {
    return NextResponse.next();
  }

  const adminEmail = process.env.ADMIN_EMAIL || "";
  const cronSecret = process.env.CRON_SECRET || "";

  // --- Method 1: Check for programmatic cron secret header (API routes only) ---
  if (isSyncRoute && cronSecret) {
    const requestSecret = request.headers.get("x-kairo-sync-key");
    if (requestSecret === cronSecret) {
      return NextResponse.next(); // Authorized cron caller
    }
  }

  // --- Method 2: Check for session cookie (browser admin users) ---
  const userEmail = request.cookies.get("kairo_user_email")?.value;

  if (!userEmail) {
    // Not authenticated at all — redirect to login page for admin routes,
    // return 401 for API routes
    if (isAdminRoute) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.json(
      { success: false, message: "Unauthorized. Authentication required." },
      { status: 401 }
    );
  }

  // Check if the authenticated user is in the admin whitelist
  if (adminEmail) {
    const allowedEmails = adminEmail.split(",").map((e) => e.trim().toLowerCase());
    if (!allowedEmails.includes(userEmail.toLowerCase())) {
      // User is authenticated but NOT an admin
      if (isAdminRoute) {
        const homeUrl = new URL("/", request.url);
        return NextResponse.redirect(homeUrl);
      }
      return NextResponse.json(
        { success: false, message: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
  }

  // Authorized — allow through
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/sync/:path*", "/api/scrape/:path*"],
};
