const { test, expect } = require('@playwright/test');

test('Roster móvil conserva la Bitácora sin depender de una captura histórica de main', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/');
  await page.evaluate(() => switchChapter(2));
  await expect(page.locator('#chapter-2')).toHaveClass(/active/);
  const card = page.locator('.comic-roster-card[data-creator-id="moriartys"]');
  await expect(card).toBeVisible();
  await card.click();
  const dossier = page.locator('#hero-profile-page');
  await expect(dossier).toBeVisible();
  await dossier.locator('[data-profile-tab="bitacora"]').click();
  const chapters = dossier.locator('.hero-bitacora-chapters');
  await expect(chapters).toBeVisible();
  await expect(chapters.locator('[data-bitacora-view="recorrido"]')).toBeVisible();
  await expect(chapters.locator('[data-bitacora-panel="recorrido"]')).toBeVisible();
  const geometry = await page.evaluate(() => {
    const panel = document.querySelector('#hero-profile-page');
    const header = document.querySelector('body > header');
    const profileHead = panel.querySelector('.comic-profile-head');
    const box = profileHead.getBoundingClientRect();
    const headerBox = header.getBoundingClientRect();
    return {
      left: box.left,
      right: box.right,
      viewport: document.documentElement.clientWidth,
      top: box.top,
      headerBottom: headerBox.bottom,
      scrollWidth: document.documentElement.scrollWidth
    };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.top).toBeGreaterThanOrEqual(geometry.headerBottom - 1);
  expect(pageErrors).toEqual([]);
});
