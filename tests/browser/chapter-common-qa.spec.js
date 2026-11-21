const {test,expect}=require('@playwright/test');
const {openChapter,assertChapterFitsViewport}=require('./helpers/chapter-qa');
const chapters=[0,1,2,3,11,9,10,8,12,5,6,13];
const viewports=[{name:'desktop-wide',width:1440,height:1000},{name:'desktop',width:1024,height:900},{name:'tablet',width:768,height:1024},{name:'mobile',width:390,height:844},{name:'mobile-small',width:360,height:800}];
for(const viewport of viewports){
 test('QA común: navegación y overflow de todos los capítulos en '+viewport.name,async({page})=>{
  test.setTimeout(90000);const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
  await page.setViewportSize({width:viewport.width,height:viewport.height});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  for(const chapterId of chapters){const panel=await openChapter(page,chapterId);await assertChapterFitsViewport(panel);}
  expect(pageErrors,'Errores JavaScript de página').toEqual([]);
 });
}
test('QA común: índice y recorrido de capítulos',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await expect(page.locator('header')).toBeVisible();expect(await page.locator('[onclick*="switchChapter"]').count()).toBeGreaterThan(0);
 for(const chapterId of chapters){const panel=await openChapter(page,chapterId);await expect(panel).toBeVisible();}
});
