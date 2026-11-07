/* Navegación de respaldo para Legión Multiversal.
   Mantiene el cambio de capítulos operativo aunque fallen los handlers inline. */
(function () {
  'use strict';

  function activateChapter(chapterNumber) {
    const target = document.getElementById('chapter-' + chapterNumber);
    if (!target || !target.classList.contains('chapter-panel')) return false;

    // Si la función original está disponible, conservamos su transición y sonido.
    if (typeof window.switchChapter === 'function') {
      window.switchChapter(Number(chapterNumber));
      const secondaryMenu = document.querySelector('.secondary-navigation[open]');
      if (secondaryMenu) secondaryMenu.open = false;
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', '#chapter-' + chapterNumber);
      }
      return true;
    }

    // Respaldo independiente: cambia el panel sin depender del script principal.
    document.querySelectorAll('.chapter-panel').forEach(function (panel) {
      panel.classList.toggle('active', panel === target);
    });
    document.querySelectorAll('.nav-btn[data-chapter]').forEach(function (button) {
      const active = Number(button.getAttribute('data-chapter')) === Number(chapterNumber);
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });

    const transition = document.getElementById('chapter-transition');
    const activeButton = document.querySelector('.nav-btn[data-chapter="' + chapterNumber + '"]');
    if (transition && activeButton) {
      transition.setAttribute('data-title', activeButton.textContent.trim());
      transition.classList.remove('play');
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        void transition.offsetWidth;
        transition.classList.add('play');
      }
    }

    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });

    if (Number(chapterNumber) === 2 && typeof window.renderRoster === 'function') {
      window.renderRoster();
    }

    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '#chapter-' + chapterNumber);
    }
    return true;
  }

  function bindChapterNavigation() {
    document.addEventListener('click', function (event) {
      const button = event.target.closest('.nav-btn[data-chapter], [onclick*="switchChapter("]');
      if (!button) return;

      const dataNumber = button.getAttribute('data-chapter');
      const inline = button.getAttribute('onclick') || '';
      const match = inline.match(/switchChapter\s*\(\s*(\d+)\s*\)/);
      const chapterNumber = dataNumber || (match && match[1]);
      if (!chapterNumber) return;

      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
      activateChapter(chapterNumber);
    }, true);

    // Permite abrir directamente un capítulo mediante #chapter-N.
    const hashMatch = (window.location.hash || '').match(/^#chapter-(\d+)$/);
    if (hashMatch) activateChapter(hashMatch[1]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindChapterNavigation, { once: true });
  } else {
    bindChapterNavigation();
  }
})();
