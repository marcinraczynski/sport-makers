/* =========================================================
   Sport Makers – main.js
   Menu, animacje GSAP + ScrollTrigger, suwak Win–Win, oś czasu „Jak działamy”.
   Bez jQuery. GSAP ładowany lokalnie z assets/js/vendor/.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var EASE = 'power3.out';
  var DUR = 1;          // wolniej, żeby było widać, że elementy się pojawiają (tylko za pierwszym razem)
  var RISE = 40;

  document.addEventListener('DOMContentLoaded', function () {
    var hasGsap = !!(window.gsap && window.ScrollTrigger);
    if (hasGsap) gsap.registerPlugin(ScrollTrigger);
    else root.classList.remove('anim');

    initMenu();
    initStickyHeader(hasGsap);
    initCurrentSection();
    initWinWin(hasGsap);
    initProcess(hasGsap);
    initTrust(hasGsap);

    if (hasGsap) {
      initAnimations();
      // Po wczytaniu zdjęć i fontów przelicz pozycje wyzwalaczy
      window.addEventListener('load', function () { ScrollTrigger.refresh(); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  });

  function reduced() { return reduceMQ.matches; }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* Płynne przewijanie strony (GSAP zamiast CSS scroll-behavior, który gryzie się z przypinaniem sekcji).
     Przerywa je kółko myszy, dotyk lub klawisz. */
  var scrollTween = null;
  function smoothScrollTo(y, dur, onDone, ease) {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    y = clamp(Math.round(y), 0, max);
    if (scrollTween) scrollTween.kill();
    if (!window.gsap || reduced() || Math.abs(y - window.scrollY) < 2) {
      window.scrollTo(0, y);
      if (onDone) onDone();
      return;
    }
    var o = { y: window.scrollY };
    var d = dur || clamp(Math.abs(y - o.y) / 2200, 0.6, 1.4);
    scrollTween = gsap.to(o, {
      y: y, duration: d, ease: ease || 'power2.inOut',
      onUpdate: function () { window.scrollTo(0, o.y); },
      onComplete: function () { scrollTween = null; if (onDone) onDone(); },
      onInterrupt: function () { scrollTween = null; if (onDone) onDone(); }
    });
  }
  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function () { if (scrollTween) scrollTween.kill(); }, { passive: true });
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    smoothScrollTo(el.getBoundingClientRect().top + window.scrollY);
    if (history.replaceState) history.replaceState(null, '', id);
  });

  /* =========================================================
     MENU MOBILNE (poniżej 1024 px)
     ========================================================= */
  function initMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var label = document.querySelector('[data-menu-label]');
    var nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      root.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (label) label.textContent = open ? 'Zamknij menu' : 'Otwórz menu';
    }
    toggle.addEventListener('click', function () { setOpen(!root.classList.contains('menu-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('menu-open')) { setOpen(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (mq) { if (mq.matches) setOpen(false); });
  }

  /* =========================================================
     3. MENU PRZYKLEJONE PO 80 PX
     ========================================================= */
  function initStickyHeader(hasGsap) {
    var header = document.querySelector('[data-header]');
    if (!header) return;
    var bar = header.querySelector('.site-header__bar');
    var stuck = false;
    var ticking = false;

    function update() {
      ticking = false;
      var should = window.scrollY > 80;
      if (should === stuck) return;
      stuck = should;
      header.classList.toggle('is-stuck', stuck);
      if (stuck && hasGsap) {
        gsap.fromTo(bar, { yPercent: -120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.3, ease: EASE, overwrite: true, clearProps: 'transform' }); // bez transformu menu fixed na telefonie zajmuje cały ekran
        if (reduced()) gsap.set(bar, { yPercent: 0 });
      } else if (hasGsap) {
        gsap.set(bar, { clearProps: 'transform' });
        gsap.set(bar, { opacity: 1 });
      }
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* Podświetlenie linku sekcji, w której jesteśmy */
  function initCurrentSection() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = map[en.target.id];
        if (!a) return;
        if (en.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('is-current'); l.removeAttribute('aria-current'); });
          a.classList.add('is-current');
          a.setAttribute('aria-current', 'true');
        } else if (a.classList.contains('is-current')) {
          a.classList.remove('is-current');
          a.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* =========================================================
     ANIMACJE SEKCJI
     ========================================================= */
  function initAnimations() {
    var mm = gsap.matchMedia();

    mm.add({ motion: '(prefers-reduced-motion: no-preference)', still: '(prefers-reduced-motion: reduce)' }, function (ctx) {
      var still = ctx.conditions.still;

      heroIntro(still);
      reveals(still);
      cardGroups(still);
      aboutWords(still);
      splitPhotos(still);
      bulletOs(still);
      matchCard(still);
      band(still);
      contact(still);
      footer(still);
    });
  }

  /* 2. Hero po załadowaniu */
  function heroIntro(still) {
    var bar = document.querySelector('.site-header__bar');
    var lines = gsap.utils.toArray('.hero__title .line > span');
    var tiles = gsap.utils.toArray('.hero__tiles > .tile');
    var img = document.querySelector('.hero__img');

    if (still) {
      gsap.set(lines, { yPercent: 0, y: 0 });
      gsap.fromTo([bar].concat(tiles), { opacity: 0 }, { opacity: 1, duration: 0.3 });
      return;
    }
    var tl = gsap.timeline({ defaults: { ease: EASE } });
    if (img) tl.fromTo(img, { scale: 1.08 }, { scale: 1, duration: 1.6, ease: 'power2.out' }, 0);
    tl.fromTo(bar, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.1)
      .fromTo(lines, { yPercent: 105, y: 0 }, { yPercent: 0, y: 0, duration: 1, stagger: 0.1, ease: 'power4.out' }, 0.15)
      .fromTo(tiles, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: DUR, stagger: 0.08 }, 0.4);
  }

  /* 1. Nagłówki, akapity – wjazd od dołu, raz, przy 85% */
  function reveals(still) {
    ScrollTrigger.batch('.reveal', {
      start: 'top 85%',
      once: true,
      onEnter: function (els) {
        gsap.fromTo(els, still ? { opacity: 0 } : { opacity: 0, y: RISE },
          { opacity: 1, y: 0, duration: still ? 0.3 : DUR, ease: EASE, stagger: still ? 0 : 0.12, overwrite: true });
      }
    });
  }

  /* 8 + karty: każda grupa kart wjeżdża po kolei */
  function cardGroups(still) {
    var groups = [
      { sel: '.points [data-anim="card"]', stagger: 0.15 },
      { sel: '.skills__grid [data-anim="card"]', stagger: 0.1, icon: '.skill__icon' },
      { sel: '.process__track [data-anim="card"]', stagger: 0.12, x: true },
      { sel: '.steps [data-anim="card"]', stagger: 0.12 }
    ];
    groups.forEach(function (g) {
      var els = gsap.utils.toArray(g.sel);
      if (!els.length) return;
      if (still) {
        ScrollTrigger.create({ trigger: els[0], start: 'top 85%', once: true, onEnter: function () { gsap.to(els, { opacity: 1, duration: 0.3 }); } });
        return;
      }
      var tl = gsap.timeline({ scrollTrigger: { trigger: els[0], start: 'top 88%', once: true } });
      tl.fromTo(els, g.x ? { opacity: 0, x: 80 } : { opacity: 0, y: RISE },
        { opacity: 1, x: 0, y: 0, duration: DUR, ease: EASE, stagger: g.stagger, clearProps: 'transform' });
      if (g.icon) {
        tl.fromTo(els.map(function (e) { return e.querySelector(g.icon); }).filter(Boolean),
          { scale: 0.6, rotate: -12 }, { scale: 1, rotate: 0, duration: 0.8, ease: 'back.out(2)', stagger: g.stagger }, 0.3);
      }
    });
  }

  /* 4. O nas – szara część zdania ciemnieje słowo po słowie */
  function aboutWords(still) {
    var muted = document.querySelector('.about__lead-muted');
    if (!muted) return;
    if (!muted.dataset.split) {
      // dzielimy tylko po zwykłych spacjach, twarde spacje (po i, w, z…) zostają w słowie
      var words = muted.textContent.split(' ');
      muted.textContent = '';
      words.forEach(function (w, i) {
        var s = document.createElement('span');
        s.className = 'word';
        s.textContent = w;
        muted.appendChild(s);
        if (i < words.length - 1) muted.appendChild(document.createTextNode(' '));
      });
      muted.dataset.split = '1';
    }
    var spans = muted.querySelectorAll('.word');
    if (still) { gsap.set(spans, { color: '#0B1026' }); return function () { gsap.set(spans, { clearProps: 'color' }); }; }
    gsap.fromTo(spans, { color: '#7B84A0' }, {
      color: '#0B1026', ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: muted, start: 'top 80%', end: 'top 40%', scrub: true }
    });
  }

  /* 5. O nas – połówki zdjęć dosuwają się wzdłuż cięcia 40° (efekt wow) */
  function splitPhotos(still) {
    var split = document.querySelector('[data-split]');
    if (!split || still) return;
    gsap.fromTo(split, { '--sep': '120px' }, {
      '--sep': '0px', ease: 'none',
      scrollTrigger: { trigger: split, start: 'top 95%', end: 'center 55%', scrub: 0.6 }
    });
    gsap.fromTo(gsap.utils.toArray('[data-split] .chip'), { opacity: 0, y: 10 }, {
      opacity: 1, y: 0, duration: 0.5, ease: EASE, stagger: 0.1,
      scrollTrigger: { trigger: split, start: 'center 70%', once: true }
    });
  }

  /* 6. Punktory – połówki małego O złączają się */
  function bulletOs(still) {
    if (still) return;
    gsap.utils.toArray('.point').forEach(function (p) {
      var top = p.querySelector('.o-top');
      var bottom = p.querySelector('.o-bottom');
      if (!top || !bottom) return;
      // 3 px na ekranie ≈ 16 jednostek w viewBox 128 przy 24 px szerokości
      gsap.timeline({ scrollTrigger: { trigger: p, start: 'top 85%', once: true } })
        .fromTo(top, { x: -10, y: -13 }, { x: 0, y: 0, duration: 0.5, ease: EASE }, 0.25)
        .fromTo(bottom, { x: 10, y: 13 }, { x: 0, y: 0, duration: 0.5, ease: EASE }, 0.25);
    });
  }

  /* Dla kogo – karta wjeżdża, kolumny pojawiają się po kolei */
  function matchCard(still) {
    var cols = gsap.utils.toArray('.match__col');
    if (!cols.length) return;
    if (still) return;
    gsap.fromTo(cols, { opacity: 0, y: RISE }, {
      opacity: function (i, el) { return el.style.opacity || 1; }, y: 0, duration: DUR, ease: EASE, stagger: 0.12,
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: '.match__cols', start: 'top 85%', once: true }
    });
    // zdjęcie lekko się oddala, a pas środkowy rozszerza w trakcie przewijania
    var photo = document.querySelector('.match__photo');
    if (photo) {
      gsap.fromTo('.match__img', { scale: 1.12 }, { scale: 1, ease: 'none',
        scrollTrigger: { trigger: photo, start: 'top bottom', end: 'center center', scrub: true } });
      gsap.fromTo(photo, { '--narrow': '100px' }, { '--narrow': '0px', ease: 'none',
        scrollTrigger: { trigger: photo, start: 'top bottom', end: 'center center', scrub: true } });
    }
    gsap.fromTo('.match__side', { opacity: 0 }, {
      opacity: 1, duration: 0.6, stagger: 0.1,
      scrollTrigger: { trigger: '.match__photo', start: 'top 75%', once: true }
    });
  }

  /* 9. Pasek ze zdjęciem – paralaksa, karty pytań, cyfry wskakują */
  function band(still) {
    var media = document.querySelector('.band__media');
    var qs = gsap.utils.toArray('.question');
    if (still) {
      ScrollTrigger.create({ trigger: '.questions', start: 'top 90%', once: true, onEnter: function () { gsap.to(qs, { opacity: 1, duration: 0.3 }); } });
      return;
    }
    if (media) {
      gsap.fromTo(media, { yPercent: 0 }, {
        yPercent: -6, ease: 'none',
        scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
    var tl = gsap.timeline({ scrollTrigger: { trigger: '.questions', start: 'top 90%', once: true } });
    tl.fromTo(qs, { opacity: 0, y: RISE }, { opacity: 1, y: 0, duration: DUR, ease: EASE, stagger: 0.15 })
      .fromTo(qs.map(function (q) { return q.querySelector('.question__no'); }), { scale: 0.6 },
        { scale: 1, duration: 0.5, ease: 'back.out(3)', stagger: 0.12 }, 0.2);
  }

  /* Kontakt – karta formularza i lista kroków */
  function contact(still) {
    var card = document.querySelector('.contact__card');
    if (!card || still) return;
    gsap.fromTo(card, { y: 48 }, {
      y: 0, ease: 'none',
      scrollTrigger: { trigger: '#kontakt', start: 'top bottom', end: 'top 30%', scrub: true }
    });
  }

  /* 12. Stopka – logo widoczne od razu; po obrysie krąży subtelna limonkowa poświata (CSS) */
  function footer(still) {
    var mark = document.querySelector('.footer__mark');
    if (!mark || mark.querySelector('.footer__glow')) return;
    var ns = 'http://www.w3.org/2000/svg';
    var g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'footer__glow');
    mark.querySelectorAll('.footer__stroke').forEach(function (p, i) {
      var c = document.createElementNS(ns, 'path');
      c.setAttribute('d', p.getAttribute('d'));
      c.setAttribute('pathLength', '1');
      c.style.setProperty('--i', String(i));
      g.appendChild(c);
    });
    mark.appendChild(g);
    if (still) return;
    gsap.fromTo('.footer__top, .footer__bottom', { opacity: 0, y: 16 }, {
      opacity: 1, y: 0, duration: DUR, ease: EASE, stagger: 0.12,
      scrollTrigger: { trigger: '.footer', start: 'top 90%', once: true }
    });
  }

  /* =========================================================
     PASEK „ZAUFAŁY NAM” – na komputerze logotypy wchodzą po kolei,
     poniżej 1024 px przesuwają się w pętli (marquee)
     ========================================================= */
  function initTrust(hasGsap) {
    var trust = document.querySelector('[data-trust]');
    if (!trust || !hasGsap) return;
    var viewport = trust.querySelector('.trust__viewport');
    var list = trust.querySelector('.trust__list');
    var items = gsap.utils.toArray(list.children);
    var label = trust.querySelector('.trust__label');

    // wjazd przy starcie strony (po kaflach hero)
    if (reduced()) {
      gsap.fromTo([label].concat(items), { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.2 });
    } else {
      gsap.timeline({ delay: 0.75 })
        .fromTo(label, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.6, ease: EASE })
        .fromTo(items, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: EASE, stagger: 0.07, clearProps: 'transform' }, 0.1);
    }

    var mm = gsap.matchMedia();
    mm.add('(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)', function () {
      var track = document.createElement('div');
      track.className = 'trust__track';
      var clone = list.cloneNode(true);
      clone.classList.add('trust__list--clone');
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('aria-labelledby');
      clone.querySelectorAll('svg').forEach(function (s) { s.removeAttribute('role'); s.removeAttribute('aria-label'); });
      gsap.set(clone.children, { opacity: 1 });
      viewport.appendChild(track);
      track.appendChild(list);
      track.appendChild(clone);
      trust.classList.add('is-marquee');
      var tween = gsap.to(track, {
        x: function () { return -list.offsetWidth; },
        duration: function () { return list.offsetWidth / 40; },   // ok. 40 px/s
        ease: 'none', repeat: -1
      });
      // zatrzymanie, gdy pasek jest poza ekranem albo pod palcem
      var st = ScrollTrigger.create({ trigger: trust, start: 'top bottom', end: 'bottom top', onToggle: function (self) { self.isActive ? tween.play() : tween.pause(); } });
      function pause() { tween.pause(); }
      function play() { if (st.isActive) tween.play(); }
      trust.addEventListener('pointerenter', pause);
      trust.addEventListener('pointerleave', play);
      return function () {
        tween.kill(); st.kill();
        trust.removeEventListener('pointerenter', pause);
        trust.removeEventListener('pointerleave', play);
        viewport.appendChild(list);
        track.remove();
        trust.classList.remove('is-marquee');
      };
    });
  }

  /* =========================================================
     7. SUWAK WIN–WIN (Dla kogo)
     ========================================================= */
  function initWinWin(hasGsap) {
    var match = document.querySelector('[data-match]');
    var box = document.querySelector('[data-winwin]');
    var handle = document.querySelector('[data-winwin-handle]');
    var label = document.querySelector('[data-winwin-label]');
    if (!match || !box || !handle) return;
    var photo = match.querySelector('.match__photo');
    var colBiz = match.querySelector('[data-col="biz"]');
    var colSport = match.querySelector('[data-col="sport"]');
    var ends = box.querySelectorAll('.winwin__end');
    var switches = match.querySelectorAll('[data-switch]');
    var labelDefault = label ? label.innerHTML : '';
    var state = { pos: 50 };
    var target = 50;          // dokąd zmierza uchwyt podczas przeciągania (uchwyt dogania go płynnie)
    var currentLabel = 'both';
    var veilL = match.querySelector('.match__veil--left');
    var veilR = match.querySelector('.match__veil--right');
    var geo = { full: 0, max: 0 };
    // kolumny zmieniają przezroczystość co klatkę – bez przejścia CSS, które by je opóźniało
    [colBiz, colSport].forEach(function (c) { c.style.transition = 'none'; });

    function measure() {
      var w = photo.clientWidth;
      var t = photo.clientHeight * 0.839;
      geo.full = w / 2 + 120 + t / 2 + 160;   // tyle trzeba, żeby zasłona zniknęła całkiem
      geo.max = Math.max(0, (box.clientWidth - handle.offsetWidth) / 2 - 8);
    }
    function maxX() { return geo.max; }

    function render() {
      var pos = state.pos;
      var toBiz = clamp((50 - pos) / 50, 0, 1);     // 0..1
      var toSport = clamp((pos - 50) / 50, 0, 1);
      // zasłony i uchwyt przesuwamy transformem – to liczy karta graficzna, więc jest płynnie
      if (veilL) veilL.style.transform = 'translate3d(' + (-toBiz * geo.full).toFixed(1) + 'px,0,0)';
      if (veilR) veilR.style.transform = 'translate3d(' + (toSport * geo.full).toFixed(1) + 'px,0,0)';
      handle.style.transform = 'translate3d(calc(-50% + ' + (((pos - 50) / 50) * geo.max).toFixed(1) + 'px),0,0)';
      colSport.style.opacity = (1 - 0.55 * toBiz).toFixed(3);
      colBiz.style.opacity = (1 - 0.55 * toSport).toFixed(3);
      if (ends[0]) ends[0].style.opacity = (1 - toBiz).toFixed(3);
      if (ends[1]) ends[1].style.opacity = (1 - toSport).toFixed(3);

      var key = pos <= 25 ? 'biz' : pos >= 75 ? 'sport' : 'both';
      if (key !== currentLabel) {
        currentLabel = key;
        if (label) {
          if (key === 'both') label.innerHTML = labelDefault;
          else label.textContent = key === 'biz' ? 'Dla firm' : 'Dla sportu';
          if (hasGsap && !reduced()) gsap.fromTo(label, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: EASE });
        }
        match.classList.toggle('is-biz', key === 'biz');
        match.classList.toggle('is-sport', key === 'sport');
        handle.setAttribute('aria-valuetext', key === 'biz' ? 'Dla firm' : key === 'sport' ? 'Dla sportu' : 'Obie strony');
        switches.forEach(function (b) {
          var v = +b.getAttribute('data-switch');
          b.setAttribute('aria-pressed', String((v === 0 && key === 'biz') || (v === 100 && key === 'sport')));
        });
      }
      handle.setAttribute('aria-valuenow', String(Math.round(pos)));
    }

    // podążanie za palcem/myszą z lekką bezwładnością
    var follow = 0;
    function followLoop() {
      var d = target - state.pos;
      if (Math.abs(d) < 0.05) { state.pos = target; render(); follow = 0; return; }
      state.pos += d * 0.25;
      render();
      follow = requestAnimationFrame(followLoop);
    }
    function chase() {
      if (reduced()) { state.pos = target; render(); return; }
      if (!follow) follow = requestAnimationFrame(followLoop);
    }

    function goTo(to, dur) {
      to = clamp(to, 0, 100);
      target = to;
      cancelAnimationFrame(follow); follow = 0;
      if (hasGsap && dur > 0 && !reduced()) {
        gsap.to(state, { pos: to, duration: dur, ease: 'power3.out', overwrite: true, onUpdate: render });
      } else {
        if (hasGsap) gsap.killTweensOf(state);
        state.pos = to;
        render();
      }
    }
    function snap() {
      var p = target;
      var t = p < 25 ? 0 : p > 75 ? 100 : 50;
      if (reduced()) return;   // przy „mniej ruchu” bez docierania do punktów
      goTo(t, 0.7);
    }

    // Przeciąganie: mysz i palec (Pointer Events)
    var dragging = false, startX = 0, startPos = 50;
    function onDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      startPos = state.pos;
      target = state.pos;
      if (hasGsap) gsap.killTweensOf(state);
      box.classList.add('is-dragging');
      handle.setPointerCapture && handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    }
    function onMove(e) {
      if (!dragging) return;
      var mx = maxX() || 1;
      target = clamp(startPos + ((e.clientX - startX) / mx) * 50, 0, 100);
      chase();
    }
    function onUp() {
      if (!dragging) return;
      dragging = false;
      box.classList.remove('is-dragging');
      cancelAnimationFrame(follow); follow = 0;
      state.pos = target;   // snap startuje z miejsca, w którym jest palec
      snap();
    }
    handle.addEventListener('pointerdown', onDown);
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
    handle.addEventListener('lostpointercapture', onUp);

    // Kliknięcie w napis „Dla firm” / „Dla sportu” na pigułce
    box.addEventListener('click', function (e) {
      var end = e.target.closest('.winwin__end');
      if (!end) return;
      goTo(end.classList.contains('winwin__end--left') ? (state.pos === 0 ? 50 : 0) : (state.pos === 100 ? 50 : 100), 0.8);
    });

    // Klawiatura
    handle.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 25 : 10;
      var t = null;
      switch (e.key) {
        case 'ArrowLeft': case 'ArrowDown': t = state.pos - step; break;
        case 'ArrowRight': case 'ArrowUp': t = state.pos + step; break;
        case 'PageDown': t = state.pos - 50; break;
        case 'PageUp': t = state.pos + 50; break;
        case 'Home': t = 0; break;
        case 'End': t = 100; break;
      }
      if (t === null) return;
      e.preventDefault();
      goTo(t, 0.35);
    });

    // Przełączniki na telefonie
    switches.forEach(function (b) {
      b.addEventListener('click', function () {
        var v = +b.getAttribute('data-switch');
        var on = b.getAttribute('aria-pressed') === 'true';
        goTo(on ? 50 : v, 0.8);
      });
    });

    window.addEventListener('resize', function () { measure(); render(); });
    if (window.ResizeObserver) new ResizeObserver(function () { measure(); render(); }).observe(photo);
    measure();
    render();

    // Jednorazowe kiwnięcie uchwytem ±20 px, gdy sekcja pierwszy raz wejdzie w kadr
    if (hasGsap) {
      ScrollTrigger.create({
        trigger: box, start: 'top 80%', once: true,
        onEnter: function () {
          if (reduced() || dragging || state.pos !== 50 || !box.offsetWidth) return;
          var px = 20 / (maxX() || 1) * 50;   // 20 px w jednostkach 0–100
          gsap.timeline({ onUpdate: render })
            .to(state, { pos: 50 - px, duration: 0.35, ease: 'power2.out' }, 0.3)
            .to(state, { pos: 50 + px, duration: 0.5, ease: 'power2.inOut' })
            .to(state, { pos: 50, duration: 0.45, ease: 'power3.out' });
        }
      });
    }
  }

  /* =========================================================
     10. JAK DZIAŁAMY – oś czasu
     ========================================================= */
  function initProcess(hasGsap) {
    var section = document.querySelector('[data-process]');
    if (!section) return;
    var pin = section.querySelector('[data-process-pin]');
    var viewport = section.querySelector('[data-process-viewport]');
    var track = section.querySelector('[data-process-track]');
    var stages = Array.prototype.slice.call(track.children);
    var counter = section.querySelector('[data-process-current]');
    var prev = section.querySelector('[data-process-prev]');
    var next = section.querySelector('[data-process-next]');
    var n = stages.length;
    var active = 0;
    var pinST = null;   // ScrollTrigger, gdy sekcja jest przyklejona
    var navLock = false; // podczas przewijania strzałkami nie przełączamy etapów pośrednich

    function setActive(i) {
      i = clamp(i, 0, n - 1);
      if (i === active && stages[i].classList.contains('is-active')) return;
      active = i;
      stages.forEach(function (s, k) {
        s.classList.toggle('is-active', k === i);
        s.classList.toggle('is-done', k < i);
      });
      if (counter) counter.textContent = String(i + 1).padStart(2, '0');
      prev.disabled = i === 0;
      next.disabled = i === n - 1;
      prev.classList.toggle('is-on', i > 0);
      if (hasGsap && !reduced()) {
        var o = stages[i].querySelector('.stage__o');
        if (o) gsap.fromTo(o, { scale: 0.7, rotate: -40 }, { scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(2.5)', transformOrigin: '50% 50%' });
      }
    }

    function step() { return stages.length > 1 ? stages[1].offsetLeft - stages[0].offsetLeft : 0; }

    // Natywne przewijanie (telefon, tablet, „mniej ruchu”)
    var raf = 0;
    viewport.addEventListener('scroll', function () {
      if (pinST) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        var st = step() || 1;
        var max = viewport.scrollWidth - viewport.clientWidth;
        var i = viewport.scrollLeft >= max - 4 ? n - 1 : Math.round(viewport.scrollLeft / st);
        setActive(i);
      });
    }, { passive: true });

    function goTo(i) {
      i = clamp(i, 0, n - 1);
      if (pinST) {
        // ten sam przelicznik co w onUpdate: etap i ⇔ postęp i / (n - 1)
        var y = pinST.start + (i / (n - 1)) * (pinST.end - pinST.start);
        setActive(i);
        navLock = true;
        smoothScrollTo(y, 0.8, function () { navLock = false; }, 'power2.out');   // scrub osi dodaje miękki start
      } else {
        viewport.scrollTo({ left: stages[i].offsetLeft - stages[0].offsetLeft, behavior: reduced() ? 'auto' : 'smooth' });
        setActive(i);
      }
    }
    prev.addEventListener('click', function () { goTo(active - 1); });
    next.addEventListener('click', function () { goTo(active + 1); });

    setActive(0);

    if (!hasGsap) return;

    // Komputer: przyklejenie sekcji i przesuw osi w poziomie
    var mm = gsap.matchMedia();
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', function () {
      section.classList.add('is-pinned');
      viewport.scrollLeft = 0;
      function distance() {
        var vpRect = viewport.getBoundingClientRect();
        var padL = parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
        var lastRight = stages[n - 1].offsetLeft + stages[n - 1].offsetWidth;   // względem tracka
        // ostatnia karta kończy się przy prawej krawędzi kontenera (tam gdzie zaczyna się lewy margines)
        return Math.max(0, padL + lastRight - (vpRect.width - padL));
      }
      var tween = gsap.to(track, {
        x: function () { return -distance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: function () { return '+=' + Math.max(600, distance() * 1.1); },
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: function (self) {
            // etap aktywny = postęp przewijania podzielony na 5 równych części
            if (!navLock) setActive(Math.round(self.progress * (n - 1)));
          }
        }
      });
      pinST = tween.scrollTrigger;
      return function () {
        pinST = null;
        section.classList.remove('is-pinned');
        gsap.set(track, { clearProps: 'transform' });
        setActive(0);
      };
    });
  }
})();
