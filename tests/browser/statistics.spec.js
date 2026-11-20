const { test, expect } = require('@playwright/test');

test('Estadísticas presenta siete canales Twitch y el expediente YouTube de Pato sin mezclar plataformas', async ({ page }) => {
  test.setTimeout(60000);
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/');
  await page.evaluate(() => switchChapter(3));
  await expect(page.locator('#chapter-3')).toHaveClass(/active/);

  const kpis = page.locator('#stats-summary .impact-kpi');
  await expect(kpis).toHaveCount(7);
  await expect(page.locator('#stats-summary')).toContainText('CANALES TWITCH');
  await expect(page.locator('#stats-summary')).toContainText('CANALES YOUTUBE');
  await expect(page.locator('#stats-summary')).toContainText('ESPECTADORES AHORA');
  await expect(page.locator('#stats-summary')).toContainText('HORAS DE DIRECTO OBSERVADAS');
  await expect(page.locator('#stats-summary')).toContainText('MUESTRAS REGISTRADAS');
  await expect(page.locator('#stats-summary')).toContainText('HORAS DE AUDIENCIA ESTIMADAS');

  const twitchCards = page.locator('#stats-channel-grid .stats-dossier-card');
  await expect(twitchCards).toHaveCount(7, { timeout: 30000 });
  await expect(page.locator('#stats-platform-grid .stats-platform-card')).toHaveCount(1, { timeout: 30000 });
  const pato = page.locator('#stats-platform-grid .stats-platform-card');
  await expect(pato).toContainText('PATO — ORATORIS');
  await expect(pato).toContainText('YOUTUBE');
  await expect(pato).toContainText('SUSCRIPTORES');
  await expect(pato).toContainText('VISUALIZACIONES');
  await expect(pato.locator('img.stats-platform-avatar')).toHaveAttribute('src', /^https:\/\//);

  for (const card of await twitchCards.all()) {
    await expect(card.locator('.stats-dossier-avatar')).toBeVisible();
    await expect(card.locator('dl > div')).toHaveCount(4);
    await expect(card.locator('.stats-average-track')).toBeVisible();
    await expect(card.locator('.stats-dossier-schedule')).toContainText('HORARIO DECLARADO');
  }

  const allLogins = await twitchCards.evaluateAll(cards => cards.map(card => card.dataset.login).sort());
  expect(allLogins).toEqual(['akumazoldyck', 'ardipii', 'daved0608', 'habitos_atomicos', 'ladymoriarty01', 'losmoriartys', 'ther0d3r1k'].sort());

  await page.locator('[data-stats-filter="offline"]').click();
  const offlineCount = await page.locator('#stats-channel-grid .stats-dossier-card').count();
  await page.locator('[data-stats-filter="live"]').click();
  const liveCount = await page.locator('#stats-channel-grid .stats-dossier-card').count();
  expect(offlineCount + liveCount).toBe(7);
  await page.locator('[data-stats-filter="all"]').click();
  await page.locator('#stats-sort').selectOption('name');
  const sortedNames = await page.locator('#stats-channel-grid .stats-dossier-identity h5').allTextContents();
  expect(sortedNames).toEqual([...sortedNames].sort((a, b) => a.localeCompare(b, 'es')));

  await expect(page.locator('#stats-twitch-comparison .stats-comparison-row')).toHaveCount(7);
  await expect(page.locator('#stats-twitch-comparison')).toContainText('Pico observado');
  await expect(page.locator('#stats-evolution .stats-evolution-day').first()).toBeVisible();
  await expect(page.locator('#stats-week-grid .stats-week-name')).toHaveCount(8);
  await expect(page.locator('#stats-table-body tr')).toHaveCount(7);
  expect(pageErrors).toEqual([]);
});
