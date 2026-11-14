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
    const errors = [], apiCalls = [], apiResponses = [], apiResults = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => { if (r.url().includes("/api/")) apiCalls.push(r.url()); });
    page.on("response", async (r) => {
      if (!r.url().includes("/api/")) return;
      apiResponses.push(`${r.status()} ${r.url()}`);
      let payload = null, parseError = "";
      try { payload = await r.json(); } catch (error) { parseError = error.message; }
      apiResults.push({ status: r.status(), payload, parseError, url: r.url() });
    });

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
      const validLivePayload = (result) => {
        const body = result.payload;
        if (result.status !== 200 || !body || !Array.isArray(body.channels)) return false;
        if (body.source === "fallback") {
          return body.status === "unavailable" && body.updated_at === null;
        }
        return body.source === "twitch-helix" && typeof body.updated_at === "string" && !Number.isNaN(Date.parse(body.updated_at));
      };
      check(`${tag}: /api/live responde HTTP 200 con contrato válido`,
        apiResults.length > 0 && apiResults.every(validLivePayload),
        apiResults.map(result => `${result.status} ${result.url} · ${result.parseError || result.payload?.source || "JSON inválido"}`).join(" | "));
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

const dossierPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const dossierErrors = [];
dossierPage.on("pageerror", error => dossierErrors.push(error.message));
const dossierNames = ["MORIARTYS","ROD3R1K","LADYMORIARTY","ARDIPII","AKUMA","DAVE — NEXUS","HABITOS","PATO — ORATORIS"];
for (const name of dossierNames) {
  const tag = "Bitácora individual · " + name;
  try {
    await dossierPage.goto(BASE + "#chapter-2", { waitUntil: "domcontentloaded", timeout: 45000 });
    await dossierPage.waitForSelector(".roster-card-direct-profile", { timeout: 15000 });
    const direct = dossierPage.getByRole("button", { name: "Abrir directamente el expediente de " + name });
    if (!await direct.count()) {
      check(tag + ": tarjeta disponible", false, "No se encontró el acceso directo del roster");
      continue;
    }
    await direct.click();
    await dossierPage.waitForSelector("#hero-profile-page:not([hidden])", { timeout: 10000 });
    const openDossier = dossierPage.getByRole("button", { name: "ABRIR BITÁCORA COMPLETA" });
    check(tag + ": acceso a bitácora estandarizada", await openDossier.count() > 0);
    if (!await openDossier.count()) continue;
    await openDossier.click();
    await dossierPage.waitForFunction(() => document.getElementById("hero-modal")?.classList.contains("active"), null, { timeout: 10000 });
    const profileText = await dossierPage.locator("#modal-profile-text").innerText();
    const statsText = await dossierPage.locator("#modal-stats-text").innerText();
    const historyText = await dossierPage.locator("#modal-log-text").innerText();
    const commercialText = await dossierPage.locator("#modal-extra-text").innerText();
    check(tag + ": identidad y portada", profileText.includes(name));
    check(tag + ": página de estadísticas", statsText.includes("ARCHIVO DE RENDIMIENTO"));
    check(tag + ": fortalezas y trayectoria", historyText.includes("FORTALEZAS DIFERENCIALES") && historyText.includes("MUESTRAS AUDIOVISUALES"));
    check(tag + ": propuesta comercial", commercialText.includes("EL UNIVERSO COMERCIAL"));
    await dossierPage.locator("#hero-modal .close-modal-btn").click();
    await dossierPage.locator("#hero-profile-page [data-close-hero-profile]").click();
  } catch (error) {
    check(tag + ": navegación completa sin excepción", false, error.message);
    if (await dossierPage.locator("#hero-modal.active").count()) await dossierPage.locator("#hero-modal .close-modal-btn").click().catch(() => {});
    if (await dossierPage.locator("#hero-profile-page:not([hidden])").count()) await dossierPage.locator("#hero-profile-page [data-close-hero-profile]").click().catch(() => {});
  }
}
check("Bitácoras individuales: sin errores JavaScript", dossierErrors.length === 0, dossierErrors.join(" | "));
await dossierPage.close();

await browser.close();
const fails = results.filter((r) => !r.ok);
fs.writeFileSync("reports/qa/resultado.json", JSON.stringify(results, null, 2));
console.log(`\n${results.length - fails.length}/${results.length} comprobaciones OK`);
process.exit(fails.length ? 1 : 0);
