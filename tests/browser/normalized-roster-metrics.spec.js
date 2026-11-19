const { test, expect } = require('@playwright/test');

const CREATORS = [
  { id: 'moriartys', platform: 'twitch', handle: 'losmoriartys', login: 'losmoriartys', url: 'https://twitch.tv/losmoriartys' },
  { id: 'rod3r1k', platform: 'twitch', handle: 'TheR0D3R1K', login: 'ther0d3r1k', url: 'https://twitch.tv/TheR0D3R1K' },
  { id: 'lady-moriarty', platform: 'twitch', handle: 'ladymoriarty01', login: 'ladymoriarty01', url: 'https://twitch.tv/ladymoriarty01' },
  { id: 'ardipii', platform: 'twitch', handle: 'ardipii', login: 'ardipii', url: 'https://twitch.tv/ardipii' },
  { id: 'akuma', platform: 'twitch', handle: 'akumazoldyck', login: 'akumazoldyck', url: 'https://twitch.tv/akumazoldyck' },
  { id: 'dave-nexus', platform: 'twitch', handle: 'daved0608', login: 'daved0608', url: 'https://twitch.tv/daved0608' },
  { id: 'pato-oratoris', platform: 'youtube', handle: '@patoteexplica', login: 'patoteexplica', url: 'https://www.youtube.com/@patoteexplica' },
  { id: 'habitos', platform: 'twitch', handle: 'habitos_atomicos', login: 'habitos_atomicos', url: 'https://twitch.tv/habitos_atomicos' }
];

const CAPTURED_AT = new Date(Date.now() - 60 * 60 * 1000).toISOString();

function makeMetric(creator, key, value, unit, status, platform = creator.platform) {
  return {
    metric_id: platform + ':' + creator.handle + ':' + key,
    platform,
    account_handle: creator.handle,
    key,
    label: key,
    value,
    unit,
    captured_at: CAPTURED_AT,
    period: { kind: platform === 'youtube' ? 'cumulative' : 'sampled_window', from: null, to: CAPTURED_AT },
    source: platform === 'youtube' ? 'YouTube Data API v3' : 'Twitch Helix Public API',
    method: platform === 'youtube' ? 'youtube_data_api_public' : '55_minute_public_sampling',
    status,
    visibility: 'public'
  };
}

function makeMetricsFixture() {
  const creators = {};
  CREATORS.forEach((creator, index) => {
    const accounts = [{
      account_ref: creator.platform + ':' + creator.handle,
      platform: creator.platform,
      account_type: 'creator_channel',
      handle: creator.handle,
      login: creator.login,
      url: creator.url
    }];
    const metrics = creator.platform === 'twitch'
      ? [
          makeMetric(creator, 'live_status', creator.id === 'moriartys' ? 'live' : 'offline', 'status', 'fresh'),
          makeMetric(creator, 'current_viewers', creator.id === 'moriartys' ? 19 : null, 'viewers', creator.id === 'moriartys' ? 'live' : 'offline'),
          makeMetric(creator, 'streams_observed', index + 1, 'streams', 'sampled'),
          makeMetric(creator, 'average_viewers_sampled', 10 + index, 'viewers_sampled_avg', 'sampled'),
          makeMetric(creator, 'peak_viewers_sampled', 20 + index, 'viewers_sampled_peak', 'sampled'),
          makeMetric(creator, 'observed_live_hours', 1.25 + index, 'hours_observed', 'sampled')
        ]
      : [
          makeMetric(creator, 'subscribers', 56, 'subscribers', 'verified_public'),
          makeMetric(creator, 'total_views', 431, 'views', 'verified_public'),
          makeMetric(creator, 'videos_total', 6, 'videos', 'verified_public')
        ];
    creators[creator.id] = {
      display_name: creator.id,
      identity_scope: creator.id === 'moriartys' ? 'shared_project' : 'individual_creator',
      represented_people: [],
      accounts,
      metrics,
      content: {}
    };
  });
  return {
    schema_version: 2,
    generated_at: CAPTURED_AT,
    source_files: ['roster-data.json', 'data.json', 'platform-stats.json'],
    source_snapshot: {},
    methodology: {},
    creators
  };
}

async function openRosterWithFixture(page) {
  await page.route('**/api/contact', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ configured: false, turnstileSiteKey: null })
  }));
  await page.route('**/creator-metrics.json', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(makeMetricsFixture())
  }));
  await page.goto('/');
  await page.evaluate(() => switchChapter(2));
  await expect(page.locator('.comic-roster-card')).toHaveCount(8);
  await page.waitForFunction(() => typeof getNormalizedCreatorMetric === 'function' &&
    creatorMetricsData && creatorMetricsData.schema_version === 2);
}

test.describe('Auditoría de métricas normalizadas del Roster', () => {
  test('resuelve cada ID canónico con su propia cuenta, sin métricas cruzadas', async ({ page }) => {
    await openRosterWithFixture(page);
    const results = await page.evaluate(({ creators, now }) => creators.map(({ id, platform, key }) => {
      const hero = heroesData.find(item => item.id === id);
      const metric = getNormalizedCreatorMetric(hero, key, platform, now);
      return {
        id: metric.creatorId,
        platform: metric.platform,
        accountHandle: metric.accountHandle,
        key: metric.key,
        state: metric.state
      };
    }), {
      creators: CREATORS.map(creator => ({
        id: creator.id,
        platform: creator.platform,
        key: creator.platform === 'youtube' ? 'subscribers' : 'average_viewers_sampled'
      })),
      now: Date.now()
    });

    expect(results).toHaveLength(8);
    results.forEach((result, index) => {
      expect(result.id).toBe(CREATORS[index].id);
      expect(result.platform).toBe(CREATORS[index].platform);
      expect(result.accountHandle).toBe(CREATORS[index].handle);
      expect(result.state).toBe('available');
    });
    expect(new Set(results.map(result => result.id)).size).toBe(8);
  });

  test('distingue live, offline, vencido y nulo usando 120 minutos exactos', async ({ page }) => {
    await openRosterWithFixture(page);
    const states = await page.evaluate(({ capturedAt }) => {
      const hero = heroesData.find(item => item.id === 'moriartys');
      const metric = creatorMetricsData.creators.moriartys.metrics.find(item => item.key === 'live_status');
      const captured = Date.parse(capturedAt);
      const atBoundary = captured + 120 * 60 * 1000;
      const oneSecondLate = atBoundary + 1000;

      metric.value = 'live';
      metric.status = 'fresh';
      const live = getNormalizedLiveStatus(hero, atBoundary);

      metric.value = 'offline';
      const offline = getNormalizedLiveStatus(hero, atBoundary);

      const stale = getNormalizedLiveStatus(hero, oneSecondLate);

      metric.value = null;
      const missingValue = getNormalizedLiveStatus(hero, atBoundary);

      creatorMetricsData.creators.moriartys.metrics =
        creatorMetricsData.creators.moriartys.metrics.filter(item => item.key !== 'live_status');
      const missingMetric = getNormalizedLiveStatus(hero, atBoundary);

      return {
        live: { state: live.state, label: live.label, fresh: live.metric?.fresh },
        offline: { state: offline.state, label: offline.label, fresh: offline.metric?.fresh },
        stale: { state: stale.state, label: stale.label, fresh: stale.metric?.fresh },
        missingValue: { state: missingValue.state, label: missingValue.label },
        missingMetric: { state: missingMetric.state, label: missingMetric.label }
      };
    }, { capturedAt: CAPTURED_AT });

    expect(states.live).toEqual({ state: 'live', label: 'EN DIRECTO', fresh: true });
    expect(states.offline).toEqual({ state: 'offline', label: 'OFFLINE', fresh: true });
    expect(states.stale).toEqual({ state: 'stale', label: 'ESTADO SIN ACTUALIZAR', fresh: false });
    expect(states.missingValue).toEqual({ state: 'missing', label: 'SIN DATOS' });
    expect(states.missingMetric).toEqual({ state: 'missing', label: 'SIN DATOS' });
  });

  test('usa claves y unidades estrictas para promedio, pico y horas observadas', async ({ page }) => {
    await openRosterWithFixture(page);
    const result = await page.evaluate(now => {
      const hero = heroesData.find(item => item.id === 'rod3r1k');
      return ['average_viewers_sampled', 'peak_viewers_sampled', 'observed_live_hours'].map(key => {
        const metric = getNormalizedCreatorMetric(hero, key, 'twitch', now);
        return { key: metric.key, value: metric.value, unit: metric.unit, state: metric.state };
      });
    }, Date.now());

    expect(result).toEqual([
      { key: 'average_viewers_sampled', value: 11, unit: 'viewers_sampled_avg', state: 'available' },
      { key: 'peak_viewers_sampled', value: 21, unit: 'viewers_sampled_peak', state: 'available' },
      { key: 'observed_live_hours', value: 2.25, unit: 'hours_observed', state: 'available' }
    ]);
  });

  test('Pato utiliza YouTube y no recibe un estado Twitch inventado', async ({ page }) => {
    await openRosterWithFixture(page);
    const result = await page.evaluate(now => {
      const hero = heroesData.find(item => item.id === 'pato-oratoris');
      const subscribers = getNormalizedCreatorMetric(hero, 'subscribers', 'youtube', now);
      const views = getNormalizedCreatorMetric(hero, 'total_views', 'youtube', now);
      const videos = getNormalizedCreatorMetric(hero, 'videos_total', 'youtube', now);
      const twitchFallback = getNormalizedCreatorMetric(hero, 'live_status', 'twitch', now);
      const live = getNormalizedLiveStatus(hero, now);
      return {
        subscribers: { value: subscribers.value, unit: subscribers.unit, state: subscribers.state },
        views: { value: views.value, unit: views.unit, state: views.state },
        videos: { value: videos.value, unit: videos.unit, state: videos.state },
        twitchFallback: twitchFallback.state,
        liveState: live.state,
        liveLabel: live.label
      };
    }, Date.now());

    expect(result).toEqual({
      subscribers: { value: 56, unit: 'subscribers', state: 'available' },
      views: { value: 431, unit: 'views', state: 'available' },
      videos: { value: 6, unit: 'videos', state: 'available' },
      twitchFallback: 'missing',
      liveState: 'not_applicable',
      liveLabel: 'YOUTUBE · ESTADO NO APLICA'
    });

    const patoCard = page.locator('.comic-roster-card[data-creator-id="pato-oratoris"]');
    await expect(patoCard.locator('.comic-roster-activity')).toHaveText('CONTENIDO · YOUTUBE');
    await patoCard.click();
    await expect(page.locator('#hero-profile-page .hero-profile-live')).toContainText('YOUTUBE · ESTADO NO APLICA');
    await expect(page.locator('#profile-tab-perfil .hero-profile-normalized-summary')).toContainText('56');
    await expect(page.locator('#profile-tab-perfil .hero-profile-normalized-summary')).toContainText('431');
    await page.locator('[data-profile-tab="estadisticas"]').click();
    await expect(page.locator('#profile-tab-estadisticas .stats-executive-source')).toContainText('YOUTUBE · CANAL VINCULADO');
    await expect(page.locator('#profile-tab-estadisticas .stats-executive-source')).toContainText('56');
  });

  test('el selector y el expediente consumen el estado y el promedio normalizados', async ({ page }) => {
    await openRosterWithFixture(page);
    const card = page.locator('.comic-roster-card[data-creator-id="moriartys"]');
    await expect(card.locator('.comic-roster-activity')).toHaveText('EN DIRECTO');
    await expect(card.locator('.roster-selector-tile-live')).toContainText('EN DIRECTO');
    await expect(card.locator('.comic-roster-stat-average b')).toHaveText('10');

    await card.click();
    await expect(page.locator('#hero-profile-page .hero-profile-live')).toContainText('EN DIRECTO');
    await expect(page.locator('#profile-tab-perfil .hero-profile-normalized-summary')).toContainText('PROMEDIO DE ESPECTADORES');
    await expect(page.locator('#profile-tab-perfil .hero-profile-normalized-summary')).toContainText('PICO OBSERVADO');
    await page.locator('[data-profile-tab="estadisticas"]').click();
    const twitchSource = page.locator('#profile-tab-estadisticas .stats-executive-source').filter({ hasText: 'TWITCH · MÉTRICAS NORMALIZADAS' });
    await expect(twitchSource).toBeVisible();
    await expect(twitchSource).toContainText('10');
    await expect(twitchSource).toContainText('20');
  });
});
