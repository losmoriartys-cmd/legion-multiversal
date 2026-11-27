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
    'points = []',
    'if bbox:',
    '    for index, value in enumerate(mask.getdata()):',
    '        if value:',
    '            x, y = index % main.width, index // main.width',
    '            points.append({"x": x, "y": y, "main": list(main.getpixel((x, y))), "candidate": list(candidate.getpixel((x, y)))})',
    '            if len(points) >= 40: break',
    'print(json.dumps({"sameDimensions": True, "maxChannelDelta": max_delta, "changedPixelCount": changed_count, "bbox": bbox, "sampleDiffs": points}))'
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
        scrollTop: scroller.scrollTop,
        minViewportTop: documentTop - maxScrollTop,
        maxViewportTop: documentTop
      };
    })
  ));
  // Alinear el origen del elemento en el viewport evita que los bordes
  // redondeados y las barras internas caigan en distintas fases subpíxel.
  // Para Estadísticas se neutralizan primero los fondos globales; así el scroll
  // diferente que pueda exigir esa alineación no contamina el recorte del panel.
  const isStatsComparison = surface.name === 'stats-comparativa-twitch';
  const backdropOverrides = isStatsComparison
    ? await Promise.all([mainPage, candidatePage].map(page =>
        page.addStyleTag({
          content: 'body { background-image: none !important; background-color: #090f19 !important; } body::after { display: none !important; }'
        })
      ))
    : [];

  const minSharedTop = Math.max(...captureRanges.map(range => range.minViewportTop));
  const maxSharedTop = Math.min(...captureRanges.map(range => range.maxViewportTop));
  expect(
    minSharedTop,
    'Baseline y candidato no tienen una posición vertical de captura común: ' + JSON.stringify(captureRanges)
  ).toBeLessThanOrEqual(maxSharedTop + 0.25);
  const captureTop = Math.max(minSharedTop, Math.min(64, maxSharedTop));

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
  expect(
    Math.abs(captureOrigins[0].left - captureOrigins[1].left),
    'Las superficies no comparten el mismo origen horizontal de captura: ' + JSON.stringify(captureOrigins)
  ).toBeLessThanOrEqual(0.25);

  if (surface.name === 'stats-comparativa-twitch') {
    const geometry = await Promise.all([mainElement, candidateElement].map(async (element, index) => {
      const state = await element.evaluate(node => {
        const rect = target => {
          if (!target) return null;
          const bounds = target.getBoundingClientRect();
          return {
            x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height,
            right: bounds.right, bottom: bounds.bottom
          };
        };
        const rows = Array.from(node.querySelectorAll('.stats-comparison-row'));
        const scroller = document.scrollingElement || document.documentElement;
        const ancestors = [];
        let ancestor = node;
        while (ancestor && ancestors.length < 8) {
          const style = getComputedStyle(ancestor);
          ancestors.push({
            tag: ancestor.tagName,
            id: ancestor.id || '',
            className: String(ancestor.className || ''),
            rect: rect(ancestor),
            position: style.position,
            transform: style.transform,
            filter: style.filter,
            opacity: style.opacity,
            backgroundColor: style.backgroundColor,
            backgroundImage: style.backgroundImage,
            borderRadius: style.borderRadius,
            border: style.border,
            boxShadow: style.boxShadow,
            overflow: style.overflow,
            isolation: style.isolation,
            contain: style.contain,
            willChange: style.willChange
          });
          ancestor = ancestor.parentElement;
        }
        return {
          dpr: window.devicePixelRatio,
          viewport: { width: innerWidth, height: innerHeight },
          scroll: { x: scroller.scrollLeft, y: scroller.scrollTop, documentTop: node.getBoundingClientRect().top + scroller.scrollTop },
          surface: rect(node),
          ancestors,
          rows: rows.map(row => {
            const tracks = Array.from(row.querySelectorAll('.stats-comparison-track'));
            return {
              label: row.querySelector('strong')?.textContent?.trim() || '',
              row: rect(row),
              gridColumns: getComputedStyle(row).gridTemplateColumns,
              tracks: tracks.map(track => {
                const fill = track.querySelector('i');
                const trackStyle = getComputedStyle(track);
                const fillStyle = fill ? getComputedStyle(fill) : null;
                return {
                  track: rect(track),
                  fill: rect(fill),
                  inlineWidth: fill?.getAttribute('style') || '',
                  computedWidth: fillStyle?.width || null,
                  background: fillStyle?.backgroundColor || null,
                  radius: fillStyle?.borderRadius || null,
                  transform: fillStyle?.transform || null,
                  trackRadius: trackStyle.borderRadius
                };
              })
            };
          })
        };
      });
      return { side: index === 0 ? 'main' : 'candidate', ...state };
    }));
    console.log('STATS_COMPARISON_GEOMETRY_' + viewportName + ': ' + JSON.stringify(geometry));
  }

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
