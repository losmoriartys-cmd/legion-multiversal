/* Shared creator-profile data contract for the public roster and individual dossiers.
 * Public files only. Never place tokens, credentials, or private analytics here.
 */
(function (root) {
  'use strict';

  const FILES = Object.freeze({
    roster: './data/roster.json',
    records: './data/creator-records.json',
    metrics: './creator-metrics.json',
    platforms: './platform-stats.json',
    activity: './data.json',
    clips: './clips-data.json'
  });

  const cache = new Map();

  async function readJson(path) {
    if (!cache.has(path)) {
      cache.set(path, fetch(path, { cache: 'no-store' }).then(response => {
        if (!response.ok) throw new Error('No se pudo cargar ' + path + ' (' + response.status + ').');
        return response.json();
      }).catch(error => {
        cache.delete(path);
        throw error;
      }));
    }
    return cache.get(path);
  }

  function lastPathSegment(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      return new URL(value, root.location && root.location.href || 'https://localhost/').pathname
        .split('/').filter(Boolean).pop().replace(/^@/, '').toLowerCase();
    } catch (_) {
      return value.split('/').filter(Boolean).pop().replace(/^@/, '').toLowerCase();
    }
  }

  function creatorKey(hero) {
    return hero && (hero.id || hero.slug) || '';
  }

  function resolveCreator(bundle, hero) {
    if (!bundle || !hero) return null;
    const key = creatorKey(hero);
    const metricsRoot = bundle.metrics && bundle.metrics.creators || {};
    const metrics = metricsRoot[key] || null;
    const records = bundle.records && bundle.records.channels && bundle.records.channels[key] || {};
    const accounts = Array.isArray(metrics && metrics.accounts) ? metrics.accounts :
      Array.isArray(hero.accounts) ? hero.accounts : [];

    const activityChannels = bundle.activity && bundle.activity.channels || {};
    const twitchAccount = accounts.find(account => account && account.platform === 'twitch');
    const twitchLogin = (twitchAccount && (twitchAccount.login || twitchAccount.handle)) ||
      lastPathSegment(hero.twitch);
    const activity = twitchLogin
      ? Object.values(activityChannels).find(channel =>
          (channel.login || '').toLowerCase() === twitchLogin.toLowerCase())
      : null;

    const platformCreator = bundle.platforms && bundle.platforms.creators &&
      bundle.platforms.creators[key] || null;

    return Object.freeze({
      key,
      hero,
      metrics,
      metricItems: Array.isArray(metrics && metrics.metrics) ? metrics.metrics : [],
      accounts,
      records,
      activity: activity || null,
      platformStats: platformCreator,
      clips: bundle.clips && bundle.clips.creators && bundle.clips.creators[key] || null,
      sourceSnapshot: bundle.metrics && bundle.metrics.source_snapshot || {},
      generatedAt: bundle.metrics && bundle.metrics.generated_at || null
    });
  }

  async function load(options) {
    const requested = options && options.files || Object.keys(FILES);
    const selected = {};
    await Promise.all(requested.map(async key => {
      if (!FILES[key]) throw new Error('Fuente de perfil desconocida: ' + key);
      selected[key] = await readJson(FILES[key]);
    }));
    if (requested.includes('roster')) {
      if (!selected.roster || !Array.isArray(selected.roster.heroes)) {
        throw new Error('data/roster.json no contiene una lista válida de expedientes.');
      }
      const ids = new Set();
      selected.roster.heroes.forEach(hero => {
        const key = creatorKey(hero);
        if (!key || ids.has(key)) throw new Error('El Roster contiene un ID vacío o duplicado: ' + key);
        ids.add(key);
      });
    }
    return Object.freeze({
      roster: selected.roster || null,
      records: selected.records || { channels: {} },
      metrics: selected.metrics || { creators: {} },
      platforms: selected.platforms || { creators: {} },
      activity: selected.activity || { channels: {} },
      clips: selected.clips || { creators: {} },
      getCreator(hero) { return resolveCreator(this, hero); }
    });
  }

  function comparable(left, right) {
    if (!left || !right) return false;
    const a = left.period || {};
    const b = right.period || {};
    return left.key === right.key &&
      left.platform === right.platform &&
      left.unit === right.unit &&
      a.kind === b.kind &&
      a.from === b.from &&
      a.to === b.to &&
      left.status === 'fresh' && right.status === 'fresh' &&
      left.visibility === 'public' && right.visibility === 'public';
  }

  function findMetric(profile, key, platform) {
    if (!profile) return null;
    return profile.metricItems.find(metric =>
      metric && metric.key === key && (!platform || metric.platform === platform)) || null;
  }

  root.LegionCreatorProfiles = Object.freeze({
    version: 1,
    files: FILES,
    load,
    resolveCreator,
    findMetric,
    areComparable: comparable
  });
})(window);
