/* Belleville Dental: queries page (question form and saved questions). Needs jQuery, Bootstrap and common.js. */
(function ($) {
  'use strict';
  var BD = window.BD, store = BD.store, esc = BD.esc, pad = BD.pad, showModal = BD.showModal, hideModal = BD.hideModal,
      fieldError = BD.fieldError, MONTH_NAMES = BD.MONTH_NAMES, money = BD.money, getCart = BD.getCart, saveCart = BD.saveCart,
      cartCount = BD.cartCount, cartSubtotal = BD.cartSubtotal, shippingFor = BD.shippingFor, safeImg = BD.safeImg,
      updateBadge = BD.updateBadge, showToast = BD.showToast, MAX_QTY = BD.MAX_QTY, FREE_SHIP_FROM = BD.FREE_SHIP_FROM;

  /* ---------- Queries page ---------- */
  function initQueries() {
    var $f = $('#queryForm');
    if (!$f.length) { return; }
    var list = store.get('bd-queries', []);
    function render() {
      var $o = $('#queryList').empty();
      if (!list.length) { $o.append('<p class="mb-0">No saved questions yet. Send one with the form.</p>'); return; }
      $.each(list.slice().reverse(), function (_, q) {
        $o.append('<div class="saved-q"><div><p><strong>' + esc(q.topic) + '</strong> · ' + esc(q.name) + '</p><p>' + esc(q.msg) + '</p><span class="when">' + esc(q.when) + '</span></div><button type="button" class="btn btn-sm btn-outline-primary align-self-start" data-del="' + q.id + '">Remove</button></div>');
      });
    }
    function err(id, m) { $('#' + id + 'Err').text(m || ''); return !m; }
    $f.on('submit', function (e) {
      e.preventDefault();
      var name = $.trim($('#qName').val()), email = $.trim($('#qEmail').val()), topic = $('#qTopic').val(), msg = $.trim($('#qMsg').val());
      var ok = true;
      ok = err('qName', name.length < 2 ? 'Enter your name.' : '') && ok;
      ok = err('qEmail', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter a valid email address, like name@example.com.') && ok;
      ok = err('qMsg', msg.length < 10 ? 'Write at least 10 characters so we can understand your question.' : '') && ok;
      if (!ok) { return; }
      list.push({ id: new Date().getTime(), name: name, topic: topic, msg: msg, when: new Date().toLocaleString() });
      store.set('bd-queries', list);
      $f[0].reset();
      render();
      $('#queryOk').prop('hidden', false);
      window.setTimeout(function () { $('#queryOk').prop('hidden', true); }, 6000);
    });
    $('#queryList').on('click', '[data-del]', function () {
      var id = parseInt($(this).attr('data-del'), 10);
      list = $.grep(list, function (q) { return q.id !== id; });
      store.set('bd-queries', list);
      render();
    });
    $('#qMsg').on('input', function () { $('#qCount').text($(this).val().length + ' / 500'); });
    render();
  }


  $(function () {
    initQueries();
  });
}(jQuery));
