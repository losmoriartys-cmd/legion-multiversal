const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context }) => {
  await context.route('**/api/contact', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ configured: false, turnstileSiteKey: null })
  }));
});

test('Roster V3 conserva los ocho expedientes y separa Formación de Colaboradores', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.evaluate(() => switchChapter(2));
  await expect(page.locator('#chapter-2')).toHaveClass(/active/);
  await expect(page.locator('.comic-roster-card')).toHaveCount(8);
  await expect(page.locator('.roster-v3-kpi')).toHaveCount(4);
  await expect(page.locator('.roster-v3-group')).toHaveCount(2);
  await expect(page.locator('.roster-v3-group[data-group="formation"] .comic-roster-card')).toHaveCount(6);
  await expect(page.locator('.roster-v3-group[data-group="collaborators"] .comic-roster-card')).toHaveCount(2);
  await expect(page.locator('.roster-v3-group[data-group="collaborators"]')).toContainText('PATO — ORATORIS');
  await expect(page.locator('.roster-v3-group[data-group="collaborators"]')).toContainText('HABITOS');
  await expect(page.locator('.roster-v3-count')).toHaveText('Mostrando 8 de 8');

  for (const card of await page.locator('.comic-roster-card').all()) {
    await expect(card.locator('.roster-v3-archetype')).toBeVisible();
    await expect(card.locator('.roster-v3-metrics')).toBeVisible();
    await expect(card.locator('.roster-v3-metric')).toHaveCount(3);
    const followerValue = (await card.locator('.roster-v3-metric:first-child .roster-v3-metric-value').textContent()).trim();
    const followerDetail = await card.locator('.roster-v3-metric:first-child .roster-v3-metric-detail').textContent();
    if (followerValue !== '—') expect(followerDetail).toMatch(/· \d{1,2}\/\d{2}/);
    else expect(followerDetail).toContain('fuente pública');
    const creatorId = await card.getAttribute('data-creator-id');
    if (creatorId !== 'pato-oratoris') await expect(card.locator('.roster-v3-day-strip i')).toHaveCount(17);
    else {
      await expect(card.locator('.roster-v3-metric:last-child')).toContainText('No informado');
      await expect(card.locator('.comic-roster-activity')).toHaveText('CONTENIDO · YOUTUBE');
      await expect(card.locator('.comic-roster-frequency')).toContainText('NO APLICA');
    }
    await expect(card.locator('.comic-roster-last-live')).toContainText('ÚLTIMO DIRECTO OBSERVADO');
    await expect(card.locator('.roster-v3-rhythm-meter i')).toHaveCount(3);
    const bounds = await card.boundingBox();
    const values = await card.locator('.roster-v3-metric-value').evaluateAll(nodes => nodes.map(node => ({
      client: node.clientWidth,
      scroll: node.scrollWidth,
      left: node.getBoundingClientRect().left,
      right: node.getBoundingClientRect().right
    })));
    for (const value of values) {
      expect(value.scroll).toBeLessThanOrEqual(value.client + 1);
      expect(value.left).toBeGreaterThanOrEqual(bounds.x - 1);
      expect(value.right).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
    }
  }

  const search = page.getByRole('searchbox', { name: 'Buscar por nombre, tema, juego o arquetipo' });
  await search.fill('fantasma');
  await expect(page.locator('.roster-v3-count')).toHaveText('Mostrando 1 de 8');
  await expect(page.locator('.comic-roster-card:visible')).toHaveCount(1);
  await search.fill('');
  await page.getByLabel('Filtrar por grupo').selectOption('collaborators');
  await expect(page.locator('.comic-roster-card:visible')).toHaveCount(2);
  await expect(page.locator('.roster-v3-count')).toHaveText('Mostrando 2 de 8');
  await page.getByLabel('Filtrar por grupo').selectOption('all');
  await page.getByLabel('Filtrar por tema').selectOption('Terror');
  await expect(page.locator('.comic-roster-card:visible')).toHaveCount(1);
  await page.getByLabel('Filtrar por tema').selectOption('all');
  await page.getByLabel('Ordenar perfiles', { exact: true }).selectOption('days');
  await expect(page.locator('.comic-roster-card')).toHaveCount(8);
  expect(errors).toEqual([]);
});

test('Roster V3 mantiene cuatro columnas en escritorio y dos en móvil sin desbordes', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => switchChapter(2));
  const firstCard = page.locator('.comic-roster-card').first();
  await expect(firstCard).toBeVisible();
  const desktopColumns = await firstCard.evaluate(el => getComputedStyle(el.parentElement).gridTemplateColumns.split(' ').length);
  expect(desktopColumns).toBe(4);
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileColumns = await firstCard.evaluate(el => getComputedStyle(el.parentElement).gridTemplateColumns.split(' ').length);
  expect(mobileColumns).toBe(2);
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const animation = await firstCard.evaluate(el => getComputedStyle(el).animationName);
  expect(animation).toBe('none');
});
