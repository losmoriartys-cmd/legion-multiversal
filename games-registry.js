(function () {
  'use strict';
  const section = document.getElementById('collab-games-registry');
  const grid = document.getElementById('collab-registry-grid');
  const status = document.getElementById('collab-registry-status');
  const summary = document.getElementById('collab-registry-summary');
  if (!section || !grid || !status || !summary) return;

  const searchInput = document.getElementById('collab-search');
  const categorySelect = document.getElementById('collab-category');
  const creatorSelect = document.getElementById('collab-creator');
  const CREATOR_COLORS = {
    moriartys: '#62d9e8', 'lady-moriarty': '#d68acb', rod3r1k: '#e7c66f',
    akuma: '#ed786d', habitos: '#a99bff', 'dave-nexus': '#86c98e', ardipii: '#8fb7e8'
  };
  let games = [];
  let creators = new Map();
  let channelImages = {};
  let sessions = [];

  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }
  function normalized(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
  function safeHttps(value, allowedHostSuffix) {
    if (typeof value !== 'string') return '';
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || (allowedHostSuffix && !url.hostname.endsWith(allowedHostSuffix))) return '';
      return url.href;
    } catch (error) { return ''; }
  }
  function creatorName(id) {
    const creator = creators.get(id);
    return creator ? (creator.display_name || creator.name || id) : 'Canal por confirmar';
  }
  function creatorLogin(creator) {
    const account = (creator.accounts || []).find(function (item) { return item.platform === 'twitch'; });
    return account ? String(account.login || account.handle || '').toLowerCase() : '';
  }
  function avatarMarkup(id, creator, hasPov) {
    const login = creator ? creatorLogin(creator) : '';
    const image = safeHttps(channelImages[login], 'jtvnw.net');
    const color = CREATOR_COLORS[id] || '#91a9bf';
    const fallback = escapeHtml(String(creatorName(id)).trim().split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join('').toUpperCase());
    return '<span class="collab-avatar-wrap ' + (hasPov ? 'has-pov' : 'no-pov') + '" style="--creator-color:' + color + '">' +
      (image ? '<img src="' + escapeHtml(image) + '" alt="Avatar del canal ' + escapeHtml(creatorName(id)) + '" loading="lazy" decoding="async">' : '<span class="collab-avatar-fallback" aria-hidden="true">' + fallback + '</span>') +
      '</span>';
  }
  function gameCover(game, session) {
    const image = safeHttps(game.portada);
    if (image) return '<div class="collab-game-cover"><img src="' + escapeHtml(image) + '" alt="Portada de ' + escapeHtml(game.nombre) + '" loading="lazy" decoding="async"><span>' + escapeHtml(session.bit) + '</span></div>';
    return '<div class="collab-game-cover collab-game-cover-fallback"><span>' + escapeHtml(session.bit) + '</span><strong>' + escapeHtml(game.nombre) + '</strong><small>ARTE OFICIAL PENDIENTE</small></div>';
  }
  function renderParticipant(id, povChannels) {
    const hasPov = povChannels.has(id);
    return '<li class="collab-participant ' + (hasPov ? 'has-pov' : 'no-pov') + '" data-collab-participant="' + escapeHtml(id) + '">' +
      avatarMarkup(id, creators.get(id), hasPov) +
      '<span class="collab-participant-copy"><strong>' + escapeHtml(creatorName(id)) + '</strong><small>' + (hasPov ? 'PARTICIPÓ · POV DISPONIBLE' : 'PARTICIPÓ · SIN POV REGISTRADO') + '</small></span></li>';
  }
  function renderPov(pov) {
    const id = pov.canal;
    const name = id ? creatorName(id) : 'CANAL POR CONFIRMAR';
    const color = id ? (CREATOR_COLORS[id] || '#91a9bf') : '#9aa7b5';
    const href = safeHttps(pov.url, 'twitch.tv');
    if (!href) return '';
    return '<a class="collab-pov-link ' + (id ? '' : 'is-unassigned') + '" style="--creator-color:' + color + '" href="' + escapeHtml(href) + '" target="_blank" rel="noopener noreferrer" data-pov-channel="' + escapeHtml(id || 'unassigned') + '" aria-label="Abrir POV de ' + escapeHtml(name) + ' en Twitch"><span class="collab-pov-play" aria-hidden="true">▶</span><span><small>POV · ' + escapeHtml(name) + '</small><strong>ABRIR VOD ↗</strong></span></a>';
  }
  function renderSession(entry) {
    const game = entry.game;
    const session = entry.session;
    const povChannels = new Set((session.pov || []).map(function (pov) { return pov.canal; }).filter(Boolean));
    const participants = (session.participantes || []).map(function (id) { return renderParticipant(id, povChannels); }).join('');
    const povs = (session.pov || []).map(renderPov).join('');
    const categories = (game.categorias || []).map(function (category) { return '<span class="collab-category-chip">' + escapeHtml(category) + '</span>'; }).join('');
    const players = game.jugadores ? '<span class="collab-game-meta-item">JUGADORES · ' + escapeHtml(game.jugadores.min) + '–' + escapeHtml(game.jugadores.max) + '</span>' : '';
    const store = safeHttps(game.tienda);
    const note = session.nota ? '<p class="collab-session-note">' + escapeHtml(session.nota) + '</p>' : '';
    const dateLabel = session.fecha ? escapeHtml(session.fecha) : 'FECHA SIN VERIFICAR';
    const arsenalLink = '<a class="collab-arsenal-link" href="#arsenal-game-' + escapeHtml(game.id) + '" data-open-arsenal="' + escapeHtml(game.id) + '">VER FICHA EN ARSENAL →</a>';
    const storeLink = store ? '<a class="collab-store-link" href="' + escapeHtml(store) + '" target="_blank" rel="noopener noreferrer">FICHA OFICIAL ↗</a>' : '';
    return '<article class="collab-session-card" id="' + escapeHtml(session.bit.toLowerCase()) + '" data-collab-session="' + escapeHtml(session.bit) + '" data-game-id="' + escapeHtml(game.id) + '">' +
      gameCover(game, session) + '<div class="collab-session-content">' +
      '<div class="collab-session-topline"><span class="collab-bit-id">' + escapeHtml(session.bit) + '</span><span class="collab-session-date">' + dateLabel + '</span></div>' +
      '<h4>' + escapeHtml(game.nombre) + '</h4><div class="collab-session-categories">' + categories + '</div>' +
      '<div class="collab-game-meta">' + players + '<span class="collab-game-meta-item">' + escapeHtml(game.modalidad || 'Modalidad sin verificar') + '</span></div>' +
      '<section class="collab-session-roster" aria-label="Participantes de ' + escapeHtml(game.nombre) + '"><h5>QUIÉNES JUGARON</h5><ul class="collab-participant-list">' + participants + '</ul></section>' +
      '<section class="collab-session-povs" aria-label="Puntos de vista registrados de ' + escapeHtml(game.nombre) + '"><h5>POV DISPONIBLES · ' + (session.pov || []).length + '</h5><div class="collab-pov-list">' + povs + '</div></section>' +
      note + '<div class="collab-session-actions">' + arsenalLink + storeLink + '</div></div></article>';
  }
  function populateFilters() {
    const categories = Array.from(new Set(sessions.flatMap(function (entry) { return entry.game.categorias || []; }))).sort();
    const creatorIds = new Set();
    sessions.forEach(function (entry) {
      (entry.session.participantes || []).forEach(function (id) { creatorIds.add(id); });
      (entry.session.pov || []).forEach(function (pov) { if (pov.canal) creatorIds.add(pov.canal); });
    });
    categorySelect.innerHTML = '<option value="all">Todas las categorías</option>' + categories.map(function (category) {
      return '<option value="' + escapeHtml(category) + '">' + escapeHtml(category) + '</option>';
    }).join('');
    creatorSelect.innerHTML = '<option value="all">Todos los creadores</option>' + Array.from(creatorIds).sort(function (a, b) {
      return creatorName(a).localeCompare(creatorName(b), 'es');
    }).map(function (id) { return '<option value="' + escapeHtml(id) + '">' + escapeHtml(creatorName(id)) + '</option>'; }).join('');
  }
  function filteredSessions() {
    const query = normalized(searchInput.value);
    const category = categorySelect.value;
    const creatorId = creatorSelect.value;
    return sessions.filter(function (entry) {
      const game = entry.game;
      const session = entry.session;
      const haystack = normalized([game.nombre, game.id, (game.categorias || []).join(' '),
        (session.participantes || []).map(creatorName).join(' '),
        (session.pov || []).map(function (pov) { return pov.canal ? creatorName(pov.canal) : ''; }).join(' ')
      ].join(' '));
      const ids = (session.participantes || []).concat((session.pov || []).map(function (pov) { return pov.canal; }).filter(Boolean));
      return (!query || haystack.includes(query)) &&
        (category === 'all' || (game.categorias || []).includes(category)) &&
        (creatorId === 'all' || ids.includes(creatorId));
    });
  }
  function render() {
    const visible = filteredSessions();
    grid.innerHTML = visible.length ? visible.map(renderSession).join('') :
      '<div class="collab-registry-empty"><strong>NO ENCONTRAMOS SESIONES CON ESOS FILTROS.</strong><p>Probá con otra palabra, categoría o creador.</p><button type="button" id="collab-reset-filters">LIMPIAR FILTROS</button></div>';
    grid.dataset.loaded = 'true';
    grid.setAttribute('aria-busy', 'false');
    status.textContent = visible.length + (visible.length === 1 ? ' sesión visible.' : ' sesiones visibles.') + ' · ' +
      visible.reduce(function (sum, entry) { return sum + (entry.session.pov || []).length; }, 0) + ' POV en los resultados.';
    document.getElementById('collab-reset-filters')?.addEventListener('click', resetFilters);
  }
  function resetFilters() {
    searchInput.value = '';
    categorySelect.value = 'all';
    creatorSelect.value = 'all';
    render();
  }
  function renderSummary() {
    const uniqueCreators = new Set();
    let povCount = 0;
    sessions.forEach(function (entry) {
      (entry.session.participantes || []).forEach(function (id) { uniqueCreators.add(id); });
      povCount += (entry.session.pov || []).length;
    });
    summary.innerHTML = '<article><strong>' + sessions.length + '</strong><span>SESIONES BIT</span></article>' +
      '<article><strong>' + povCount + '</strong><span>POV REGISTRADOS</span></article>' +
      '<article><strong>' + uniqueCreators.size + '</strong><span>INTEGRANTES PARTICIPANTES</span></article>';
    summary.dataset.gamesDocumented = String(new Set(sessions.map(function (entry) { return entry.game.id; })).size);
  }
  async function loadRegistry() {
    section.setAttribute('aria-busy', 'true');
    status.textContent = 'Conectando con el registro maestro de juegos…';
    try {
      const results = await Promise.all([
        fetch('./data/games.json', { cache: 'no-store' }),
        fetch('./data/roster.json', { cache: 'no-store' }),
        fetch('./data.json', { cache: 'no-store' }).catch(function () { return null; })
      ]);
      if (!results[0].ok) throw new Error('No se pudo cargar games.json (' + results[0].status + ').');
      if (!results[1].ok) throw new Error('No se pudo cargar data/roster.json (' + results[1].status + ').');
      const registry = await results[0].json();
      const roster = await results[1].json();
      if (!registry || !Array.isArray(registry.juegos) || !Array.isArray(roster.heroes)) throw new Error('El registro maestro o el Roster no tiene la estructura esperada.');
      games = registry.juegos;
      creators = new Map(roster.heroes.map(function (hero) { return [hero.id || hero.slug, hero]; }));
      if (results[2] && results[2].ok) {
        const activity = await results[2].json();
        Object.keys(activity.channels || {}).forEach(function (login) {
          const image = activity.channels[login] && activity.channels[login].profile_image_url;
          if (image) channelImages[login.toLowerCase()] = image;
        });
      }
      sessions = games.flatMap(function (game) {
        return (game.sesiones || []).map(function (session) { return { game: game, session: session }; });
      }).sort(function (a, b) { return a.session.bit.localeCompare(b.session.bit, 'en', { numeric: true }); });
      if (!sessions.length) throw new Error('El registro no contiene sesiones BIT documentadas.');
      populateFilters();
      renderSummary();
      render();
      section.dataset.collabReady = 'true';
      section.setAttribute('aria-busy', 'false');
      return { games: games.length, sessions: sessions.length };
    } catch (error) {
      console.error('No se pudo cargar la Bitácora de colaboraciones:', error);
      section.dataset.collabReady = 'error';
      section.setAttribute('aria-busy', 'false');
      grid.setAttribute('aria-busy', 'false');
      status.textContent = 'No se pudo conectar con el registro de colaboraciones.';
      grid.innerHTML = '<div class="collab-registry-empty" role="alert"><strong>EL ARCHIVO NO ESTÁ DISPONIBLE.</strong><p>Los registros se conservan en el catálogo maestro. Podés volver a intentar la carga.</p><button type="button" id="collab-retry-registry">REINTENTAR</button></div>';
      document.getElementById('collab-retry-registry')?.addEventListener('click', loadRegistry);
      return null;
    }
  }
  [searchInput, categorySelect, creatorSelect].forEach(function (control) {
    control.addEventListener(control === searchInput ? 'input' : 'change', render);
  });
  grid.addEventListener('click', function (event) {
    const link = event.target.closest('[data-open-arsenal]');
    if (!link) return;
    event.preventDefault();
    const gameId = link.dataset.openArsenal;
    if (typeof window.switchChapter === 'function') window.switchChapter(5, { scrollBehavior: 'auto' });
    window.requestAnimationFrame(function () {
      document.getElementById('arsenal-game-' + gameId)?.scrollIntoView({ block: 'center', behavior: 'auto' });
    });
  });
  window.gamesRegistryReady = loadRegistry();
})();