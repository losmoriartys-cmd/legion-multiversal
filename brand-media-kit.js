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
    fetch("../roster-data.json", { cache: "no-store" }).then((response) => {
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
            escapeHtml(date(captured)) + '</p><p class="channel-kit-meta">La categoría principal se ordena por muestras en directo dentro de la ventana disponible. La actividad de chat solo se publica cuando existe un registro de evento/VOD con su alcance identificado; no se extrapola a otros canales.</p><p class="channel-kit-meta">País e idioma de la audiencia: sin datos propios verificables.</p><p class="channel-kit-dossier-link><a href="../#roster/' + encodeURIComponent(id) + '">ABRIR EXPEDIENTE INDIVIDUAL / IMPRIMIR PDF ↗</a></p></article>'
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
})();
