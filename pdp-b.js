/* ============================================================
   pdp-b.js – VERSION B · inline 5-step configurator
   • Farbe = VARIANTE (eigene Art.-Nr.), outside the flow.
   • Steps: 1 Anschluss (required · drives 3+4) · 2 Gravurdaten ·
            3 Innenstationen · 4 Stromversorgung · 5 Zubehör
   • Smart navigation: selecting an option AUTO-ADVANCES to the
     next step (no "Weiter" button). Steps stay reachable via the
     stepper nodes and the accordion headers.
   • Price details: an itemized summary with a quantity stepper on
     the product and on every added item.
   • "In den Warenkorb" always live; validates (never locks).
   ============================================================ */

/* ============================================================
   Shared review provenance – how the review reached this page
   (machine translation + origin shop). Rendered as identical
   pill/chip metadata beneath the byline in EVERY surface that
   shows a review: the list cards, the photo lightbox and the
   featured testimonial preview. One source, one look.
   ============================================================ */
window.MZ_PROV = (function () {
  /* icons in the Metzler design-system style (inline SVG, no external libs, stroke 1.8,
     currentColor, round caps) – universal glyphs: a globe for translation/language, the
     DS tag for provenance/origin */
  var globe = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
  var store = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9h18l-1.2-4.28A1 1 0 0 0 18.83 4H5.17a1 1 0 0 0-.96.72L3 9Z"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/><path d="M9.5 20v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v4"/></svg>';
  return {
    translated: '<span class="rvw-prov">' + globe + '<span>Übersetzt aus dem Deutschen</span></span>',
    origin: '<span class="rvw-prov">' + store + '<span class="rvw-prov__txt"><span class="rvw-prov__label">Herkunft:</span> <span class="rvw-prov__val">Shop Frankreich</span></span></span>'
  };
})();
/* both pills, in reading order – the default provenance block */
window.MZ_PROV_HTML = window.MZ_PROV.translated + window.MZ_PROV.origin;
/* build a provenance block; pass a custom pill string to show a subset */
window.MZ_PROV_EL = function (html) {
  var el = document.createElement('div');
  el.className = 'rvw-review__prov';
  el.innerHTML = html || window.MZ_PROV_HTML;
  return el;
};

/* ============================================================
   Shared modal scroll-lock. overflow:hidden on <body> does NOT lock
   the page when <html> is the scroll root, and iOS Safari ignores it
   outright – so an open modal lets the page scroll behind it. Pin the
   body with position:fixed on touch (restoring the scroll on unlock),
   and fall back to overflow:hidden on <html> + scrollbar-pad on pointer.
   One source of truth for every overlay (contact, lightboxes, form).
   ============================================================ */
var MZScroll = (function () {
  var y = 0, fixed = false, active = false;
  function lock() {
    if (active) return;                         /* re-entrant lock keeps the first Y */
    active = true;
    y = window.pageYOffset;
    var b = document.body, de = document.documentElement;
    var touch = window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (touch) {
      b.style.position = 'fixed'; b.style.top = -y + 'px'; b.style.left = '0'; b.style.right = '0'; b.style.width = '100%';
      fixed = true;
    } else {
      var sbw = window.innerWidth - de.clientWidth;   /* pad for the vanished scrollbar */
      if (sbw > 0) b.style.paddingRight = sbw + 'px';
      fixed = false;
    }
    de.style.overflow = 'hidden';
  }
  function unlock() {
    if (!active) return;
    active = false;
    var b = document.body, de = document.documentElement;
    de.style.overflow = '';
    b.style.paddingRight = '';
    if (fixed) {
      /* html{scroll-behavior:smooth} would turn this restore into an animated
         scroll – on close the page drops to the top and glides back, reading as
         "the page scrolled". Force an instant jump, then restore the setting. */
      var prevBehavior = de.style.scrollBehavior;
      de.style.scrollBehavior = 'auto';
      b.style.position = ''; b.style.top = ''; b.style.left = ''; b.style.right = ''; b.style.width = '';
      window.scrollTo(0, y);
      de.style.scrollBehavior = prevBehavior;
      fixed = false;
    }
  }
  return { lock: lock, unlock: unlock };
})();

/* ============================================================
   Shared horizontal-swipe helper for the image popups. Threshold-based
   on touchend, fully passive (never blocks pinch-zoom or vertical
   scroll). Single-touch only; ignores swipes that start on a control so
   taps on the arrows / close still work. Swipe left → next, right → prev.
   ============================================================ */
var MZSwipe = (function () {
  function attach(el, onPrev, onNext) {
    if (!el) return;
    var x0 = 0, y0 = 0, tracking = false;
    el.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { tracking = false; return; }
      var t = e.target;
      if (t && t.closest && t.closest('button, a, [role="button"], input, textarea')) { tracking = false; return; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; tracking = true;
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var ct = e.changedTouches && e.changedTouches[0];
      if (!ct) return;
      var dx = ct.clientX - x0, dy = ct.clientY - y0;
      if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;   /* need a dominant horizontal swipe */
      (dx < 0 ? onNext : onPrev)();
    }, { passive: true });
  }
  return { attach: attach };
})();

(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var BASE = 699;
  var FONTS = {
    Klassisch: "'Cinzel',Georgia,serif",
    Elegant: "'Playfair Display',Georgia,serif",
    Fein: "'Cormorant Garamond',Georgia,serif",
    Modern: "'Montserrat',Arial,sans-serif",
    Schmal: "'Oswald','Arial Narrow',sans-serif",
    Schreibschrift: "'Dancing Script',cursive",
    Kalligrafie: "'Great Vibes',cursive",
    Handschrift: "'Caveat',cursive",
    Fraktur: "'UnifrakturMaguntia',serif",
    Technisch: "'Roboto Mono','Courier New',monospace"
  };
  var STEPS = [
    { key: 'anschluss', name: 'Anschluss', req: true },
    { key: 'gravur', name: 'Gravurdaten' },
    { key: 'innen', name: 'Innenstationen' },
    { key: 'strom', name: 'Stromversorgung' },
    { key: 'zubehoer', name: 'Erweiterungen & Zubehör' }
  ];
  var LIGHT_FINISHES = { 'Verkehrsweiß RAL 9016': 1, 'Edelstahl gebürstet': 1 };
  var CONN = { 'LAN / PoE': 'lan', '2-Draht IP': '2draht' };

  /* ── RAL Classic palette (Wunschfarbe picker) – code | German name | hex ── */
  var WUNSCHFARBE = 'Wunschfarbe nach RAL';
  /* order = neutrals band (white/black, grey, brown) then the warm→cool spectrum */
  var RAL_FAMS = [['all', 'Alle'], ['9', 'Weiß/Schwarz'], ['7', 'Grau'], ['8', 'Braun'], ['1', 'Gelb'], ['2', 'Orange'], ['3', 'Rot'], ['4', 'Violett'], ['5', 'Blau'], ['6', 'Grün']];
  /* the RAL tones Metzler actually offers for the Wunschfarbe (real product list) */
  var RAL_OFFERED = new Set(('1001 1002 1003 1004 1011 1013 1014 1015 1016 1018 1019 1023 1028 1033 ' +
    '2000 2002 2003 2004 2009 2010 2011 2021 3000 3001 3002 3003 3004 3007 3012 3013 3016 3020 3031 ' +
    '4004 4005 4008 5000 5002 5003 5005 5007 5010 5011 5012 5013 5015 5017 5018 5019 5020 5021 5022 5023 5024 ' +
    '6000 6001 6002 6003 6005 6007 6009 6011 6015 6016 6017 6018 6021 6024 6025 6026 6028 6029 6032 6033 6034 ' +
    '7000 7001 7002 7003 7004 7005 7006 7009 7010 7011 7012 7013 7015 7016 7021 7022 7024 7030 7031 7032 7035 7036 7037 7038 7039 7040 7042 7043 7044 7046 7047 ' +
    '8001 8002 8003 8004 8012 8016 8017 8019 8022 8023 8024 8028 9001 9002 9003 9005 9006 9007 9010 9016 9017 9018').split(' '));
  var RAL = ('1000|Grünbeige|CDBA88 1001|Beige|D0B084 1002|Sandgelb|D2AA6D 1003|Signalgelb|F9A800 1004|Goldgelb|E49E00 ' +
    '1005|Honiggelb|CB8E00 1006|Maisgelb|E29000 1007|Narzissengelb|E88C00 1011|Braunbeige|AF804F 1012|Zitronengelb|DDAF27 ' +
    '1013|Perlweiß|E3D9C6 1014|Elfenbein|DDC49A 1015|Hellelfenbein|E6D2B5 1016|Schwefelgelb|F1DD38 1017|Safrangelb|F6A950 ' +
    '1018|Zinkgelb|FACA30 1019|Graubeige|A5998B 1020|Olivgelb|9E9764 1021|Rapsgelb|F5D033 1023|Verkehrsgelb|F0CA00 ' +
    '1024|Ockergelb|B89C50 1026|Leuchtgelb|F5FF00 1027|Curry|9D9101 1028|Melonengelb|F3A505 1032|Ginstergelb|E2A300 ' +
    '1033|Dahliengelb|F4A900 1034|Pastellgelb|EFA94A 1035|Perlbeige|908370 1036|Perlgold|80643F 1037|Sonnengelb|F09200 ' +
    '2000|Gelborange|ED760E 2001|Rotorange|C93C20 2002|Blutorange|CB2821 2003|Pastellorange|FF7514 2004|Reinorange|F44611 ' +
    '2005|Leuchtorange|FF2301 2007|Leuchthellorange|FFA420 2008|Hellrotorange|F75E25 2009|Verkehrsorange|F54021 2010|Signalorange|D84B20 ' +
    '2011|Tieforange|EC7C26 2012|Lachsorange|E55137 2013|Perlorange|C35831 ' +
    '3000|Feuerrot|AF2B1E 3001|Signalrot|A52019 3002|Karminrot|A2231D 3003|Rubinrot|C8273D 3004|Purpurrot|75151E ' +
    '3005|Weinrot|5E2129 3007|Schwarzrot|412227 3009|Oxidrot|642424 3011|Braunrot|781F19 3012|Beigerot|C1876B ' +
    '3013|Tomatenrot|A12312 3014|Altrosa|D36E70 3015|Hellrosa|EA899A 3016|Korallenrot|B32821 3017|Rosé|E63244 ' +
    '3018|Erdbeerrot|D53032 3020|Verkehrsrot|CC0605 3022|Lachsrot|D95030 3024|Leuchtrot|F80000 3026|Leuchthellrot|FE0000 ' +
    '3027|Himbeerrot|C51D34 3028|Reinrot|CB3234 3031|Orientrot|B32428 3032|Perlrubinrot|721422 3033|Perlrosa|B44C43 ' +
    '4001|Rotlila|6D3F5B 4002|Rotviolett|922B3E 4003|Erikaviolett|DE4C8A 4004|Bordeauxviolett|641C34 4005|Blaulila|6C4675 ' +
    '4006|Verkehrspurpur|A03472 4007|Purpurviolett|4A192C 4008|Signalviolett|924E7D 4009|Pastellviolett|A18594 4010|Telemagenta|CF3476 ' +
    '4011|Perlviolett|8673A1 4012|Perlbrombeer|6C6874 ' +
    '5000|Violettblau|354D73 5001|Grünblau|1F3438 5002|Ultramarinblau|20214F 5003|Saphirblau|1D1E33 5004|Schwarzblau|18171C ' +
    '5005|Signalblau|1E2460 5007|Brillantblau|3E5F8A 5008|Graublau|26252D 5009|Azurblau|025669 5010|Enzianblau|0E294B ' +
    '5011|Stahlblau|231A24 5012|Lichtblau|3B83BD 5013|Kobaltblau|1E213D 5014|Taubenblau|606E8C 5015|Himmelblau|2271B3 ' +
    '5017|Verkehrsblau|063971 5018|Türkisblau|3F888F 5019|Capriblau|1B5583 5020|Ozeanblau|00414B 5021|Wasserblau|256D7B ' +
    '5022|Nachtblau|252850 5023|Fernblau|49678D 5024|Pastellblau|5D9B9B 5025|Perlenzian|2A6478 5026|Perlnachtblau|102C54 ' +
    '6000|Patinagrün|327662 6001|Smaragdgrün|28713E 6002|Laubgrün|276235 6003|Olivgrün|4B573E 6004|Blaugrün|0E4243 ' +
    '6005|Moosgrün|114232 6006|Grauoliv|3E3B32 6007|Flaschengrün|283424 6008|Braungrün|35382E 6009|Tannengrün|26392F ' +
    '6010|Grasgrün|3D642D 6011|Resedagrün|6C7156 6012|Schwarzgrün|303D3A 6013|Schilfgrün|7E7B52 6014|Gelboliv|474135 ' +
    '6015|Schwarzoliv|3B3C36 6016|Türkisgrün|026A52 6017|Maigrün|468641 6018|Gelbgrün|48A43F 6019|Weißgrün|BDECB6 ' +
    '6020|Chromoxidgrün|2E3A23 6021|Blassgrün|89AC76 6022|Braunoliv|3B3327 6024|Verkehrsgrün|308446 6025|Farngrün|587246 ' +
    '6026|Opalgrün|005D52 6027|Lichtgrün|7FB5B5 6028|Kieferngrün|2C5545 6029|Minzgrün|20603D 6032|Signalgrün|317F43 ' +
    '6033|Minttürkis|497E76 6034|Pastelltürkis|7FB0B2 6035|Perlgrün|1C542D 6036|Perlopalgrün|193F32 6037|Reingrün|008F39 6038|Leuchtgrün|00BB2D ' +
    '7000|Fehgrau|78858B 7001|Silbergrau|8A9597 7002|Olivgrau|817863 7003|Moosgrau|7A7B6D 7004|Signalgrau|9EA0A1 ' +
    '7005|Mausgrau|6B716F 7006|Beigegrau|756857 7008|Khakigrau|6D6552 7009|Grüngrau|4F5951 7010|Zeltgrau|4C514A ' +
    '7011|Eisengrau|434B4D 7012|Basaltgrau|575D5E 7013|Braungrau|464531 7015|Schiefergrau|434750 7016|Anthrazitgrau|383E42 ' +
    '7021|Schwarzgrau|23282B 7022|Umbragrau|4B4640 7023|Betongrau|808076 7024|Graphitgrau|474A50 7026|Granitgrau|2F353B ' +
    '7030|Steingrau|8B8C7A 7031|Blaugrau|474B4E 7032|Kieselgrau|B8B799 7033|Zementgrau|7D8471 7034|Gelbgrau|8F8B66 ' +
    '7035|Lichtgrau|D7D7D7 7036|Platingrau|7F7679 7037|Staubgrau|7D7F7D 7038|Achatgrau|B5B8B1 7039|Quarzgrau|6B665E ' +
    '7040|Fenstergrau|9DA1AA 7042|Verkehrsgrau A|8D948D 7043|Verkehrsgrau B|4E5754 7044|Seidengrau|CAC4B0 7045|Telegrau 1|909090 ' +
    '7046|Telegrau 2|82898F 7047|Telegrau 4|D0D0D0 7048|Perlmausgrau|898176 ' +
    '8000|Grünbraun|826C34 8001|Ockerbraun|955F20 8002|Signalbraun|6C3B2A 8003|Lehmbraun|734222 8004|Kupferbraun|8E402A ' +
    '8007|Rehbraun|59351F 8008|Olivbraun|6F4F28 8011|Nussbraun|5B3A29 8012|Rotbraun|592321 8014|Sepiabraun|382C1E ' +
    '8015|Kastanienbraun|633A34 8016|Mahagonibraun|4C2F27 8017|Schokoladenbraun|45322E 8019|Graubraun|3D3635 8022|Schwarzbraun|212121 ' +
    '8023|Orangebraun|A65E2E 8024|Beigebraun|79553D 8025|Blassbraun|755C48 8028|Terrabraun|4E3B31 8029|Perlkupfer|763C28 ' +
    '9001|Cremeweiß|FDF4E3 9002|Grauweiß|E7EBDA 9003|Signalweiß|F4F4F4 9004|Signalschwarz|282828 9005|Tiefschwarz|000000 ' +
    '9006|Weißaluminium|A5A5A5 9007|Graualuminium|AFAFAF 9010|Reinweiß|FFFFFF 9011|Graphitschwarz|1C1C1C 9016|Verkehrsweiß|F6F6F6 ' +
    '9017|Verkehrsschwarz|1E1E1E 9018|Papyrusweiß|CFD3CD 9022|Perlhellgrau|9C9C9C 9023|Perldunkelgrau|828282')
    .split(/\s+(?=\d{4}\|)/).map(function (s) { var p = s.split('|'); return { code: p[0], name: p[1], hex: '#' + p[2], fam: p[0].charAt(0) }; })
    /* keep only the tones actually offered (real product list, see RAL_OFFERED) */
    .filter(function (c) { return RAL_OFFERED.has(c.code); });
  /* DB 703 (Eisenglimmer) – a Deutsche-Bahn anthracite that's offered but isn't a RAL Classic
     code; grouped with the greys */
  RAL.push({ code: 'DB 703', name: 'Eisenglimmer', hex: '#4A4E51', fam: '7' });
  /* RAL 2021 is offered but is NOT a standard RAL Classic code (the 2xxx range ends at 2013),
     so name + hex are approximations – REPLACE with the official values when available */
  RAL.push({ code: '2021', name: 'Orange', hex: '#F39200', fam: '2' });
  /* arrange for the eye, not the catalogue. Bands: the achromatics (white/black 9xxx +
     grey 7xxx) merge into ONE greyscale ramp so the blacks sit at the BOTTOM of the neutral
     block rather than mid-grid; then brown; then the warm→cool chromatic spectrum. WITHIN
     every band, lightest → darkest by luminance – a clean tonal ramp (search covers code
     lookup, so numeric order isn't needed). Family tabs stay separate; this is the grid order. */
  function ralBand(fam) { return (fam === '9' || fam === '7') ? 0 : 1 + '8123456'.indexOf(fam); }
  /* chroma = how tinted a tone is (0 = neutral grey/white) */
  function ralChroma(hex) { var r = parseInt(hex.substr(1, 2), 16), g = parseInt(hex.substr(3, 2), 16), b = parseInt(hex.substr(5, 2), 16); return (Math.max(r, g, b) - Math.min(r, g, b)) / 255; }
  RAL.sort(function (a, b) {
    var bd = ralBand(a.fam) - ralBand(b.fam);
    if (bd !== 0) return bd;
    var dl = ralLum(b.hex) - ralLum(a.hex);                 /* light → dark */
    if (Math.abs(dl) > 0.02) return dl;
    /* near-equal lightness → the cleaner / more neutral tone first (so a tinted white like
       Cremeweiß doesn't sit ahead of a neutral Signalweiß it only pips on raw luminance);
       equally neutral → keep the lighter one first */
    var dc = ralChroma(a.hex) - ralChroma(b.hex);
    return dc !== 0 ? dc : dl;
  });

  var ralUI = null;   /* set by setupRalPicker() – { open, close, flash, sync } */
  var state = {
    finish: '', finishDelta: 0, article: '', mainQty: 1,   /* no colour pre-selected – user must choose (each colour is its own article) */
    ral: null,   /* Wunschfarbe: { code, name, hex } once a RAL is picked */
    anschluss: null, conn: null,
    gravurOn: false, gravurText: '', font: 'Klassisch',
    innenSel: {},   /* name -> { price, qty, label } – multi-select, own qty each */
    strom: 'Standard', stromDelta: 0, stromQty: 1,
    extras: {}   /* name -> { price, qty, label } */
  };

  var items = [].slice.call(document.querySelectorAll('#cfgbSteps .stepr__item'));
  var reached = 0;

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function euro(n) { return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hasInnen() { return Object.keys(state.innenSel).length > 0; }
  function innenSum() { var s = 0; for (var k in state.innenSel) s += state.innenSel[k].price * state.innenSel[k].qty; return s; }
  function innenLabel() {
    var parts = [];
    for (var k in state.innenSel) { var s = state.innenSel[k]; parts.push((s.qty > 1 ? s.qty + '× ' : '') + (s.label || k)); }
    return parts.join(', ') + ' · +' + euro(innenSum());
  }
  function hasStrom() { return state.strom && state.strom !== 'Standard'; }
  function extrasCount() { return Object.keys(state.extras).length; }
  function extrasSum() { var s = 0; for (var k in state.extras) s += state.extras[k].price * state.extras[k].qty; return s; }
  function total() {
    var t = state.mainQty * (BASE + state.finishDelta);
    t += innenSum();
    if (hasStrom()) t += state.stromDelta * state.stromQty;
    return t + extrasSum();
  }
  function setTxt(id, t) { var el = $(id); if (el) el.textContent = t; }
  function curIndex() { for (var i = 0; i < items.length; i++) if (items[i].classList.contains('is-active')) return i; return -1; }

  /* ── Wunschfarbe helpers ── */
  /* the finish as displayed everywhere: a chosen RAL expands the generic "Wunschfarbe nach RAL" */
  function finishText() {
    if (state.finish === WUNSCHFARBE && state.ral) return 'Wunschfarbe · ' + ralCodeLabel(state.ral.code) + ' ' + state.ral.name;
    return state.finish;
  }
  /* Wunschfarbe picked but no RAL chosen yet → the colour choice is incomplete */
  function needsRal() { return state.finish === WUNSCHFARBE && !state.ral; }
  /* legible ink (dark/light) for a swatch background, by perceived luminance */
  /* WCAG relative luminance (sRGB → linear) – drives both the contrast-adaptive label
     colour and the light→dark ordering within a colour family */
  function ralLum(hex) {
    function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    return 0.2126 * lin(parseInt(hex.substr(1, 2), 16))
         + 0.7152 * lin(parseInt(hex.substr(3, 2), 16))
         + 0.0722 * lin(parseInt(hex.substr(5, 2), 16));
  }
  /* black or white ink by actual WCAG contrast against the swatch – not a brightness
     threshold, which underrates saturated yellows/oranges/golds (they'd get white text) */
  function ralInk(hex) {
    var L = ralLum(hex);
    return (L + 0.05) / 0.05 >= 1.05 / (L + 0.05) ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.96)';
  }
  /* "RAL 7016" for numeric RAL codes, plain "DB 703" for the Deutsche-Bahn tone */
  function ralCodeLabel(code) { return /^[0-9]/.test(code) ? 'RAL ' + code : code; }

  /* ── Central refresh ── */
  var priceOpenedOnce = false;   /* auto-expand Preisdetails once, on the first paid add-on */
  function refresh() {
    var t = euro(total());
    var el = $('bTotal');
    if (el && el.textContent !== t) { el.textContent = t; el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); }
    var sp = $('bStickyPrice'); if (sp) sp.innerHTML = (state.finish ? 'konfiguriert · ' : 'ab ') + '<b>' + t + '</b>';

    setTxt('pdpFinishName', finishText() || 'Bitte Farbe wählen');
    /* Product title carries the colour only once a complete colour is chosen
       (Wunschfarbe still needs a RAL tone) – not before, and not on hover. */
    var titleColor = $('pdpTitleColor');
    if (titleColor) {
      if (state.finish && !needsRal()) {
        titleColor.innerHTML = '&nbsp;<span class="pdp-title__sep">|</span> ';
        titleColor.appendChild(document.createTextNode(finishText()));
      } else {
        titleColor.textContent = '';
      }
    }
    setTxt('bArticleInline', state.article || '–');
    var sf = $('pdpStickyFinish'); if (sf) sf.textContent = finishText() || 'Farbe wählen';

    /* colour-preview dot in the label – shows the exact RAL hex once picked */
    var dot = $('pdpFinishDot');
    if (dot) { if (state.ral) { dot.hidden = false; dot.style.background = state.ral.hex; } else { dot.hidden = true; } }
    if (ralUI) ralUI.sync();

    /* "Preis wie konfiguriert" wording appears only after a colour is chosen;
       before that, the price reads "ab 699,00 €" (starting-at) */
    document.querySelectorAll('.cfgb-price__label, .sheet__pricelabel').forEach(function (el) { el.hidden = !state.finish; });
    document.querySelectorAll('#bTotalFrom, #bSheetFrom').forEach(function (el) { el.hidden = !!state.finish; });

    /* CTA prompts for what's missing: a colour first, then (for Wunschfarbe) a RAL tone */
    var ctaTxt = !state.finish ? 'Bitte Farbe wählen' : (needsRal() ? 'Bitte RAL-Farbe wählen' : 'In den Warenkorb');
    var cartBtn = $('bCart'); if (cartBtn) cartBtn.textContent = ctaTxt;
    var sLabel = $('pdpStickyLabel'); if (sLabel) sLabel.textContent = ctaTxt;
    var sheetCartBtn = $('bSheetCart'); if (sheetCartBtn) sheetCartBtn.textContent = ctaTxt;   /* keep the bottom-sheet CTA label in sync with the configurator CTA */
    var checkout = $('bCheckout'); if (checkout) checkout.classList.toggle('is-precolor', !state.finish);

    /* Preisdetails stays hidden until the config carries a surcharge; the first paid
       item reveals it, already expanded (reveal persists; expand fires once so we
       respect the user if they later collapse it) */
    var paidExtra = innenSum() + extrasSum()
      + (hasStrom() ? state.stromDelta * state.stromQty : 0)
      + (state.finishDelta > 0 ? state.finishDelta * state.mainQty : 0);
    if (paidExtra > 0 && checkout) {
      checkout.classList.add('is-priced');
      if (!priceOpenedOnce) {
        var accEl = $('bAcc'), accBtn = $('bDetailsBtn');
        if (accEl) { accEl.classList.add('is-open'); if (accBtn) accBtn.setAttribute('aria-expanded', 'true'); }
        priceOpenedOnce = true;
      }
    }

    setTxt('bPickAnschluss', state.anschluss || 'Bitte wählen');
    setTxt('bPickGravur', state.gravurOn ? (state.gravurText ? '„' + state.gravurText + '" · ' + state.font : 'Mit Gravur') : 'Ohne Gravur');
    setTxt('bPickInnen', hasInnen() ? innenLabel() : 'Ohne Innenstation');
    setTxt('bPickStrom', hasStrom() ? state.strom + ' · +' + euro(state.stromDelta * state.stromQty) : 'Standard · inklusive');
    setTxt('bPickExtras', extrasCount() ? extrasCount() + ' ausgewählt · +' + euro(extrasSum()) : 'Kein Zubehör');

    var eng = $('bEngrave');
    if (eng) {
      eng.textContent = (state.gravurOn && state.gravurText) ? state.gravurText : '';
      eng.style.fontFamily = FONTS[state.font] || '';
      eng.style.setProperty('--engrave-ink', LIGHT_FINISHES[state.finish] ? 'rgba(20,22,25,0.7)' : 'rgba(255,255,255,0.92)');
    }
    // inline per-product qty displays
    setTxt('bMainQtyVal', state.mainQty);
    var mainMinus = document.querySelector('.cfgb-buyrow__qty button[data-qd="-1"][data-target="main"]');
    if (mainMinus) mainMinus.disabled = state.mainQty <= 1;
    document.querySelectorAll('[data-stromqty]').forEach(function (s) { s.textContent = state.stromQty; });
    document.querySelectorAll('[data-qtyfor]').forEach(function (s) { var n = s.getAttribute('data-qtyfor'); s.textContent = state.extras[n] ? state.extras[n].qty : 1; });
    document.querySelectorAll('[data-innenqtyfor]').forEach(function (s) { var n = s.getAttribute('data-innenqtyfor'); s.textContent = state.innenSel[n] ? state.innenSel[n].qty : 1; });
    document.querySelectorAll('.cfg-choice').forEach(function (c) { var o = c.querySelector('.cfg-opt'); c.classList.toggle('is-open', !!(o && o.classList.contains('is-selected'))); });
    markDone();
    updateDock();
    renderSummary();
  }

  function markDone() {
    items.forEach(function (it, i) {
      var active = it.classList.contains('is-active');
      var done = i < reached && !active;
      if (STEPS[i].key === 'anschluss') done = !!state.anschluss && !active;
      it.classList.toggle('is-done', done);
      var head = it.querySelector('.stepr__head');
      if (head) head.setAttribute('aria-expanded', active ? 'true' : 'false');   /* keep header state in sync */
    });
  }

  function updateDock() {
    var cur = curIndex(); if (cur < 0) cur = 0;
    var track = $('bSeg'); if (track) track.style.setProperty('--prog', ((cur + 0.5) / STEPS.length * 100).toFixed(1) + '%');
    /* last (optional) step: once an option is chosen there, show it as done
       (dark teal) instead of current – the config reads as fully complete */
    var lastDone = cur === STEPS.length - 1 && extrasCount() > 0;
    document.querySelectorAll('#bSeg .cfgb-bar__step').forEach(function (s, i) {
      s.classList.toggle('is-filled', i <= reached);
      s.classList.toggle('is-current', i === cur && !lastDone);
      s.setAttribute('aria-selected', i === cur ? 'true' : 'false');
      if (i === cur) { s.setAttribute('aria-current', 'step'); } else { s.removeAttribute('aria-current'); }
    });
    setTxt('bStepN', 'Schritt ' + (cur + 1) + ' von 5');
    setTxt('bStepName', STEPS[cur].name);
    var flag = $('bStepFlag');
    if (flag) { var req = STEPS[cur].req === true; flag.textContent = req ? 'erforderlich' : 'optional'; flag.classList.toggle('is-opt', !req); flag.hidden = false; }
    var back = $('bBack'), fwd = $('bFwd');
    if (back) back.hidden = cur === 0;
    if (fwd) fwd.hidden = cur === STEPS.length - 1;
    syncStepErrors();
  }

  /* ── Required-step error cue on the progress bar ──────────────────────────
     Third validation clue (alongside the card's red border + the red "erforderlich"
     pill): when the user tries to proceed with a required step unanswered, its chevron
     in the progress bar turns red, pointing to WHERE in the flow the gap is. It PERSISTS
     until the requirement is met (cleared in updateDock via syncStepErrors) and re-pulses
     on every fresh failed attempt. Only steps that can be required can enter this state. */
  var erroredSteps = {};
  function stepValid(i) {
    if (i === 0) return !!state.anschluss;                       /* Anschluss (required) */
    if (i === 1) return !(state.gravurOn && !state.gravurText);  /* Gravur text, only if engraving is on */
    return true;                                                 /* remaining steps are optional */
  }
  function stepTab(i) { return document.querySelector('#bSeg .cfgb-bar__step[data-goto="' + i + '"]'); }
  function flagStepError(i) {
    erroredSteps[i] = true;
    var tab = stepTab(i); if (!tab) return;
    tab.classList.add('is-error');
    tab.classList.remove('is-error-pulse'); void tab.offsetWidth; tab.classList.add('is-error-pulse');  /* restart the pulse */
    tab.setAttribute('aria-invalid', 'true');
  }
  function syncStepErrors() {
    Object.keys(erroredSteps).forEach(function (k) {
      if (!stepValid(parseInt(k, 10))) return;   /* still unmet – keep the red chevron */
      delete erroredSteps[k];
      var tab = stepTab(parseInt(k, 10));
      if (tab) { tab.classList.remove('is-error', 'is-error-pulse'); tab.removeAttribute('aria-invalid'); }
    });
  }

  /* ── Price-details summary (itemized cart) ── */
  function roQty(q) { return '<span class="sum-qty-ro">×&nbsp;' + q + '</span>'; }
  function row(name, sub, qtyHtml, price, cls) {
    return '<div class="sum-row ' + (cls || '') + '">'
      + '<span class="sum-row__name">' + name + (sub ? '<span class="sum-sub">' + sub + '</span>' : '') + '</span>'
      + (qtyHtml || '<span></span>')
      + '<span class="sum-row__price' + (price === 'inklusive' ? ' is-incl' : '') + '">' + price + '</span>'
      + '</div>';
  }
  function renderSummary() {
    var el = $('bSummary'); if (!el) return;
    var h = '';
    h += row('<b>Metzler VDM10 2.0</b>', esc(finishText()), roQty(state.mainQty), euro(state.mainQty * (BASE + state.finishDelta)));
    if (state.anschluss) h += row('Anschluss', esc(state.anschluss), null, 'inklusive');
    if (state.gravurOn) h += row('Gravur', state.gravurText ? '„' + esc(state.gravurText) + '" · ' + state.font : 'Mit Namensgravur', null, 'inklusive');
    for (var ik in state.innenSel) { var iv = state.innenSel[ik]; h += row(esc(iv.label || ik), null, roQty(iv.qty), euro(iv.price * iv.qty)); }
    if (hasStrom()) h += row(esc(state.strom), null, null, euro(state.stromDelta * state.stromQty));
    for (var k in state.extras) { var x = state.extras[k]; h += row(esc(x.label || k), null, roQty(x.qty), euro(x.price * x.qty)); }
    document.querySelectorAll('.cfgb-summary').forEach(function (x) { x.innerHTML = h; });
    var n = el.querySelectorAll('.sum-row').length;
    setTxt('bSheetTotal', euro(total()));
    var dn = $('bDetailsN'); if (dn) dn.textContent = n + (n === 1 ? ' Position' : ' Positionen');
  }
  function applyQty(target, d) {
    if (target === 'main') state.mainQty = clamp(state.mainQty + d, 1, 20);
    else if (target === 'strom') state.stromQty = clamp(state.stromQty + d, 1, 10);
    else if (target.indexOf('innen:') === 0) { var ni = target.slice(6); if (state.innenSel[ni]) state.innenSel[ni].qty = clamp(state.innenSel[ni].qty + d, 1, 11); }
    else if (target.indexOf('extra:') === 0) { var n = target.slice(6); if (state.extras[n]) state.extras[n].qty = clamp(state.extras[n].qty + d, 1, 20); }
    refresh();
  }
  /* qty steppers work in BOTH the inline accordion and the sheet */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-qd]'); if (!b) return;
    e.stopPropagation();
    applyQty(b.getAttribute('data-target'), parseInt(b.getAttribute('data-qd'), 10));
  });

  /* ── Availability (universal) – one treatment for options that are OUT OF STOCK
     or INCOMPATIBLE with an earlier choice. Instead of hiding them (or slapping on
     a rotated watermark), the tile stays visible but goes inert: dimmed + a single
     flat status chip that names the reason, so the user learns why. ── */
  function connLabel(c) { return c === 'lan' ? 'Nur mit LAN / PoE' : c === '2draht' ? 'Nur mit 2-Draht IP' : 'Nicht kompatibel'; }
  var BADGE_ICON = {
    oos: '',
    incompat: ''
  };
  function setUnavailable(o, kind, text) {
    o.classList.add('is-unavailable');
    o.setAttribute('aria-disabled', 'true');
    var badge = o.querySelector('.cfg-opt__badge');
    if (!badge) { badge = document.createElement('span'); o.appendChild(badge); }
    badge.className = 'cfg-opt__badge ' + (kind === 'oos' ? 'is-oos' : 'is-incompat');
    badge.innerHTML = BADGE_ICON[kind] + '<span>' + text + '</span>';
  }
  function setAvailable(o) {
    o.classList.remove('is-unavailable');
    o.removeAttribute('aria-disabled');
    var badge = o.querySelector('.cfg-opt__badge'); if (badge) badge.parentNode.removeChild(badge);
  }
  function isOOS(o) { return o.getAttribute('data-stock') === 'out'; }

  function applyConn() {
    /* Innenstationen – multi-select: mark each option available/inert, and if a
       CHECKED one becomes incompatible or out of stock, uncheck it and drop it
       from the selection (no forced fallback – "none selected" is a valid state). */
    var innenBox = $('bInnen');
    if (innenBox) {
      [].slice.call(innenBox.querySelectorAll('.cfg-opt')).forEach(function (o) {
        var c = o.getAttribute('data-conn');
        var compat = !state.conn || c === 'both' || c === state.conn;
        if (isOOS(o)) setUnavailable(o, 'oos', 'Ausverkauft');
        else if (!compat) setUnavailable(o, 'incompat', connLabel(c));
        else setAvailable(o);
        if (o.classList.contains('is-unavailable') && o.classList.contains('is-selected')) {
          o.classList.remove('is-selected');
          delete state.innenSel[o.getAttribute('data-innen')];
        }
      });
    }
    /* Stromversorgung – single-select: on block, fall back to the first available. */
    var stromBox = $('bStrom');
    if (stromBox) {
      var opts = [].slice.call(stromBox.querySelectorAll('.cfg-opt'));
      var selBlocked = false;
      opts.forEach(function (o) {
        var c = o.getAttribute('data-conn');
        var compat = !state.conn || c === 'both' || c === state.conn;
        if (isOOS(o)) setUnavailable(o, 'oos', 'Ausverkauft');
        else if (!compat) setUnavailable(o, 'incompat', connLabel(c));
        else setAvailable(o);
        if (o.classList.contains('is-unavailable') && o.classList.contains('is-selected')) {
          o.classList.remove('is-selected'); selBlocked = true;
        }
      });
      if (selBlocked) { state.strom = 'Standard'; state.stromDelta = 0; }   /* revert to Standard, never auto-pick a paid switch */
    }
  }
  /* out-of-stock in groups without a connection dependency (Anschluss, Zubehör) */
  function applyStock() {
    [].slice.call(document.querySelectorAll('#cfgbSteps .cfg-opt[data-stock="out"]')).forEach(function (o) {
      if (!o.closest('#bInnen') && !o.closest('#bStrom')) setUnavailable(o, 'oos', 'Ausverkauft');
    });
  }
  function syncGroupState(id, btn) {
    if (id === 'bStrom') { state.strom = btn.getAttribute('data-strom'); state.stromDelta = parseFloat(btn.getAttribute('data-delta')) || 0; }
  }

  /* ── Single-step navigation (step-dock + Weiter/Zurück) ── */
  function openStep(i, skipScroll) {
    if (i < 0) i = 0; if (i > STEPS.length - 1) i = STEPS.length - 1;
    items.forEach(function (it, ix) { it.classList.toggle('is-active', ix === i); });
    if (i > reached) reached = i;
    refresh();
    if (skipScroll) return;
    var target = items[i];
    if (!target) return;
    var body = target.querySelector('.stepr__body');
    var mobileAccordion = body && getComputedStyle(body).display === 'grid';   /* desktop shows all steps (display:block) – no accordion */
    if (!mobileAccordion) {
      /* Desktop: config is fully visible – only nudge it into view if off-screen. */
      var deskDock = document.querySelector('.cfgb-dock');
      if (deskDock) window.setTimeout(function () { deskDock.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 60);
      return;
    }
    /* Mobile: scroll the opened step to just below the pinned header + step-dock.
       The dock is sticky, so the old dock.scrollIntoView was a no-op once it was
       stuck to the top (tapping a step went nowhere). scrollIntoView re-reads layout
       at call time, and we call it again after the .45s accordion settle so it lands
       correctly despite the other steps collapsing/reflowing. */
    var scrollToStep = function () {
      var hdr = document.querySelector('.header');
      var dock = document.querySelector('.cfgb-dock');
      var pin = (hdr ? hdr.getBoundingClientRect().height : 0) + (dock ? dock.getBoundingClientRect().height : 0) + 12;
      target.style.scrollMarginTop = pin + 'px';
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.setTimeout(scrollToStep, 60);    /* start moving immediately */
    window.setTimeout(scrollToStep, 500);   /* re-align after the accordion finishes reflowing */
  }
  function flashStep(i) { var it = items[i]; if (!it) return; var p = it.querySelector('.stepr__pad') || it; p.classList.remove('is-flash'); void p.offsetWidth; p.classList.add('is-flash'); }
  var invalidTimers = {};
  function flashInvalid(el) {
    if (!el) return;
    el.classList.remove('is-invalid'); void el.offsetWidth; el.classList.add('is-invalid');
    var id = el.id || 'anon';
    if (invalidTimers[id]) window.clearTimeout(invalidTimers[id]);
    invalidTimers[id] = window.setTimeout(function () { el.classList.remove('is-invalid'); }, 1600);
  }
  /* Scroll so the step-dock sits just below the site header – un-stuck, so the
     progress bar AND the requirement label are both visible (the label hides
     while the dock is stuck to the header). Target the NON-sticky panel, not the
     dock: a stuck dock reports top === header height, which would scroll nowhere. */
  function scrollToProgress() {
    var panel = document.querySelector('#cfgbPanel') || document.querySelector('.cfgb'); if (!panel) return;
    var hdr = document.querySelector('.header') || document.querySelector('header');
    var pin = hdr ? Math.round(hdr.getBoundingClientRect().height) : 104;
    var y = window.pageYOffset + panel.getBoundingClientRect().top - pin - 12;
    window.scrollTo({ top: y < 0 ? 0 : y, behavior: 'smooth' });
  }
  function flashRequired() { var f = $('bStepFlag'); if (!f || f.classList.contains('is-opt')) return; f.classList.remove('is-pulse'); void f.offsetWidth; f.classList.add('is-pulse'); window.setTimeout(function () { f.classList.remove('is-pulse'); }, 1200); }
  function fwdStep() {
    var cur = curIndex();
    if (cur === 0 && !state.anschluss) { scrollToProgress(); flashStep(0); flashInvalid($('bAnschluss')); flashRequired(); flagStepError(0); return; }
    if (cur === 1 && state.gravurOn && !state.gravurText) { scrollToProgress(); flashStep(1); flashInvalid($('bGravurText')); flagStepError(1); return; }
    if (cur < STEPS.length - 1) openStep(cur + 1);
  }
  function backStep() { var cur = curIndex(); if (cur > 0) openStep(cur - 1); }
  var fwdB = $('bFwd'); if (fwdB) fwdB.addEventListener('click', fwdStep);
  var backB = $('bBack'); if (backB) backB.addEventListener('click', backStep);
  /* in-step "Weiter" buttons advance (auto-advance was removed) */
  document.querySelectorAll('#cfgbSteps [data-next]').forEach(function (b) { b.addEventListener('click', fwdStep); });
  document.querySelectorAll('#bSeg .cfgb-bar__step').forEach(function (b) {
    b.addEventListener('click', function () { openStep(parseInt(b.getAttribute('data-goto'), 10)); });
  });
  /* Option A accordion (mobile): a step header toggles its step in place – tap an
     open section's chevron to collapse it, tap a closed one to open it (and collapse
     the rest). Headers are display:none on desktop, so this is a no-op there. */
  document.querySelectorAll('#cfgbSteps .stepr__head').forEach(function (h) {
    h.addEventListener('click', function () {
      var it = h.closest('.stepr__item'); if (!it) return;
      var i = parseInt(it.getAttribute('data-step'), 10);
      if (isNaN(i)) return;
      if (it.classList.contains('is-active')) {
        it.classList.remove('is-active');   /* collapse the open section */
        refresh();
      } else {
        openStep(i, true);
      }
    });
  });

  /* ── Farbe = VARIANTE ── */
  var sw = $('pdpSwatches');
  if (sw) sw.addEventListener('click', function (e) {
    var b = e.target.closest('.pdp-swatch'); if (!b) return;
    /* Anchor the clicked swatch: choosing a colour appends the finish to the H1
       (which can wrap onto another line) and reveals the configurator – both sit
       ABOVE the swatch row, so the whole row would jump down on the pick. Capture
       its viewport position now and restore it after the DOM updates below. */
    var anchorY = b.getBoundingClientRect().top;
    this.querySelectorAll('.pdp-swatch').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
    b.setAttribute('aria-pressed', 'true');
    /* Touch: the travelling line is driven by SCROLL progress, so a plain tap (no
       scroll) never moves it – it stays parked at the far left, under the "Farbe – …"
       label. Slide it under the tapped swatch here (same offsetLeft model as the
       scroll handler). */
    if (document.body.classList.contains('swtouch')) {
      var swln = this.querySelector('.bx-swline');
      if (swln) swln.style.transform = 'translateX(' + Math.round(b.offsetLeft) + 'px)';
      /* v2: tapping a partially-visible ("half") swatch at a scroll edge should bring the whole
         swatch into view. Scroll to its scroll-progress position (idx/(n-1)·maxScroll) so the
         scroll-driven indicator settles on it too. Skipped when the swatch is already fully shown. */
      if (document.documentElement.classList.contains('flow-b')) {
        var swMax = this.scrollWidth - this.clientWidth;
        var swFull = b.offsetLeft >= this.scrollLeft - 1 && (b.offsetLeft + b.offsetWidth) <= this.scrollLeft + this.clientWidth + 1;
        if (swMax > 1 && !swFull) {
          var swAll = [].slice.call(this.querySelectorAll('.pdp-swatch'));
          var swI = swAll.indexOf(b);
          var swFrac = swAll.length > 1 ? swI / (swAll.length - 1) : 0;
          var swReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          this.scrollTo({ left: Math.round(swFrac * swMax), behavior: swReduce ? 'auto' : 'smooth' });
        }
      }
    }
    state.finish = b.getAttribute('data-finish'); state.finishDelta = parseFloat(b.getAttribute('data-delta')) || 0;
    state.article = b.getAttribute('data-article') || state.article;
    var img = $('pdpMainImg'); if (img) { img.style.opacity = '0.35'; window.setTimeout(function () { img.style.opacity = '1'; }, 200); }
    /* Wunschfarbe → reveal the inline RAL picker; any standard colour → close it and drop the RAL */
    if (ralUI) { if (state.finish === WUNSCHFARBE) ralUI.open(); else { ralUI.close(); state.ral = null; } }
    /* colour chosen → unlock the configurator (colour drives the available options) */
    this.classList.remove('is-invalid');
    var panel = $('cfgbPanel');
    if (panel && panel.classList.contains('is-locked')) {
      panel.classList.remove('is-locked');
      window.dispatchEvent(new Event('resize'));   /* re-run dock geometry now the panel has height */
    }
    refresh();
    /* Restore the clicked swatch to where it was so the pick doesn't jump the page.
       Instant (page scroll-behavior is smooth, which would animate the correction
       into a visible slide). Skipped at the very top when there's no room to scroll
       up – but the title/config growth is below the fold there, so nothing shifts. */
    var dy = Math.round(b.getBoundingClientRect().top - anchorY);
    if (Math.abs(dy) > 1) {
      var root = document.documentElement, prevSB = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollBy(0, dy);
      root.style.scrollBehavior = prevSB;
    }
  });
  /* preview any colour's full name in the prominent label on hover/focus (no click needed) */
  if (sw) {
    /* Desktop: a short teal line sits on top of the swatch whose name is currently
       shown – i.e. the hovered/focused one, falling back to the selected swatch at
       rest (hidden when nothing is chosen yet). Mirrors the mobile travelling line,
       but driven by hover. (The touch build drives .bx-swline via scroll instead.) */
    var swlineD = sw.querySelector('.bx-swline');
    /* Left-aligned to the swatch (translate to its offset). Shown only for a hovered
       or selected swatch; passing no element hides it (fades out). */
    var moveSwlineTo = function (el) {
      if (!swlineD || document.body.classList.contains('swtouch')) return;
      if (!el) { swlineD.classList.remove('is-on'); return; }
      swlineD.style.transform = 'translate(' + Math.round(el.offsetLeft) + 'px,' + Math.round(el.offsetTop) + 'px)';
      swlineD.classList.add('is-on');
    };
    /* rest on the SELECTED swatch; hidden entirely when no colour is chosen yet
       (label reads "Bitte Farbe wählen") */
    var restSwlineToSelected = function () { moveSwlineTo(sw.querySelector('.pdp-swatch[aria-pressed="true"]')); };

    var previewName = function (e) { var b = e.target.closest('.pdp-swatch'); if (b) { setTxt('pdpFinishName', b.getAttribute('data-finish')); moveSwlineTo(b); } };
    var restoreName = function () { setTxt('pdpFinishName', finishText() || 'Bitte Farbe wählen'); restSwlineToSelected(); };
    sw.addEventListener('mouseover', previewName);
    sw.addEventListener('mouseout', restoreName);
    sw.addEventListener('focusin', previewName);
    sw.addEventListener('focusout', restoreName);
    window.addEventListener('resize', restSwlineToSelected, { passive: true });
    restSwlineToSelected();   /* initial position (selected swatch, or hidden if none) */
  }

  /* ── Wunschfarbe: inline RAL picker – search field + palette, shown when
     Wunschfarbe is chosen (search by code or name); live preview ── */
  function setupRalPicker() {
    var panel = $('ralPick'), trigger = $('ralTrigger'), track = $('ralGrid'),
        viewport = $('ralViewport'), pager = $('ralPager'),
        prevBtn = $('ralPrev'), nextBtn = $('ralNext'), pageInfo = $('ralPageInfo'),
        search = $('ralSearch'), clearBtn = $('ralClear'), empty = $('ralEmpty'),
        fams = $('ralFams'), count = $('ralCount'),
        trigSwatch = $('ralTrigSwatch'), trigLabel = $('ralTrigLabel'), trigSub = $('ralTrigSub');
    if (!panel || !track || !trigger) return;
    var curQ = '', curFam = 'all', TOTAL = RAL.length;
    var PAGE_ROWS = 4, page = 0, pages = [], cols = 5;
    var byCode = {}; RAL.forEach(function (c) { byCode[c.code] = c; });

    /* colour-family filter pills (representative dot per RAL group) */
    var FAM_DOT = { '1':'#F9A800','2':'#F44611','3':'#AF2B1E','4':'#6D3F5B','5':'#063971','6':'#276235','7':'#7A7B6D','8':'#6C3B2A' };
    if (fams) fams.innerHTML = RAL_FAMS.map(function (f) {
      var key = f[0], dotStyle;
      if (key === 'all')      dotStyle = 'background:conic-gradient(from 90deg,#F9A800,#F44611,#AF2B1E,#6D3F5B,#063971,#276235,#6C3B2A,#F9A800)';
      else if (key === '9')   dotStyle = 'background:linear-gradient(135deg,#fff 0 50%,#141414 50% 100%)';
      else                    dotStyle = 'background:' + FAM_DOT[key];
      return '<button type="button" class="ralpick__fam' + (key === 'all' ? ' is-active' : '') + '" role="tab" aria-selected="' + (key === 'all') + '" data-fam="' + key + '">'
        + '<span class="ralpick__famdot" style="' + dotStyle + '"></span>' + esc(f[1]) + '</button>';
    }).join('');
    var famBtns = fams ? [].slice.call(fams.querySelectorAll('.ralpick__fam')) : [];

    /* flanking scroll chevrons + edge fades for the family strip: each side is shown/faded
       only while the strip can still scroll that way, so the row never looks abruptly cut */
    var famPrev = $('ralFamPrev'), famNext = $('ralFamNext');
    function updateFamNav() {
      if (!fams) return;
      var max = fams.scrollWidth - fams.clientWidth;
      var canL = fams.scrollLeft > 2, canR = fams.scrollLeft < max - 2;
      fams.classList.toggle('can-left', canL);
      fams.classList.toggle('can-right', canR);
      if (famPrev) famPrev.classList.toggle('is-shown', canL);
      if (famNext) famNext.classList.toggle('is-shown', canR);
    }
    /* scroll the strip ~70% of its width toward the arrow. Direct scrollLeft assignment –
       not scrollBy/scrollTo({behavior:'smooth'}), whose animation pauses in background tabs –
       and no scroll-behavior:smooth on the strip itself (that would make the 1:1 drag lag). */
    function scrollFams(dir) {
      if (!fams) return;
      var amt = Math.max(120, fams.clientWidth * 0.7) * dir;
      fams.scrollLeft = Math.max(0, Math.min(fams.scrollWidth - fams.clientWidth, fams.scrollLeft + amt));
      updateFamNav();   /* refresh arrow visibility immediately (don't wait on the scroll event) */
    }
    if (famPrev) famPrev.addEventListener('click', function () { scrollFams(-1); });
    if (famNext) famNext.addEventListener('click', function () { scrollFams(1); });
    if (fams) fams.addEventListener('scroll', updateFamNav, { passive: true });

    function chipHTML(c) {
      return '<button type="button" class="ral-chip" role="option" aria-selected="false" data-code="' + c.code + '" data-fam="' + c.fam + '"'
        + ' style="--chip:' + c.hex + ';color:' + ralInk(c.hex) + '" title="' + ralCodeLabel(c.code) + ' ' + esc(c.name) + '">'
        + '<span class="ral-chip__code">' + ralCodeLabel(c.code) + '</span><span class="ral-chip__name">' + esc(c.name) + '</span></button>';
    }
    function filteredList() {
      var q = curQ.trim().toLowerCase();
      return RAL.filter(function (c) {
        var famOk = curFam === 'all' || c.fam === curFam;
        var qOk = !q || c.code.toLowerCase().indexOf(q) > -1 || c.name.toLowerCase().indexOf(q) > -1 || (ralCodeLabel(c.code).toLowerCase()).indexOf(q) > -1;
        return famOk && qOk;
      });
    }
    /* how many columns fit → keeps ~PAGE_ROWS rows per page across viewport sizes */
    function computeCols() {
      var w = (viewport && viewport.clientWidth) || 320;
      return Math.max(1, Math.floor((w + 8) / (100 + 8)));   /* 6.25rem min col + 0.5rem gap */
    }
    function updateSlide() {
      var n = pages.length;
      track.style.transform = 'translateX(' + (-page * 100) + '%)';
      if (pager) pager.hidden = n <= 1;
      if (pageInfo) pageInfo.textContent = (n ? page + 1 : 0) + ' / ' + n;
      if (prevBtn) prevBtn.disabled = page <= 0;
      if (nextBtn) nextBtn.disabled = page >= n - 1;
    }
    function goTo(p) { page = Math.max(0, Math.min(pages.length - 1, p)); updateSlide(); }
    /* paginate the filtered list into full-width pages and render them into the track */
    function renderPages(reset) {
      var list = filteredList();
      cols = computeCols();
      var per = cols * PAGE_ROWS, i;
      pages = [];
      for (i = 0; i < list.length; i += per) pages.push(list.slice(i, i + per));
      if (reset) page = 0;
      if (page > pages.length - 1) page = Math.max(0, pages.length - 1);
      track.innerHTML = pages.map(function (pg) {
        return '<div class="ralpick__page" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr))">' + pg.map(chipHTML).join('') + '</div>';
      }).join('');
      if (empty) empty.hidden = list.length > 0;
      if (viewport) viewport.hidden = list.length === 0;   /* no empty 20rem box on a no-match search */
      if (count) count.textContent = list.length === TOTAL ? TOTAL + ' Töne' : list.length + ' / ' + TOTAL;
      updateSlide();
      sync();
    }
    function pageOfSelected() {
      if (state.ral) for (var i = 0; i < pages.length; i++) for (var j = 0; j < pages[i].length; j++) if (pages[i][j].code === state.ral.code) return i;
      return 0;
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(page - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(page + 1); });

    /* swipe – page on horizontal release past a threshold (vertical stays with the page) */
    if (viewport) {
      var x0 = null, dx = 0, dragging = false;
      viewport.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button !== 0) return; x0 = e.clientX; dx = 0; dragging = true; });
      viewport.addEventListener('pointermove', function (e) { if (dragging) dx = e.clientX - x0; });
      window.addEventListener('pointerup', function () { if (!dragging) return; dragging = false; if (Math.abs(dx) > 40) goTo(page + (dx < 0 ? 1 : -1)); x0 = null; dx = 0; });
    }

    /* keep the pressed pill fully in view – nudge the filter strip (not the page) if it's
       clipped. Scroll to an ABSOLUTE target (from the pill's content offset), never a
       relative scrollBy: fast successive selections issued additive smooth scrollBy
       deltas that stacked and overshot ("extra movements"). scrollTo retargets to the
       latest pill instead, so the strip settles in one clean move. */
    function revealFam(btn) {
      if (!fams || !btn) return;
      var pad = 10;
      var left = btn.offsetLeft, right = left + btn.offsetWidth;
      var viewL = fams.scrollLeft, viewR = viewL + fams.clientWidth;
      var target = null;
      if (left < viewL + pad) target = left - pad;
      else if (right > viewR - pad) target = right - fams.clientWidth + pad;
      if (target != null) {
        target = Math.max(0, Math.min(target, fams.scrollWidth - fams.clientWidth));
        fams.scrollTo({ left: target, behavior: 'smooth' });
      }
    }
    function setFam(key) {
      curFam = key;
      var activeBtn = null;
      famBtns.forEach(function (b) {
        var on = b.getAttribute('data-fam') === key;
        b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) activeBtn = b;
      });
      revealFam(activeBtn);
      renderPages(true);
    }
    if (fams) fams.addEventListener('click', function (e) { var b = e.target.closest('.ralpick__fam'); if (b) setFam(b.getAttribute('data-fam')); });

    /* Desktop: click-and-drag to scroll the family strip (touch/trackpad already scroll
       it natively, so this is mouse-only – native touch scrolling stays untouched). A
       small movement threshold keeps a plain click from being swallowed. */
    if (fams) {
      var fDrag = false, fMoved = false, fX0 = 0, fSL0 = 0;
      fams.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        fDrag = true; fMoved = false; fX0 = e.clientX; fSL0 = fams.scrollLeft;
        fams.classList.add('is-dragging');
      });
      fams.addEventListener('pointermove', function (e) {
        if (!fDrag) return;
        var d = e.clientX - fX0;
        if (Math.abs(d) > 3) fMoved = true;
        fams.scrollLeft = fSL0 - d;
      });
      var endFamDrag = function () { if (!fDrag) return; fDrag = false; fams.classList.remove('is-dragging'); };
      window.addEventListener('pointerup', endFamDrag);
      window.addEventListener('pointercancel', endFamDrag);
      /* swallow the click that ends a drag so it doesn't also select a family */
      fams.addEventListener('click', function (e) { if (fMoved) { e.stopPropagation(); e.preventDefault(); fMoved = false; } }, true);
    }

    /* collapsed trigger reflects the current selection at a glance */
    function updateTrigger() {
      if (state.ral) {
        trigSwatch.classList.remove('ralpick__swatch--empty');
        trigSwatch.style.background = state.ral.hex; trigSwatch.innerHTML = '';
        trigLabel.textContent = ralCodeLabel(state.ral.code);
        trigSub.textContent = state.ral.name;
      } else {
        trigSwatch.classList.add('ralpick__swatch--empty');
        trigSwatch.style.background = ''; trigSwatch.innerHTML = '';
        trigLabel.textContent = 'Wunschfarbe wählen';
        trigSub.textContent = 'RAL Classic – Farbton suchen & auswählen';
      }
    }

    function sync() {
      [].slice.call(track.querySelectorAll('.ral-chip')).forEach(function (ch) {
        var on = !!(state.ral && ch.getAttribute('data-code') === state.ral.code);
        ch.classList.toggle('is-selected', on); ch.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      updateTrigger();
    }

    function openGrid()  { panel.classList.add('is-open');  trigger.setAttribute('aria-expanded', 'true'); }
    function closeGrid() { panel.classList.remove('is-open'); trigger.setAttribute('aria-expanded', 'false'); }

    /* after the panel expands, if it's clipped (below the fold or under the sticky
       header) scroll it into a good position – mainly a mobile need where the open
       picker runs past the viewport */
    var mqMobile = window.matchMedia('(max-width: 767px)');
    /* height occluded at the top = the sticky header PLUS the "Info & Hilfecenter"
       quickbar that pins beneath it on mobile – otherwise a scrolled-up element
       lands under the quickbar. Use whichever bar reaches furthest down right now. */
    function stickyTopOffset() {
      var header = document.querySelector('.header');
      var qb = document.getElementById('quickbar');
      var hb = header ? header.getBoundingClientRect().bottom : 0;
      var qbb = qb ? qb.getBoundingClientRect().bottom : 0;
      return Math.max(0, hb, qbb);
    }
    function scrollPickerIntoView() {
      window.setTimeout(function () {
        var headBottom = stickyTopOffset();
        var r = panel.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight;
        if (r.bottom > vh - 8 || r.top < headBottom + 4) {
          window.scrollTo({ top: window.scrollY + r.top - headBottom - 12, behavior: 'smooth' });
        }
      }, 360);   /* wait out the expand animation so the final height is measured */
    }
    /* bring the picker trigger (the "field" that shows the chosen tone) up under the
       sticky header + quickbar – used after a pick on mobile so the selection is confirmed on screen */
    function scrollFieldIntoView() {
      var headBottom = stickyTopOffset();
      var r = trigger.getBoundingClientRect();
      /* always bring the field (showing the just-picked RAL code) to just under the
         pinned top bars, whether it's scrolled above the top or below the fold – so
         the auto-filled code is fully confirmed on screen after every pick */
      var target = Math.max(0, window.scrollY + r.top - headBottom - 12);
      if (Math.abs(target - window.scrollY) > 4) {
        var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: target, behavior: rm ? 'auto' : 'smooth' });
      }
    }
    /* desktop: only pull the field back up when the pick left it OUT of view (scrolled
       above the pinned top bars, or below the fold) – if it's already visible, don't jump */
    function scrollFieldIntoViewIfNeeded() {
      var headBottom = stickyTopOffset();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var r = trigger.getBoundingClientRect();
      if (r.top < headBottom + 4 || r.bottom > vh - 8) scrollFieldIntoView();
    }

    trigger.addEventListener('click', function () {
      if (panel.classList.contains('is-open')) closeGrid();
      else {
        openGrid();
        /* Don't auto-focus the search on any breakpoint – the picker opens in its
           default (unfocused) state; the user taps the field when they want to search. */
        goTo(pageOfSelected());
        window.setTimeout(updateFamNav, 380);   /* strip clientWidth is known once the panel has expanded */
        /* only nudge the page on mobile (where the open picker runs past the viewport);
           on desktop it fits, so don't auto-scroll */
        if (mqMobile.matches) scrollPickerIntoView();
      }
    });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('is-open') && !panel.contains(e.target)) closeGrid();
    });
    document.addEventListener('keydown', function (e) {
      if (!panel.classList.contains('is-open')) return;
      if (e.key === 'Escape') { closeGrid(); trigger.focus(); }
      else if (e.key === 'ArrowRight' && document.activeElement !== search) goTo(page + 1);
      else if (e.key === 'ArrowLeft'  && document.activeElement !== search) goTo(page - 1);
    });

    /* Auto-collapse once the open picker has scrolled off the top of the viewport.
       The "is it off-screen?" state is owned by an IntersectionObserver (a reliable boolean),
       NOT a fresh getBoundingClientRect() read at fire time – on mobile that rect is sometimes
       momentarily stale right after a scroll, which made the collapse bail out intermittently
       ("sometimes works, sometimes not"). The collapse itself removes the off-screen height and
       re-anchors the scroll by that amount, done at scroll-idle so it never fights momentum
       → no jump. (Falls back to a rect check only where IntersectionObserver is unavailable.) */
    var ralPanelEl = $('ralPanel');
    var hasIO = 'IntersectionObserver' in window, offscreen = false;
    /* off-screen if EITHER signal says so: the IntersectionObserver boolean (immune to the
       stale-rect problem) OR a live rect read (catches anything IO hasn't reported yet). Both
       are false while the picker is in view, so this never collapses prematurely. */
    function exited() { return offscreen || panel.getBoundingClientRect().bottom <= 0; }
    function doCollapse() {
      if (!panel.classList.contains('is-open') || !exited()) return;   /* closed or still in view */
      var s = window.scrollY, beforeH = panel.getBoundingClientRect().height;
      if (ralPanelEl) ralPanelEl.style.transition = 'none';  /* instant collapse (it's off-screen) */
      closeGrid();
      void panel.offsetHeight;                               /* force sync reflow */
      var afterH = panel.getBoundingClientRect().height;
      /* re-anchor the scroll INSTANTLY. The page sets html{scroll-behavior:smooth}, which would
         otherwise ANIMATE this compensation – the content visibly glides (the "jump"). Force an
         instant jump-cut by neutralising scroll-behavior for just this one scrollTo. */
      var de = document.documentElement, prevSB = de.style.scrollBehavior;
      de.style.scrollBehavior = 'auto';
      window.scrollTo(0, Math.max(0, s - (beforeH - afterH)));  /* keep the visible content put */
      de.style.scrollBehavior = prevSB;
      if (ralPanelEl) window.requestAnimationFrame(function () { ralPanelEl.style.transition = ''; });
    }
    /* Collapse the MOMENT the picker leaves the top of the viewport – no idle wait. The user
       wants it gone as soon as they've scrolled past it, not when they stop at the page bottom.
       Fire on the IntersectionObserver's exit and on every scroll (doCollapse no-ops until the
       picker is actually off the top); touchend/scrollend are extra catch-alls. */
    if (hasIO) {
      new IntersectionObserver(function (es) {
        offscreen = !es[0].isIntersecting;                   /* picker sits near the page top, so "not intersecting" == scrolled off the top */
        if (offscreen) doCollapse();
      }, { threshold: 0 }).observe(panel);
    }
    window.addEventListener('scroll', doCollapse, { passive: true });
    window.addEventListener('touchend', doCollapse, { passive: true });
    if ('onscrollend' in window) window.addEventListener('scrollend', doCollapse, { passive: true });

    if (search) search.addEventListener('input', function () {
      curQ = this.value; if (clearBtn) clearBtn.hidden = !this.value;
      if (this.value && curFam !== 'all') setFam('all'); else renderPages(true);
    });
    if (clearBtn) clearBtn.addEventListener('click', function () { search.value = ''; curQ = ''; this.hidden = true; renderPages(true); search.focus(); });

    track.addEventListener('click', function (e) {
      var b = e.target.closest('.ral-chip'); if (!b) return;
      var c = byCode[b.getAttribute('data-code')]; if (!c) return;
      state.ral = { code: c.code, name: c.name, hex: c.hex };
      panel.classList.remove('is-invalid');
      /* keep the palette open after a pick so the user can compare / re-choose;
         it closes via the chevron, an outside click, or Esc */
      refresh();     /* refresh() → ralUI.sync() updates trigger + chip highlight */
      /* mobile: a pick deep in the grid leaves the picker "field" (trigger showing the
         chosen tone) scrolled off the top – bring it back into view so the selection
         is visibly confirmed */
      if (mqMobile.matches) scrollFieldIntoView(); else scrollFieldIntoViewIfNeeded();
    });

    /* re-paginate when the viewport width changes (column count may change) */
    var rz;
    window.addEventListener('resize', function () {
      if (!panel.classList.contains('is-open')) return;
      clearTimeout(rz); rz = window.setTimeout(function () { renderPages(false); updateFamNav(); }, 150);
    });

    ralUI = {
      open: function () { panel.classList.add('is-shown'); if (search) { search.value = ''; curQ = ''; } if (clearBtn) clearBtn.hidden = true; setFam('all'); sync(); closeGrid(); },
      close: function () { panel.classList.remove('is-shown'); closeGrid(); },
      flash: function () { openGrid(); panel.classList.remove('is-invalid'); void panel.offsetWidth; panel.classList.add('is-invalid'); scrollPickerIntoView(); },
      sync: sync
    };
    renderPages(true);
    updateTrigger();
  }
  setupRalPicker();

  /* ── Swatch labelling on touch (hover is a capability, not a screen size) ──
     Pointer devices keep the compact hover-preview grid. Touch devices (no hover) get
     a snap-scroller whose caption (the "Ausführung – …" header) follows the centred
     swatch, since there is no hover to reveal the colour names.
     ?touch=1 forces the touch treatment on a pointer device so it can be previewed. */
  (function () {
    var params = new URLSearchParams(location.search);
    var isTouch = params.get('touch') === '1' || (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);
    document.body.classList.toggle('swtouch', !!isTouch);
    if (isTouch && sw) {
      var swline = sw.querySelector('.bx-swline');
      var swatchEls = [].slice.call(sw.querySelectorAll('.pdp-swatch'));   /* cached – the set never changes */
      var ticking = false;
      /* Edge-fade state (see CSS): fade whichever side still has swatches off-screen. */
      var setEdge = function () {
        var m = sw.scrollWidth - sw.clientWidth, sl = sw.scrollLeft;
        sw.setAttribute('data-scroll', m <= 2 ? 'none' : (sl <= 1 ? 'start' : (sl >= m - 1 ? 'end' : 'middle')));
      };
      /* Active swatch = mapped from SCROLL PROGRESS across the whole strip: the first
         swatch is active at rest and the last at max scroll, with the rest spread evenly
         between. This replaces the old "nearest the left edge" model, which needed a
         viewport-wide trailing gap to drag the final swatch to the left edge (that gap
         left a big blank space at the end, and on narrow phones the strip ran out of
         runway and "stuck" before the last swatches). rAF-throttled to one measure+write
         per frame so sliding stays smooth. */
      var update = function () {
        ticking = false;
        setEdge();
        var maxScroll = sw.scrollWidth - sw.clientWidth;
        var frac = maxScroll > 0 ? sw.scrollLeft / maxScroll : 0;
        var idx = Math.round(frac * (swatchEls.length - 1));
        if (idx < 0) idx = 0; else if (idx > swatchEls.length - 1) idx = swatchEls.length - 1;
        var near = swatchEls[idx];
        if (!near) return;
        swatchEls.forEach(function (s) { s.classList.toggle('is-labeled', s === near); });   /* mild lift on the slid-over swatch */
        setTxt('pdpFinishName', near.getAttribute('data-finish'));
        /* The line tracks the swatch you're sliding over – it updates live on every
           scroll, always, even after a colour has been selected. (Tapping a swatch also
           snaps the line to it via the click handler.) Absolute inside the scroller, so
           translateX by offsetLeft rides with the strip. */
        if (swline) swline.style.transform = 'translateX(' + Math.round(near.offsetLeft) + 'px)';
      };
      var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
      /* On resize keep the line on the SELECTED swatch – NOT the scroll-progress one.
         The first colour tap unlocks the config and dispatches a resize; routing that
         through the scroll-progress update() reset the line to the first swatch, so the
         very first interaction never appeared to move it. Fall back to scroll-progress
         only while nothing is selected yet. */
      var onResize = function () {
        setEdge();
        var sel = sw.querySelector('.pdp-swatch[aria-pressed="true"]');
        if (sel) { if (swline) swline.style.transform = 'translateX(' + Math.round(sel.offsetLeft) + 'px)'; }
        else onScroll();
      };
      sw.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
      update();
    }
  })();

  /* ── Hero: thumbnails + view toggle ── */
  var thumbs = $('pdpThumbs'), mainImg = $('pdpMainImg');
  if (thumbs && mainImg) thumbs.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-current', 'false'); });
    b.setAttribute('aria-current', 'true');
    if (b.parentElement && b.parentElement.scrollIntoView) b.parentElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    var im = b.querySelector('img');
    if (im) { mainImg.style.opacity = '0'; window.setTimeout(function () { mainImg.src = im.getAttribute('src'); mainImg.alt = im.getAttribute('alt') || mainImg.alt; mainImg.style.opacity = '1'; }, 160); }
    /* desktop: scroll up so the full main product image is in view (below the sticky header) */
    if (window.matchMedia && window.matchMedia('(min-width: 64rem)').matches) {
      var hdr = document.querySelector('.header');
      var off = (hdr ? hdr.getBoundingClientRect().height : 0) + 16;
      var se = document.scrollingElement || document.documentElement;
      var targetY = mainImg.getBoundingClientRect().top + se.scrollTop - off;
      if (targetY < se.scrollTop - 2) {
        var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: targetY, behavior: rm ? 'auto' : 'smooth' });
      }
    }
  });

  /* ── Full-screen image viewer (lightbox): one big image with prev/next, a position
     counter, and a sliding thumbnail strip along the bottom. Opens from the "Alle
     Bilder" button or by clicking the main image; page scroll is locked behind it. ── */
  (function () {
    var lb = $('pdpLightbox'), strip = $('pdpLbStrip'), lbImg = $('pdpLbImg'),
        curEl = $('pdpLbCur'), totalEl = $('pdpLbTotal'),
        prevBtn = $('pdpLbPrev'), nextBtn = $('pdpLbNext'), allBtn = $('pdpThumbsAll');
    if (!thumbs || !lb || !strip || !lbImg) return;
    var data = [].slice.call(thumbs.querySelectorAll('li img')).map(function (im) {
      return { src: im.getAttribute('src'), alt: im.getAttribute('alt') || '' };
    });
    if (!data.length) return;
    var LIMIT = 10;   /* first 10 inline; the button reveals the full set in the viewer */
    if (allBtn && data.length > LIMIT) { var cnt = $('pdpThumbsCount'); if (cnt) cnt.textContent = data.length; allBtn.hidden = false; }
    if (totalEl) totalEl.textContent = data.length;

    var idx = 0, lastFocus = null;
    var thumbBtns = data.map(function (d, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pdp-lightbox__thumb';
      b.setAttribute('aria-label', 'Bild ' + (i + 1));
      var g = document.createElement('img'); g.src = d.src; g.alt = ''; g.loading = 'lazy';
      b.appendChild(g);
      b.addEventListener('click', function () { show(i); });
      strip.appendChild(b); return b;
    });

    function scrollThumbIntoView(i) {
      var b = thumbBtns[i]; if (!b) return;
      var max = strip.scrollWidth - strip.clientWidth; if (max <= 1) return;
      var target = Math.max(0, Math.min(max, b.offsetLeft - (strip.clientWidth - b.offsetWidth) / 2));
      strip.scrollTo({ left: target, behavior: 'smooth' });
    }
    function show(i) {
      idx = (i + data.length) % data.length;   /* wrap at both ends */
      var d = data[idx];
      lbImg.src = d.src; lbImg.alt = d.alt;
      if (curEl) curEl.textContent = idx + 1;
      thumbBtns.forEach(function (b, k) { b.setAttribute('aria-current', k === idx ? 'true' : 'false'); });
      scrollThumbIntoView(idx);
      /* keep the page's main image + active inline thumb in sync with what's being viewed */
      if (mainImg) { mainImg.src = d.src; mainImg.alt = d.alt || mainImg.alt; }
      thumbs.querySelectorAll('button').forEach(function (x) {
        var xi = x.querySelector('img');
        x.setAttribute('aria-current', xi && xi.getAttribute('src') === d.src ? 'true' : 'false');
      });
    }
    function currentMainIdx() {
      var cur = mainImg ? mainImg.getAttribute('src') : null;
      for (var j = 0; j < data.length; j++) { if (data[j].src === cur) return j; }
      return 0;
    }
    function openAt(i) {
      lastFocus = document.activeElement;
      lb.setAttribute('aria-hidden', 'false');
      MZScroll.lock();   /* lock the page so the modal owns the scroll */
      show(i);
      if (nextBtn) nextBtn.focus({ preventScroll: true });
    }
    function closeLb() {
      lb.setAttribute('aria-hidden', 'true');
      MZScroll.unlock();
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { show(idx - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { show(idx + 1); });
    if (allBtn) allBtn.addEventListener('click', function () { openAt(currentMainIdx()); });
    if (mainImg) { mainImg.style.cursor = 'zoom-in'; mainImg.addEventListener('click', function () { openAt(currentMainIdx()); }); }
    lb.addEventListener('click', function (e) { if (e.target.closest('[data-lb-close]')) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (lb.getAttribute('aria-hidden') !== 'false') return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
    });
    /* swipe left/right to page through the gallery on touch */
    MZSwipe.attach(lb, function () { show(idx - 1); }, function () { show(idx + 1); });
  })();

  /* ── Reviews: featured happy testimonial + customer-photo thumbnail nav.
     Reads the (hidden) review cards as its data source, then renders one large
     featured review with a crossfade; the customer photos double as the switcher. ── */
  (function () {
    var src = $('rvTrack'); if (!src) return;
    var cards = [].slice.call(src.querySelectorAll('.rv__card')); if (!cards.length) return;
    var data = cards.map(function (c) {
      var im = c.querySelector('.rv__card-img img');
      var starsEl = c.querySelector('.rv__card-stars');
      return {
        img: im ? im.getAttribute('src') : '',
        alt: im ? (im.getAttribute('alt') || '') : '',
        stars: starsEl ? starsEl.querySelectorAll('svg[fill="currentColor"]').length : 5,
        title: (c.querySelector('.rv__card-title') || {}).textContent || '',
        text: (c.querySelector('.rv__card-text') || {}).textContent || '',
        author: (c.querySelector('.rv__card-author') || {}).textContent || '',
        date: (c.querySelector('.rv__card-date') || {}).textContent || ''
      };
    });
    var card = $('rvFeatureCard'), fImg = $('rvFeatureImg'), fStars = $('rvFeatureStars'),
        fTitle = $('rvFeatureTitle'), fText = $('rvFeatureText'), fAuthor = $('rvFeatureAuthor'),
        fDate = $('rvFeatureDate'), fAvatar = $('rvFeatureAvatar'), nav = $('rvThumbsNav'),
        prev = document.querySelector('.rv__feature-arrow--prev'), next = document.querySelector('.rv__feature-arrow--next');
    if (!card || !nav) return;
    var STAR = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
    var STAR_O = '<svg viewBox="0 0 24 24" fill="#d8dbe0"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
    function initials(n) { return n.trim().split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase(); }
    var idx = -1;
    var thumbBtns = data.map(function (d, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'rv__thumbnav-btn';
      b.setAttribute('aria-label', 'Bewertung von ' + d.author);
      var im = document.createElement('img'); im.src = d.img; im.alt = d.alt; im.loading = 'lazy';
      b.appendChild(im);
      b.addEventListener('click', function () { show(i); scrollFeaturedIntoView(); });
      nav.appendChild(b); return b;
    });
    function apply(d) {
      fImg.src = d.img; fImg.alt = d.alt;
      fStars.innerHTML = STAR.repeat(d.stars) + STAR_O.repeat(Math.max(0, 5 - d.stars));
      fStars.setAttribute('aria-label', d.stars + ' von 5');
      fTitle.textContent = d.title; fText.textContent = d.text;
      fAuthor.textContent = d.author; fDate.textContent = d.date;
      if (fAvatar) fAvatar.textContent = initials(d.author);
      if (fProv) fProv.hidden = idx !== 0;   /* provenance sample: first review only */
    }
    /* Slide the thumbnail strip so the active thumb is fully in view (mobile scroller).
       Centre it, then clamp to [0, maxScroll] so the arrows can always reach – and fully
       reveal – the first and last thumbs instead of leaving them clipped by the arrows. */
    function scrollThumbIntoView(i, instant) {
      var b = thumbBtns[i]; if (!b) return;
      var max = nav.scrollWidth - nav.clientWidth;
      if (max <= 1) return;   /* desktop / not scrollable – no-op */
      var target = Math.max(0, Math.min(max, b.offsetLeft - (nav.clientWidth - b.offsetWidth) / 2));
      nav.scrollTo({ left: target, behavior: instant ? 'auto' : 'smooth' });
    }
    function show(i) {
      if (i === idx) return;
      var first = idx === -1; idx = i; var d = data[i];
      thumbBtns.forEach(function (b, k) { b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      scrollThumbIntoView(i, first);
      if (first) { apply(d); return; }
      card.classList.add('is-swapping');
      window.setTimeout(function () { apply(d); card.classList.remove('is-swapping'); }, 200);
    }
    /* On the stacked (mobile) layout the featured photo sits above the thumbnail rail,
       so tapping a thumbnail changes an image that's scrolled off-screen. Bring it into
       view. 'nearest' is a no-op when it's already visible (desktop side-by-side). */
    function scrollFeaturedIntoView() {
      if (card && card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (prev) prev.addEventListener('click', function () { show((idx - 1 + data.length) % data.length); scrollFeaturedIntoView(); });
    if (next) next.addEventListener('click', function () { show((idx + 1) % data.length); scrollFeaturedIntoView(); });
    /* inject the shared provenance pills once beneath the author/date byline; apply()
       toggles them so they only show for the first (sample) review as you page through */
    var fFoot = card.querySelector('.rv__feature-foot');
    var fProv = card.querySelector('.rvw-review__prov');
    if (fFoot && !fProv) {
      fProv = window.MZ_PROV_EL(); fProv.classList.add('rv__feature-prov');
      fFoot.parentNode.insertBefore(fProv, fFoot.nextSibling);
    }
    show(0);
  })();

  /* ── Product-info sticky nav: scroll-spy (highlight the section in view) ── */
  (function () {
    var nav = $('psxNav'); if (!nav) return;
    var links = [].slice.call(nav.querySelectorAll('.psx-nav__link'));
    var map = {}, secs = [];
    links.forEach(function (l) {
      var id = (l.getAttribute('href') || '').slice(1);
      var sec = document.getElementById(id);
      if (sec) { map[id] = l; secs.push(sec); }
    });
    if (!secs.length) return;
    var scroller = nav.querySelector('.psx-nav__tabs') || nav.querySelector('.psx-nav__inner') || nav;
    function setActive(l) {
      links.forEach(function (x) { x.classList.toggle('is-active', x === l); });
      /* auto-slide the horizontal nav so the current section's tab is in view
         (only when the nav overflows – i.e. mobile; desktop fits, no-op). Center
         the tab, then CLAMP to [0, maxScroll] so it never over-scrolls past the
         last tab into blank space. */
      var max = scroller.scrollWidth - scroller.clientWidth;
      if (!l || max <= 2) return;
      var sr = scroller.getBoundingClientRect(), lr = l.getBoundingClientRect();
      var tabLeft = (lr.left - sr.left) + scroller.scrollLeft;   /* tab's offset within the scroll content */
      var target = Math.max(0, Math.min(max, tabLeft - (scroller.clientWidth - lr.width) / 2));
      if (Math.abs(target - scroller.scrollLeft) > 4) scroller.scrollTo({ left: target, behavior: 'smooth' });
    }
    /* Shared geometry: the sticky obstruction above a section = site header + this nav. */
    var root = document.documentElement;
    var siteHeader = document.querySelector('.header');
    var reduceMoNav = window.matchMedia('(prefers-reduced-motion: reduce)');
    var NAV_GAP = 10;                       /* breathing room under the pinned nav */
    var animId = null, savedSB = '';
    function pinnedObstruction() {
      var hh = siteHeader ? siteHeader.getBoundingClientRect().height : 0;
      return hh + nav.getBoundingClientRect().height;
    }
    function targetFor(sec) {
      return Math.max(0, Math.round(window.pageYOffset + sec.getBoundingClientRect().top - pinnedObstruction() - NAV_GAP));
    }

    /* ── Scroll-spy: highlight the section MOST visible in the viewport ───
       Deterministic + direction-independent. The old IntersectionObserver
       highlighted whichever intersecting section landed LAST in the entries
       array, so scrolling up lit the lower ("next") tab. Instead we measure how
       much of each section is actually on screen (below the pinned nav) and
       light the one showing the most – recomputed from live positions every
       scroll frame, so up and down agree and it always reflects what you see. */
    secs.sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top; });
    var navigating = false, lastActiveLink = null, pinnedLink = null, pinAt = 0;
    /* Visible height of a section within the content area (the viewport BELOW the
       pinned nav – content hidden behind the nav doesn't count as visible). */
    function visibleHeight(el) {
      var r = el.getBoundingClientRect();
      return Math.min(r.bottom, window.innerHeight) - Math.max(r.top, pinnedObstruction());
    }
    /* Active section = the one showing the MOST of its content in the viewport. */
    function activeSection() {
      var best = secs[0], bestVis = -Infinity;
      for (var i = 0; i < secs.length; i++) {
        var vis = visibleHeight(secs[i]);
        if (vis > bestVis) { bestVis = vis; best = secs[i]; }
      }
      return best;
    }
    function syncActive() {
      if (navigating || !secs.length) return;
      var l;
      /* Right after a tab tap we PIN that tab lit until the user actually scrolls
         away – otherwise a short section could hand "most visible" straight to a
         taller neighbour below it and the tapped tab would flip immediately. */
      if (pinnedLink && Math.abs(window.pageYOffset - pinAt) <= 2) { l = pinnedLink; }
      else { pinnedLink = null; l = map[activeSection().id]; }
      if (l && l !== lastActiveLink) { lastActiveLink = l; setActive(l); }
    }
    var spyTick = false;
    function onSpyScroll() { if (!spyTick) { spyTick = true; window.requestAnimationFrame(function () { spyTick = false; syncActive(); }); } }
    window.addEventListener('scroll', onSpyScroll, { passive: true });
    window.addEventListener('resize', onSpyScroll, { passive: true });
    window.addEventListener('load', syncActive);
    syncActive();

    /* ── Precise tab navigation ─────────────────────────────────────────
       Native anchor scroll (href="#id") + a static scroll-margin-top landed
       imprecisely: the obstruction is VARIABLE height and the header morphs,
       so the browser's one-shot target was stale on arrival. We drive the
       scroll with a rAF tween that re-reads the live header+nav height every
       frame, converging exactly however the header morphs mid-flight. While a
       tween runs, `navigating` freezes the scroll-spy so the highlight doesn't
       sweep through every tab we fly past. */
    function stopAnim() {
      if (animId) { window.cancelAnimationFrame(animId); animId = null; root.style.scrollBehavior = savedSB; }
      navigating = false;                  /* a real gesture / cancel resumes the scroll-spy */
      pinnedLink = null;                   /* and releases any tab pinned by the last tap */
    }
    function land(sec, link) {             /* settle exactly on target + pin the tapped tab */
      window.scrollTo(0, targetFor(sec));
      root.style.scrollBehavior = savedSB;
      navigating = false;
      pinnedLink = link || null; pinAt = window.pageYOffset;
    }
    function goTo(sec, link) {
      stopAnim();
      navigating = true;
      if (link) { lastActiveLink = link; setActive(link); }   /* highlight immediately – feels responsive */
      savedSB = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';  /* neutralise CSS smooth – we drive it frame-by-frame */
      if (reduceMoNav.matches) { land(sec, link); return; }
      var start = window.pageYOffset, t0 = null, DUR = 460;
      animId = window.requestAnimationFrame(function step(ts) {
        if (t0 === null) t0 = ts;
        var t = Math.min(1, (ts - t0) / DUR);
        var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;   /* easeInOutQuad */
        window.scrollTo(0, Math.round(start + (targetFor(sec) - start) * e));   /* re-read target each frame */
        if (t < 1) { animId = window.requestAnimationFrame(step); }
        else { animId = null; land(sec, link); }
      });
    }
    /* a real user gesture cancels our tween instead of the two fighting each other */
    window.addEventListener('wheel', stopAnim, { passive: true });
    window.addEventListener('touchstart', stopAnim, { passive: true });
    nav.addEventListener('click', function (e) {
      var link = e.target.closest ? e.target.closest('.psx-nav__link') : null;
      if (!link || !nav.contains(link)) return;
      var id = (link.getAttribute('href') || '').slice(1);
      var sec = id ? document.getElementById(id) : null;
      if (!sec) return;
      e.preventDefault();
      if (window.history && history.replaceState) history.replaceState(null, '', '#' + id);
      goTo(sec, link);
    });

    /* Signal horizontal scrollability (mobile edge-fade): fade whichever edge still
       has tabs off-screen. state = none | start | middle | end. */
    function updateNavScroll() {
      var max = scroller.scrollWidth - scroller.clientWidth, s = scroller.scrollLeft, state;
      if (max <= 2) state = 'none';
      else if (s <= 1) state = 'start';
      else if (s >= max - 1) state = 'end';
      else state = 'middle';
      scroller.setAttribute('data-scroll', state);
    }
    scroller.addEventListener('scroll', updateNavScroll, { passive: true });
    window.addEventListener('resize', updateNavScroll, { passive: true });
    window.addEventListener('load', updateNavScroll);
    updateNavScroll();

    /* First-glance affordance: the moment the nav comes into view on a touch
       device, nudge the strip (0 → peek → 0) so the motion + revealed next tab
       make it obvious it's swipeable – before the user touches anything. Runs
       once; skipped on desktop, when it fits, or under reduced motion. */
    var mqTouch = window.matchMedia('(max-width: 767px)');
    var reduceMo = window.matchMedia('(prefers-reduced-motion: reduce)');
    var hinted = false;
    function tween(to, dur, done) {
      var from = scroller.scrollLeft, t0 = null;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var t = Math.min(1, (ts - t0) / dur);
        var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;   /* easeInOutQuad */
        scroller.scrollLeft = from + (to - from) * e;
        if (t < 1) window.requestAnimationFrame(step); else if (done) done();
      }
      window.requestAnimationFrame(step);
    }
    function scrollHint() {
      if (hinted || !mqTouch.matches) return;
      var max = scroller.scrollWidth - scroller.clientWidth;
      if (max <= 8 || scroller.scrollLeft > 4) return;   /* nothing to reveal / already moved */
      hinted = true;
      if (reduceMo.matches) return;                      /* fade already communicates */
      var peek = Math.min(52, max);
      tween(peek, 300, function () { window.setTimeout(function () { tween(0, 480); }, 260); });
    }
    if ('IntersectionObserver' in window) {
      var hintIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { scrollHint(); hintIO.disconnect(); } });
      }, { threshold: 0.9 });
      hintIO.observe(nav);
    } else { window.addEventListener('load', scrollHint); }
  })();

  /* ── Bewertungen: happy-review carousel arrows (scroll by ~card width) ── */
  (function () {
    var track = document.getElementById('rvwCarousel'); if (!track) return;
    var wrap = track.closest('.rvw-happy'); if (!wrap) return;
    var prev = wrap.querySelector('.rvw-arrow[data-dir="prev"]');
    var next = wrap.querySelector('.rvw-arrow[data-dir="next"]');
    if (!prev || !next) return;
    function step() {
      var card = track.querySelector('.rvw-happy-card');
      var gap = parseFloat(getComputedStyle(track).columnGap) || 16;
      return card ? card.getBoundingClientRect().width + gap : 320;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    }
    prev.addEventListener('click', function () { track.scrollBy({ left: -step() * 1.5, behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step() * 1.5, behavior: 'smooth' }); });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* ── Tasteful motion: scroll-reveal + subtle Beschreibung image parallax.
     Both fully skipped under prefers-reduced-motion (and without IntersectionObserver). ── */
  (function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;

    /* reveal: fade + rise each block as it enters the viewport (one-shot) */
    var targets = [].slice.call(document.querySelectorAll(
      '.psx-sec .psx-eyebrow, .psx-sec .psx-title, .psx-sec .psx-lead, .psx-benefits, .psx-dl__item, .psx-spec__group, .faq__support, .faq__list'));
    if (targets.length) {
      targets.forEach(function (t) { t.classList.add('psx-anim'); });
      var rio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
      targets.forEach(function (t) { rio.observe(t); });
    }

  })();

  /* ── Beschreibung scrollytelling: swap the pinned image as each scene hits center ── */
  (function () {
    var scenes = [].slice.call(document.querySelectorAll('.psx-story__scene'));
    var imgs = [].slice.call(document.querySelectorAll('.psx-story__img'));
    if (!scenes.length || !imgs.length || !('IntersectionObserver' in window)) return;
    function activate(n) {
      imgs.forEach(function (im) { im.classList.toggle('is-active', im.getAttribute('data-scene') === n); });
      scenes.forEach(function (s) { s.classList.toggle('is-current', s.getAttribute('data-scene') === n); });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) activate(e.target.getAttribute('data-scene')); });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    scenes.forEach(function (s) { io.observe(s); });

    /* Play story videos only while on-screen. The off-breakpoint copies are
       display:none, so they never intersect → never load (preload=none). */
    var vids = [].slice.call(document.querySelectorAll('.psx-story video'));
    if (vids.length) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { var p = e.target.play(); if (p && p.catch) p.catch(function () {}); }
          else { e.target.pause(); }
        });
      }, { threshold: 0.1 });
      vids.forEach(function (v) { vio.observe(v); });
    }
  })();

  var mtoggle = document.querySelector('.pdp-media__toggle');
  if (mtoggle) mtoggle.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
    b.setAttribute('aria-pressed', 'true');
  });

  /* ── 1 · Anschluss (required) → auto-advance ── */
  var ansch = $('bAnschluss');
  if (ansch) ansch.addEventListener('click', function (e) {
    var b = e.target.closest('.cfg-opt'); if (!b || b.classList.contains('is-unavailable')) return;
    this.querySelectorAll('.cfg-opt').forEach(function (x) { x.classList.remove('is-selected'); });
    b.classList.add('is-selected');
    this.classList.remove('is-invalid');   /* clear any lingering validation highlight */
    state.anschluss = b.getAttribute('data-anschluss'); state.conn = CONN[state.anschluss] || null;
    applyConn(); refresh();   /* no auto-advance – user continues via "Weiter" */
  });

  /* ── 2 · Gravur ── */
  var seg = $('bGravurSeg');
  if (seg) seg.addEventListener('click', function (e) {
    var b = e.target.closest('.cfg-opt'); if (!b) return;
    state.gravurOn = b.classList.toggle('is-selected');   /* toggle add-on; unselected = ohne Gravur */
    $('bGravurField').classList.toggle('is-shown', state.gravurOn);
    if (!state.gravurOn) { state.gravurText = ''; var gc = $('bGravurText'); if (gc) gc.value = ''; }
    refresh();
    if (state.gravurOn) { var gtf = $('bGravurText'); if (gtf) gtf.focus(); }
  });
  var gt = $('bGravurText'); if (gt) gt.addEventListener('input', function () { this.classList.remove('is-invalid'); state.gravurText = this.value; refresh(); });
  var fonts = $('bFonts');
  if (fonts) fonts.addEventListener('click', function (e) {
    var b = e.target.closest('.cfg-font'); if (!b) return;
    this.querySelectorAll('.cfg-font').forEach(function (x) { x.classList.remove('is-selected'); });
    b.classList.add('is-selected'); state.font = b.getAttribute('data-font');
    if (gt) gt.style.fontFamily = FONTS[state.font] || ''; refresh();
  });

  /* ── 3 · Innenstationen → multi-select, each with its own qty (no auto-advance,
     since users may combine several models) ── */
  var innen = $('bInnen');
  if (innen) innen.addEventListener('click', function (e) {
    var b = e.target.closest('.cfg-opt'); if (!b || b.classList.contains('is-unavailable')) return;
    var name = b.getAttribute('data-innen'), d = parseFloat(b.getAttribute('data-delta')) || 0;
    var label = (b.querySelector('.cfg-opt__name') || {}).textContent || name;
    if (b.classList.toggle('is-selected')) state.innenSel[name] = { price: d, qty: 1, label: label.trim() };
    else delete state.innenSel[name];
    refresh();
  });

  /* ── 4 · Stromversorgung → auto-advance ── */
  var strom = $('bStrom');
  if (strom) strom.addEventListener('click', function (e) {
    var b = e.target.closest('.cfg-opt'); if (!b || b.classList.contains('is-unavailable')) return;
    var wasSel = b.classList.contains('is-selected');
    this.querySelectorAll('.cfg-opt').forEach(function (x) { x.classList.remove('is-selected'); });
    if (wasSel) { state.strom = 'Standard'; state.stromDelta = 0; }   /* deselect → back to Standard (inklusive) */
    else { b.classList.add('is-selected'); syncGroupState('bStrom', b); }
    state.stromQty = 1;   /* every card click (select / switch / deselect) starts a fresh quantity – never carry the previous item's qty over to another option */
    refresh();
  });

  /* ── 2 & 5 · optional add-ons (checkboxes, own qty) – Innenstationen share the
     .cfg-opt--check styling but have their own handler above, so skip them here ── */
  document.querySelectorAll('#cfgbSteps .cfg-opt--check').forEach(function (b) {
    if (!b.hasAttribute('data-extra')) return;   /* Innen / Gravur reuse the checkbox look but have their own handlers */
    b.addEventListener('click', function () {
      if (b.classList.contains('is-unavailable')) return;
      var name = b.getAttribute('data-extra'), d = parseFloat(b.getAttribute('data-delta')) || 0;
      var label = (b.querySelector('.cfg-opt__name') || {}).textContent || name;
      if (b.classList.toggle('is-selected')) state.extras[name] = { price: d, qty: 1, label: label.trim() };
      else delete state.extras[name];
      refresh();
    });
  });

  /* ── Validate-on-cart (never lock) ── */
  function firstInvalid() { if (!state.anschluss) return 0; if (state.gravurOn && !state.gravurText) return 1; return -1; }
  function addToCart() {
    /* colour is the first gate – surface the requirement at the swatches, not on the CTA */
    if (!state.finish) {
      var swEl = $('pdpSwatches');
      if (swEl) {
        /* re-trigger the ripple/halo on every attempt (removing → reflow → re-adding
           restarts the CSS animations even if .is-invalid was already set) */
        swEl.classList.remove('is-invalid'); void swEl.offsetWidth; swEl.classList.add('is-invalid');
        swEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    /* Wunschfarbe chosen but no RAL tone yet → open + flash the picker, don't proceed */
    if (needsRal()) {
      if (ralUI) { ralUI.open(); ralUI.flash(); }
      var rp = $('ralPick'); if (rp) rp.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var rs = $('ralSearch'); if (rs) window.setTimeout(function () { rs.focus(); }, 400);
      return;
    }
    var iv = firstInvalid();
    if (iv > -1) {
      openStep(iv, true);
      scrollToProgress();
      flashStep(iv);
      if (iv === 0) { flashInvalid($('bAnschluss')); flashRequired(); }
      else { flashInvalid($('bGravurText')); }
      flagStepError(iv);
      return;
    }
    var badge = document.querySelector('.header .badge'); if (badge) badge.textContent = (parseInt(badge.textContent, 10) || 0) + 1;
  }
  var cart = $('bCart'); if (cart) cart.addEventListener('click', addToCart);
  var stickyCta = $('pdpStickyCta'); if (stickyCta) { var sl = $('pdpStickyLabel'); if (sl) sl.textContent = 'In den Warenkorb'; stickyCta.addEventListener('click', addToCart); }
  /* ── Share: popover with options (copy · e-mail · WhatsApp · Facebook · X) ── */
  (function () {
    var wrap = document.querySelector('.bx-share-wrap'), btn = $('pdpShare'), menu = $('pdpShareMenu');
    if (!wrap || !btn || !menu) return;
    var cred = wrap.closest('.bx-cred');
    function buildLinks() {
      var u = encodeURIComponent(location.href), t = encodeURIComponent(document.title);
      var map = {
        email: 'mailto:?subject=' + t + '&body=' + u,
        whatsapp: 'https://wa.me/?text=' + t + '%20' + u,
        facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + u,
        x: 'https://twitter.com/intent/tweet?url=' + u + '&text=' + t
      };
      menu.querySelectorAll('a[data-share]').forEach(function (a) { var k = a.getAttribute('data-share'); if (map[k]) a.href = map[k]; });
    }
    function onDoc(e) { if (!wrap.contains(e.target)) close(); }
    function onKey(e) { if (e.key === 'Escape') { close(); btn.focus(); } }
    function open() { buildLinks(); menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); if (cred) cred.classList.add('is-sharing'); document.addEventListener('click', onDoc); document.addEventListener('keydown', onKey); }
    function close() { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (cred) cred.classList.remove('is-sharing'); document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); if (menu.hidden) open(); else close(); });
    var copyBtn = menu.querySelector('[data-share="copy"]');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      var lbl = copyBtn.querySelector('span'), orig = lbl.textContent;
      var done = function () { copyBtn.classList.add('is-copied'); lbl.textContent = 'Link kopiert!';
        window.setTimeout(function () { lbl.textContent = orig; copyBtn.classList.remove('is-copied'); close(); }, 1200); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(done, done); else done();
    });
    menu.querySelectorAll('a[data-share]').forEach(function (a) { a.addEventListener('click', function () { close(); }); });
  })();

  /* ── Sticky bar visibility – show whenever the main CTA is off-screen.
     Geometry check (not IntersectionObserver): the CTA's position shifts on load,
     on colour-unlock relayout, and on image load without a scroll, and IO's initial
     callback can latch a stale "visible" before layout settles. This stays correct. ── */
  var bar = $('pdpStickyBar');
  if (cart && bar) {
    var syncStickyBar = function () {
      var r = cart.getBoundingClientRect();
      var show = r.bottom <= 0 || r.top >= window.innerHeight;   /* CTA fully out of view */
      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', show ? 'false' : 'true');
      bar.inert = !show;   /* when hidden, keep its controls out of the tab order */
    };
    window.addEventListener('scroll', syncStickyBar, { passive: true });
    window.addEventListener('resize', syncStickyBar, { passive: true });
    window.addEventListener('load', syncStickyBar);
    syncStickyBar();
  }

  /* Mobile: while a config text field is focused the on-screen keyboard makes iOS
     reposition the fixed sticky purchase bar over the content – hide it until blur. */
  (function () {
    var cfgPanel = document.getElementById('cfgbPanel');
    if (!cfgPanel || !document.body.classList.contains('swtouch')) return;
    cfgPanel.addEventListener('focusin', function (e) {
      if (e.target && e.target.matches && e.target.matches('input, textarea')) document.body.classList.add('kbd-open');
    });
    cfgPanel.addEventListener('focusout', function (e) {
      if (e.target && e.target.matches && e.target.matches('input, textarea')) document.body.classList.remove('kbd-open');
    });
  })();

  /* ── Bottom-up price sheet (accessible page-wide) ── */
  var sheet = $('bSheet');
  function openSheet() { if (!sheet) return; renderSummary(); sheet.classList.add('is-open'); sheet.setAttribute('aria-hidden', 'false'); document.body.classList.add('cfg-sheet-open'); }
  function closeSheet() { if (!sheet) return; sheet.classList.remove('is-open'); sheet.setAttribute('aria-hidden', 'true'); document.body.classList.remove('cfg-sheet-open'); }
  /* buy-block trigger → inline accordion (expand in place) */
  var acc = $('bAcc'), dBtn = $('bDetailsBtn');
  if (dBtn && acc) dBtn.addEventListener('click', function () {
    var open = acc.classList.toggle('is-open'); dBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  /* sticky-bar Details → bottom-up window */
  var sDet = $('bStickyDetails'); if (sDet) sDet.addEventListener('click', openSheet);
  if (sheet) sheet.addEventListener('click', function (e) { if (e.target.closest('[data-sheet-close]')) closeSheet(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
  var sheetCart = $('bSheetCart'); if (sheetCart) sheetCart.addEventListener('click', function () { closeSheet(); addToCart(); });

  /* ── Kontakt & Service modal (opened by "Beratungstermin vereinbaren") ── */
  (function () {
    var cm = document.getElementById('contactModal');
    if (!cm) return;
    var lastFocus = null;
    function openCM(e) { if (e) e.preventDefault(); lastFocus = document.activeElement;
      cm.classList.add('is-open'); cm.setAttribute('aria-hidden', 'false'); MZScroll.lock();
      var f = cm.querySelector('a[href],button:not([disabled])'); if (f) f.focus({ preventScroll: true }); }
    function closeCM() { cm.classList.remove('is-open'); cm.setAttribute('aria-hidden', 'true'); MZScroll.unlock();
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
    document.querySelectorAll('[data-cm-open]').forEach(function (el) { el.addEventListener('click', openCM); });
    cm.addEventListener('click', function (e) { if (e.target === cm || e.target.closest('[data-cm-close]')) closeCM(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cm.classList.contains('is-open')) closeCM(); });
  })();

  /* ── Sticky step-dock: pin it flush against the site header's real bottom
     (header height varies by viewport, so measure it – a hardcoded offset
     leaves a gap the scrolling config shows through), and flag "stuck" so it
     compacts. Geometry check on scroll (IntersectionObserver is unreliable
     when its sentinel can be display:none). ── */
  var dockEl = document.querySelector('.cfgb-dock');
  var headerEl = document.querySelector('.header') || document.querySelector('header');
  var sentinelEl = document.querySelector('.cfgb-sentinel');
  var navEl = document.querySelector('.psx-nav');   /* product-section nav that takes over the top slot below the config */
  var qbEl = document.getElementById('quickbar');   /* green contact bar the fixed dock must sit BELOW, not cover */
  var dockFlowH = 0;   /* cached in-flow dock height for the sentinel (see below) */
  if (dockEl) {
    var mqMobile = window.matchMedia('(max-width: 640px)');
    var dockStuck = function () {
      var pin = headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 104;
      if (dockEl.style.top !== pin + 'px') dockEl.style.top = pin + 'px';
      if (mqMobile.matches) {
        /* Mobile: once the configurator scrolls under the header, the progress
           ribbon fixes full-width to the top and STAYS pinned (taking over the
           quickbar's slot – never hands back to the green contact bar) UNTIL the
           product-section nav rises to the top and takes over the slot itself. At
           that point the dock releases fully so no gray sliver peeks below the nav
           and it doesn't reappear past the nav section. It re-pins only when you
           scroll back up above the nav (and above the config).
           (The former footer blank-strip was the iOS overscroll bounce, now fixed
           by overscroll-behavior-y:none.) */
        var cfg = document.getElementById('cfgbPanel') || (dockEl.closest && dockEl.closest('.cfgb'));
        var r = cfg ? cfg.getBoundingClientRect() : null;
        var navTop = navEl ? navEl.getBoundingClientRect().top : Infinity;
        var pinned = !!r && r.top <= pin + 1 && navTop > pin + 1;
        dockEl.classList.toggle('is-fixed', pinned);
        dockEl.classList.toggle('is-stuck', pinned);
        /* Hold the dock's IN-FLOW height in the sentinel – captured while unfixed, so
           it's the full (non-compact) height. Reserving only the compact height while
           fixed shifted the page ~59px at the pin, which moved the nav and fed back
           into navTop → a flicker/oscillation at the config→nav handoff. Measured
           after toggling the classes off so offsetHeight is the true flow height. */
        if (!pinned && dockEl.offsetHeight) dockFlowH = dockEl.offsetHeight;
        if (sentinelEl) sentinelEl.style.height = pinned ? dockFlowH + 'px' : '';
      } else {
        /* Desktop: keep the step-dock fixed to the top for as long as the config
           section is in the viewport – from when its top scrolls under the header
           until its bottom rises back above the header line. position:fixed (not
           sticky) so the ribbon never rides up early with the section's bottom. It
           is constrained to the config column: left/width are measured from the
           sentinel (which holds the dock's in-flow box), and the sentinel is grown
           to the dock's height so the steps below don't jump. */
        dockEl.classList.remove('is-fixed');   /* mobile-only full-bleed variant */
        var cfgD = document.getElementById('cfgbPanel') || (dockEl.closest && dockEl.closest('.cfgb'));
        var rD = cfgD ? cfgD.getBoundingClientRect() : null;
        /* Reserve the dock's IN-FLOW (full, non-compact) height in the sentinel – cache
           it while the dock is NOT fixed. Re-measuring offsetHeight while fixed returns
           the COMPACT (.is-stuck) height, so the sentinel shrank on every scroll tick
           after the pin – jumping the page and, via rD.bottom, oscillating pin/unpin at
           the config bottom (exactly where the user reaches the CTA). Mirrors the mobile
           branch's dockFlowH cache. */
        if (!dockEl.classList.contains('is-fixed-dt') && dockEl.offsetHeight) dockFlowH = dockEl.offsetHeight;
        /* .cfgb carries no transform (see CSS) so it isn't a containing block and
           position:fixed resolves against the viewport. The dock pins directly
           BELOW the green quickbar (its rendered bottom) so it stacks under the
           contact bar rather than covering it; when the quickbar has scrolled away
           it falls back to the header line. Fix while the config spans that line:
           from its top reaching the pin until its bottom rises back above it. */
        /* Pin below the quickbar using STABLE layout values (header height + the
           quickbar's offsetHeight), NOT its live getBoundingClientRect().bottom.
           The live rect shifts when the quickbar slides during the section-nav
           handoff and jitters with sub-pixel scroll, which made the fixed bar jump;
           offsetHeight is layout-only (unaffected by the slide transform or scroll). */
        var topPx = pin + (qbEl ? qbEl.offsetHeight : 0);
        /* Trigger the pin off the SENTINEL's top (the dock's in-flow anchor), not the
           config panel's top – the dock sits a couple px below cfg.top (border), so
           triggering on cfg.top snapped the dock ~2px when it pinned. The sentinel
           marks exactly where the dock is in flow, so the fixed position (topPx)
           matches the flow position at the flip → no jump. */
        var anchorTop = sentinelEl ? sentinelEl.getBoundingClientRect().top : (rD ? rD.top : Infinity);
        var withinD = !!rD && anchorTop <= topPx + 1 && rD.bottom > topPx + 1;
        if (withinD) {
          var geoD = (sentinelEl || dockEl).getBoundingClientRect();
          dockEl.style.top = topPx + 'px';
          dockEl.style.left = Math.round(geoD.left) + 'px';
          dockEl.style.width = Math.round(geoD.width) + 'px';
          dockEl.classList.add('is-fixed-dt');
          dockEl.classList.add('is-stuck');
          if (sentinelEl) sentinelEl.style.height = dockFlowH + 'px';
        } else {
          dockEl.classList.remove('is-fixed-dt');
          dockEl.classList.remove('is-stuck');
          dockEl.style.left = '';
          dockEl.style.width = '';
          if (sentinelEl) sentinelEl.style.height = '';
        }
      }
    };
    window.addEventListener('scroll', dockStuck, { passive: true });
    window.addEventListener('resize', dockStuck, { passive: true });
    if (mqMobile.addEventListener) mqMobile.addEventListener('change', dockStuck);
    dockStuck();
  }

  applyConn(); applyStock();   /* seed availability (out-of-stock + any pre-set incompatibility) */
  refresh();
})();

/* ============================================================
   Review list: expand a 4-line-clamped review when tapped. A real
   "mehr lesen" button is added after each truncated review for
   keyboard access; the text itself is also clickable.
   ============================================================ */
(function () {
  'use strict';
  var texts = [].slice.call(document.querySelectorAll('.rvw-review__text'));
  if (!texts.length) return;
  texts.forEach(function (t) {
    if (t.scrollHeight <= t.clientHeight + 1) return;   /* not truncated → leave it */
    t.classList.add('is-clamped');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rvw-review__more';
    btn.textContent = 'mehr lesen';
    btn.setAttribute('aria-expanded', 'false');
    t.insertAdjacentElement('afterend', btn);
    function toggle() {
      var exp = t.classList.toggle('is-expanded');
      btn.textContent = exp ? 'weniger anzeigen' : 'mehr lesen';
      btn.setAttribute('aria-expanded', exp ? 'true' : 'false');
    }
    t.addEventListener('click', toggle);
    btn.addEventListener('click', toggle);
  });
})();

/* ============================================================
   Review provenance – a quiet secondary metadata line under each
   review's byline: how the review reached this page (translation +
   origin shop). Kept muted so it reads as fine print, not content.
   ============================================================ */
(function () {
  'use strict';
  /* review list: show the provenance on the FIRST review only – a representative sample,
     so the metadata isn't repeated down every card */
  var firstReview = document.querySelector('.rvw-list .rvw-review');
  if (firstReview && !firstReview.querySelector('.rvw-review__prov')) {
    firstReview.appendChild(window.MZ_PROV_EL());
  }
  /* photo-carousel ("Das schätzen Kunden am meisten"): on the first (lead) card only,
     under its byline – and just the origin pill, to keep the compact strip clean */
  var lead = document.querySelector('.rvw-carousel .rvw-happy-card');
  if (lead && !lead.querySelector('.rvw-review__prov')) {
    var body = lead.querySelector('.rvw-happy-card__body') || lead;
    var el = window.MZ_PROV_EL(window.MZ_PROV.origin); el.classList.add('rvw-happy-prov');
    body.appendChild(el);
  }
})();

/* ============================================================
   Review photo lightbox – a premium two-pane viewer. The clicked
   photo opens on a dark image stage (left) beside the full review
   context (right): customer identity, star rating, verified badge,
   title, text and date – all pulled live from the review card.
   Prev/next + a thumbnail rail page through that customer's photos.
   ============================================================ */
(function () {
  'use strict';
  var shots = [].slice.call(document.querySelectorAll('.rvw-shot'));
  var cards = [].slice.call(document.querySelectorAll('.rvw-happy-card'));
  if (!shots.length && !cards.length) return;

  var lb = document.createElement('div');
  lb.className = 'rvw-lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Kundenfoto zur Bewertung');
  lb.innerHTML =
    '<div class="rvw-lightbox__backdrop" data-close></div>' +
    '<div class="rvw-lb" role="document">' +
      '<div class="rvw-lb__stage">' +
        '<div class="rvw-lb__counter" aria-live="polite"><span class="rvw-lb__cur">1</span> / <span class="rvw-lb__total">1</span></div>' +
        '<button type="button" class="rvw-lb__nav" data-dir="prev" aria-label="Vorheriges Foto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>' +
        '<img class="rvw-lb__img" alt="Kundenfoto zur Bewertung">' +
        '<button type="button" class="rvw-lb__nav" data-dir="next" aria-label="Nächstes Foto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>' +
      '</div>' +
      '<div class="rvw-lb__head">' +
          '<h2 class="rvw-lb__headtitle">Kundenbewertung</h2>' +
          '<button type="button" class="rvw-lb__close" data-close aria-label="Schließen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
        '</div>' +
        '<div class="rvw-lb__body">' +
        '<div class="rvw-lb__top">' +
          '<h3 class="rvw-lb__title"></h3>' +
          '<span class="rvw-stars rvw-stars--lg rvw-lb__stars" role="img"></span>' +
        '</div>' +
        '<p class="rvw-lb__meta"><span class="rvw-lb__author"></span><time class="rvw-lb__date"></time><span class="rvw-lb__badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg><span class="rvw-vlabel">Verifizierter Kauf</span></span></p>' +
        '<div class="rvw-review__prov rvw-lb__prov">' + window.MZ_PROV_HTML + '</div>' +
        '<div class="rvw-lb__text"></div>' +
        '<div class="rvw-lb__gallery">' +
          '<span class="rvw-lb__gallery-label"></span>' +
          '<div class="rvw-lb__thumbs" role="tablist" aria-label="Weitere Fotos dieser Bewertung"></div>' +
        '</div>' +
        '</div>' +
    '</div>';
  document.body.appendChild(lb);

  var img      = lb.querySelector('.rvw-lb__img');
  var navs     = [].slice.call(lb.querySelectorAll('.rvw-lb__nav'));
  var closeBtn = lb.querySelector('.rvw-lb__close');
  var curEl    = lb.querySelector('.rvw-lb__cur');
  var totalEl  = lb.querySelector('.rvw-lb__total');
  var thumbs   = lb.querySelector('.rvw-lb__thumbs');
  var gallery  = lb.querySelector('.rvw-lb__gallery');
  var galLabel = lb.querySelector('.rvw-lb__gallery-label');
  var authorEl = lb.querySelector('.rvw-lb__author');
  var dateEl   = lb.querySelector('.rvw-lb__date');
  var badgeEl  = lb.querySelector('.rvw-lb__badge');
  var starsEl  = lb.querySelector('.rvw-lb__stars');
  var titleEl  = lb.querySelector('.rvw-lb__title');
  var textEl   = lb.querySelector('.rvw-lb__text');

  var group = [], idx = 0, lastFocus = null;

  /* Fill the review panel from a normalised data object so both the detailed
     reviews (.rvw-review) and the carousel cards (.rvw-happy-card) can drive
     the exact same two-pane viewer. */
  function fillPanel(data) {
    authorEl.textContent = data.author || 'Gast';
    dateEl.textContent = data.date || '';
    titleEl.textContent = data.title || '';
    if (data.title) titleEl.title = data.title; else titleEl.removeAttribute('title');   /* full name on hover when the 2-line clamp truncates */
    titleEl.style.display = data.title ? '' : 'none';
    textEl.textContent = data.text || '';
    starsEl.innerHTML = data.starsHTML || '';
    starsEl.style.display = data.starsHTML ? '' : 'none';
    if (data.starsLabel) starsEl.setAttribute('aria-label', data.starsLabel);   /* "5 von 5 Sternen" */
    badgeEl.style.display = data.verified ? '' : 'none';
  }

  /* Read a detailed review (.rvw-review) into panel data. */
  function reviewData(review) {
    var d = { author: 'Gast', date: '', title: '', text: '', starsHTML: '', starsLabel: '', verified: false };
    if (!review) return d;
    var a = review.querySelector('.rvw-author'); if (a) d.author = a.textContent.trim();
    var t = review.querySelector('.rvw-review__foot time'); if (t) d.date = t.textContent.trim();
    var h = review.querySelector('.rvw-review__title'); if (h) d.title = h.textContent.trim();
    var p = review.querySelector('.rvw-review__text'); if (p) d.text = p.textContent.trim();
    var s = review.querySelector('.rvw-stars'); if (s) { d.starsHTML = s.innerHTML; d.starsLabel = s.getAttribute('aria-label') || ''; }
    d.verified = !!review.querySelector('.rvw-verified');
    return d;
  }

  /* Read a carousel card (.rvw-happy-card) into panel data. The card's headline
     lives in data-title (the compact card doesn't render it); the quote is the
     review text. */
  function cardData(card) {
    var d = { author: 'Gast', date: '', title: '', text: '', starsHTML: '', starsLabel: '', verified: false };
    d.title = (card.getAttribute('data-title') || '').trim();
    var a = card.querySelector('.rvw-author'); if (a) d.author = a.textContent.trim();
    var t = card.querySelector('.rvw-happy-foot time'); if (t) d.date = t.textContent.trim();
    var p = card.querySelector('.rvw-happy-quote'); if (p) d.text = p.textContent.trim();
    var s = card.querySelector('.rvw-stars'); if (s) { d.starsHTML = s.innerHTML; d.starsLabel = s.getAttribute('aria-label') || ''; }
    d.verified = !!card.querySelector('.rvw-verified');
    return d;
  }

  function buildThumbs() {
    thumbs.innerHTML = '';
    var multi = group.length > 1;
    gallery.style.display = multi ? '' : 'none';
    if (galLabel) galLabel.textContent = 'Alle Fotos (' + group.length + ')';
    if (!multi) return;
    group.forEach(function (photo, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'rvw-lb__thumb';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Foto ' + (i + 1));
      var g = document.createElement('img');
      g.src = photo.full;
      g.alt = '';
      b.appendChild(g);
      b.addEventListener('click', function () { show(i); });
      thumbs.appendChild(b);
    });
  }

  function show(i) {
    idx = (i + group.length) % group.length;
    var photo = group[idx];
    img.src = photo.full;
    img.alt = photo.alt || 'Kundenfoto zur Bewertung';
    var multi = group.length > 1;
    curEl.textContent = idx + 1;
    lb.querySelector('.rvw-lb__counter').style.display = multi ? '' : 'none';
    navs.forEach(function (b) { b.style.display = multi ? '' : 'none'; });
    [].slice.call(thumbs.children).forEach(function (b, k) {
      b.setAttribute('aria-selected', k === idx ? 'true' : 'false');
    });
  }

  /* photos: [{full, alt}], data: panel object, startIdx: which photo to show. */
  function open(photos, data, focusEl, startIdx) {
    group = photos;
    lastFocus = focusEl;
    fillPanel(data);
    totalEl.textContent = group.length;
    buildThumbs();
    show(startIdx || 0);
    lb.classList.add('is-open');
    MZScroll.lock();
    if (textEl) textEl.scrollTop = 0;
    closeBtn.focus({ preventScroll: true });
  }
  function close() {
    lb.classList.remove('is-open');
    img.removeAttribute('src');
    MZScroll.unlock();
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  /* Detailed-review photos → the customer's full photo set. */
  shots.forEach(function (s) {
    s.addEventListener('click', function () {
      var media = s.closest('.rvw-review__media');
      var setEls = media ? [].slice.call(media.querySelectorAll('.rvw-shot')) : [s];
      var photos = setEls.map(function (el) {
        return { full: el.getAttribute('data-full'), alt: (el.querySelector('img') || {}).alt || '' };
      });
      open(photos, reviewData(s.closest('.rvw-review')), s, setEls.indexOf(s));
    });
  });

  /* Carousel cards → the same viewer with the card's single photo + its review. */
  cards.forEach(function (card) {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.classList.add('rvw-happy-card--clickable');
    function openCard() {
      var cImg = card.querySelector('.rvw-happy-card__media img');
      var photos = [{ full: (cImg && (cImg.currentSrc || cImg.src)) || '', alt: (cImg && cImg.alt) || '' }];
      open(photos, cardData(card), card, 0);
    }
    card.addEventListener('click', openCard);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCard(); }
    });
  });

  lb.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) { close(); return; }
    var nav = e.target.closest('.rvw-lb__nav');
    if (nav) show(idx + (nav.getAttribute('data-dir') === 'next' ? 1 : -1));
  });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === 'ArrowLeft') show(idx - 1);
  });
  MZSwipe.attach(lb, function () { show(idx - 1); }, function () { show(idx + 1); });
})();


/* ============================================================
   Sticky-bar handoff – the green quickbar pins under the site
   header while scrolling, then the product-section nav (.psx-nav)
   rises and takes its place. We keep --pdp-header-h synced to the
   live (compacting) header height, and slide the quickbar up behind
   the header exactly as the section nav reaches it (desktop only;
   mobile keeps the quickbar accordion). All work is rAF-throttled.
   ============================================================ */
(function () {
  'use strict';
  var header = document.querySelector('.header');
  if (!header) return;
  var qb = document.getElementById('quickbar');
  var nav = document.querySelector('.psx-nav');
  var root = document.documentElement;
  var desktop = window.matchMedia('(min-width: 768px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var ticking = false;

  function frame() {
    ticking = false;
    /* keep the shared offset in sync with the live header height */
    var h = Math.round(header.getBoundingClientRect().height);
    root.style.setProperty('--pdp-header-h', h + 'px');

    if (!qb) return;
    if (nav) {
      /* how far the section nav has pushed into the quickbar's pinned slot */
      var qbH = qb.offsetHeight;
      var navTop = nav.getBoundingClientRect().top;
      var delta = Math.min(qbH, Math.max(0, (h + qbH) - navTop));
      var p = qbH ? delta / qbH : 0;   /* 0 → 1 handoff progress */
      if (!reduce.matches) {
        /* Baton-pass: the contact bar stays PINNED under the header (it does not move) –
           the section nav gradually slides UP UNDER it as you scroll, and the bar fades
           from opaque to transparent in step (linear, so it stays visible through the
           slide and is fully clear right as the nav lands). The nav is thus revealed 100%
           clear and takes over as the sticky bar. */
        qb.style.transform = '';
        qb.style.opacity = p ? String(Math.max(0, 1 - p)) : '';
        /* once it starts fading it must not intercept taps meant for the section nav */
        qb.style.pointerEvents = p > 0.01 ? 'none' : '';
      } else {
        qb.style.transform = '';
        qb.style.opacity = '';
        qb.style.pointerEvents = '';
      }
      /* Reveal the section-nav "Termin vereinbaren" CTA only once the handoff is
         complete (p === 1) – i.e. the green contact bar has faded out of the viewport
         and the nav owns the sticky slot – so the action is not duplicated while the
         bar (which carries the same CTA) is still on screen. */
      nav.classList.toggle('psx-nav--cta-on', p >= 1);
    } else {
      qb.style.transform = '';
      qb.style.opacity = '';
      qb.style.pointerEvents = '';
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  if (desktop.addEventListener) desktop.addEventListener('change', onScroll);
  frame();
})();

/* ============================================================
   Anschluss-diagram lightbox – the technical connection schematics
   (.techdia__shot) open full-size with a caption and prev/next within
   their gallery group. Keyboard + backdrop close. No dependencies.
   ============================================================ */
(function () {
  'use strict';
  var shots = [].slice.call(document.querySelectorAll('.techdia__shot'));
  if (!shots.length) return;

  var lb = document.createElement('div');
  lb.className = 'tdiag-lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Anschlussschema');
  lb.innerHTML =
    '<button type="button" class="tdiag-lightbox__close" aria-label="Schließen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
    '<button type="button" class="tdiag-lightbox__nav" data-dir="prev" aria-label="Vorheriges Schema"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>' +
    '<figure><img alt=""><figcaption></figcaption></figure>' +
    '<button type="button" class="tdiag-lightbox__nav" data-dir="next" aria-label="Nächstes Schema"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>';
  document.body.appendChild(lb);

  var img = lb.querySelector('img');
  var cap = lb.querySelector('figcaption');
  var navs = [].slice.call(lb.querySelectorAll('.tdiag-lightbox__nav'));
  var closeBtn = lb.querySelector('.tdiag-lightbox__close');
  var group = [], idx = 0, lastFocus = null;

  function captionFor(shot) {
    var item = shot.closest('.techdia__item');
    var c = item && item.querySelector('.techdia__caption');
    return c ? c.textContent : '';
  }
  function show(i) {
    idx = (i + group.length) % group.length;
    var shot = group[idx];
    img.src = shot.getAttribute('data-full');
    cap.textContent = captionFor(shot);
    var multi = group.length > 1;
    navs.forEach(function (b) { b.style.display = multi ? '' : 'none'; });
  }
  function open(shot) {
    var grid = shot.closest('.techdia__grid');
    group = grid ? [].slice.call(grid.querySelectorAll('.techdia__shot')) : [shot];
    lastFocus = shot;
    show(group.indexOf(shot));
    lb.classList.add('is-open');
    MZScroll.lock();
    closeBtn.focus({ preventScroll: true });
  }
  function close() {
    lb.classList.remove('is-open');
    img.removeAttribute('src');
    MZScroll.unlock();
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  shots.forEach(function (s) { s.addEventListener('click', function () { open(s); }); });
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.closest('.tdiag-lightbox__close')) { close(); return; }
    var nav = e.target.closest('.tdiag-lightbox__nav');
    if (nav) show(idx + (nav.getAttribute('data-dir') === 'next' ? 1 : -1));
  });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === 'ArrowLeft') show(idx - 1);
  });
  MZSwipe.attach(lb, function () { show(idx - 1); }, function () { show(idx + 1); });
})();

/* ============================================================
   Technische Übersichten – left-rail master–detail (ARIA tabs).
   Clicking / arrow-keying a category in the rail reveals its panel
   and hides the others. Vertical tablist, full keyboard support.
   ============================================================ */
(function () {
  'use strict';
  /* On mobile the rail is a full-width vertical stack, so the detail panel sits
     BELOW every tab – tapping a lower category leaves its content off-screen.
     Match the config stepper: after a tap, scroll the revealed panel up under the
     pinned chrome (header + section nav) so the relevant content is in view.
     Uses element HEIGHTS (stable) rather than a sticky element's live position.
     Desktop (side rail) is fully visible, so it's skipped. */
  var mqStack = window.matchMedia('(max-width: 55.9375rem)');

  [].slice.call(document.querySelectorAll('.techms__rail')).forEach(function (rail) {
    var tabs = [].slice.call(rail.querySelectorAll('.techms__tab'));
    if (!tabs.length) return;

    function activate(tab) {
      tabs.forEach(function (t) {
        var sel = t === tab;
        t.classList.toggle('is-active', sel);
        t.setAttribute('aria-selected', sel ? 'true' : 'false');
        t.tabIndex = sel ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !sel;
      });
    }
    function scrollToPanel(tab) {
      if (!mqStack.matches) return;
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (!panel) return;
      window.setTimeout(function () {
        var hdr = document.querySelector('.header');
        var nav = document.querySelector('.psx-nav');
        var pin = (hdr ? hdr.getBoundingClientRect().height : 0) + (nav ? nav.getBoundingClientRect().height : 0) + 12;
        panel.style.scrollMarginTop = pin + 'px';
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
    rail.addEventListener('click', function (e) {
      var t = e.target.closest('.techms__tab');
      if (t) { activate(t); t.focus(); scrollToPanel(t); }
    });
    rail.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var n = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      else return;
      e.preventDefault();
      activate(tabs[n]);
      tabs[n].focus();
    });
  });
})();

/* ============================================================
   A11y: mobile quickbar links are placeholders – keep them out of the
   tab order and non-activatable (matches the pointer-events:none CSS).
   ============================================================ */
(function () {
  'use strict';
  var qb = document.getElementById('quickbar');
  if (!qb) return;
  var items = [].slice.call(qb.querySelectorAll('.qa, .qa-cta'));
  if (!items.length) return;
  var mq = window.matchMedia('(max-width: 767px)');
  function sync() {
    var mobile = mq.matches;
    items.forEach(function (el) {
      if (mobile) { el.setAttribute('tabindex', '-1'); el.setAttribute('aria-disabled', 'true'); }
      else { el.removeAttribute('tabindex'); el.removeAttribute('aria-disabled'); }
    });
  }
  /* block keyboard/programmatic activation while disabled */
  qb.addEventListener('click', function (e) {
    var el = e.target.closest('.qa, .qa-cta');
    if (el && el.getAttribute('aria-disabled') === 'true') { e.preventDefault(); e.stopPropagation(); }
  }, true);
  (mq.addEventListener ? mq.addEventListener('change', sync) : mq.addListener(sync));
  sync();
})();

/* ============================================================
   A11y: focus trap for modal dialogs. Keeps Tab focus within the
   top-most open [aria-modal="true"] dialog (aria-modal already tells
   screen readers to constrain to it). Non-modal panels are untouched.
   ============================================================ */
(function () {
  'use strict';
  var SEL = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function openModal() {
    var mods = [].slice.call(document.querySelectorAll('[role="dialog"][aria-modal="true"]'));
    var open = mods.filter(function (d) {
      if (d.getAttribute('aria-hidden') === 'true') return false;
      var s = window.getComputedStyle(d);
      return s.display !== 'none' && s.visibility !== 'hidden';
    });
    return open.length ? open[open.length - 1] : null;   /* top-most in DOM order */
  }
  function focusables(dlg) {
    return [].slice.call(dlg.querySelectorAll(SEL)).filter(function (el) {
      var r = el.getBoundingClientRect();
      return (r.width > 0 || r.height > 0) && window.getComputedStyle(el).visibility !== 'hidden';
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var dlg = openModal();
    if (!dlg) return;
    var f = focusables(dlg);
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1], active = document.activeElement;
    if (!dlg.contains(active)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }, true);
})();

/* ============================================================
   "Eine Frage zum Produkt stellen" – form modal opened by the
   "Zum Kundensupport" CTA in the FAQ block. Required-field
   validation + success state; behaviour ported from the VDM10
   working page, namespaced to this module.
   ============================================================ */
(function () {
  'use strict';
  var modal = document.getElementById('questionModal');
  if (!modal) return;
  var dialog   = modal.querySelector('.qf-dialog');
  var form     = document.getElementById('questionForm');
  var formView = document.getElementById('qfFormView');
  var success  = document.getElementById('qfSuccess');
  var closeBtn = document.getElementById('qfClose');
  var reqFields = [['qfFrage', 'qfFrageWrap'], ['qfVorname', 'qfVornameWrap'], ['qfNachname', 'qfNachnameWrap'], ['qfMail', 'qfMailWrap']]
    .map(function (p) { return { input: document.getElementById(p[0]), wrap: document.getElementById(p[1]) }; })
    .filter(function (f) { return f.input && f.wrap; });
  var lastFocus = null;
  var vv = window.visualViewport;
  var mqSheet = window.matchMedia('(max-width: 47.9375rem)');

  /* Keep the open sheet inside the VISUAL viewport so the on-screen keyboard never
     covers the submit button (mobile sheet only; no-op on the centred desktop dialog). */
  function syncViewport() {
    if (modal.hidden || !vv || !mqSheet.matches) return;
    modal.style.top = vv.offsetTop + 'px';
    modal.style.height = vv.height + 'px';
    modal.style.bottom = 'auto';
  }
  function clearViewport() { modal.style.top = ''; modal.style.height = ''; modal.style.bottom = ''; }
  if (vv) { vv.addEventListener('resize', syncViewport); vv.addEventListener('scroll', syncViewport); }
  mqSheet.addEventListener('change', function () { if (modal.hidden) return; mqSheet.matches ? syncViewport() : clearViewport(); });

  function setError(f, on, text) {
    f.wrap.classList.toggle('qf--error', on);
    f.input.setAttribute('aria-invalid', on ? 'true' : 'false');
    var msg = f.wrap.querySelector('.qf-error-msg');
    if (on) {
      if (!msg) { msg = document.createElement('span'); msg.className = 'qf-error-msg'; msg.id = f.input.id + '-err'; f.wrap.appendChild(msg); }
      msg.textContent = text || 'Bitte ausfüllen';
      f.input.setAttribute('aria-describedby', msg.id);
    } else if (msg) { msg.remove(); f.input.removeAttribute('aria-describedby'); }
  }
  reqFields.forEach(function (f) { f.input.addEventListener('input', function () { if (f.input.value.trim()) setError(f, false); }); });

  function resetForm() {
    if (formView) formView.hidden = false;
    if (success) success.hidden = true;
    if (form) form.reset();
    reqFields.forEach(function (f) { setError(f, false); });
  }
  function open() {
    resetForm();
    lastFocus = document.activeElement;
    MZScroll.lock();
    modal.hidden = false;
    syncViewport();
    /* Focus the first field on desktop for a quick start; on the mobile sheet, don't –
       auto-popping the keyboard the instant the sheet slides up feels aggressive. */
    var first = reqFields[0];
    if (first && !mqSheet.matches) window.setTimeout(function () { first.input.focus({ preventScroll: true }); }, 40);
  }
  function close() {
    modal.hidden = true;
    clearViewport();
    MZScroll.unlock();
    /* preventScroll: focus() would otherwise scroll the (far-down) trigger back into
       view, undoing the scroll-position restore above and jumping the page. */
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-qf-open]')) { e.preventDefault(); open(); }
  });
  if (closeBtn) closeBtn.addEventListener('click', close);
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });
  /* placeholder Datenschutz link shouldn't jump the page */
  modal.querySelectorAll('.qf-link').forEach(function (a) { a.addEventListener('click', function (e) { if (a.getAttribute('href') === '#') e.preventDefault(); }); });

  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    reqFields.forEach(function (f) { var empty = !f.input.value.trim(); setError(f, empty); if (empty && !firstBad) firstBad = f; });
    var mailF = reqFields[reqFields.length - 1];
    var mail = document.getElementById('qfMail');
    if (mail && mail.value.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail.value)) {
      setError(mailF, true, 'Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      if (!firstBad) firstBad = mailF;
    }
    if (firstBad) { firstBad.input.focus(); return; }
    if (formView) formView.hidden = true;
    if (success) success.hidden = false;
  });
  var sClose = document.getElementById('qfSuccessClose');
  if (sClose) sClose.addEventListener('click', function () { close(); window.setTimeout(resetForm, 250); });

  /* focus trap while open */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || modal.hidden || !dialog) return;
    var f = [].slice.call(dialog.querySelectorAll('a[href], button:not([disabled]), textarea, input, [tabindex]:not([tabindex="-1"])'))
      .filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1], active = document.activeElement;
    if (!dialog.contains(active)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }, true);

  /* Enter advances to the next field on the single-line name inputs (rather than
     submitting the half-filled form); Enter on the last field still submits. */
  ['qfVorname', 'qfNachname'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      var next = document.getElementById(id === 'qfVorname' ? 'qfNachname' : 'qfMail');
      if (next) next.focus();
    });
  });

  /* Swipe the sheet down to dismiss (mobile only). Drag starts on the grip or header,
     so it never interferes with scrolling or typing in the body. */
  (function () {
    var handles = [modal.querySelector('.qf-grip'), modal.querySelector('.qf-head')].filter(Boolean);
    if (!dialog || !handles.length) return;
    var startY = 0, dy = 0, dragging = false;
    function pt(e) { return e.touches && e.touches[0] ? e.touches[0] : e; }
    function start(e) {
      if (!mqSheet.matches || modal.hidden || e.target.closest('.qf-close')) return;   /* leave the ✕ a plain tap */
      startY = pt(e).clientY; dy = 0; dragging = true;
      dialog.classList.add('qf-dragging');
    }
    function move(e) {
      if (!dragging) return;
      dy = Math.max(0, pt(e).clientY - startY);
      dialog.style.transform = 'translateY(' + dy + 'px)';
    }
    function end() {
      if (!dragging) return;
      dragging = false;
      dialog.classList.remove('qf-dragging');
      dialog.classList.add('qf-settling');
      var threshold = Math.min(140, dialog.getBoundingClientRect().height * 0.28);
      if (dy > threshold) {
        dialog.style.transform = 'translateY(100%)';
        window.setTimeout(function () { dialog.classList.remove('qf-settling'); dialog.style.transform = ''; close(); }, 220);
      } else {
        dialog.style.transform = '';
        window.setTimeout(function () { dialog.classList.remove('qf-settling'); }, 260);
      }
    }
    handles.forEach(function (el) { el.addEventListener('touchstart', start, { passive: true }); });
    document.addEventListener('touchmove', move, { passive: true });
    document.addEventListener('touchend', end);
    document.addEventListener('touchcancel', end);
  })();
})();

/* ============================================================
   V2 (flow-b) – color selection. Wires the static markup in
   index.html (the "Alle Farben …" link #colorListLink and the
   labelled side window #colorwin). Its rows proxy-click the
   matching #pdpSwatches button (by data-article), so v1's whole
   selection engine (article, price delta, image swap, RAL picker,
   config unlock, refresh) is reused unchanged. The v1 grid stays
   visible for one-click selection. Inert unless ?flow=b.
   ============================================================ */
(function () {
  'use strict';
  var htmlCls = document.documentElement.classList;
  if (!htmlCls.contains('flow-b') && !htmlCls.contains('flow-c') && !htmlCls.contains('flow-d')) return;   /* v2 + v3 + v4 share this module */
  var grid = document.getElementById('pdpSwatches');
  var link = document.getElementById('colorListLink');   /* v2 opener – "Alle Farben" text link */
  var card = document.getElementById('colorCardLink');   /* v3 opener – selected-finish summary card */
  var win  = document.getElementById('colorwin');
  if (!grid || !win) return;
  var swatches = [].slice.call(grid.querySelectorAll('.pdp-swatch'));
  var rows = [].slice.call(win.querySelectorAll('.colorwin__row'));
  if (!swatches.length || !rows.length) return;
  var cardName = document.getElementById('colorCardName');
  var cardThumb = document.getElementById('colorCardThumb');
  var triggers = [link, card].filter(Boolean);
  function setExpanded(v) { triggers.forEach(function (t) { t.setAttribute('aria-expanded', v); }); }

  var lock = (window.MZScroll && MZScroll.lock) ? MZScroll.lock : function () {};
  var unlock = (window.MZScroll && MZScroll.unlock) ? MZScroll.unlock : function () {};

  /* row → the matching v1 swatch (paired by article number) */
  function swatchFor(row) {
    var art = row.getAttribute('data-article');
    for (var i = 0; i < swatches.length; i++) { if (swatches[i].getAttribute('data-article') === art) return swatches[i]; }
    return null;
  }
  /* reflect the currently selected swatch onto the list rows */
  function markRows() {
    rows.forEach(function (r) {
      var sw = swatchFor(r);
      var on = !!(sw && sw.getAttribute('aria-pressed') === 'true');
      r.classList.toggle('is-selected', on);
      r.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    syncCard();
  }
  /* v3: mirror the chosen finish onto the summary card (thumbnail + name). No-op in v2 (no card). */
  function syncCard() {
    if (!card) return;
    var sel = grid.querySelector('.pdp-swatch[aria-pressed="true"]');
    card.classList.toggle('is-picked', !!sel);   /* v3: swap the list icon for the finish thumb once chosen */
    if (sel) {
      card.setAttribute('data-article', sel.getAttribute('data-article') || '');   /* flow-d paints the material thumb by article (CSS) */
      if (cardName) cardName.textContent = sel.getAttribute('data-finish') || '';
      if (cardThumb) {
        cardThumb.textContent = '';
        var img = sel.querySelector('img');
        if (img) { var t = document.createElement('img'); t.src = img.getAttribute('src'); t.alt = ''; cardThumb.appendChild(t); }
      }
    } else {
      card.removeAttribute('data-article');
      if (cardName) cardName.textContent = 'Bitte Farbe wählen';
      if (cardThumb) cardThumb.textContent = '';
    }
  }

  var lastFocus = null;
  function open(opener) {
    win.classList.add('is-open'); win.setAttribute('aria-hidden', 'false');
    setExpanded('true');
    lock(); lastFocus = opener || triggers[0]; markRows();
    var target = win.querySelector('.colorwin__row.is-selected') || rows[0];
    if (target) target.focus({ preventScroll: true });
  }
  function close() {
    win.classList.remove('is-open'); win.setAttribute('aria-hidden', 'true');
    setExpanded('false');
    unlock();
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  /* When the swatch row scrolls horizontally (mobile), bring the picked swatch into view.
     On touch the travelling indicator line is SCROLL-DRIVEN (idx = round(scrollProgress·(n-1)),
     see the swtouch setup), so we scroll to that swatch's scroll-progress position rather than
     centring it – otherwise the line lands on a different index. This makes the row show the
     selected swatch AND the indicator/label settle on it. No-op on desktop (grid doesn't overflow). */
  function revealSwatch(sw) {
    var maxScroll = grid.scrollWidth - grid.clientWidth;
    if (!sw || maxScroll <= 1) return;
    var all = [].slice.call(grid.querySelectorAll('.pdp-swatch'));
    var i = all.indexOf(sw);
    if (i < 0) return;
    var frac = all.length > 1 ? i / (all.length - 1) : 0;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    grid.scrollTo({ left: Math.round(frac * maxScroll), behavior: reduce ? 'auto' : 'smooth' });
  }

  /* Desktop: the magic-line is HOVER-driven, so a window pick (no hover) leaves it stale on
     the previous position. Place it on the selected swatch explicitly (mirrors v1's moveSwlineTo:
     translate offsetLeft/offsetTop + is-on). Touch is handled by the click handler + revealSwatch. */
  function placeSwlineDesktop(sw) {
    if (document.body.classList.contains('swtouch')) return;
    var line = grid.querySelector('.bx-swline');
    if (!line) return;
    line.style.transform = 'translate(' + Math.round(sw.offsetLeft) + 'px,' + Math.round(sw.offsetTop) + 'px)';
    line.classList.add('is-on');
  }

  rows.forEach(function (r) {
    r.addEventListener('click', function () {
      var sw = swatchFor(r);
      if (sw) { sw.click(); markRows(); revealSwatch(sw); placeSwlineDesktop(sw); }   /* proxy → runs all of v1's selection logic */
      close();                                                                        /* Wunschfarbe then reveals the inline RAL picker */
    });
  });
  if (link) link.addEventListener('click', function () { win.classList.contains('is-open') ? close() : open(link); });
  if (card) card.addEventListener('click', function () { win.classList.contains('is-open') ? close() : open(card); });
  win.addEventListener('click', function (e) { if (e.target.closest('[data-cw-close]')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && win.classList.contains('is-open')) close(); });

  /* keep the list's selected marker in step when a swatch is picked directly */
  if (window.MutationObserver) {
    new MutationObserver(markRows).observe(grid, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
  }
  markRows();
})();
