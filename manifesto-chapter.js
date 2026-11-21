(function () {
  'use strict';
  const root = document.getElementById('chapter-11');
  if (!root) return;
  const tabs = Array.from(root.querySelectorAll('[data-manifesto-tab]'));
  const panels = Array.from(root.querySelectorAll('[data-manifesto-panel]'));
  if (!tabs.length || !panels.length) return;
  function activate(name, moveFocus) {
    tabs.forEach(tab => {
      const selected = tab.dataset.manifestoTab === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && moveFocus) tab.focus();
    });
    panels.forEach(panel => { panel.hidden = panel.dataset.manifestoPanel !== name; });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab.dataset.manifestoTab, false));
    tab.addEventListener('keydown', event => {
      let next = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== null) { event.preventDefault(); activate(tabs[next].dataset.manifestoTab, true); }
    });
  });
  activate('before', false);
})();
