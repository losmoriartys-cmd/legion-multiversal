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

test('el directorio carga los ocho expedientes y cada modal puede abrirse', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.roster-collectible-card')).toHaveCount(8);

  for (const creator of creators) {
    const card = page.locator('.roster-collectible-card').filter({ has: page.locator('[data-creator-id="' + creator.id + '"]') });
    await expect(card).toHaveCount(1);
    await page.evaluate(index => window.openHeroModal(index), creator.index);
    const modal = page.locator('#hero-modal');
    await expect(modal).toHaveClass(/active/);
    await expect(modal.locator('#modal-hero-title')).toContainText(creator.name);
    await expect(modal.locator('[role="tab"]')).toHaveCount(3);
    await page.keyboard.press('Escape');
    await expect(modal).not.toHaveClass(/active/);
  }
  expect(pageErrors).toEqual([]);
});

test('las dos rutas históricas de Lady Moriarty abren el mismo expediente', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/#expediente-ladymoriarty');
  await expect(page.locator('#hero-profile-page')).toBeVisible();
  const legacyText = await page.locator('#hero-profile-page').innerText();
  await expect(page.locator('#hero-profile-page')).toContainText('LADY MORIARTY');

  await page.goto('/#expediente-lady-moriarty');
  await expect(page.locator('#hero-profile-page')).toBeVisible();
  const canonicalText = await page.locator('#hero-profile-page').innerText();
  await expect(page.locator('#hero-profile-page')).toContainText('LADY MORIARTY');
  expect(canonicalText).toBe(legacyText);
  expect(pageErrors).toEqual([]);
});
