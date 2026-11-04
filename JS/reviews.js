/* Belleville Dental: reviews page (rating form, summary and list). Needs jQuery, Bootstrap and common.js. */
(function ($) {
  'use strict';
  var BD = window.BD, store = BD.store, esc = BD.esc, pad = BD.pad, showModal = BD.showModal, hideModal = BD.hideModal,
      fieldError = BD.fieldError, MONTH_NAMES = BD.MONTH_NAMES, money = BD.money, getCart = BD.getCart, saveCart = BD.saveCart,
      cartCount = BD.cartCount, cartSubtotal = BD.cartSubtotal, shippingFor = BD.shippingFor, safeImg = BD.safeImg,
      updateBadge = BD.updateBadge, showToast = BD.showToast, MAX_QTY = BD.MAX_QTY, FREE_SHIP_FROM = BD.FREE_SHIP_FROM;

  /* ---------- Reviews ---------- */
  var STAR_PATH = 'M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6L2.5 9.5l6.6-.8z';
  function starsHtml(n) {
    var h = '<span class="stars static" role="img" aria-label="' + n + ' out of 5 stars">';
    for (var i = 1; i <= 5; i++) {
      h += '<span class="star' + (i <= n ? ' on' : '') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + STAR_PATH + '"/></svg></span>';
    }
    return h + '</span>';
  }

  function initReviews() {
    var $f = $('#revForm');
    if (!$f.length) { return; }
    var list = store.get('bd-reviews', []);
    var rating = 0;
    var rateWords = ['Tap a star to rate', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

    function shortDate(ms) { var d = new Date(ms); return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear(); }

    function renderSummary() {
      var n = list.length, sum = 0, counts = [0, 0, 0, 0, 0, 0];
      $.each(list, function (_, r) { sum += r.rating; counts[r.rating] += 1; });
      var avg = n ? sum / n : 0;
      $('#revAvg').text(n ? avg.toFixed(1) : '–');
      $('#revAvgStars').html(starsHtml(Math.round(avg)));
      $('#revCountTxt').text(n ? 'Based on ' + n + (n === 1 ? ' review' : ' reviews') : 'No ratings yet');
      var $b = $('#revBars').empty();
      for (var s = 5; s >= 1; s--) {
        var pct = n ? Math.round(counts[s] / n * 100) : 0;
        $b.append('<div class="bar-row"><span>' + s + ' star</span><div class="bar"><span style="width:' + pct + '%"></span></div><span class="num">' + counts[s] + '</span></div>');
      }
    }

    function renderList() {
      var minStars = parseInt($('#revFilter').val(), 10), mode = $('#revSort').val();
      var shown = $.grep(list, function (r) { return !minStars || r.rating === minStars; });
      shown.sort(function (a, b) {
        if (mode === 'high') { return b.rating - a.rating || b.id - a.id; }
        if (mode === 'low') { return a.rating - b.rating || b.id - a.id; }
        return b.id - a.id;
      });
      var $o = $('#revList').empty();
      if (!shown.length) {
        $('#revNone').text(list.length ? 'No reviews match this filter.' : 'No reviews yet. Be the first to share yours.').prop('hidden', false);
        return;
      }
      $('#revNone').prop('hidden', true);
      $.each(shown, function (_, r) {
        $o.append('<div class="col"><article class="card h-100"><div class="card-body d-flex flex-column">' +
          '<div class="d-flex justify-content-between align-items-center mb-1">' + starsHtml(r.rating) + '<span class="small mono">' + esc(shortDate(r.id)) + '</span></div>' +
          '<h3 class="h5">' + esc(r.title) + '</h3><p>' + esc(r.text) + '</p>' +
          '<p class="small mt-auto mb-2"><strong>' + esc(r.name) + '</strong> &middot; ' + esc(r.type) + '</p>' +
          '<button type="button" class="btn btn-outline-primary btn-sm align-self-start" data-del="' + r.id + '">Delete my review</button>' +
          '</div></article></div>');
      });
    }

    function paintStars(hover) {
      $('#revStars .star').each(function (i) {
        $(this).toggleClass('on', !hover && i < rating).toggleClass('pv', !!hover && i < hover);
      });
      $('#revRateTxt').text(rateWords[hover || rating] + (hover || rating ? ' (' + (hover || rating) + ' out of 5)' : ''));
    }
    $('#revStars').on('mouseenter focusin', '.star', function () { paintStars($(this).index() + 1); });
    $('#revStars').on('mouseleave focusout', function () { paintStars(0); });
    $('#revStars').on('click', '.star', function () {
      rating = $(this).index() + 1;
      fieldError('rev', 'Rating', '');
      paintStars(0);
    });
    $('#revText').on('input', function () { $('#revCount').text($(this).val().length + ' / 400'); });
    $('#revFilter, #revSort').on('change', renderList);

    $f.on('submit', function (e) {
      e.preventDefault();
      var name = $.trim($('#revName').val()), title = $.trim($('#revTitle').val()), text = $.trim($('#revText').val());
      var ok = true;
      ok = fieldError('rev', 'Name', name.length < 2 ? 'Enter a display name.' : '') && ok;
      ok = fieldError('rev', 'Rating', rating ? '' : 'Choose a star rating.') && ok;
      ok = fieldError('rev', 'Title', title.length < 3 ? 'Add a short headline.' : '') && ok;
      ok = fieldError('rev', 'Text', text.length < 10 ? 'Write at least 10 characters.' : '') && ok;
      if (!ok) { return; }
      list.push({ id: new Date().getTime(), name: name, type: $('#revType').val(), rating: rating, title: title, text: text });
      store.set('bd-reviews', list);
      $f[0].reset();
      rating = 0;
      paintStars(0);
      $('#revCount').text('0 / 400');
      renderSummary();
      renderList();
      showModal('revModal');
    });
    $('#revList').on('click', '[data-del]', function () {
      var id = parseInt($(this).attr('data-del'), 10);
      list = $.grep(list, function (r) { return r.id !== id; });
      store.set('bd-reviews', list);
      renderSummary();
      renderList();
    });
    renderSummary();
    renderList();
  }

  $(function () {
    initReviews();
  });
}(jQuery));
