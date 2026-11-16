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
  const primary = page.getByRole('button', { name: /VER QUIÉN ESTÁ EN VIVO/i });
  const secondary = page.getByRole('link', { name: /SOY UNA MARCA/i });
  await expect(title).toBeVisible();
  await expect(primary).toBeVisible();
  await expect(secondary).toBeVisible();

  for (const locator of [title, primary, secondary]) {
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

test('móvil: titular y acciones principales entran en la primera pantalla', async ({ page }) => {
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
