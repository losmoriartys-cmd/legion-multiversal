(function () {
  'use strict';

  // Quiénes somos: las personas de la Legión salen de data/roster.json (una sola fuente).
  function renderPeople() {
    var grid = document.getElementById('manifesto-people-grid');
    if (!grid || typeof fetch !== 'function') return;
    Promise.all([
      fetch('./data/roster.json', { cache: 'no-store' }),
      fetch('./data/creator-colors.json', { cache: 'no-store' }).catch(function () { return null; })
    ])
      .then(function (responses) {
        if (!responses[0].ok) throw new Error('data/roster.json ' + responses[0].status);
        return Promise.all([responses[0].json(), responses[1] && responses[1].ok ? responses[1].json() : null]);
      })
      .then(function (results) {
        var payload = results[0];
        var colors = (results[1] && results[1].colors) || {};
        var heroes = (payload && Array.isArray(payload.heroes)) ? payload.heroes : [];
        heroes.forEach(function (hero) { if (colors[hero.id || hero.slug]) hero.accent_color = colors[hero.id || hero.slug]; });
        var items = heroes.filter(function (hero) { return hero && (hero.display_name || hero.name) && hero.tagline; });
        if (!items.length) return;
        var fragment = document.createDocumentFragment();
        items.forEach(function (hero) {
          var card = document.createElement('article');
          var title = document.createElement('h4');
          var text = document.createElement('p');
          title.textContent = hero.display_name || hero.name;
          text.textContent = hero.tagline;
          if (/^#[0-9a-fA-F]{6}$/.test(hero.accent_color || '')) card.style.setProperty('--creator-color', hero.accent_color);
          card.appendChild(title);
          card.appendChild(text);
          fragment.appendChild(card);
        });
        grid.textContent = '';
        grid.appendChild(fragment);
      })
      .catch(function (error) {
        console.warn('No se pudo cargar el listado de personas de Quiénes somos:', error);
      });
  }

  // Arsenal: atajos por categoría que manejan el filtro existente, sin duplicar lógica.
  function buildQuickPicks() {
    var select = document.getElementById('arsenal-category-filter');
    var controls = document.querySelector('.arsenal-registry-controls');
    if (!select || !controls || document.getElementById('arsenal-quick-picks')) return;
    var options = Array.prototype.slice.call(select.options).filter(function (option) { return option.value !== 'all'; });
    if (!options.length) return;
    var wrap = document.createElement('div');
    wrap.className = 'arsenal-quick-picks';
    wrap.id = 'arsenal-quick-picks';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Atajos por categoría');
    var label = document.createElement('span');
    label.textContent = 'ATAJOS · ¿QUÉ TIPO DE NOCHE QUERÉS?';
    wrap.appendChild(label);
    function addButton(text, value) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = text;
      button.dataset.category = value;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', function () {
        select.value = value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
      wrap.appendChild(button);
    }
    addButton('TODOS', 'all');
    options.forEach(function (option) { addButton(option.textContent.toUpperCase(), option.value); });
    function sync() {
      Array.prototype.forEach.call(wrap.querySelectorAll('button'), function (button) {
        button.setAttribute('aria-pressed', button.dataset.category === select.value ? 'true' : 'false');
      });
    }
    select.addEventListener('change', sync);
    var reset = document.getElementById('arsenal-reset-filters');
    if (reset) reset.addEventListener('click', function () { window.setTimeout(sync, 0); });
    controls.parentNode.insertBefore(wrap, controls);
    sync();
  }

  function init() {
    renderPeople();
    var ready = window.arsenalRegistryReady;
    if (ready && typeof ready.then === 'function') ready.then(buildQuickPicks, function () {});
    else buildQuickPicks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
