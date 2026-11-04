/* Belleville Dental: gallery page (filter and lightbox). Needs jQuery, Bootstrap and common.js. */
(function ($) {
  'use strict';
  var BD = window.BD, store = BD.store, esc = BD.esc, pad = BD.pad, showModal = BD.showModal, hideModal = BD.hideModal,
      fieldError = BD.fieldError, MONTH_NAMES = BD.MONTH_NAMES, money = BD.money, getCart = BD.getCart, saveCart = BD.saveCart,
      cartCount = BD.cartCount, cartSubtotal = BD.cartSubtotal, shippingFor = BD.shippingFor, safeImg = BD.safeImg,
      updateBadge = BD.updateBadge, showToast = BD.showToast, MAX_QTY = BD.MAX_QTY, FREE_SHIP_FROM = BD.FREE_SHIP_FROM;

  /* ---------- Gallery lightbox ---------- */
  function initGallery() {
    var $g = $('#galGrid');
    if (!$g.length) { return; }
    var cat = 'all', vis = [], at = 0;
    var modal = new bootstrap.Modal(document.getElementById('lbModal'));
    function visible() { return $g.children('.gal-col:visible').find('.tile').get(); }
    function open(i) {
      var el = vis[i]; if (!el) { return; }
      at = i;
      $('#lbImg').attr('src', $(el).attr('data-src')).attr('alt', $(el).attr('data-title'));
      $('#lbTitle').text($(el).attr('data-title'));
      $('#lbText').text($(el).attr('data-text'));
      $('#lbCount').text((i + 1) + ' / ' + vis.length);
    }
    $('.chip[data-gcat]').each(function () {
      var c = $(this).attr('data-gcat');
      $(this).append('<span class="count">' + (c === 'all' ? $g.children().length : $g.children('[data-cat="' + c + '"]').length) + '</span>');
    }).on('click', function () {
      cat = $(this).attr('data-gcat');
      $('.chip[data-gcat]').attr('aria-pressed', 'false');
      $(this).attr('aria-pressed', 'true');
      $g.children('.gal-col').each(function () { $(this).toggle(cat === 'all' || $(this).attr('data-cat') === cat); });
    });
    $g.on('click', '.tile', function () {
      vis = visible();
      open($.inArray(this, vis));
      modal.show();
    });
    $('#lbNext').on('click', function () { open((at + 1) % vis.length); });
    $('#lbPrev').on('click', function () { open((at - 1 + vis.length) % vis.length); });
    $(document).on('keydown', function (e) {
      if (!$('#lbModal').hasClass('show')) { return; }
      if (e.which === 39) { $('#lbNext').trigger('click'); }
      if (e.which === 37) { $('#lbPrev').trigger('click'); }
    });
  }


  $(function () {
    initGallery();
  });
}(jQuery));
