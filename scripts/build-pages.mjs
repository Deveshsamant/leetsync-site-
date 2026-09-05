/**
 * Split index.html into a page per section.
 *
 *   node scripts/build-pages.mjs
 *
 * The home page keeps every section — it is the long scroll it has always
 * been — and each section *also* gets a standalone URL, so /privacy and
 * /screens can be linked, shared and found on their own.
 *
 * That is the same words in two places, which is only safe if one of them is
 * generated. So it is: index.html is the source, these pages are derived from
 * it on every run, and editing a section in one place is the only way to edit
 * it. Nothing here is hand-maintained — the files carry a banner saying so.
 *
 * The chrome (head, nav, footer, scripts) is lifted from index.html too, so a
 * change to the header cannot leave eight pages behind.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SITE = 'https://leetsync-site.vercel.app';

/**
 * One entry per page. `id` is the section's own id in index.html; `nav` has to
 * match the nav link text so the current page can be marked without a second
 * mapping to keep in step.
 */
const PAGES = [
  {
    file: 'features.html', id: 'features', nav: 'Features', label: 'Features',
    title: 'Features — LeetSync',
    desc: 'Everything LeetSync does the moment a submission is accepted: automatic '
      + 'pushes, a README that writes itself, seven study sheets, revision filters, '
      + 'streaks, cross-device sync and a public leaderboard.',
  },
  {
    file: 'whats-new.html', id: 'whatsnew', nav: "What's new", label: "What's new",
    title: 'What changed in 2.0 — LeetSync',
    desc: 'Release notes for LeetSync 2.0, read from the same file that drives the '
      + 'What’s New notice inside the extension.',
  },
  {
    file: 'how-it-works.html', id: 'flow', nav: 'How it works', label: 'How it works',
    title: 'How it works — LeetSync',
    desc: 'From accepted to committed: what happens between hitting Submit on '
      + 'LeetCode and the commit landing in your repository.',
  },
  {
    file: 'screens.html', id: 'screens', nav: 'Screens', label: 'Screens',
    title: 'Every screen — LeetSync',
    desc: 'All seven screens of the LeetSync extension, captured whole in both '
      + 'themes, beside what every part of each one does.',
    image: 'img/popup-dashboard-light.png',
  },
  {
    file: 'tracker.html', id: 'tracker', nav: 'Tracker', label: 'Tracker',
    title: 'The full-page tracker — LeetSync',
    desc: 'All 895 problems on one page: search, filter by sheet or difficulty, tick '
      + 'by hand, and watch auto-tracked problems fill in as you solve them.',
    image: 'img/tracker-light.png',
  },
  {
    file: 'sheets.html', id: 'sheets', nav: 'Sheets', label: 'Sheets',
    title: 'Seven study sheets — LeetSync',
    desc: 'Striver A2Z, Striver SDE, Striver 79, Blind 75, Love Babbar 450, NeetCode '
      + '150 and NeetCode 250 — 1,667 rows over 895 distinct problems, built in.',
  },
  {
    file: 'readme.html', id: 'readme', nav: 'Your README', label: 'Your README',
    title: 'A repo worth linking to — LeetSync',
    desc: 'The README LeetSync writes and keeps current: a rolling-year solve '
      + 'calendar, difficulty badges against LeetCode’s real totals, and an index '
      + 'that stays readable as the repo grows.',
    image: 'img/readme-light.png',
  },
  {
    file: 'privacy.html', id: 'privacy', nav: 'Privacy', label: 'Privacy',
    title: 'Privacy — LeetSync',
    desc: 'Three switches, each listed in full: what stays on your device, what is '
      + 'sent only if you opt in, and what is never collected.',
  },
];

const src = readFileSync('index.html', 'utf8');
const lines = src.split('\n');

// ── Cut index.html into its parts ────────────────────────────
// The file is authored at a consistent indent, so a top-level child of <main>
// is a line starting with exactly four spaces and a tag. That beats matching
// </section>, which several sections contain more than one of.

const headEnd = lines.findIndex((l) => l.trim() === '</head>');
const mainOpen = lines.findIndex((l) => l.includes('<main id="top">'));
const mainClose = lines.findIndex((l) => l.trim() === '</main>');
const footOpen = lines.findIndex((l) => l.startsWith('  <footer'));
if (headEnd < 0 || mainOpen < 0 || mainClose < 0 || footOpen < 0) {
  throw new Error('index.html no longer has the shape this script cuts along');
}

const head = lines.slice(0, headEnd + 1).join('\n');
// Everything between </head> and <main>: the root div, the progress bar, the
// rail and the header. Taken verbatim so the nav cannot drift.
const chrome = lines.slice(headEnd + 1, mainOpen).join('\n');
const tail = lines.slice(footOpen).join('\n');

const blocks = [];
for (let i = mainOpen + 1; i < mainClose; i++) {
  if (/^ {4}<[^/]/.test(lines[i]) || /^ {4}<!--/.test(lines[i])) {
    blocks.push({ start: i, end: mainClose });
    if (blocks.length > 1) blocks[blocks.length - 2].end = i;
  }
}
const text = (b) => lines.slice(b.start, b.end).join('\n');
const find = (needle) => {
  const hit = blocks.filter((b) => text(b).includes(needle));
  if (hit.length !== 1) throw new Error(`expected one block containing ${needle}`);
  return text(hit[0]);
};

const finalCta = find('data-final');

// ── The bits a standalone page needs and the home page does not ──

/**
 * A page carrying one section still has to say where the rest of it went.
 * Home first, then every sibling in nav order.
 */
function morePages(current) {
  const link = (href, label) =>
    `\n          <a data-more-link href="${href}" style="display:inline-flex;align-items:center;`
    + `gap:9px;padding:11px 16px;font-family:var(--f-head);font-weight:var(--btn-w);`
    + `font-size:13.5px;letter-spacing:var(--btn-ls);text-transform:var(--btn-tt);`
    + `text-decoration:none;color:var(--tx2);background:var(--card);`
    + `border:var(--bw) solid var(--bd);border-radius:var(--r-sm);`
    + `transition:background .18s,color .18s,border-color .3s,border-radius .4s">${label}</a>`;

  const others = PAGES.filter((p) => p.file !== current.file)
    .map((p) => link('/' + p.file.replace(/\.html$/, ''), p.label)).join('');

  return '\n    <section data-more style="padding:clamp(44px,6vw,72px) clamp(16px,4vw,44px);'
    + 'max-width:1280px;margin:0 auto;border-top:var(--bw) solid var(--bd-soft)">'
    + '\n      <span style="display:inline-block;font-family:var(--f-mono);font-size:11px;'
    + 'letter-spacing:.16em;text-transform:uppercase;color:var(--kick-c);'
    + 'font-weight:var(--kick-w);margin-bottom:16px">The rest of it</span>'
    + '\n      <div style="display:flex;flex-wrap:wrap;gap:10px">'
    + link('/', 'Home') + others
    + '\n      </div>'
    + '\n    </section>\n';
}

/** Head rewritten for this page: its own title, description, canonical and card. */
function pageHead(page) {
  const url = SITE + '/' + page.file.replace(/\.html$/, '');
  let h = head;

  const swap = (pattern, replacement, what) => {
    if (!pattern.test(h)) throw new Error(`index.html head has no ${what}`);
    h = h.replace(pattern, replacement);
  };

  swap(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`, 'title');
  swap(/<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${page.desc}">`, 'description');
  swap(/<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${url}">`, 'canonical');
  swap(/<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${page.title}">`, 'og:title');
  swap(/<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${page.desc}">`, 'og:description');
  swap(/<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${url}">`, 'og:url');
  swap(/<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${page.title}">`, 'twitter:title');
  swap(/<meta name="twitter:description" content="[^"]*">/,
    `<meta name="twitter:description" content="${page.desc}">`, 'twitter:description');

  // Only pages with a picture of their own override the share image; the rest
  // keep the tracker shot the home page uses.
  if (page.image) {
    h = h.replace(/<meta property="og:image" content="[^"]*">/,
      `<meta property="og:image" content="${SITE}/${page.image}">`)
      .replace(/<meta name="twitter:image" content="[^"]*">/,
        `<meta name="twitter:image" content="${SITE}/${page.image}">`)
      // The dimensions belonged to the home page's image.
      .replace(/\n  <meta property="og:image:width" content="[^"]*">/, '')
      .replace(/\n  <meta property="og:image:height" content="[^"]*">/, '');
  }
  return h;
}

/**
 * The header, minus the left-hand rail.
 *
 * The rail steps through a page's sections, and these pages have one. The
 * current nav link is marked instead, which is what a multi-page site has that
 * a single scroller cannot.
 */
function pageChrome(page) {
  let c = chrome.replace(/\n  <div data-rail[\s\S]*?\n  <\/div>\n/, '\n');
  if (c.includes('data-rail')) throw new Error('the rail did not come out cleanly');

  const link = new RegExp(`(<a data-navlink href="[^"]*"[^>]*?)(>${page.nav}</a>)`);
  if (!link.test(c)) {
    // The nav text is the join between a page and its link; a rename that only
    // lands in one of them should stop the build, not ship a dead nav.
    throw new Error(`no nav link reading "${page.nav}"`);
  }
  return c.replace(link, '$1 aria-current="page" data-navhere$2');
}

const BANNER = '<!-- Generated by scripts/build-pages.mjs from index.html. '
  + 'Edit the section there, then re-run — changes made here are overwritten. -->';

for (const page of PAGES) {
  const section = find(`id="${page.id}"`);
  const html = [
    pageHead(page).replace('<!DOCTYPE html>', '<!DOCTYPE html>\n' + BANNER),
    pageChrome(page),
    '  <main id="top">',
    section.replace(/\n+$/, ''),
    morePages(page),
    finalCta.replace(/\n+$/, ''),
    '  </main>',
    tail,
  ].join('\n');
  writeFileSync(page.file, html);
  console.log(`  ${page.file.padEnd(18)} ${(html.length / 1024).toFixed(0)} KB  ${page.title}`);
}

// A site that is one URL needs no sitemap. A site that is nine does, and the
// script that knows the nine is this one.
const urls = ['/', ...PAGES.map((p) => '/' + p.file.replace(/\.html$/, ''))];
writeFileSync('sitemap.xml',
  '<?xml version=\'1.0\' encoding=\'UTF-8\'?>' + '\n'
  + '<urlset xmlns=\'http://www.sitemaps.org/schemas/sitemap/0.9\'>' + '\n'
  + urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')
  + '\n</urlset>\n');

writeFileSync('robots.txt',
  'User-agent: *\nAllow: /\n\n' + `Sitemap: ${SITE}/sitemap.xml\n`);

console.log(`${PAGES.length} pages, sitemap.xml and robots.txt written from index.html`);
