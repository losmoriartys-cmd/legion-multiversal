/* Legión Multiversal · modelo objetivo de marca para Roster y expedientes.
 * Fuente de actividad: snapshots y window.daily_activity del colector propio.
 * No estima horas ni usa horarios declarados para clasificar el ritmo.
 */
(function (root) {
  'use strict';
  const DAY = 86400000;
  const MIN_SAMPLES = 20;
  const MIN_SPAN_DAYS = 14;
  const WINDOW_DAYS = 28;
  const MAX_SNAPSHOT_AGE_MS = 120 * 60 * 1000;

  function parseTime(value) {
    if (typeof value !== 'string' || !value.trim()) return NaN;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function utcDay(value) {
    const timestamp = typeof value === 'number' ? value : parseTime(value);
    return Number.isFinite(timestamp)
      ? Date.UTC(new Date(timestamp).getUTCFullYear(), new Date(timestamp).getUTCMonth(), new Date(timestamp).getUTCDate())
      : NaN;
  }

  function span(channel) {
    const timestamps = (Array.isArray(channel && channel.snapshots) ? channel.snapshots : [])
      .map(snapshot => parseTime(snapshot && snapshot.sampled_at))
      .filter(Number.isFinite);
    if (!timestamps.length) return null;
    const first = Math.min(...timestamps);
    const last = Math.max(...timestamps);
    const firstDay = utcDay(first);
    const lastDay = utcDay(last);
    return {
      first,
      last,
      firstDay,
      lastDay,
      days: Number.isFinite(firstDay) && Number.isFinite(lastDay)
        ? Math.floor((lastDay - firstDay) / DAY) + 1
        : 0
    };
  }

  function computeRhythm(channel, now = Date.now()) {
    const observed = channel && span(channel);
    const samples = Number(channel && channel.window && channel.window.samples_total) || 0;
    const age = observed ? Number(now) - observed.last : Infinity;
    const windowDays = observed ? Math.min(WINDOW_DAYS, observed.days) : 0;
    const insufficient = (reason) => ({
      level: 'SIN_DATOS',
      label: 'SIN DATOS SUFICIENTES',
      activeDays: null,
      windowDays,
      projected28: null,
      provisional: true,
      reason
    });

    if (!observed) return insufficient('snapshots_missing');
    if (samples < MIN_SAMPLES) return insufficient('minimum_samples_not_met');
    if (observed.days < MIN_SPAN_DAYS) return insufficient('minimum_span_not_met');
    if (!Number.isFinite(age) || age < -5 * 60 * 1000) return insufficient('snapshot_time_invalid');
    if (age > MAX_SNAPSHOT_AGE_MS) return insufficient('snapshot_stale');

    const effectiveDays = windowDays;
    const fromDay = observed.lastDay - (effectiveDays - 1) * DAY;
    const toDay = Math.min(utcDay(now), observed.lastDay);
    const active = new Set();

    for (const entry of (channel.window && Array.isArray(channel.window.daily_activity) ? channel.window.daily_activity : [])) {
      const date = typeof entry?.date === 'string' ? entry.date : '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !(Number(entry.live_samples) > 0)) continue;
      const day = utcDay(date + 'T00:00:00Z');
      if (Number.isFinite(day) && day >= fromDay && day <= toDay) active.add(date);
    }

    const projected28 = effectiveDays > 0
      ? Math.round(active.size * WINDOW_DAYS / effectiveDays)
      : 0;
    let level = 'INACTIVO';
    let label = 'SIN ACTIVIDAD RECIENTE';
    if (projected28 >= 15) [level, label] = ['MUY_CONSTANTE', 'MUY CONSTANTE'];
    else if (projected28 >= 8) [level, label] = ['REGULAR', 'REGULAR'];
    else if (projected28 >= 3) [level, label] = ['OCASIONAL', 'OCASIONAL'];
    else if (projected28 >= 1) [level, label] = ['ESPORADICO', 'ESPORÁDICO'];

    return {
      level,
      label,
      activeDays: active.size,
      windowDays: effectiveDays,
      projected28,
      provisional: effectiveDays < WINDOW_DAYS,
      reason: null
    };
  }

  function lastActivity(channel, now = Date.now()) {
    const nowDay = utcDay(now);
    const live = (Array.isArray(channel && channel.snapshots) ? channel.snapshots : [])
      .filter(snapshot => snapshot && snapshot.is_live === true)
      .map(snapshot => parseTime(snapshot.sampled_at))
      .filter(timestamp => Number.isFinite(timestamp) && timestamp <= Number(now));
    if (!live.length) return { date: null, daysAgo: null, activeThisWeek: false };
    const last = Math.max(...live);
    const lastDay = utcDay(last);
    const daysAgo = Number.isFinite(nowDay) && Number.isFinite(lastDay)
      ? Math.max(0, Math.floor((nowDay - lastDay) / DAY))
      : null;
    return {
      date: new Date(last).toISOString().slice(0, 10),
      daysAgo,
      activeThisWeek: daysAgo !== null && daysAgo <= 7
    };
  }

  function viewerBand(average) {
    if (typeof average !== 'number' || !Number.isFinite(average) || average < 0) {
      return { text: 'No informado', band: null, value: null };
    }
    const value = Math.round(average);
    const band = value <= 25 ? 'Hasta 25' : value < 100 ? '26–99' : value < 500 ? '100–499' : '500+';
    return { text: String(value), band, value };
  }

  function followersSlot(entries, platform, now = Date.now()) {
    const entry = (Array.isArray(entries) ? entries : [])
      .find(item => item && item.platform === platform && Number.isFinite(item.count) && item.count >= 0);
    if (!entry) return { text: 'No informado', source: null, asOf: null, stale: false, ageDays: null };
    const captured = utcDay(entry.as_of);
    const today = utcDay(now);
    if (!Number.isFinite(captured) || !Number.isFinite(today) || captured > today) {
      return { text: 'No informado', source: null, asOf: null, stale: false, ageDays: null };
    }
    const ageDays = Math.floor((today - captured) / DAY);
    return {
      text: Math.round(entry.count).toLocaleString('es-AR'),
      source: entry.source || 'Fuente no indicada',
      asOf: entry.as_of,
      ageDays,
      stale: ageDays > 30,
      kind: entry.kind || 'declared'
    };
  }

  function cardSlots(hero, context = {}) {
    const now = Number(context.now) || Date.now();
    const account = (Array.isArray(hero && hero.accounts) ? hero.accounts : [])
      .find(item => item && item.account_type === 'creator_channel')
      || (Array.isArray(hero && hero.accounts) ? hero.accounts[0] : null);
    const platform = account && account.platform;
    const followerLabel = platform === 'youtube' ? 'Suscriptores' : 'Seguidores';
    const follower = followersSlot(context.followers, platform, now);
    const followerDetail = follower.source
      ? follower.source + ' · ' + follower.asOf + (follower.stale ? ' · referencia histórica' : '')
      : 'No informado por una fuente verificable';

    if (platform === 'youtube') {
      const videos = Number.isFinite(context.yt && context.yt.videos_total)
        ? String(Math.round(context.yt.videos_total))
        : 'No informado';
      return [
        [followerLabel, follower.text, followerDetail],
        ['Videos publicados', videos, context.yt?.videos_source || 'YouTube Data API v3'],
        ['Última publicación', context.yt?.last_published || 'No informado', context.yt?.last_published ? 'Fecha del video público más reciente' : 'Sin fecha pública disponible']
      ];
    }

    const rhythm = computeRhythm(context.channel, now);
    const average = viewerBand(context.average);
    const activeText = rhythm.activeDays === null
      ? 'Sin datos'
      : String(rhythm.activeDays) + ' / ' + String(rhythm.windowDays);
    const activeDetail = rhythm.activeDays === null
      ? 'Se requieren 20 muestras y 14 días observados'
      : (rhythm.provisional ? 'días con actividad detectada · ventana parcial' : 'días con actividad detectada en 28 días');
    return [
      [followerLabel, follower.text, followerDetail],
      ['Media de viewers', average.text, average.band ? 'Rango ' + average.band + ' · muestreo propio' : 'Promedio muestreado no disponible'],
      ['Días activos detectados', activeText, activeDetail]
    ];
  }

  const api = { computeRhythm, lastActivity, viewerBand, followersSlot, cardSlots };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LMBrand = api;
})(typeof window !== 'undefined' ? window : globalThis);
