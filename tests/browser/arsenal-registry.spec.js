const {test,expect}=require('@playwright/test');

test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{document.addEventListener('DOMContentLoaded',()=>{const style=document.createElement('style');style.textContent='html{scroll-behavior:auto!important}';document.head.appendChild(style);});});
  await page.goto('/#chapter-12');
  await page.evaluate(()=>window.arsenalRegistryReady);
  await expect(page.locator('#arsenal-registry')).toHaveAttribute('data-arsenal-ready','true');
});

test('Arsenal carga 18 juegos únicos y separa sus estados',async({page})=>{
  const cards=page.locator('#arsenal-grid [data-arsenal-game]');
  await expect(cards).toHaveCount(18);
  await expect(page.locator('#arsenal-registry-status')).toContainText('18 juegos visibles');
  await expect(page.locator('#arsenal-registry-summary')).toContainText('11');
  await expect(page.locator('#arsenal-registry-summary')).toContainText('7');
  await page.locator('#arsenal-status-filter').selectOption('documented');
  await expect(cards).toHaveCount(11);
  await page.locator('#arsenal-status-filter').selectOption('discovery');
  await expect(cards).toHaveCount(7);
});

test('Escape the Backrooms aparece una sola vez con su título y tienda oficial',async({page})=>{
  const card=page.locator('#arsenal-game-escape-the-backrooms');
  await expect(card).toHaveCount(1);
  await expect(card).toContainText('Escape the Backrooms');
  await expect(card.locator('a.arsenal-store-link')).toHaveAttribute('href','https://store.steampowered.com/app/1943950/');
  await expect(page.locator('#arsenal-grid')).not.toContainText('Backrooms: Escape Together');
});

test('filtros por búsqueda, categoría y jugadores operan sobre el registro compartido',async({page})=>{
  const cards=page.locator('#arsenal-grid [data-arsenal-game]');
  await page.locator('#arsenal-search').fill('Fortnite');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toHaveAttribute('data-game-id','fortnite');
  await page.locator('#arsenal-search').fill('');
  await page.locator('#arsenal-category-filter').selectOption('Terror cooperativo');
  await expect(cards).toHaveCount(5);
  await page.locator('#arsenal-category-filter').selectOption('all');
  await page.locator('#arsenal-players-filter').selectOption('4');
  const ids=await cards.evaluateAll(nodes=>nodes.map(node=>node.dataset.gameId));
  expect(ids).toContain('escape-the-backrooms');
  expect(ids).toContain('barfender');
  expect(ids).not.toContain('minecraft');
});

test('la ruleta elige únicamente entre los juegos filtrados',async({page})=>{
  await page.locator('#arsenal-search').fill('LEGO Batman');
  await expect(page.locator('#arsenal-grid [data-arsenal-game]')).toHaveCount(1);
  await page.locator('#arsenal-roulette-button').click();
  await expect(page.locator('#arsenal-roulette-result')).toContainText('LEGO Batman');
  await expect(page.locator('#arsenal-roulette-result [data-roulette-open]')).toHaveAttribute('data-roulette-open','lego-batman');
});

test('Arsenal y Bitácora se enlazan mediante IDs estables',async({page})=>{
  await page.evaluate(()=>window.gamesRegistryReady);
  await page.locator('#arsenal-game-escape-the-backrooms [data-open-bit]').click();
  await expect(page.locator('#chapter-12')).toHaveClass(/active/);
  await expect(page.locator('#bit-001')).toBeVisible();
  await expect(page.locator('#bit-001 details.collab-ficha')).toHaveJSProperty('open',true);
  const arsenalLink=page.locator('#bit-001 [data-open-arsenal="escape-the-backrooms"]');
  await expect(arsenalLink).toBeInViewport({ratio:1});
  await arsenalLink.click();
  await expect(page.locator('#chapter-12')).toHaveClass(/active/);
  await expect(page.locator('#arsenal-game-escape-the-backrooms')).toBeVisible();
});

test('Arsenal mantiene el ancho y una columna en móvil',async({page})=>{
  for(const width of [1440,1024,768,390,360]){
    await page.setViewportSize({width,height:900});
    const metrics=await page.evaluate(()=>{
      const grid=document.getElementById('arsenal-grid');
      return {document:document.documentElement.scrollWidth,gridScroll:grid.scrollWidth,gridClient:grid.clientWidth,columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length};
    });
    expect(metrics.document,'document overflow at '+width+'px').toBeLessThanOrEqual(width);
    expect(metrics.gridScroll-metrics.gridClient,'Arsenal grid overflow at '+width+'px').toBeLessThanOrEqual(2);
    if(width<=650)expect(metrics.columns).toBe(1);
  }
});
