const { test, expect } = require('@playwright/test');

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
    await page.evaluate(index => window.openHeroModal(index), creator.index);
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
  const legacyText = await legacyPage.locator('#hero-profile-page').innerText();
  await expect(legacyPage.locator('#hero-profile-page')).toContainText('LADY MORIARTY');

  await canonicalPage.goto('/#expediente-lady-moriarty');
  await expect(canonicalPage.locator('#hero-profile-page')).toBeVisible();
  const canonicalText = await canonicalPage.locator('#hero-profile-page').innerText();
  await expect(canonicalPage.locator('#hero-profile-page')).toContainText('LADY MORIARTY');
  expect(canonicalText).toBe(legacyText);
  expect(pageErrors).toEqual([]);
  await legacyPage.close();
  await canonicalPage.close();
});
