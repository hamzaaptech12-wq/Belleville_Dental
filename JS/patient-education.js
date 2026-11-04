/* Belleville Dental: patient education page (brush timer and habit check). Needs jQuery, Bootstrap and common.js. */
(function ($) {
  'use strict';
  var BD = window.BD, store = BD.store, esc = BD.esc, pad = BD.pad, showModal = BD.showModal, hideModal = BD.hideModal,
      fieldError = BD.fieldError, MONTH_NAMES = BD.MONTH_NAMES, money = BD.money, getCart = BD.getCart, saveCart = BD.saveCart,
      cartCount = BD.cartCount, cartSubtotal = BD.cartSubtotal, shippingFor = BD.shippingFor, safeImg = BD.safeImg,
      updateBadge = BD.updateBadge, showToast = BD.showToast, MAX_QTY = BD.MAX_QTY, FREE_SHIP_FROM = BD.FREE_SHIP_FROM;

  /* ---------- Patient education: brushing timer + habit check ---------- */
  function initTimer() {
    var $r = $('#timerRing');
    if (!$r.length) { return; }
    var total = 120, left = total, iv = null, circ = 2 * Math.PI * 52;
    var $fg = $r.find('.fg');
    $fg.css({ 'stroke-dasharray': circ, 'stroke-dashoffset': 0 });
    function draw() {
      var m = Math.floor(left / 60), s = left % 60;
      $('#timerTime').text(m + ':' + pad(s, 2));
      $fg.css('stroke-dashoffset', circ * (1 - left / total));
      var elapsed = total - left, q = Math.min(3, Math.floor(elapsed / 30));
      $('#quads span').each(function (i) {
        $(this).toggleClass('on', iv !== null && i === q && left > 0).toggleClass('done', i < q || left === 0);
      });
      $('#timerMsg').text(left === 0 ? 'Done. Spit out the foam and skip the rinse.' : (iv === null ? (elapsed ? 'Paused.' : 'Press start when the brush is ready.') : 'Now brushing: ' + ['upper right', 'upper left', 'lower left', 'lower right'][q] + ' (outside, inside and chewing surfaces).'));
    }
    function stop() { if (iv) { window.clearInterval(iv); iv = null; } }
    $('#timerStart').on('click', function () {
      if (iv) { stop(); $(this).text('Resume'); draw(); return; }
      if (left === 0) { left = total; }
      $(this).text('Pause');
      iv = window.setInterval(function () {
        left -= 1;
        if (left <= 0) { left = 0; stop(); $('#timerStart').text('Start again'); }
        draw();
      }, 1000);
      draw();
    });
    $('#timerReset').on('click', function () { stop(); left = total; $('#timerStart').text('Start'); draw(); });
    draw();
  }
  function initHabitQuiz() {
    var $f = $('#habitForm');
    if (!$f.length) { return; }
    $f.on('submit', function (e) {
      e.preventDefault();
      var score = 0, answered = 0, max = 0;
      $f.find('.q').each(function () {
        max += 2;
        var v = $(this).find('input:checked').val();
        if (v !== undefined) { answered += 1; score += parseInt(v, 10); }
      });
      if (answered < $f.find('.q').length) { $('#habitErr').text('Answer all five questions to see your score.'); return; }
      $('#habitErr').text('');
      var pct = Math.round(score / max * 100), msg;
      if (pct >= 80) { msg = 'Strong routine. Keep your regular check-ups and keep cleaning between teeth every day.'; }
      else if (pct >= 50) { msg = 'A good base. Pick the one habit you scored lowest on and make that your goal for this month.'; }
      else { msg = 'Small changes add up. Start with fluoride toothpaste twice a day for two minutes, then add daily cleaning between teeth.'; }
      $('#habitScore').text(score + ' / ' + max);
      $('#habitMsg').text(msg);
      $('#habitBar span').css('width', pct + '%');
      $('#habitOut').prop('hidden', false);
    });
    $f.on('reset', function () { $('#habitOut').prop('hidden', true); $('#habitErr').text(''); });
  }


  $(function () {
    initTimer();
    initHabitQuiz();
  });
}(jQuery));
