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
    if (request.url().includes('/styles.css?v=20261116-commercial-portfolio-1')) {
      stylesheetRequests.push(request.url());
    }
  });

  await page.goto('/');
  await expect(page.locator('#chapter-0')).toHaveClass(/active/);
  expect(stylesheetRequests).toHaveLength(0);

  const stylesheetResponse = page.waitForResponse(response =>
    response.url().includes('/styles.css?v=20261116-commercial-portfolio-1') && response.ok()
  );
  await page.locator('.primary-navigation [data-chapter="1"]').click();
  await stylesheetResponse;
  await expect(page.locator('#chapter-1')).toHaveClass(/active/);
  expect(stylesheetRequests).toHaveLength(1);
});
