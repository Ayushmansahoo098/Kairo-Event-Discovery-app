import { runSync } from "../src/lib/sync/runSync";

async function main() {
  console.log("GitHub Actions Sync Worker: Starting sequential event scraping...");
  const bmsEnabled = process.env.ENABLE_EXPERIMENTAL_BMS === "true"; // Defaults to false in cron
  
  const result = await runSync({ runBms: bmsEnabled });
  if (result.success) {
    console.log("GitHub Actions Sync Worker: Sync completed successfully.");
    console.log(JSON.stringify(result.stats, null, 2));
    process.exit(0);
  } else {
    console.error("GitHub Actions Sync Worker: Sync completed with errors.", result.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("GitHub Actions Sync Worker crashed during execution:", err);
  process.exit(1);
});
