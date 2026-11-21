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
    return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, offenders, visibleOffenders };
  });
  expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.clientWidth);
});
