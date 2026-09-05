/* ============================================================
   site.js — LeetSync marketing site.

   Ported from the Claude Design project "LeetSync Site", rebuilt on plain
   DOM instead of the design runtime.

   The palette lives as custom properties on the root element and is swapped
   wholesale, so a theme change is one write per token rather than a second
   stylesheet — and every screenshot on the page swaps with it, which is what
   makes the toggle a demo of the product rather than a restyle of the page.
   ============================================================ */

const THEMES = {
  signal: {
    label: 'Signal', shot: 'dark',
    vars: {
      '--bg': '#08090A', '--band': '#0B0E10', '--card': '#0E1214', '--hover': '#12171A',
      '--bd': '#1F2529', '--bd-soft': '#1A1F23', '--tx': '#E9EDF0', '--tx2': '#C3CBD1',
      '--tx3': '#99A3AA', '--tx4': '#6B757C', '--ac': '#3FE08B', '--ac-ink': '#062012',
      '--ac-soft': 'rgba(63,224,139,.10)', '--ac-bd': 'rgba(63,224,139,.28)',
      '--ok': '#3FE08B', '--warn': '#E5B34A', '--bad': '#F0736A',
      '--r-card': '14px', '--r-sm': '9px', '--bw': '1px',
      '--shadow': '0 24px 60px rgba(0,0,0,.55)',
      '--f-body': "'IBM Plex Sans',system-ui,sans-serif",
      '--f-head': "'IBM Plex Sans',system-ui,sans-serif",
      '--f-mono': "'JetBrains Mono',ui-monospace,Consolas,monospace",
      '--head-w': '600', '--head-tt': 'none', '--head-ls': '-0.03em',
      '--btn-sh': 'none', '--btn-sh-h': '0 10px 26px rgba(63,224,139,.22)',
      '--card-sh': 'none', '--card-sh-h': '0 14px 34px rgba(0,0,0,.5)',
      '--btn-w': '600', '--btn-ls': '0', '--btn-tt': 'none', '--dot-r': '50%',
      '--kick-c': '#6B757C', '--kick-w': '400', '--glow': 'rgba(63,224,139,.14)',
      '--brand-ls': '.02em',
      '--tab-on-bg': '#3FE08B', '--tab-on-fg': '#062012', '--tab-on-bd': '#3FE08B',
    },
    mark: { radius: '7px', shadow: 'none' },
  },
  modernist: {
    label: 'Modernist', shot: 'light',
    vars: {
      '--bg': '#f3f2f2', '--band': '#eae9e9', '--card': '#f3f2f2', '--hover': '#eae9e9',
      '--bd': '#201e1d', '--bd-soft': 'rgba(32,30,29,.4)', '--tx': '#201e1d', '--tx2': '#201e1d',
      '--tx3': '#605d5d', '--tx4': '#605d5d', '--ac': '#ec3013', '--ac-ink': '#f3f2f2',
      '--ac-soft': '#ffe0d9', '--ac-bd': '#ec3013',
      '--ok': '#ec3013', '--warn': '#605d5d', '--bad': '#201e1d',
      '--r-card': '0px', '--r-sm': '0px', '--bw': '2px',
      '--shadow': '14px 14px 0 #201e1d',
      '--f-body': 'Archivo,system-ui,sans-serif',
      '--f-head': 'Archivo,system-ui,sans-serif',
      '--f-mono': 'ui-monospace,Consolas,monospace',
      '--head-w': '800', '--head-tt': 'uppercase', '--head-ls': '-0.01em',
      '--btn-sh': '4px 4px 0 #201e1d', '--btn-sh-h': '6px 6px 0 #201e1d',
      '--card-sh': '6px 6px 0 #201e1d', '--card-sh-h': '9px 9px 0 #ec3013',
      '--btn-w': '800', '--btn-ls': '.04em', '--btn-tt': 'uppercase', '--dot-r': '0%',
      '--kick-c': '#ec3013', '--kick-w': '600', '--glow': 'rgba(236,48,19,.10)',
      '--brand-ls': '.08em',
      '--tab-on-bg': '#201e1d', '--tab-on-fg': '#f3f2f2', '--tab-on-bd': '#201e1d',
    },
    mark: { radius: '0px', shadow: '3px 3px 0 #ec3013' },
  },
};

/**
 * The extension's screens, in the order the tab strip lists them.
 *
 * Two of them — the wizard and its consent step — are screens the popup's own
 * tab bar cannot reach, which is exactly why they are worth showing: a page
 * that makes claims about what is collected should show the screen where the
 * question is actually asked.
 *
 * Read from the markup rather than declared twice, so adding a screen is a
 * panel and a button and nothing else.
 */
const RAIL_IDS = ['top', 'features', 'whatsnew', 'flow', 'screens', 'tracker', 'sheets', 'readme', 'privacy'];

/**
 * The Chrome Web Store listing.
 *
 * Every element marked data-store-link points here. The utm_source the store's
 * share button appends is deliberately omitted: it would tag ordinary site
 * traffic as share-link clicks and skew the referrer breakdown.
 *
 * Set to '' and the buttons fall back to whatever href the markup carries.
 */
const STORE_URL = 'https://chromewebstore.google.com/detail/neghhaodkpiafoalaeldhbnboncnalec';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const ease = (t) => t * t * (3 - 2 * t);

const root = document.querySelector('[data-ls-root]');
const q = (s) => root.querySelector(s);
const qa = (s) => Array.prototype.slice.call(root.querySelectorAll(s));

const reduceMotion = window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const state = {
  theme: 'modernist',
  tabIndex: 0,
  activeRail: -1,
  mx: 0,
  my: 0,
  lastT: 0,
};

if (STORE_URL) qa('[data-store-link]').forEach((a) => { a.href = STORE_URL; });

// ── Theme ────────────────────────────────────────────────────

/**
 * Swap every screenshot to the matching build.
 *
 * The filename carries the theme (`popup-sheets-dark.png`), so this is a
 * suffix swap driven by each image's own `data-shot` base — no per-image
 * bookkeeping to fall out of sync when a screen is added.
 */
function paintShots() {
  const suffix = THEMES[state.theme].shot;
  qa('[data-shot]').forEach((img) => {
    img.src = 'img/' + img.dataset.shot + '-' + suffix + '.png';
  });
}

const SCREENS = qa('[data-screen-btn]').map((b) => b.dataset.screenBtn);

function paintTabs() {
  const on = THEMES[state.theme];
  qa('[data-screen-btn]').forEach((b) => {
    const active = SCREENS.indexOf(b.dataset.screenBtn) === state.tabIndex;
    b.setAttribute('aria-selected', String(active));
    b.setAttribute('tabindex', active ? '0' : '-1');
    b.style.background = active ? on.vars['--tab-on-bg'] : 'transparent';
    b.style.color = active ? on.vars['--tab-on-fg'] : 'var(--tx3)';
    b.style.borderColor = active ? on.vars['--tab-on-bd'] : 'var(--bd)';
  });
}

/**
 * Show one screen.
 *
 * The panels carry a whole-page capture each, so they are swapped rather than
 * stacked: keeping seven tall images live would leave the section scrolling
 * past anything a visitor is reading. The frame is scrolled back to the top on
 * the way in, because arriving half way down someone else's screenshot reads
 * as a broken image.
 */
function showScreen(i) {
  if (i < 0 || i >= SCREENS.length || i === state.tabIndex) return;
  state.tabIndex = i;
  qa('[data-screen-panel]').forEach((panel, n) => {
    panel.hidden = n !== i;
    if (n === i) {
      const scroller = panel.querySelector('[data-screen-scroll]');
      if (scroller) scroller.scrollTop = 0;
    }
  });
  paintTabs();
}

function setTheme(name, silent) {
  const key = THEMES[name] ? name : 'modernist';
  const t = THEMES[key];
  state.theme = key;
  Object.keys(t.vars).forEach((k) => root.style.setProperty(k, t.vars[k]));
  document.body.style.background = t.vars['--bg'];

  const label = q('[data-theme-name]');
  if (label) label.textContent = t.label;

  qa('[data-brand-mark]').forEach((img) => {
    img.style.borderRadius = t.mark.radius;
    img.style.boxShadow = t.mark.shadow;
    img.style.border = key === 'modernist' ? '2px solid #201e1d' : 'none';
  });

  paintShots();
  paintTabs();

  if (!silent) {
    try { localStorage.setItem('leetsync.siteTheme', key); } catch { /* private mode */ }
    const mark = q('[data-brand-mark]');
    if (mark && !reduceMotion) {
      mark.style.transform = 'rotate(-180deg) scale(.86)';
      setTimeout(() => { mark.style.transform = 'none'; }, 420);
    }
  }
}

// ── Events ───────────────────────────────────────────────────

root.addEventListener('click', (e) => {
  if (e.target.closest('[data-act="theme"]')) {
    setTheme(state.theme === 'signal' ? 'modernist' : 'signal');
    return;
  }
  const tab = e.target.closest('[data-screen-btn]');
  if (tab) showScreen(SCREENS.indexOf(tab.dataset.screenBtn));
});

root.addEventListener('keydown', (e) => {
  if (!e.target.closest('[data-screen-btn]')) return;
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  e.preventDefault();
  const next = (state.tabIndex + (e.key === 'ArrowRight' ? 1 : SCREENS.length - 1))
    % SCREENS.length;
  showScreen(next);
  const btn = q('[data-screen-btn="' + SCREENS[next] + '"]');
  if (btn) btn.focus();
});

/** The hero screenshot and the pinned stage lean towards the cursor. */
function tiltAll(e) {
  ['[data-tilt]', '[data-readme-shot]'].forEach((sel) => {
    const el = q(sel);
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
    const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
    const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
    el.style.transform = 'rotateY(' + (dx * 11).toFixed(2) + 'deg) rotateX('
      + (-dy * 8).toFixed(2) + 'deg) translateZ(0)';
  });
}

window.addEventListener('pointermove', (e) => {
  state.mx = (e.clientX / window.innerWidth) * 2 - 1;
  state.my = (e.clientY / window.innerHeight) * 2 - 1;

  const hero = q('[data-hero]');
  const spot = q('[data-hero-spot]');
  if (hero && spot) {
    const r = hero.getBoundingClientRect();
    const inside = e.clientY > r.top && e.clientY < r.bottom;
    spot.style.opacity = inside ? '1' : '0';
    if (inside) {
      spot.style.transform = 'translate(' + (e.clientX - r.left) + 'px,'
        + (e.clientY - r.top) + 'px)';
    }
  }
  if (!reduceMotion) tiltAll(e);
});

if (!reduceMotion) {
  qa('[data-magnet]').forEach((card) => {
    const sweep = card.querySelector('[data-sweep]');
    const ghost = card.querySelector('[data-ghost]');
    const bd0 = card.style.borderColor || 'var(--bd)';
    card.addEventListener('pointerenter', () => {
      card.style.borderColor = 'var(--ac-bd)';
      card.style.boxShadow = 'var(--card-sh-h)';
      if (sweep) sweep.style.width = '100%';
      if (ghost) { ghost.style.opacity = '.13'; ghost.style.transform = 'translate(-8px,-10px)'; }
    });
    card.addEventListener('pointerleave', () => {
      card.style.borderColor = bd0;
      card.style.boxShadow = 'var(--card-sh)';
      card.style.transform = 'none';
      if (sweep) sweep.style.width = '0';
      if (ghost) { ghost.style.opacity = '.05'; ghost.style.transform = 'none'; }
    });
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const dx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const dy = ((e.clientY - r.top) / r.height - 0.5) * 2;
      card.style.transform = 'perspective(700px) rotateY(' + (dx * 3.4).toFixed(2)
        + 'deg) rotateX(' + (-dy * 3.4).toFixed(2) + 'deg) translateY(-4px)';
    });
  });
}

// ── Reveals ──────────────────────────────────────────────────

function countUp(el, delay) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.countSuffix || '';
  const out = el.querySelector('[data-count-val]');
  if (!out) return;
  out.textContent = '0' + suffix;
  setTimeout(() => {
    const dur = 1250;
    const start = performance.now();
    const step = () => {
      const p = clamp((performance.now() - start) / dur, 0, 1);
      out.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, delay + 120);
}

function setupReveals() {
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  const heroEls = qa('[data-heroline], [data-hero-el]');
  heroEls.forEach((el, i) => {
    el.style.transition = 'opacity .8s cubic-bezier(.2,.7,.2,1) ' + (i * 90)
      + 'ms, transform .9s cubic-bezier(.2,.7,.2,1) ' + (i * 90) + 'ms';
    el.style.opacity = '0';
    el.style.transform = el.hasAttribute('data-heroline')
      ? 'translateY(34px) rotateX(-40deg)' : 'translateY(18px)';
  });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    heroEls.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
  }));

  const els = qa('[data-reveal]');
  els.forEach((el) => {
    const kind = el.dataset.reveal;
    const dur = kind === 'flip' ? '.85s' : '.7s';
    el.style.transition = 'opacity ' + dur + ' cubic-bezier(.2,.7,.2,1), transform ' + dur
      + ' cubic-bezier(.2,.7,.2,1), border-color .3s, box-shadow .3s, background .45s, color .45s';
    el.style.opacity = '0';
    el.style.transform =
      kind === 'flip' ? 'rotateY(-24deg) translateY(28px)'
        : kind === 'scale' ? 'scale(.955) translateY(18px)'
          : kind === 'left' ? 'translateX(-26px)'
            : 'translateY(30px)';
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const d = parseInt(el.dataset.revealDelay || '0', 10);
      setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'none'; }, d);
      if (el.dataset.count) countUp(el, d);
      io.unobserve(el);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
  els.forEach((el) => io.observe(el));
}

// ── Responsive ───────────────────────────────────────────────
// Driven from JS because the pinned stage has to be sized against the
// viewport height, which a media query cannot express.

function applyResponsive() {
  const w = window.innerWidth;

  const nav = q('[data-navlinks]');
  if (nav) nav.style.display = w < 1000 ? 'none' : 'flex';

  const rail = q('[data-rail]');
  if (rail) rail.style.display = w < 1280 ? 'none' : 'flex';

  const grid = q('[data-hero-grid]');
  if (grid) grid.style.gridTemplateColumns = w < 900 ? 'minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,440px)';

  const fgrid = q('[data-flow-grid]');
  if (fgrid) fgrid.style.gridTemplateColumns = w < 840 ? 'minmax(0,1fr)' : 'repeat(3,minmax(0,1fr))';

  const shot = q('[data-hero-shot]');
  if (shot) {
    shot.style.order = w < 900 ? '-1' : '0';
    shot.style.maxWidth = w < 900 ? '360px' : 'none';
    shot.style.margin = w < 900 ? '0 auto' : '0';
  }

  // The screenshot and its explanation sit side by side until there is not
  // room for a 360px column and readable prose at the same time.
  qa('[data-screen-panel]').forEach((panel) => {
    panel.style.gridTemplateColumns = w < 900
      ? 'minmax(0,1fr)' : 'minmax(0,360px) minmax(0,1fr)';
  });
}

window.addEventListener('resize', applyResponsive);

// ── Scroll loop ──────────────────────────────────────────────

let t0 = performance.now();

function tick(now) {
  requestAnimationFrame(tick);
  const t = (now - t0) / 1000;
  state.lastT = t;

  const sy = window.scrollY || document.documentElement.scrollTop || 0;
  const vh = window.innerHeight;
  const docH = document.documentElement.scrollHeight - vh;

  const fill = q('[data-progress-fill]');
  if (fill) fill.style.width = (docH > 0 ? clamp(sy / docH, 0, 1) * 100 : 0).toFixed(2) + '%';

  const nav = q('[data-nav]');
  if (nav) nav.style.padding = sy > 40 ? '9px clamp(16px,4vw,44px)' : '14px clamp(16px,4vw,44px)';

  // Hero
  const hero = q('[data-hero]');
  if (hero) {
    const r = hero.getBoundingClientRect();
    const heroP = clamp(-r.top / Math.max(1, r.height), 0, 1);
    const hint = q('[data-scroll-hint]');
    if (hint) hint.style.opacity = String(clamp(1 - heroP * 6, 0, 1));
    const scrim = q('[data-hero-scrim]');
    if (scrim) scrim.style.opacity = String(clamp(1 - heroP * 0.9, 0.15, 1));
    const rules = q('[data-hero-rules]');
    if (rules) {
      rules.style.transform = 'translate3d(' + (state.mx * -14).toFixed(1) + 'px,'
        + (heroP * -46 + state.my * -10).toFixed(1) + 'px,0)';
      rules.style.opacity = String(clamp(0.9 - heroP * 0.8, 0.1, 0.9));
    }
  }

  // How it works — the pinned flow
  const flow = q('[data-pin-flow]');
  if (flow) {
    const r = flow.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
    const line = q('[data-flow-line]');
    const token = q('[data-flow-token]');
    if (line) line.style.width = (p * 100).toFixed(2) + '%';
    if (token) {
      token.style.left = (p * 100).toFixed(2) + '%';
      token.style.transform = 'scale(' + (1 + Math.sin(t * 4) * 0.07).toFixed(3) + ')';
    }
    const steps = qa('[data-flow-step]');
    const nums = qa('[data-flow-num]');
    const ticks = qa('[data-flow-tick]');
    const bars = qa('[data-flow-bar]');
    const ghosts = qa('[data-flow-ghost]');
    steps.forEach((s, i) => {
      const lo = i / 3, hi = (i + 1) / 3;
      const local = clamp((p - lo + 0.12) / (hi - lo), 0, 1);
      const on = p >= lo - 0.02 && p < hi + 0.06;
      s.style.opacity = String(0.34 + local * 0.66);
      s.style.transform = 'translateY(' + ((1 - local) * 26).toFixed(1) + 'px)';
      s.style.borderColor = on ? 'var(--ac)' : 'var(--bd)';
      s.style.boxShadow = on ? 'var(--card-sh-h)' : 'var(--card-sh)';
      if (nums[i]) nums[i].style.color = on ? 'var(--ac)' : 'var(--tx4)';
      if (ticks[i]) ticks[i].style.background = p >= lo + 0.05 ? 'var(--ac)' : 'var(--bd)';
      if (bars[i]) bars[i].style.width = on ? '34px' : '18px';
      if (ghosts[i]) {
        ghosts[i].style.opacity = on ? '.11' : '.04';
        ghosts[i].style.color = on ? 'var(--ac)' : 'var(--tx)';
      }
    });
  }

  // Tracker rises out of the page as it enters
  const tr = q('[data-tracker-shot]');
  if (tr) {
    const r = tr.getBoundingClientRect();
    if (r.bottom > -200 && r.top < vh + 200) {
      const p = clamp((vh - r.top) / (vh * 0.85), 0, 1);
      const e = ease(p);
      tr.style.transform = 'rotateX(' + ((1 - e) * 9).toFixed(2) + 'deg) scale('
        + (0.9 + e * 0.1).toFixed(3) + ') translateY(' + ((1 - e) * 34).toFixed(1) + 'px)';
    }
  }

  const fg = q('[data-final-glow]');
  if (fg) {
    const r = fg.getBoundingClientRect();
    const p = clamp((vh - r.top) / vh, 0, 1.4);
    fg.style.transform = 'scale(' + (0.6 + p * 0.55).toFixed(3) + ')';
  }

  // Rail + nav highlight
  let active = 0;
  for (let i = 0; i < RAIL_IDS.length; i++) {
    const sec = document.getElementById(RAIL_IDS[i]);
    if (sec && sec.getBoundingClientRect().top <= vh * 0.4) active = i;
  }
  if (active !== state.activeRail) {
    state.activeRail = active;
    qa('[data-rail-dot]').forEach((a, i) => {
      const bar = a.querySelector('[data-rail-bar]');
      const lbl = a.children[1];
      if (bar) {
        bar.style.width = i === active ? '34px' : '16px';
        bar.style.background = i === active ? 'var(--ac)' : 'var(--bd)';
      }
      if (lbl) lbl.style.opacity = i === active ? '1' : '0';
      a.style.color = i === active ? 'var(--ac)' : 'var(--tx4)';
    });
    const href = '#' + RAIL_IDS[active];
    qa('[data-navlink]').forEach((a) => {
      a.style.color = a.getAttribute('href') === href ? 'var(--ac)' : 'var(--tx3)';
    });
  }
}


// ── Release notes ────────────────────────────────────────────

/**
 * Written by scripts/import-changelog.mjs from the extension's own
 * remote-config.json — the same notes that drive the What's New modal in the
 * popup, so the site cannot describe a release differently from the extension
 * announcing it. A missing or empty file leaves the section hidden rather than
 * announcing a release with nothing to say.
 */
async function loadChangelog() {
  const section = q('[data-changelog]');
  if (!section) return;

  let d;
  try {
    const res = await fetch('data/changelog.json', { cache: 'no-cache' });
    if (!res.ok) return;
    d = await res.json();
  } catch {
    return;
  }
  const added = Array.isArray(d && d.added) ? d.added : [];
  const fixed = Array.isArray(d && d.fixed) ? d.fixed : [];
  if (!added.length && !fixed.length) return;

  const label = q('[data-changelog-version]');
  // "2.0.0" is a package version; the page is talking about a release.
  if (label && d.version) label.textContent = String(d.version).replace(/\.0$/, '');

  const fill = (sel, items) => {
    const host = q(sel);
    if (!host) return;
    const card = host.closest('article');
    if (!items.length) { if (card) card.hidden = true; return; }
    host.innerHTML = '';
    for (const item of items) {
      const li = document.createElement('li');
      li.style.cssText = 'display:grid;grid-template-columns:auto minmax(0,1fr);gap:11px;align-items:start;color:var(--tx3);font-size:14.5px;line-height:1.5;text-wrap:pretty';
      const dot = document.createElement('span');
      dot.style.cssText = 'width:5px;height:5px;margin-top:8px;border-radius:var(--r-sm);background:var(--ac);flex:none;transition:background .45s,border-radius .4s';
      const text = document.createElement('span');
      text.textContent = item;             // notes are plain text, never markup
      li.append(dot, text);
      host.appendChild(li);
    }
  };
  fill('[data-changelog-added]', added);
  fill('[data-changelog-fixed]', fixed);

  section.hidden = false;
}

// ── Boot ─────────────────────────────────────────────────────

let stored = null;
try { stored = localStorage.getItem('leetsync.siteTheme'); } catch { /* private mode */ }
// Modernist is the default. A previous choice still wins, but a first-time
// visitor gets it whatever their OS prefers — the markup is authored in these
// tokens too, so first paint already matches and there is nothing to flash.
setTheme(stored || 'modernist', true);

loadChangelog();
setupReveals();
applyResponsive();
requestAnimationFrame(tick);
