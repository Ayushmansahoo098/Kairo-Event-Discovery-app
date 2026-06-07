import { spawn } from "child_process";
import http from "http";
import fs from "fs";
import path from "path";

// Parse CRON_SECRET from .env.local
let cronSecret = "";
try {
  const envContent = fs.readFileSync(path.resolve(".env.local"), "utf-8");
  const match = envContent.match(/^CRON_SECRET\s*=\s*(.+)$/m);
  if (match) {
    cronSecret = match[1].trim().replace(/(^['"]|['"]$)/g, "");
  }
} catch (e) {
  console.warn("Could not read .env.local directly, falling back to process.env.CRON_SECRET.");
  cronSecret = process.env.CRON_SECRET || "";
}

console.log(`Using CRON_SECRET: ${cronSecret ? "****" : "Not Found"}`);

async function isPortOpen(port) {
  return new Promise((resolve) => {
    const client = http.get(`http://localhost:${port}/`, (res) => {
      resolve(true);
    });
    client.on("error", () => {
      resolve(false);
    });
  });
}

async function waitForServer(port, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const open = await isPortOpen(port);
    if (open) return true;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

async function runPostRequest(url, secret) {
  const start = Date.now();
  return new Promise((resolve) => {
    const req = http.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-kairo-sync-key": secret,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          const duration = (Date.now() - start) / 1000;
          try {
            resolve({
              status: res.statusCode,
              body: JSON.parse(data),
              duration,
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              body: { raw: data.slice(0, 300) },
              duration,
            });
          }
        });
      }
    );

    req.on("error", (err) => {
      resolve({
        status: 0,
        body: { error: err.message },
        duration: (Date.now() - start) / 1000,
      });
    });

    req.end();
  });
}

async function main() {
  console.log("=== STARTING BOOKMYSHOW SCRAPER AUDIT ===");

  const port = 3000; // Prefer existing port 3000
  let serverProcess = null;

  const serverAlreadyRunning = await isPortOpen(port);
  if (serverAlreadyRunning) {
    console.log(`Next.js server is already running on port ${port}. Using existing server.`);
  } else {
    console.log(`Starting Next.js dev server on port ${port}...`);
    serverProcess = spawn("npx", ["next", "dev", "-p", "3000"], {
      stdio: "ignore",
      detached: false,
    });
    
    const ready = await waitForServer(port);
    if (!ready) {
      console.error("Next.js dev server failed to start in time.");
      if (serverProcess) serverProcess.kill();
      process.exit(1);
    }
    console.log("Next.js dev server is ready!");
  }

  const results = [];
  const totalRuns = 10;

  console.log(`\nExecuting scraper ${totalRuns} times consecutively...`);
  
  for (let i = 1; i <= totalRuns; i++) {
    console.log(`\n--- Run ${i} of ${totalRuns} ---`);
    const res = await runPostRequest(`http://localhost:${port}/api/scrape/bookmyshow`, cronSecret);
    
    console.log(`Status: ${res.status}`);
    console.log(`Duration: ${res.duration.toFixed(2)}s`);
    
    if (res.status === 200 && res.body.success) {
      console.log(`Success! Events Extracted: ${res.body.count}`);
    } else {
      console.warn(`Failure/Error: ${JSON.stringify(res.body.error || res.body)}`);
    }

    results.push(res);
    
    if (i < totalRuns) {
      console.log("Waiting 4 seconds before next run...");
      await new Promise((r) => setTimeout(r, 4000));
    }
  }

  // Calculate stats
  let successCount = 0;
  let totalDuration = 0;
  let totalEventsExtracted = 0;
  const eventsCountPerRun = [];
  const failureReasons = [];
  const allScrapedEventIds = new Set();
  let duplicateCount = 0;

  results.forEach((r, idx) => {
    totalDuration += r.duration;
    if (r.status === 200 && r.body.success) {
      successCount++;
      const count = r.body.count || 0;
      eventsCountPerRun.push(count);
      totalEventsExtracted += count;

      const runEvents = r.body.events || [];
      runEvents.forEach((ev) => {
        if (allScrapedEventIds.has(ev.id)) {
          duplicateCount++;
        } else {
          allScrapedEventIds.add(ev.id);
        }
      });
    } else {
      eventsCountPerRun.push(0);
      failureReasons.push(`Run ${idx + 1}: Status ${r.status} (${r.body.error || "Unknown error"})`);
    }
  });

  const successRate = (successCount / totalRuns) * 100;
  const avgDuration = totalDuration / totalRuns;
  const totalEventsInSet = allScrapedEventIds.size;
  const duplicateRate = totalEventsExtracted > 0 
    ? (duplicateCount / totalEventsExtracted) * 100 
    : 0;

  console.log("\n=== AUDIT RESULTS SUMMARY ===");
  console.log(`Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`Avg Duration: ${avgDuration.toFixed(2)}s`);
  console.log(`Total Events Extracted (Cumulative): ${totalEventsExtracted}`);
  console.log(`Total Unique Events Ingested: ${totalEventsInSet}`);
  console.log(`Duplicate Rate (Overlapping Runs): ${duplicateRate.toFixed(1)}%`);
  console.log(`Events per Run: [${eventsCountPerRun.join(", ")}]`);
  
  if (failureReasons.length > 0) {
    console.log("\nFailure Details:");
    failureReasons.forEach((f) => console.log(`  - ${f}`));
  }

  // Verify unified sync endpoint `/api/sync/all`
  console.log("\nVerifying unified sync API `/api/sync/all` completes successfully...");
  const syncRes = await runPostRequest(`http://localhost:${port}/api/sync/all`, cronSecret);
  console.log(`Sync All Status: ${syncRes.status}`);
  let unifiedSyncSuccess = false;
  if (syncRes.status === 200 && syncRes.body.success) {
    console.log("Unified sync completed successfully!");
    console.log("Summaries:", JSON.stringify(syncRes.body.summaries, null, 2));
    console.log("Stats:", JSON.stringify(syncRes.body.stats, null, 2));
    unifiedSyncSuccess = true;
  } else {
    console.error("Unified sync failed:", JSON.stringify(syncRes.body.error || syncRes.body));
  }

  // Cleanup server
  if (serverProcess) {
    console.log("\nShutting down Next.js dev server...");
    serverProcess.kill();
  }

  console.log("\n=== AUDIT PROCESS COMPLETED ===");
  
  // Return JSON status to shell
  console.log("JSON_SUMMARY_START");
  console.log(JSON.stringify({
    successRate,
    avgDuration,
    totalEventsExtracted,
    totalUniqueEvents: totalEventsInSet,
    duplicateRate,
    eventsCountPerRun,
    unifiedSyncSuccess,
  }));
  console.log("JSON_SUMMARY_END");
}

main();
