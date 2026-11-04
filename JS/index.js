/* Belleville Dental: home page. Slide board with a "camera" that zooms out, pans and zooms in between cards.
   Ported from the first site's home.js (board / cam / cd), rewritten without jQuery. Plain ES5. */
(function () {
  'use strict';
  var board = document.getElementById('board'), cam = document.getElementById('cam');
  if (!board || !cam) { return; }

  var cards = Array.prototype.slice.call(board.querySelectorAll('.cd'));
  var dotsBox = document.getElementById('dots');
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var COLS = 3, cur = 0, busy = false, lockUntil = 0, slides = false;
  var bw = 0, bh = 0, cw = 0, ch = 0, gap = 0;

  /* dots */
  var dots = cards.map(function (c, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', 'Slide ' + (i + 1) + ': ' + c.getAttribute('data-title'));
    b.setAttribute('data-i', i);
    dotsBox.appendChild(b);
    return b;
  });
  function markDot() {
    dots.forEach(function (d, i) {
      d.classList.toggle('a', i === cur);
      d.setAttribute('aria-selected', i === cur ? 'true' : 'false');
    });
  }

  function tickerH() {
    var v = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--ticker-h'), 10);
    return isNaN(v) ? 48 : v;
  }
  function inView() {
    var r = board.getBoundingClientRect();
    return r.top >= -6 && r.bottom <= window.innerHeight + 6;
  }
  function syncTouch() { board.style.touchAction = (slides && inView()) ? 'none' : ''; }

  /* geometry: the board fills the screen under the header and above the ticker */
  function dims() {
    var top = board.getBoundingClientRect().top + window.pageYOffset;
    var h = Math.max(480, window.innerHeight - top - tickerH());
    board.style.height = h + 'px';
    bw = board.clientWidth; bh = h;
    cw = bw * 0.93; ch = bh * 0.94; gap = cw * 0.07;
    board.style.setProperty('--fs', Math.max(11.5, Math.min(17, bh / 36.5)).toFixed(2) + 'px');
  }
  function centre(i) { return [(i % COLS) * (cw + gap) + cw / 2, Math.floor(i / COLS) * (ch + gap) + ch / 2]; }
  function tf(i, s) {
    var c = centre(i);
    return 'translate(' + bw / 2 + 'px,' + bh / 2 + 'px) scale(' + s + ') translate(' + (-c[0]) + 'px,' + (-c[1]) + 'px)';
  }

  function activate(i) { cards[i].classList.add('on'); }
  function setInert() {
    cards.forEach(function (c, i) {
      if (slides && i !== cur) { c.setAttribute('inert', ''); } else { c.removeAttribute('inert'); }
    });
  }

  var flatObserver = null;
  function layout() {
    var flat = window.innerWidth < 992 || window.innerHeight < 560;
    slides = !flat;
    board.classList.toggle('slides', slides);
    if (flatObserver) { flatObserver.disconnect(); flatObserver = null; }
    if (!slides) {
      board.style.height = ''; board.style.touchAction = ''; board.style.removeProperty('--fs');
      cam.style.transform = '';
      cards.forEach(function (c) { c.style.cssText = ''; });
      setInert();
      if ('IntersectionObserver' in window && !reduce) {
        flatObserver = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); flatObserver.unobserve(e.target); } });
        }, { threshold: 0.15 });
        cards.forEach(function (c) { flatObserver.observe(c); });
      } else { cards.forEach(activate); }
      return;
    }
    dims();
    cards.forEach(function (c, i) {
      c.style.width = cw + 'px'; c.style.height = ch + 'px';
      c.style.left = (i % COLS) * (cw + gap) + 'px';
      c.style.top = Math.floor(i / COLS) * (ch + gap) + 'px';
    });
    cam.style.transition = 'none';
    cam.style.transform = tf(cur, 1);
    markDot(); setInert(); syncTouch();
    window.setTimeout(function () { cam.style.transition = ''; activate(cur); }, 150);
  }

  /* zoom out, pan to the next card, zoom in */
  function go(n) {
    if (!slides || busy || n === cur || n < 0 || n >= cards.length) { return; }
    busy = true;
    lockUntil = Date.now() + (reduce ? 400 : 1500);
    var out = reduce ? 0 : 350, move = reduce ? 10 : 600;
    cam.style.transition = 'transform ' + (out / 1000) + 's cubic-bezier(.65,0,.35,1)';
    cam.style.transform = tf(cur, reduce ? 1 : 0.8);
    window.setTimeout(function () {
      cam.style.transition = 'transform ' + (move / 1000) + 's cubic-bezier(.65,0,.25,1)';
      cam.style.transform = tf(n, 1);
      cur = n; markDot(); setInert();
      window.setTimeout(function () { activate(n); }, reduce ? 0 : 350);
      window.setTimeout(function () { busy = false; }, move);
    }, out);
  }

  /* wheel: take over only while the board fills the screen and there is a slide to go to; otherwise the page scrolls */
  board.addEventListener('wheel', function (e) {
    if (!slides || !inView()) { return; }
    var n = cur + (e.deltaY > 0 ? 1 : -1);
    if (n < 0 || n >= cards.length) { return; }
    e.preventDefault();
    if (Date.now() < lockUntil || Math.abs(e.deltaY) < 12) { return; }
    go(n);
  }, { passive: false });

  document.addEventListener('keydown', function (e) {
    if (!slides || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) { return; }
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) { return; }
    if (!inView()) { return; }
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { if (cur < cards.length - 1) { e.preventDefault(); go(cur + 1); } }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') { if (cur > 0) { e.preventDefault(); go(cur - 1); } }
  });

  var ty = 0;
  board.addEventListener('touchstart', function (e) { ty = e.touches[0].clientY; }, { passive: true });
  board.addEventListener('touchend', function (e) {
    if (!slides) { return; }
    var d = ty - e.changedTouches[0].clientY;
    if (Math.abs(d) < 60) { return; }
    var n = cur + (d > 0 ? 1 : -1);
    if (n >= cards.length) { window.scrollBy({ top: Math.round(window.innerHeight * 0.8), behavior: 'smooth' }); return; }
    go(n);
  }, { passive: true });

  dotsBox.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-i]');
    if (b) { go(parseInt(b.getAttribute('data-i'), 10)); }
  });
  document.getElementById('slidePrev').addEventListener('click', function () { go(cur - 1); });
  document.getElementById('slideNext').addEventListener('click', function () {
    if (cur === cards.length - 1) { window.scrollBy({ top: Math.round(window.innerHeight * 0.8), behavior: 'smooth' }); } else { go(cur + 1); }
  });

  /* focus inside a card that is off-screen (inert covers most cases): bring it into view, never let the board scroll */
  board.addEventListener('scroll', function () { board.scrollTop = 0; board.scrollLeft = 0; });
  board.addEventListener('focusin', function (e) {
    var c = e.target.closest && e.target.closest('.cd');
    if (c && slides) { var i = cards.indexOf(c); if (i > -1 && i !== cur) { go(i); } }
  });

  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);
  window.addEventListener('scroll', syncTouch, { passive: true });
  layout();
}());
