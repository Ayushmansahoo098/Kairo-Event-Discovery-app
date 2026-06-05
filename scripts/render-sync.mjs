const appUrl = (process.env.APP_URL || process.env.KAIRO_APP_URL || "").replace(/\/+$/, "");
const cronSecret = process.env.CRON_SECRET || "";

if (!appUrl) {
  console.error("APP_URL (or KAIRO_APP_URL) is required.");
  process.exit(1);
}

if (!cronSecret) {
  console.error("CRON_SECRET is required.");
  process.exit(1);
}

const endpoint = `${appUrl}/api/sync/all`;

try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "x-kairo-sync-key": cronSecret,
    },
  });

  const body = await response.text();
  console.log(`Sync request to ${endpoint} finished with status ${response.status}.`);
  console.log(body);

  if (!response.ok) {
    process.exit(1);
  }
} catch (error) {
  console.error("Render cron sync failed:", error);
  process.exit(1);
}
