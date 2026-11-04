/* Belleville Dental: products page (filter, sort, star ratings, add to cart). Needs jQuery, Bootstrap and common.js. */
(function ($) {
  'use strict';
  var BD = window.BD, store = BD.store, esc = BD.esc, pad = BD.pad, showModal = BD.showModal, hideModal = BD.hideModal,
      fieldError = BD.fieldError, MONTH_NAMES = BD.MONTH_NAMES, money = BD.money, getCart = BD.getCart, saveCart = BD.saveCart,
      cartCount = BD.cartCount, cartSubtotal = BD.cartSubtotal, shippingFor = BD.shippingFor, safeImg = BD.safeImg,
      updateBadge = BD.updateBadge, showToast = BD.showToast, MAX_QTY = BD.MAX_QTY, FREE_SHIP_FROM = BD.FREE_SHIP_FROM;

  /* ---------- Products: filter, sort, star rating ---------- */
  function initProducts() {
    var $grid = $('#prodGrid');
    if (!$grid.length) { return; }
    var ratings = store.get('bd-ratings', {});
    var cat = 'all';

    function avg($c, id) {
      var seedAvg = parseFloat($c.attr('data-avg')), seedN = parseInt($c.attr('data-n'), 10);
      var mine = ratings[id];
      var n = seedN + (mine ? 1 : 0);
      var a = (seedAvg * seedN + (mine || 0)) / n;
      return { a: a, n: n };
    }
    function paint($c, hover) {
      var id = $c.attr('data-id'), r = avg($c, id), mine = ratings[id], show = hover || mine || Math.round(r.a);
      $c.find('.star').each(function (i) {
        $(this).toggleClass('on', !hover && i < show).toggleClass('pv', !!hover && i < hover);
      });
      $c.attr('data-score', r.a.toFixed(2));
      $c.find('.rate-text').text(r.a.toFixed(1) + ' / 5 from ' + r.n + ' ratings' + (mine ? ' · you rated ' + mine : ' · tap a star to rate'));
    }
    $grid.find('.prod-col').each(function () { paint($(this).find('.prod'), 0); });

    $grid.on('mouseenter focusin', '.star', function () { paint($(this).closest('.prod'), $(this).index() + 1); });
    $grid.on('mouseleave focusout', '.stars', function () { paint($(this).closest('.prod'), 0); });
    $grid.on('click', '.star', function () {
      var $c = $(this).closest('.prod'), id = $c.attr('data-id'), v = $(this).index() + 1;
      ratings[id] = v;
      store.set('bd-ratings', ratings);
      paint($c, 0);
      sortGrid();
    });

    function sortGrid() {
      var mode = $('#sortSel').val();
      var $cols = $grid.children('.prod-col').get();
      $cols.sort(function (a, b) {
        var $a = $(a).find('.prod'), $b = $(b).find('.prod');
        if (mode === 'price-asc') { return parseFloat($a.attr('data-price')) - parseFloat($b.attr('data-price')); }
        if (mode === 'price-desc') { return parseFloat($b.attr('data-price')) - parseFloat($a.attr('data-price')); }
        if (mode === 'rating') { return parseFloat($b.attr('data-score')) - parseFloat($a.attr('data-score')); }
        return $a.find('h3').text().localeCompare($b.find('h3').text());
      });
      $.each($cols, function (_, el) { $grid.append(el); });
    }
    function filter() {
      var q = $.trim($('#prodSearch').val()).toLowerCase(), shown = 0;
      $grid.children('.prod-col').each(function () {
        var $c = $(this), $p = $c.find('.prod');
        var ok = (cat === 'all' || $p.attr('data-cat') === cat) && (!q || $c.text().toLowerCase().indexOf(q) > -1);
        $c.toggle(ok);
        if (ok) { shown += 1; }
      });
      $('#prodStatus').text('Showing ' + shown + ' of ' + $grid.children('.prod-col').length + ' products');
      $('#prodNone').toggle(shown === 0);
    }
    $('.chip[data-cat]').on('click', function () {
      cat = $(this).attr('data-cat');
      $('.chip[data-cat]').attr('aria-pressed', 'false');
      $(this).attr('aria-pressed', 'true');
      filter();
    });
    $('#sortSel').on('change', sortGrid);
    $('#prodSearch').on('input', filter);
    $('.chip[data-cat]').each(function () {
      var c = $(this).attr('data-cat');
      var n = c === 'all' ? $grid.children().length : $grid.find('.prod[data-cat="' + c + '"]').length;
      $(this).append('<span class="count">' + n + '</span>');
    });
    sortGrid(); filter();
  }


  function initCartButtons() {
    // "Add to cart" buttons live on the product cards
    $(document).on('click', '.add-cart', function () {
      var $btn = $(this), $p = $btn.closest('.prod');
      var id = $p.attr('data-id'), name = $.trim($p.find('h3').first().text());
      var price = parseFloat($p.attr('data-price')), img = $p.find('img').first().attr('src');
      if (!id || !isFinite(price)) { return; }
      var cart = getCart(), line = null;
      $.each(cart, function (_, i) { if (i.id === id) { line = i; } });
      if (line && line.qty >= MAX_QTY) {
        showToast('You already have the most we allow (' + MAX_QTY + ') of <strong>' + esc(name) + '</strong>.');
        return;
      }
      if (line) { line.qty += 1; } else { cart.push({ id: id, name: name, price: price, img: img, qty: 1 }); }
      saveCart(cart);
      showToast('<strong>' + esc(name) + '</strong> added to your cart. <a href="cart.html">View cart</a>');
      var label = $btn.text();
      $btn.text('Added').prop('disabled', true);
      window.setTimeout(function () { $btn.text(label).prop('disabled', false); }, 1000);
    });
    updateBadge();
  }

  $(function () {
    initProducts();
    initCartButtons();
  });
}(jQuery));
