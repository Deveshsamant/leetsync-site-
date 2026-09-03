/* ============================================================
   site.js — LeetSync marketing site.

   Two jobs: switch the page between the extension's own two themes, and keep
   every screenshot on the page showing the matching theme, so the switch
   demonstrates the product rather than just restyling the page around it.
   ============================================================ */

/**
 * The Chrome Web Store listing.
 *
 * Left empty on purpose rather than guessed — every "Add to Chrome" button
 * falls back to the repository until this is filled in, which is wrong but
 * honest. Set it and the buttons point at the listing.
 */
const STORE_URL = '';

const THEME_KEY = 'leetsync.siteTheme';
const THEMES = {
  signal: { label: 'Signal', shot: 'dark' },
  modernist: { label: 'Modernist', shot: 'light' },
};

const root = document.documentElement;
const $ = (id) => document.getElementById(id);

// ── Store link ───────────────────────────────────────────────

if (STORE_URL) {
  for (const a of document.querySelectorAll('[data-store-link]')) a.href = STORE_URL;
}

// ── Theme ────────────────────────────────────────────────────

/**
 * Swap every screenshot to the matching build.
 *
 * The filename carries the theme (`popup-sheets-dark.png`), so the mapping is
 * a suffix swap driven by each image's own `data-shot` base — no per-image
 * bookkeeping to fall out of sync when a screen is added.
 */
function paintShots(theme) {
  const suffix = THEMES[theme].shot;
  for (const img of document.querySelectorAll('[data-shot]')) {
    img.src = `img/${img.dataset.shot}-${suffix}.png`;
  }
}

function applyTheme(theme) {
  const next = THEMES[theme] ? theme : 'signal';
  root.dataset.theme = next;
  $('themeName').textContent = THEMES[next].label;
  paintShots(next);
  try { localStorage.setItem(THEME_KEY, next); } catch { /* private mode */ }
}

let stored = null;
try { stored = localStorage.getItem(THEME_KEY); } catch { /* private mode */ }
// No stored choice: follow the reader's own light/dark preference, since the
// two themes map onto exactly that.
applyTheme(stored || (window.matchMedia
  && window.matchMedia('(prefers-color-scheme: light)').matches ? 'modernist' : 'signal'));

$('themeBtn').addEventListener('click', () => {
  applyTheme(root.dataset.theme === 'signal' ? 'modernist' : 'signal');
});

// ── Screen tabs ──────────────────────────────────────────────

const SHOT_NOTES = {
  dashboard: 'Dashboard — sync status, streak and 90-day activity',
  problems: 'Solved — search, filter by difficulty, or by what you struggled with',
  sheets: 'Sheets — pick a study sheet and track it as you solve',
  battle: 'Battle — compare progress with friends by GitHub username',
  settings: 'Settings — repository, themes, data export and usage reporting',
};

const tabs = $('shotTabs');
const tabShot = $('tabShot');

function selectShot(name) {
  for (const b of tabs.querySelectorAll('button')) {
    b.setAttribute('aria-selected', String(b.dataset.shotTab === name));
  }
  // Set the base and let paintShots resolve the theme, so a tab change and a
  // theme change can never disagree about which file to show.
  tabShot.dataset.shot = `popup-${name}`;
  tabShot.alt = `LeetSync ${name} screen`;
  paintShots(root.dataset.theme);
  $('shotNote').textContent = SHOT_NOTES[name] || '';
}

tabs.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-shot-tab]');
  if (btn) selectShot(btn.dataset.shotTab);
});

// Arrow keys move between tabs, as a tablist is expected to.
tabs.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
  const list = [...tabs.querySelectorAll('button')];
  const at = list.findIndex(b => b.getAttribute('aria-selected') === 'true');
  const next = list[(at + (event.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length];
  next.focus();
  selectShot(next.dataset.shotTab);
});

selectShot('dashboard');
