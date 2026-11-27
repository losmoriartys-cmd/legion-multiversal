const {test,expect}=require('@playwright/test');
const {openChapter,assertChapterFitsViewport}=require('./helpers/chapter-qa');
const chapters=[0,1,2,3,11,9,10,8,12,6,13];
const viewports=[{name:'desktop-wide',width:1440,height:1000},{name:'desktop',width:1024,height:900},{name:'tablet',width:768,height:1024},{name:'mobile',width:390,height:844},{name:'mobile-small',width:360,height:800}];
for(const viewport of viewports){
 test('QA común: navegación y overflow de todos los capítulos en '+viewport.name,async({page},testInfo)=>{
  test.setTimeout(120000);
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  // Se fija reduced-motion y el fallback de tipografía en todos los viewports.
  await page.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//,route=>route.abort());
  await page.setViewportSize({width:viewport.width,height:viewport.height});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.evaluate(()=>document.fonts.ready);
  for(const chapterId of chapters){
   const panel=await openChapter(page,chapterId);
   await assertChapterFitsViewport(panel);
   // Evidencia visual representativa para cada capítulo: escritorio ancho y móvil.
   // Los otros tres tamaños siguen ejecutando todas las aserciones responsive.
   if((viewport.name==='desktop-wide'||viewport.name==='mobile')&&chapterId===0){
    const portraitRail=page.locator('#lm-roster-rail');
    await portraitRail.scrollIntoViewIfNeeded();
    await portraitRail.locator('img').evaluateAll(images=>images.forEach(image=>{image.loading='eager';}));
    await page.waitForFunction(()=>{
     const images=Array.from(document.querySelectorAll('#lm-roster-rail img'));
     return images.length===8&&images.every(image=>image.complete&&image.naturalWidth>0);
    },null,{timeout:20000});
    await page.evaluate(()=>window.scrollTo(0,0));
   }
   if(viewport.name==='desktop-wide'||viewport.name==='mobile'){
    await panel.screenshot({
     path:testInfo.outputPath('chapter-'+chapterId+'-'+viewport.name+'.png'),
     animations:'disabled',
     caret:'hide'
    });
   }
  }
  expect(pageErrors,'Errores JavaScript de página').toEqual([]);
 });
}
test('QA común: índice y recorrido de capítulos',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 const actualChapterIds = await page.locator('[id^="chapter-"]').evaluateAll(nodes =>
  nodes.map(node => /^chapter-(\d+)$/.exec(node.id)).filter(Boolean).map(match => Number(match[1])).sort((a,b)=>a-b)
 );
 expect(actualChapterIds, 'La matriz QA debe cubrir todos los paneles chapter-N existentes en index.html').toEqual([...chapters].sort((a,b)=>a-b));
 await expect(page.locator('body > header').first()).toBeVisible();
 expect(await page.locator('[onclick*="switchChapter"]').count()).toBeGreaterThan(0);
 for(const chapterId of chapters){
  const panel=await openChapter(page,chapterId);
  await expect(panel).toBeVisible();
 }
});
