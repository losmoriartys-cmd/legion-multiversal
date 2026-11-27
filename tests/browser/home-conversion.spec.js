const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context }) => {
  // El servidor estático de pruebas no ejecuta Pages Functions.
  await context.route('**/api/contact', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ configured: false, turnstileSiteKey: null })
  }));
});

async function assertHomeActionsFit(page, viewportHeight) {
  const title = page.locator('.executive-hero-copy h2');
  const creators = page.getByRole('button', { name: /CONOCÉ A LOS CREADORES/i });
  const brands = page.getByRole('link', { name: /SOY MARCA/i });
  const recruitment = page.getByRole('button', { name: /QUIERO SUMARME/i });
  await expect(title).toBeVisible();
  await expect(creators).toBeVisible();
  await expect(brands).toBeVisible();
  await expect(recruitment).toBeVisible();

  for (const locator of [title, creators, brands, recruitment]) {
    const bounds = await locator.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewportHeight);
  }
}

test('escritorio: titular y las dos rutas de conversión entran en la primera pantalla', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await assertHomeActionsFit(page, 900);
});

test('móvil: titular y los tres accesos diferenciados entran en la primera pantalla', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await assertHomeActionsFit(page, 812);
});

test('las páginas de marcas, recursos y metodología abren con un H1 visible', async ({ page }) => {
  for (const path of ['/marcas/', '/recursos/', '/metodologia/']) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeVisible();
  }
});

test('el CSS global de capítulos se solicita al navegar, no al abrir la portada', async ({ page }) => {
  const stylesheetRequests = [];
  page.on('request', request => {
    if (request.url().includes('/styles.css?v=20261126-ficha-tabs-1')) {
      stylesheetRequests.push(request.url());
    }
  });

  await page.goto('/');
  await expect(page.locator('#chapter-0')).toHaveClass(/active/);
  expect(stylesheetRequests).toHaveLength(0);

  const stylesheetResponse = page.waitForResponse(response =>
    response.url().includes('/styles.css?v=20261126-ficha-tabs-1') && response.ok()
  );
  await page.locator('.primary-navigation [data-chapter="1"]').click();
  await stylesheetResponse;
  await expect(page.locator('#chapter-1')).toHaveClass(/active/);
  expect(stylesheetRequests).toHaveLength(1);
});

test('portada: actos, indicadores y ocho retratos oficiales funcionan en escritorio y móvil', async ({ page }) => {
  const viewports = [
    { width: 1440, height: 900 },
    { width: 1024, height: 900 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 360, height: 800 }
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('#home-editorial-acts')).toBeVisible();
    const navigation = page.locator('.primary-navigation');
    await expect(navigation.locator('.nav-act')).toHaveCount(3);
    await expect(navigation.locator('.nav-act[data-act="identity"] [data-chapter]').first()).toHaveAttribute('data-chapter', '1');
    await expect(navigation.locator('.nav-act[data-act="action"] [data-chapter]').first()).toHaveAttribute('data-chapter', '3');
    await expect(navigation.locator('.nav-act[data-act="future"] [data-chapter]').first()).toHaveAttribute('data-chapter', '9');
    await expect(navigation.locator('.nav-act[data-act="future"] a[href="./marcas/"]')).toBeVisible();
    await expect(navigation.locator('.nav-act[data-act="identity"] .nav-act-items > .nav-btn')).toHaveCount(3);
    await expect(navigation.locator('.nav-act[data-act="action"] .nav-act-items > .nav-btn')).toHaveCount(3);
    await expect(navigation.locator('.nav-act[data-act="future"] .nav-act-items > .nav-btn')).toHaveCount(4);
    if (viewport.width <= 900) {
      const scrollState = await navigation.evaluate(node => ({
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth
      }));
      expect(scrollState.scrollWidth).toBeGreaterThan(scrollState.clientWidth);
    } else {
      const groupBounds = await navigation.locator('.nav-act').evaluateAll(nodes =>
        nodes.map(node => {
          const rect = node.getBoundingClientRect();
          return { left: rect.left, right: rect.right };
        })
      );
      for (const bounds of groupBounds) {
        expect(bounds.left).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(viewport.width);
      }
    }
    await expect(page.locator('.lm-act-one')).toBeVisible();
    await expect(page.locator('.lm-act-two')).toBeVisible();
    await expect(page.locator('.lm-act-three')).toBeVisible();
    await expect(page.locator('#lm-roster-rail .lm-roster-card')).toHaveCount(8);
    await expect(page.locator('#lm-session-log .lm-log-card')).toHaveCount(3);

    const portraitRail = page.locator('#lm-roster-rail');
    await portraitRail.scrollIntoViewIfNeeded();
    await portraitRail.locator('img').evaluateAll(images => images.forEach(image => { image.loading = 'eager'; }));
    await page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll('#lm-roster-rail img'));
      return images.length === 8 && images.every(image => image.complete && image.naturalWidth > 0);
    }, null, { timeout: 20000 });
    const portraitDimensions = await portraitRail.locator('img').evaluateAll(images =>
      images.map(image => ({ width: image.naturalWidth, height: image.naturalHeight }))
    );
    expect(portraitDimensions.every(image => image.width > 0 && image.height > 0)).toBe(true);
    // La carga de retratos desplazó la página; restaurar el origen antes de medir la portada.
    await page.evaluate(() => window.scrollTo(0, 0));

    const counts = await page.evaluate(async () => {
      const [roster, games] = await Promise.all([
        fetch('./data/roster.json').then(response => response.json()),
        fetch('./data/games.json').then(response => response.json())
      ]);
      const sessions = (games.juegos || []).flatMap(game => game.sesiones || []);
      return {
        profiles: (roster.heroes || []).length,
        sessions: new Set(sessions.map(item => item.bit).filter(Boolean)).size,
        games: (games.juegos || []).length,
        pov: sessions.reduce((sum, item) => sum + (item.pov || []).length, 0)
      };
    });
    for (const key of ['profiles', 'sessions', 'games', 'pov']) {
      await expect(page.locator('[data-indicator="' + key + '"]')).toHaveText(String(counts[key]));
    }

    const actionBounds = await page.locator('#chapter-0 .executive-hero-actions .executive-button').evaluateAll(nodes =>
      nodes.map(node => {
        const rect = node.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
          clientWidth: node.clientWidth, scrollWidth: node.scrollWidth };
      })
    );
    expect(actionBounds).toHaveLength(3);
    for (const bounds of actionBounds) {
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(viewport.width);
      expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth + 1);
    }
    for (let first = 0; first < actionBounds.length; first += 1) {
      for (let second = first + 1; second < actionBounds.length; second += 1) {
        const overlapsHorizontally = Math.min(actionBounds[first].right, actionBounds[second].right) >
          Math.max(actionBounds[first].left, actionBounds[second].left) + 1;
        const overlapsVertically = Math.min(actionBounds[first].bottom, actionBounds[second].bottom) >
          Math.max(actionBounds[first].top, actionBounds[second].top) + 1;
        expect(overlapsHorizontally && overlapsVertically).toBe(false);
      }
    }
    if (viewport.width <= 640) {
      const tops = actionBounds.map(bounds => bounds.top);
      expect(tops).toEqual([...tops].sort((a, b) => a - b));
    }

    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(viewport.width);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#home-editorial-acts [data-open-chapter="2"]').click();
  await expect(page.locator('#chapter-2')).toHaveClass(/active/);
});

test('ficha para marcas: indicadores canónicos, impresión PDF y traducción inglesa', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/marcas/');
  await expect(page.locator('.media-data-strip')).toBeVisible();
  await expect(page.locator('.media-data-cell')).toHaveCount(5);
  await expect(page.locator('.media-stat').first()).toHaveText('8');
  await expect(page.getByRole('button', { name: /GUARDAR \/ IMPRIMIR PDF/i })).toBeVisible();
  await expect(page.locator('.language-toggle')).toHaveText('ENGLISH');
  await page.locator('.language-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.subpage-hero h1')).toContainText('Different worlds.');
  await expect(page.locator('.language-toggle')).toHaveText('ESPAÑOL');
  await page.locator('.language-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('.subpage-hero h1')).toContainText('Diferentes mundos.');
  await expect(page.locator('.brand-nav-cta')).toBeVisible();
  await expect(page.locator('.channel-kit-dossier-link a').first()).toHaveAttribute('href', /#roster\//);
});

