const { test, expect } = require('@playwright/test');

async function openStatistics(page, testInfo, width, screenshotName) {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await page.evaluate(() => switchChapter(3));
  const chapter = page.locator('#chapter-3');
  await expect(chapter).toHaveClass(/active/);

  const comparisonRows = page.locator('#stats-twitch-comparison .stats-comparison-row');
  const gameRows = page.locator('#stats-game-performance .game-performance-table tbody tr');
  await expect(comparisonRows.first()).toBeVisible({ timeout: 30000 });
  await expect(gameRows.first()).toBeVisible({ timeout: 30000 });

  const technicalDetails = chapter.locator('details.stats-methodology').filter({ hasText: 'Ver detalle técnico por canal' });
  await expect(technicalDetails).toHaveCount(1);
  await technicalDetails.evaluate(el => { el.open = true; });
  await expect(chapter.locator('#stats-table-body tr').first()).toBeVisible({ timeout: 15000 });

  if (width <= 640) {
    const table = chapter.locator('#stats-game-performance .game-performance-table');
    const wrapper = chapter.locator('#stats-game-performance .stats-table-wrap');
    const tableBox = await table.boundingBox();
    const wrapperBox = await wrapper.boundingBox();
    expect(tableBox).not.toBeNull();
    expect(wrapperBox).not.toBeNull();
    expect(tableBox.width).toBeLessThanOrEqual(wrapperBox.width + 1);
    expect(await table.locator('tbody tr').first().evaluate(el => getComputedStyle(el).display)).toBe('block');
  }

  await page.screenshot({ path: testInfo.outputPath(screenshotName), fullPage: true });
  expect(pageErrors).toEqual([]);
}

test('Estadísticas: tablas de rendimiento legibles en escritorio', async ({ page }, testInfo) => {
  await openStatistics(page, testInfo, 1280, 'stats-tables-desktop.png');
});

test('Estadísticas: tablas de rendimiento adaptadas a móvil', async ({ page }, testInfo) => {
  await openStatistics(page, testInfo, 390, 'stats-tables-mobile.png');
});
