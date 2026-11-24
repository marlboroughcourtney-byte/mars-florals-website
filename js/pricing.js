/* =========================================================
   Mars Florals — pricing page (vanilla JS)
   1. Filter buttons show one service group at a time
   2. "What's included" toggles show/hide package details
   3. A link like pricing.html#events opens that group filtered
      (also on back/forward), and scrolls the filter buttons into
      view so "All" is always there to get back to every package
   ========================================================= */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var bar = document.querySelector('[data-filter-bar]');
    var buttons = document.querySelectorAll('[data-filter]');
    var groups = document.querySelectorAll('[data-group]');
    var status = document.querySelector('[data-filter-status]');

    function applyFilter(name) {
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.filter === name ? 'true' : 'false');
      });
      groups.forEach(function (g) {
        g.hidden = !(name === 'all' || g.dataset.group === name);
      });
      if (status) {
        status.textContent = name === 'all' ? 'Showing all packages' : 'Showing ' + name + ' packages';
      }
    }

    /* ---------- 1. Filter buttons ---------- */
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var name = b.dataset.filter;
        applyFilter(name);
        // keep the address shareable: pricing.html#events, or plain pricing.html for All
        history.replaceState(null, '', name === 'all' ? window.location.pathname : '#' + name);
      });
    });

    /* ---------- 3. Arriving from pricing.html#weddings etc. ---------- */
    function filterFromHash() {
      var name = window.location.hash.replace('#', '');
      if (!name) { applyFilter('all'); return false; }
      if (!document.querySelector('[data-group="' + name + '"]')) return false;
      applyFilter(name);
      return true;
    }
    function showBar() {
      // run after the browser's own jump to #events, so the buttons win
      if (bar) setTimeout(function () { bar.scrollIntoView({ block: 'start' }); }, 0);
    }

    if (window.location.hash && filterFromHash()) window.addEventListener('load', showBar);
    // back/forward or a link to another #group on this same page
    window.addEventListener('hashchange', function () { if (filterFromHash()) showBar(); });

    /* ---------- 2. "What's included" toggles ---------- */
    document.querySelectorAll('.mf-toggle').forEach(function (btn) {
      var list = document.getElementById(btn.getAttribute('aria-controls'));
      if (!list) return;
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        btn.textContent = open ? "What's included" : 'Hide details';
        list.hidden = open;
      });
    });
  });
})();
