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
  // El color de cada creador vive en data/creator-colors.json y llega como variable CSS (creator-colors.css).
  function creatorColor(id) {
    return /^[a-z0-9-]+$/.test(String(id)) ? 'var(--c-' + id + ', #91a9bf)' : '#91a9bf';
  }
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
      const hostname = url.hostname.toLowerCase();
      const allowedHost = !allowedHostSuffix || hostname === allowedHostSuffix || hostname.endsWith('.' + allowedHostSuffix);
      if (url.protocol !== 'https:' || !allowedHost) return '';
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
    const color = creatorColor(id);
    const fallback = escapeHtml(String(creatorName(id)).trim().split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join('').toUpperCase());
    return '<span class="collab-avatar-wrap ' + (hasPov ? 'has-pov' : 'no-pov') + '" style="--creator-color:' + color + '">' +
      (image ? '<img src="' + escapeHtml(image) + '" alt="Avatar del canal ' + escapeHtml(creatorName(id)) + '" loading="lazy" decoding="async">' : '<span class="collab-avatar-fallback" aria-hidden="true">' + fallback + '</span>') +
      '</span>';
  }
  function gamePoster(game, session, dateLabel, categories) {
    const image = safeHttps(game.portada);
    const art = image
      ? '<img src="' + escapeHtml(image) + '" alt="Portada de ' + escapeHtml(game.nombre) + '" loading="lazy" decoding="async">'
      : '<span class="collab-poster-fallback" aria-hidden="true">ARTE OFICIAL PENDIENTE</span>';
    return '<div class="collab-poster' + (image ? '' : ' collab-poster-pending') + '">' + art +
      '<div class="collab-poster-top"><span class="collab-bit-id">' + escapeHtml(session.bit) + '</span><span class="collab-session-date">' + dateLabel + '</span></div>' +
      '<div class="collab-poster-bottom"><h4>' + escapeHtml(game.nombre) + '</h4><div class="collab-session-categories">' + categories + '</div></div></div>';
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
    const color = id ? creatorColor(id) : '#9aa7b5';
    const href = safeHttps(pov.url, 'twitch.tv');
    if (!href) return '';
    return '<a class="collab-pov-link ' + (id ? '' : 'is-unassigned') + '" style="--creator-color:' + color + '" href="' + escapeHtml(href) + '" target="_blank" rel="noopener noreferrer" data-pov-channel="' + escapeHtml(id || 'unassigned') + '" aria-label="Abrir POV de ' + escapeHtml(name) + ' en Twitch"><span class="collab-pov-play" aria-hidden="true">▶</span><span><small>POV · ' + escapeHtml(name) + '</small><strong>ABRIR VOD ↗</strong></span></a>';
  }
  var MONTHS_ES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  function formatSessionDate(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
    if (!match) return String(value);
    return Number(match[3]) + ' ' + MONTHS_ES[Number(match[2]) - 1] + ' ' + match[1];
  }

  function archiveLegacyDossier() {
    const legacy = document.getElementById('barfender-expediente');
    if (!legacy || legacy.dataset.archived === 'true') return;
    const details = document.createElement('details');
    details.className = 'barfender-reading';
    details.id = 'barfender-expediente';
    details.dataset.archived = 'true';
    const summary = document.createElement('summary');
    summary.textContent = 'EXP-001 · ARCHIVO HISTÓRICO · MATERIAL DE APOYO';
    const parent = legacy.parentNode;
    const continuity = legacy.nextElementSibling && legacy.nextElementSibling.classList.contains('collab-log-section')
      ? legacy.nextElementSibling
      : null;
    const duplicateImages = legacy.querySelectorAll('.campaign-four-views, .barfender-steam-art');
    duplicateImages.forEach(function (image) { image.remove(); });
    legacy.removeAttribute('id');
    parent.insertBefore(details, legacy);
    details.appendChild(summary);
    details.appendChild(legacy);
    if (continuity) details.appendChild(continuity);
    legacy.dataset.archived = 'true';
  }
  archiveLegacyDossier();

  function formatDuration(seconds) {
    const total = Number(seconds);
    if (!Number.isFinite(total) || total < 0) return null;
    const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60);
    return h + ' h ' + String(m).padStart(2, '0') + ' min';
  }
  function renderClip(clip) {
    const href = safeHttps(clip.url, 'twitch.tv');
    if (!href) return '';
    return '<li><a class="collab-clip-link" style="--creator-color:' + creatorColor(clip.canal) + '" href="' + escapeHtml(href) + '" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">✂</span><span><small>CLIP · ' + escapeHtml(creatorName(clip.canal)) + '</small><strong>' + escapeHtml(clip.titulo) + ' ↗</strong></span></a></li>';
  }
  function renderMoment(moment, session) {
    const pov = (session.pov || []).find(function (item) { return item.canal === moment.canal; });
    const href = pov ? safeHttps(pov.url, 'twitch.tv') : null;
    const parts = String(moment.t).split(':').map(Number);
    const seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    const time = href ? '<a href="' + escapeHtml(href) + '?t=' + seconds + 's" target="_blank" rel="noopener noreferrer" aria-label="Abrir el VOD en ' + escapeHtml(moment.t) + '">' + escapeHtml(moment.t) + '</a>' : escapeHtml(moment.t);
    return '<li><span class="collab-moment-time">' + time + '</span><span>' + escapeHtml(moment.texto) + ' <small>· POV ' + escapeHtml(creatorName(moment.canal)) + '</small></span></li>';
  }
  function emptyState(text) { return '<p class="collab-empty-state">' + text + '</p>'; }
  function renderFichaTabs(entry, participants, povs, povTotal, note) {
    const session = entry.session, game = entry.game;
    const base = 'tab-' + session.bit.toLowerCase();
    const clips = (session.clips || []).map(renderClip).join('');
    const clipCount = (session.clips || []).length;
    const moments = (session.momentos || []).map(function (m) { return renderMoment(m, session); }).join('');
    const sessionArt = session.imagen ? '<figure class="campaign-editorial-art collab-session-art"><img src="' + escapeHtml(session.imagen) + '" alt="Imagen de la sesión de ' + escapeHtml(game.nombre) + '" loading="lazy" decoding="async" width="2048" height="1152"><figcaption>UNA SESIÓN · PUNTOS DE VISTA DE LA LEGIÓN</figcaption></figure>' : '';
    const numeros = session.numeros;
    const duration = numeros ? formatDuration(numeros.duracion_vod_s) : null;
    const views = numeros && Number.isFinite(numeros.vistas_vod) ? Number(numeros.vistas_vod).toLocaleString('es-AR') : null;
    const numbersBody = numeros && (duration || views)
      ? '<dl class="collab-numbers"><div><dt>DURACIÓN DEL VOD</dt><dd>' + (duration || '—') + '</dd></div><div><dt>VISTAS DEL VOD</dt><dd>' + (views || '—') + '</dd></div></dl><p class="collab-numbers-source">Fuente: ' + escapeHtml(numeros.fuente) + ' · capturado el ' + escapeHtml(formatSessionDate(numeros.capturado)) + '</p>'
      : emptyState('Sin números verificados para esta sesión. Un número solo se publica con fuente y fecha de captura.');
    const tabs = [
      ['resumen', 'RESUMEN', sessionArt + '<h5 class="collab-panel-title">LO QUE PASÓ EN ' + escapeHtml(game.nombre.toUpperCase()) + '</h5>' +
        (session.resumen ? '<p class="collab-summary">' + escapeHtml(session.resumen) + '</p>' : emptyState('Resumen pendiente de redacción.')) +
        (moments ? '<h5 class="collab-panel-title">MOMENTOS</h5><ol class="collab-moment-list">' + moments + '</ol>' : '') + note],
      ['jugaron', 'JUGARON · ' + (session.participantes || []).length, '<ul class="collab-participant-list" aria-label="Participantes de ' + escapeHtml(game.nombre) + '">' + participants + '</ul>'],
      ['povs', 'POV · ' + povTotal, '<div class="collab-pov-list" aria-label="Puntos de vista registrados de ' + escapeHtml(game.nombre) + '">' + povs + '</div>'],
      ['clips', 'CLIPS' + (clipCount ? ' · ' + clipCount : ''), clips ? '<ul class="collab-clip-list">' + clips + '</ul>' : emptyState('Todavía no hay clips cargados para esta sesión.')],
      ['numeros', 'NÚMEROS', numbersBody]
    ];
    return '<div class="collab-tabs" data-collab-tabs>' +
      '<div class="collab-tablist" role="tablist" aria-label="Secciones de ' + escapeHtml(game.nombre) + '">' + tabs.map(function (tab, index) {
        return '<button type="button" role="tab" id="' + base + '-' + tab[0] + '-tab" aria-controls="' + base + '-' + tab[0] + '" aria-selected="' + (index === 0) + '" tabindex="' + (index === 0 ? 0 : -1) + '">' + tab[1] + '</button>';
      }).join('') + '</div>' + tabs.map(function (tab, index) {
        return '<div class="collab-tabpanel" role="tabpanel" id="' + base + '-' + tab[0] + '" aria-labelledby="' + base + '-' + tab[0] + '-tab"' + (index === 0 ? '' : ' hidden') + '>' + tab[2] + '</div>';
      }).join('') + '</div>';
  }
  function activateTab(button) {
    const root = button.closest('[data-collab-tabs]');
    if (!root) return;
    root.querySelectorAll('[role="tab"]').forEach(function (tab) {
      const active = tab === button;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) panel.hidden = !active;
    });
    button.focus();
  }
  document.addEventListener('click', function (event) {
    const tab = event.target.closest && event.target.closest('.collab-tablist [role="tab"]');
    if (tab) activateTab(tab);
  });
  document.addEventListener('keydown', function (event) {
    const tab = event.target.closest && event.target.closest('.collab-tablist [role="tab"]');
    if (!tab || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    const tabs = Array.from(tab.parentElement.querySelectorAll('[role="tab"]'));
    let index = tabs.indexOf(tab);
    if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') index = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') index = 0;
    else index = tabs.length - 1;
    event.preventDefault();
    activateTab(tabs[index]);
  });

  function renderSession(entry) {
    const game = entry.game;
    const session = entry.session;
    const povChannels = new Set((session.pov || []).map(function (pov) { return pov.canal; }).filter(Boolean));
    const participantIds = session.participantes || [];
    const participants = participantIds.map(function (id) { return renderParticipant(id, povChannels); }).join('');
    const stack = participantIds.slice(0, 6).map(function (id) { return '<li>' + avatarMarkup(id, creators.get(id), povChannels.has(id)) + '</li>'; }).join('');
    const povs = (session.pov || []).map(renderPov).join('');
    const categories = (game.categorias || []).map(function (category) { return '<span class="collab-category-chip">' + escapeHtml(category) + '</span>'; }).join('');
    const players = game.jugadores ? '<span class="collab-game-meta-item">JUGADORES · ' + escapeHtml(game.jugadores.min) + '–' + escapeHtml(game.jugadores.max) + '</span>' : '';
    const store = safeHttps(game.tienda);
    const note = session.nota ? '<p class="collab-session-note">' + escapeHtml(session.nota) + '</p>' : '';
    const dateLabel = session.fecha ? escapeHtml(formatSessionDate(session.fecha)) : 'FECHA SIN VERIFICAR';
    const catalogLink = '<a class="collab-arsenal-link" href="#arsenal-game-' + escapeHtml(game.id) + '" data-open-arsenal="' + escapeHtml(game.id) + '">VER EN EL CATÁLOGO →</a>';
    const storeLink = store ? '<a class="collab-store-link" href="' + escapeHtml(store) + '" target="_blank" rel="noopener noreferrer">FICHA OFICIAL ↗</a>' : '';
    const archiveLink = game.expediente_comercial ? '<a class="collab-store-link" href="#barfender-expediente">ARCHIVO HISTÓRICO · ' + escapeHtml(game.expediente_comercial) + ' ↗</a>' : '';
    const povTotal = (session.pov || []).length;
    return '<article class="collab-session-card" id="' + escapeHtml(session.bit.toLowerCase()) + '" data-collab-session="' + escapeHtml(session.bit) + '" data-game-id="' + escapeHtml(game.id) + '">' +
      gamePoster(game, session, dateLabel, categories) +
      '<div class="collab-card-strip"><ul class="collab-avatar-stack" aria-hidden="true">' + stack + '</ul>' +
      '<span class="collab-card-count">' + participantIds.length + ' JUGARON · ' + povTotal + (povTotal === 1 ? ' POV' : ' POV') + '</span></div>' +
      '<details class="collab-ficha"><summary><span>ABRIR FICHA</span><span class="collab-ficha-close">CERRAR FICHA</span></summary>' +
      '<div class="collab-session-content">' +
      '<div class="collab-game-meta">' + players + '<span class="collab-game-meta-item">' + escapeHtml(game.modalidad || 'Modalidad sin verificar') + '</span></div>' +
      renderFichaTabs(entry, participants, povs, povTotal, note) +
      '<div class="collab-session-actions">' + catalogLink + storeLink + archiveLink + '</div></div></details></article>';
  }
  function renderTimeline() {
    const target = document.getElementById('collab-timeline');
    if (!target) return;
    const dated = sessions.filter(function (entry) { return entry.session.fecha; }).sort(function (a, b) {
      return String(a.session.fecha).localeCompare(String(b.session.fecha));
    });
    if (!dated.length) { target.hidden = true; return; }
    target.hidden = false;
    target.innerHTML = '<h5 class="collab-timeline-title">LA LEGIÓN JUGANDO · EN ORDEN</h5><ol class="collab-timeline-list">' + dated.map(function (entry) {
      return '<li><a href="#' + escapeHtml(entry.session.bit.toLowerCase()) + '" data-open-session="' + escapeHtml(entry.session.bit) + '"><time datetime="' + escapeHtml(entry.session.fecha) + '">' + escapeHtml(formatSessionDate(entry.session.fecha)) + '</time><strong>' + escapeHtml(entry.game.nombre) + '</strong></a></li>';
    }).join('') + '</ol>';
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
    const gamesPlayed = new Set(sessions.map(function (entry) { return entry.game.id; })).size;
    summary.innerHTML = '<article><strong>' + gamesPlayed + '</strong><span>JUEGOS JUGADOS</span></article>' +
      '<article><strong>' + sessions.length + '</strong><span>SESIONES BIT</span></article>' +
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
      renderTimeline();
      render();
      section.dataset.collabReady = 'true';
      section.setAttribute('aria-busy', 'false');
      return { games: games.length, sessions: sessions.length };
    } catch (error) {
      console.error('No se pudo cargar la Bitácora de colaboraciones:', error);
      section.dataset.collabReady = 'error';
      section.setAttribute('aria-busy', 'false');
      grid.setAttribute('aria-busy', 'false');
      const hasPrerendered = Boolean(grid.querySelector('[data-prerendered="true"]'));
      if (hasPrerendered) {
        section.dataset.collabReady = 'static';
        status.textContent = 'No se pudo actualizar la Bitácora; el contenido HTML sigue disponible. Los filtros quedaron desactivados.';
        [searchInput, categorySelect, creatorSelect].forEach(function (control) { if (control) control.disabled = true; });
        return null;
      }
      status.textContent = 'No se pudo conectar con el registro de colaboraciones.';
      grid.innerHTML = '<div class="collab-registry-empty" role="alert"><strong>EL ARCHIVO NO ESTÁ DISPONIBLE.</strong><p>Los registros se conservan en el catálogo maestro. Podés volver a intentar la carga.</p><button type="button" id="collab-retry-registry">REINTENTAR</button></div>';
      document.getElementById('collab-retry-registry')?.addEventListener('click', loadRegistry);
      return null;
    }
  }
  [searchInput, categorySelect, creatorSelect].forEach(function (control) {
    control.addEventListener(control === searchInput ? 'input' : 'change', render);
  });
  function scrollToRegistryTarget(target) {
    if (!target || !target.isConnected) return;
    const rootScroller = document.documentElement;
    const previousScrollBehavior = rootScroller.style.scrollBehavior;
    rootScroller.style.scrollBehavior = 'auto';
    target.scrollIntoView({ block: 'center', behavior: 'auto' });
    window.requestAnimationFrame(function () { rootScroller.style.scrollBehavior = previousScrollBehavior; });
  }
  function revealCatalogCard(gameId) {
    const target = document.getElementById('arsenal-game-' + gameId);
    if (target) scrollToRegistryTarget(target);
    else scrollToRegistryTarget(document.getElementById('arsenal-registry'));
  }
  grid.addEventListener('click', function (event) {
    const link = event.target.closest('[data-open-arsenal]');
    if (!link) return;
    event.preventDefault();
    revealCatalogCard(link.dataset.openArsenal);
  });
  grid.addEventListener('toggle', function (event) {
    const details = event.target;
    if (!details || !details.classList || !details.classList.contains('collab-ficha')) return;
    const card = details.closest('.collab-session-card');
    if (card) card.classList.toggle('is-open', details.open);
  }, true);
  const timeline = document.getElementById('collab-timeline');
  if (timeline) {
    timeline.addEventListener('click', function (event) {
      const link = event.target.closest('[data-open-session]');
      if (!link) return;
      event.preventDefault();
      resetFilters();
      const card = document.getElementById(link.dataset.openSession.toLowerCase());
      if (!card) return;
      const details = card.querySelector('details.collab-ficha');
      if (details) details.open = true;
      scrollToRegistryTarget(card);
    });
  }
  window.gamesRegistryReady = loadRegistry();
})();