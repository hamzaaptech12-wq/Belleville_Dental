/* Belleville Dental: site map page. Adds a quick filter above the page list. Needs jQuery and common.js. */
(function ($) {
  'use strict';
  $(function () {
    var $tree = $('.tree').first();
    if (!$tree.length) { return; }
    var $in = $('<input type="search" class="form-control sitemap-filter" id="mapFilter" placeholder="Filter pages and sections" aria-label="Filter pages and sections">');
    var $none = $('<p class="mb-0 mt-3" id="mapNone" hidden>No pages match that search.</p>');
    $tree.before($in).after($none);
    $in.on('input', function () {
      var q = $.trim($in.val()).toLowerCase(), shown = 0;
      $tree.children('li').each(function () {
        var $li = $(this), top = $li.text().toLowerCase().indexOf(q) > -1;
        $li.find('ul li').each(function () { $(this).toggleClass('is-hidden', !!q && $(this).text().toLowerCase().indexOf(q) < 0 && !($li.children('a').text().toLowerCase().indexOf(q) > -1)); });
        $li.toggleClass('is-hidden', !top);
        if (top) { shown += 1; }
      });
      $none.prop('hidden', shown > 0);
    });
  });
}(jQuery));
