// Local browser smoke checks for the three supported viewport sizes.
// Install locally with: npm i -D playwright && npx playwright install chromium
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.QA_BASE || "http://localhost:8080/";
const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "mobile-390", width: 390, height: 844 },
];
const HASHES = ["", '#a"b', "#%E0%A4%A", "#chapter-2", "#roster"];
fs.mkdirSync("reports/qa", { recursive: true });

const browser = await chromium.launch();
const results = [];
const check = (label, ok, extra = "") => {
  results.push({ label, ok, extra });
  console.log((ok ? "PASS " : "FAIL ") + label + (extra ? " — " + extra : ""));
};

for (const vp of VIEWPORTS) {
  for (const hash of HASHES) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const errors = [], apiCalls = [], apiResponses = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => { if (r.url().includes("/api/")) apiCalls.push(r.url()); });
    page.on("response", (r) => { if (r.url().includes("/api/")) apiResponses.push(`${r.status()} ${r.url()}`); });

    await page.goto(BASE + hash, { waitUntil: "domcontentloaded", timeout: 45000 });
    // La app puede mantener consultas/intervalos activos; networkidle no es un
    // criterio fiable de disponibilidad para esta página.
    await page.waitForTimeout(1200);
    const tag = `${vp.name} ${hash || "(sin hash)"}`;

    check(`${tag}: sin errores de JS`, errors.length === 0, errors.join(" | "));
    // GitHub Pages/local must not call Pages Functions. On *.pages.dev these
    // requests are expected and their fallback behavior must be reviewed separately.
    if (!/\.pages\.dev$/i.test(new URL(BASE).hostname)) {
      check(`${tag}: sin llamadas a /api/*`, apiCalls.length === 0, apiCalls.join(", "));
    } else {
      console.log(`INFO ${tag}: ${apiCalls.length} llamadas a /api/* en preview · respuestas: ${apiResponses.join(" | ") || "pendientes"}`);
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    check(`${tag}: sin scroll horizontal`, !overflow);

    if (hash === "") {
      const mailtoCount = await page.locator('a[href^="mailto:"]').count();
      check(`${tag}: CTA de contacto mailto disponible`, mailtoCount > 0, `enlaces: ${mailtoCount}`);
      const formFallback = await page.locator('[data-contact-form] .contact-mailto-fallback').count();
      check(`${tag}: respaldo mailto del formulario presente`, formFallback > 0);
      if (vp.name === "desktop-1440") {
        const form = page.locator('[data-contact-form]').first();
        await form.evaluate(el => el.closest('.chapter-panel')?.classList.add('active'));
        await page.route("**/api/contact", route => route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "QA: servicio simulado como no disponible" })
        }));
        await page.locator("#creator-name").fill("QA automatizado");
        await page.locator("#creator-channel").fill("https://twitch.tv/qa_demo");
        await page.locator("#creator-email").fill("qa@example.com");
        await page.locator("#creator-motivation").fill("Prueba automatizada; no enviar.");
        await form.locator('button[type="submit"]').click({ force: true });
        let fallbackHref = "";
        try {
          await page.waitForFunction(() => {
            const link = document.querySelector('[data-contact-form] .contact-mailto-fallback');
            const container = document.querySelector('[data-contact-form] .contact-form-fallback');
            return Boolean(link && container && !container.hidden && link.href.startsWith('mailto:'));
          }, null, { timeout: 5000 });
          fallbackHref = await form.locator('.contact-mailto-fallback').getAttribute('href') || "";
        } catch {}
        check("desktop-1440: envío fallido ofrece fallback mailto de un clic", fallbackHref.startsWith("mailto:"));
      }
      await page.keyboard.press("Tab");
      const keyboardFocus = await page.evaluate(() => document.activeElement && document.activeElement !== document.body && document.activeElement !== document.documentElement);
      check(`${tag}: navegación por teclado mueve el foco`, keyboardFocus);
      const open = await page.evaluate(() => document.querySelector(".roster-filter-disclosure")?.open);
      check(`${tag}: details del roster ${vp.width >= 701 ? "abierto" : "cerrado"}`, open === (vp.width >= 701));
      await page.screenshot({ path: `reports/qa/${vp.name}.png`, fullPage: true });
    }
    await page.close();
  }
}
await browser.close();
const fails = results.filter((r) => !r.ok);
fs.writeFileSync("reports/qa/resultado.json", JSON.stringify(results, null, 2));
console.log(`\n${results.length - fails.length}/${results.length} comprobaciones OK`);
process.exit(fails.length ? 1 : 0);
