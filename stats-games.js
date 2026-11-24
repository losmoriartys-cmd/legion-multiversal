/* Rendimiento por juego: agrega el desglose por juego (window.game_breakdown) de los canales activos.
   Es una función pura para poder probarla con Node. Los valores provienen del muestreo propio de data.json:
   no son analítica oficial de Twitch ni se proyectan fuera de la ventana observada. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LegionStatsGames = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function gameKey(name) {
    return String(name == null ? '' : name).trim().toLowerCase();
  }

  function finite(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  /* channels: lista de canales de data.json. resolveCreatorId(login) -> ID canónico del creador o ''. */
  function aggregate(channels, resolveCreatorId) {
    var games = new Map();
    (channels || []).forEach(function (channel) {
      var breakdown = channel && channel.window && channel.window.game_breakdown;
      if (!Array.isArray(breakdown)) return;
      var login = String(channel.login || '');
      var label = channel.display_name || login;
      var creatorId = typeof resolveCreatorId === 'function' ? (resolveCreatorId(login) || '') : '';
      breakdown.forEach(function (item) {
        var key = gameKey(item && item.name);
        if (!key) return;
        var samples = finite(item.live_samples) ? item.live_samples : 0;
        var streams = finite(item.streams_observed) ? item.streams_observed : 0;
        if (samples <= 0 && streams <= 0) return;
        var entry = games.get(key);
        if (!entry) {
          entry = { name: String(item.name).trim(), streams: 0, samples: 0, weighted: 0, weight: 0, peak: null, creators: [] };
          games.set(key, entry);
        }
        entry.streams += streams;
        entry.samples += samples;
        if (finite(item.average_viewers_sampled) && samples > 0) {
          entry.weighted += item.average_viewers_sampled * samples;
          entry.weight += samples;
        }
        if (finite(item.peak_viewers_sampled)) {
          entry.peak = entry.peak === null ? item.peak_viewers_sampled : Math.max(entry.peak, item.peak_viewers_sampled);
        }
        entry.creators.push({ login: login, label: label, id: creatorId, streams: streams });
      });
    });
    return Array.from(games.values()).map(function (entry) {
      return {
        name: entry.name,
        streams: entry.streams,
        samples: entry.samples,
        average: entry.weight > 0 ? entry.weighted / entry.weight : null,
        peak: entry.peak,
        creators: entry.creators.sort(function (a, b) { return b.streams - a.streams; })
      };
    }).sort(function (a, b) {
      return b.streams - a.streams || b.samples - a.samples || a.name.localeCompare(b.name, 'es');
    });
  }

  return { aggregate: aggregate, gameKey: gameKey };
});
