import { chromium, Browser } from "playwright";
import { adminDb } from "./firebase";

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface RawScrapedEvent {
  title: string;
  url: string;
  bannerImage?: string;
  tags?: string[];
  organizer?: string;
  dateText?: string;
  locationText?: string;
  eventType?: string;
}

// ─────────────────────────────────────────────────
// Date Normalization
// ─────────────────────────────────────────────────

function normalizeDate(dateText?: string): string {
  if (!dateText) return new Date().toISOString().split("T")[0];
  try {
    const cleaned = dateText.replace(/\s+/g, " ").trim();
    const match = cleaned.match(/([a-zA-Z]+)\s+(\d+)(?:\s*-\s*\d+)?,\s*(\d{4})/);
    if (match) {
      const [, monthStr, dayStr, yearStr] = match;
      const months: Record<string, string> = {
        jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
        jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
      };
      const month = months[monthStr.toLowerCase().substring(0, 3)] || "06";
      return `${yearStr}-${month}-${dayStr.padStart(2, "0")}`;
    }
  } catch {}
  return new Date().toISOString().split("T")[0];
}

function getCategoryBanner(category: string, image?: string): string {
  if (image && image.startsWith("http")) return image;
  return "/images/hackathon.png";
}

function detectCategory(typeStr: string): string {
  const t = typeStr.toLowerCase();
  if (t.includes("workshop") || t.includes("webinar") || t.includes("conference")) return "workshop";
  if (t.includes("startup") || t.includes("pitch") || t.includes("hiring")) return "startup";
  if (t.includes("meetup")) return "meetup";
  return "hackathon";
}

// ─────────────────────────────────────────────────
// Scraper: Devfolio
// ─────────────────────────────────────────────────

async function scrapeDevfolio(browser: Browser): Promise<RawScrapedEvent[]> {
  console.log("🔵 Scraping Devfolio...");
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    await page.goto("https://devfolio.co/hackathons", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(5000);

    const events = await page.evaluate(() => {
      const list: any[] = [];
      document.querySelectorAll("a").forEach((a: HTMLAnchorElement) => {
        const href = a.href;
        if (!href.includes("/hackathons/") && !(href.includes(".devfolio.co") && !href.includes("devfolio.co/hackathons"))) return;
        const heading = a.querySelector("h2, h3, h4, h5, [class*='title']");
        const title = heading ? heading.textContent?.trim() : a.innerText.trim().split("\n")[0];
        if (!title || title.length < 3 || list.some((i) => i.url === href)) return;
        const img = a.querySelector("img");
        const tags: string[] = [];
        a.querySelectorAll("span").forEach((s: any) => {
          const t = s.textContent?.trim() || "";
          if (t.length > 1 && t.length < 20 && !t.includes("Starts") && !t.includes("Apply")) tags.push(t);
        });
        let dateText = "", locationText = "Online";
        a.innerText.split("\n").map(t => t.trim()).filter(Boolean).forEach(line => {
          if (line.includes("Online") || line.includes("Virtual")) locationText = "Online";
          else if (line.match(/^[a-zA-Z]+ \d+/)) dateText = line;
          else if (line.includes(",") && line.length < 30) locationText = line;
        });
        list.push({ title, url: href, bannerImage: img?.src || "", tags: [...new Set(tags)].slice(0, 4), dateText, locationText, organizer: "Devfolio Host" });
      });
      return list;
    });

    console.log(`   Found ${events.length} Devfolio hackathons`);
    return events;
  } finally {
    await context.close();
  }
}

// ─────────────────────────────────────────────────
// Scraper: Unstop
// ─────────────────────────────────────────────────

async function scrapeUnstop(browser: Browser): Promise<RawScrapedEvent[]> {
  console.log("🟡 Scraping Unstop...");
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    await page.goto("https://unstop.com/hackathons", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(5000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(2000);

    const events = await page.evaluate(() => {
      const list: any[] = [];
      document.querySelectorAll("a").forEach((a: HTMLAnchorElement) => {
        const href = a.href;
        if (!href.includes("/competitions/") && !href.includes("/hackathons/")) return;
        const heading = a.querySelector("h2, h3, h4, h5, [class*='title'], .title");
        const title = heading ? heading.textContent?.trim() : "";
        if (!title || title.length < 3 || list.some((i) => i.url === href)) return;
        const img = a.querySelector("img");
        const tags: string[] = [];
        a.querySelectorAll("span, .badge").forEach((s: any) => {
          const t = s.textContent?.trim() || "";
          if (t.length > 1 && t.length < 25 && !t.includes("Apply") && !t.includes("Register")) tags.push(t);
        });
        let dateText = "", locationText = "Online", eventType = "Hackathon";
        a.innerText.split("\n").map(t => t.trim()).filter(Boolean).forEach(line => {
          const l = line.toLowerCase();
          if (l.includes("online") || l.includes("virtual")) locationText = "Online";
          else if (l.match(/^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/) || l.includes("deadline")) dateText = line;
          else if (l.includes(",") && line.length < 35) locationText = line;
        });
        const ft = tags.find(t => /workshop|competition|quiz|hackathon/i.test(t));
        if (ft) eventType = ft;
        list.push({ title, url: href, bannerImage: img?.src || "", tags: [...new Set(tags)].slice(0, 4), dateText, locationText, eventType, organizer: "Unstop Host" });
      });
      return list;
    });

    console.log(`   Found ${events.length} Unstop events`);
    return events;
  } finally {
    await context.close();
  }
}

// ─────────────────────────────────────────────────
// Scraper: HackerEarth
// ─────────────────────────────────────────────────

async function scrapeHackerEarth(browser: Browser): Promise<RawScrapedEvent[]> {
  console.log("🟢 Scraping HackerEarth...");
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    await page.goto("https://www.hackerearth.com/challenges/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(5000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(2000);

    const events = await page.evaluate(() => {
      const list: any[] = [];
      document.querySelectorAll("a").forEach((a: HTMLAnchorElement) => {
        const href = a.href;
        if (!href.includes("/challenges/") && !href.includes("/challenge/")) return;
        if (href.split("/").filter(Boolean).length < 5) return;
        if (list.some((i) => i.url === href)) return;
        const titleEl = a.querySelector(".challenge-name, h2, h3, h4, [class*='title']");
        const title = titleEl ? titleEl.textContent?.trim() : "";
        if (!title || title.length < 3) return;
        const img = a.querySelector("img");
        const tags: string[] = [];
        a.querySelectorAll("span, [class*='badge']").forEach((s: any) => {
          const t = s.textContent?.trim() || "";
          if (t.length > 1 && t.length < 25 && !t.includes("Apply")) tags.push(t);
        });
        let dateText = "", locationText = "Online", eventType = "Hackathon";
        a.innerText.split("\n").map(t => t.trim()).filter(Boolean).forEach(line => {
          const l = line.toLowerCase();
          if (l.includes("online") || l.includes("virtual")) locationText = "Online";
          else if (l.match(/^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/) || l.includes("ends on")) dateText = line.replace(/Ends on|Starts on/gi, "").trim();
        });
        if (href.includes("/hiring/")) eventType = "Hiring Challenge";
        else if (href.includes("/competitive/")) eventType = "Competitive Programming";
        list.push({ title, url: href, bannerImage: img?.src || "", tags: [...new Set(tags)].slice(0, 4), dateText, locationText, eventType, organizer: "HackerEarth Partner" });
      });
      return list;
    });

    console.log(`   Found ${events.length} HackerEarth events`);
    return events;
  } finally {
    await context.close();
  }
}

// ─────────────────────────────────────────────────
// Scraper: Eventbrite (API — no browser needed)
// ─────────────────────────────────────────────────

async function scrapeEventbrite(): Promise<RawScrapedEvent[]> {
  console.log("🟠 Scraping Eventbrite (API)...");
  const TOKEN = "RML67REZA27DEFDI7GTH";
  const events: RawScrapedEvent[] = [];
  const queries = ["conferences", "startup events", "webinars"];

  for (const query of queries) {
    try {
      const res = await fetch(`https://www.eventbriteapi.com/v3/destination/search/?token=${TOKEN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_search: { q: query } }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const rawEvents = data.events || [];
      for (const raw of rawEvents.slice(0, 5)) {
        events.push({
          title: raw.name,
          url: raw.url,
          bannerImage: "",
          tags: raw.tags?.slice(0, 4).map((t: any) => t.display_name) || [query],
          dateText: raw.start_date || "",
          locationText: raw.is_online_event ? "Online" : "In-Person",
          eventType: query.includes("startup") ? "Startup" : "Workshop",
          organizer: "Eventbrite Organizer",
        });
      }
    } catch (err) {
      console.error(`   Eventbrite query "${query}" failed:`, err);
    }
  }

  console.log(`   Found ${events.length} Eventbrite events`);
  return events;
}

// ─────────────────────────────────────────────────
// Normalize + Batch Write to Firestore
// ─────────────────────────────────────────────────

function normalizeEvent(raw: RawScrapedEvent, source: string) {
  let slug = raw.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  try {
    const urlObj = new URL(raw.url);
    const paths = urlObj.pathname.split("/").filter(Boolean);
    if (paths.length > 0) slug = paths[paths.length - 1];
  } catch {}

  const id = `${source.toLowerCase()}-${slug}`;
  const isOnline = !raw.locationText || /online|virtual/i.test(raw.locationText);
  const category = detectCategory(raw.eventType || "");
  const date = normalizeDate(raw.dateText);

  return {
    id,
    title: raw.title.trim(),
    description: `Join ${raw.title.trim()} on ${source}! A premier ${category} event.`,
    bannerImage: getCategoryBanner(category, raw.bannerImage),
    date,
    time: "09:00 AM",
    location: raw.locationText?.trim() || "Online Event",
    city: isOnline ? "Online" : (raw.locationText?.split(",")[0].trim() || "Bangalore"),
    isOnline,
    category,
    organizer: raw.organizer || `${source} Host`,
    registrationUrl: raw.url,
    tags: raw.tags?.map((t) => t.trim().toLowerCase()) || [source.toLowerCase()],
    isTrending: false,
    source,
    expiresAt: date,
    lastUpdated: new Date().toISOString(),
  };
}

async function batchWriteEvents(events: any[]) {
  if (!adminDb || events.length === 0) return 0;
  const BATCH_SIZE = 500;
  let written = 0;
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const chunk = events.slice(i, i + BATCH_SIZE);
    const batch = adminDb.batch();
    for (const event of chunk) {
      batch.set(adminDb.collection("events").doc(event.id), event);
    }
    await batch.commit();
    written += chunk.length;
  }
  return written;
}

// ─────────────────────────────────────────────────
// Cleanup expired events
// ─────────────────────────────────────────────────

async function cleanupExpired(): Promise<number> {
  if (!adminDb) return 0;
  const todayStr = new Date().toISOString().split("T")[0];
  const snapshot = await adminDb.collection("events").get();
  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const target = data.expiresAt || data.date;
    if (target && target < todayStr) {
      await doc.ref.delete();
      count++;
    }
  }
  return count;
}

// ─────────────────────────────────────────────────
// Main Sync Orchestrator (exported for use by index.ts)
// ─────────────────────────────────────────────────

export async function runFullSync() {
  const startTime = Date.now();
  console.log("\n🚀 Starting full sync...\n");

  const summaries: Record<string, any> = {};
  let totalSynced = 0;

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    // Devfolio
    try {
      const raw = await scrapeDevfolio(browser);
      const normalized = raw.map((r) => normalizeEvent(r, "Devfolio"));
      const count = await batchWriteEvents(normalized);
      summaries["Devfolio"] = { success: true, count };
      totalSynced += count;
    } catch (err: any) {
      summaries["Devfolio"] = { success: false, error: String(err) };
      console.error("Devfolio failed:", err.message);
    }

    // Unstop
    try {
      const raw = await scrapeUnstop(browser);
      const normalized = raw.map((r) => normalizeEvent(r, "Unstop"));
      const count = await batchWriteEvents(normalized);
      summaries["Unstop"] = { success: true, count };
      totalSynced += count;
    } catch (err: any) {
      summaries["Unstop"] = { success: false, error: String(err) };
      console.error("Unstop failed:", err.message);
    }

    // HackerEarth
    try {
      const raw = await scrapeHackerEarth(browser);
      const normalized = raw.map((r) => normalizeEvent(r, "HackerEarth"));
      const count = await batchWriteEvents(normalized);
      summaries["HackerEarth"] = { success: true, count };
      totalSynced += count;
    } catch (err: any) {
      summaries["HackerEarth"] = { success: false, error: String(err) };
      console.error("HackerEarth failed:", err.message);
    }
  } finally {
    if (browser) await browser.close();
  }

  // Eventbrite (no browser needed)
  try {
    const raw = await scrapeEventbrite();
    const normalized = raw.map((r) => normalizeEvent(r, "Eventbrite"));
    const count = await batchWriteEvents(normalized);
    summaries["Eventbrite"] = { success: true, count };
    totalSynced += count;
  } catch (err: any) {
    summaries["Eventbrite"] = { success: false, error: String(err) };
    console.error("Eventbrite failed:", err.message);
  }

  // Cleanup expired
  const cleanupCount = await cleanupExpired();
  const duration = Math.round((Date.now() - startTime) / 1000);

  // Write telemetry log
  if (adminDb) {
    try {
      await adminDb.collection("scrape_logs").add({
        source: "Railway Worker — Full Sync",
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        successCount: totalSynced,
        cleanupCount,
        duration,
        status: "success",
        details: summaries,
      });
    } catch (err) {
      console.error("Telemetry write failed:", err);
    }
  }

  const result = {
    success: true,
    totalEventsSynced: totalSynced,
    cleanupCount,
    durationSeconds: duration,
    summaries,
  };

  console.log(`\n✅ Sync complete: ${totalSynced} events synced, ${cleanupCount} expired pruned (${duration}s)\n`);
  return result;
}
