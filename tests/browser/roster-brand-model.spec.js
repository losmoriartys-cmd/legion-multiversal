const { test, expect } = require('@playwright/test');

test('el modelo de marca clasifica actividad con cobertura, antigüedad y datos suficientes', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => {
    const now = Date.parse('2026-11-19T12:00:00Z');
    const offsets = [2, 4, 9, 13, 17, 22, 25];
    const snapshots = Array.from({ length: 28 }, (_, i) => ({
      sampled_at: new Date(now - (27 - i) * 86400000).toISOString(),
      is_live: offsets.includes(i)
    }));
    const daily_activity = offsets.map(i => ({
      date: new Date(now - (27 - i) * 86400000).toISOString().slice(0, 10),
      live_samples: 1
    }));
    const rhythm = window.LMBrand.computeRhythm({ snapshots, window: { samples_total: 28, daily_activity } }, now);
    return {
      level: rhythm.level,
      activeDays: rhythm.activeDays,
      slots: window.LMBrand.cardSlots({
        id: 'fixture',
        accounts: [{ platform: 'twitch', account_type: 'creator_channel' }]
      }, {
        now,
        channel: { snapshots, window: { samples_total: 28, daily_activity } },
        average: 23.4,
        followers: [{ platform: 'twitch', count: 1200, source: 'Fuente de prueba', as_of: '2026-11-18' }]
      })
    };
  });
  expect(result.level).toBe('OCASIONAL');
  expect(result.activeDays).toBe(7);
  expect(result.slots).toHaveLength(3);
  expect(result.slots[0][1]).toBe('1.200');
  expect(result.slots[1][1]).toBe('23');
});

test('las ocho fichas publican solo enlaces sociales confirmados y válidos', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => switchChapter(2));
  await expect(page.locator('.comic-roster-card')).toHaveCount(8);
  const expected = {
    'moriartys': ['Twitch', 'YouTube', 'Instagram', 'TikTok'],
    'rod3r1k': ['Twitch', 'Todos mis enlaces'],
    'lady-moriarty': ['Twitch', 'YouTube', 'Instagram', 'TikTok'],
    'ardipii': ['Twitch', 'YouTube', 'Instagram', 'TikTok'],
    'akuma': ['Twitch', 'YouTube', 'Instagram', 'TikTok'],
    'dave-nexus': ['Twitch'],
    'pato-oratoris': ['YouTube', 'Instagram', 'Cafecito'],
    'habitos': ['Twitch', 'Instagram', 'TikTok', 'Facebook']
  };
  for (const [id, labels] of Object.entries(expected)) {
    await page.locator('.comic-roster-card[data-creator-id="' + id + '"]').click();
    const links = page.locator('#hero-profile-page .social-links a');
    await expect(links).toHaveCount(labels.length);
    for (const label of labels) await expect(links.filter({ hasText: label.toUpperCase() })).toHaveCount(1);
    if (id === 'rod3r1k') await expect(links.filter({ hasText: 'TODOS MIS ENLACES' })).toHaveAttribute('href', 'https://beacons.ai/ther0d3r1k');
    if (id === 'habitos') await expect(links.filter({ hasText: 'FACEBOOK' })).toHaveAttribute('href', /^https:\/\/www\.facebook\.com\//);
    await page.evaluate(() => closeHeroProfile());
  }
});

test('cada tarjeta muestra las tres filas comparables y el estado de ritmo no es una etiqueta de espera', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => switchChapter(2));
  for (const card of await page.locator('.comic-roster-card').all()) {
    await expect(card.locator('.comic-roster-stat')).toHaveCount(3);
    await expect(card.locator('.comic-roster-frequency')).not.toContainText('EN SEGUIMIENTO');
  }
});

test('las tarjetas priorizan el tagline y muestran solo insignias de redes, sin rangos internos', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => switchChapter(2));
  const expectedCounts = {
    moriartys: 4,
    rod3r1k: 2,
    'lady-moriarty': 4,
    ardipii: 4,
    akuma: 4,
    'dave-nexus': 1,
    'pato-oratoris': 3,
    habitos: 4
  };
  for (const [id, count] of Object.entries(expectedCounts)) {
    const card = page.locator('.comic-roster-card[data-creator-id="' + id + '"]');
    await expect(card.locator('.comic-roster-social-badges .soc-icon')).toHaveCount(count);
    await expect(card.locator('.comic-roster-card-tagline')).not.toBeEmpty();
    await expect(card).not.toContainText('DIRECCIÓN');
    await expect(card.locator('a')).toHaveCount(0);
  }
});

test('la propuesta individual precarga el perfil en el formulario comercial seguro', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    switchChapter(6);
    setRecruitmentMode('creator');
    switchChapter(2);
  });
  await page.locator('.comic-roster-card[data-creator-id="moriartys"]').click();
  await page.locator('[data-profile-tab="marcas"]').click();
  const cta = page.locator('#hero-profile-page .hero-profile-collab-cta');
  await expect(cta).toHaveAttribute('href', '#brand-proposal');
  await cta.click();
  const details = page.locator('#brand-details');
  await expect(page.locator('#brand-proposal')).toBeVisible();
  await expect(page.locator('#creator-application')).toBeHidden();
  await expect(details).toHaveValue(/^Perfil de interés: LOS MORIARTYS/);
  await expect(page.locator('#chapter-6')).toHaveClass(/active/);
});
