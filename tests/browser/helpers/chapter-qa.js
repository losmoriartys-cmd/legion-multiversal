const { expect } = require('@playwright/test');
async function openChapter(page, chapterId) {
  await page.evaluate(id => {
    if (typeof switchChapter !== 'function') throw new Error('switchChapter no está disponible');
    switchChapter(id);
  }, chapterId);
  const panel = page.locator('#chapter-' + chapterId);
  await expect(panel).toHaveClass(/active/);
  return panel;
}
async function inspectHorizontalOverflow(panel) {
  return panel.evaluate(el => {
    const rect = el.getBoundingClientRect();
    const scrollRegions = Array.from(el.querySelectorAll('*')).filter(node => {
      const style = getComputedStyle(node);
      return /(auto|scroll)/.test(style.overflowX) && node.scrollWidth > node.clientWidth + 1;
    }).map(node => ({
      selector: node.id ? '#' + node.id : node.className && typeof node.className === 'string' ? '.' + node.className.trim().split(/\\s+/).join('.') : node.tagName.toLowerCase(),
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth
    }));
    const offenders = Array.from(el.querySelectorAll('*')).map(node => {
      const r = node.getBoundingClientRect(), s = getComputedStyle(node);
      return {tag:node.tagName,id:node.id,className:String(node.className||'').slice(0,120),text:(node.textContent||'').trim().slice(0,60),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),display:s.display,visibility:s.visibility};
    }).filter(x => x.display !== 'none' && x.visibility !== 'hidden' && (x.left < rect.left - 1 || x.right > rect.right + 1));
    return {panel:el.id,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,scrollRegions,offenders};
  });
}
async function assertChapterFitsViewport(panel) {
  const result = await inspectHorizontalOverflow(panel);
  // Hasta 4 px internos pueden provenir del redondeo de borde/padding;
  // el documento, en cambio, nunca puede exceder el viewport.
  expect(result.scrollWidth, JSON.stringify(result,null,2)).toBeLessThanOrEqual(result.clientWidth + 4);
  expect(result.documentWidth, JSON.stringify(result,null,2)).toBeLessThanOrEqual(result.viewportWidth);
}
module.exports = {openChapter,inspectHorizontalOverflow,assertChapterFitsViewport};
