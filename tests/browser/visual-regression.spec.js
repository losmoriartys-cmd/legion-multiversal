const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 390, height: 900 }
];

async function createComparisonPages(browser, viewport) {
  const mainBaselineUrl = process.env.MAIN_BASELINE_URL;
  expect(mainBaselineUrl, 'La CI debe servir el baseline exacto de origin/main para las comparaciones visuales.').toBeTruthy();

  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  // Ambas páginas usan el mismo fallback tipográfico para evitar diferencias por caché
  // de Google Fonts entre el worktree exacto de main y el candidato local de CI.
  await context.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, route => route.abort());

  const mainPage = await context.newPage();
  const candidatePage = await context.newPage();
  await mainPage.goto(mainBaselineUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await candidatePage.goto('/', { waitUntil: 'domcontentloaded', timeout: 45000 });

  return { context, mainPage, candidatePage };
}

async function openChapter(page, chapterId) {
  await page.waitForFunction(() => typeof window.switchChapter === 'function');
  await expect(page.locator('#chapter-' + chapterId)).toHaveCount(1);
  await page.evaluate(id => window.switchChapter(id), chapterId);
  await expect(page.locator('#chapter-' + chapterId)).toHaveClass(/active/);
  await page.locator('#chapter-transition').evaluate(element => element.classList.remove('play'));
  await page.evaluate(() => document.fonts.ready);
}

async function compareElement(mainPage, candidatePage, testInfo, viewportName, surface) {
  const mainElement = surface.locator(mainPage);
  const candidateElement = surface.locator(candidatePage);
  await expect(mainElement, 'Falta la superficie baseline: ' + surface.name).toBeVisible();
  await expect(candidateElement, 'Falta la superficie candidata: ' + surface.name).toBeVisible();

  const mainBounds = await mainElement.boundingBox();
  const candidateBounds = await candidateElement.boundingBox();
  expect(mainBounds, 'La superficie baseline no tiene geometría: ' + surface.name).not.toBeNull();
  expect(candidateBounds, 'La superficie candidata no tiene geometría: ' + surface.name).not.toBeNull();
  expect(
    {
      width: Math.round(candidateBounds.width * 10) / 10,
      height: Math.round(candidateBounds.height * 10) / 10
    },
    'Cambió la geometría de ' + surface.name + ' en ' + viewportName
  ).toEqual({
    width: Math.round(mainBounds.width * 10) / 10,
    height: Math.round(mainBounds.height * 10) / 10
  });

  // El encabezado global es fijo/sticky y puede quedar superpuesto sobre la
  // sección en una página pero no en la otra según la posición de scroll.
  // No pertenece a la superficie comparada: navegación e interacción del header
  // ya se verifican en QA común. Se oculta en ambas páginas sin cambiar su layout.
  const captureScope = 'body > header { visibility: hidden !important; } #chapter-transition { visibility: hidden !important; }';
  await Promise.all([
    mainPage.addStyleTag({ content: captureScope }),
    candidatePage.addStyleTag({ content: captureScope })
  ]);

  const prefix = 'visual-' + surface.name + '-' + viewportName;
  const mainPng = await mainElement.screenshot({
    path: testInfo.outputPath(prefix + '-main.png'),
    animations: 'disabled',
    caret: 'hide'
  });
  const candidatePng = await candidateElement.screenshot({
    path: testInfo.outputPath(prefix + '-candidate.png'),
    animations: 'disabled',
    caret: 'hide'
  });

  expect(
    candidatePng.equals(mainPng),
    'Regresión visual en ' + surface.name + ' (' + viewportName + '): el PNG candidato no coincide exactamente con main. Se adjuntan ambas capturas.'
  ).toBe(true);
}

test('Roster: comparación visual exacta de las ocho cartas en escritorio y móvil', async ({ browser }, testInfo) => {
  test.setTimeout(180000);

  for (const viewport of viewports) {
    const { context, mainPage, candidatePage } = await createComparisonPages(browser, viewport);
    const errors = [];
    mainPage.on('pageerror', error => errors.push('main: ' + error.message));
    candidatePage.on('pageerror', error => errors.push('candidato: ' + error.message));

    try {
      await openChapter(mainPage, 2);
      await openChapter(candidatePage, 2);

      for (const page of [mainPage, candidatePage]) {
        const roster = page.locator('#roster-home');
        const cards = roster.locator('.comic-roster-card');
        await expect(cards).toHaveCount(8, { timeout: 30000 });
        const images = roster.locator('.comic-roster-photo img');
        await images.evaluateAll(nodes => Promise.all(nodes.map(image => {
          image.loading = 'eager';
          return image.decode();
        })));
        await expect.poll(() => images.evaluateAll(nodes => nodes.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
      }

      await compareElement(mainPage, candidatePage, testInfo, viewport.name, {
        name: 'roster-ocho-cartas',
        locator: page => page.locator('#roster-home')
      });
      expect(errors, 'Errores JavaScript durante la comparación visual de Roster').toEqual([]);
    } finally {
      await context.close();
    }
  }
});

test('Estadísticas: comparación visual exacta de indicadores y tablas en escritorio y móvil', async ({ browser }, testInfo) => {
  test.setTimeout(240000);

  const surfaces = [
    { name: 'stats-resumen', locator: page => page.locator('#stats-summary') },
    { name: 'stats-comparativa-twitch', locator: page => page.locator('#stats-twitch-comparison') },
    { name: 'stats-rendimiento-juego', locator: page => page.locator('#stats-game-performance') },
    { name: 'stats-evolucion', locator: page => page.locator('#stats-evolution') },
    { name: 'stats-semana-legion', locator: page => page.locator('#stats-week-grid') },
    {
      name: 'stats-tabla-tecnica',
      locator: page => page.locator('details.stats-methodology').filter({ hasText: 'Ver detalle técnico por canal' })
    }
  ];

  for (const viewport of viewports) {
    const { context, mainPage, candidatePage } = await createComparisonPages(browser, viewport);
    const errors = [];
    mainPage.on('pageerror', error => errors.push('main: ' + error.message));
    candidatePage.on('pageerror', error => errors.push('candidato: ' + error.message));

    try {
      await openChapter(mainPage, 3);
      await openChapter(candidatePage, 3);

      for (const page of [mainPage, candidatePage]) {
        await expect(page.locator('#stats-channel-grid .stats-dossier-card')).toHaveCount(7, { timeout: 30000 });
        await expect(page.locator('#stats-twitch-comparison .stats-comparison-row')).toHaveCount(7, { timeout: 30000 });
        await expect(page.locator('#stats-game-performance .game-performance-table tbody tr').first()).toBeVisible({ timeout: 30000 });
        await expect(page.locator('#stats-evolution .stats-evolution-day').first()).toBeVisible({ timeout: 30000 });
        await expect(page.locator('#stats-week-grid .stats-week-name')).toHaveCount(8, { timeout: 30000 });

        const technicalDetails = page.locator('details.stats-methodology').filter({ hasText: 'Ver detalle técnico por canal' });
        await expect(technicalDetails).toHaveCount(1);
        await technicalDetails.evaluate(element => { element.open = true; });
        await expect(page.locator('#stats-table-body tr')).toHaveCount(7, { timeout: 15000 });

        if (viewport.width <= 640) {
          const table = page.locator('#stats-game-performance .game-performance-table');
          const wrapper = page.locator('#stats-game-performance .stats-table-wrap');
          const tableBounds = await table.boundingBox();
          const wrapperBounds = await wrapper.boundingBox();
          expect(tableBounds).not.toBeNull();
          expect(wrapperBounds).not.toBeNull();
          expect(tableBounds.width).toBeLessThanOrEqual(wrapperBounds.width + 1);
          await expect(table.locator('tbody tr').first()).toHaveCSS('display', 'block');
        }

        await page.evaluate(() => document.fonts.ready);
      }

      for (const surface of surfaces) {
        await compareElement(mainPage, candidatePage, testInfo, viewport.name, surface);
      }
      expect(errors, 'Errores JavaScript durante la comparación visual de Estadísticas').toEqual([]);
    } finally {
      await context.close();
    }
  }
});
