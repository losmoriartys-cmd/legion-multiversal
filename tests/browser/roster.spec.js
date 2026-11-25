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
    await expect(card).not.toContainText(/Just Chatting|JUEGOS POR DOCUMENTAR/i);
    await expect(card.locator('.comic-roster-stat')).toHaveCount(3);
    const expectedPrimaryMetric = await page.evaluate(creatorId => {
      const hero = heroesData.find(item => item.id === creatorId);
      const account = hero.accounts.find(item => item.account_type === 'creator_channel');
      const metricKey = account.platform === 'youtube' ? 'subscribers' : 'average_viewers_sampled';
      const metric = getNormalizedCreatorMetric(hero, metricKey, account.platform);
      return normalizedMetricValue(metric, account.platform === 'youtube' ? 0 : 1);
    }, creator.id);
    await expect(card.locator('.comic-roster-stat-audience b')).toHaveText(expectedPrimaryMetric);
    await expect(card.locator('.comic-roster-brand-slots')).not.toContainText('Seguidores');

    await card.click();

    const dossier = page.locator('#hero-profile-page');
    await expect(dossier).toBeVisible();
    await expect.poll(async () => {
      const header = await page.locator('body > header').boundingBox();
      const profileHead = await dossier.locator('.comic-profile-head').boundingBox();
      return header && profileHead ? profileHead.y >= header.y + header.height - 1 : false;
    }).toBe(true);
    await expect(profilePanel).toHaveClass(/is-active/);
    if (creator.id === 'pato-oratoris') {
      // Pato es un creador de YouTube: no debe heredar categorías ni juegos de Twitch.
      await expect(dossier.locator('#profile-tab-perfil .hero-profile-integrated-games')).toHaveCount(0);
    } else {
      const gamesSection = dossier.locator('#profile-tab-perfil .hero-profile-integrated-games');
      // En ArDipii la sección es data-driven: puede no existir o mostrar juegos válidos si
      // aparecen en las fuentes. No se debe fijar su ausencia como regla del perfil.
      if (creator.id !== 'ardipii') await expect(gamesSection).toBeVisible();
      if (await gamesSection.count()) await expect(gamesSection).not.toContainText(/muestras|observaciones|Just Chatting/i);
    }
    // Los datos para marcas viven en su propia pestaña, no dentro del Perfil.
    await expect(dossier.locator('#profile-tab-perfil .hero-profile-brand')).toHaveCount(0);
    await expect(dossier.locator('#profile-tab-perfil .hero-profile-brand-summary')).toHaveCount(0);
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
    await expect(dossier.locator('.hero-profile-internal-art')).toHaveCount(0);
    await expect(dossier.locator('.hero-profile-quote')).toHaveCount(0);
    await expect(dossier.locator('.hero-profile-sidebar-quote')).toHaveCount(1);
    await expect(dossier.locator('.hero-profile-character-card-link button')).toBeVisible();
    await expect(dossier.locator('.hero-profile-sidebar-quote')).toBeVisible();
    await expect(dossier.locator('.hero-profile-socials')).toBeVisible();
    await expect(dossier.locator('.hero-profile-poster')).toHaveCount(0);

    // Validate chapters and their actual content for every roster member.
    await profileTabs.filter({ hasText: 'PERFIL' }).click();
    if (creator.id === 'pato-oratoris') {
      // El canal de Pato es YouTube; no corresponde mostrar juegos de Twitch.
      await expect(dossier.locator('#profile-tab-perfil .hero-profile-integrated-games')).toHaveCount(0);
    } else {
      const gamesSection = dossier.locator('#profile-tab-perfil .hero-profile-integrated-games');
      // La presencia de juegos de ArDipii depende de datos observados, no de una excepción fija.
      if (creator.id !== 'ardipii') await expect(gamesSection).toBeVisible();
      if (await gamesSection.count()) await expect(gamesSection).not.toContainText(/muestras|observaciones|Just Chatting/i);
    }
    // Los datos para marcas viven en su propia pestaña, no dentro del Perfil.
    await expect(dossier.locator('#profile-tab-perfil .hero-profile-brand')).toHaveCount(0);
    await expect(dossier.locator('#profile-tab-perfil .hero-profile-brand-summary')).toHaveCount(0);
    await profileTabs.filter({ hasText: 'CLIPS' }).click();
    expect(await dossier.locator('#profile-tab-clips .hero-profile-clip').count()).toBeLessThanOrEqual(4);
    await profileTabs.filter({ hasText: 'ESTADÍSTICAS' }).click();
    const statsPanel = dossier.locator('#profile-tab-estadisticas .stats-dashboard');
    await expect(statsPanel).toBeVisible();
    await expect(statsPanel.locator('.stats-executive-header')).toBeVisible();
    const sources = statsPanel.locator('.stats-executive-grid .stats-executive-source');
    expect(await sources.count()).toBeGreaterThanOrEqual(1);
    await expect(statsPanel.locator('.stats-source-details')).toHaveCount(0);
    for (let sourceIndex = 0; sourceIndex < await sources.count(); sourceIndex++) {
      const source = sources.nth(sourceIndex);
      expect(await source.locator('.stats-executive-metrics > div').count()).toBeGreaterThan(0);
      await expect(source).not.toContainText(/Sin métricas verificadas|Sin captura|Sin registro|No hay datos públicos cargados/i);
    }
    await profileTabs.filter({ hasText: 'BITÁCORA' }).click();
    const timeline = dossier.locator('#profile-tab-bitacora .hero-timeline');
    await expect(timeline).toBeVisible();
    expect(await timeline.locator('.hero-timeline-item').count()).toBeGreaterThanOrEqual(2);
    await expect(timeline.locator('.hero-timeline-item.is-origen')).toHaveCount(1);
    await expect(dossier.locator('#profile-tab-bitacora .hero-profile-internal-art')).toHaveCount(0);
    await expect(dossier.locator('#profile-tab-bitacora [data-bitacora-panel="recorrido"]')).not.toContainText(/MUESTRAS|DIRECCIÓN|DOCENTE|ESTUDIANTE/i);
    await expect(dossier.locator('#profile-tab-bitacora')).toContainText('BITÁCORA');
    await expect(dossier.locator('.hero-profile-character-card-link button')).toHaveText(/VER CARTA COMPLETA/);
    if (['lady-moriarty','rod3r1k','akuma','habitos'].includes(creator.id)) {
      await expect(dossier.locator('#profile-tab-bitacora a[href*="lurkit.com"]')).toHaveCount(1);
      await expect(dossier.locator('#profile-tab-bitacora a[href*="keymailer.co"]')).toHaveCount(1);
    }
    await profileTabs.filter({ hasText: 'BITÁCORA' }).click();
    await dossier.locator('[data-bitacora-view="marcas"]').click();
    await expect(dossier.locator('#bitacora-panel-marcas .hero-profile-brand')).toBeVisible();
    await expect(dossier.locator('#bitacora-panel-marcas .hero-profile-brand-summary')).toBeVisible();
    await expect(dossier.locator('#bitacora-panel-marcas .hero-profile-brand-slots article')).toHaveCount(3);
    if (['moriartys','rod3r1k'].includes(creator.id)) {
      await expect(dossier.locator('#bitacora-panel-marcas .hero-profile-epic-codes')).toBeVisible();
    }

    if (creator.id === 'moriartys') {
      await dossier.locator('.hero-profile-character-card-link button').click();
      await expect(page.locator('#hero-modal')).toHaveClass(/active/);
      await expect(page.locator('#hero-modal .modal-content')).toHaveClass(/comic-mode/);
      await expect(page.locator('#hero-modal .hero-profile-internal-art')).toHaveCount(0);
      await expect(page.locator('#hero-modal .hero-voice')).toHaveCount(0);
      await page.locator('#hero-modal .close-modal-btn').click();
      await expect(page.locator('#hero-modal')).not.toHaveClass(/active/);
      for (const [label, panel] of [
        ['PERFIL', 'perfil'],
        ['ESTADÍSTICAS', 'estadisticas'],
        ['CLIPS', 'clips'],
        ['BITÁCORA', 'bitacora'],
        ['BITÁCORA', 'bitacora']
      ]) {
        await profileTabs.filter({ hasText: label }).click();
        await expect(dossier.locator('#profile-tab-' + panel)).toBeVisible();
        if (panel === 'bitacora') {
          await dossier.locator('[data-bitacora-view="marcas"]').click();
          await expect(dossier.locator('#bitacora-panel-marcas')).toBeVisible();
          await dossier.locator('[data-bitacora-view="recorrido"]').click();
        }
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


test('la navegación editorial ofrece nueve capítulos y separa marcas de creadores', async ({ page }) => {
  await page.goto('/');
  const nav = page.locator('.primary-navigation');
  await expect(nav.locator('[data-chapter]')).toHaveCount(9);
  const chapterOrder = ['1', '11', '2', '3', '9', '8', '12', '10', '6'];
  const positions = [];
  for (const chapter of chapterOrder) {
    const item = nav.locator('[data-chapter="' + chapter + '"]');
    await expect(item).toBeVisible();
    positions.push((await item.boundingBox()).x);
  }
  expect(positions).toEqual([...positions].sort((a, b) => a - b));
  await expect(nav.getByRole('link', { name: /PARA MARCAS/i })).toHaveAttribute('href', './marcas/');
  await expect(nav.locator('[data-chapter="6"]')).toHaveText('SUMATE');
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
  const navigation = page.locator('.primary-navigation');
  await expect(mobileNav).toHaveCount(9);
  const navigationSize = await navigation.evaluate(el => ({
    overflowX: getComputedStyle(el).overflowX,
    clientWidth: el.clientWidth,
    scrollWidth: el.scrollWidth
  }));
  expect(['auto', 'scroll']).toContain(navigationSize.overflowX);
  expect(navigationSize.scrollWidth).toBeGreaterThan(navigationSize.clientWidth);
  await navigation.evaluate(el => { el.scrollLeft = el.scrollWidth; });
  const finalItem = mobileNav.last();
  await expect(finalItem).toBeVisible();
  const navBounds = await navigation.boundingBox();
  const finalBounds = await finalItem.boundingBox();
  expect(finalBounds.x).toBeGreaterThanOrEqual(navBounds.x - 1);
  expect(finalBounds.x + finalBounds.width).toBeLessThanOrEqual(navBounds.x + navBounds.width + 1);
  const mobileColumns = await cards.first().evaluate(el => getComputedStyle(el.parentElement).gridTemplateColumns.split(' ').length);
  expect(mobileColumns).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.screenshot({ path: 'test-results/roster-mobile.png', fullPage: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(cards.first()).toBeVisible();
});

test('Atrás y Adelante restauran el roster y el expediente correcto', async ({ page }) => {
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push({ kind: 'pageerror', text: error.message }));
  page.on('console', message => { if (message.type() === 'error') browserErrors.push({ kind: 'console', text: message.text() }); });
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
  await expect(page.locator('#profile-tab-bitacora .hero-timeline')).toBeVisible();
  await page.screenshot({ path: 'test-results/bitacora-lady-desktop.png', fullPage: false });
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileWidths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth
  }));
  expect(mobileWidths.document).toBeLessThanOrEqual(mobileWidths.viewport);
  expect(mobileWidths.body).toBeLessThanOrEqual(mobileWidths.viewport);
  const perfilTab = page.locator('[data-profile-tab="perfil"]');
  const bitacoraTab = page.locator('[data-profile-tab="bitacora"]');
  const estadisticasTab = page.locator('[data-profile-tab="estadisticas"]');
  const bitacoraPanel = page.locator('#profile-tab-bitacora');
  const estadisticasPanel = page.locator('#profile-tab-estadisticas');
  const dossier = page.locator('#hero-profile-page');

  // No confiar en el estado heredado de la navegación de escritorio:
  // forzar una transición real Perfil -> Bitácora en el viewport móvil.
  await expect(perfilTab).toBeVisible();
  await perfilTab.click();
  await expect(perfilTab).toHaveAttribute('aria-selected', 'true');
  await expect(dossier.locator('#profile-tab-perfil')).toBeVisible();
  await expect(bitacoraTab).toBeVisible();
  await bitacoraTab.click();
  await expect(bitacoraTab).toHaveAttribute('aria-selected', 'true');
  await expect(perfilTab).toHaveAttribute('aria-selected', 'false');
  await expect(estadisticasTab).toHaveAttribute('aria-selected', 'false');
  await expect(bitacoraPanel).toBeVisible();
  await expect(estadisticasPanel).toBeHidden();
  await expect(bitacoraPanel.locator('.hero-timeline')).toBeVisible();
  await expect(bitacoraPanel.locator('.hero-timeline-item.is-origen')).toHaveCount(1);
  await expect(bitacoraPanel.locator('[data-bitacora-view="recorrido"]')).toBeVisible();
  await expect(bitacoraPanel).toContainText('BITÁCORA');
  const timelineBounds = await bitacoraPanel.locator('.hero-timeline').boundingBox();
  expect(timelineBounds).not.toBeNull();
  expect(timelineBounds.x).toBeGreaterThanOrEqual(0);
  expect(timelineBounds.x + timelineBounds.width).toBeLessThanOrEqual(390 + 1);
  const timelineItems = bitacoraPanel.locator('.hero-timeline-item');
  expect(await timelineItems.count()).toBeGreaterThanOrEqual(2);
  for (let i = 0; i < await timelineItems.count(); i++) {
    const bounds = await timelineItems.nth(i).boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(390 + 1);
  }
  await expect(estadisticasPanel).toBeHidden();
  // El artefacto solo se genera después de comprobar pestaña, panel y contenido.
  await expect(bitacoraTab).toHaveAttribute('aria-selected', 'true');
  await expect(bitacoraPanel.locator('.hero-timeline-item')).toHaveCount(await timelineItems.count());
  await page.screenshot({ path: 'test-results/bitacora-lady-mobile.png', fullPage: false });
  expect(browserErrors).toEqual([]);
});

test('la Bitácora móvil conserva el contenido de main y aplica el acento de identidad de Lady Moriarty', async ({ browser }) => {
  test.setTimeout(90000);
  const mainBaselineUrl = process.env.MAIN_BASELINE_URL;
  expect(mainBaselineUrl, 'La CI debe resolver la preview vigente del SHA de main para comparar Bitácora móvil.').toBeTruthy();
  const viewport = { width: 390, height: 844 };
  // La comparación debe medir la estructura del expediente, no depender del estado de
  // la caché particionada de Google Fonts (font-display: optional cambia el resultado entre
  // el preview remoto y localhost). Se usa el mismo fallback en ambas páginas para lograr
  // una comparación determinista sin relajar la igualdad de geometría ni de captura.
  const comparisonContext = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  await comparisonContext.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, route => route.abort());
  const mainPage = await comparisonContext.newPage();
  const candidatePage = await comparisonContext.newPage();

  async function openLadyBitacora(target, url, { isCandidate = false, baselineFrameStyle = null } = {}) {
    await target.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await expect(target.locator('#chapter-2')).toHaveCount(1, { timeout: 30000 });
    await target.waitForFunction(() => typeof window.switchChapter === 'function');
    await target.evaluate(() => switchChapter(2));
    await expect(target.locator('#chapter-2')).toHaveClass(/active/);
    await target.locator('#chapter-transition').evaluate(el => el.classList.remove('play'));
    const card = target.locator('.comic-roster-card[data-creator-id="lady-moriarty"]');
    await expect(card).toBeVisible();
    await card.click();
    await expect(target).toHaveURL(/#roster[/]lady-moriarty$/);
    const bitacoraTab = target.locator('[data-profile-tab="bitacora"]');
    await expect(bitacoraTab).toBeVisible();
    await bitacoraTab.click();
    await expect(bitacoraTab).toHaveAttribute('aria-selected', 'true');
    const panel = target.locator('#profile-tab-bitacora');
    await expect(panel).toBeVisible();
    await expect(target.locator('#profile-tab-estadisticas')).toBeHidden();
    await expect(panel.locator('.hero-timeline')).toBeVisible();
    await expect(panel.locator('.hero-timeline-item.is-origen')).toHaveCount(1);
    const timelineItems = panel.locator('.hero-timeline-item');
    for (let index = 0; index < await timelineItems.count(); index++) {
      await expect(timelineItems.nth(index)).toBeVisible();
    }
    // #101 aporta un marco de identidad al expediente de Lady Moriarty. Se verifica
    // primero el acento real y después se normaliza solo el marco exterior a los
    // valores calculados de main, para comparar el contenido de Bitácora en igualdad.
    const profile = target.locator('#hero-profile-page');
    const frameStyle = await profile.evaluate(element => {
      const style = getComputedStyle(element);
      const properties = [
        'border-top-width', 'border-top-style', 'border-top-color',
        'border-right-width', 'border-right-style', 'border-right-color',
        'border-bottom-width', 'border-bottom-style', 'border-bottom-color',
        'border-left-width', 'border-left-style', 'border-left-color'
      ];
      return Object.fromEntries(properties.map(property => [property, style.getPropertyValue(property)]));
    });
    if (isCandidate) {
      expect({
        borderTopWidth: frameStyle['border-top-width'],
        borderTopColor: frameStyle['border-top-color'],
        borderLeftColor: frameStyle['border-left-color']
      }).toEqual({
        borderTopWidth: '6px',
        borderTopColor: 'rgb(255, 122, 184)',
        borderLeftColor: 'rgb(255, 122, 184)'
      });
      expect(baselineFrameStyle).not.toBeNull();
      await profile.evaluate((element, baseline) => {
        for (const [property, value] of Object.entries(baseline)) {
          element.style.setProperty(property, value, 'important');
        }
      }, baselineFrameStyle);
    }
    // Esperar el layout estable con el fallback tipográfico idéntico en ambos orígenes.
    await target.evaluate(() => document.fonts.ready);
    const selectedTabs = target.locator('.hero-profile-tabs');
    await selectedTabs.evaluate(el => el.scrollIntoView({ block: 'start', inline: 'nearest' }));
    await expect(bitacoraTab).toBeVisible();
    await expect(bitacoraTab).toHaveAttribute('aria-selected', 'true');
    await expect(panel.locator('.hero-timeline')).toBeVisible();
    const captureBounds = await selectedTabs.boundingBox();
    expect(captureBounds).not.toBeNull();
    expect(captureBounds.y).toBeGreaterThanOrEqual(-1); // tolerancia subpíxel por transforms/layout.
    expect(captureBounds.y).toBeLessThan(viewport.height);
    // El indicador "MISIONES" pertenece al encabezado global, no a la Bitácora.
    // Su borde tiene microvariaciones de antialiasing entre previews aunque el DOM y
    // la presentación del expediente coincidan. Se oculta sin alterar el layout.
    await target.addStyleTag({ content: '#mission-progress-trigger { visibility: hidden !important; }' });
    const screenshot = await target.screenshot({
      path: url === mainBaselineUrl ? 'test-results/main-baseline-bitacora-mobile.png' : 'test-results/pr-candidate-bitacora-mobile.png',
      fullPage: false,
      animations: 'disabled'
    });
    const signature = await target.evaluate(() => {
      const selectors = [
        '#hero-profile-page',
        '.comic-profile-head',
        '.hero-profile-tabs',
        '#profile-tab-bitacora',
        '#profile-tab-bitacora .hero-timeline',
        '#profile-tab-bitacora .hero-timeline-item'
      ];
      return selectors.map(selector => {
        const element = document.querySelector(selector);
        if (!element) return { selector, missing: true };
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          selector,
          missing: false,
          width: Math.round(rect.width * 10) / 10,
          height: Math.round(rect.height * 10) / 10,
          color: style.color,
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          fontFamily: style.fontFamily,
          fontSize: style.fontSize
        };
      });
    });
    return { signature, screenshot, frameStyle };
  }

  try {
    await mainPage.emulateMedia({ reducedMotion: 'reduce' });
    const mainCapture = await openLadyBitacora(mainPage, mainBaselineUrl);
    await candidatePage.emulateMedia({ reducedMotion: 'reduce' });
    const candidateCapture = await openLadyBitacora(candidatePage, '/', {
      isCandidate: true,
      baselineFrameStyle: mainCapture.frameStyle
    });
    expect(candidateCapture.signature).toEqual(mainCapture.signature);
    expect(candidateCapture.screenshot).toEqual(mainCapture.screenshot);
  } finally {
    await comparisonContext.close();
  }
});

