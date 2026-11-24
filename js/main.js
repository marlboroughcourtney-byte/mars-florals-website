/* =========================================================
   Mars Florals — shared frontend script (vanilla JS)
   1. Highlights the active page in the navigation
   2. Adds a shadow line to the nav once the page scrolls
   3. Closes the mobile menu after a link is tapped
   4. Footer year
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 1. Active page in nav ---------- */
  function highlightActiveNav() {
    var current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.mf-nav .nav-link').forEach(function (link) {
      var target = (link.getAttribute('href') || '').split('?')[0].split('#')[0];
      if (target === current) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ---------- 2. Nav scroll state ---------- */
  function navScrollState() {
    var nav = document.querySelector('.mf-nav');
    if (!nav) return;
    var update = function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ---------- 3. Close mobile menu on link tap ---------- */
  function closeMenuOnTap() {
    var menu = document.getElementById('mainNav');
    if (!menu || !window.bootstrap) return;
    menu.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        if (menu.classList.contains('show')) {
          window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
        }
      });
    });
  }

  /* ---------- 4. Footer year ---------- */
  function footerYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    highlightActiveNav();
    navScrollState();
    closeMenuOnTap();
    footerYear();
  });
})();
