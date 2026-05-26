import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Kairo — Next.js Proxy for admin and scraper route protection.
 *
 * Protects:
 *  - /admin/*     (observability dashboard, admin tools)
 *  - /api/sync/*  (scraper sync triggers)
 *  - /api/scrape/* (individual scraper triggers)
 *
 * Authorization methods:
 *  1. Session cookie: `kairo_user_email` set by the client-side AuthProvider on login.
 *     The cookie value must match `ADMIN_EMAIL` env var.
 *  2. Cron secret header: `x-kairo-sync-key` must match `CRON_SECRET` env var.
 *     This allows automated schedulers to trigger syncs without browser auth.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only gate admin and sync API routes.
  const isAdminRoute = pathname.startsWith("/admin");
  const isSyncRoute = pathname.startsWith("/api/sync") || pathname.startsWith("/api/scrape");

  if (!isAdminRoute && !isSyncRoute) {
    return NextResponse.next();
  }

  const adminEmail = process.env.ADMIN_EMAIL || "";
  const cronSecret = process.env.CRON_SECRET || "";

  // Method 1: Check for programmatic cron secret header (API routes only).
  if (isSyncRoute && cronSecret) {
    const requestSecret = request.headers.get("x-kairo-sync-key");
    if (requestSecret === cronSecret) {
      return NextResponse.next();
    }
  }

  // Method 2: Check for session cookie (browser admin users).
  const userEmail = request.cookies.get("kairo_user_email")?.value;

  if (!userEmail) {
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

  if (adminEmail) {
    const allowedEmails = adminEmail.split(",").map((email) => email.trim().toLowerCase());
    if (!allowedEmails.includes(userEmail.toLowerCase())) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/sync/:path*", "/api/scrape/:path*"],
};
