(function () {
  'use strict';

  const VOD_LABELS = {
    '2919716450': 'LOS MORIARTYS',
    '2919755971': 'LADY MORIARTY',
    '2919719142': 'ROD3R1K'
  };
  let assetsPromise = null;
  let assets = { clips: [], creators: [], vods: [], youtube: [] };
  let selectedClip = null;
  let selectedCreator = 'all';
  let selectedLiveLogin = null;
  let selectedQueueItem = null;

  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const safeExternalUrl = value => {
    try {
      const url = new URL(String(value || ''), window.location.href);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  };
  const twitchParent = () => window.location.hostname;
  const formatDate = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Fecha no informada' : date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  async function loadAssets() {
    if (assetsPromise) return assetsPromise;
    assetsPromise = Promise.all([
      fetch('./clips-data.json', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('clips-data.json no disponible'); return r.json(); }),
      fetch('./roster-data.json', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('roster-data.json no disponible'); return r.json(); }),
      fetch('./platform-stats.json', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('platform-stats.json no disponible'); return r.json(); })
    ]).then(([clipData, rosterData, platformData]) => {
      const creators = clipData.creators || {};
      const clipList = [];
      Object.entries(creators).forEach(([creatorId, creator]) => {
        (Array.isArray(creator.clips) ? creator.clips : []).forEach(clip => {
          clipList.push({ ...clip, creator_id: creatorId, creator_label: creator.display_name || creator.login || creatorId });
        });
      });
      clipList.sort((a, b) => Number(b.view_count || 0) - Number(a.view_count || 0));
      const roster = Array.isArray(rosterData.heroes) ? rosterData.heroes : [];
      const vods = [];
      roster.forEach(hero => (Array.isArray(hero.bitacora) ? hero.bitacora : []).forEach(entry => {
        const url = safeExternalUrl(entry.url);
        const match = url.match(/twitch\.tv\/videos\/(\d+)/i);
        if (match && /barfender/i.test((entry.title || '') + ' ' + (entry.text || ''))) {
          const id = match[1];
          if (!vods.some(item => item.video_id === id)) vods.push({
            video_id: id, url, creator: VOD_LABELS[id] || hero.display_name || hero.name || hero.id,
            date: entry.date || '', title: entry.title || 'BarFender · VOD'
          });
        }
      }));
      vods.sort((a, b) => a.video_id.localeCompare(b.video_id));
      const pato = platformData.creators?.['pato-oratoris']?.platforms?.youtube;
      const youtube = (Array.isArray(pato?.recent_videos) ? pato.recent_videos : []).map(video => ({
        ...video, url: safeExternalUrl(video.url), creator: 'PATO — ORATORIS'
      })).filter(video => video.url && video.video_id);
      assets = { clips: clipList, creators: Object.entries(creators).map(([id, creator]) => ({ id, name: creator.display_name || creator.login || id, count: (creator.clips || []).length })), vods, youtube };
      return assets;
    }).catch(error => {
      assetsPromise = null;
      throw error;
    });
    return assetsPromise;
  }

  function clipEmbedUrl(clip) {
    return 'https://clips.twitch.tv/embed?clip=' + encodeURIComponent(clip.id) +
      '&parent=' + encodeURIComponent(twitchParent()) + '&autoplay=false';
  }
  function twitchVodEmbedUrl(videoId) {
    return 'https://player.twitch.tv/?video=' + encodeURIComponent(videoId) +
      '&parent=' + encodeURIComponent(twitchParent()) + '&autoplay=false&muted=true';
  }
  function youtubeEmbedUrl(videoId) {
    return 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(videoId) + '?autoplay=0&rel=0';
  }

  function renderMediaStage(item, mode) {
    const host = document.getElementById('live-program-stage');
    if (!host || !item) return;
    selectedQueueItem = { item, mode };
    const title = item.title || item.name || 'Contenido de la Legión';
    const subtitle = mode === 'live'
      ? (Number.isFinite(Number(item.current_viewers)) ? Number(item.current_viewers).toLocaleString('es-AR') + ' espectadores' : 'Espectadores no disponibles')
      : mode === 'clip' ? (item.creator_label + ' · ' + formatDate(item.created_at))
      : mode === 'vod' ? (item.creator + ' · ' + formatDate(item.date))
      : (item.creator + ' · ' + formatDate(item.published_at));
    const external = mode === 'live'
      ? 'https://www.twitch.tv/' + encodeURIComponent(item.login)
      : safeExternalUrl(item.url) || (mode === 'youtube' ? 'https://www.youtube.com/watch?v=' + encodeURIComponent(item.video_id) : '');
    const thumb = safeExternalUrl(item.thumbnail_url);
    const label = mode === 'live' ? 'VER DIRECTO EN ESTA PÁGINA' : 'REPRODUCIR EN ESTA PÁGINA';
    host.innerHTML = '<div class="live-program-stage-media">' +
      (thumb ? '<img src="' + escapeHtml(thumb) + '" alt="" loading="lazy">' : '<div class="live-program-stage-art" aria-hidden="true"><span>LM</span><b>PROGRAMACIÓN<br>DE LA LEGIÓN</b></div>') +
      '<button type="button" class="live-program-play" data-live-play="' + escapeHtml(mode) + '" aria-label="' + escapeHtml(label) + '"><span aria-hidden="true">▶</span>' + escapeHtml(label) + '</button>' +
      '</div><div class="live-program-stage-copy"><div class="live-program-stage-meta"><span>' + (mode === 'live' ? '<i class="live-pulse"></i> EN DIRECTO' : escapeHtml(mode === 'clip' ? 'CLIP DESTACADO' : mode === 'vod' ? 'BARFENDER · VOD' : 'YOUTUBE · PATO')) + '</span><small>' + escapeHtml(subtitle) + '</small></div><h3>' + escapeHtml(title) + '</h3><div class="live-program-stage-actions"><a href="' + escapeHtml(external) + '" target="_blank" rel="noopener noreferrer">ABRIR EN ' + (mode === 'youtube' ? 'YOUTUBE' : 'TWITCH') + ' ↗</a></div></div>';
    host.querySelector('[data-live-play]')?.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.title = title;
      frame.allow = 'autoplay; fullscreen; picture-in-picture';
      frame.allowFullscreen = true;
      frame.loading = 'lazy';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.src = mode === 'live' ? 'https://player.twitch.tv/?channel=' + encodeURIComponent(item.login) + '&parent=' + encodeURIComponent(twitchParent()) + '&autoplay=false&muted=true'
        : mode === 'clip' ? clipEmbedUrl(item)
        : mode === 'vod' ? twitchVodEmbedUrl(item.video_id)
        : youtubeEmbedUrl(item.video_id);
      const media = host.querySelector('.live-program-stage-media');
      media.replaceChildren(frame);
      const fallback = document.createElement('a');
      fallback.href = external;
      fallback.target = '_blank';
      fallback.rel = 'noopener noreferrer';
      fallback.className = 'live-program-embed-fallback';
      fallback.textContent = '¿No se reproduce? Abrir en ' + (mode === 'youtube' ? 'YouTube' : 'Twitch') + ' ↗';
      media.appendChild(fallback);
    });
  }

  function renderClipQueue() {
    const queue = document.getElementById('live-program-queue');
    if (!queue) return;
    const filtered = assets.clips.filter(clip => selectedCreator === 'all' || clip.creator_id === selectedCreator);
    const visible = filtered.slice(0, 8);
    if (!visible.length) {
      queue.innerHTML = '<p class="live-program-empty">Todavía no hay clips registrados para este canal.</p>';
      return;
    }
    queue.innerHTML = visible.map((clip, index) =>
      '<button type="button" class="live-program-queue-item ' + (selectedClip?.id === clip.id ? 'is-selected' : '') + '" data-clip-index="' + index + '">' +
      '<span class="live-program-queue-thumb">' + (safeExternalUrl(clip.thumbnail_url) ? '<img src="' + escapeHtml(clip.thumbnail_url) + '" alt="" loading="lazy">' : '<b>▶</b>') + '</span>' +
      '<span class="live-program-queue-copy"><strong>' + escapeHtml(clip.title) + '</strong><small>' + escapeHtml(clip.creator_label) + ' · ' + Number(clip.view_count || 0).toLocaleString('es-AR') + ' vistas</small></span></button>'
    ).join('');
    queue.querySelectorAll('[data-clip-index]').forEach(button => button.addEventListener('click', () => {
      const clip = visible[Number(button.dataset.clipIndex)];
      selectedClip = clip;
      renderClipQueue();
      renderMediaStage(clip, 'clip');
    }));
  }

  function renderOfflineProgram(channels, fresh, updatedLabel, interval) {
    const host = document.getElementById('live-directory');
    const liveCount = 0;
    const featured = assets.clips[0];
    const creators = assets.creators.map(creator => '<option value="' + escapeHtml(creator.id) + '">' + escapeHtml(creator.name) + ' (' + creator.count + ')</option>').join('');
    const vodCards = assets.vods.map((vod, index) => '<button type="button" class="live-program-content-card" data-vod-index="' + index + '"><span class="live-program-card-art live-program-card-vod">BARFENDER</span><strong>' + escapeHtml(vod.creator) + '</strong><small>' + escapeHtml(vod.title) + ' · ' + formatDate(vod.date) + '</small><em>VER VOD ↗</em></button>').join('');
    const youtubeCards = assets.youtube.map((video, index) => '<button type="button" class="live-program-content-card" data-youtube-index="' + index + '"><span class="live-program-card-art live-program-card-youtube">ORATORIS</span><strong>' + escapeHtml(video.title) + '</strong><small>' + Number(video.views || 0).toLocaleString('es-AR') + ' vistas · ' + formatDate(video.published_at) + '</small><em>VER VIDEO ↗</em></button>').join('');
    const schedules = (window.liveProgramRoster || []).map(hero => {
      const twitch = (hero.accounts || []).find(account => account.platform === 'twitch' && account.account_type === 'creator_channel');
      const url = safeExternalUrl(twitch?.url || hero.twitch || hero.youtube);
      return '<article class="live-program-schedule-card"><span>' + escapeHtml(hero.display_name || hero.name || hero.id) + '</span><p>' + escapeHtml(hero.schedule || 'Horario no declarado') + '</p>' + (url ? '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">VISITAR CANAL ↗</a>' : '') + '</article>';
    }).join('');
    host.innerHTML = '<div class="live-program-statusline"><span class="live-program-offline-dot"></span><strong>' + (fresh ? 'AHORA MISMO · SIN DIRECTOS DETECTADOS' : 'ESTADO DE TRANSMISIONES CON DEMORA') + '</strong><small>Última captura: ' + escapeHtml(updatedLabel) + ' · frecuencia objetivo: ' + interval + ' min</small></div>' +
      '<div class="live-program-heading"><span>SEÑAL ABIERTA · LEGIÓN MULTIVERSAL</span><h3>PROGRAMACIÓN DE LA LEGIÓN</h3><p>Si hoy no hay nadie transmitiendo, siempre hay algo para descubrir. Elegí qué querés ver y reproducilo cuando estés listo.</p></div>' +
      '<div class="live-program-feature-grid"><section class="live-program-feature"><div class="live-program-section-kicker">01 / MOMENTO DESTACADO</div><div id="live-program-stage"></div></section><aside class="live-program-upnext"><div class="live-program-section-kicker">A CONTINUACIÓN</div><label for="live-program-creator">FILTRAR POR CREADOR</label><select id="live-program-creator"><option value="all">TODOS LOS CREADORES</option>' + creators + '</select><div id="live-program-queue"></div></aside></div>' +
      '<section class="live-program-library"><div class="live-program-section-heading"><span>02 / ARCHIVO COOPERATIVO</span><h3>BARFENDER · LOS POV</h3><p>Tres VOD públicos localizados. Akuma participó, pero no hay un VOD público suyo registrado.</p></div><div class="live-program-card-grid">' + (vodCards || '<p class="live-program-empty">No hay VOD públicos registrados.</p>') + '</div></section>' +
      '<section class="live-program-library"><div class="live-program-section-heading"><span>03 / CONTENIDO DE LA LEGIÓN</span><h3>PATO · ORATORIS</h3><p>Videos publicados en su canal de YouTube. Se reproducen solo cuando elegís uno.</p></div><div class="live-program-card-grid">' + (youtubeCards || '<p class="live-program-empty">No hay videos disponibles en la última captura.</p>') + '</div></section>' +
      '<section class="live-program-library"><div class="live-program-section-heading"><span>04 / AGENDA DECLARADA</span><h3>¿CUÁNDO VUELVEN?</h3><p>Horarios informados por cada creador. Son referencias declaradas, no una grilla de programación garantizada.</p></div><div class="live-program-schedule-grid">' + (schedules || '<p class="live-program-empty">No hay horarios declarados disponibles.</p>') + '</div></section>';
    if (featured) {
      selectedClip = featured;
      renderMediaStage(featured, 'clip');
    } else {
      document.getElementById('live-program-stage').innerHTML = '<p class="live-program-empty">Todavía no hay clips para destacar.</p>';
    }
    renderClipQueue();
    host.querySelector('#live-program-creator')?.addEventListener('change', event => {
      selectedCreator = event.target.value;
      const first = assets.clips.find(clip => selectedCreator === 'all' || clip.creator_id === selectedCreator);
      if (first) { selectedClip = first; renderMediaStage(first, 'clip'); }
      renderClipQueue();
    });
    host.querySelectorAll('[data-vod-index]').forEach(button => button.addEventListener('click', () => renderMediaStage(assets.vods[Number(button.dataset.vodIndex)], 'vod')));
    host.querySelectorAll('[data-youtube-index]').forEach(button => button.addEventListener('click', () => renderMediaStage(assets.youtube[Number(button.dataset.youtubeIndex)], 'youtube')));
  }

  function renderLiveProgram(channels) {
    const host = document.getElementById('live-directory');
    if (!host) return;
    const data = window.instituteStatsData || {};
    const updated = data.updated_at ? new Date(data.updated_at) : null;
    const interval = Number(data.sampling_interval_minutes) || 55;
    const age = updated ? (Date.now() - updated.getTime()) / 60000 : Infinity;
    const fresh = Boolean(updated && !Number.isNaN(updated.getTime()) && age >= -5 && age <= Math.max(interval * 2.5, 120));
    const updatedLabel = updated && !Number.isNaN(updated.getTime()) ? updated.toLocaleString('es-AR') : 'fecha no disponible';
    const live = fresh ? (channels || []).filter(channel => channel.live) : [];
    const stale = !fresh && (channels || []).some(channel => channel.live);
    if (!live.length) {
      loadAssets().then(() => {
        const rosterRequest = fetch('./roster-data.json', { cache: 'no-store' }).then(response => response.json());
        return rosterRequest.then(roster => { window.liveProgramRoster = roster.heroes || []; renderOfflineProgram(channels || [], fresh, updatedLabel, interval); });
      }).catch(error => {
        host.innerHTML = '<div class="live-program-heading"><span>SEÑAL ABIERTA · LEGIÓN MULTIVERSAL</span><h3>PROGRAMACIÓN DE LA LEGIÓN</h3><p>El archivo de contenidos no está disponible temporalmente.</p></div><p class="live-program-empty">' + escapeHtml(error.message) + '</p>';
      });
      if (stale) host.setAttribute('data-stale-live', 'true'); else host.removeAttribute('data-stale-live');
      return;
    }
    const roster = window.heroesData || [];
    const updatedNote = 'Última captura: ' + updatedLabel + ' · frecuencia objetivo: ' + interval + ' min. No es una conexión en tiempo real.';
    host.innerHTML = '<div class="live-program-statusline is-live"><span class="live-pulse"></span><strong>' + live.length + (live.length === 1 ? ' INTEGRANTE EN DIRECTO' : ' INTEGRANTES EN DIRECTO') + '</strong><small>' + escapeHtml(updatedNote) + '</small></div>' +
      '<div class="live-program-heading"><span>SEÑAL ABIERTA · LEGIÓN MULTIVERSAL</span><h3>ESTAMOS EN VIVO</h3><p>La pantalla principal cambia automáticamente según quién esté transmitiendo. Elegí una señal si hay más de una.</p></div>' +
      '<div class="live-program-live-layout"><section class="live-program-feature"><div id="live-program-stage"></div></section><aside class="live-program-upnext"><div class="live-program-section-kicker">SEÑALES DISPONIBLES</div>' +
      live.map((channel, index) => '<button type="button" class="live-program-live-choice ' + (index === 0 ? 'is-selected' : '') + '" data-live-index="' + index + '"><span class="live-program-live-avatar">' + escapeHtml((channel.display_name || channel.login).slice(0, 1)) + '</span><span><strong>' + escapeHtml(channel.display_name || channel.login) + '</strong><small>' + escapeHtml(channel.current_game || 'Categoría no informada') + '</small></span><b>' + (channel.current_viewers == null ? '—' : Number(channel.current_viewers).toLocaleString('es-AR')) + ' <small>VIENDO</small></b></button>').join('') +
      '</aside></div><p class="live-program-live-note">Si el reproductor no se habilita en tu navegador, podés abrir el canal directamente en Twitch.</p>';
    selectedLiveLogin = live[0].login;
    renderMediaStage(live[0], 'live');
    host.querySelectorAll('[data-live-index]').forEach(button => button.addEventListener('click', () => {
      const channel = live[Number(button.dataset.liveIndex)];
      selectedLiveLogin = channel.login;
      host.querySelectorAll('[data-live-index]').forEach(node => node.classList.toggle('is-selected', node === button));
      renderMediaStage(channel, 'live');
    }));
  }

  window.renderLiveDirectory = renderLiveProgram;
  window.liveProgramSelectClip = function (clipId) {
    const clip = assets.clips.find(item => item.id === clipId);
    if (clip) renderMediaStage(clip, 'clip');
  };
})();