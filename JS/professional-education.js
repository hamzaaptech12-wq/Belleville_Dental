/* Belleville Dental: professional education page (courses, help search, DMFT and tooth-number tools). Needs jQuery, Bootstrap and common.js. */
(function ($) {
  'use strict';
  var BD = window.BD, store = BD.store, esc = BD.esc, pad = BD.pad, showModal = BD.showModal, hideModal = BD.hideModal,
      fieldError = BD.fieldError, MONTH_NAMES = BD.MONTH_NAMES, money = BD.money, getCart = BD.getCart, saveCart = BD.saveCart,
      cartCount = BD.cartCount, cartSubtotal = BD.cartSubtotal, shippingFor = BD.shippingFor, safeImg = BD.safeImg,
      updateBadge = BD.updateBadge, showToast = BD.showToast, MAX_QTY = BD.MAX_QTY, FREE_SHIP_FROM = BD.FREE_SHIP_FROM;

  /* ---------- Professional education ---------- */
  function initCourses() {
    var $list = $('#courseGrid');
    if (!$list.length) { return; }
    var saved = store.get('bd-courses', []);
    function sync() {
      $list.find('.course-col').each(function () {
        var id = $(this).attr('data-id'), on = $.inArray(id, saved) > -1;
        $(this).find('.save-btn').text(on ? 'Saved ✓' : 'Save to my list').toggleClass('btn-primary', on).toggleClass('btn-outline-primary', !on).attr('aria-pressed', on ? 'true' : 'false');
      });
      $('#savedCount').text(saved.length);
    }
    $list.on('click', '.save-btn', function () {
      var id = $(this).closest('.course-col').attr('data-id'), i = $.inArray(id, saved);
      if (i > -1) { saved.splice(i, 1); } else { saved.push(id); }
      store.set('bd-courses', saved);
      sync();
    });
    $('.chip[data-level]').on('click', function () {
      var lv = $(this).attr('data-level');
      $('.chip[data-level]').attr('aria-pressed', 'false');
      $(this).attr('aria-pressed', 'true');
      $list.children('.course-col').each(function () { $(this).toggle(lv === 'all' || $(this).attr('data-level') === lv); });
    });
    sync();
  }
  function initHelpSearch() {
    var $in = $('#helpSearch');
    if (!$in.length) { return; }
    $in.on('input', function () {
      var q = $.trim($in.val()).toLowerCase(), n = 0;
      $('#helpList .accordion-item').each(function () {
        var ok = !q || $(this).text().toLowerCase().indexOf(q) > -1;
        $(this).toggle(ok);
        if (ok) { n += 1; }
      });
      $('#helpNone').toggle(n === 0);
    });
  }
  function initDmft() {
    var $f = $('#dmftForm');
    if (!$f.length) { return; }
    function bandFor(v) {
      if (v <= 1.1) { return 'Very low'; }
      if (v <= 2.6) { return 'Low'; }
      if (v <= 4.4) { return 'Moderate'; }
      if (v <= 6.5) { return 'High'; }
      return 'Very high';
    }
    $f.on('submit input', function (e) {
      e.preventDefault();
      var d = parseInt($('#dmftD').val(), 10) || 0, m = parseInt($('#dmftM').val(), 10) || 0, fl = parseInt($('#dmftF').val(), 10) || 0;
      var tot = d + m + fl, err = '';
      if (d < 0 || m < 0 || fl < 0) { err = 'Enter zero or a positive number.'; }
      if (tot > 32) { err = 'The total cannot be more than 32 teeth.'; }
      $('#dmftErr').text(err);
      if (err) { $('#dmftOut').text('—'); $('#dmftSub').text(''); return; }
      $('#dmftOut').text('DMFT ' + tot);
      $('#dmftSub').text('WHO severity band for 12-year-olds: ' + bandFor(tot) + '. Decayed ' + d + ', missing ' + m + ', filled ' + fl + '.');
    }).trigger('submit');
  }
  function initToothConv() {
    var $f = $('#toothForm');
    if (!$f.length) { return; }
    var names = ['', 'central incisor', 'lateral incisor', 'canine', 'first premolar', 'second premolar', 'first molar', 'second molar', 'third molar (wisdom tooth)'];
    var quad = ['', 'upper right', 'upper left', 'lower left', 'lower right'];
    function fdiToUni(n) {
      var q = Math.floor(n / 10), t = n % 10;
      if (q === 1) { return 9 - t; }
      if (q === 2) { return 8 + t; }
      if (q === 3) { return 25 - t; }
      return 24 + t;
    }
    function uniToFdi(u) {
      if (u <= 8) { return 10 + (9 - u); }
      if (u <= 16) { return 20 + (u - 8); }
      if (u <= 24) { return 30 + (25 - u); }
      return 40 + (u - 24);
    }
    function describe(f) { return quad[Math.floor(f / 10)] + ' ' + names[f % 10]; }
    $f.on('submit input change', function (e) {
      e.preventDefault();
      var sys = $('#toothSys').val(), n = parseInt($('#toothNum').val(), 10), out = '', sub = '', err = '';
      if (isNaN(n)) { err = 'Enter a tooth number.'; }
      else if (sys === 'fdi') {
        var q = Math.floor(n / 10), t = n % 10;
        if (q < 1 || q > 4 || t < 1 || t > 8) { err = 'FDI numbers run 11–18, 21–28, 31–38 and 41–48.'; }
        else { out = 'Universal ' + fdiToUni(n); sub = 'FDI ' + n + ' is the ' + describe(n) + '.'; }
      } else {
        if (n < 1 || n > 32) { err = 'Universal numbers run from 1 to 32.'; }
        else { var f = uniToFdi(n); out = 'FDI ' + f; sub = 'Universal ' + n + ' is the ' + describe(f) + '.'; }
      }
      $('#toothErr').text(err);
      $('#toothOut').text(err ? '—' : out);
      $('#toothSub').text(err ? '' : sub);
    }).trigger('submit');
  }


  $(function () {
    initCourses();
    initHelpSearch();
    initDmft();
    initToothConv();
  });
}(jQuery));
