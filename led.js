/* ============================================================
   led.js — Außenleuchten PDP (Metzler LED Wandleuchte Up-Down)
   ------------------------------------------------------------
   Purpose-built, self-contained interactions for the light PDP.
   Chrome (header · nav · mega-menu · mobile-nav · quickbar) is
   handled by the shared chrome.js. Everything here is scoped to
   this page and guarded so a missing element never throws.

   Sections:
     1. Euro helper + Staffelpreis model
     2. Colour variant selection (unlocks CTA)
     3. Quantity stepper + live Staffelpreis / total
     4. Media gallery: thumbnails → main image
     5. Lightbox (all images, keyboard, strip)
     6. Sticky purchase bar (reveal past hero CTA)
     7. Share menu
     8. Add-to-cart (locked until colour chosen — README pattern)
     9. Section scroll-spy (psx-nav)
    10. Scrollytelling story (sticky image swap)
    11. Technik master–detail tabs
    12. Reviews feature carousel (built from #rvTrack)
    13. Contact modal + question modal
   ============================================================ */

/* ===== 1 · Euro helper + Staffelpreis model ===== */
var LED = (function () {
  var euroFmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  var BASE = 24.99;
  /* thresholds high→low so the first match wins */
  var TIERS = [
    { min: 6, price: 21.24, off: 15 },
    { min: 4, price: 22.49, off: 10 },
    { min: 2, price: 23.74, off: 5 },
    { min: 1, price: 24.99, off: 0 }
  ];
  function tierFor(q) {
    for (var i = 0; i < TIERS.length; i++) { if (q >= TIERS[i].min) return TIERS[i]; }
    return TIERS[TIERS.length - 1];
  }
  return {
    euro: function (n) { return euroFmt.format(n); },
    base: BASE,
    tierFor: tierFor,
    maxMin: 6
  };
})();

/* ===== Shared page state ===== */
var LEDState = { qty: 1, finish: null, article: '45161', addons: [] };

/* small dot colour per finish name (buy-box "Farbe: …" label) */
var LED_DOT = {
  'Anthrazitgrau RAL 7016': '#31373b',
  'Verkehrsweiß RAL 9016': '#f4f4f2',
  'Graualuminium RAL 9007': '#8c9196',
  'Eisenglimmer DB 703': '#3f444a',
  'Quarzgrau RAL 7039': '#6d6a60',
  'Tiefschwarz RAL 9005': '#1b1b21'
};

/* ===== Motion helpers (all guarded by prefers-reduced-motion) ===== */
function ledReduced() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

/* Tween a euro amount on an element (rolling number). Stores the last value on the
   node so the next change animates FROM it. Falls back to an instant set when the
   user prefers reduced motion, on first paint, or for a negligible delta. */
function ledTweenEuro(el, to) {
  if (!el) return;
  if (el.__raf) { cancelAnimationFrame(el.__raf); el.__raf = null; }   /* kill any in-flight tween first */
  if (el.__to) { clearTimeout(el.__to); el.__to = null; }
  var from = (typeof el.__v === 'number') ? el.__v : to;
  el.__v = to;
  if (ledReduced() || Math.abs(from - to) < 0.005) { el.textContent = LED.euro(to); return; }
  var dur = 460, t0 = performance.now();
  /* correctness guarantee: even if rAF is throttled (background tab), the exact
     final value is always written after the duration elapses */
  el.__to = setTimeout(function () { el.textContent = LED.euro(to); el.__to = null; }, dur + 80);
  el.__raf = requestAnimationFrame(function step(now) {
    var p = Math.min(1, (now - t0) / dur);
    var e = 1 - Math.pow(1 - p, 3);                 /* easeOutCubic */
    el.textContent = LED.euro(from + (to - from) * e);
    if (p < 1) { el.__raf = requestAnimationFrame(step); }
    else { el.textContent = LED.euro(to); el.__raf = null; if (el.__to) { clearTimeout(el.__to); el.__to = null; } }
  });
}
/* one-shot scale pop */
function ledBump(el) { if (!el || ledReduced()) return; el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); }
/* transient class (e.g. green flash) removed after ms */
function ledFlash(el, cls, ms) { if (!el || ledReduced()) return; el.classList.add(cls); clearTimeout(el['__' + cls]); el['__' + cls] = setTimeout(function () { el.classList.remove(cls); }, ms); }

/* ===== Next-tier upsell nudge (progress toward the best price) ===== */
var LED_NUDGE = [{ at: 2, off: 5, price: 23.74 }, { at: 4, off: 10, price: 22.49 }, { at: 6, off: 15, price: 21.24 }];
function ledRenderNudge(q, t) {
  var box = document.getElementById('ledNudge');
  if (!box) return;
  var txt = document.getElementById('ledNudgeText');
  var nxt = document.getElementById('ledNudgeNext');
  var fill = document.getElementById('ledNudgeFill');
  var next = null;
  for (var i = 0; i < LED_NUDGE.length; i++) { if (q < LED_NUDGE[i].at) { next = LED_NUDGE[i]; break; } }
  if (fill) fill.style.width = (Math.min(q, LED.maxMin) / LED.maxMin * 100).toFixed(1) + '%';
  box.classList.toggle('is-max', !next);
  /* light up each tier milestone pip once its quantity is reached */
  var dots = box.querySelectorAll('.led-nudge__dot');
  for (var di = 0; di < dots.length; di++) { dots[di].classList.toggle('is-on', q >= (+dots[di].getAttribute('data-at') || 0)); }
  if (next) {
    var need = next.at - q;
    if (txt) txt.innerHTML = 'Noch <b>' + need + '×</b> kaufen und <b>−' + next.off + ' %</b> sichern';
    if (nxt) nxt.textContent = '→ ' + LED.euro(next.price) + ' / Stück';
  } else {
    if (txt) txt.innerHTML = '<b>Bestpreis −15 %</b> erreicht – maximaler Mengenrabatt';
    if (nxt) nxt.textContent = '✓ ' + LED.euro(t.price) + ' / Stück';
  }
}

/* ===== Central price render (unit · line · sticky · staffel · nudge) ===== */
var _ledPrevMin = 1;
function ledRenderPrice(opts) {
  opts = opts || {};
  var q = LEDState.qty;
  var t = LED.tierFor(q);

  var amountEl   = document.getElementById('bUnit');       /* the one price number */
  var fromEl     = document.getElementById('bTotalFrom');  /* "ab" prefix */
  var suffixEl   = document.getElementById('bUnitSuffix'); /* "/ Stück" suffix */
  var labelEl    = document.getElementById('ledKonfLabel');/* "Preis wie konfiguriert" caption */
  var stickyAmt  = document.getElementById('bStickyAmt');
  var stickyFrom = document.getElementById('bStickyFrom');
  var linesEl    = document.getElementById('ledAddonLines');

  var unit = t.price;
  var addons = LEDState.addons || [];
  var addonsTotal = 0;
  for (var ai = 0; ai < addons.length; ai++) { addonsTotal += addons[ai].price; }
  /* The order TOTAL = Staffel-discounted unit × Menge + each flat one-time Zubehör
     (not × Menge). */
  var total = unit * q + addonsTotal;

  /* ONE stable price card (consistent with index-desc): before a colour is chosen
     it shows the per-Stück starting price with "ab …"; once a colour is chosen it
     becomes the "Preis wie konfiguriert" order total and drops the "ab" prefix and
     the "/ Stück" suffix. Only the inner text toggles — the card never swaps. */
  var configured = !!LEDState.finish;
  var display = configured ? total : unit;

  ledTweenEuro(amountEl, display);
  ledTweenEuro(stickyAmt, display);
  ledTweenEuro(document.getElementById('ledDockPrice'), display);   /* sticky bottom dock mirror */
  ledTweenEuro(document.getElementById('ledCfgPrice'), display);    /* inline configurator total */

  /* Struck reference in the bottom price section: the same configured total at the
     un-discounted base price (base × Menge + Zubehör). Shown only once a colour is
     chosen AND a Staffel tier actually lowers the price, so it reads as the saving. */
  var wasEl = document.getElementById('ledCfgWas');
  if (wasEl) {
    var reference = LED.base * q + addonsTotal;
    var saving = configured && (unit < LED.base - 0.005);
    wasEl.hidden = !saving;
    if (saving) wasEl.textContent = LED.euro(reference);
  }

  if (fromEl)     fromEl.hidden   = configured;
  if (suffixEl)   suffixEl.hidden = configured;
  if (labelEl)    labelEl.hidden  = !configured;
  if (stickyFrom) stickyFrom.style.display = configured ? 'none' : '';

  /* ----- Zubehör breakdown lines — one per selected add-on, flat & one-time ----- */
  if (linesEl) {
    linesEl.innerHTML = addons.map(function (a) {
      return '<div class="led-summary__addon-line">'
        + (a.img ? '<span class="led-summary__addon-thumb"><img src="' + a.img + '" alt="" loading="lazy"></span>' : '')
        + '<span class="led-summary__addon-name">' + a.name + '</span>'
        + '<span class="led-summary__addon-val">+ ' + LED.euro(a.price) + '</span>'
        + '</div>';
    }).join('');
  }
  var addonsBlock = document.getElementById('ledAddonsBlock');
  if (addonsBlock) addonsBlock.hidden = addons.length === 0;

  /* ----- "Ihre Konfiguration" positions (grabbed from the PDP prototype):
     the Leuchte line (finish · Menge, price = discounted unit × Menge) + one row
     per flat Zubehör, plus the position count. ----- */
  var sumList = document.getElementById('ledSumList');
  if (sumList) {
    var rows = '<div class="led-sumrow" role="listitem"><span class="led-sumrow__name"><span class="led-sumrow__qty">' + q + '&nbsp;&times;</span><span class="led-sumrow__txt"><b>Metzler LED Wandleuchte Up-Down&nbsp;| IP65 | Lichtkegel einstellbar | 9W | warmweiß 3000K | austauschbares G9 Leuchtmittel | Cube</b>'
      + '</span></span><span class="led-sumrow__price">' + LED.euro(unit * q) + '</span></div>';
    rows += addons.map(function (a) {
      /* Accessories are extras attached to the lamp, not peers of it: demoted weight
         + a leading "+" so the group reads as "the lamp, with N add-ons". */
      return '<div class="led-sumrow led-sumrow--addon" role="listitem"><span class="led-sumrow__name"><span class="led-sumrow__qty">1&nbsp;&times;</span><span class="led-sumrow__txt"><b>' + a.name + '</b></span></span><span class="led-sumrow__price">' + LED.euro(a.price) + '</span></div>';
    }).join('');
    sumList.innerHTML = rows;
    var detailsN = document.getElementById('ledDetailsN');
    /* Collapsed summary only surfaces what's hidden — bundled accessories. Just the
       lamp needs no count. */
    if (detailsN) detailsN.textContent = addons.length ? 'Leuchte + ' + addons.length + ' Zubehör' : '';
  }

  document.querySelectorAll('#ledStaffelBody tr').forEach(function (r) {
    var min = parseInt(r.getAttribute('data-min'), 10) || 1;
    r.classList.toggle('is-active', min === t.min);
  });

  /* micro-feedback: pop on any change; green flash + row pulse when a tier unlocks */
  if (!opts.initial) {
    ledBump(amountEl);
    if (opts.qtyChanged) ledBump(document.getElementById('bMainQtyVal'));
    if (t.min > _ledPrevMin) {
      ledFlash(amountEl, 'is-drop', 750);
      ledFlash(document.querySelector('#ledStaffelBody tr.is-active'), 'is-hit', 650);
    }
  }
  _ledPrevMin = t.min;

  ledRenderNudge(q, t);
}

/* ===== CTA label + pre-colour state (mirrors the prototype) =====
   No colour → "Bitte Farbe wählen"; colour chosen → "In den Warenkorb".
   The button is always a live teal CTA (never a greyed lock); the quantity
   stepper stays hidden (is-precolor) until a colour is picked. */
function ledRenderCta() {
  var label = LEDState.finish ? 'In den Warenkorb' : 'Bitte Farbe wählen';
  var cart = document.getElementById('bCart'); if (cart) cart.textContent = label;
  var dockCart = document.getElementById('ledDockCart'); if (dockCart) dockCart.textContent = label;
  var sLabel = document.getElementById('pdpStickyLabel'); if (sLabel) sLabel.textContent = label;
  /* The default CTA is "Bitte Farbe wählen" until a colour is chosen, then it
     becomes "Jetzt anpassen" (mirrors the live shop: colour first, then configure). */
  var anpassenTxt = document.getElementById('bAnpassenTxt');
  if (anpassenTxt) anpassenTxt.textContent = LEDState.finish ? 'Jetzt anpassen' : 'Bitte Farbe wählen';
  var anpassenBtn = document.getElementById('bAnpassen');
  if (anpassenBtn) anpassenBtn.classList.toggle('is-anpassen', !!LEDState.finish);
  var checkout = document.getElementById('bCheckout'); if (checkout) checkout.classList.toggle('is-precolor', !LEDState.finish);
  /* mirror the pre-colour state onto the buy-box wrapper so it can swap the price
     cards: lead "ab" card before a colour, "Preis wie konfiguriert" after. */
  var buybox = document.querySelector('.pdp-buybox'); if (buybox) buybox.classList.toggle('is-precolor', !LEDState.finish);
}

/* ===== "Jetzt anpassen" flow — mirrors the live shop =====
   Pressing "Jetzt anpassen" flips the buy box into configuring mode: the top price
   card + the button fold away, the Zubehör configurator opens, and the price moves
   into the sticky bottom dock. The dock's cart proxies the inline CTA; "Details"
   jumps to the configurator. */
(function () {
  var buybox = document.querySelector('.pdp-buybox');
  var anpassen = document.getElementById('bAnpassen');
  if (buybox && anpassen) {
    anpassen.addEventListener('click', function () {
      /* Colour is the gate — before a colour is chosen this button reads "Bitte
         Farbe wählen" and nudges the swatches instead of opening the configurator. */
      if (!LEDState.finish) {
        var sw = document.getElementById('pdpSwatches');
        if (sw) { sw.classList.remove('is-invalid'); void sw.offsetWidth; sw.classList.add('is-invalid'); sw.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        return;
      }
      buybox.classList.add('is-configuring');
      document.body.classList.add('led-configuring');   /* suppress the scroll-reveal sticky bar */
      var konf = document.getElementById('ledAddons');
      if (konf && typeof konf.scrollIntoView === 'function') konf.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
  var dockCart = document.getElementById('ledDockCart');
  var inlineCart = document.getElementById('bCart');
  if (dockCart && inlineCart) dockCart.addEventListener('click', function () { inlineCart.click(); });

  /* The "Ihre Konfiguration" section is always expanded now (the dropdown toggle
     was removed). The dock's "Details" button just jumps to it. */
  var acc = document.getElementById('ledAcc');
  var dockDetails = document.getElementById('ledDockDetails');
  if (dockDetails && acc) {
    dockDetails.addEventListener('click', function () {
      if (typeof acc.scrollIntoView === 'function') acc.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
})();

/* ===== 2 · Colour variant selection ===== */
(function () {
  var swatches = document.querySelectorAll('#pdpSwatches .pdp-swatch');
  if (!swatches.length) return;
  var nameEl = document.getElementById('pdpFinishName');
  var dotEl = document.getElementById('pdpFinishDot');
  var titleColor = document.getElementById('pdpTitleColor');
  var articleEl = document.getElementById('bArticleInline');
  var stickyFinish = document.getElementById('pdpStickyFinish');
  var checkout = document.getElementById('bCheckout');
  var cart = document.getElementById('bCart');

  swatches.forEach(function (btn) {
    btn.addEventListener('click', function () {
      /* Anchor the clicked swatch: picking a colour appends "| Finish" to the H1
         (which may wrap) and reveals the qty stepper — both sit ABOVE the swatch
         row, so it would jump down on the pick. Capture the swatch's viewport
         position now and restore it after the DOM updates (prototype behaviour). */
      var anchorY = btn.getBoundingClientRect().top;
      var finish = btn.getAttribute('data-finish');
      var article = btn.getAttribute('data-article') || '45161';
      LEDState.finish = finish;
      LEDState.article = article;

      swatches.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });

      if (nameEl) nameEl.textContent = finish;
      if (dotEl) { dotEl.hidden = false; dotEl.style.background = LED_DOT[finish] || '#888'; }
      /* use the SAME styled separator as the rest of the H1 (grey .pdp-title__sep),
         not a plain pipe — keeps the title dividers consistent */
      if (titleColor) {
        titleColor.innerHTML = ' <span class="pdp-title__sep">|</span> ';
        titleColor.appendChild(document.createTextNode(finish));
      }
      if (articleEl) articleEl.textContent = article;
      if (stickyFinish) stickyFinish.textContent = finish;
      moveSwlineTo(btn);   /* slide the desktop indicator line onto the picked swatch */

      /* clear any pending "please choose a colour" alert on the swatches */
      var swGroup = document.getElementById('pdpSwatches');
      if (swGroup) swGroup.classList.remove('is-invalid');

      /* CTA morphs "Bitte Farbe wählen" → "In den Warenkorb"; reveal qty stepper */
      ledRenderCta();
      /* flip the price card from "ab …" to "Preis wie konfiguriert …" (the total) */
      if (typeof ledRenderPrice === 'function') ledRenderPrice();
      if (cart) ledBump(cart);
      ledBump(document.querySelector('.cfgb-buyrow__qty'));

      /* restore the clicked swatch to where it was so the pick doesn't jump the
         page (instant — the page's smooth scroll-behavior would animate it) */
      var dy = Math.round(btn.getBoundingClientRect().top - anchorY);
      if (Math.abs(dy) > 1) {
        var root = document.documentElement, prevSB = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto';
        window.scrollBy(0, dy);
        root.style.scrollBehavior = prevSB;
      }
    });
  });

  /* ----- Desktop: hover/focus previews a swatch's finish name and slides the
     .bx-swline indicator onto it; leaving restores the SELECTED swatch's name +
     line (or "Bitte Farbe wählen" + hidden line when none is chosen). Mirrors the
     prototype (pdp-b.js §Farbe). The touch build drives .bx-swline via scroll, so
     moveSwlineTo() no-ops under body.swtouch. ----- */
  var swGroupEl = document.getElementById('pdpSwatches');
  var swlineD = swGroupEl ? swGroupEl.querySelector('.bx-swline') : null;
  function moveSwlineTo(el) {
    if (!swlineD || document.body.classList.contains('swtouch')) return;
    if (!el) { swlineD.classList.remove('is-on'); return; }
    swlineD.style.transform = 'translate(' + Math.round(el.offsetLeft) + 'px,' + Math.round(el.offsetTop) + 'px)';
    swlineD.classList.add('is-on');
  }
  function restSwlineToSelected() { moveSwlineTo(swGroupEl ? swGroupEl.querySelector('.pdp-swatch[aria-pressed="true"]') : null); }
  function previewName(e) { var b = e.target.closest('.pdp-swatch'); if (b) { if (nameEl) nameEl.textContent = b.getAttribute('data-finish'); moveSwlineTo(b); } }
  function restoreName() { if (nameEl) nameEl.textContent = LEDState.finish || 'Bitte Farbe wählen'; restSwlineToSelected(); }
  if (swGroupEl) {
    swGroupEl.addEventListener('mouseover', previewName);
    swGroupEl.addEventListener('mouseout', restoreName);
    swGroupEl.addEventListener('focusin', previewName);
    swGroupEl.addEventListener('focusout', restoreName);
    window.addEventListener('resize', restSwlineToSelected, { passive: true });
    restSwlineToSelected();   /* initial position: selected swatch, or hidden if none */
  }

  ledRenderCta();   /* set the initial "Bitte Farbe wählen" state */
})();

/* ===== 2b · Labelled colour list (V3 · flow-c) — side window #colorwin =====
   The list-field (#colorCardLink) opens a labelled side window; each row proxy-clicks
   the matching #pdpSwatches button (paired by data-article) so the whole swatch
   selection engine (finish · article · title · CTA morph) is reused unchanged. */
(function () {
  var grid = document.getElementById('pdpSwatches');
  var card = document.getElementById('colorCardLink');   /* flow-c list-field opener (absent here) */
  var link = document.getElementById('colorListLink');   /* "Alle Farben …" text-link opener */
  var win = document.getElementById('colorwin');
  if (!grid || !win) return;
  var swatches = Array.prototype.slice.call(grid.querySelectorAll('.pdp-swatch'));
  var rows = Array.prototype.slice.call(win.querySelectorAll('.colorwin__row'));
  if (!swatches.length || !rows.length) return;
  var thumb = document.getElementById('colorCardThumb');
  var lastFocus = null;

  function swatchFor(row) {
    var art = row.getAttribute('data-article');
    for (var i = 0; i < swatches.length; i++) { if (swatches[i].getAttribute('data-article') === art) return swatches[i]; }
    return null;
  }
  /* the list-field thumb mirrors the picked swatch — its texture image, or a
     solid fill for finishes without a texture (Quarzgrau) */
  function thumbHtml(sw) {
    if (!sw) return '';
    var im = sw.querySelector('img');
    if (im) return '<img src="' + im.getAttribute('src') + '" alt="">';
    var f = sw.querySelector('.pdp-swatch__fill');
    return '<span style="display:block;width:100%;height:100%;background:' + (f ? f.style.background : '') + '"></span>';
  }

  /* reflect the chosen swatch onto the rows + the list-field thumb */
  function markRows() {
    rows.forEach(function (r) {
      var sw = swatchFor(r);
      var on = !!(sw && sw.getAttribute('aria-pressed') === 'true');
      r.classList.toggle('is-selected', on);
      r.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    var sel = grid.querySelector('.pdp-swatch[aria-pressed="true"]');
    if (card) card.classList.toggle('is-picked', !!sel);
    if (thumb) thumb.innerHTML = thumbHtml(sel);
  }

  function open(opener) {
    win.classList.add('is-open'); win.setAttribute('aria-hidden', 'false');
    if (card) card.setAttribute('aria-expanded', 'true');
    if (link) link.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    lastFocus = opener || link || card;
    markRows();
    var target = win.querySelector('.colorwin__row.is-selected') || rows[0];
    if (target) target.focus({ preventScroll: true });
  }
  function close() {
    win.classList.remove('is-open'); win.setAttribute('aria-hidden', 'true');
    if (card) card.setAttribute('aria-expanded', 'false');
    if (link) link.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  rows.forEach(function (r) {
    r.addEventListener('click', function () {
      var sw = swatchFor(r);
      if (sw) { sw.click(); markRows(); }   /* proxy → runs the swatch selection engine */
      close();
    });
  });
  if (card) card.addEventListener('click', function () { win.classList.contains('is-open') ? close() : open(card); });
  if (link) link.addEventListener('click', function () { win.classList.contains('is-open') ? close() : open(link); });
  win.addEventListener('click', function (e) { if (e.target.closest('[data-cw-close]')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && win.classList.contains('is-open')) close(); });

  /* keep the list + thumb in step when a swatch is picked directly */
  if (window.MutationObserver) {
    new MutationObserver(markRows).observe(grid, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
  }
  markRows();
})();

/* ===== 2c · Swatch behaviour on touch (mobile) — mirrors the prototype =====
   Hover is a capability, not a screen size: touch devices (no hover) switch the
   swatch grid to a horizontal snap-scroller (via pdp-b.css .swtouch) with edge
   fades and a scroll-driven indicator line; the finish name previews the swatch
   you slide over (no hover to reveal names), and a tap snaps the line to it.
   ?touch=1 forces the touch treatment on a pointer device for previewing. */
(function () {
  var sw = document.getElementById('pdpSwatches');
  if (!sw) return;
  var params = new URLSearchParams(location.search);
  var isTouch = params.get('touch') === '1' || (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);
  document.body.classList.toggle('swtouch', !!isTouch);
  if (!isTouch) return;

  var swline = sw.querySelector('.bx-swline');
  var nameEl = document.getElementById('pdpFinishName');
  var swatchEls = Array.prototype.slice.call(sw.querySelectorAll('.pdp-swatch'));
  if (!swatchEls.length) return;
  var ticking = false;

  function setEdge() {
    var m = sw.scrollWidth - sw.clientWidth, sl = sw.scrollLeft;
    sw.setAttribute('data-scroll', m <= 2 ? 'none' : (sl <= 1 ? 'start' : (sl >= m - 1 ? 'end' : 'middle')));
  }
  function update() {
    ticking = false;
    setEdge();
    var maxScroll = sw.scrollWidth - sw.clientWidth;
    var frac = maxScroll > 0 ? sw.scrollLeft / maxScroll : 0;
    var idx = Math.round(frac * (swatchEls.length - 1));
    if (idx < 0) idx = 0; else if (idx > swatchEls.length - 1) idx = swatchEls.length - 1;
    var near = swatchEls[idx];
    if (!near) return;
    swatchEls.forEach(function (s) { s.classList.toggle('is-labeled', s === near); });
    if (nameEl) nameEl.textContent = near.getAttribute('data-finish');   /* slide reveals the name */
    if (swline) swline.style.transform = 'translateX(' + Math.round(near.offsetLeft) + 'px)';
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  function onResize() {
    setEdge();
    var sel = sw.querySelector('.pdp-swatch[aria-pressed="true"]');
    if (sel) { if (swline) swline.style.transform = 'translateX(' + Math.round(sel.offsetLeft) + 'px)'; }
    else onScroll();
  }
  /* tap snaps the line to the tapped swatch (a plain tap does not scroll) */
  sw.addEventListener('click', function (e) {
    var b = e.target.closest('.pdp-swatch'); if (!b || !swline) return;
    swline.style.transform = 'translateX(' + Math.round(b.offsetLeft) + 'px)';
  });
  sw.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  update();
  /* At rest show the committed label ("Bitte Farbe wählen", or the selected
     finish) — NOT the first swatch's name. Scrolling then drives the live
     preview. Mirrors the prototype, where refresh() resets #pdpFinishName after
     the touch init runs. */
  if (nameEl) nameEl.textContent = LEDState.finish || 'Bitte Farbe wählen';
})();

/* ===== 2d · Erweiterungen & Zubehör (add-ons) =====
   Checkbox cards feed LEDState.addons; each selection becomes a flat, quantity-
   scaled line in the price module. The accordion header collapses the list. */
(function () {
  var box = document.getElementById('ledAddons');
  if (!box) return;
  var cbs = Array.prototype.slice.call(box.querySelectorAll('.led-addon__cb'));
  var countEl = document.getElementById('ledAddonsCount');
  var toggle = document.getElementById('ledAddonsToggle');

  function sync() {
    LEDState.addons = cbs.filter(function (c) { return c.checked; }).map(function (c) {
      var card = c.closest('.led-addon');
      var img = card ? card.querySelector('.led-addon__media img') : null;
      return {
        name: c.getAttribute('data-name'),
        price: parseFloat(c.getAttribute('data-price')) || 0,
        img: img ? img.getAttribute('src') : ''
      };
    });
    var n = LEDState.addons.length;
    if (countEl) { countEl.hidden = n === 0; countEl.textContent = n + (n === 1 ? ' gewählt' : ' gewählt'); }
    box.classList.toggle('is-done', n > 0);   /* done → badge flips to a teal check (like index-desc) */
    if (typeof ledRenderPrice === 'function') ledRenderPrice();
  }
  cbs.forEach(function (c) { c.addEventListener('change', sync); });

  if (toggle) {
    toggle.addEventListener('click', function () {
      var collapsed = box.classList.toggle('is-collapsed');
      toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
  }
  sync();   /* initialise state + count from any pre-checked boxes */
})();

/* ===== 3 · Quantity stepper (click · press-and-hold repeat · keyboard) ===== */
(function () {
  var steppers = document.querySelectorAll('[data-qd][data-target="main"]');
  if (!steppers.length) return;
  var valEl = document.getElementById('bMainQtyVal');
  var minus = null;

  function apply(d) {
    var next = Math.max(1, Math.min(99, LEDState.qty + d));
    if (next === LEDState.qty) return false;
    LEDState.qty = next;
    if (valEl) valEl.textContent = next;
    if (minus) minus.disabled = next <= 1;
    ledRenderPrice({ qtyChanged: true });
    return true;
  }

  steppers.forEach(function (btn) {
    var d = parseInt(btn.getAttribute('data-qd'), 10) || 0;
    if (d < 0) minus = btn;

    var holdTimer = null, repeatTimer = null, viaPointer = false;
    function stop() { clearTimeout(holdTimer); clearInterval(repeatTimer); holdTimer = repeatTimer = null; }

    btn.addEventListener('pointerdown', function (e) {
      if (e.button && e.button !== 0) return;
      viaPointer = true;
      apply(d);                                        /* immediate step */
      holdTimer = setTimeout(function () {              /* then accelerate while held */
        repeatTimer = setInterval(function () { if (!apply(d)) stop(); }, 90);
      }, 420);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
      btn.addEventListener(ev, function () { stop(); setTimeout(function () { viaPointer = false; }, 0); });
    });
    /* keyboard (Enter/Space) fires click with no pointerdown → act on it; swallow the
       click that trails a pointer press so a normal tap counts exactly once */
    btn.addEventListener('click', function () { if (viaPointer) { viaPointer = false; return; } apply(d); });
  });

  if (minus) minus.disabled = true;
  ledRenderPrice({ initial: true });
})();

/* ===== 4 · Media gallery: thumbnails → main image ===== */
(function () {
  var thumbs = document.querySelectorAll('#pdpThumbs .pdp-thumb');
  var main = document.getElementById('pdpMainImg');
  if (!thumbs.length || !main) return;
  function activate(btn) {
    thumbs.forEach(function (b) { b.setAttribute('aria-current', b === btn ? 'true' : 'false'); });
    var full = btn.getAttribute('data-full');
    if (full) main.src = full;
  }
  /* Click only — not hover. A mouseenter swap changed the main image just by moving
     the cursor across the thumbnail strip, so the hero image jumped around on its
     own while interacting with the page. */
  thumbs.forEach(function (btn) {
    btn.addEventListener('click', function () { activate(btn); });
  });
  activate(thumbs[0]);
})();

/* ===== 5 · Lightbox ===== */
(function () {
  var lb = document.getElementById('pdpLightbox');
  var openBtn = document.getElementById('pdpThumbsAll');
  var thumbs = document.querySelectorAll('#pdpThumbs .pdp-thumb');
  if (!lb || !thumbs.length) return;

  var imgs = Array.prototype.map.call(thumbs, function (t) { return t.getAttribute('data-full'); });
  var imgEl = document.getElementById('pdpLbImg');
  var curEl = document.getElementById('pdpLbCur');
  var totalEl = document.getElementById('pdpLbTotal');
  var strip = document.getElementById('pdpLbStrip');
  var prev = document.getElementById('pdpLbPrev');
  var next = document.getElementById('pdpLbNext');
  var idx = 0;

  if (totalEl) totalEl.textContent = imgs.length;
  if (strip) {
    imgs.forEach(function (src, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pdp-lightbox__thumb';
      b.innerHTML = '<img src="' + src + '" alt="">';
      b.addEventListener('click', function () { go(i); });
      strip.appendChild(b);
    });
  }
  function paint() {
    if (imgEl) imgEl.src = imgs[idx];
    if (curEl) curEl.textContent = idx + 1;
    if (strip) {
      Array.prototype.forEach.call(strip.children, function (c, i) {
        c.setAttribute('aria-current', i === idx ? 'true' : 'false');
      });
    }
  }
  function go(i) { idx = (i + imgs.length) % imgs.length; paint(); }
  function open(i) { go(i || 0); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
  function close() { lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }

  if (openBtn) openBtn.addEventListener('click', function () { open(0); });
  /* clicking the main stage image opens at the current thumb */
  var stage = document.querySelector('.pdp-media__stage');
  if (stage) stage.addEventListener('click', function () {
    var cur = document.querySelector('#pdpThumbs .pdp-thumb[aria-current="true"]');
    var start = cur ? Array.prototype.indexOf.call(thumbs, cur) : 0;
    open(start);
  });
  if (prev) prev.addEventListener('click', function () { go(idx - 1); });
  if (next) next.addEventListener('click', function () { go(idx + 1); });
  lb.querySelectorAll('[data-lb-close]').forEach(function (el) { el.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) {
    if (lb.getAttribute('aria-hidden') === 'false') {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') go(idx - 1);
      else if (e.key === 'ArrowRight') go(idx + 1);
    }
  });
})();

/* ===== 6 · Sticky purchase bar ===== */
(function () {
  var bar = document.getElementById('pdpStickyBar');
  var anchor = document.getElementById('bCheckout');
  if (!bar || !anchor || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      /* show the bar once the hero buy block has scrolled above the viewport */
      var below = en.boundingClientRect.top > 0;
      bar.classList.toggle('is-visible', !en.isIntersecting && !below);
    });
  }, { rootMargin: '0px 0px -60% 0px', threshold: 0 });
  io.observe(anchor);
})();

/* ===== 7 · Share menu ===== */
(function () {
  var btn = document.getElementById('pdpShare');
  var menu = document.getElementById('pdpShareMenu');
  if (!btn || !menu) return;
  function setOpen(v) { menu.hidden = !v; btn.setAttribute('aria-expanded', v ? 'true' : 'false'); }
  btn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(menu.hidden); });
  document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  var copy = menu.querySelector('[data-share="copy"]');
  if (copy) copy.addEventListener('click', function (e) {
    e.preventDefault();
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).catch(function () {});
    var label = copy.querySelector('span');
    if (label) {
      var prev = label.textContent;
      label.textContent = 'Link kopiert ✓';
      setTimeout(function () { setOpen(false); label.textContent = prev; }, 1400);
    }
  });
})();

/* ===== 8 · Add-to-cart — validate on click, never lock (prototype behaviour) ===== */
(function () {
  var cart = document.getElementById('bCart');
  var stickyCta = document.getElementById('pdpStickyCta');

  function addToCart() {
    /* colour is the gate — surface the requirement AT THE SWATCHES (kit's shake),
       not by disabling the CTA */
    if (!LEDState.finish) {
      var sw = document.getElementById('pdpSwatches');
      if (sw) {
        sw.classList.remove('is-invalid'); void sw.offsetWidth; sw.classList.add('is-invalid');
        sw.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    /* success (prototype has no backend): bump the header cart badge + confirm */
    var badge = document.querySelector('.header .badge');
    if (badge) badge.textContent = (parseInt(badge.textContent, 10) || 0) + LEDState.qty;
    ledBump(cart);
  }

  if (cart) cart.addEventListener('click', addToCart);
  if (stickyCta) stickyCta.addEventListener('click', addToCart);
})();

/* ===== 9 · Section scroll-spy (psx-nav) ===== */
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('.psx-nav__link'));
  if (!links.length || !('IntersectionObserver' in window)) return;
  var map = {};
  var sections = links.map(function (l) {
    var id = l.getAttribute('href').slice(1);
    var sec = document.getElementById(id);
    if (sec) map[id] = l;
    return sec;
  }).filter(Boolean);

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        links.forEach(function (l) { l.classList.remove('is-active'); });
        var active = map[en.target.id];
        if (active) active.classList.add('is-active');
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
  sections.forEach(function (s) { io.observe(s); });

  /* smooth-scroll with offset for the sticky nav */
  links.forEach(function (l) {
    l.addEventListener('click', function (e) {
      var id = l.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var navH = 64;
      var y = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
})();

/* ===== 10 · Scrollytelling story (sticky image swap) ===== */
(function () {
  var scenes = Array.prototype.slice.call(document.querySelectorAll('.psx-story__scene'));
  var imgs = document.querySelectorAll('.psx-story__media .psx-story__img');
  if (!scenes.length || !imgs.length || !('IntersectionObserver' in window)) return;
  function activate(sceneIdx) {
    imgs.forEach(function (im) { im.classList.toggle('is-active', im.getAttribute('data-scene') === String(sceneIdx)); });
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) activate(en.target.getAttribute('data-scene'));
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  scenes.forEach(function (s) { io.observe(s); });
})();

/* ===== 11 · Technik master–detail tabs ===== */
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.techms__tab'));
  if (!tabs.length) return;
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var panelId = tab.getAttribute('aria-controls');
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
    });
  });
})();

/* ===== 12 · Reviews feature carousel (built from #rvTrack) ===== */
(function () {
  var track = document.getElementById('rvTrack');
  if (!track) return;
  var items = Array.prototype.map.call(track.querySelectorAll('.rv__card'), function (li) {
    return {
      img: li.getAttribute('data-img'),
      stars: parseInt(li.getAttribute('data-stars'), 10) || 5,
      title: li.getAttribute('data-title') || '',
      author: li.getAttribute('data-author') || 'Gast',
      date: li.getAttribute('data-date') || '',
      text: (li.textContent || '').trim()
    };
  });
  if (!items.length) return;

  var img = document.getElementById('rvFeatureImg');
  var starsEl = document.getElementById('rvFeatureStars');
  var titleEl = document.getElementById('rvFeatureTitle');
  var textEl = document.getElementById('rvFeatureText');
  var authorEl = document.getElementById('rvFeatureAuthor');
  var dateEl = document.getElementById('rvFeatureDate');
  var nav = document.getElementById('rvThumbsNav');
  var prev = document.querySelector('.rv__feature-arrow--prev');
  var next = document.querySelector('.rv__feature-arrow--next');
  var idx = 0;

  var STAR = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';

  if (nav) items.forEach(function (it, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'rv__thumbnav-btn';
    b.setAttribute('aria-label', 'Bewertung von ' + it.author + ' anzeigen');
    b.innerHTML = '<img src="' + it.img + '" alt="" loading="lazy">';
    b.addEventListener('click', function () { go(i); });
    nav.appendChild(b);
  });

  function paint() {
    var it = items[idx];
    if (img) { img.src = it.img; img.alt = 'Kundenfoto: ' + it.title; }
    if (starsEl) starsEl.innerHTML = new Array(it.stars + 1).join(STAR);
    if (titleEl) titleEl.textContent = it.title;
    if (textEl) textEl.textContent = it.text;
    if (authorEl) authorEl.textContent = it.author;
    if (dateEl) dateEl.textContent = it.date;
    if (nav) Array.prototype.forEach.call(nav.children, function (c, i) { c.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
  }
  function go(i) { idx = (i + items.length) % items.length; paint(); }
  if (prev) prev.addEventListener('click', function () { go(idx - 1); });
  if (next) next.addEventListener('click', function () { go(idx + 1); });
  paint();
})();

/* ===== 13 · Contact modal + question modal ===== */
(function () {
  var modal = document.getElementById('contactModal');
  if (modal) {
    function open() { modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
    function close() { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
    document.querySelectorAll('[data-cm-open]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); open(); });
    });
    modal.querySelectorAll('[data-cm-close]').forEach(function (el) { el.addEventListener('click', close); });
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('is-open')) close(); });
  }

  var qm = document.getElementById('questionModal');
  if (qm) {
    function qOpen() { qm.hidden = false; document.body.style.overflow = 'hidden'; }
    function qClose() { qm.hidden = true; document.body.style.overflow = ''; }
    document.querySelectorAll('[data-qf-open]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); qOpen(); });
    });
    var closeBtn = document.getElementById('qfClose');
    if (closeBtn) closeBtn.addEventListener('click', qClose);
    qm.addEventListener('click', function (e) { if (e.target === qm) qClose(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !qm.hidden) qClose(); });

    var form = document.getElementById('questionForm');
    var formView = document.getElementById('qfFormView');
    var success = document.getElementById('qfSuccess');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (formView) formView.hidden = true;
      if (success) success.hidden = false;
    });
    var sClose = document.getElementById('qfSuccessClose');
    if (sClose) sClose.addEventListener('click', function () {
      qClose();
      if (formView) formView.hidden = false;
      if (success) success.hidden = true;
      if (form) form.reset();
    });
  }
})();

/* ===== 14 · "Ihre Konfiguration" collapse toggle (chevron) — consistent with
   index-desc's .cfgb-acc. Expanded by default; toggles .is-open on #ledAcc, which
   drives the chevron rotation + the body grid-rows collapse (see led.css). ===== */
(function () {
  var btn = document.getElementById('ledDetailsBtn');
  var acc = document.getElementById('ledAcc');
  if (!btn || !acc) return;
  btn.addEventListener('click', function () {
    var open = acc.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();
