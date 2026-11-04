/* Belleville Dental: shared behaviour (theme toggle, visitor counter, ticker, copy buttons, cart badge, toasts, motion).
   Plain ES5 + jQuery. Page scripts (JS/<page>.js) read helpers from window.BD. */
(function ($) {
  'use strict';
  /* ---------- Safe storage ---------- */
  var store = {
    get: function (k, d) { try { var v = window.localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  function pad(n, len) { var s = String(n); while (s.length < len) { s = '0' + s; } return s; }
  function esc(s) { return $('<div>').text(s).html(); }

  /* ---------- Theme toggle (light / dark) ---------- */
  function applyTheme(t) {
    var root = document.documentElement;
    root.setAttribute('data-theme', t);
    root.setAttribute('data-bs-theme', t);
    var $b = $('#themeToggle');
    $b.attr('aria-pressed', t === 'dark' ? 'true' : 'false');
    $b.attr('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
  function initTheme() {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    $('#themeToggle').on('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { window.localStorage.setItem('bd-theme', next); } catch (e) { /* ignore */ }
    });
  }

  /* ---------- Visitor counter (counts visits from this browser) ---------- */
  function initCounter() {
    var total = store.get('bd-visits', 0);
    var counted = false;
    try { counted = window.sessionStorage.getItem('bd-counted') === '1'; } catch (e) { counted = false; }
    if (!counted) {
      total += 1;
      store.set('bd-visits', total);
      try { window.sessionStorage.setItem('bd-counted', '1'); } catch (e) { /* ignore */ }
    }
    if (total < 1) { total = 1; }
    $('#visitCount').text(pad(total, 6));
  }

  /* ---------- Footer ticker: date, time, location (HTML5 Geolocation) ---------- */
  var loc = { text: 'Locating…' };
  function zoneName() {
    try {
      var z = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (z) { var p = z.split('/'); return p[p.length - 1].replace(/_/g, ' ') + ' (' + p[0].replace(/_/g, ' ') + ')'; }
    } catch (e) { /* ignore */ }
    return 'Location unavailable';
  }
  function fmtCoord(v, pos, neg) { return Math.abs(v).toFixed(2) + '° ' + (v >= 0 ? pos : neg); }
  function initLocation() {
    if (!('geolocation' in navigator)) { loc.text = zoneName() + ' · geolocation not supported'; return; }
    navigator.geolocation.getCurrentPosition(function (p) {
      loc.text = fmtCoord(p.coords.latitude, 'N', 'S') + ', ' + fmtCoord(p.coords.longitude, 'E', 'W') + ' · ' + zoneName();
    }, function () {
      loc.text = zoneName() + ' · location not shared';
    }, { timeout: 8000, maximumAge: 600000 });
  }
  function tick() {
    var d = new Date();
    var date = d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    var time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    $('.t-date').text(date);
    $('.t-time').text(time);
    $('.t-loc').text(loc.text);
  }
  function initTicker() {
    if (!$('.ticker').length) { return; }
    initLocation();
    tick();
    window.setInterval(tick, 1000);
  }

  /* ---------- Copy buttons ---------- */
  function initCopy() {
    $(document).on('click', '[data-copy]', function () {
      var $b = $(this), text = $b.attr('data-copy'), old = $b.text();
      function done(ok) { $b.text(ok ? 'Copied' : 'Press Ctrl+C'); window.setTimeout(function () { $b.text(old); }, 1600); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else { done(false); }
    });
  }

  function showModal(id) {
    var el = document.getElementById(id);
    if (el && window.bootstrap) { window.bootstrap.Modal.getOrCreateInstance(el).show(); }
  }
  function fieldError(prefix, id, m) { $('#' + prefix + id + 'Err').text(m || ''); return !m; }
  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // The cart is an array of { id, name, price, img, qty } saved in localStorage ("bd-cart").
  var CART_KEY = 'bd-cart', MAX_QTY = 10, FREE_SHIP_FROM = 30, SHIP_FEE = 4.5;

  function getCart() {
    var c = store.get(CART_KEY, []);
    if (!$.isArray(c)) { return []; }
    // keep only well-formed lines, so a damaged value can never break the page
    return $.grep(c, function (i) {
      return i && typeof i.id === 'string' && typeof i.name === 'string' && isFinite(i.price) && i.qty > 0;
    });
  }
  function saveCart(c) { store.set(CART_KEY, c); updateBadge(); }
  function money(n) { return '$' + n.toFixed(2); }
  function cartCount(c) { var n = 0; $.each(c, function (_, i) { n += i.qty; }); return n; }
  function cartSubtotal(c) { var t = 0; $.each(c, function (_, i) { t += i.price * i.qty; }); return Math.round(t * 100) / 100; }
  function shippingFor(sub) { return (sub === 0 || sub >= FREE_SHIP_FROM) ? 0 : SHIP_FEE; }
  function hideModal(id) {
    var el = document.getElementById(id), m = (el && window.bootstrap) ? window.bootstrap.Modal.getInstance(el) : null;
    if (m) { m.hide(); }
  }
  function safeImg(src) { return (typeof src === 'string' && src.indexOf('../IMAGES/') === 0 && src.indexOf('"') < 0) ? src : ''; }

  function updateBadge() {
    var n = cartCount(getCart());
    $('#cartBadge').text(n).prop('hidden', n === 0);
    $('.cart-link').attr('aria-label', 'Shopping cart, ' + n + (n === 1 ? ' item' : ' items'));
  }

  function showToast(msg) {
    var $box = $('#toastBox');
    if (!$box.length) {
      $box = $('<div class="toast-container position-fixed bottom-0 end-0 p-3" id="toastBox"></div>').appendTo('body');
    }
    var $t = $('<div class="toast" role="status" aria-live="polite" aria-atomic="true"><div class="d-flex"><div class="toast-body"></div><button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div></div>');
    $t.find('.toast-body').html(msg);
    $box.append($t);
    if (window.bootstrap) {
      var toast = window.bootstrap.Toast.getOrCreateInstance($t[0], { delay: 3500 });
      $t[0].addEventListener('hidden.bs.toast', function () { $t.remove(); });
      toast.show();
    } else {
      $t.addClass('show');
      window.setTimeout(function () { $t.remove(); }, 3500);
    }
  }
  /* ---------- Fixed ticker: keep page bottom clear of it ---------- */
  function initFixedTicker() {
    var $t = $('.ticker');
    if (!$t.length) { return; }
    function pad() { document.documentElement.style.setProperty('--ticker-h', $t.outerHeight() + 'px'); }
    pad();
    $(window).on('load resize', pad);
    if (window.ResizeObserver) { new window.ResizeObserver(pad).observe($t[0]); }
  }


  /* ---------- Motion: scroll slide-in reveal + page fade (ported from the Belleville Dental reference site) ---------- */
  function initMotion() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Page fade-out before following an internal link */
    if (!reduce) {
      $(document).on('click', 'a[href]', function (e) {
        var href = this.getAttribute('href');
        if (!href || href.charAt(0) === '#' || this.target === '_blank' || this.hasAttribute('download') || /^(mailto|tel|https?:|javascript)/i.test(href)) { return; }
        if (this.getAttribute('data-bs-toggle') || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) { return; }
        var url = this.href.split('#')[0];
        if (url === window.location.href.split('#')[0]) { return; }
        e.preventDefault();
        $('body').addClass('fade-out');
        setTimeout(function () { window.location.href = href; }, 330);
      });
      window.addEventListener('pageshow', function (ev) { if (ev.persisted) { $('body').removeClass('fade-out'); } });
    }
    if (reduce || !('IntersectionObserver' in window)) { return; }

    var io = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { $(en.target).addClass('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });

    /* What slides in. Two-column rows slide in from the sides; everything else slides up. */
    var COLS = '.row > .col, .row > [class^="col-"], .row > [class*=" col-"]';
    var UP = COLS + ', .section-head, .band-panel .wrap > :not(.row), .rhythm li, .ticks li, .accordion-item';
    function scan(root) {
      var $root = $(root || document.getElementById('main') || document.body);
      var $els = $root.find(UP).add($root.filter(UP)).not('.reveal, .board *, .carousel *, .hero-carousel, .modal *, .dropdown-menu *');
      var n = 0;
      $els.each(function () {
        var el = this;
        if ($(el).parents('.reveal').length && !$(el).is('.rhythm li, .ticks li, .accordion-item')) { return; }   /* do not nest reveals */
        if ($(el).is(COLS) && $(el).find(COLS).length) { return; }   /* only the innermost columns slide, so grids stagger card by card */
        var $row = $(el).parent('.row');
        var cls = 'reveal';
        if ($row.hasClass('align-items-center') && $row.children().length === 2) { cls += $(el).index() === 0 ? ' from-left' : ' from-right'; }
        el.className += ' ' + cls;
        el.style.transitionDelay = ((n % 6) * 80) + 'ms';
        n++;
        io.observe(el);
      });
    }
    scan();

    /* Content built by JS (product grid, library, reviews, gallery...) slides in too */
    var timer = null;
    if (window.MutationObserver && document.getElementById('main')) {
      new window.MutationObserver(function () {
        window.clearTimeout(timer);
        timer = window.setTimeout(function () { scan(); }, 60);
      }).observe(document.getElementById('main'), { childList: true, subtree: true });
    }
  }

  window.BD = {
    store: store, esc: esc, pad: pad, showModal: showModal, hideModal: hideModal, fieldError: fieldError,
    MONTH_NAMES: MONTH_NAMES, money: money, getCart: getCart, saveCart: saveCart, cartCount: cartCount,
    cartSubtotal: cartSubtotal, shippingFor: shippingFor, safeImg: safeImg, updateBadge: updateBadge,
    showToast: showToast, MAX_QTY: MAX_QTY, FREE_SHIP_FROM: FREE_SHIP_FROM, SHIP_FEE: SHIP_FEE
  };

  $(function () {
    initTheme();
    initCounter();
    initTicker();
    initCopy();
    updateBadge();
    $(window).on('storage', function () { updateBadge(); });
    initFixedTicker();
    initMotion();
  });
}(jQuery));
