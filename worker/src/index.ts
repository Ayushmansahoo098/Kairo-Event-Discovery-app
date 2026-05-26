import express from "express";
import { runFullSync } from "./scrapers";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);
const SYNC_SECRET = process.env.CRON_SECRET || "";

app.use(express.json());

// ─────────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────────

app.get("/", (_req, res) => {
  res.json({
    service: "Kairo Scraper Worker",
    status: "healthy",
    version: "1.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─────────────────────────────────────────────────
// Sync Endpoint — protected by CRON_SECRET
// ─────────────────────────────────────────────────

let isSyncing = false;

app.post("/sync", async (req, res) => {
  // Auth check
  const syncKey = req.headers["x-kairo-sync-key"];
  if (SYNC_SECRET && syncKey !== SYNC_SECRET) {
    return res.status(401).json({ error: "Unauthorized — invalid sync key" });
  }

  // Concurrency guard
  if (isSyncing) {
    return res.status(409).json({
      success: false,
      message: "A sync job is already in progress. Try again later.",
    });
  }

  isSyncing = true;
  console.log("📡 Sync request received...");

  try {
    const result = await runFullSync();
    res.json(result);
  } catch (error: any) {
    console.error("❌ Sync failed:", error);
    res.status(500).json({
      success: false,
      message: String(error),
    });
  } finally {
    isSyncing = false;
  }
});

// ─────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────

app.listen(PORT, "0.0.0.0", () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║    🔥 Kairo Scraper Worker                ║
  ║    Running on port ${PORT}                   ║
  ║    Health: http://0.0.0.0:${PORT}/health     ║
  ║    Sync:   POST http://0.0.0.0:${PORT}/sync  ║
  ╚═══════════════════════════════════════════╝
  `);
});
