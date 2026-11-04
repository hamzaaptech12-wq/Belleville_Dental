/* Belleville Dental: about page. Reading-progress bar. Needs jQuery and common.js. */
(function ($) {
  'use strict';
  $(function () {
    var $bar = $('<div class="read-progress" role="presentation"></div>').appendTo('body');
    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      $bar.css('width', (h > 0 ? Math.min(100, window.pageYOffset / h * 100) : 0) + '%');
    }
    $(window).on('scroll resize', update);
    update();
  });
}(jQuery));
