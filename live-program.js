/* Legión Multiversal · EN VIVO como programa interactivo.
 *
 * Si hay integrantes transmitiendo (captura fresca), el escenario muestra su directo.
 * Si no, la pantalla pasa a los clips públicos de cada canal, los POV de los expedientes,
 * los videos de YouTube y los horarios declarados. Nunca se inventan estados ni cifras:
 * todo sale de los archivos del sitio que se le pasan en `ctx`.
 */
(function () {
  'use strict';

  const MAX_QUEUE = 12;
  const state = { who: 'todos', clipId: null, watching: null, playing: false, archive: null, showingClip: false, sig: '' };
  let host = null;
  let lastCtx = null;
  let bound = false;

  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
  const fmtDuration = (seconds) => {
    const total = Math.round(Number(seconds) || 0);
    return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
  };
  const fmtDate = (iso) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  };
  const fmtViews = (n) => (Number.isFinite(Number(n)) ? Number(n).toLocaleString('es-AR') : '');
  const viewsLabel = (n) => (Number.isFinite(Number(n)) ? fmtViews(n) + (Number(n) === 1 ? ' vista' : ' vistas') : '');
  const safeUrl = (url) => (/^https:\/\//i.test(String(url || '')) ? String(url) : '');
  const parentHost = () => (typeof location !== 'undefined' && /^[a-z0-9.-]+$/i.test(location.hostname) ? location.hostname : '');

  function buildModel(ctx) {
    const heroes = Array.isArray(ctx.heroes) ? ctx.heroes : [];
    const clipsByCreator = (ctx.clips && ctx.clips.creators) || {};
    const people = heroes.map((hero) => {
      const id = hero.id || hero.slug || hero.name;
      const live = ctx.liveStateOf ? ctx.liveStateOf(hero) : null;
      const isLive = Boolean(live && live.fresh && live.channel && live.channel.live);
      const clips = ((clipsByCreator[id] && clipsByCreator[id].clips) || [])
        .filter((clip) => clip && clip.id && clip.title)
        .slice()
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
      return {
        id,
        hero,
        name: ctx.nameOf ? ctx.nameOf(hero) : (hero.display_name || hero.name || 'Integrante'),
        img: hero.portrait || hero.img || '',
        login: live ? live.login : '',
        liveState: live,
        isLive,
        hasTwitch: Boolean(live),
        clips
      };
    });
    const byId = {};
    people.forEach((person) => { byId[person.id] = person; });

    const liveList = people.filter((person) => person.isLive);
    let pool = [];
    if (state.who !== 'todos' && byId[state.who]) {
      pool = byId[state.who].clips.slice(0, MAX_QUEUE).map((clip) => ({ clip, owner: byId[state.who] }));
    } else {
      people.forEach((person) => person.clips.slice(0, 2).forEach((clip) => pool.push({ clip, owner: person })));
      pool.sort((a, b) => Date.parse(b.clip.created_at) - Date.parse(a.clip.created_at));
      pool = pool.slice(0, MAX_QUEUE);
    }
    const current = pool.find((item) => item.clip.id === state.clipId) || pool[0] || null;

    const expedientes = [];
    people.forEach((person) => (person.hero.bitacora || []).forEach((entry) => {
      if (entry && entry.type === 'expediente' && /barfender/i.test(entry.title || '')) {
        expedientes.push({ person, entry });
      }
    }));
    expedientes.sort((a, b) => String(a.entry.title).localeCompare(String(b.entry.title), 'es') || a.person.name.localeCompare(b.person.name, 'es'));

    const youtube = [];
    const platformCreators = (ctx.platform && ctx.platform.creators) || {};
    people.forEach((person) => {
      const yt = platformCreators[person.id] && platformCreators[person.id].platforms && platformCreators[person.id].platforms.youtube;
      const videos = ((yt && yt.recent_videos) || []).filter((video) => video && video.title && safeUrl(video.url));
      if (videos.length) youtube.push({ person, channelUrl: safeUrl(yt.url), videos: videos.slice(0, 3) });
    });

    return { people, byId, liveList, pool, current, expedientes: expedientes.slice(0, 8), youtube };
  }

  function signature(ctx, model) {
    const act = ctx.activity || {};
    return [
      model.liveList.map((person) => person.login + ':' + (person.liveState.channel.current_viewers == null ? '' : person.liveState.channel.current_viewers)).join(','),
      act.updated_at ? 'a' : 'n',
      model.people.length,
      ctx.clips ? 'c' : 'n',
      ctx.platform ? 'p' : 'n'
    ].join('|');
  }

  function thumb(src, fallback, cls) {
    const url = safeUrl(src);
    return '<img class="' + cls + '" src="' + esc(url || fallback) + '" alt="" loading="lazy" data-fallback="' + esc(fallback) + '">';
  }

  function statusBanner(ctx, model) {
    const act = ctx.activity;
    if (!act) {
      return '<div class="lp-status is-wait" role="status"><span class="lp-dot"></span><strong>CONSULTANDO CANALES</strong><span>Estamos leyendo el último estado público de la Legión…</span></div>';
    }
    const updated = act.updated_at ? new Date(act.updated_at) : null;
    const label = updated && !Number.isNaN(updated.getTime()) ? updated.toLocaleString('es-AR') : 'fecha no disponible';
    const anyFresh = model.people.some((person) => person.liveState && person.liveState.fresh);
    const note = '<small>Última captura: ' + esc(label) + '. El colector consulta Twitch cada pocos minutos; no es una conexión en tiempo real.</small>';
    if (model.liveList.length) {
      const names = model.liveList.map((person) => esc(person.name)).join(' · ');
      return '<div class="lp-status is-live" role="status"><span class="lp-dot lp-pulse"></span><strong>EN DIRECTO AHORA</strong><span>' + names + '</span>' + note + '</div>';
    }
    if (!anyFresh) {
      return '<div class="lp-status is-wait" role="status"><span class="lp-dot"></span><strong>CAPTURA DEMORADA</strong><span>No podemos confirmar quién transmite ahora. Mientras tanto, mirá lo que dejaron.</span>' + note + '</div>';
    }
    return '<div class="lp-status" role="status"><span class="lp-dot"></span><strong>NADIE TRANSMITE AHORA</strong><span>Mirá lo que dejaron y fijate cuándo vuelven.</span>' + note + '</div>';
  }

  function liveStage(model) {
    const watching = model.liveList.find((person) => person.login === state.watching) || model.liveList[0];
    const channel = watching.liveState.channel;
    const viewers = Number.isFinite(Number(channel.current_viewers)) && channel.current_viewers !== null ? fmtViews(channel.current_viewers) + ' VIENDO' : '';
    const title = channel.current_title || channel.current_game || 'En directo';
    const parent = parentHost();
    const canEmbed = Boolean(parent && watching.login);
    let screen;
    if (state.playing && canEmbed) {
      screen = '<iframe class="lp-embed" src="https://player.twitch.tv/?channel=' + encodeURIComponent(watching.login) + '&parent=' + encodeURIComponent(parent) + '&autoplay=true&muted=false" allowfullscreen title="Transmisión de ' + esc(watching.name) + ' en Twitch"></iframe>';
    } else {
      screen = thumb(watching.img, watching.img, 'lp-screen-img') + '<div class="lp-screen-shade"></div>' +
        '<div class="lp-screen-top"><span class="lp-badge is-live"><span class="lp-dot lp-pulse"></span>EN DIRECTO' + (viewers ? ' · ' + esc(viewers) : '') + '</span></div>' +
        '<div class="lp-screen-bottom"><span class="lp-eyebrow">' + esc(watching.name) + (channel.current_game ? ' · ' + esc(channel.current_game) : '') + '</span><h2 class="lp-screen-title">' + esc(title) + '</h2></div>';
    }
    const controls = '<div class="lp-controls">' +
      (canEmbed ? '<button type="button" class="lp-btn is-primary" data-lp="play">' + (state.playing ? '■ VOLVER A LA PORTADA' : '▶ MIRAR ACÁ') + '</button>' : '') +
      '<a class="lp-btn" href="' + esc(safeUrl(watching.liveState.url) || ('https://twitch.tv/' + encodeURIComponent(watching.login))) + '" target="_blank" rel="noopener">ABRIR EN TWITCH ↗</a></div>';
    const note = canEmbed
      ? 'Se abre en esta pantalla. Si tu navegador bloquea el reproductor, usá “Abrir en Twitch”.'
      : 'El reproductor integrado necesita el sitio publicado; abrí el directo en Twitch.';
    return '<div class="lp-screen">' + screen + '</div>' + controls + '<p class="lp-note">' + esc(note) + '</p>';
  }

  function clipStage(model) {
    const item = model.current;
    if (!item) {
      return '<div class="lp-screen is-empty"><div class="lp-empty"><strong>Todavía no hay momentos para mostrar</strong><span>Cuando los canales sumen clips públicos, aparecen acá.</span></div></div>';
    }
    const { clip, owner } = item;
    const parent = parentHost();
    const embed = safeUrl(clip.embed_url);
    const canEmbed = Boolean(parent && embed);
    let screen;
    if (state.playing && canEmbed) {
      screen = '<iframe class="lp-embed" src="' + esc(embed + (embed.indexOf('?') >= 0 ? '&' : '?') + 'parent=' + encodeURIComponent(parent) + '&autoplay=true') + '" allowfullscreen title="Clip de ' + esc(owner.name) + '"></iframe>';
    } else {
      const meta = [fmtDuration(clip.duration), fmtDate(clip.created_at), viewsLabel(clip.view_count)].filter(Boolean).join(' · ');
      screen = thumb(clip.thumbnail_url, owner.img, 'lp-screen-img') + '<div class="lp-screen-shade"></div>' +
        '<div class="lp-screen-top"><span class="lp-badge">MOMENTO DESTACADO</span><span class="lp-badge is-dark">' + esc(meta) + '</span></div>' +
        '<div class="lp-screen-bottom"><span class="lp-eyebrow">' + esc(owner.name) + '</span><h2 class="lp-screen-title">' + esc(clip.title) + '</h2></div>';
    }
    const controls = '<div class="lp-controls">' +
      (canEmbed ? '<button type="button" class="lp-btn is-primary" data-lp="play">' + (state.playing ? '■ DETENER' : '▶ VER MOMENTO') + '</button>' : '') +
      '<a class="lp-btn" href="' + esc(safeUrl(clip.url) || ('https://clips.twitch.tv/' + encodeURIComponent(clip.id))) + '" target="_blank" rel="noopener">ABRIR EN TWITCH ↗</a>' +
      '<button type="button" class="lp-btn is-ghost" data-lp="prev">← Anterior</button><button type="button" class="lp-btn is-ghost" data-lp="next">Siguiente →</button></div>';
    const note = canEmbed
      ? 'El clip se reproduce acá. El título es el que le puso quien lo creó, tal cual.'
      : 'El reproductor integrado necesita el sitio publicado; abrí el clip en Twitch.';
    return '<div class="lp-screen">' + screen + '</div>' + controls + '<p class="lp-note">' + esc(note) + '</p>';
  }

  function queueList(model) {
    const live = model.liveList.length > 0;
    const title = live ? 'MIENTRAS TANTO' : 'A CONTINUACIÓN';
    const count = model.pool.length + (model.pool.length === 1 ? ' momento' : ' momentos');
    const items = model.pool.map((item) => {
      const selected = (!live || state.showingClip) && model.current && item.clip.id === model.current.clip.id;
      const meta = [esc(item.owner.name), fmtDuration(item.clip.duration), fmtDate(item.clip.created_at)].filter(Boolean).join(' · ');
      return '<li><button type="button" class="lp-q' + (selected ? ' is-current' : '') + '" data-lp="clip" data-id="' + esc(item.clip.id) + '"' + (selected ? ' aria-current="true"' : '') + '>' +
        thumb(item.clip.thumbnail_url, item.owner.img, 'lp-q-img') +
        '<span class="lp-q-text"><span class="lp-q-title">' + esc(item.clip.title) + '</span><span class="lp-q-meta">' + meta + '</span></span></button></li>';
    }).join('');
    return '<aside class="lp-queue"><div class="lp-queue-head"><h3>' + title + '</h3><span>' + esc(count) + '</span></div>' +
      (items ? '<ul class="lp-queue-list">' + items + '</ul>' : '<p class="lp-note">Este canal todavía no tiene clips públicos.</p>') + '</aside>';
  }

  function channelChips(model) {
    const all = '<button type="button" class="lp-chip is-all' + (state.who === 'todos' ? ' is-on' : '') + '" data-lp="who" data-id="todos" aria-pressed="' + (state.who === 'todos') + '"><span class="lp-chip-all">TODOS</span><span class="lp-chip-sub">' + model.people.length + ' canales</span></button>';
    const chips = model.people.map((person) => {
      const sub = person.isLive ? 'EN VIVO AHORA' : (person.clips.length ? person.clips.length + (person.clips.length === 1 ? ' momento' : ' momentos') : (person.hasTwitch ? 'Sin clips todavía' : 'En YouTube'));
      const on = state.who === person.id;
      return '<button type="button" class="lp-chip' + (on ? ' is-on' : '') + (person.isLive ? ' is-live' : '') + '" data-lp="who" data-id="' + esc(person.id) + '" aria-pressed="' + on + '">' +
        '<span class="lp-chip-photo">' + thumb(person.img, person.img, 'lp-chip-img') + (person.isLive ? '<span class="lp-chip-dot lp-pulse"></span>' : '') + '</span>' +
        '<span class="lp-chip-text"><span class="lp-chip-name">' + esc(person.name) + '</span><span class="lp-chip-sub">' + esc(sub) + '</span></span></button>';
    }).join('');
    return '<section class="lp-section" aria-label="Elegí un canal"><div class="lp-section-head"><h2>ELEGÍ UN CANAL</h2><span>Filtrá la programación por persona</span></div><div class="lp-chips">' + all + chips + '</div></section>';
  }

  function rails(model) {
    let out = '';
    if (model.expedientes.length) {
      out += '<div class="lp-rail"><div class="lp-section-head is-stack"><h2>BARFENDER · LOS POV</h2><p>Una misma noche vista desde distintos canales. Elegí desde dónde mirarla.</p></div><div class="lp-cards">' +
        model.expedientes.map(({ person, entry }) => {
          const url = safeUrl(entry.url);
          const date = entry.date ? fmtDate(entry.date + 'T12:00:00') : '';
          const tag = esc(String(entry.title || '').toUpperCase()) + (date ? ' · ' + date : '');
          const inner = thumb(person.img, person.img, 'lp-card-img') + '<span class="lp-card-text"><span class="lp-card-tag">' + tag + '</span><span class="lp-card-title">' + esc(person.name) + '</span><span class="lp-card-note">' + (url ? 'VOD del canal con el recorrido de la noche.' : 'VOD público por sumar.') + '</span></span><span class="lp-card-cta">' + (url ? 'VER VOD ↗' : 'PRÓXIMAMENTE') + '</span>';
          return url ? '<button type="button" class="lp-card" data-lp="vod" data-url="' + esc(url) + '" data-title="' + esc(entry.title || person.name) + '" data-owner="' + esc(person.name) + '">' + inner + '</button>' : '<div class="lp-card is-pending">' + inner + '</div>'; 
        }).join('') + '</div></div>';
    }
    if (model.youtube.length) {
      out += model.youtube.map(({ person, channelUrl, videos }) => '<div class="lp-rail is-side"><div class="lp-section-head is-stack"><h2>EN YOUTUBE · ' + esc(String(person.name).toUpperCase()) + '</h2><p>Este canal vive en YouTube.' + (channelUrl ? ' <a href="' + esc(channelUrl) + '" target="_blank" rel="noopener">Ver canal ↗</a>' : '') + '</p></div><div class="lp-cards">' +
        videos.map((video) => {
          const published = video.published_at ? new Date(video.published_at) : null;
          const when = published && !Number.isNaN(published.getTime()) ? published.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : '';
          const meta = [when, viewsLabel(video.views)].filter(Boolean).join(' · ');
          return '<button type="button" class="lp-card is-dark" data-lp="youtube" data-url="' + esc(safeUrl(video.url)) + '" data-title="' + esc(video.title) + '" data-owner="' + esc(person.name) + '">' + thumb(person.img, person.img, 'lp-card-img') + '<span class="lp-card-text"><span class="lp-card-tag is-cyan">VIDEO · YOUTUBE</span><span class="lp-card-title is-plain">' + esc(video.title) + '</span><span class="lp-card-note">' + esc(meta) + '</span></span><span class="lp-card-cta">REPRODUCIR ↗</span></button>';
        }).join('') + '</div></div>').join('');
    }
    return out ? '<section class="lp-rails" aria-label="Más para ver">' + out + '</section>' : '';
  }

  function schedule(model) {
    const items = model.people.filter((person) => person.hero.schedule).map((person) =>
      '<div class="lp-when">' + thumb(person.img, person.img, 'lp-when-img') + '<span><strong>' + esc(person.name) + '</strong><span>' + esc(person.hero.schedule) + '</span></span></div>').join('');
    if (!items) return '';
    return '<section class="lp-section" aria-label="Cuándo vuelven"><div class="lp-section-head is-stack"><h2>CUÁNDO VUELVEN</h2><p>Horarios declarados por cada creador. Pueden cambiar.</p></div><div class="lp-whens">' + items + '</div></section>';
  }

  function videoId(url) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.endsWith('youtu.be')) return parsed.pathname.split('/').filter(Boolean)[0] || '';
      if (parsed.hostname.includes('youtube.com')) return parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop() || '';
    } catch (_) {}
    return '';
  }

  function vodId(url) {
    const match = String(url || '').match(/(?:videos\/(?:embed\?video=)?|video=)(v?\d+)/i);
    return match ? match[1].replace(/^v/i, '') : '';
  }

  function archiveStage() {
    const item = state.archive;
    if (!item) return '';
    const parent = parentHost();
    let src = '';
    if (item.type === 'youtube' && item.id) src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(item.id) + '?autoplay=1&rel=0';
    if (item.type === 'vod' && item.id && parent) src = 'https://player.twitch.tv/?video=v' + encodeURIComponent(item.id) + '&parent=' + encodeURIComponent(parent) + '&autoplay=true';
    const playable = Boolean(src);
    const screen = state.playing && playable
      ? '<iframe class="lp-embed" src="' + esc(src) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="' + esc(item.title) + '"></iframe>'
      : '<div class="lp-screen-shade"></div><div class="lp-screen-bottom"><span class="lp-eyebrow">' + esc(item.owner) + '</span><h2 class="lp-screen-title">' + esc(item.title) + '</h2></div>';
    return '<div class="lp-screen">' + screen + '</div><div class="lp-controls">' +
      (playable ? '<button type="button" class="lp-btn is-primary" data-lp="play">' + (state.playing ? '■ DETENER' : '▶ REPRODUCIR ACÁ') + '</button>' : '') +
      '<a class="lp-btn" href="' + esc(item.url) + '" target="_blank" rel="noopener">ABRIR EN ' + (item.type === 'youtube' ? 'YOUTUBE' : 'TWITCH') + ' ↗</a>' +
      '<button type="button" class="lp-btn is-ghost" data-lp="archive-back">VOLVER A LA PROGRAMACIÓN</button></div>' +
      '<p class="lp-note">Reproducción integrada bajo acción explícita; si el proveedor bloquea el iframe, usá el enlace externo.</p>';
  }

  function paint() {
    if (!host || !lastCtx) return;
    const model = buildModel(lastCtx);
    const stage = state.archive ? archiveStage() : (model.liveList.length && !state.showingClip ? liveStage(model) : clipStage(model));
    host.innerHTML =
      statusBanner(lastCtx, model) +
      '<section class="lp-stage" aria-label="Pantalla principal"><div class="lp-stage-main">' + stage + '</div>' + queueList(model) + '</section>' +
      channelChips(model) + rails(model) + schedule(model) +
      '<footer class="lp-footer"><div><strong>¿TE ENGANCHASTE CON ALGUIEN?</strong><span>Seguilo en su canal: cada creador tiene su propio ritmo, y entre todos hacemos que siempre haya algo para mirar.</span></div><button type="button" class="lp-btn is-primary" data-lp="roster">VER EL ROSTER →</button></footer>';
  }

  function step(delta) {
    const model = buildModel(lastCtx);
    if (!model.pool.length || !model.current) return;
    const index = model.pool.findIndex((item) => item.clip.id === model.current.clip.id);
    const next = model.pool[(index + delta + model.pool.length) % model.pool.length];
    state.clipId = next.clip.id;
    state.playing = false;
    paint();
  }

  function onClick(event) {
    const target = event.target.closest('[data-lp]');
    if (!target || !host.contains(target)) return;
    const action = target.dataset.lp;
    if (action === 'play') { state.playing = !state.playing; paint(); }
    else if (action === 'prev') step(-1);
    else if (action === 'next') step(1);
    else if (action === 'clip') { state.clipId = target.dataset.id; state.archive = null; state.showingClip = true; state.playing = false; paint(); }
    else if (action === 'youtube' || action === 'vod') {
      const url = safeUrl(target.dataset.url);
      const id = action === 'youtube' ? videoId(url) : vodId(url);
      state.archive = { type: action, id, url, title: target.dataset.title || '', owner: target.dataset.owner || '' };
      state.showingClip = false;
      state.playing = false;
      paint();
    }
    else if (action === 'archive-back') { state.archive = null; state.showingClip = false; state.playing = false; paint(); }
    else if (action === 'who') {
      state.archive = null;
      state.showingClip = false;
      const id = target.dataset.id;
      const model = buildModel(lastCtx);
      const person = model.byId[id];
      state.who = state.who === id ? 'todos' : id;
      state.clipId = null;
      state.playing = false;
      if (person && person.isLive) state.watching = person.login;
      paint();
    } else if (action === 'roster' && lastCtx.goChapter) lastCtx.goChapter(2);
  }

  function onImageError(event) {
    const img = event.target;
    if (img && img.tagName === 'IMG' && img.dataset && img.dataset.fallback && img.getAttribute('src') !== img.dataset.fallback) {
      img.src = img.dataset.fallback;
    }
  }

  function render(target, ctx) {
    if (!target || !ctx) return;
    host = target;
    lastCtx = ctx;
    if (!bound) {
      host.addEventListener('click', onClick);
      host.addEventListener('error', onImageError, true);
      bound = true;
    }
    const model = buildModel(ctx);
    const sig = signature(ctx, model);
    // El colector se relee cada 60 s: si nada cambió, no se toca la pantalla (el reproductor sigue andando).
    if (host.dataset.lpReady === 'true' && sig === state.sig) return;
    if (state.watching && !model.liveList.some((person) => person.login === state.watching)) {
      state.watching = null;
      if (state.playing && model.liveList.length === 0) state.playing = false;
    }
    state.sig = sig;
    host.dataset.lpReady = 'true';
    paint();
  }

  window.LMLiveProgram = { render };
})();
