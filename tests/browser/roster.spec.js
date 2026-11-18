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
  test.setTimeout(60000);
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') pageErrors.push(message.text()); });
  await page.goto('/');
  await page.evaluate(() => switchChapter(2));
  await expect(page.locator('#chapter-2')).toHaveClass(/active/);
  await page.locator('#chapter-transition').evaluate(el => el.classList.remove('play'));
  const cards = page.locator('.comic-roster-card');
  await expect(page.locator('#roster-container')).toHaveCount(0);
  await expect(cards).toHaveCount(8);
  const profilePanel = page.locator('#hero-profile-page.roster-selector-panel');
  await expect(profilePanel).toHaveCount(1);
  await expect(profilePanel).toBeHidden();

  for (const creator of creators) {
    const card = page.locator('.comic-roster-card[data-creator-id="' + creator.id + '"]');
    await expect(card).toHaveCount(1);
    await expect(card).toContainText('VER PERFIL');
    await expect(card.locator('.comic-roster-stat')).toHaveCount(2);
    await card.click();

    const dossier = page.locator('#hero-profile-page');
    await expect(dossier).toBeVisible();
    await expect.poll(async () => {
      const header = await page.locator('header').boundingBox();
      const profileHead = await dossier.locator('.comic-profile-head').boundingBox();
      return header && profileHead ? profileHead.y >= header.y + header.height - 1 : false;
    }).toBe(true);
    await expect(profilePanel).toHaveClass(/is-active/);
    await expect(dossier.locator('#profile-tab-perfil .hero-profile-integrated-games')).toBeVisible();
    await expect(dossier.locator('#profile-tab-perfil .hero-profile-brand')).toHaveCount(0);
    await expect(page.locator('#roster-home')).toBeHidden();
    await expect(dossier).toContainText(creator.name);
    const profileTabs = dossier.locator('[role="tab"][data-profile-tab]');
    await expect(profileTabs).toHaveCount(4);

    const cardImage = card.locator('.comic-roster-photo img');
    await expect(cardImage).toHaveAttribute('alt', /Fotografía carnet/);
    expect(await cardImage.getAttribute('src')).toContain('assets/carnet/');
    await expect.poll(() => cardImage.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    const cardImageStyle = await cardImage.evaluate(img => ({ fit: getComputedStyle(img).objectFit, position: getComputedStyle(img).objectPosition }));
    expect(cardImageStyle.fit).toBe('cover');
    expect(cardImageStyle.position).toContain('18%');

    const dossierImage = dossier.locator('.hero-profile-id-image img');
    await expect(dossierImage).toBeVisible();
    await expect.poll(() => dossierImage.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    const dossierImageStyle = await dossierImage.evaluate(img => ({ fit: getComputedStyle(img).objectFit, position: getComputedStyle(img).objectPosition }));
    expect(dossierImageStyle.fit).toBe('cover');
    expect(dossierImageStyle.position).toContain('0%');
    // El expediente no repite full-body ni carta: el carnet identifica al streamer.
    await expect(dossier.locator('.hero-profile-character-art')).toHaveCount(0);
    const internalArt = dossier.locator('#profile-tab-perfil .hero-profile-internal-art img');
    await expect(internalArt).toBeVisible();
    await expect.poll(() => internalArt.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    const artBox = await internalArt.boundingBox();
    expect(artBox.width).toBeLessThanOrEqual(220);
    expect(artBox.height).toBeLessThanOrEqual(230);
    await expect(dossier.locator('.hero-profile-character-card-link button')).toBeVisible();
    await expect(dossier.locator('.hero-profile-sidebar-quote')).toBeVisible();
    await expect(dossier.locator('.hero-profile-socials')).toBeVisible();
    await expect(dossier.locator('.hero-profile-poster')).toHaveCount(0);

    // Validate chapters and their actual content for every roster member.
    await profileTabs.filter({ hasText: 'PERFIL' }).click();
    await expect(dossier.locator('#profile-tab-perfil .hero-profile-integrated-games')).toBeVisible();
    await expect(dossier.locator('#profile-tab-perfil .hero-profile-brand')).toHaveCount(0);
    await profileTabs.filter({ hasText: 'CLIPS' }).click();
    expect(await dossier.locator('#profile-tab-clips .hero-profile-clip').count()).toBeLessThanOrEqual(4);
    await profileTabs.filter({ hasText: 'ESTADÍSTICAS' }).click();
    await expect(dossier.locator('#profile-tab-estadisticas .stats-dashboard')).toBeVisible();
    await profileTabs.filter({ hasText: 'BITÁCORA' }).click();
    await expect(dossier.locator('#profile-tab-bitacora .hero-profile-brand')).toBeVisible();
    await expect(dossier.locator('#profile-tab-bitacora .hero-profile-internal-art')).toHaveCount(0);
    await expect(dossier.locator('#profile-tab-bitacora')).not.toContainText(/MUESTRAS/i);
    await expect(dossier.locator('#profile-tab-bitacora')).toContainText('BITÁCORA');
    await expect(dossier.locator('.hero-profile-character-card-link button')).toHaveText(/VER CARTA COMPLETA/);
    if (['lady-moriarty','rod3r1k','akuma','habitos'].includes(creator.id)) {
      await expect(dossier.locator('#profile-tab-bitacora a[href*="lurkit.com"]')).toHaveCount(1);
      await expect(dossier.locator('#profile-tab-bitacora a[href*="keymailer.co"]')).toHaveCount(1);
    }
    if (['moriartys','rod3r1k'].includes(creator.id)) {
      await expect(dossier.locator('#profile-tab-bitacora .hero-profile-epic-codes')).toBeVisible();
    }

    if (creator.id === 'moriartys') {
      await dossier.locator('.hero-profile-character-card-link button').click();
      await expect(page.locator('#hero-modal')).toHaveClass(/active/);
      await expect(page.locator('#hero-modal .modal-content')).toHaveClass(/comic-mode/);
      await page.locator('#hero-modal .close-modal-btn').click();
      await expect(page.locator('#hero-modal')).not.toHaveClass(/active/);
      for (const [label, panel] of [
        ['PERFIL', 'perfil'],
        ['ESTADÍSTICAS', 'estadisticas'],
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
    }

    await expect(page.locator('#hero-modal')).not.toHaveClass(/active/);
    await page.evaluate(() => closeHeroProfile());
    await expect(page.locator('#roster-selector')).toBeVisible();
    await expect(profilePanel).toBeHidden();
    await expect(profilePanel).not.toHaveClass(/is-active/);
  }
  expect(pageErrors).toEqual([]);
});

test('Origen aparece antes que Roster y la navegación principal contiene cinco destinos', async ({ page }) => {
  await page.goto('/');
  const nav = page.locator('.primary-navigation');
  await expect(nav.locator('[data-chapter]')).toHaveCount(5);
  await expect(nav.locator('[data-chapter="1"]')).toHaveText('ORIGEN');
  await expect(nav.locator('[data-chapter="2"]')).toHaveText('ROSTER');
  await expect(nav.locator('[data-chapter="10"]')).toContainText('EN VIVO');
  const originBox = await nav.locator('[data-chapter="1"]').boundingBox();
  const rosterBox = await nav.locator('[data-chapter="2"]').boundingBox();
  expect(originBox.x).toBeLessThan(rosterBox.x);
});

test('las cartas se organizan en cuatro columnas de escritorio y dos en móvil', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => switchChapter(2));
  await expect(page.locator('#chapter-2')).toHaveClass(/active/);
  await page.locator('#chapter-transition').evaluate(el => el.classList.remove('play'));
  const cards = page.locator('.comic-roster-card');
  await expect(cards).toHaveCount(8);
  await cards.locator('.comic-roster-photo img').evaluateAll(images => Promise.all(images.map(img => {
    img.loading = 'eager';
    return img.decode().catch(() => null);
  })));
  await expect.poll(() => cards.locator('.comic-roster-photo img').evaluateAll(images => images.every(img => img.naturalWidth > 0))).toBe(true);
  const desktopColumns = await cards.first().evaluate(el => getComputedStyle(el.parentElement).gridTemplateColumns.split(' ').length);
  expect(desktopColumns).toBe(4);
  await page.screenshot({ path: 'test-results/roster-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileNav = page.locator('.primary-navigation [data-chapter]');
  await expect(mobileNav).toHaveCount(5);
  const mobileNavRights = await mobileNav.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().right));
  expect(mobileNavRights.every(right => right <= 390)).toBe(true);
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
  await expect(page.locator('#chapter-2')).toHaveClass(/active/);
  await page.locator('#chapter-transition').evaluate(el => el.classList.remove('play'));
  await page.locator('.comic-roster-card[data-creator-id="lady-moriarty"]').click();
  await expect(page).toHaveURL(/#roster\/lady-moriarty$/);
  await expect(page.locator('#hero-profile-page')).toBeVisible();
  await expect(page.locator('#hero-profile-page .comic-profile-head')).toBeVisible();
  await expect(page.locator('#hero-profile-page .hero-profile-tabs')).toBeVisible();
  await expect(page.locator('#roster-home')).toBeHidden();
  await page.goBack();
  await expect(page).toHaveURL(/#roster$/);
  await expect(page.locator('#roster-home')).toBeVisible();
  await expect(page.locator('#hero-profile-page')).toBeHidden();
  await page.goForward();
  await expect(page).toHaveURL(/#roster\/lady-moriarty$/);
  await expect(page.locator('#hero-profile-page')).toBeVisible();
  await expect(page.locator('#roster-home')).toBeHidden();
  await expect(page.locator('#hero-profile-page')).toContainText('LADY MORIARTY');
  await page.locator('[data-profile-tab="bitacora"]').click();
  await expect(page.locator('#profile-tab-bitacora .hero-profile-brand')).toBeVisible();
  await page.screenshot({ path: 'test-results/bitacora-lady-desktop.png', fullPage: false });
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileWidths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth
  }));
  expect(mobileWidths.document).toBeLessThanOrEqual(mobileWidths.viewport);
  expect(mobileWidths.body).toBeLessThanOrEqual(mobileWidths.viewport);
  const statsTab = page.locator('[data-profile-tab="estadisticas"]');
  await statsTab.click();
  await expect(page.locator('#profile-tab-estadisticas .stats-dashboard')).toBeVisible();
  const statsBounds = await page.locator('#profile-tab-estadisticas .stats-dashboard').boundingBox();
  expect(statsBounds).not.toBeNull();
  expect(statsBounds.x + statsBounds.width).toBeLessThanOrEqual(390 + 1);
  await page.screenshot({ path: 'test-results/bitacora-lady-mobile.png', fullPage: false });
});
