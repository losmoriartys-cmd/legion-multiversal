const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context }) => {
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

test('el capítulo Roster presenta las ocho cartas juntas y cada una abre su Bitácora', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') pageErrors.push(message.text()); });
  await page.goto('/');
  await page.evaluate(() => switchChapter(2));
  const cards = page.locator('.comic-roster-card');
  await expect(cards).toHaveCount(8);
  await expect(page.locator('.roster-selector-panel')).toHaveCount(0);

  for (const creator of creators) {
    const card = page.locator('.comic-roster-card[data-creator-id="' + creator.id + '"]');
    await expect(card).toHaveCount(1);
    await expect(card).toContainText('VER PERFIL');
    await expect(card.locator('.comic-roster-stat')).toHaveCount(2);
    await card.click();

    const dossier = page.locator('#hero-profile-page');
    await expect(dossier).toBeVisible();
    await expect(dossier).toContainText(creator.name);
    const profileTabs = dossier.locator('[role="tab"][data-profile-tab]');
    await expect(profileTabs).toHaveCount(5);
    for (const [label, panel] of [
      ['PERFIL', 'perfil'],
      ['ESTADÍSTICAS', 'estadisticas'],
      ['JUEGOS Y RITMO', 'juegos'],
      ['CLIPS', 'clips'],
      ['BITÁCORA', 'bitacora']
    ]) {
      await profileTabs.filter({ hasText: label }).click();
      await expect(dossier.locator('#profile-tab-' + panel)).toBeVisible();
      await expect(profileTabs.filter({ hasText: label })).toHaveAttribute('aria-selected', 'true');
    }
    await profileTabs.filter({ hasText: 'PERFIL' }).focus();
    await page.keyboard.press('End');
    await expect(profileTabs.filter({ hasText: 'BITÁCORA' })).toBeFocused();
    await page.keyboard.press('Home');
    await expect(profileTabs.filter({ hasText: 'PERFIL' })).toBeFocused();
    await profileTabs.filter({ hasText: 'PERFIL' }).click();
    await expect(dossier.locator('.hero-profile-sidebar')).toBeVisible();
    await expect(dossier.locator('.hero-profile-reference-layout')).toBeVisible();
    const cardImage = card.locator('.comic-roster-photo img');
    await expect.poll(() => cardImage.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    const cardImageStyle = await cardImage.evaluate(img => ({ fit: getComputedStyle(img).objectFit, position: getComputedStyle(img).objectPosition }));
    expect(cardImageStyle.fit).toBe('cover');
    expect(cardImageStyle.position).toContain('0%');

    const dossierImage = dossier.locator('.hero-profile-id-image img');
    await expect(dossierImage).toBeVisible();
    await expect.poll(() => dossierImage.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    const dossierImageStyle = await dossierImage.evaluate(img => ({ fit: getComputedStyle(img).objectFit, position: getComputedStyle(img).objectPosition }));
    expect(dossierImageStyle.fit).toBe('cover');
    expect(dossierImageStyle.position).toContain('0%');
    await expect(dossier.locator('.hero-profile-sidebar-quote')).toBeVisible();
    await expect(dossier.locator('.hero-profile-socials')).toBeVisible();
    await expect(dossier.locator('.hero-profile-poster')).toHaveCount(0);
    await profileTabs.filter({ hasText: 'CLIPS' }).click();
    await expect(dossier.locator('#profile-tab-clips')).toBeVisible();
    await profileTabs.filter({ hasText: 'BITÁCORA' }).click();
    await expect(dossier.locator('#profile-tab-bitacora')).toBeVisible();
    await expect(dossier.locator('#profile-tab-bitacora h4').first()).toContainText('TRAYECTORIA Y COLABORACIONES DOCUMENTADAS');
    await expect(page.locator('#hero-modal')).not.toHaveClass(/active/);
    await page.evaluate(() => closeHeroProfile());
    await expect(page.locator('#roster-selector')).toBeVisible();
  }
  expect(pageErrors).toEqual([]);
});

test('el acceso Roster está antes de Origen en la navegación principal', async ({ page }) => {
  await page.goto('/');
  const nav = page.locator('.primary-navigation');
  await expect(nav.locator('[data-chapter="2"]')).toHaveText('ROSTER');
  const rosterBox = await nav.locator('[data-chapter="2"]').boundingBox();
  const originBox = await nav.locator('[data-chapter="1"]').boundingBox();
  expect(rosterBox.x).toBeLessThan(originBox.x);
});

test('las cartas se organizan en cuatro columnas de escritorio y dos en móvil', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => switchChapter(2));
  const cards = page.locator('.comic-roster-card');
  await expect(cards).toHaveCount(8);
  const desktopColumns = await cards.first().evaluate(el => getComputedStyle(el.parentElement).gridTemplateColumns.split(' ').length);
  expect(desktopColumns).toBe(4);
  await page.screenshot({ path: 'test-results/roster-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileColumns = await cards.first().evaluate(el => getComputedStyle(el.parentElement).gridTemplateColumns.split(' ').length);
  expect(mobileColumns).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.screenshot({ path: 'test-results/roster-mobile.png', fullPage: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(cards.first()).toBeVisible();
});

test('Atrás y Adelante restauran el roster y el expediente correcto', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => switchChapter(2));
  await page.locator('.comic-roster-card[data-creator-id="lady-moriarty"]').click();
  await expect(page).toHaveURL(/#roster\/lady-moriarty$/);
  await expect(page.locator('#hero-profile-page')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#roster$/);
  await expect(page.locator('#roster-home')).toBeVisible();
  await expect(page.locator('#hero-profile-page')).toBeHidden();
  await page.goForward();
  await expect(page).toHaveURL(/#roster\/lady-moriarty$/);
  await expect(page.locator('#hero-profile-page')).toBeVisible();
  await expect(page.locator('#hero-profile-page')).toContainText('LADY MORIARTY');
  await page.screenshot({ path: 'test-results/bitacora-lady-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/bitacora-lady-mobile.png', fullPage: true });
});
