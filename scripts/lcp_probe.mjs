import { chromium } from "playwright";
import fs from "node:fs";

const targets = [
  ["github-pages", "https://losmoriartys-cmd.github.io/legion-multiversal/"],
  ["preview", "https://auditoria-ux.legion-multiversal.pages.dev/"]
];

const browser = await chromium.launch({ headless: true });
const results = [];
for (const [name, url] of targets) {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1
  });
  await page.addInitScript(() => {
    window.__lcpEntries = [];
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const element = entry.element;
          window.__lcpEntries.push({
            startTime: Math.round(entry.startTime * 100) / 100,
            size: entry.size,
            tag: element?.tagName || null,
            id: element?.id || null,
            className: typeof element?.className === "string" ? element.className : "",
            src: element?.currentSrc || element?.src || null,
            loading: element?.loading || null,
            fetchPriority: element?.fetchPriority || null,
            text: (element?.textContent || "").trim().slice(0, 120)
          });
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch (error) {
      window.__lcpObserverError = String(error);
    }
  });
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(7000);
    const entries = await page.evaluate(() => ({
      entries: window.__lcpEntries || [],
      observerError: window.__lcpObserverError || null
    }));
    const last = entries.entries.at(-1) || null;
    const result = { environment: name, url, lcp: last, entries: entries.entries.length, observerError: entries.observerError };
    results.push(result);
    console.log(JSON.stringify(result));
  } catch (error) {
    const result = { environment: name, url, error: String(error) };
    results.push(result);
    console.log(JSON.stringify(result));
  } finally {
    await page.close();
  }
}
await browser.close();
fs.mkdirSync("reports/lighthouse", { recursive: true });
fs.writeFileSync("reports/lighthouse/lcp-elements.json", JSON.stringify(results, null, 2) + "\n");
