/* Legión Multiversal · enlaces sociales seguros para tarjetas y perfiles.
 * Solo HTTPS y dominios propios de la plataforma. link_hub se reserva a Beacons.
 */
(function (root) {
  'use strict';
  const PLATFORMS = {
    twitch: { label: 'Twitch', mono: 'TW', hosts: ['twitch.tv'] },
    youtube: { label: 'YouTube', mono: 'YT', hosts: ['youtube.com', 'youtu.be'] },
    instagram: { label: 'Instagram', mono: 'IG', hosts: ['instagram.com'] },
    tiktok: { label: 'TikTok', mono: 'TT', hosts: ['tiktok.com'] },
    facebook: { label: 'Facebook', mono: 'FB', hosts: ['facebook.com'] },
    link_hub: { label: 'Todos mis enlaces', mono: '↗', hosts: ['beacons.ai'] }
  };
  const ORDER = ['twitch', 'youtube', 'instagram', 'tiktok', 'facebook', 'link_hub'];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function validUrl(platform, raw) {
    const config = PLATFORMS[platform];
    if (!config || typeof raw !== 'string' || !raw.trim()) return null;
    try {
      const url = new URL(raw.trim());
      if (url.protocol !== 'https:' || url.username || url.password) return null;
      const host = url.hostname.toLowerCase().replace(/^www\./, '');
      if (!config.hosts.some(domain => host === domain || host.endsWith('.' + domain))) return null;
      url.search = '';
      url.hash = '';
      return url.href;
    } catch (_) {
      return null;
    }
  }

  function collect(hero) {
    const found = new Map();
    const add = (platform, raw) => {
      if (!PLATFORMS[platform] || found.has(platform)) return;
      const safe = validUrl(platform, raw);
      if (safe) found.set(platform, safe);
    };

    for (const account of (Array.isArray(hero?.accounts) ? hero.accounts : [])) {
      if (['pending', 'unavailable'].includes(account?.status)) continue;
      add(account?.platform, account?.url);
    }
    for (const [platform, url] of Object.entries(hero?.socials || {})) add(platform, url);
    for (const link of (Array.isArray(hero?.links) ? hero.links : [])) {
      add(link?.platform, link?.url);
    }
    for (const platform of ['twitch', 'youtube', 'instagram', 'tiktok', 'facebook']) {
      add(platform, hero?.[platform]);
    }

    return ORDER.filter(platform => found.has(platform))
      .map(platform => ({ platform, label: PLATFORMS[platform].label, mono: PLATFORMS[platform].mono, url: found.get(platform) }));
  }

  function renderSocialButtons(hero) {
    const links = collect(hero);
    if (!links.length) return '';
    const name = escapeHtml(hero?.display_name || hero?.name || 'integrante');
    return '<nav class="social-links" aria-label="Enlaces de ' + name + '">' + links.map(link => {
      const label = link.platform === 'link_hub' ? 'TODOS MIS ENLACES' : link.label.toUpperCase();
      return '<a class="soc soc-' + link.platform + '" href="' + escapeHtml(link.url) + '" target="_blank" rel="noopener noreferrer" aria-label="' +
        escapeHtml(label) + ' de ' + name + ' (se abre en una pestaña nueva)"><span class="soc-ic" aria-hidden="true">' +
        escapeHtml(link.mono) + '</span><span>' + escapeHtml(label) + '</span></a>';
    }).join('') + '</nav>';
  }

  const api = { collect, validUrl, renderSocialButtons };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LMSocial = api;
})(typeof window !== 'undefined' ? window : globalThis);
