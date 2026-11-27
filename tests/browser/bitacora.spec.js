const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/#chapter-12');
  await page.evaluate(() => window.gamesRegistryReady);
  await expect(page.locator('#collab-games-registry')).toHaveAttribute('data-collab-ready', 'true');
});

test('la Bitácora integrada publica once sesiones y catorce POV desde el registro maestro', async ({ page }) => {
  await expect(page.locator('#chapter-12')).toHaveClass(/active/);
  const sessions = page.locator('#collab-registry-grid [data-collab-session]');
  await expect(sessions).toHaveCount(11);
  await expect(page.locator('#collab-registry-status')).toContainText('11 sesiones visibles');
  await expect(page.locator('#collab-registry-grid a.collab-pov-link')).toHaveCount(14);
  await expect(sessions.filter({ hasText: 'BIT-001' }).first()).toContainText('Escape the Backrooms');
});

test('la ficha BIT-011 conserva participantes, POV, clips y el archivo histórico EXP-001', async ({ page }) => {
  const card = page.locator('#collab-registry-grid [data-collab-session="BIT-011"]');
  await expect(card).toHaveCount(1);
  await card.locator('details.collab-ficha > summary').click();
  await expect(card.locator('[data-collab-participant]')).toHaveCount(4);
  await expect(card.locator('.collab-pov-link')).toHaveCount(3);
  await expect(card.locator('.collab-clip-list li')).toHaveCount(4);
  await expect(card.locator('.collab-session-art img')).toHaveAttribute('src', 'BarFenderLos4.jpg');
  await expect(card.locator('.collab-session-actions a').filter({ hasText: 'ARCHIVO HISTÓRICO · EXP-001' })).toHaveAttribute('href', '#barfender-expediente');
  const archive = page.locator('#barfender-expediente');
  await expect(archive.locator(':scope > summary')).toContainText('ARCHIVO HISTÓRICO');
  await expect(archive).toHaveJSProperty('open', false);
  await expect(archive.locator('.collab-log-section')).toContainText('SIN VOD PÚBLICO');
});

test('la Bitácora integrada mantiene el capítulo utilizable en escritorio, tablet y móvil', async ({ page }) => {
  for (const width of [1440, 1024, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    const metrics = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      chapter: document.getElementById('chapter-12').scrollWidth,
      client: document.getElementById('chapter-12').clientWidth,
    }));
    expect(metrics.document, 'document overflow at ' + width + 'px').toBeLessThanOrEqual(width);
    expect(metrics.chapter - metrics.client, 'chapter overflow at ' + width + 'px').toBeLessThanOrEqual(2);
  }
});
