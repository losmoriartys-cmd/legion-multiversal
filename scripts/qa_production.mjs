import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "https://losmoriartys-cmd.github.io/legion-multiversal/";
fs.mkdirSync("reports/qa", { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const results = [];
const apiRequests = [];
const pageErrors = [];
const mailtoNavigations = [];
page.on("request", request => {
  const url = new URL(request.url());
  if (url.pathname.startsWith("/api/")) apiRequests.push(request.url());
});
page.on("pageerror", error => pageErrors.push(error.message));
page.on("framenavigated", frame => {
  if (frame.url().startsWith("mailto:")) mailtoNavigations.push(frame.url());
});
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log((ok ? "PASS " : "FAIL ") + name + (detail ? " — " + detail : ""));
};

await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2500);
check("GitHub Pages: portada cargada", await page.title().then(t => t.includes("LEGIÓN MULTIVERSAL")), await page.title());

const liveNav = page.locator('.nav-btn-live[data-chapter="10"]');
check("GitHub Pages: navegación EN VIVO presente", await liveNav.count() > 0);
if (await liveNav.count()) {
  await liveNav.click();
  await page.waitForTimeout(1500);
  check("GitHub Pages: capítulo EN VIVO disponible", await page.locator("#chapter-10").count() > 0);
}
check("GitHub Pages: ninguna llamada de red a /api/*", apiRequests.length === 0, apiRequests.join(" | "));

const form = page.locator("form.recruitment-contact-form").first();
const formCount = await page.locator("form.recruitment-contact-form").count();
check("GitHub Pages: formulario de contacto presente", formCount > 0);
let handler = "";
if (formCount) {
  await form.evaluate(el => el.closest(".chapter-panel")?.classList.add("active"));
  handler = await form.getAttribute("onsubmit") || "";
  await page.locator("#creator-name").fill("QA de producción");
  await page.locator("#creator-channel").fill("https://twitch.tv/qa_produccion");
  await page.locator("#creator-motivation").fill("Comprobación de ruta mailto en GitHub Pages; no enviar.");
  const valid = await form.evaluate(el => el.checkValidity());
  check("GitHub Pages: formulario válido para envío", valid);
  check("GitHub Pages: handler usa mailto directo", handler.includes("mailto:") && handler.includes("window.location.href"), handler.slice(0, 180));
  if (valid) {
    try { await form.locator('button[type="submit"]').click({ force: true, timeout: 5000 }); }
    catch (error) { console.log("INFO navegador sin cliente mailto asociado: " + String(error).slice(0, 220)); }
    await page.waitForTimeout(800);
  }
}
check("GitHub Pages: formulario no llama /api/contact", apiRequests.every(url => !new URL(url).pathname.startsWith("/api/contact")), apiRequests.join(" | "));
check("GitHub Pages: sin errores JavaScript", pageErrors.length === 0, pageErrors.join(" | "));
check("GitHub Pages: sin llamadas /api/ durante EN VIVO y formulario", apiRequests.length === 0, apiRequests.join(" | "));
const output = { base: BASE, apiRequests, mailtoNavigations, pageErrors, checks: results, passed: results.filter(x => x.ok).length, total: results.length };
fs.writeFileSync("reports/qa/produccion.json", JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify(output, null, 2));
await browser.close();
if (results.some(x => !x.ok)) process.exit(1);
