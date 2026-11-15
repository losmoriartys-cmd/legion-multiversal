const { test, expect } = require('@playwright/test');

test('el índice de Bitácora enlaza con los capítulos reales del sitio', async ({ page }) => {
  await page.goto('/bitacora-preview.html');
  await expect(page.locator('.archive-nav a').nth(1)).toHaveText('CAPÍTULO 07 · COLABORACIONES');
  await page.locator('#next').click();

  const entries = await page.locator('.index-list a').evaluateAll(links =>
    links.map(link => ({ label: link.textContent.trim(), href: link.getAttribute('href') }))
  );
  expect(entries).toHaveLength(13);
  expect(entries.map(entry => entry.href)).toEqual([
    './index.html#chapter-0',
    './index.html#chapter-1',
    './index.html#chapter-11',
    './index.html#chapter-2',
    './index.html#chapter-3',
    './index.html#chapter-9',
    './index.html#chapter-8',
    './index.html#chapter-12',
    './index.html#chapter-14',
    './index.html#chapter-5',
    './index.html#chapter-10',
    './index.html#chapter-6',
    './index.html#chapter-13'
  ]);

  const targetChecks = await page.evaluate(async hrefs => {
    const source = await fetch('./index.html').then(response => response.text());
    const documentCopy = new DOMParser().parseFromString(source, 'text/html');
    return hrefs.map(href => {
      const hash = new URL(href, location.href).hash;
      return { href, exists: Boolean(documentCopy.querySelector(hash)) };
    });
  }, entries.map(entry => entry.href));
  expect(targetChecks.every(target => target.exists)).toBe(true);
});

test('el directorio de Bitácora usa los ocho nombres y slugs canónicos del Roster', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/bitacora-preview.html');
  const grid = page.locator('#directory-grid');
  await expect(grid).toHaveAttribute('data-loaded', 'true');
  await expect(grid.locator('.directory-card')).toHaveCount(8);

  const cards = await grid.locator('.directory-card').evaluateAll(nodes =>
    nodes.map(node => ({
      name: node.querySelector('strong')?.textContent.trim(),
      href: node.getAttribute('href')
    }))
  );
  expect(cards).toEqual([
    { name: 'LOS MORIARTYS', href: './index.html#expediente-moriartys' },
    { name: 'ROD3R1K', href: './index.html#expediente-rod3r1k' },
    { name: 'LADY MORIARTY', href: './index.html#expediente-lady-moriarty' },
    { name: 'ARDIPII', href: './index.html#expediente-ardipii' },
    { name: 'AKUMA', href: './index.html#expediente-akuma' },
    { name: 'DAVE — NEXUS', href: './index.html#expediente-dave-nexus' },
    { name: 'PATO — ORATORIS', href: './index.html#expediente-pato-oratoris' },
    { name: 'HABITOS', href: './index.html#expediente-habitos' }
  ]);
  expect(errors).toEqual([]);
});


test('el libro recorre los quince folios y mantiene las dos páginas visibles en móvil', async ({ browser }) => {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  desktop.on('pageerror', error => errors.push(error.message));
  desktop.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await desktop.goto('/bitacora-preview.html');
  await desktop.locator('#next').click();

  const expectedTags = [
    'ARCHIVO GENERAL · ÍNDICE',
    'CAPÍTULO 00 · INICIO',
    'CAPÍTULO 01 · ORIGEN',
    'CAPÍTULO 02 · VALORES',
    'CAPÍTULO 03 · ROSTER',
    'CAPÍTULO 04 · ESTADÍSTICAS',
    'CAPÍTULO 05 · COMUNIDAD',
    'CAPÍTULO 06 · ALIANZAS',
    'CAPÍTULO 07 · COLABORACIONES',
    'EXPEDIENTE 001 · BARFENDER',
    'ANEXO · CAMPAÑAS Y ACCESOS',
    'CAPÍTULO 08 · ARSENAL',
    'CAPÍTULO 09 · EN VIVO',
    'CAPÍTULO 10 · RECLUTAMIENTO',
    'EXTRA · MAPA MULTIVERSAL'
  ];
  const seen = [];
  for (let index = 0; index < expectedTags.length; index += 1) {
    await expect(desktop.locator('.leaf').first()).toContainText(expectedTags[index]);
    seen.push(await desktop.locator('.leaf').first().locator('.eyebrow').innerText());
    if (index < expectedTags.length - 1) await desktop.locator('#next').click();
  }
  expect(seen).toEqual(expectedTags);
  await expect(desktop.locator('#page-number')).toContainText('/ 15');
  await expect(desktop.locator('#next')).toBeDisabled();
  expect(errors).toEqual([]);

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto('/bitacora-preview.html');
  await mobile.locator('#next').click();
  await expect(mobile.locator('.leaf')).toHaveCount(2);
  await expect(mobile.locator('.leaf').nth(1)).toBeVisible();
  await expect(mobile.locator('.index-list')).toHaveCSS('columns', '1');
  await desktop.close();
  await mobile.close();
});
