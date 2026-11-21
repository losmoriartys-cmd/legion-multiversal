const { test, expect } = require('@playwright/test');

test('Quiénes somos presenta historia, valores, prácticas y recorrido de incorporación', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.evaluate(() => switchChapter(11));
  const chapter = page.locator('#chapter-11');
  await expect(chapter).toHaveClass(/active/);
  await expect(chapter.locator('.manifesto-values-grid [role="listitem"]')).toHaveCount(6);
  await expect(chapter.locator('.manifesto-history-line li')).toHaveCount(4);
  await expect(chapter.locator('.manifesto-onboarding-grid article')).toHaveCount(3);
  await expect(chapter.getByText('LO QUE OFRECEMOS')).toBeVisible();
  await expect(chapter.getByText('LO QUE NO PROMETEMOS')).toBeVisible();
  const tabs = chapter.getByRole('tab');
  await expect(tabs).toHaveCount(3);
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await expect(chapter.locator('#manifesto-panel-before')).toBeVisible();
  await expect(chapter.locator('#manifesto-panel-during')).toBeHidden();
  await tabs.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(chapter.locator('#manifesto-panel-during')).toBeVisible();
  await expect(chapter.locator('#manifesto-panel-before')).toBeHidden();
  await tabs.nth(2).click();
  await expect(chapter.locator('#manifesto-panel-after')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Quiénes somos se adapta a móvil y conserva controles con reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => switchChapter(11));
  const chapter = page.locator('#chapter-11');
  await expect(chapter.locator('.manifesto-history-line li')).toHaveCount(4);
  await expect(chapter.getByRole('tab', { name: /DURANTE/ })).toBeVisible();
  const overflow = await chapter.evaluate(el => {
    const bounds = el.getBoundingClientRect();
    const offenders = Array.from(el.querySelectorAll('*')).map(node => {
      const rect = node.getBoundingClientRect();
      return { tag: node.tagName, className: String(node.className || '').slice(0, 100),
        left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) };
    }).filter(item => item.right > bounds.right + 1 || item.left < bounds.left - 1);
    const visibleOffenders = Array.from(el.querySelectorAll('*')).filter(node => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 &&
        (rect.right > bounds.right + 1 || rect.left < bounds.left - 1);
    }).map(node => ({tag:node.tagName,className:String(node.className||'').slice(0,100),
      text:(node.textContent||'').trim().slice(0,90),rect:(()=>{const r=node.getBoundingClientRect();return {left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)}})()}));
    const pseudoOffenders = Array.from(el.querySelectorAll('*')).flatMap(node => ['::before','::after'].flatMap(pseudo => {
      const style = getComputedStyle(node, pseudo);
      if (style.content === 'none' || style.content === 'normal' || style.display === 'none' || style.visibility === 'hidden') return [];
      const rect = node.getBoundingClientRect();
      const left = parseFloat(style.left);
      const right = parseFloat(style.right);
      const width = parseFloat(style.width);
      const position = style.position;
      const estimatedLeft = position === 'absolute' || position === 'relative' ? rect.left + (Number.isFinite(left) ? left : 0) : rect.left;
      const estimatedRight = Number.isFinite(width) ? estimatedLeft + width : rect.right - (Number.isFinite(right) ? right : 0);
      return (estimatedLeft < bounds.left - 1 || estimatedRight > bounds.right + 1)
        ? [{tag:node.tagName,className:String(node.className||'').slice(0,100),pseudo,content:style.content,position,left:style.left,right:style.right,width:style.width,estimatedLeft:Math.round(estimatedLeft),estimatedRight:Math.round(estimatedRight)}]
        : [];
    }));
    const panelPseudos = ['::before','::after'].map(pseudo => {
      const style = getComputedStyle(el, pseudo);
      return {pseudo,content:style.content,display:style.display,position:style.position,
        left:style.left,right:style.right,width:style.width,marginLeft:style.marginLeft,marginRight:style.marginRight,
        transform:style.transform};
    }).filter(item => item.content !== 'none' && item.content !== 'normal' && item.display !== 'none');
    const directChildren = Array.from(el.children).map(node => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {tag:node.tagName,className:String(node.className||'').slice(0,100),
        scrollWidth:node.scrollWidth,clientWidth:node.clientWidth,
        left:Math.round(rect.left),right:Math.round(rect.right),width:Math.round(rect.width),
        marginLeft:style.marginLeft,marginRight:style.marginRight,paddingLeft:style.paddingLeft,paddingRight:style.paddingRight,
        position:style.position,transform:style.transform,overflowX:style.overflowX};
    });
    return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
      panelRect:{left:Math.round(bounds.left),right:Math.round(bounds.right),width:Math.round(bounds.width)},
      panelPadding:{left:getComputedStyle(el).paddingLeft,right:getComputedStyle(el).paddingRight},
      document:{scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth},
      offenders,visibleOffenders,pseudoOffenders,panelPseudos,directChildren };
  });
  expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.clientWidth);
});
