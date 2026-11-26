const {test,expect}=require('@playwright/test');

test.beforeEach(async({page})=>{
  await page.goto('/#chapter-12');
  await page.evaluate(()=>window.gamesRegistryReady);
  await expect(page.locator('#collab-games-registry')).toHaveAttribute('data-collab-ready','true');
});

test('Capítulo 07 muestra las once sesiones desde el registro maestro',async({page})=>{
  const cards=page.locator('#collab-registry-grid [data-collab-session]');
  await expect(cards).toHaveCount(11);
  await expect(page.locator('#collab-registry-summary')).toContainText('11');
  await expect(page.locator('#collab-registry-summary')).toContainText('14');
  await expect(page.locator('#collab-registry-summary')).toContainText('6');
  await expect(page.locator('#collab-registry-status')).toContainText('11 sesiones visibles');
  await expect(cards.filter({hasText:'BIT-001'}).first()).toContainText('Escape the Backrooms');
  await expect(page.locator('#collab-registry-grid a.collab-pov-link')).toHaveCount(14);
});

test('Among Us distingue cuatro participantes de sus dos canales POV',async({page})=>{
  const card=page.locator('#collab-registry-grid [data-game-id="among-us"]');
  await expect(card).toHaveCount(1);
  await expect(card.locator('[data-collab-participant]')).toHaveCount(4);
  await expect(card.locator('.collab-pov-link')).toHaveCount(2);
  const participants=await card.locator('[data-collab-participant]').evaluateAll(nodes=>nodes.map(node=>node.dataset.collabParticipant));
  expect(participants.sort()).toEqual(['akuma','habitos','lady-moriarty','rod3r1k'].sort());
  const povChannels=await card.locator('.collab-pov-link').evaluateAll(nodes=>nodes.map(node=>node.dataset.povChannel));
  expect(povChannels.sort()).toEqual(['moriartys','rod3r1k'].sort());
  expect(participants).not.toContain('moriartys');
});

test('BarFender concentra imagen, clips y archivo EXP-001 dentro de BIT-011',async({page})=>{
  const card=page.locator('#collab-registry-grid [data-collab-session="BIT-011"]');
  await expect(card).toHaveCount(1);
  await card.locator('details.collab-ficha > summary').click();
  await expect(card.locator('.collab-session-art img')).toHaveAttribute('src','BarFenderLos4.jpg');
  await expect(card.locator('.collab-clip-list li')).toHaveCount(4);
  await expect(card.locator('.collab-session-actions a').filter({hasText:'ARCHIVO HISTÓRICO · EXP-001'})).toHaveAttribute('href','#barfender-expediente');
  const archive=page.locator('#barfender-expediente');
  await expect(archive.locator('summary')).toContainText('ARCHIVO HISTÓRICO');
  await expect(archive.locator('.campaign-four-views')).toHaveCount(0);
});

test('PEAK asigna su POV al canal de Akuma y permite abrir su VOD',async({page})=>{
  const card=page.locator('#collab-registry-grid [data-game-id="peak"]');
  await expect(card).toHaveCount(1);
  const pov=card.locator('.collab-pov-link[data-pov-channel="akuma"]');
  await expect(pov).toHaveCount(1);
  await expect(pov).not.toContainText('CANAL POR CONFIRMAR');
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
  await page.locator('#collab-search').fill('');
  await page.locator('#collab-category').selectOption('all');
  await page.locator('#collab-creator').selectOption('all');
  await expect(cards).toHaveCount(11);
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
      const grid=document.getElementById('collab-registry-grid');
      const box=registry.getBoundingClientRect();
      const offenders=Array.from(registry.querySelectorAll('*')).map(node=>{
        const rect=node.getBoundingClientRect();
        const style=getComputedStyle(node);
        return {tag:node.tagName,id:node.id,className:String(node.className||'').slice(0,90),text:(node.textContent||'').trim().slice(0,45),left:Math.round(rect.left),right:Math.round(rect.right),width:Math.round(rect.width),display:style.display};
      }).filter(item=>item.width>0&&item.display!=='none'&&(item.left<box.left-1||item.right>box.right+1));
      return {
        document:document.documentElement.scrollWidth,
        registryScroll:registry.scrollWidth,
        registryClient:registry.clientWidth,
        registryLeft:Math.round(box.left),
        registryRight:Math.round(box.right),
        columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,
        offenders:offenders.slice(0,20)
      };
    });
    expect(metrics.document,'document overflow at '+width+'px').toBeLessThanOrEqual(width);
    expect(metrics.registryScroll-metrics.registryClient,'registry overflow at '+width+'px: '+JSON.stringify(metrics)).toBeLessThanOrEqual(2);
    if(width<=650) expect(metrics.columns,'mobile must use one column at '+width+'px').toBe(1);
  }
});

test('la ficha organiza resumen, jugaron, POV, clips y números en pestañas accesibles',async({page})=>{
  const card=page.locator('#collab-registry-grid [data-game-id="among-us"]');
  await card.locator('details.collab-ficha > summary').click();
  const tabs=card.locator('[role="tab"]');
  await expect(tabs).toHaveCount(5);
  await expect(tabs.first()).toHaveAttribute('aria-selected','true');
  await expect(card.locator('.collab-empty-state').first()).toContainText('pendiente');
  await tabs.nth(2).click();
  await expect(card.locator('.collab-pov-link').first()).toBeVisible();
  await tabs.nth(2).press('ArrowRight');
  await expect(tabs.nth(3)).toHaveAttribute('aria-selected','true');
  await expect(card.locator('[role="tabpanel"]:not([hidden])')).toContainText('clips');
  await tabs.nth(4).click();
  await expect(card.locator('[role="tabpanel"]:not([hidden])')).toContainText('Sin números verificados');
});
