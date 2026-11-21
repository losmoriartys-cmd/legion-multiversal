/* Capítulo 03 · Roster enriquecido
 * Capa de presentación sobre las fuentes existentes. No duplica ni altera los datos.
 */
(() => {
  'use strict';

  const collaborators = new Set(['habitos', 'pato-oratoris']);
  const state = { search: '', group: 'all', theme: 'all', sort: 'featured' };
  const originalRender = window.renderRosterSelector;
  if (typeof originalRender !== 'function') return;

  const text = value => String(value ?? '').trim();
  const escape = value => text(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const primaryAccount = hero => (hero.accounts || []).find(account => account.account_type === 'creator_channel') || (hero.accounts || [])[0] || null;
  const channelFor = hero => typeof findChannelStats === 'function' ? findChannelStats(hero) : null;
  const displayName = hero => typeof getHeroDisplayName === 'function' ? getHeroDisplayName(hero) : (hero.display_name || hero.name || hero.id);
  const groupFor = hero => collaborators.has(hero.id) ? 'collaborators' : 'formation';
  const groupLabel = group => group === 'collaborators' ? 'COLABORADORES' : 'FORMACIÓN';
  const toDate = value => {
    if (!value) return null;
    const date = new Date(String(value).length === 10 ? value + 'T00:00:00Z' : value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const dateLabel = value => {
    const date = toDate(value);
    return date ? date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }) : 'No informado';
  };
  const metricNumber = value => typeof value === 'number' && Number.isFinite(value) ? value : null;

  function rhythmFor(channel) {
    if (!channel || !window.LMBrand?.computeRhythm) return { level: 'SIN_DATOS', label: 'SIN DATOS SUFICIENTES', bars: 0, sort: -1 };
    const rhythm = window.LMBrand.computeRhythm(channel);
    const bars = ({ MUY_CONSTANTE: 3, REGULAR: 2, OCASIONAL: 1, ESPORADICO: 1, INACTIVO: 0 })[rhythm.level] ?? 0;
    return { ...rhythm, bars, sort: bars };
  }

  function activeDays17(channel) {
    const entries = channel?.window?.daily_activity;
    if (!Array.isArray(entries)) return { count: null, anchor: null };
    const dates = entries.map(entry => entry?.date).filter(date => /^\d{4}-\d{2}-\d{2}$/.test(String(date || '')));
    const anchor = text(channel.updated_at || channel.last_snapshot_at).slice(0, 10) || dates.sort().at(-1) || null;
    if (!anchor) return { count: null, anchor: null };
    const end = toDate(anchor);
    if (!end) return { count: null, anchor: null };
    const start = new Date(end.getTime() - 16 * 86400000).toISOString().slice(0, 10);
    const active = new Set(entries
      .filter(entry => entry && /^\d{4}-\d{2}-\d{2}$/.test(String(entry.date || '')) && Number(entry.live_samples) > 0)
      .map(entry => entry.date)
      .filter(date => date >= start && date <= anchor));
    return { count: active.size, anchor };
  }

  function followerMetric(hero, channel, account) {
    if (!account?.platform || !window.LMBrand?.followersSlot) {
      return { value: 'No informado', detail: 'No hay una fuente verificable con fecha de captura', available: false };
    }
    let entry = null;
    if (account.platform === 'twitch' && channel) {
      entry = {
        platform: 'twitch',
        count: channel.followers_total,
        source: channel.followers_source,
        as_of: channel.followers_captured_at
      };
    } else if (account.platform === 'youtube') {
      const creator = platformStatsData?.creators?.[hero.id]?.platforms?.youtube;
      if (creator?.status === 'verified') {
        entry = {
          platform: 'youtube',
          count: creator.metrics?.subscribers,
          source: creator.source,
          as_of: creator.captured_at
        };
      }
    }
    if (!entry || !text(entry.source) || !text(entry.as_of)) {
      return { value: 'No informado', detail: 'No hay una fuente verificable con fecha de captura', available: false };
    }
    const slot = window.LMBrand.followersSlot([entry], account.platform);
    if (!slot || slot.text === 'No informado' || !slot.source || !slot.asOf) {
      return { value: 'No informado', detail: 'No hay una fuente verificable con fecha de captura', available: false };
    }
    return {
      value: slot.text,
      detail: slot.source + ' · ' + dateLabel(slot.asOf) + (slot.stale ? ' · referencia histórica' : ''),
      available: true
    };
  }
  function viewerMetric(hero, channel, account) {
    if (account?.platform !== 'twitch') return { value: 'No aplica', detail: 'Canal de video · no corresponde comparar viewers de Twitch', available: false, sort: -1 };
    const metric = typeof getNormalizedCreatorMetric === 'function'
      ? getNormalizedCreatorMetric(hero, 'average_viewers_sampled', 'twitch')
      : null;
    const average = metricNumber(metric?.value);
    if (average === null || !['available', 'stale'].includes(metric?.state) || !window.LMBrand?.viewerBand) {
      return { value: 'No informado', detail: 'Muestreo propio no disponible o sin captura verificable', available: false, sort: -1 };
    }
    const band = window.LMBrand.viewerBand(average);
    return {
      value: band.band || 'No informado',
      detail: 'Rango de audiencia · muestreo propio · ' + (Number(channel?.window?.samples_total) || 0).toLocaleString('es-AR') + ' muestras' + (metric.state === 'stale' ? ' · HISTÓRICO' : ''),
      available: true,
      sort: average
    };
  }

  function profileMetrics(hero) {
    const account = primaryAccount(hero);
    const channel = channelFor(hero);
    const followers = followerMetric(hero, channel, account);
    const viewers = viewerMetric(hero, channel, account);
    const days = activeDays17(channel);
    const hasData = followers.available || viewers.available || days.count !== null;
    return { account, channel, followers, viewers, days, hasData };
  }

  function latestActivity(hero, channel) {
    if (!channel || !window.LMBrand?.lastActivity) return null;
    const result = window.LMBrand.lastActivity(channel);
    return result?.date ? result : null;
  }

  function gameNames(hero, channel) {
    if (typeof getMostPlayedGames !== 'function') return [];
    try { return getMostPlayedGames(hero, channel, typeof findSullyChannel === 'function' ? findSullyChannel(hero) : null) || []; }
    catch (_) { return []; }
  }

  function addRhythmMeter(badge, rhythm) {
    if (!badge) return;
    badge.classList.add('roster-v3-rhythm');
    const meter = document.createElement('span');
    meter.className = 'roster-v3-rhythm-meter';
    meter.setAttribute('role', 'img');
    meter.setAttribute('aria-label', 'Ritmo: ' + rhythm.label + ', ' + rhythm.bars + ' de 3 barras');
    for (let i = 1; i <= 3; i += 1) {
      const bar = document.createElement('i');
      if (i <= rhythm.bars) bar.classList.add('is-active');
      meter.appendChild(bar);
    }
    badge.appendChild(meter);
  }

  function metricCard(label, value, detail, extra) {
    const card = document.createElement('span');
    card.className = 'roster-v3-metric' + (extra ? ' ' + extra : '');
    const heading = document.createElement('span');
    heading.className = 'roster-v3-metric-label';
    heading.textContent = label;
    const number = document.createElement('b');
    number.className = 'roster-v3-metric-value';
    number.textContent = value;
    const note = document.createElement('small');
    note.className = 'roster-v3-metric-detail';
    note.textContent = detail;
    card.append(heading, number, note);
    return card;
  }

  function decorateCard(card, hero, index) {
    const metrics = profileMetrics(hero);
    const { channel, account } = metrics;
    const rhythm = account?.platform === 'youtube'
      ? { level: 'NO_APLICA', label: 'NO APLICA', bars: 0, sort: -1 }
      : rhythmFor(channel);
    const activity = latestActivity(hero, channel);
    const photoCopy = card.querySelector('.comic-roster-photo-copy');
    if (photoCopy && !photoCopy.querySelector('.roster-v3-archetype')) {
      const archetype = document.createElement('small');
      archetype.className = 'roster-v3-archetype';
      archetype.textContent = text(hero.codename || hero.characterRole || 'ARQUETIPO PENDIENTE');
      photoCopy.prepend(archetype);
    }
    const badges = card.querySelector('.comic-roster-badges');
    if (badges) {
      const rhythmBadge = badges.querySelector('.comic-roster-frequency');
      if (rhythmBadge) addRhythmMeter(rhythmBadge, rhythm);
      const liveBadge = badges.querySelector('.comic-roster-activity');
      if (liveBadge) {
        const status = typeof getNormalizedLiveStatus === 'function' ? getNormalizedLiveStatus(hero) : null;
        const statusLabel = account?.platform === 'youtube' ? 'CONTENIDO · YOUTUBE' : status?.state === 'live' ? 'EN VIVO' : status?.state === 'offline' ? 'OFFLINE' : 'SIN DATOS';
        liveBadge.textContent = statusLabel;
        liveBadge.classList.toggle('is-live', status?.state === 'live');
        liveBadge.classList.toggle('is-not-applicable', account?.platform === 'youtube');
      }
      const typeBadge = badges.querySelector('.comic-roster-type');
      if (typeBadge) typeBadge.textContent = account?.platform === 'twitch' ? 'CREADOR EN DIRECTO' : account?.platform === 'youtube' ? 'CREADOR DE VIDEO' : 'FORMATO POR CONFIRMAR';
    }
    const oldSlots = card.querySelector('.comic-roster-brand-slots');
    if (oldSlots) { oldSlots.setAttribute('aria-hidden', 'true'); oldSlots.classList.add('roster-v3-legacy-metrics'); }
    const newSlots = document.createElement('span');
    newSlots.className = 'roster-v3-metrics';
    newSlots.setAttribute('aria-label', 'Seguidores, media de viewers y días activos detectados');
    newSlots.append(
      metricCard(account?.platform === 'youtube' ? 'Suscriptores' : 'Seguidores', metrics.followers.value, metrics.followers.detail, metrics.followers.available ? 'has-data' : 'is-empty'),
      metricCard('Media de viewers', metrics.viewers.value, metrics.viewers.detail, metrics.viewers.available ? 'has-data' : 'is-empty'),
      metricCard('Días activos detectados', metrics.days.count === null ? 'No informado' : metrics.days.count + ' / 17', metrics.days.count === null ? 'Sin ventana diaria verificable' : '17 días hasta la última captura · ' + dateLabel(metrics.days.anchor), metrics.days.count === null ? 'is-empty' : 'has-data')
    );
    if (oldSlots) oldSlots.insertAdjacentElement('afterend', newSlots);
    else card.querySelector('.comic-roster-card-data')?.appendChild(newSlots);

    const daysMetric = newSlots.querySelector('.roster-v3-metric:last-child');
    if (daysMetric && metrics.days.count !== null) {
      const strip = document.createElement('span');
      strip.className = 'roster-v3-day-strip';
      strip.setAttribute('role', 'img');
      strip.setAttribute('aria-label', metrics.days.count + ' días activos detectados de 17; las casillas representan cantidad, no fechas');
      for (let i = 1; i <= 17; i += 1) {
        const cell = document.createElement('i');
        if (i <= metrics.days.count) cell.classList.add('is-active');
        cell.setAttribute('aria-hidden', 'true');
        strip.appendChild(cell);
      }
      daysMetric.appendChild(strip);
    }

    const lastLive = card.querySelector('.comic-roster-last-live');
    if (lastLive) {
      lastLive.textContent = activity ? 'ÚLTIMO DIRECTO OBSERVADO: ' + dateLabel(activity.date) : 'ÚLTIMO DIRECTO OBSERVADO: SIN REGISTRO';
      lastLive.classList.toggle('is-unavailable', !activity);
    } else {
      const banner = document.createElement('span');
      banner.className = 'comic-roster-last-live roster-v3-last-live';
      banner.textContent = activity ? 'ÚLTIMO DIRECTO OBSERVADO: ' + dateLabel(activity.date) : 'ÚLTIMO DIRECTO OBSERVADO: SIN REGISTRO';
      card.querySelector('.comic-roster-card-data')?.insertBefore(banner, newSlots);
    }
    card.dataset.rosterGroup = groupFor(hero);
    card.dataset.rosterRhythm = String(rhythm.sort);
    card.dataset.rosterActiveDays = String(metrics.days.count ?? -1);
    card.dataset.rosterAverage = String(metrics.viewers.sort ?? -1);
    card.dataset.rosterSearch = [
      displayName(hero), hero.codename, hero.characterRole, hero.tagline,
      ...(hero.areas || []), ...gameNames(hero, channel)
    ].join(' ').toLocaleLowerCase('es');
    card.dataset.rosterThemes = (hero.areas || []).join('|');
    card.style.setProperty('--roster-card-index', String(index));
    if (!card.dataset.rosterTiltReady) {
      card.dataset.rosterTiltReady = 'true';
      card.addEventListener('pointermove', event => {
        if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
        const y = (event.clientY - bounds.top) / Math.max(bounds.height, 1);
        card.style.setProperty('--roster-tilt-x', ((.5 - y) * 2.4).toFixed(2) + 'deg');
        card.style.setProperty('--roster-tilt-y', ((x - .5) * 2.8).toFixed(2) + 'deg');
        card.classList.add('is-tilting');
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--roster-tilt-x', '0deg');
        card.style.setProperty('--roster-tilt-y', '0deg');
        card.classList.remove('is-tilting');
      });
    }
  }

  function buildKpis(host, heroes, cards) {
    const values = heroes.map(hero => ({ hero, metrics: profileMetrics(hero), activity: latestActivity(hero, channelFor(hero)) }));
    const live = heroes.filter(hero => typeof getNormalizedLiveStatus === 'function' && getNormalizedLiveStatus(hero).state === 'live').length;
    const latest = values.map(row => row.activity?.date).filter(Boolean).sort().at(-1);
    const withData = values.filter(row => row.metrics.hasData).length;
    const kpis = document.createElement('div');
    kpis.className = 'roster-v3-kpis';
    kpis.setAttribute('aria-label', 'Indicadores generales del Roster');
    [
      ['PERFILES', String(heroes.length), 'Expedientes del capítulo'],
      ['EN DIRECTO AHORA', String(live), 'Estado según la última captura disponible'],
      ['ÚLTIMO DIRECTO DE LA LEGIÓN', latest ? dateLabel(latest) : 'Sin registro', 'Última actividad observada'],
      ['PERFILES CON DATOS', String(withData), 'Al menos una métrica con fuente']
    ].forEach(([label, value, detail]) => {
      const item = document.createElement('div');
      item.className = 'roster-v3-kpi';
      const heading = document.createElement('span');
      heading.textContent = label;
      const number = document.createElement('b');
      number.textContent = value;
      const note = document.createElement('small');
      note.textContent = detail;
      item.append(heading, number, note);
      kpis.appendChild(item);
    });
    const heading = host.querySelector('.comic-roster-heading');
    heading?.insertAdjacentElement('afterend', kpis);
  }

  function buildControls(host, heroes) {
    const toolbar = document.createElement('section');
    toolbar.className = 'roster-v3-toolbar';
    toolbar.setAttribute('aria-label', 'Buscar, filtrar y ordenar perfiles');
    const searchLabel = document.createElement('label');
    searchLabel.className = 'roster-v3-search';
    searchLabel.textContent = 'BUSCAR';
    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Nombre, tema, juego o arquetipo…';
    search.value = state.search;
    search.setAttribute('aria-label', 'Buscar por nombre, tema, juego o arquetipo');
    search.addEventListener('input', () => { state.search = search.value; applyFilters(host); });
    searchLabel.appendChild(search);
    const groupLabel = document.createElement('label');
    groupLabel.className = 'roster-v3-control';
    groupLabel.textContent = 'GRUPO';
    const group = document.createElement('select');
    group.setAttribute('aria-label', 'Filtrar por grupo');
    [['all','Todos'],['formation','Formación'],['collaborators','Colaboradores']].forEach(([value,label]) => {
      const option = document.createElement('option'); option.value = value; option.textContent = label; group.appendChild(option);
    });
    group.value = state.group;
    group.addEventListener('change', () => { state.group = group.value; applyFilters(host); });
    groupLabel.appendChild(group);
    const themes = [...new Set(heroes.flatMap(hero => hero.areas || []).filter(Boolean))].sort((a,b) => a.localeCompare(b,'es'));
    const themeLabel = document.createElement('label');
    themeLabel.className = 'roster-v3-control';
    themeLabel.textContent = 'TEMA';
    const theme = document.createElement('select');
    theme.setAttribute('aria-label', 'Filtrar por tema');
    [['all','Todos los temas'], ...themes.map(value => [value,value])].forEach(([value,label]) => {
      const option = document.createElement('option'); option.value = value; option.textContent = label; theme.appendChild(option);
    });
    theme.value = state.theme;
    theme.addEventListener('change', () => { state.theme = theme.value; applyFilters(host); });
    themeLabel.appendChild(theme);
    const sortLabel = document.createElement('label');
    sortLabel.className = 'roster-v3-control roster-v3-sort';
    sortLabel.textContent = 'ORDENAR';
    const sort = document.createElement('select');
    sort.setAttribute('aria-label', 'Ordenar perfiles');
    [
      ['featured','Destacados'],['rhythm','Ritmo'],['days','Días activos'],['viewers','Media de viewers'],['name','Nombre']
    ].forEach(([value,label]) => {
      const option = document.createElement('option'); option.value = value; option.textContent = label; sort.appendChild(option);
    });
    sort.value = state.sort;
    sort.addEventListener('change', () => { state.sort = sort.value; applyFilters(host); });
    sortLabel.appendChild(sort);
    const count = document.createElement('p');
    count.className = 'roster-v3-count';
    count.setAttribute('aria-live', 'polite');
    count.textContent = 'Mostrando ' + heroes.length + ' de ' + heroes.length;
    toolbar.append(searchLabel, groupLabel, themeLabel, sortLabel, count);
    const kpis = host.querySelector('.roster-v3-kpis');
    (kpis || host.querySelector('.comic-roster-heading'))?.insertAdjacentElement('afterend', toolbar);
  }

  function applyFilters(host) {
    const heroes = Array.isArray(heroesData) ? heroesData : [];
    const grid = host.querySelector('.comic-roster-grid');
    if (!grid) return;
    const cards = [...grid.querySelectorAll('.comic-roster-card')];
    let shown = 0;
    const sections = [...grid.querySelectorAll('.roster-v3-group')];
    sections.forEach(section => {
      const group = section.dataset.group;
      const selectedGroup = state.group === 'all' || state.group === group;
      const groupCards = [...section.querySelectorAll('.comic-roster-card')];
      const visible = groupCards.filter(card => {
        const matchesSearch = !state.search || card.dataset.rosterSearch.includes(state.search.toLocaleLowerCase('es'));
        const matchesTheme = state.theme === 'all' || card.dataset.rosterThemes.split('|').includes(state.theme);
        const matchesGroup = selectedGroup;
        card.hidden = !(matchesSearch && matchesTheme && matchesGroup);
        if (!card.hidden) shown += 1;
        return !card.hidden;
      });
      const sorters = {
        rhythm: (a,b) => Number(b.dataset.rosterRhythm) - Number(a.dataset.rosterRhythm),
        days: (a,b) => Number(b.dataset.rosterActiveDays) - Number(a.dataset.rosterActiveDays),
        viewers: (a,b) => Number(b.dataset.rosterAverage) - Number(a.dataset.rosterAverage),
        name: (a,b) => a.dataset.rosterSearch.localeCompare(b.dataset.rosterSearch,'es'),
        featured: (a,b) => Number(b.classList.contains('is-live')) - Number(a.classList.contains('is-live'))
      };
      visible.sort(sorters[state.sort] || sorters.featured).forEach(card => section.querySelector('.roster-v3-group-grid').appendChild(card));
      section.hidden = !selectedGroup || visible.length === 0;
      const amount = section.querySelector('.roster-v3-group-count');
      if (amount) amount.textContent = visible.length + ' perfiles';
    });
    const count = host.querySelector('.roster-v3-count');
    if (count) count.textContent = 'Mostrando ' + shown + ' de ' + heroes.length;
    cards.forEach((card, index) => card.style.setProperty('--roster-card-index', String(index)));
  }

  function enhance() {
    const host = document.getElementById('roster-selector');
    const heroes = Array.isArray(heroesData) ? heroesData : [];
    const grid = host?.querySelector('.comic-roster-grid');
    if (!host || !grid || !heroes.length) return;
    buildKpis(host, heroes);
    const cards = [...grid.querySelectorAll('.comic-roster-card')];
    cards.forEach((card, index) => {
      const hero = heroes.find(item => item.id === card.dataset.creatorId || item.slug === card.dataset.creatorId);
      if (hero) decorateCard(card, hero, index);
    });
    const sections = [
      { key: 'formation', title: 'FORMACIÓN', note: 'Integrantes que forman parte del núcleo de la Legión.' },
      { key: 'collaborators', title: 'COLABORADORES', note: 'Creadores vinculados al proyecto desde sus colaboraciones.' }
    ];
    const groupCards = new Map(sections.map(section => [section.key, []]));
    cards.forEach(card => groupCards.get(card.dataset.rosterGroup || 'formation')?.push(card));
    grid.replaceChildren();
    grid.classList.add('roster-v3-groups');
    sections.forEach(section => {
      const wrapper = document.createElement('section');
      wrapper.className = 'roster-v3-group';
      wrapper.dataset.group = section.key;
      const title = document.createElement('h3');
      title.textContent = section.title;
      const note = document.createElement('p');
      note.textContent = section.note;
      const count = document.createElement('small');
      count.className = 'roster-v3-group-count';
      const subgrid = document.createElement('div');
      subgrid.className = 'roster-v3-group-grid';
      groupCards.get(section.key).forEach(card => subgrid.appendChild(card));
      wrapper.append(title, note, count, subgrid);
      grid.appendChild(wrapper);
    });
    buildControls(host, heroes);
    applyFilters(host);
  }

  window.renderRosterSelector = function rosterSelectorWithEnhancements(...args) {
    originalRender.apply(this, args);
    enhance();
  };
  window.LMRosterEnhancements = Object.freeze({ activeDays17, rhythmFor, profileMetrics });
})();