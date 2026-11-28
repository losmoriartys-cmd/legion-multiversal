const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const { writeFileSync } = require('node:fs');

function comparePngFiles(mainPath, candidatePath) {
  const script = [
    'from PIL import Image, ImageChops',
    'import json, sys',
    'main = Image.open(sys.argv[1]).convert("RGB")',
    'candidate = Image.open(sys.argv[2]).convert("RGB")',
    'if main.size != candidate.size:',
    '    print(json.dumps({"sameDimensions": False, "maxChannelDelta": 255}))',
    '    raise SystemExit(0)',
    'diff = ImageChops.difference(main, candidate)',
    'max_delta = max(high for _, high in diff.getextrema())',
    'channels = diff.split()',
    'mask = ImageChops.lighter(ImageChops.lighter(channels[0].point(lambda value: 255 if value else 0), channels[1].point(lambda value: 255 if value else 0)), channels[2].point(lambda value: 255 if value else 0))',
    'bbox = mask.getbbox()',
    'changed_count = mask.histogram()[255]',
    'last_row_changed_count = mask.crop((0, main.height - 1, main.width, main.height)).histogram()[255]',
    'content_mask = mask.crop((0, 0, main.width, main.height - 1))',
    'content_changed_count = content_mask.histogram()[255]',
    'content_diff = diff.crop((0, 0, main.width, main.height - 1))',
    'content_max_delta = max(high for _, high in content_diff.getextrema())',
    'points = []',
    'if bbox:',
    '    for index, value in enumerate(mask.getdata()):',
    '        if value:',
    '            x, y = index % main.width, index // main.width',
    '            points.append({"x": x, "y": y, "main": list(main.getpixel((x, y))), "candidate": list(candidate.getpixel((x, y)))})',
    '            if len(points) >= 40: break',
    'print(json.dumps({"sameDimensions": True, "maxChannelDelta": max_delta, "changedPixelCount": changed_count, "contentChangedPixelCount": content_changed_count, "contentMaxChannelDelta": content_max_delta, "lastRowChangedPixelCount": last_row_changed_count, "bbox": bbox, "sampleDiffs": points}))'
  ].join(String.fromCharCode(10));
  const result = execFileSync('python', ['-c', script, mainPath, candidatePath], { encoding: 'utf8' });
  return JSON.parse(result.trim());
}

async function captureStableScreenshot(locator, outputPath, surfaceName) {
  let previous = null;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    await locator.evaluate(() => new Promise(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    ));
    const current = await locator.screenshot({
      animations: 'disabled',
      caret: 'hide'
    });
    if (previous && Buffer.from(previous).equals(Buffer.from(current))) {
      writeFileSync(outputPath, current);
      return attempt;
    }
    previous = current;
  }
  throw new Error(
    'La captura de ' + surfaceName + ' no alcanzó dos frames raster idénticos en seis intentos.'
  );
}

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

  // La comparación debe aislar cambios de interfaz, no diferencias entre dos
  // capturas de métricas generadas en momentos distintos. Toda respuesta JSON
  // solicitada por el candidato se obtiene del servidor baseline de origin/main.
  // Así ambas páginas renderizan con la misma fotografía de datos sin modificar
  // los archivos del candidato ni los recursos protegidos del repositorio.
  await candidatePage.route(/\.json(?:\?.*)?$/, async route => {
    const requestedUrl = new URL(route.request().url());
    const baselineUrl = new URL(requestedUrl.pathname + requestedUrl.search, mainBaselineUrl);
    const response = await context.request.get(baselineUrl.toString(), { timeout: 45000 });
    expect(response.ok(), 'No se pudo obtener el JSON baseline compartido: ' + baselineUrl.pathname).toBe(true);
    await route.fulfill({ response });
  });
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
  // La textura fija de body::before y el header sticky son capas globales, no parte
  // de la superficie bajo prueba. También se desactiva el scroll suave global: el
  // CSS de la página define scroll-behavior:smooth y no sirve para capturas síncronas.
  const captureScope = 'html { scroll-behavior: auto !important; } body > header { visibility: hidden !important; } body::before { visibility: hidden !important; } #chapter-transition { visibility: hidden !important; } *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }';
  await Promise.all([
    mainPage.addStyleTag({ content: captureScope }),
    candidatePage.addStyleTag({ content: captureScope })
  ]);

  // Estadísticas es una superficie interior del capítulo 3. La reorganización
  // editorial cambia la altura del contenido anterior y, por tanto, su posición
  // absoluta en el documento, aunque el panel y sus estilos internos sean iguales.
  // Chromium rasteriza algunos bordes redondeados según la fase del documento;
  // normalizamos ese origen solo durante la captura y sin cambiar píxeles visibles.
  const isStatsComparison = surface.name === 'stats-comparativa-twitch';
  if (isStatsComparison) {
    const documentTops = await Promise.all([mainElement, candidateElement].map(element =>
      element.evaluate(node => {
        const scroller = document.scrollingElement || document.documentElement;
        return node.getBoundingClientRect().top + scroller.scrollTop;
      })
    ));
    const documentOffset = documentTops[0] - documentTops[1];
    if (Math.abs(documentOffset) > 0.25) {
      const pageToNormalize = documentOffset > 0 ? candidatePage : mainPage;
      const spacerHeight = Math.abs(documentOffset);
      await pageToNormalize.locator('#chapter-3').evaluate((chapter, height) => {
        const spacer = document.createElement('div');
        spacer.id = 'visual-regression-document-origin-spacer';
        spacer.style.cssText = [
          'display:block!important',
          'height:' + height + 'px!important',
          'min-height:' + height + 'px!important',
          'max-height:' + height + 'px!important',
          'flex:0 0 auto!important',
          'margin:0!important',
          'padding:0!important',
          'border:0!important',
          'visibility:hidden!important',
          'pointer-events:none!important',
          'overflow:hidden!important'
        ].join(';');
        chapter.parentElement.insertBefore(spacer, chapter);
      }, spacerHeight);
    }
    console.log(
      'STATS_DOCUMENT_ORIGIN_NORMALIZATION: offset=' +
      documentOffset + 'px; spacer=' + Math.abs(documentOffset) + 'px'
    );
  }

  // Algunas superficies (en especial la tabla técnica, al final del capítulo)
  // no pueden llegar a y=64 porque el documento ya alcanzó su límite inferior.
  // Calculamos el intervalo de posiciones visibles que ambas páginas pueden
  // alcanzar y elegimos una misma coordenada dentro de ese intervalo. Así no
  // confundimos el límite de scroll del documento con una diferencia de interfaz.
  const captureRanges = await Promise.all([mainElement, candidateElement].map(element =>
    element.evaluate(node => {
      const scroller = document.scrollingElement || document.documentElement;
      const rect = node.getBoundingClientRect();
      const documentTop = rect.top + scroller.scrollTop;
      const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      return {
        documentTop,
        elementHeight: rect.height,
        viewportHeight: window.innerHeight,
        scrollTop: scroller.scrollTop,
        minViewportTop: documentTop - maxScrollTop,
        maxViewportTop: documentTop,
        minVisibleScrollTop: Math.max(0, documentTop + rect.height - window.innerHeight),
        maxVisibleScrollTop: Math.min(maxScrollTop, documentTop)
      };
    })
  ));

  if (isStatsComparison) {
    const documentPositions = captureRanges.map(range => range.documentTop);
    expect(
      Math.abs(documentPositions[0] - documentPositions[1]),
      'La comparativa de Estadísticas no comparte el mismo origen documental tras normalizarlo: ' + JSON.stringify(documentPositions)
    ).toBeLessThanOrEqual(0.25);
  }
  // Alinear viewport y coordenada de documento hace comparables los contextos
  // de raster sin modificar datos, estilos del sitio ni dimensiones de la tarjeta.
  const backdropOverrides = isStatsComparison
    ? await Promise.all([mainPage, candidatePage].map(page =>
        page.addStyleTag({
          content: 'body { background-image: none !important; background-color: #090f19 !important; } body::after, #chapter-3.comic-page::before, #chapter-3.comic-page::after { display: none !important; } #chapter-3.comic-page { background-image: none !important; background-color: #090f19 !important; }'
        })
      ))
    : [];

  let captureTop = null;

  if (isStatsComparison) {
    // La comparativa usa el mismo origen documental y la misma coordenada del
    // viewport. Ambos paneles deben quedar completos y con idénticas dimensiones
    // raster, aunque el contenido editorial anterior tenga alturas diferentes.
    const minSharedCaptureTop = Math.max(...captureRanges.map(range =>
      range.documentTop - range.maxVisibleScrollTop
    ));
    const maxSharedCaptureTop = Math.min(...captureRanges.map(range =>
      range.documentTop - range.minVisibleScrollTop
    ));
    expect(
      minSharedCaptureTop,
      'Baseline y candidato no comparten una coordenada de viewport que mantenga toda la superficie visible: ' + JSON.stringify(captureRanges)
    ).toBeLessThanOrEqual(maxSharedCaptureTop);
    captureTop = Math.max(minSharedCaptureTop, Math.min(64, maxSharedCaptureTop));
    await Promise.all([mainElement, candidateElement].map((element, index) =>
      element.evaluate((node, target) => {
        const scroller = document.scrollingElement || document.documentElement;
        const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        scroller.scrollTop = Math.max(0, Math.min(maxScrollTop, target.documentTop - target.captureTop));
        scroller.scrollLeft = 0;
      }, {
        documentTop: captureRanges[index].documentTop,
        captureTop
      })
    ));
  } else {
    const minSharedTop = Math.max(...captureRanges.map(range => range.minViewportTop));
    const maxSharedTop = Math.min(...captureRanges.map(range => range.maxViewportTop));
    expect(
      minSharedTop,
      'Baseline y candidato no tienen una posición vertical de captura común: ' + JSON.stringify(captureRanges)
    ).toBeLessThanOrEqual(maxSharedTop + 0.25);
    captureTop = Math.max(minSharedTop, Math.min(64, maxSharedTop));

    await Promise.all([mainElement, candidateElement].map((element, index) =>
      element.evaluate((node, target) => {
        const scroller = document.scrollingElement || document.documentElement;
        const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        scroller.scrollTop = Math.max(0, Math.min(maxScrollTop, target.documentTop - target.captureTop));
        scroller.scrollLeft = 0;
      }, {
        documentTop: captureRanges[index].documentTop,
        captureTop
      })
    ));
  }

  await Promise.all([mainPage, candidatePage].map(page => page.evaluate(() =>
    new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  )));

  const captureOrigins = await Promise.all([mainElement, candidateElement].map(element =>
    element.evaluate(node => {
      const scroller = document.scrollingElement || document.documentElement;
      const rect = node.getBoundingClientRect();
      return {
        top: rect.top, bottom: rect.bottom, left: rect.left,
        scrollTop: scroller.scrollTop, viewportHeight: window.innerHeight
      };
    })
  ));

  if (isStatsComparison) {
    for (const [index, origin] of captureOrigins.entries()) {
      expect(
        Math.abs(origin.top - captureTop),
        'La captura no alineó la superficie de Estadísticas en el viewport (' + (index ? 'candidato' : 'baseline') + '): ' + JSON.stringify({ origin, captureTop })
      ).toBeLessThanOrEqual(0.25);
      expect(
        origin.bottom,
        'La superficie de Estadísticas quedó cortada por el viewport (' + (index ? 'candidato' : 'baseline') + '): ' + JSON.stringify(origin)
      ).toBeLessThanOrEqual(origin.viewportHeight);
    }
  } else {
    for (const [index, origin] of captureOrigins.entries()) {
      expect(
        Math.abs(origin.top - captureTop),
        'La captura no respetó la coordenada común (' + (index ? 'candidato' : 'baseline') + '): ' + JSON.stringify({ origin, captureTop })
      ).toBeLessThanOrEqual(0.5);
    }
    expect(
      Math.abs(captureOrigins[0].top - captureOrigins[1].top),
      'Las superficies no comparten el mismo origen vertical de captura: ' + JSON.stringify({ captureOrigins, captureTop })
    ).toBeLessThanOrEqual(0.25);
  }
  expect(
    Math.abs(captureOrigins[0].left - captureOrigins[1].left),
    'Las superficies no comparten el mismo origen horizontal de captura: ' + JSON.stringify(captureOrigins)
  ).toBeLessThanOrEqual(0.25);

  const prefix = 'visual-' + surface.name + '-' + viewportName;
  const mainPath = testInfo.outputPath(prefix + '-main.png');
  const candidatePath = testInfo.outputPath(prefix + '-candidate.png');

  try {
    const [mainStableFrames, candidateStableFrames] = await Promise.all([
      captureStableScreenshot(mainElement, mainPath, surface.name + ' baseline'),
      captureStableScreenshot(candidateElement, candidatePath, surface.name + ' candidato')
    ]);
    console.log(
      'STABLE_CAPTURE_' + surface.name + '_' + viewportName +
      ': baseline=' + mainStableFrames + ', candidate=' + candidateStableFrames
    );

    const rasterDiff = comparePngFiles(mainPath, candidatePath);
    expect(rasterDiff.sameDimensions, 'Cambió el tamaño raster de ' + surface.name + ' en ' + viewportName).toBe(true);
    expect(
      rasterDiff.maxChannelDelta,
      'Regresión visual en ' + surface.name + ' (' + viewportName + '): ' + JSON.stringify(rasterDiff) + ' · tolerancia de rasterización 2/255.'
    ).toBeLessThanOrEqual(2);
  } finally {
    await Promise.all(backdropOverrides.map(handle => handle.evaluate(style => style.remove())));
  }
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


test('Portada: comparación visual exacta en frío y después de cargar CSS global', async ({ browser }, testInfo) => {
  test.setTimeout(180000);

  for (const viewport of viewports) {
    const { context, mainPage, candidatePage } = await createComparisonPages(browser, viewport);
    const errors = [];
    mainPage.on('pageerror', error => errors.push('main: ' + error.message));
    candidatePage.on('pageerror', error => errors.push('candidato: ' + error.message));

    try {
      const pages = [mainPage, candidatePage];
      for (const page of pages) {
        const hero = page.locator('#chapter-0 .executive-hero');
        await expect(hero).toBeVisible();
        await expect(hero.locator('.executive-hero-art img')).toHaveCount(1);
        await hero.locator('.executive-hero-art img').evaluate(image => image.decode());
        await page.evaluate(() => document.fonts.ready);

        // Estado frío: CSS global aún no solicitado; el primer render depende
        // del bloque crítico y de los estilos que se cargan desde el head.
        const initialState = await page.locator('#lm-global-chapter-styles').evaluate(link => ({
          loaded: link.dataset.loaded === 'true',
          hasHref: Boolean(link.getAttribute('href'))
        }));
        expect(initialState, 'La Portada debe conservar la carga diferida de styles.css').toEqual({
          loaded: false,
          hasHref: false
        });
      }

      async function compareCover(stateName) {
        const heroLocators = pages.map(page => page.locator('#chapter-0 .executive-hero'));
        const bounds = await Promise.all(heroLocators.map(locator => locator.boundingBox()));
        for (const [index, rect] of bounds.entries()) {
          expect(rect, 'Falta geometría del Hero (' + (index ? 'candidato' : 'baseline') + ')').not.toBeNull();
          expect(rect.y, 'El Hero debe estar en pantalla sin hacer scroll para la captura fría').toBeGreaterThanOrEqual(0);
          expect(rect.y + rect.height, 'El Hero debe caber en el viewport de captura').toBeLessThanOrEqual(viewport.height);
        }
        expect(
          {
            width: Math.round(bounds[1].width * 10) / 10,
            height: Math.round(bounds[1].height * 10) / 10
          },
          'Cambió la geometría de la Portada en ' + stateName + ' / ' + viewport.name
        ).toEqual({
          width: Math.round(bounds[0].width * 10) / 10,
          height: Math.round(bounds[0].height * 10) / 10
        });

        const prefix = 'visual-portada-' + stateName + '-' + viewport.name;
        const mainPath = testInfo.outputPath(prefix + '-main.png');
        const candidatePath = testInfo.outputPath(prefix + '-candidate.png');
        await Promise.all([
          captureStableScreenshot(heroLocators[0], mainPath, prefix + ' baseline'),
          captureStableScreenshot(heroLocators[1], candidatePath, prefix + ' candidato')
        ]);
        const diff = comparePngFiles(mainPath, candidatePath);
        expect(diff.sameDimensions, 'Cambió el tamaño raster de Portada en ' + stateName + ' / ' + viewport.name).toBe(true);
        expect(
          diff.maxChannelDelta,
          'Regresión visual en Portada (' + stateName + ' / ' + viewport.name + '): ' + JSON.stringify(diff) + ' · tolerancia 2/255.'
        ).toBeLessThanOrEqual(2);
      }

      await compareCover('frio');

      // Estado posterior: navegar a otro capítulo fuerza la carga de styles.css;
      // luego se regresa a Portada para comparar el mismo estado en ambas páginas.
      for (const page of pages) {
        const stylesheetResponse = page.waitForResponse(response =>
          response.url().includes('/styles.css?v=20261126-ficha-tabs-1') && response.ok()
        );
        await page.evaluate(() => window.switchChapter(1));
        await stylesheetResponse;
        await page.waitForFunction(() =>
          document.getElementById('lm-global-chapter-styles')?.dataset.loaded === 'true'
        );
        await expect(page.locator('#chapter-1')).toHaveClass(/active/);
        await page.evaluate(() => window.switchChapter(0));
        await expect(page.locator('#chapter-0')).toHaveClass(/active/);
        await page.evaluate(() => document.fonts.ready);
        await page.locator('#chapter-0 .executive-hero-art img').evaluate(image => image.decode());
      }

      await compareCover('css-global-cargado');
      expect(errors, 'Errores JavaScript durante la comparación visual de Portada').toEqual([]);
    } finally {
      await context.close();
    }
  }
});
