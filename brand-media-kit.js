(() => {
  const host = document.getElementById("creator-media-kit");
  if (!host) return;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const number = (value) => value === null || value === undefined || value === ""
    ? "Sin datos"
    : Number(value).toLocaleString("es-AR", { maximumFractionDigits: 1 });
  const date = (value) => {
    if (!value) return "Período no informado";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? escapeHtml(value)
      : parsed.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
  };
  const metric = (metrics, key) => (metrics || []).find((item) => item.key === key) || null;
  const makeMetric = (label, value, note = "") => (
    '<div class="channel-kit-metric"><span>' + escapeHtml(label) + '</span><strong>' +
    escapeHtml(value) + '</strong>' + (note ? '<small>' + escapeHtml(note) + '</small>' : '') + '</div>'
  );

  Promise.all([
    fetch("../creator-metrics.json", { cache: "no-store" }).then((response) => {
      if (!response.ok) throw new Error("creator-metrics");
      return response.json();
    }),
    fetch("../platform-stats.json", { cache: "no-store" }).then((response) => {
      if (!response.ok) throw new Error("platform-stats");
      return response.json();
    }),
    fetch("../data.json", { cache: "no-store" }).then((response) => {
      if (!response.ok) throw new Error("activity");
      return response.json();
    }),
    fetch("../data/roster.json", { cache: "no-store" }).then((response) => {
      if (!response.ok) throw new Error("roster");
      return response.json();
    })
  ]).then(([creatorData, platformData, activityData, rosterData]) => {
    const updateTimes = [creatorData.generated_at, platformData.updated_at, activityData.updated_at]
      .map((value) => Date.parse(value || ""))
      .filter((value) => Number.isFinite(value));
    const latestUpdate = updateTimes.length ? new Date(Math.max(...updateTimes)) : null;
    const updatedLabel = document.getElementById("brand-updated-at");
    if (updatedLabel) {
      updatedLabel.textContent = latestUpdate
        ? "Ficha institucional · Última captura de datos " + latestUpdate.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })
        : "Ficha institucional · Datos de fuentes públicas";
    }
    const cards = [];
    Object.entries(creatorData.creators || {}).forEach(([id, creator]) => {
      const canonicalName = rosterData.name_registry?.[id]?.display_name || creator.display_name;
      (creator.accounts || []).forEach((account) => {
        if (account.platform === "twitch") {
          const metrics = creator.metrics || [];
          const avg = metric(metrics, "average_viewers_sampled");
          const peak = metric(metrics, "peak_viewers_sampled");
          const streams = metric(metrics, "streams_observed");
          const followers = metric(metrics, "followers_total");
          const period = avg?.period || peak?.period || streams?.period || {};
          const captured = avg?.captured_at || peak?.captured_at || creatorData.generated_at;
          const source = avg?.source || peak?.source || "Twitch Helix Public API";
          const login = String(account.handle || "").toLowerCase();
          const daily = activityData.channels?.[login]?.window?.daily_activity || [];
          const recentDaily = daily.slice(-10);
          const dailyMax = Math.max(1, ...recentDaily.map((item) => Number(item.average_viewers_sampled) || 0));
          const liveSamples = recentDaily.reduce((sum, item) => sum + (Number(item.live_samples) || 0), 0);
          const gameBreakdown = activityData.channels?.[login]?.window?.game_breakdown || [];
          const primaryCategory = gameBreakdown.slice().sort((a, b) =>
            (Number(b.live_samples) || 0) - (Number(a.live_samples) || 0)
          )[0];
          const categoryMetric = makeMetric(
            "Categoría principal (10 días)",
            primaryCategory?.name || "Sin datos",
            primaryCategory ? number(primaryCategory.live_samples) + " muestras en directo" : "Sin categoría verificable"
          );
          const chatContextMetric = login === "losmoriartys"
            ? makeMetric("Actividad de chat · BarFender", "91 / 80", "Usuarios activos en chat / espectadores únicos · VOD completo")
            : "";

          const sparkline = recentDaily.length
            ? '<div class="channel-kit-sparkline" role="img" aria-label="Promedio diario de espectadores observado durante ' + recentDaily.length + ' días registrados">' +
              recentDaily.map((item) => {
                const value = Number(item.average_viewers_sampled) || 0;
                const height = Math.max(4, Math.min(100, value / dailyMax * 100));
                return '<span title="' + escapeHtml(date(item.date)) + ': ' + escapeHtml(number(value)) + ' promedio observado" style="height:' + height.toFixed(1) + '%"></span>';
              }).join("") + '</div><p class="channel-kit-sparkline-label">Promedio diario observado · ' + recentDaily.length + ' días con registro · ' + number(liveSamples) + ' muestras en directo.</p>'
            : '<p class="channel-kit-sparkline-label">Serie diaria: sin datos disponibles en esta captura.</p>';
          const usable = [avg, peak, streams].some((item) => item && item.value !== null && item.status !== "unavailable");
          if (!usable) return;
          cards.push(
            '<article class="channel-kit-card"><header><span>TWITCH · CANAL INDIVIDUAL</span><h3>' +
            escapeHtml(canonicalName) + '</h3><a href="' + escapeHtml(account.url) +
            '" target="_blank" rel="noopener noreferrer">@' + escapeHtml(account.handle) + ' ↗</a></header><div class="channel-kit-grid">' +
            makeMetric("Seguidores", number(followers?.value)) +
            makeMetric("Promedio observado", number(avg?.value), "Muestras públicas") +
            makeMetric("Pico observado", number(peak?.value), "Muestras públicas") +
            makeMetric("Directos detectados", number(streams?.value), "En la ventana observada") +
            categoryMetric + chatContextMetric +
            '</div>' + sparkline + '<p class="channel-kit-meta">Fuente: ' + escapeHtml(source) + ' · Período: ' +
            escapeHtml(date(period.from)) + ' – ' + escapeHtml(date(period.to)) + ' · Captura: ' +
            escapeHtml(date(captured)) + '</p><p class="channel-kit-meta">La categoría principal se ordena por muestras en directo dentro de la ventana disponible. La actividad de chat solo se publica cuando existe un registro de evento/VOD con su alcance identificado; no se extrapola a otros canales.</p><p class="channel-kit-meta">País e idioma de la audiencia: sin datos propios verificables.</p><p class="channel-kit-dossier-link"><a href="../#roster/' + encodeURIComponent(id) + '">ABRIR EXPEDIENTE INDIVIDUAL / IMPRIMIR PDF ↗</a></p></article>'
          );
        }

        if (account.platform === "youtube") {
          const record = platformData.creators?.[id]?.platforms?.youtube;
          if (!record || record.status !== "verified") return;
          const m = record.metrics || {};
          cards.push(
            '<article class="channel-kit-card"><header><span>YOUTUBE · CANAL INDIVIDUAL</span><h3>' +
            escapeHtml(canonicalName) + '</h3><a href="' + escapeHtml(account.url) +
            '" target="_blank" rel="noopener noreferrer">' + escapeHtml(account.handle) + ' ↗</a></header><div class="channel-kit-grid">' +
            makeMetric("Suscriptores", number(m.subscribers), "El contador puede estar redondeado") +
            makeMetric("Visualizaciones", number(m.total_views), "Acumuladas") +
            makeMetric("Videos", number(m.videos_total), "Publicados") +
            '</div><p class="channel-kit-meta">Fuente: ' + escapeHtml(record.source || "YouTube Data API v3") +
            ' · Captura: ' + escapeHtml(date(platformData.updated_at)) + '</p><p class="channel-kit-meta">País e idioma de la audiencia: sin datos propios verificables.</p><p class="channel-kit-dossier-link"><a href="../#roster/' + encodeURIComponent(id) + '">ABRIR EXPEDIENTE INDIVIDUAL / IMPRIMIR PDF ↗</a></p></article>'
          );
        }
      });
    });

    if (!cards.length) throw new Error("empty");
    host.innerHTML = '<div class="channel-kit-grid-list">' + cards.join("") + '</div><p class="channel-kit-disclaimer">Los datos se presentan por canal y plataforma, sin sumar audiencias. En Twitch, promedio y pico son observaciones por muestreo; no equivalen a analítica oficial ni a espectadores únicos. “Sin datos” significa que la fuente pública no entrega esa métrica.</p><p class="channel-kit-updated">Registro normalizado generado: ' +
      escapeHtml(date(creatorData.generated_at)) + '.</p>';
  }).catch(() => {
    host.innerHTML = '<p class="subpage-note" role="status">Las fichas de canal no están disponibles en este momento. No se reemplazan datos ausentes por cero.</p>';
  });

  const mediaPage = document.querySelector("body.media-kit");
  if (mediaPage) {
    const mediaStyle = document.createElement("style");
    mediaStyle.id = "media-kit-enhancement-styles";
    mediaStyle.textContent = [
      ".media-kit .brand-nav-cta{padding:9px 13px;border:1px solid #d5b56e;background:linear-gradient(135deg,#f5dfaa,#d5ae61);color:#172033!important;font-weight:900;text-decoration:none}",
      ".media-kit .media-data-strip{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:18px 0 22px}",
      ".media-kit .media-data-cell{min-width:0;padding:13px;border:1px solid var(--line);border-top:3px solid var(--gold);background:linear-gradient(145deg,var(--panel2),var(--panel))}",
      ".media-kit .media-data-cell strong{display:block;color:var(--gold);font-size:1.55rem;line-height:1.1}",
      ".media-kit .media-data-cell span{display:block;margin-top:4px;color:var(--muted);font-size:.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase}",
      ".media-kit .media-data-updated{grid-column:1/-1;color:var(--muted);font-size:.78rem}",
      ".media-kit .subpage-actions{flex-wrap:wrap}",
      ".media-kit .language-toggle{min-width:76px;border:1px solid var(--line);background:transparent;color:var(--ink);padding:10px 14px;font-weight:900;cursor:pointer}",
      ".media-kit .channel-kit-section{display:block!important}",
      "@media(max-width:760px){.media-kit .media-data-strip{grid-template-columns:repeat(2,minmax(0,1fr))}}",
      "@media print{.media-kit .subpage-top,.media-kit .subpage-actions,.media-kit .brand-nav-cta{display:none!important}.media-kit .channel-kit-section{display:block!important}.media-kit .channel-kit-grid-list{grid-template-columns:repeat(2,minmax(0,1fr))}.media-kit .channel-kit-card{break-inside:avoid}}"
    ].join("");
    document.head.appendChild(mediaStyle);

    const nav = document.querySelector(".media-kit .subpage-nav");
    if (nav && !nav.querySelector(".brand-nav-cta")) {
      const contact = document.createElement("a");
      contact.className = "brand-nav-cta";
      contact.href = "mailto:losmoriartys@gmail.com?subject=Propuesta%20comercial%20%7C%20Legi%C3%B3n%20Multiversal";
      contact.textContent = "CONTACTO COMERCIAL";
      nav.appendChild(contact);
    }

    const actions = document.querySelector(".media-kit .subpage-actions");
    const printButton = actions && actions.querySelector("button");
    if (printButton) {
      printButton.textContent = "GUARDAR / IMPRIMIR PDF";
      printButton.setAttribute("aria-label", "Abrir impresión para guardar la ficha institucional en PDF");
    }

    let english = false;
    const translations = new Map([
      ["Ficha institucional · Datos de fuentes públicas","Institutional media kit · Public-source data"],
      ["Diferentes mundos.","Different worlds."],["Una misma Legión.","One Legion."],
      ["Una comunidad de creadores con perfiles, canales y comunidades propias. Diseñamos experiencias individuales, cooperativas y multiplataforma con alcance, participantes y entregables acordados antes de cada acción.","An independent creator collective with distinct profiles, channels and communities. We design individual, co-op and cross-platform experiences with scope, participants and deliverables agreed before each activation."],
      ["GUARDAR / IMPRIMIR PDF","SAVE / PRINT PDF"],["CONTACTO COMERCIAL","COMMERCIAL CONTACT"],
      ["PERFILES DEL ROSTER","ROSTER PROFILES"],
      ["Seis perfiles integrantes y dos perfiles colaboradores. El canal Los Moriartys representa el proyecto compartido de Demian y Ari; no se cuenta como dos canales separados.","Eight public profiles. Los Moriartys represents the shared project of Demian and Ari; it is counted as one profile and one channel."],
      ["CANALES CON FUENTE PÚBLICA","CHANNELS WITH PUBLIC DATA"],
      ["Siete canales de Twitch en seguimiento y un canal de YouTube con datos públicos de Pato Oratoris (@patoteexplica). Las audiencias de plataformas distintas no se suman.","Seven Twitch channels are tracked alongside one YouTube channel with public data for Pato Oratoris (@patoteexplica). Audiences from different platforms are never added together."],
      ["CREDENCIALES","CREDENTIALS"],["Twitch Partner:","Twitch Partner:"],
      ["TheR0d3R1K, reconocimiento individual de su canal.","TheR0d3R1K, an individual channel credential."],
      ["Lurkit Partner Creator:","Lurkit Partner Creator:"],
      ["Los Moriartys, asociado a Cinderia y Enshrouded.","Los Moriartys, associated with Cinderia and Enshrouded."],
      ["Lurkit:","Lurkit:"],["ocho campañas completadas documentadas en el archivo del proyecto.","Eight completed campaigns documented in the project archive."],
      ["EXPERIENCIA DOCUMENTADA · 001","DOCUMENTED EXPERIENCE · 001"],["BarFender:","BarFender:"],
      ["una sesión colaborativa con cuatro creadores y cuatro canales. Se conserva como experiencia documentada, no como patrocinio ni campaña remunerada. Los resultados se presentan solo con su fuente y alcance.","A co-op session featuring four creators and four channels. It is presented as a documented experience, not as a sponsorship or paid campaign. Results are shown only with their source and scope."],
      ["FORMATOS POSIBLES","POTENTIAL FORMATS"],["Individual:","Individual:"],
      ["integración o presentación desde un canal.","integration or feature on one channel."],["Cooperativo:","Co-op:"],
      ["partida, desafío o evento entre creadores.","a game session, challenge or event with multiple creators."],
      ["Multiplataforma:","Cross-platform:"],["piezas coordinadas en canales y formatos compatibles.","coordinated content across compatible channels and formats."],
      ["Las propuestas se definen según el juego, los creadores participantes, los objetivos y los recursos acordados.","Proposals are scoped around the game, participating creators, objectives and agreed resources."],
      ["TRANSPARENCIA","TRANSPARENCY"],
      ["No sumamos audiencias de plataformas distintas ni prometemos ventas, conversiones o ROI que no podamos demostrar. Los promedios y picos de Twitch pueden ser observaciones por muestreo, no analítica oficial. Las credenciales individuales no se atribuyen a toda la Legión.","We do not add audiences across platforms or promise sales, conversions or ROI that cannot be demonstrated. Twitch averages and peaks may be sampled observations, not official analytics. Individual credentials are not attributed to the entire Legion."],
      ["Consultar metodología y fuentes ↗","View methodology and sources ↗"],
      ["FICHAS BREVES POR CANAL","CHANNEL SNAPSHOTS"],
      ["Una lectura rápida de cada canal con la última captura pública disponible. Los valores ausentes se identifican como tales y las plataformas se mantienen separadas. Cada ficha enlaza al expediente individual, desde donde se puede imprimir o guardar su PDF.","A concise view of each channel using the latest available public capture. Missing values are labeled as such and platforms remain separate. Each snapshot links to the individual dossier, which can also be printed or saved as a PDF."],
      ["Cargando fichas de canal desde el registro de métricas…","Loading channel snapshots from the metrics registry…"],
      ["Volver al sitio","Back to the website"],["Estadísticas","Statistics"],["Metodología","Methodology"],
      ["TWITCH · CANAL INDIVIDUAL","TWITCH · INDIVIDUAL CHANNEL"],["YOUTUBE · CANAL INDIVIDUAL","YOUTUBE · INDIVIDUAL CHANNEL"],
      ["Seguidores","Followers"],["Promedio observado","Observed average"],["Pico observado","Observed peak"],
      ["Directos detectados","Streams detected"],["Muestras públicas","Public samples"],["Suscriptores","Subscribers"],
      ["El contador puede estar redondeado","The counter may be rounded"],["Visualizaciones","Views"],["Acumuladas","Total"],
      ["Videos","Videos"],["Publicados","Published"],["Sin datos","No data"],["Período no informado","Period not specified"],
      ["Categoría principal (10 días)","Top category (10 days)"],["muestras en directo","live samples"],
      ["Sin categoría verificable","No verified category"],["Actividad de chat · BarFender","Chat activity · BarFender"],
      ["Usuarios activos en chat / espectadores únicos · VOD completo","Active chat users / unique viewers · full VOD"],
      ["ABRIR EXPEDIENTE INDIVIDUAL / IMPRIMIR PDF ↗","OPEN INDIVIDUAL DOSSIER / PRINT PDF ↗"],
      ["País e idioma de la audiencia: sin datos propios verificables.","Audience country and language: no independently verified data."],
      ["La categoría principal se ordena por muestras en directo dentro de la ventana disponible. La actividad de chat solo se publica cuando existe un registro de evento/VOD con su alcance identificado; no se extrapola a otros canales.","Top category is ranked by live samples within the available window. Chat activity is shown only when an event/VOD record with a defined scope exists; it is not extrapolated to other channels."],
      ["Los datos se presentan por canal y plataforma, sin sumar audiencias. En Twitch, promedio y pico son observaciones por muestreo; no equivalen a analítica oficial ni a espectadores únicos. “Sin datos” significa que la fuente pública no entrega esa métrica.","Data is presented per channel and platform, without adding audiences together. Twitch averages and peaks are sampled observations; they are not official analytics or unique viewers. “No data” means the public source does not provide that metric."],
      ["Registro normalizado generado: ","Normalized registry generated: "],
      ["Las fichas de canal no están disponibles en este momento. No se reemplazan datos ausentes por cero.","Channel snapshots are currently unavailable. Missing data is not replaced with zero."]
    ]);

    const applyLanguage = () => {
      const root = document.querySelector(".media-kit .subpage-shell");
      if (!root) return;
      const reverse = new Map(Array.from(translations.entries()).map(([es,en]) => [en,es]));
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      textNodes.forEach((node) => {
        const trimmed = node.nodeValue.trim();
        if (!trimmed) return;
        const replacement = english ? translations.get(trimmed) : reverse.get(trimmed);
        if (replacement) node.nodeValue = node.nodeValue.replace(trimmed, replacement);
      });
      const heading = document.querySelector(".media-kit .subpage-hero h1");
      if (heading) heading.innerHTML = english ? "Different worlds.<br>One Legion." : "Diferentes mundos.<br>Una misma Legión.";
      const toggle = document.querySelector(".media-kit .language-toggle");
      if (toggle) {
        toggle.textContent = english ? "ESPAÑOL" : "ENGLISH";
        toggle.setAttribute("aria-pressed", english ? "true" : "false");
      }
      document.documentElement.lang = english ? "en" : "es";
      document.title = english ? "For brands | Legión Multiversal" : "Para marcas | Legión Multiversal";
      const description = document.querySelector('meta[name="description"]');
      if (description) description.content = english
        ? "Legión Multiversal media kit: creator profiles, credentials, potential formats and documented experiences."
        : "Ficha institucional de Legión Multiversal: perfiles, credenciales, formatos de colaboración y experiencia documentada.";
    };

    if (actions && !actions.querySelector(".language-toggle")) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "language-toggle";
      toggle.textContent = "ENGLISH";
      toggle.setAttribute("aria-label", "Switch media kit language");
      toggle.addEventListener("click", () => { english = !english; applyLanguage(); });
      actions.appendChild(toggle);
    }

    Promise.all([
      fetch("../data/roster.json",{cache:"no-store"}).then((r) => { if(!r.ok) throw new Error("roster"); return r.json(); }),
      fetch("../data/games.json",{cache:"no-store"}).then((r) => { if(!r.ok) throw new Error("games"); return r.json(); })
    ]).then(([rosterData,gamesData]) => {
      const heroes = Array.isArray(rosterData.heroes) ? rosterData.heroes : [];
      const accounts = heroes.flatMap((hero) => (hero.accounts || []).filter((account) =>
        account.account_type === "creator_channel" && account.status === "registered"));
      const twitch = new Set(accounts.filter((account) => account.platform === "twitch").map((account) => account.handle));
      const youtube = new Set(accounts.filter((account) => account.platform === "youtube").map((account) => account.handle));
      const games = Array.isArray(gamesData.juegos) ? gamesData.juegos : [];
      const sessions = games.flatMap((game) => Array.isArray(game.sesiones) ? game.sesiones : []);
      const pov = sessions.reduce((total, session) => total + (Array.isArray(session.pov) ? session.pov.length : 0), 0);
      const strip = document.createElement("section");
      strip.className = "media-data-strip";
      strip.setAttribute("aria-label","Indicadores de la Legión");
      const cells = [
        [heroes.length,"Expedientes"],[twitch.size,"Canales Twitch"],[youtube.size,"Canales YouTube"],
        [sessions.length,"Sesiones BIT"],[games.length,"Juegos catalogados"]
      ];
      strip.innerHTML = cells.map(([value,label]) =>
        '<div class="media-data-cell"><strong>' + number(value) + '</strong><span>' + escapeHtml(label) + '</span></div>'
      ).join("") + '<p class="media-data-updated">Registro maestro: ' +
        escapeHtml(date(gamesData.updated_at || rosterData.updated_at)) + " · " +
        number(pov) + " enlaces POV asociados a sesiones documentadas. Las audiencias se mantienen separadas por plataforma.</p>";
      const grid = document.querySelector(".media-kit .subpage-grid");
      if (grid && !document.querySelector(".media-kit .media-data-strip")) grid.insertAdjacentElement("beforebegin",strip);
      const firstCard = document.querySelector(".media-kit .subpage-card");
      if (firstCard) {
        const stat = firstCard.querySelector(".media-stat");
        const copy = firstCard.querySelector("p");
        if (stat) stat.textContent = String(heroes.length);
        if (copy) copy.textContent = heroes.length + " expedientes públicos. Los Moriartys representa el proyecto compartido de Demian y Ari; se cuenta como un perfil y un canal.";
      }
      if (english) applyLanguage();
    }).catch(() => {
      const grid = document.querySelector(".media-kit .subpage-grid");
      if (grid && !document.querySelector(".media-kit .media-data-strip")) {
        const note = document.createElement("p");
        note.className = "subpage-note";
        note.textContent = "Los indicadores automáticos no están disponibles en esta captura; la ficha conserva sus fuentes y notas metodológicas.";
        grid.insertAdjacentElement("beforebegin",note);
      }
    });

    const channelHost = document.getElementById("creator-media-kit");
    if (channelHost) {
      const observer = new MutationObserver(() => { if (english) applyLanguage(); });
      observer.observe(channelHost,{childList:true,subtree:true});
    }
  }

})();