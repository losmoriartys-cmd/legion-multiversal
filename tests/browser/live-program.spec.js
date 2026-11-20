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
  await expect(page.getByRole('heading', { name: 'PROGRAMACIÓN DE LA LEGIÓN' })).toBeVisible();
  await expect(page.locator('#live-program-creator')).toBeVisible();
  await expect(page.locator('#live-program-queue .live-program-queue-item')).toHaveCount(8);
  await expect(page.getByRole('heading', { name: 'BARFENDER · LOS POV' })).toBeVisible();
  await expect(page.locator('.live-program-content-card[data-vod-index]')).toHaveCount(3);
  await expect(page.locator('.live-program-content-card[data-youtube-index]')).toHaveCount(6);
  await expect(page.getByRole('heading', { name: '¿CUÁNDO VUELVEN?' })).toBeVisible();

  await page.locator('#live-program-creator').selectOption('akuma');
  await expect(page.locator('#live-program-queue .live-program-queue-item')).toHaveCount(4);
  const title = await page.locator('#live-program-queue .live-program-queue-item strong').first().textContent();
  await page.locator('#live-program-stage [data-live-play="clip"]').click();
  await expect(page.locator('#live-program-stage iframe')).toHaveAttribute('src', /clips\.twitch\.tv\/embed\?clip=/);
  await expect(page.locator('#live-program-stage iframe')).toHaveAttribute('src', /autoplay=false/);
  expect(title).toBeTruthy();
});

test('con un canal en directo, la señal principal cambia al creador activo y muestra espectadores', async ({ page }) => {
  await openLiveChapter(page, true);
  await expect(page.getByRole('heading', { name: 'ESTAMOS EN VIVO' })).toBeVisible();
  await expect(page.locator('.live-program-live-choice')).toHaveCount(1);
  await expect(page.locator('.live-program-live-choice')).toContainText('TheR0D3R1K');
  await expect(page.locator('.live-program-live-choice')).toContainText('31');
  await page.locator('#live-program-stage [data-live-play="live"]').click();
  await expect(page.locator('#live-program-stage iframe')).toHaveAttribute('src', /player\.twitch\.tv\/\?channel=ther0d3r1k/);
  await expect(page.locator('#live-program-stage iframe')).toHaveAttribute('src', /autoplay=false/);
});
