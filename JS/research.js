/* Belleville Dental: research page (library filter, brief pop-ups, animated explainers). Needs jQuery, Bootstrap and common.js. */
(function ($) {
  'use strict';
  var BD = window.BD, store = BD.store, esc = BD.esc, pad = BD.pad, showModal = BD.showModal, hideModal = BD.hideModal,
      fieldError = BD.fieldError, MONTH_NAMES = BD.MONTH_NAMES, money = BD.money, getCart = BD.getCart, saveCart = BD.saveCart,
      cartCount = BD.cartCount, cartSubtotal = BD.cartSubtotal, shippingFor = BD.shippingFor, safeImg = BD.safeImg,
      updateBadge = BD.updateBadge, showToast = BD.showToast, MAX_QTY = BD.MAX_QTY, FREE_SHIP_FROM = BD.FREE_SHIP_FROM;

  /* ---------- Research: filter, brief modal, animated explainers ---------- */
  var EXPLAINERS = {
    brushing: { title: 'Brushing in four quadrants', links: [{ t: 'ADA MouthHealthy: Brushing', u: 'https://www.mouthhealthy.org/all-topics-a-z/brushing-your-teeth' }, { t: 'NIDCR: Oral hygiene', u: 'https://www.nidcr.nih.gov/health-info/oral-hygiene' }], slides: [
      { img: '../IMAGES/illustrations/brushing.svg', t: 'Pea-sized fluoride paste', d: 'Use a soft brush and a pea-sized amount of fluoride toothpaste. Children under 3 need only a rice-grain smear.' },
      { img: '../IMAGES/illustrations/checkup.svg', t: 'Angle toward the gumline', d: 'Tilt the bristles about 45 degrees toward the gum so they reach the plaque that sits at the edge of the tooth.' },
      { img: '../IMAGES/illustrations/brushing.svg', t: 'Small, gentle circles', d: 'Brush each quadrant for 30 seconds: outside, inside and chewing surfaces. Light pressure protects the gums.' },
      { img: '../IMAGES/illustrations/gum-disease.svg', t: 'Do not forget the gumline', d: 'Plaque left at the gumline causes the redness and bleeding that begin gum disease.' },
      { img: '../IMAGES/illustrations/hero.svg', t: 'Spit, do not rinse', d: 'Spit out the foam and skip the rinse, so the fluoride stays on your teeth for longer.' } ] },
    flossing: { title: 'Cleaning between teeth', links: [{ t: 'ADA MouthHealthy: Flossing', u: 'https://www.mouthhealthy.org/all-topics-a-z/flossing' }, { t: 'NIDCR: Oral hygiene', u: 'https://www.nidcr.nih.gov/health-info/oral-hygiene' }], slides: [
      { img: '../IMAGES/illustrations/flossing.svg', t: 'About 40 cm of floss', d: 'Wind most of it around one finger and a little around the other, leaving a short working length.' },
      { img: '../IMAGES/illustrations/flossing.svg', t: 'Slide, do not snap', d: 'Guide the floss between teeth with a gentle back-and-forth motion.' },
      { img: '../IMAGES/illustrations/cavity-prevention.svg', t: 'Hug the tooth in a C-shape', d: 'Curve the floss around one tooth and move it up and down, just under the gumline.' },
      { img: '../IMAGES/illustrations/flossing.svg', t: 'Use a clean section each time', d: 'Move to a fresh length of floss for every gap. Interdental brushes are an option if floss is hard to use.' } ] },
    plaque: { title: 'How a cavity forms', links: [{ t: 'NIDCR: The tooth decay process', u: 'https://www.nidcr.nih.gov/health-info/tooth-decay/more-info/tooth-decay-process' }, { t: 'CDC: About cavities', u: 'https://www.cdc.gov/oral-health/about/cavities-tooth-decay.html' }], slides: [
      { img: '../IMAGES/illustrations/diet.svg', t: 'Sugar arrives', d: 'Free sugars feed the bacteria in plaque on the tooth surface.' },
      { img: '../IMAGES/illustrations/gum-disease.svg', t: 'Bacteria make acid', d: 'After each sugar exposure the plaque acid lowers the pH in your mouth for a while.' },
      { img: '../IMAGES/illustrations/xray.svg', t: 'Minerals are lost', d: 'Repeated acid attacks dissolve minerals from the enamel. This early stage can still be reversed.' },
      { img: '../IMAGES/illustrations/cavity-prevention.svg', t: 'Fluoride helps repair', d: 'Fluoride toothpaste and fewer sugar exposures let enamel regain minerals before a hole forms.' },
      { img: '../IMAGES/illustrations/checkup.svg', t: 'Check-ups catch it early', d: 'Your dentist can spot early changes and treat them before they need a filling.' } ] },
    visit: { title: 'What happens at a check-up', links: [{ t: 'ADA MouthHealthy: Common dental problems', u: 'https://www.mouthhealthy.org/what-dental-issues-look-like' }, { t: 'NIDCR: Oral hygiene', u: 'https://www.nidcr.nih.gov/health-info/oral-hygiene' }], slides: [
      { img: '../IMAGES/illustrations/clinic.svg', t: 'A conversation first', d: 'You review your health, medicines and any concerns, such as bleeding gums or sensitivity.' },
      { img: '../IMAGES/illustrations/checkup.svg', t: 'Looking and measuring', d: 'The dentist checks teeth, gums and soft tissues, and may measure gum pockets with a small probe.' },
      { img: '../IMAGES/illustrations/xray.svg', t: 'X-rays when needed', d: 'Images are taken only when they are likely to help, based on your risk and history.' },
      { img: '../IMAGES/illustrations/brushing.svg', t: 'A plan you can follow', d: 'You leave with advice on brushing, cleaning between teeth, diet and when to come back.' } ] }
  };
  function initResearch() {
    if (!$('#libGrid').length) { return; }
    var type = 'all';
    $('.chip[data-type]').on('click', function () {
      type = $(this).attr('data-type');
      $('.chip[data-type]').attr('aria-pressed', 'false');
      $(this).attr('aria-pressed', 'true');
      $('#libGrid').children('.lib-col').each(function () { $(this).toggle(type === 'all' || $(this).attr('data-type') === type); });
    });
    $('.chip[data-type]').each(function () {
      var t = $(this).attr('data-type');
      $(this).append('<span class="count">' + (t === 'all' ? $('#libGrid').children().length : $('#libGrid').children('[data-type="' + t + '"]').length) + '</span>');
    });
    $('#libGrid').on('click', '[data-brief]', function () {
      var $src = $('#' + $(this).attr('data-brief'));
      $('#briefTitle').text($src.attr('data-title'));
      $('#briefBody').html($src.html());
      new bootstrap.Modal(document.getElementById('briefModal')).show();
    });

    var idx = 0, playing = false, iv = null, cur = null;
    var modalEl = document.getElementById('videoModal'), modal = modalEl ? new bootstrap.Modal(modalEl) : null;
    function show(i) {
      var s = cur.slides[i];
      idx = i;
      $('#vidImg').attr('src', s.img);
      $('#vidT').text(s.t);
      $('#vidD').text(s.d);
      $('#vidBar span').css('width', ((i + 1) / cur.slides.length * 100) + '%');
      $('#vidCount').text((i + 1) + ' / ' + cur.slides.length);
    }
    function stopPlay() { playing = false; if (iv) { window.clearInterval(iv); iv = null; } $('#vidPlay').text('Play'); }
    function startPlay() {
      playing = true; $('#vidPlay').text('Pause');
      iv = window.setInterval(function () {
        if (idx >= cur.slides.length - 1) { stopPlay(); return; }
        show(idx + 1);
      }, 5000);
    }
    $('#libGrid').on('click', '[data-video]', function () {
      cur = EXPLAINERS[$(this).attr('data-video')];
      $('#vidTitle').text(cur.title);
      var lk = '';
      $.each(cur.links || [], function (_, l) { lk += '<li><a class="ext" href="' + l.u + '" target="_blank" rel="noopener noreferrer">' + esc(l.t) + '<span class="visually-hidden"> (opens in a new tab)</span></a></li>'; });
      $('#vidLinks').html(lk);
      $('#vidLinksBox').prop('hidden', !lk);
      show(0);
      modal.show();
      startPlay();
    });
    $('#vidPlay').on('click', function () { if (playing) { stopPlay(); } else { if (idx >= cur.slides.length - 1) { show(0); } startPlay(); } });
    $('#vidNext').on('click', function () { if (idx < cur.slides.length - 1) { show(idx + 1); } });
    $('#vidPrev').on('click', function () { if (idx > 0) { show(idx - 1); } });
    $(modalEl).on('hidden.bs.modal', stopPlay);
  }


  $(function () {
    initResearch();
  });
}(jQuery));
