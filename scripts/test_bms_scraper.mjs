import { chromium } from "playwright";

function cleanBMSImageUrl(url) {
  if (!url) return "";
  try {
    return url.replace(/\/events\/tr:[^\/]+\//, "/events/");
  } catch {
    return url;
  }
}

function parseBMSWatermarkDate(watermarkText) {
  if (!watermarkText) {
    return new Date().toISOString().split("T")[0];
  }
  try {
    const parts = watermarkText.split(",").map(p => p.trim());
    const datePart = parts[1] || parts[0];
    const dateSubParts = datePart.split(" ").filter(Boolean);
    
    let dayStr = "";
    let monthStr = "";
    if (dateSubParts.length === 2) {
      if (isNaN(parseInt(dateSubParts[0]))) {
        monthStr = dateSubParts[0];
        dayStr = dateSubParts[1];
      } else {
        dayStr = dateSubParts[0];
        monthStr = dateSubParts[1];
      }
    }
    
    if (dayStr && monthStr) {
      const months = {
        jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
        jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
      };
      const monthNum = months[monthStr.toLowerCase().substring(0, 3)];
      if (monthNum) {
        const dayNum = dayStr.padStart(2, "0");
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        let year = currentYear;
        if (parseInt(monthNum) < currentMonth) {
          year = currentYear + 1;
        }
        return `${year}-${monthNum}-${dayNum}`;
      }
    }
  } catch (e) {
    console.error("Failed to parse watermark date:", watermarkText, e);
  }
  return new Date().toISOString().split("T")[0];
}

async function run() {
  console.log("Launching browser with anti-bot evasion...");
  
  let successfulCards = null;
  
  for (let attempt = 1; attempt <= 6; attempt++) {
    console.log(`Crawl attempt ${attempt} of 6...`);
    const browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    });

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
      locale: "en-US",
      timezoneId: "Asia/Kolkata"
    });

    const page = await context.newPage();

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    try {
      const city = "bengaluru";
      await page.goto(`https://in.bookmyshow.com/explore/events-${city}`, {
        waitUntil: "domcontentloaded",
        timeout: 25000,
      });

      await page.waitForTimeout(6000);

      const pageText = await page.evaluate(() => document.body.innerText);
      const isErrorPage = pageText.includes("Sorry for bug-ging");
      console.log(`  Error page present: ${isErrorPage}`);

      if (!isErrorPage) {
        // Extract event card elements from successful load
        const cards = await page.evaluate((currentCity) => {
          const anchors = Array.from(document.querySelectorAll("a"));
          const gridAnchors = anchors.filter((a) => {
            const href = a.getAttribute("href") || "";
            const text = a.innerText || "";
            return href.includes("/events/") && (text.includes("₹") || text.split("\n").length >= 3);
          });

          return gridAnchors.map((a) => {
            const href = a.href;
            const text = a.innerText || "";
            const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

            const img = a.querySelector("img");
            const bannerImage = img ? img.src || img.getAttribute("src") || img.getAttribute("data-src") || "" : "";

            const title = lines[0] || "";
            const venue = lines[1] || "";
            const categoryText = lines[2] || "";
            const priceText = lines[3] || "";

            return {
              title,
              url: href,
              bannerImage,
              venue,
              city: currentCity,
              categoryText,
              priceText,
            };
          });
        }, city);

        successfulCards = cards;
        console.log(`  Success! Scraped ${cards.length} cards.`);
        await browser.close();
        break;
      }
    } catch (err) {
      console.error(`  Attempt ${attempt} error:`, err);
    } finally {
      await browser.close();
    }
    
    if (attempt < 6) {
      console.log("  Waiting 4 seconds before retry...");
      await new Promise(resolve => setTimeout(resolve, 4000));
    }
  }

  if (successfulCards && successfulCards.length > 0) {
    const normalizedEvents = [];
    for (const raw of successfulCards) {
      let watermarkDateText = "";
      
      if (raw.bannerImage) {
        const match = raw.bannerImage.match(/ie-([a-zA-Z0-9%=-]+)/);
        if (match) {
          try {
            const base64Str = decodeURIComponent(match[1]);
            watermarkDateText = Buffer.from(base64Str, "base64").toString("utf-8");
          } catch (e) {}
        }
      }

      const date = parseBMSWatermarkDate(watermarkDateText);
      const cleanImage = cleanBMSImageUrl(raw.bannerImage);

      normalizedEvents.push({
        id: `bms-${raw.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
        title: raw.title,
        venue: raw.venue,
        city: raw.city,
        category: raw.categoryText,
        price: raw.priceText,
        watermarkDate: watermarkDateText,
        normalizedDate: date,
        originalImage: raw.bannerImage,
        cleanedImage: cleanImage
      });
    }

    console.log("\nSample Normalized Events (top 5):");
    console.log(JSON.stringify(normalizedEvents.slice(0, 5), null, 2));
  } else {
    console.error("\nFailed to extract grid cards from BookMyShow.");
  }
}

run();
