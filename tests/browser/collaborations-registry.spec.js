const {test,expect}=require('@playwright/test');

test.beforeEach(async({page})=>{
  await page.goto('/#chapter-12');
  await page.evaluate(()=>window.gamesRegistryReady);
  await expect(page.locator('#collab-games-registry')).toHaveAttribute('data-collab-ready','true');
});

test('Capítulo 07 muestra las diez sesiones desde el registro maestro',async({page})=>{
  const cards=page.locator('#collab-registry-grid [data-collab-session]');
  await expect(cards).toHaveCount(10);
  await expect(page.locator('#collab-registry-summary')).toContainText('10');
  await expect(page.locator('#collab-registry-summary')).toContainText('11');
  await expect(page.locator('#collab-registry-summary')).toContainText('6');
  await expect(page.locator('#collab-registry-status')).toContainText('10 sesiones visibles');
  await expect(cards.filter({hasText:'BIT-001'}).first()).toContainText('Escape the Backrooms');
  await expect(page.locator('#collab-registry-grid a.collab-pov-link')).toHaveCount(11);
});

test('Among Us distingue cuatro participantes de sus dos canales POV',async({page})=>{
  const card=page.locator('[data-game-id="among-us"]');
  await expect(card).toHaveCount(1);
  await expect(card.locator('[data-collab-participant]')).toHaveCount(4);
  await expect(card.locator('.collab-pov-link')).toHaveCount(2);
  const participants=await card.locator('[data-collab-participant]').evaluateAll(nodes=>nodes.map(node=>node.dataset.collabParticipant));
  expect(participants.sort()).toEqual(['akuma','habitos','lady-moriarty','rod3r1k'].sort());
  const povChannels=await card.locator('.collab-pov-link').evaluateAll(nodes=>nodes.map(node=>node.dataset.povChannel));
  expect(povChannels.sort()).toEqual(['moriartys','rod3r1k'].sort());
  expect(participants).not.toContain('moriartys');
});

test('PEAK conserva el propietario desconocido del POV y permite abrir su VOD',async({page})=>{
  const card=page.locator('[data-game-id="peak"]');
  await expect(card).toHaveCount(1);
  const pov=card.locator('.collab-pov-link[data-pov-channel="unassigned"]');
  await expect(pov).toHaveCount(1);
  await expect(pov).toContainText('CANAL POR CONFIRMAR');
  await expect(pov).toHaveAttribute('href','https://www.twitch.tv/videos/2934341574');
});

test('filtros por texto, categoría y creador reducen los expedientes',async({page})=>{
  const cards=page.locator('#collab-registry-grid [data-collab-session]');
  await page.locator('#collab-search').fill('LEGO Batman');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('BIT-004');
  await page.locator('#collab-search').fill('');
  await page.locator('#collab-category').selectOption('Deducción social');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Among Us');
  await page.locator('#collab-category').selectOption('all');
  await page.locator('#collab-creator').selectOption('dave-nexus');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Fortnite');
  await page.locator('#collab-registry-grid #collab-reset-filters').click();
  await expect(cards).toHaveCount(10);
});

test('cada sesión permite volver al Arsenal por el ID canónico del juego',async({page})=>{
  const card=page.locator('[data-game-id="escape-the-backrooms"]');
  await expect(card.locator('[data-open-arsenal="escape-the-backrooms"]')).toHaveAttribute('href','#arsenal-game-escape-the-backrooms');
  await expect(page.locator('#barfender-expediente')).toBeVisible();
  await expect(page.locator('#barfender-expediente')).toContainText('EXP-001');
});

test('Capítulo 07 no genera overflow horizontal en escritorio, tablet ni móvil',async({page})=>{
  for(const width of [1440,1024,768,390,360]){
    await page.setViewportSize({width,height:900});
    const metrics=await page.evaluate(()=>{
      const registry=document.getElementById('collab-games-registry');
      return {document:document.documentElement.scrollWidth,registryScroll:registry.scrollWidth,registryClient:registry.clientWidth};
    });
    expect(metrics.document,'document overflow at '+width+'px').toBeLessThanOrEqual(width);
    expect(metrics.registryScroll-metrics.registryClient,'registry overflow at '+width+'px').toBeLessThanOrEqual(2);
  }
});
