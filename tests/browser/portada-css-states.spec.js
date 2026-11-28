const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
];

async function panelState(page) {
  return page.locator('.executive-hero-copy').evaluate(el => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      rect: { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, right: r.right, bottom: r.bottom, left: r.left },
      style: {
        padding: s.padding,
        border: s.border,
        backgroundImage: s.backgroundImage,
        backgroundColor: s.backgroundColor,
        boxShadow: s.boxShadow,
        borderRadius: s.borderRadius,
        display: s.display,
        position: s.position
      },
      overflow: el.scrollWidth > el.clientWidth
    };
  });
}

for (const viewport of viewports) {
  test(`Portada ${viewport.name}: compara CSS crítico y styles.css diferido`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.route(/styles\.css(?:\?|$)/, route => route.abort());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const panel = page.locator('.executive-hero-copy');
    await expect(panel).toBeVisible();
    await page.addStyleTag({ content: '*{animation:none!important;transition:none!important;caret-color:transparent!important}' });

    const cold = await panelState(page);
    await panel.screenshot({ path: `test-results/portada-${viewport.name}-css-critico.png` });

    await page.unroute(/styles\.css(?:\?|$)/);
    await page.evaluate(async () => {
      const link = document.getElementById('lm-global-chapter-styles');
      if (!link) throw new Error('No se encontró #lm-global-chapter-styles');
      const href = link.dataset.href;
      if (!href) throw new Error('No se encontró data-href para styles.css');
      await new Promise((resolve, reject) => {
        link.onload = resolve;
        link.onerror = () => reject(new Error('No se pudo cargar styles.css'));
        link.rel = 'stylesheet';
        link.href = href;
      });
    });
    await page.evaluate(() => document.fonts.ready);

    const warm = await panelState(page);
    await panel.screenshot({ path: `test-results/portada-${viewport.name}-css-diferido.png` });

    expect(cold.overflow, 'El panel no debe desbordar horizontalmente en carga fría').toBe(false);
    expect(warm.overflow, 'El panel no debe desbordar horizontalmente tras styles.css').toBe(false);
    expect(Math.abs(cold.rect.x - warm.rect.x), 'Desplazamiento horizontal del panel').toBeLessThanOrEqual(1);
    expect(Math.abs(cold.rect.y - warm.rect.y), 'Desplazamiento vertical del panel').toBeLessThanOrEqual(1);
    expect(Math.abs(cold.rect.width - warm.rect.width), 'Cambio de ancho del panel').toBeLessThanOrEqual(1);
    expect(Math.abs(cold.rect.height - warm.rect.height), 'Cambio de alto del panel').toBeLessThanOrEqual(1);
    expect(warm.style.padding).toBe(cold.style.padding);
    expect(warm.style.border).toBe(cold.style.border);
    expect(warm.style.backgroundImage).toBe(cold.style.backgroundImage);
    expect(warm.style.boxShadow).toBe(cold.style.boxShadow);
  });
}
