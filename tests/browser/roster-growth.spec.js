const { test, expect } = require('@playwright/test');

const creatorIds = [
  'moriartys',
  'rod3r1k',
  'lady-moriarty',
  'ardipii',
  'akuma',
  'dave-nexus',
  'pato-oratoris',
  'habitos'
];

test('cada Bitácora tiene capítulos separados de Recorrido y Crecimiento', async ({ page }) => {
  test.setTimeout(90000);
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/');
  await page.evaluate(() => switchChapter(2));
  await expect(page.locator('#chapter-2')).toHaveClass(/active/);
  await page.locator('#chapter-transition').evaluate(el => el.classList.remove('play'));

  for (const creatorId of creatorIds) {
    const card = page.locator('.comic-roster-card[data-creator-id="' + creatorId + '"]');
    await expect(card).toHaveCount(1);
    await card.click();

    const dossier = page.locator('#hero-profile-page');
    await expect(dossier).toBeVisible();
    const bitacora = dossier.locator('[data-profile-tab="bitacora"]');
    await bitacora.click();

    const chapters = dossier.locator('.hero-bitacora-chapters');
    await expect(chapters).toBeVisible();
    const recorrido = chapters.locator('[data-bitacora-view="recorrido"]');
    const crecimiento = chapters.locator('[data-bitacora-view="crecimiento"]');
    await expect(recorrido).toHaveAttribute('aria-selected', 'true');
    await expect(chapters.locator('[data-bitacora-panel="recorrido"] .hero-timeline')).toBeVisible();
    await expect(crecimiento).toHaveAttribute('aria-selected', 'false');

    await crecimiento.click();
    const growthPanel = chapters.locator('[data-bitacora-panel="crecimiento"]');
    await expect(growthPanel).toBeVisible();
    await expect(growthPanel.locator('.hero-growth-chapter')).toBeVisible();
    await expect(growthPanel.locator('.hero-growth-heading')).toContainText('CRECIMIENTO');
    await expect(growthPanel.locator('.hero-growth-method')).toContainText('No se suman audiencias');
    await expect(growthPanel.locator('.hero-growth-periods')).toBeVisible();
    const periods = growthPanel.locator('[data-growth-window]');
    await expect(periods).toHaveCount(3);
    for (const period of ['7d', '30d', '90d']) {
      const tab = growthPanel.locator('[data-growth-window="' + period + '"]');
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true');
      await expect(growthPanel.locator('[data-growth-panel="' + period + '"]')).toBeVisible();
      await expect(growthPanel.locator('[data-growth-panel="' + period + '"] .hero-growth-coverage')).toBeVisible();
    }

    await expect(growthPanel.locator('.hero-growth-content')).toBeVisible();
    await expect(growthPanel.locator('.hero-growth-collaborations')).toBeVisible();
    await expect(growthPanel.locator('.hero-growth-audience')).toContainText('No hay datos privados autorizados');
    if (creatorId === 'pato-oratoris') {
      await expect(growthPanel).toContainText('SUSCRIPTORES');
      await expect(growthPanel).toContainText('YOUTUBE DATA API');
      await expect(growthPanel.locator('.hero-growth-content')).toContainText('YOUTUBE');
    } else {
      await expect(growthPanel).toContainText('TWITCH');
      await expect(growthPanel).toContainText('SEGUIDORES ACTUALES');
    }
    if (creatorId === 'rod3r1k' || creatorId === 'akuma') {
      await expect(growthPanel.locator('.hero-growth-collaborations')).toContainText('Expediente 002 · BarFender');
      await expect(growthPanel.locator('.hero-growth-collaborations')).toContainText('DATO APORTADO POR EL CREADOR');
    }

    await recorrido.click();
    await expect(chapters.locator('[data-bitacora-panel="recorrido"]')).toBeVisible();
    await expect(chapters.locator('[data-bitacora-panel="crecimiento"]')).toBeHidden();
    await page.evaluate(() => closeHeroProfile());
    await expect(page.locator('#roster-selector')).toBeVisible();
  }

  expect(pageErrors).toEqual([]);
});
