const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context }) => {
  // El servidor estático de pruebas no ejecuta Cloudflare Pages Functions.
  // Se simula la respuesta segura de configuración ausente; nunca se envía un formulario real.
  await context.route('**/api/contact', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ configured: false, turnstileSiteKey: null })
  }));
});

const creators = [
  { id: 'moriartys', name: 'LOS MORIARTYS', index: 0 },
  { id: 'rod3r1k', name: 'ROD3R1K', index: 1 },
  { id: 'lady-moriarty', name: 'LADY MORIARTY', index: 2 },
  { id: 'ardipii', name: 'ARDIPII', index: 3 },
  { id: 'akuma', name: 'AKUMA', index: 4 },
  { id: 'dave-nexus', name: 'DAVE — NEXUS', index: 5 },
  { id: 'pato-oratoris', name: 'PATO — ORATORIS', index: 6 },
  { id: 'habitos', name: 'HABITOS', index: 7 }
];

test('el selector presenta los ocho integrantes y permite abrir cada expediente', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') pageErrors.push(message.text()); });
  await page.goto('/');
  await page.evaluate(() => switchChapter(2));
  const tiles = page.locator('.roster-selector-tile');
  await expect(tiles).toHaveCount(8);

  for (const creator of creators) {
    const tile = page.locator('.roster-selector-tile[data-roster-select="' + creator.index + '"]');
    await expect(tile).toHaveCount(1);
    await tile.click();
    const selectorPanel = page.locator('#roster-selector-panel');
    await expect(selectorPanel).toContainText(creator.name);
    await page.locator('#roster-selector-open-profile').click();

    const dossier = page.locator('#hero-profile-page');
    await expect(dossier).toBeVisible();
    await expect(dossier).toContainText(creator.name);
    const dossierAction = dossier.locator('.hero-profile-actions .twitch-link-btn').first();
    await expect(dossierAction).toHaveText('ABRIR BITÁCORA COMPLETA');
    await expect(dossier.locator('a[href="./roster-02-moriartys.html"]')).toHaveCount(0);
    await dossierAction.click();
    const modal = page.locator('#hero-modal');
    await expect(modal).toHaveClass(/active/);
    await expect(modal.locator('#modal-hero-title')).toContainText(creator.name);
    await expect(modal.locator('#modal-tab-navigation [role="tab"]')).toHaveCount(3);
    await page.keyboard.press('Escape');
    await expect(modal).not.toHaveClass(/active/);
    await page.evaluate(() => closeHeroProfile());
    await expect(page.locator('#roster-selector')).toBeVisible();
  }
  expect(pageErrors).toEqual([]);
});

test('las dos rutas históricas de Lady Moriarty abren el mismo expediente', async ({ page }) => {
  const pageErrors = [];
  const legacyPage = await page.context().newPage();
  const canonicalPage = await page.context().newPage();
  for (const target of [legacyPage, canonicalPage]) {
    target.on('pageerror', error => pageErrors.push(error.message));
    target.on('console', message => { if (message.type() === 'error') pageErrors.push(message.text()); });
  }

  await legacyPage.goto('/#expediente-ladymoriarty');
  await expect(legacyPage.locator('#hero-profile-page')).toBeVisible();
  await expect(legacyPage.locator('#hero-profile-page')).toContainText('LADY MORIARTY');
  await expect(legacyPage.locator('#hero-profile-page')).toContainText('3 clips destacados registrados');
  const legacyText = await legacyPage.locator('#hero-profile-page').innerText();

  await canonicalPage.goto('/#expediente-lady-moriarty');
  await expect(canonicalPage.locator('#hero-profile-page')).toBeVisible();
  await expect(canonicalPage.locator('#hero-profile-page')).toContainText('LADY MORIARTY');
  await expect(canonicalPage.locator('#hero-profile-page')).toContainText('3 clips destacados registrados');
  const canonicalText = await canonicalPage.locator('#hero-profile-page').innerText();
  expect(canonicalText).toBe(legacyText);
  expect(pageErrors).toEqual([]);
  await legacyPage.close();
  await canonicalPage.close();
});

test('las ocho cartas comparten el sistema visual maestro y responden en móvil', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => switchChapter(2));
  const tiles = page.locator('.roster-selector-tile');
  await expect(tiles).toHaveCount(8);
  await expect(page.locator('.roster-selector-panel')).toHaveAttribute('data-roster-role', /.+/);
  for (const creator of creators) {
    const tile = page.locator('.roster-selector-tile[data-creator-id="' + creator.id + '"]');
    await expect(tile).toHaveCount(1);
    await expect(tile.locator('.roster-selector-tile-frame')).toBeVisible();
    await expect(tile.locator('.roster-selector-tile-top')).toContainText('EXP.');
    await expect(tile.locator('.roster-selector-tile-name')).toBeVisible();
  }
  const desktopColumns = await tiles.first().evaluate(el => getComputedStyle(el.parentElement).gridTemplateColumns.split(' ').length);
  expect(desktopColumns).toBeGreaterThanOrEqual(3);
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileColumns = await tiles.first().evaluate(el => getComputedStyle(el.parentElement).gridTemplateColumns.split(' ').length);
  expect(mobileColumns).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(tiles.first()).toBeVisible();
});
