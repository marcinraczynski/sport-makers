/* Sport Makers – main.js
   Etap 1: menu mobilne. Animacje GSAP, suwak Win–Win, oś czasu i formularz dochodzą w kolejnych etapach. */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initMenu();
  });

  /* ---------- Menu (poniżej 1024 px) ---------- */
  function initMenu() {
    var root = document.documentElement;
    var toggle = document.querySelector('[data-menu-toggle]');
    var label = document.querySelector('[data-menu-label]');
    var nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      root.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (label) label.textContent = open ? 'Zamknij menu' : 'Otwórz menu';
    }

    toggle.addEventListener('click', function () {
      setOpen(!root.classList.contains('menu-open'));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('menu-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (mq) {
      if (mq.matches) setOpen(false);
    });
  }
})();
