const {test,expect}=require('@playwright/test');

test('Bitácora y Arsenal entregan sus fichas iniciales sin JavaScript',async({browser},testInfo)=>{
  const context=await browser.newContext({javaScriptEnabled:false,baseURL:testInfo.project.use.baseURL});
  const page=await context.newPage();
  await page.goto('/');
  await expect(page.locator('#collab-registry-grid [data-prerendered="true"]')).toHaveCount(11);
  await expect(page.locator('#arsenal-grid [data-prerendered="true"]')).toHaveCount(18);
  await expect(page.locator('#collab-registry-summary strong')).toHaveText(['11','11','14','6']);
  await expect(page.locator('#arsenal-registry-summary strong')).toHaveText(['18','11','7']);
  await expect(page.locator('#collab-registry-status')).toContainText('Contenido HTML disponible');
  await expect(page.locator('#arsenal-registry-status')).toContainText('Catálogo HTML disponible');
  await expect(page.locator('.collab-registry-controls')).toBeHidden();
  await expect(page.locator('.arsenal-registry-controls')).toBeHidden();
  await expect(page.locator('#arsenal-roulette-button')).toBeHidden();
  await expect(page.locator('.arsenal-roulette-panel')).toBeHidden();
  await expect(page.locator('#bit-011')).toContainText('BarFender');
  await expect(page.locator('#bit-011 .collab-session-date')).toHaveAttribute('href',/twitch/);
  await expect(page.locator('#arsenal-game-barfender')).toContainText('BarFender');
  await context.close();
});

test('si falla games.json, se conserva el HTML prerenderizado',async({page})=>{
  await page.route('**/data/games.json',route=>route.abort());
  await page.goto('/#chapter-12');
  await expect(page.locator('#collab-registry-grid [data-prerendered="true"]')).toHaveCount(11);
  await expect(page.locator('#arsenal-grid [data-prerendered="true"]')).toHaveCount(18);
  await expect(page.locator('#collab-registry-status')).toContainText('el contenido HTML sigue disponible');
  await expect(page.locator('#arsenal-registry-status')).toContainText('el contenido HTML sigue disponible');
  await expect(page.locator('.collab-registry-controls input')).toBeDisabled();
  await expect(page.locator('.arsenal-registry-controls input')).toBeDisabled();
});
