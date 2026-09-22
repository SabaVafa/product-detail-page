/* ============================================================
   chrome.js — shared PDP chrome behaviour
   ------------------------------------------------------------
   Grabbed from PLP/briefkasten.html's inline <script>.
   Five self-contained IIFEs:
     1. Mobile / tablet slide-in nav toggle (#mobileNav)
     2. Scroll-shrink → body.is-scrolled (desktop Kategorien pill)
     3. Tablet nav fit (hide overflowing category links)
     4. Rich mega-menu (intent hover, click/touch, keyboard, ARIA)
     5. Three-tier responsive search placeholder
   No dependencies beyond the markup in index.html.
   ============================================================ */

/* ===== Mobile / tablet nav toggle ===== */
(function(){
  var toggles = document.querySelectorAll('[data-nav-toggle]');
  var panel   = document.getElementById('mobileNav');
  if (!toggles.length || !panel) return;
  function setExpanded(v){ toggles.forEach(function(t){ t.setAttribute('aria-expanded', v?'true':'false'); }); }
  function syncTop(){
    var header = document.querySelector('.header');
    var inner = panel.querySelector('.mobile-nav__panel');
    if (header && inner) inner.style.top = Math.max(0, header.getBoundingClientRect().bottom) + 'px';
  }
  function open(){ syncTop(); panel.classList.add('is-open'); panel.setAttribute('aria-hidden','false'); setExpanded(true); document.body.style.overflow='hidden'; }
  function close(){ panel.classList.remove('is-open'); panel.setAttribute('aria-hidden','true'); setExpanded(false); document.body.style.overflow=''; }
  function toggle(){ panel.classList.contains('is-open') ? close() : open(); }
  toggles.forEach(function(t){ t.addEventListener('click', toggle); });
  panel.querySelectorAll('[data-close], a').forEach(function(el){ el.addEventListener('click', close); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') close(); });
})();

/* ===== Scroll-shrink: body.is-scrolled at any scroll position ===== */
(function(){
  var ticking = false;
  function update(){ document.body.classList.toggle('is-scrolled', window.scrollY > 0); ticking = false; }
  window.addEventListener('scroll', function(){ if(!ticking){ window.requestAnimationFrame(update); ticking = true; } }, { passive:true });
  update();
})();

/* ===== Tablet nav fit: hide category links that don't fit on one line ===== */
(function(){
  var nav = document.querySelector('.header__nav'); if(!nav) return;
  var ul = nav.querySelector('ul'); if(!ul) return;
  var items = Array.prototype.slice.call(ul.children);
  var tabletMq = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
  function reset(){ items.forEach(function(li){ li.hidden = false; }); }
  function fit(){
    reset(); if(!tabletMq.matches) return;
    for (var i = items.length - 1; i >= 0; i--){ if (ul.scrollWidth <= ul.clientWidth + 1) break; items[i].hidden = true; }
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit); else window.addEventListener('load', fit);
  fit();
  var raf; window.addEventListener('resize', function(){ cancelAnimationFrame(raf); raf = requestAnimationFrame(fit); });
})();

/* ===== Rich mega-menu: intent-based hover, click/touch, keyboard, ARIA ===== */
(function(){
  var DESKTOP     = window.matchMedia('(min-width: 768px)');   /* mega is active on tablet+ (≤767 uses the slide-in nav) */
  var OPEN_DELAY  = 100;   /* ms — ignore incidental pass-through hovers */
  var CLOSE_DELAY = 150;   /* ms — grace period that bridges diagonal cursor paths (anti-tunneling) */

  var items = [].slice.call(document.querySelectorAll('[data-mega-item]'));
  if (!items.length) return;

  var openTimer, closeTimer, current = null;
  var panelOf   = function(i){ return i.querySelector('[data-mega-panel]'); };
  var triggerOf = function(i){ return i.querySelector('[data-mega-trigger]'); };

  /* Single source of truth: class drives the CSS transition, ARIA drives assistive tech */
  function setState(item, isOpen){
    panelOf(item).classList.toggle('is-open', isOpen);
    panelOf(item).setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    triggerOf(item).setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }
  function open(item){
    if (current === item) return;
    if (current) setState(current, false);     /* instant switch — no reopen delay */
    setState(item, true);
    current = item;
  }
  function close(item){
    setState(item, false);
    if (current === item) current = null;
  }

  items.forEach(function(item){
    var trig = triggerOf(item);

    /* Pointer: delayed open, grace-delayed close */
    item.addEventListener('mouseenter', function(){
      if (!DESKTOP.matches) return;
      clearTimeout(closeTimer);
      if (current && current !== item) { open(item); return; }   /* already browsing → switch now */
      openTimer = setTimeout(function(){ open(item); }, OPEN_DELAY);
    });
    item.addEventListener('mouseleave', function(){
      if (!DESKTOP.matches) return;
      clearTimeout(openTimer);
      closeTimer = setTimeout(function(){ close(item); }, CLOSE_DELAY);
    });

    /* Click / Enter / touch: a real href navigates (cross-page tab); else toggle */
    trig.addEventListener('click', function(e){
      if (!DESKTOP.matches) return;            /* mobile uses the slide-in nav */
      var href = trig.getAttribute('href');
      if (href && href !== '#') return;        /* follow the link to the other page */
      e.preventDefault();
      (current === item) ? close(item) : open(item);
    });

    /* Keyboard: close once focus leaves the item's subtree */
    item.addEventListener('focusout', function(e){
      if (!item.contains(e.relatedTarget)) close(item);
    });
  });

  /* Escape closes the active panel and restores focus to its trigger */
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && current){ var t = triggerOf(current); close(current); if (t) t.focus(); }
  });
  /* Click outside closes */
  document.addEventListener('click', function(e){
    if (current && !current.contains(e.target)) close(current);
  });
  /* Dropping below desktop collapses any open panel */
  DESKTOP.addEventListener('change', function(){ if (!DESKTOP.matches && current) close(current); });
})();

/* ===== Three-tier responsive search placeholder ===== */
(function(){
  var input = document.querySelector('.header__search input'); if(!input) return;
  var mobileMq = window.matchMedia('(max-width: 720px)');
  var tabletMq = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
  function set(){
    if (mobileMq.matches) input.placeholder = 'Produkte suchen…';
    else if (tabletMq.matches) input.placeholder = 'Suchen — Türklingel, Briefkasten…';
    else input.placeholder = 'Suchen — Türklingel, Briefkasten, Sprechanlage…';
  }
  set(); mobileMq.addEventListener('change', set); tabletMq.addEventListener('change', set);
})();

/* ===== Quickbar — mobile dropdown toggle (grabbed from the PLP) ===== */
(function(){
  var qb = document.getElementById('quickbar'); if(!qb) return;
  var toggle = qb.querySelector('.qa-mobile-toggle'); if(!toggle) return;
  toggle.addEventListener('click', function(){
    var open = qb.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  /* close the panel when tapping outside it */
  document.addEventListener('click', function(e){
    if (qb.classList.contains('is-open') && !qb.contains(e.target)) {
      qb.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* ===== Quickbar hotline notice — Sprechanlagen-Pause (direction A) =====
   State-aware hotline + progressive-disclosure popover. Date-gated: nothing
   renders outside the window, so the base markup stays honest and it auto-
   reverts on its own. Runs before pdp-b.js, so the injected [data-cm-open]
   buttons are picked up by the existing Kontakt/Termin modal wiring.
   QA override: ?notice=active | ?notice=pre | ?notice=off  */
(function(){
  var qb = document.getElementById('quickbar'); if(!qb) return;
  var tel = qb.querySelector('.qa[href^="tel:"]'); if(!tel) return;

  /* ---- Edit copy + window here ------------------------------------- */
  var NOTICE = {
    preAnnounce: '2026-09-14',   /* soft heads-up starts (inclusive) */
    start:       '2026-09-16',   /* first day not reachable (inclusive) */
    resume:      '2026-09-21',   /* back to normal (inclusive) → revert */
    badge:       '16.–18.09. nicht besetzt',
    badgePre:    '16.–18.09. nicht besetzt',    /* full range in both phases */
    hours:       'Mo–Fr. 09:00–16:00 Uhr',      /* availability shown next to the number */
    title:       'Sprechanlagen & Sicherheitstechnik: 16.–18.09.2026 nicht erreichbar',
    body:        'Hotline und Ticket-Support pausieren wegen einer internen Schulung. <strong>Ab 21.09.</strong> wieder wie gewohnt für Sie da. Alle anderen Produktbereiche sind normal erreichbar.',
    sr:          'Sprechanlagen-Hotline – 16. bis 18.09.2026 nicht besetzt, ab 21.09. wieder erreichbar.'
  };

  function day(s){ return new Date(s + 'T00:00:00'); }
  function state(){
    var q = new URLSearchParams(location.search).get('notice');
    if (q === 'off') return null;
    if (q === 'active' || q === 'pre') return q;
    var now = new Date(); now.setHours(0,0,0,0);
    if (now >= day(NOTICE.resume))      return null;
    if (now >= day(NOTICE.start))       return 'active';
    if (now >= day(NOTICE.preAnnounce)) return 'pre';
    return null;
  }
  var mode = state(); if(!mode) return;

  var ICON_WARN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  var ICON_X    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var ICON_CHEV = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  /* ---- Paused hotline item ---------------------------------------- */
  /* Keep the family's own phone glyph + the number readable (NOT struck) — the
     bar runs before/through the pause while the line is still reachable; the
     gold pill + availability hours carry the state. */
  qb.classList.add('is-paused');
  tel.classList.add('is-paused');
  tel.setAttribute('aria-label', NOTICE.sr);
  var meta = tel.querySelector('.qa-meta');
  if (meta && NOTICE.hours) meta.insertAdjacentHTML('beforeend', '<span class="qa-hours">' + NOTICE.hours + '</span>');

  /* ---- Wrap the hotline; the gold "Pause" chip IS the Details toggle,
     so badge + trigger stay one unit next to the number. --------------- */
  var host = document.createElement('span'); host.className = 'qa-notice-host';
  tel.parentNode.insertBefore(host, tel); host.appendChild(tel);

  var pill = document.createElement('button');
  pill.className = 'qa-pausebtn'; pill.type = 'button'; pill.id = 'hotlineDetailBtn';
  pill.setAttribute('aria-controls', 'hotlineDetail'); pill.setAttribute('aria-expanded', 'false');
  pill.innerHTML = '<span>' + (mode === 'pre' ? NOTICE.badgePre : NOTICE.badge) + '</span>' + ICON_CHEV;
  host.appendChild(pill);

  /* ---- Full-width strip that expands down from the bar ------------- */
  var expand = document.createElement('div');
  expand.className = 'qa-expand'; expand.id = 'hotlineDetail';
  expand.setAttribute('role', 'region'); expand.setAttribute('aria-label', NOTICE.title); expand.setAttribute('aria-hidden', 'true');
  expand.innerHTML =
    '<div class="container qa-expand__inner">' +
      '<span class="qa-expand__icon">' + ICON_WARN + '</span>' +
      '<div class="qa-expand__text">' +
        '<div class="qa-expand__title">' + NOTICE.title + '</div>' +
        '<div class="qa-expand__body">' + NOTICE.body + '</div>' +
      '</div>' +
      '<button class="qa-expand__close" type="button" data-detail-close aria-label="Hinweis schließen">' + ICON_X + '</button>' +
    '</div>';
  expand.inert = true;                       /* collapsed → out of tab order */
  var inner = qb.querySelector('.quickbar-inner');
  if (inner && inner.parentNode) inner.parentNode.insertBefore(expand, inner.nextSibling); else qb.appendChild(expand);

  /* ---- Mobile banner (inside the dropdown panel) ------------------- */
  var panel = qb.querySelector('.qa-panel');
  if (panel) {
    /* Message only — the panel's own Termin / FAQ rows sit right below, so
       in-banner action buttons would just duplicate them. */
    var mb = document.createElement('div');
    mb.className = 'qa-notice-mobile'; mb.setAttribute('role', 'status');
    mb.innerHTML =
      '<div class="qa-notice-mobile__head">' + ICON_WARN + '<div class="qa-notice-mobile__title">' + NOTICE.title + '</div></div>' +
      '<div class="qa-notice-mobile__body">' + NOTICE.body + '</div>';
    panel.insertBefore(mb, panel.firstChild);
  }

  /* ---- Pill on the collapsed mobile toggle (instead of a dot) ------ */
  var lbl = qb.querySelector('.qa-mobile-toggle > span');
  if (lbl) lbl.insertAdjacentHTML('beforeend', '<span class="qa-togglepill">' + (mode === 'pre' ? NOTICE.badgePre : NOTICE.badge) + '</span>');

  /* ---- Toggle behaviour — click only, no hover -------------------- */
  var DESKTOP = window.matchMedia('(min-width: 768px)');
  function isOpen(){ return qb.classList.contains('is-notice-open'); }
  /* Animate to the measured content height, then release to auto so the strip
     stays correct if the viewport/content reflows while open. The start height
     is committed synchronously (forced reflow) before the target is set, so the
     final value is always applied even if rendering is throttled — no rAF that
     could be starved in a background tab. */
  function openDetail(){
    clearTimeout(expand._t); expand.classList.remove('is-closing');
    qb.classList.add('is-notice-open'); pill.setAttribute('aria-expanded', 'true');
    expand.setAttribute('aria-hidden', 'false'); expand.inert = false;
    expand.style.height = '0px'; void expand.offsetHeight;      /* commit start */
    expand.style.height = expand.scrollHeight + 'px';           /* animate open */
    expand._t = setTimeout(function(){ if (isOpen()) expand.style.height = 'auto'; }, 480);
  }
  function closeDetail(){
    clearTimeout(expand._t);
    expand.style.height = expand.scrollHeight + 'px'; void expand.offsetHeight;  /* commit start from auto */
    expand.classList.add('is-closing');
    qb.classList.remove('is-notice-open'); pill.setAttribute('aria-expanded', 'false');
    expand.setAttribute('aria-hidden', 'true');
    expand.style.height = '0px';                                /* animate closed */
    expand._t = setTimeout(function(){ if (!isOpen()) { expand.inert = true; expand.classList.remove('is-closing'); } }, 360);
  }
  function toggleDetail(){ isOpen() ? closeDetail() : openDetail(); }

  pill.addEventListener('click', function(e){ e.preventDefault(); toggleDetail(); });
  tel.addEventListener('click', function(e){ if(!DESKTOP.matches) return;    /* paused → the number can't be called, so reveal the detail instead */
    e.preventDefault(); toggleDetail(); });
  expand.querySelector('[data-detail-close]').addEventListener('click', function(e){ e.preventDefault(); closeDetail(); pill.focus(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && isOpen()) closeDetail(); });
})();
