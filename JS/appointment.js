/* Belleville Dental: appointment page (booking form and time slots). Needs jQuery, Bootstrap and common.js. */
(function ($) {
  'use strict';
  var BD = window.BD, store = BD.store, esc = BD.esc, pad = BD.pad, showModal = BD.showModal, hideModal = BD.hideModal,
      fieldError = BD.fieldError, MONTH_NAMES = BD.MONTH_NAMES, money = BD.money, getCart = BD.getCart, saveCart = BD.saveCart,
      cartCount = BD.cartCount, cartSubtotal = BD.cartSubtotal, shippingFor = BD.shippingFor, safeImg = BD.safeImg,
      updateBadge = BD.updateBadge, showToast = BD.showToast, MAX_QTY = BD.MAX_QTY, FREE_SHIP_FROM = BD.FREE_SHIP_FROM;

  var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function toYmd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2); }
  function fromYmd(s) { var p = s.split('-'); return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)); }
  function niceDate(s) { var d = fromYmd(s); return DAY_NAMES[d.getDay()] + ', ' + d.getDate() + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear(); }

  function initAppointment() {
    var $f = $('#apptForm');
    if (!$f.length) { return; }
    var list = store.get('bd-appts', []);
    var chosen = '';
    var today = new Date();
    var todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var last = new Date(todayStart.getTime() + 180 * 86400000);
    $('#apDate').attr('min', toYmd(todayStart)).attr('max', toYmd(last));

    function timeLabel(mins) {
      var h = Math.floor(mins / 60), m = mins % 60;
      return (h % 12 === 0 ? 12 : h % 12) + ':' + pad(m, 2) + ' ' + (h >= 12 ? 'PM' : 'AM');
    }
    // Weekdays 9-5, Saturday 9-1, Sunday closed. A slot is 30 minutes.
    function slotsFor(dateStr) {
      var dow = fromYmd(dateStr).getDay();
      if (dow === 0) { return null; }
      var end = (dow === 6) ? 13 * 60 : 17 * 60, out = [];
      var now = new Date(), nowMins = now.getHours() * 60 + now.getMinutes(), isToday = (dateStr === toYmd(now));
      for (var m = 9 * 60; m < end; m += 30) {
        if (isToday && m <= nowMins + 60) { continue; }
        out.push(m);
      }
      return out;
    }
    function renderSlots() {
      var v = $('#apDate').val(), $s = $('#apSlots').empty();
      chosen = '';
      if (!v) { $s.append('<p class="mb-0 small">Choose a date to see the times available.</p>'); return; }
      var slots = slotsFor(v);
      if (slots === null) { $s.append('<p class="mb-0 small">We are closed on Sundays. Please choose another day.</p>'); return; }
      if (!slots.length) { $s.append('<p class="mb-0 small">No more times today. Please choose another day.</p>'); return; }
      var taken = {};
      $.each(list, function (_, a) { if (a.date === v) { taken[a.time] = true; } });
      $.each(slots, function (_, m) {
        var t = timeLabel(m);
        $s.append('<button type="button" class="chip" aria-pressed="false" data-time="' + t + '"' + (taken[t] ? ' disabled title="Already requested"' : '') + '>' + t + '</button>');
      });
    }
    function render() {
      var $o = $('#apptList').empty();
      if (!list.length) { $o.append('<p class="mb-0">No appointment requests yet. Use the form above to make one.</p>'); return; }
      var sorted = list.slice().sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
      $.each(sorted, function (_, a) {
        $o.append('<div class="saved-q"><div><p><strong>' + esc(a.type) + '</strong> &middot; ' + esc(niceDate(a.date)) + ' at ' + esc(a.time) + '</p><p>' + esc(a.name) + ' &middot; ' + esc(a.phone) + '</p>' + (a.notes ? '<p>' + esc(a.notes) + '</p>' : '') + '<span class="when">Ref ' + esc(a.ref) + ' &middot; requested ' + esc(a.when) + '</span></div><button type="button" class="btn btn-outline-primary btn-sm align-self-start" data-cancel="' + a.id + '">Cancel</button></div>');
      });
    }

    $('#apDate').on('change input', function () { fieldError('ap', 'Date', ''); fieldError('ap', 'Slot', ''); renderSlots(); });
    $('#apSlots').on('click', '.chip[data-time]', function () {
      chosen = $(this).attr('data-time');
      $('#apSlots .chip').attr('aria-pressed', 'false');
      $(this).attr('aria-pressed', 'true');
      fieldError('ap', 'Slot', '');
    });
    $('#apNotes').on('input', function () { $('#apCount').text($(this).val().length + ' / 300'); });

    $f.on('submit', function (e) {
      e.preventDefault();
      var name = $.trim($('#apName').val()), phone = $.trim($('#apPhone').val()), email = $.trim($('#apEmail').val());
      var date = $('#apDate').val(), type = $('#apType').val(), notes = $.trim($('#apNotes').val());
      var digits = phone.replace(/\D/g, ''), ok = true, dateMsg = '';
      if (!date) { dateMsg = 'Choose a date.'; }
      else if (fromYmd(date) < todayStart) { dateMsg = 'Choose today or a later date.'; }
      else if (fromYmd(date).getDay() === 0) { dateMsg = 'We are closed on Sundays.'; }
      ok = fieldError('ap', 'Name', name.length < 2 ? 'Enter your full name.' : '') && ok;
      ok = fieldError('ap', 'Phone', (digits.length < 7 || digits.length > 15 || /[^0-9+\-()\s]/.test(phone)) ? 'Enter a valid phone number.' : '') && ok;
      ok = fieldError('ap', 'Email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter a valid email address, like name@example.com.') && ok;
      ok = fieldError('ap', 'Date', dateMsg) && ok;
      ok = fieldError('ap', 'Slot', (!dateMsg && !chosen) ? 'Choose a time.' : '') && ok;
      if (!ok) { return; }
      var id = new Date().getTime();
      var appt = { id: id, ref: 'BD-' + pad(id % 100000, 5), name: name, phone: phone, email: email, type: type, date: date, time: chosen, notes: notes, when: new Date().toLocaleString() };
      list.push(appt);
      store.set('bd-appts', list);
      $('#apmName').text(name);
      $('#apmRef').text(appt.ref);
      $('#apmType').text(type);
      $('#apmDate').text(niceDate(date));
      $('#apmTime').text(chosen);
      $f[0].reset();
      $('#apCount').text('0 / 300');
      renderSlots();
      render();
      showModal('apptModal');
    });
    $('#apptList').on('click', '[data-cancel]', function () {
      var id = parseInt($(this).attr('data-cancel'), 10);
      list = $.grep(list, function (a) { return a.id !== id; });
      store.set('bd-appts', list);
      render();
      renderSlots();
    });
    render();
  }

  $(function () {
    initAppointment();
  });
}(jQuery));
