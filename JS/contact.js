/* Belleville Dental: contact page. Shows whether the clinic is open now, using the same hours as the booking form
   (weekdays 9:00-17:00, Saturday 9:00-13:00, closed Sunday). Needs jQuery and common.js. */
(function ($) {
  'use strict';
  function status(d) {
    var dow = d.getDay(), mins = d.getHours() * 60 + d.getMinutes();
    var end = dow === 6 ? 13 * 60 : 17 * 60;
    if (dow === 0) { return { open: false, text: 'Closed today (Sunday). Opens Monday 9:00 AM' }; }
    if (mins >= 9 * 60 && mins < end) { return { open: true, text: 'Open now, until ' + (dow === 6 ? '1:00 PM' : '5:00 PM') }; }
    return { open: false, text: mins < 9 * 60 ? 'Closed, opens today at 9:00 AM' : 'Closed for today' };
  }
  $(function () {
    var $lede = $('.page-hero .lede').first();
    if (!$lede.length) { return; }
    function paint() {
      var s = status(new Date()), $b = $('#openNow');
      if (!$b.length) { $b = $('<p class="open-now" id="openNow" role="status"><i aria-hidden="true"></i><span></span></p>').insertAfter($lede); }
      $b.toggleClass('is-open', s.open).find('span').text(s.text);
    }
    paint();
    window.setInterval(paint, 60000);
  });
}(jQuery));
