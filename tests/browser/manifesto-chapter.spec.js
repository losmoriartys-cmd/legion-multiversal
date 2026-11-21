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
  expect(await chapter.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(false);
});
