const { test, expect } = require('@playwright/test');

function activityFixture(live = false) {
  const now = new Date().toISOString();
  const logins = ['losmoriartys', 'ther0d3r1k'];
  const channels = Object.fromEntries(logins.map(login => [login, {
    login,
    display_name: login === 'ther0d3r1k' ? 'TheR0D3R1K' : 'LosMoriartys',
    twitch_url: 'https://twitch.tv/' + login,
    live: live && login === 'ther0d3r1k',
    current_viewers: live && login === 'ther0d3r1k' ? 31 : null,
    current_game: live && login === 'ther0d3r1k' ? 'BarFender' : null,
    current_title: live && login === 'ther0d3r1k' ? 'Probando el canal' : null,
    stream_started_at: live && login === 'ther0d3r1k' ? now : null,
    last_status_at: now,
    window: { samples_total: 0, live_samples: 0, streams_observed: 0, average_viewers_sampled: null, peak_viewers_sampled: null, observed_live_hours: null, game_breakdown: [] },
    snapshots: []
  }]));
  return {
    schema_version: 2,
    source: 'Playwright fixture',
    updated_at: now,
    sampling_interval_minutes: 15,
    window_days: 30,
    active_channels: logins,
    collection: {
      expected_channels: 2, resolved_channels: 2, sampled_channels: logins,
      skipped_channels: [], complete: true, status_complete: true,
      sampling_complete: true, coverage_complete: true
    },
    channels
  };
}

async function openLiveChapter(page, live = false) {
  await page.route('**/data.json*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(activityFixture(live))
  }));
  await page.goto('/');
  await page.locator('.nav-btn-live[data-chapter="10"]').click();
}

test('sin directos, EN VIVO se convierte en programación con clips, VODs, YouTube y horarios', async ({ page }) => {
  await openLiveChapter(page, false);
  await expect(page.getByRole('heading', { name: 'LA PROGRAMACIÓN DE LA LEGIÓN' })).toBeVisible();
  await expect(page.locator('.lp-status')).toContainText('NADIE TRANSMITE AHORA');
  await expect(page.locator('.lp-q').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'CUÁNDO VUELVEN' })).toBeVisible();
  await expect(page.locator('.lp-screen-title')).not.toHaveText('');

  // Los títulos se muestran tal cual los subió cada streamer.
  const first = await page.locator('.lp-q-title').first().textContent();
  await expect(page.locator('.lp-screen-title')).toHaveText(first);

  const total = await page.locator('.lp-q').count();
  await page.locator('.lp-q').nth(1).click();
  await expect(page.locator('.lp-q').nth(1)).toHaveClass(/is-current|is-selected|is-active/);
  expect(total).toBeGreaterThan(1);

  await page.locator('[data-lp="play"]').click();
  await expect(page.locator('iframe.lp-embed')).toHaveAttribute('src', /clips\.twitch\.tv\/embed\?clip=/);
});

test('con un canal en directo, la señal principal cambia al creador activo y muestra espectadores', async ({ page }) => {
  await openLiveChapter(page, true);
  await expect(page.locator('.lp-status')).toContainText('EN DIRECTO AHORA');
  await expect(page.locator('.lp-badge.is-live')).toContainText('31');
  await expect(page.locator('.lp-screen-title')).toContainText('Probando el canal');
  await page.locator('[data-lp="play"]').click();
  await expect(page.locator('iframe.lp-embed')).toHaveAttribute('src', /player\.twitch\.tv\/\?channel=ther0d3r1k/);
});
