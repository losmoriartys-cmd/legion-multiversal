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
    }).map(node => {
      const r = node.getBoundingClientRect();
      return {
        selector: node.id ? '#' + node.id : node.className && typeof node.className === 'string' ? '.' + node.className.trim().split(/\\s+/).join('.') : node.tagName.toLowerCase(),
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        left: Math.round(r.left),
        right: Math.round(r.right),
        contained: r.left >= rect.left - 1 && r.right <= rect.right + 1
      };
    });
    const offenders = Array.from(el.querySelectorAll('*')).map(node => {
      let parent = node.parentElement;
      let insideScrollRegion = false;
      while (parent && parent !== el) {
        if (/(auto|scroll)/.test(getComputedStyle(parent).overflowX)) {
          insideScrollRegion = true;
          break;
        }
        parent = parent.parentElement;
      }
      const r = node.getBoundingClientRect(), s = getComputedStyle(node);
      return {insideScrollRegion,tag:node.tagName,id:node.id,className:String(node.className||'').slice(0,120),text:(node.textContent||'').trim().slice(0,60),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),height:Math.round(r.height),display:s.display,visibility:s.visibility};
    }).filter(x => !x.insideScrollRegion && x.width > 0 && x.height > 0 && x.display !== 'none' && x.visibility !== 'hidden' && (x.left < rect.left - 1 || x.right > rect.right + 1));
    return {panel:el.id,panelScrollWidth:el.scrollWidth,panelClientWidth:el.clientWidth,documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,scrollRegions,offenders};
  });
}
async function assertChapterFitsViewport(panel) {
  const result = await inspectHorizontalOverflow(panel);
  // El ancho interno de una tabla puede ser mayor que su wrapper: es scroll deliberado.
  // Se valida que el wrapper permanezca dentro del capítulo y que ningún elemento
  // visible escape del panel; el documento debe ajustarse estrictamente al viewport.
  expect(result.scrollRegions.filter(region => !region.contained), JSON.stringify(result,null,2)).toEqual([]);
  expect(result.offenders, JSON.stringify(result,null,2)).toEqual([]);
  expect(result.documentWidth, JSON.stringify(result,null,2)).toBeLessThanOrEqual(result.viewportWidth);
}
module.exports = {openChapter,inspectHorizontalOverflow,assertChapterFitsViewport};
