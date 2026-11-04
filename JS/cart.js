/* Belleville Dental: cart page (quantities, totals and demo checkout). Needs jQuery, Bootstrap and common.js. */
(function ($) {
  'use strict';
  var BD = window.BD, store = BD.store, esc = BD.esc, pad = BD.pad, showModal = BD.showModal, hideModal = BD.hideModal,
      fieldError = BD.fieldError, MONTH_NAMES = BD.MONTH_NAMES, money = BD.money, getCart = BD.getCart, saveCart = BD.saveCart,
      cartCount = BD.cartCount, cartSubtotal = BD.cartSubtotal, shippingFor = BD.shippingFor, safeImg = BD.safeImg,
      updateBadge = BD.updateBadge, showToast = BD.showToast, MAX_QTY = BD.MAX_QTY, FREE_SHIP_FROM = BD.FREE_SHIP_FROM;

  function renderCartPage() {
    var $list = $('#cartItems');
    if (!$list.length) { return; }
    var cart = getCart(), sub = cartSubtotal(cart), ship = shippingFor(sub);
    $list.empty();
    $.each(cart, function (_, i) {
      var img = safeImg(i.img);
      $list.append('<div class="cart-row" data-id="' + esc(i.id) + '">' +
        (img ? '<img src="' + img + '" width="72" height="72" alt="">' : '<span class="cart-noimg"></span>') +
        '<div class="cart-info"><h3 class="h6 mb-1">' + esc(i.name) + '</h3><div class="small">' + money(i.price) + ' each</div></div>' +
        '<div class="qty" role="group" aria-label="Quantity of ' + esc(i.name) + '">' +
        '<button type="button" class="btn btn-outline-primary btn-sm" data-qty="-1" aria-label="Decrease quantity">&minus;</button>' +
        '<span class="qty-num" aria-label="Quantity">' + i.qty + '</span>' +
        '<button type="button" class="btn btn-outline-primary btn-sm" data-qty="1" aria-label="Increase quantity"' + (i.qty >= MAX_QTY ? ' disabled' : '') + '>+</button></div>' +
        '<div class="line-total">' + money(i.price * i.qty) + '</div>' +
        '<button type="button" class="btn btn-outline-primary btn-sm" data-remove aria-label="Remove ' + esc(i.name) + ' from cart">Remove</button></div>');
    });
    var empty = cart.length === 0;
    $('#cartEmpty').prop('hidden', !empty);
    $('#cartClear').prop('hidden', empty);
    $('#checkoutBtn').prop('disabled', empty);
    $('#sumCount').text(cartCount(cart));
    $('#sumSub').text(money(sub));
    $('#sumShip').text(empty ? money(0) : (ship === 0 ? 'Free' : money(ship)));
    $('#sumTotal').text(money(sub + ship));
    $('#shipHint').text(empty ? '' : (ship === 0 ? 'You have free shipping.' : 'Add ' + money(FREE_SHIP_FROM - sub) + ' more for free shipping.'));
  }

  function initCartPage() {
    if (!$('#cartItems').length) { return; }
    $('#cartItems').on('click', '[data-qty]', function () {
      var id = $(this).closest('.cart-row').attr('data-id'), d = parseInt($(this).attr('data-qty'), 10);
      var cart = getCart();
      $.each(cart, function (_, i) { if (i.id === id) { i.qty = Math.max(1, Math.min(MAX_QTY, i.qty + d)); } });
      saveCart(cart);
      renderCartPage();
    });
    $('#cartItems').on('click', '[data-remove]', function () {
      var id = $(this).closest('.cart-row').attr('data-id');
      saveCart($.grep(getCart(), function (i) { return i.id !== id; }));
      renderCartPage();
    });
    $('#cartClear').on('click', function () { saveCart([]); renderCartPage(); });

    $('#checkoutBtn').on('click', function () {
      var cart = getCart(), sub = cartSubtotal(cart);
      if (!cart.length) { return; }
      $('#ckTotal').text(money(sub + shippingFor(sub)));
      showModal('checkoutModal');
    });
    $('#checkoutForm').on('submit', function (e) {
      e.preventDefault();
      var name = $.trim($('#ckName').val()), email = $.trim($('#ckEmail').val()), addr = $.trim($('#ckAddress').val());
      var ok = true;
      ok = fieldError('ck', 'Name', name.length < 2 ? 'Enter your full name.' : '') && ok;
      ok = fieldError('ck', 'Email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter a valid email address, like name@example.com.') && ok;
      ok = fieldError('ck', 'Address', addr.length < 8 ? 'Enter your full delivery address.' : '') && ok;
      if (!ok) { return; }
      var cart = getCart();
      if (!cart.length) { return; }
      var sub = cartSubtotal(cart), total = sub + shippingFor(sub), n = cartCount(cart);
      $('#odName').text(name);
      $('#odRef').text('ORD-' + pad(new Date().getTime() % 100000, 5));
      $('#odLine').text(n + (n === 1 ? ' item' : ' items') + ', total ' + money(total) + ' to pay on delivery.');
      saveCart([]);
      $('#checkoutForm')[0].reset();
      renderCartPage();
      // open the "order placed" message once the delivery form has finished closing
      $('#checkoutModal').one('hidden.bs.modal', function () { showModal('orderDoneModal'); });
      hideModal('checkoutModal');
    });
    renderCartPage();
  }

  $(window).on('storage', function () { renderCartPage(); });

  $(function () {
    initCartPage();
  });
}(jQuery));
