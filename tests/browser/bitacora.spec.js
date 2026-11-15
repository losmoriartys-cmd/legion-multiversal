const { test, expect } = require('@playwright/test');

test('el índice de Bitácora enlaza con los capítulos reales del sitio', async ({ page }) => {
  await page.goto('/bitacora-preview.html');
  await page.locator('#next').click();

  const entries = await page.locator('.index-list a').evaluateAll(links =>
    links.map(link => ({ label: link.textContent.trim(), href: link.getAttribute('href') }))
  );
  expect(entries).toHaveLength(13);
  expect(entries.map(entry => entry.href)).toEqual([
    'index.html#chapter-0',
    'index.html#chapter-1',
    'index.html#chapter-11',
    'index.html#chapter-2',
    'index.html#chapter-3',
    'index.html#chapter-9',
    'index.html#chapter-8',
    'index.html#chapter-12',
    'index.html#chapter-14',
    'index.html#chapter-5',
    'index.html#chapter-10',
    'index.html#chapter-6',
    'index.html#chapter-13'
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
