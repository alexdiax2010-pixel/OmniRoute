/* =========================================================
   cinema.js — Entrada cinematográfica + efectos de scroll (vanilla, sin dependencias)

   Uso en cada página (ver cinema.css para los ganchos data-cine-*):

   <html lang="es-MX" data-cine="potente" data-cine-nombre="Frenos Frescos" data-cine-lema="Zapopan">
   <head>
     ...
     <link rel="stylesheet" href="../../shared/cinema.css">
     <script>(function(){try{var d=document.documentElement;if(matchMedia('(prefers-reduced-motion: reduce)').matches||sessionStorage.getItem('cine-visto:'+location.pathname))return;d.classList.add('cine-on');window.__cineT=setTimeout(function(){d.classList.remove('cine-on')},4000)}catch(e){}})();</script>
   </head>
   ...
   <script src="../../shared/cinema.js" defer></script>

   - La intro solo corre si el snippet inline puso html.cine-on (1.ª visita de la sesión,
     sin prefers-reduced-motion y con sessionStorage disponible).
   - Dura < 3 s; se salta con el botón, tocando la pantalla, con la rueda o con cualquier tecla.
   ========================================================= */
(function () {
  'use strict';
  var d = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ---------------- Intro ---------------- */
  function intro() {
    if (!d.classList.contains('cine-on')) return;           // ya expiró el failsafe o no aplica
    if (window.__cineT) clearTimeout(window.__cineT);
    var estilo = d.getAttribute('data-cine') || 'potente';
    var nombre = d.getAttribute('data-cine-nombre') || document.title.split('|')[0].trim();
    var lema = d.getAttribute('data-cine-lema') || '';
    var T = {
      luminoso: { name: 160, open: 1500, close: 1050 },
      potente:  { name: 100, open: 1400, close: 850 },
      vintage:  { name: 120, open: 1450, close: 900 }
    }[estilo] || { name: 100, open: 1400, close: 850 };
    // Si arrancamos tarde (CSS/tipografías lentas), comprimimos para no pasar de ~3 s desde que abrió la página
    var ya = (window.performance && performance.now()) || 0;
    if (ya > 1800) { d.classList.remove('cine-on'); return; }
    var k = Math.max(0.55, Math.min(1, (3100 - ya) / 2900));
    T = { name: T.name * k, open: T.open * k, close: T.close * k };
    try { sessionStorage.setItem('cine-visto:' + location.pathname, '1'); } catch (e) {}

    var ov = document.createElement('div');
    ov.className = 'cine-intro';
    ov.setAttribute('aria-hidden', 'true');                 // decorativo: el nombre real está en el HTML
    var extra = '';
    if (estilo === 'luminoso') extra = '<div class="cine-flare"></div>';
    if (estilo === 'potente') extra = '<div class="cine-sweep"></div><div class="cine-rule"></div>';
    if (estilo === 'vintage') extra = '<div class="cine-frame"></div><div class="cine-vignette"></div>';
    ov.innerHTML =
      '<div class="cine-panel top"></div><div class="cine-panel bot"></div>' +
      '<div class="cine-bars"></div>' + extra +
      '<div class="cine-title"></div><div class="cine-grain"></div>';
    var t = ov.querySelector('.cine-title');
    t.textContent = nombre;
    if (lema) { var s = document.createElement('small'); s.textContent = lema; t.appendChild(s); }

    // Botón accesible fuera del aria-hidden
    var skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'cine-skip';
    skip.textContent = 'Saltar intro';
    ov.appendChild(skip);
    ov.removeAttribute('aria-hidden');
    t.setAttribute('aria-hidden', 'true');

    document.body.appendChild(ov);
    d.classList.add('cine-ready');

    var timers = [], ended = false;
    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
    function heroIn() { d.classList.add('cine-hero-in', 'cine-kb'); }
    function cleanup() {
      d.classList.remove('cine-on', 'cine-hero-in');
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      ['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach(function (ev) { window.removeEventListener(ev, onSkip, true); });
    }
    function finish(fast) {
      if (ended) return; ended = true;
      timers.forEach(clearTimeout);
      if (fast) {                                          // salto: todo visible ya
        ov.classList.add('done');
        d.classList.add('cine-kb');
        d.classList.remove('cine-on', 'cine-hero-in');
        setTimeout(cleanup, 260);
        return;
      }
      ov.classList.add('done');
      setTimeout(cleanup, 300);
    }
    function swallowClick() {                             // el toque que salta la intro no debe activar lo de abajo
      function eat(ev) { ev.preventDefault(); ev.stopPropagation(); }
      window.addEventListener('click', eat, true);
      setTimeout(function () { window.removeEventListener('click', eat, true); }, 700);
    }
    function onSkip(e) {
      if (e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift')) return; // permitir llegar al botón
      if (e.type === 'pointerdown' || e.type === 'touchmove') swallowClick();
      if (e.type === 'keydown' && /^( |Spacebar|ArrowDown|ArrowUp|PageDown|PageUp|Home|End)$/.test(e.key) && e.target === document.body) e.preventDefault();
      finish(true);
    }
    skip.addEventListener('click', function (e) { e.stopPropagation(); finish(true); });
    ['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach(function (ev) { window.addEventListener(ev, onSkip, { capture: true, passive: ev !== 'keydown' }); });

    // Línea de tiempo (total < 3 s)
    requestAnimationFrame(function () {
      at(T.name, function () {
        ov.classList.add('name');
        if (estilo === 'potente') { ov.classList.add('shake'); at(450, function () { ov.classList.add('sweep'); }); }
        if (estilo === 'vintage') ov.classList.add('flicker');
      });
      at(T.open - 260 * k, function () { ov.classList.add('out'); });   // el nombre se va antes de abrir el telón
      at(T.open, function () { ov.classList.add('open'); heroIn(); });
      at(T.open + T.close, function () { finish(false); });
      at(Math.max(1200, 2900 - ya), function () { finish(false); });   // tope duro
    });
  }

  /* ---------------- Scroll: reveal + stagger + contadores ---------------- */
  function scrollFx() {
    var nodes = [].slice.call(document.querySelectorAll('[data-cine-reveal],[data-cine-stagger],[data-cine-count]'));
    if (!nodes.length) {                                   // respaldo: secciones de <main> menos el hero
      nodes = [].slice.call(document.querySelectorAll('main > section:not([data-cine-hero]):not(.hero)'));
      nodes.forEach(function (n) { n.setAttribute('data-cine-reveal', ''); });
    }
    document.querySelectorAll('[data-cine-stagger]').forEach(function (c) {
      [].forEach.call(c.children, function (k, i) { k.style.setProperty('--cine-i', i); });
    });
    var vh = window.innerHeight;
    var introOn = d.classList.contains('cine-on');
    // Lo que ya está a la vista sin intro se muestra sin animar (evita parpadeo)
    if (!introOn) nodes.forEach(function (n) { var r = n.getBoundingClientRect(); if (r.top < vh * 0.92 && r.bottom > 0) n.classList.add('cine-in'); });
    d.classList.add('cine-js');

    if (!('IntersectionObserver' in window)) { nodes.forEach(function (n) { n.classList.add('cine-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('cine-in');
        if (en.target.hasAttribute('data-cine-count')) count(en.target);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    nodes.forEach(function (n) { if (!n.classList.contains('cine-in') || n.hasAttribute('data-cine-count')) io.observe(n); });
  }

  function count(el) {
    if (reduce || el.__cineDone) return; el.__cineDone = true;
    var txt = el.textContent, m = txt.match(/\d+/);
    if (!m) return;
    var fin = parseInt(m[0], 10), pad = m[0].length, pre = txt.slice(0, m.index), post = txt.slice(m.index + m[0].length);
    var t0 = null, dur = 1100;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), v = Math.round(fin * (1 - Math.pow(1 - p, 3)));
      el.textContent = pre + String(v).padStart(pad, '0') + post;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------------- Parallax ligero ---------------- */
  function parallax() {
    if (reduce) return;
    var els = [].slice.call(document.querySelectorAll('[data-cine-parallax]'));
    if (!els.length) return;
    var ticking = false;
    function upd() {
      ticking = false;
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var sp = parseFloat(el.getAttribute('data-cine-parallax')) || 0.08;
        var cur = parseFloat(el.style.getPropertyValue('--cine-py')) || 0;   // quita el desplazamiento ya aplicado
        var off = ((r.top - cur + r.height / 2) - vh / 2) * -sp;
        el.style.setProperty('--cine-py', off.toFixed(1) + 'px');
      });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener('resize', upd, { passive: true });
    upd();
  }

  function init() {
    try { intro(); } catch (e) { d.classList.remove('cine-on'); }
    try { scrollFx(); } catch (e) { d.classList.remove('cine-js'); }
    try { parallax(); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
