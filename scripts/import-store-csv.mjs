/**
 * Turn Chrome Web Store dashboard CSV exports into data/store-stats.json.
 *
 * There is no API for these numbers. The Chrome Web Store API covers
 * publishing only — upload, update, publish — so install counts and the
 * region/OS breakdowns exist solely in the dashboard UI and its "Export to
 * CSV" buttons. This is the shortest honest path: export, drop the files in,
 * run this.
 *
 *   Dashboard -> your item -> Stats, then Export to CSV on each panel.
 *   Save them into a folder and pass it:
 *
 *     node scripts/import-store-csv.mjs ./csv
 *
 * It matches files by name, so keep the dashboard's own filenames or include
 * the words below:
 *
 *   installs (time series)   -> total installs
 *   uninstalls (time series) -> total uninstalls
 *   region                   -> installs by region
 *   os                       -> installs by OS
 *
 * Anything it cannot parse is reported rather than guessed at, because a
 * silently wrong figure on a public page is worse than no figure.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir || !existsSync(dir)) {
  console.error('Usage: node scripts/import-store-csv.mjs <folder-of-csv-exports>');
  process.exit(1);
}

/** Split a CSV line, honouring quoted fields containing commas. */
function splitRow(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++; } else quoted = !quoted;
    } else if (c === ',' && !quoted) {
      out.push(cur); cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const rowsOf = (file) => readFileSync(file, 'utf8')
  .split(/\r?\n/).filter((l) => l.trim()).map(splitRow);

/** Every numeric cell in the last column, summed. A time series totals to its count. */
function sumSeries(rows) {
  let total = 0;
  let seen = 0;
  for (const r of rows.slice(1)) {
    const n = Number(r[r.length - 1]);
    if (Number.isFinite(n)) { total += n; seen++; }
  }
  if (!seen) throw new Error('no numeric rows');
  return total;
}

/** label -> count, then converted to whole-percent shares that sum to 100. */
function breakdown(rows) {
  const items = [];
  for (const r of rows.slice(1)) {
    const name = r[0];
    const n = Number(r[r.length - 1]);
    if (!name || !Number.isFinite(n) || n <= 0) continue;
    items.push({ name, n });
  }
  if (!items.length) throw new Error('no labelled rows');

  const total = items.reduce((a, i) => a + i.n, 0);
  items.sort((a, b) => b.n - a.n);
  const out = items.map((i) => ({ name: i.name, share: Math.round((i.n / total) * 100) }));

  // Rounding can leave the column at 99 or 101; put the drift on the largest
  // slice so the bars still read as a whole.
  const drift = 100 - out.reduce((a, i) => a + i.share, 0);
  if (drift && out.length) out[0].share += drift;
  return out;
}

const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.csv'));
if (!files.length) { console.error(`No .csv files in ${dir}`); process.exit(1); }

const pick = (...words) => files.find((f) => {
  const l = f.toLowerCase();
  return words.every((w) => l.includes(w));
});

const OUT = 'data/store-stats.json';
const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const stats = { ...prev };
const problems = [];

const load = (label, file, fn, assign) => {
  if (!file) { problems.push(`${label}: no matching CSV, kept previous value`); return; }
  try {
    assign(fn(rowsOf(join(dir, file))));
    console.log(`  ${label.padEnd(12)} <- ${file}`);
  } catch (e) {
    problems.push(`${label}: ${file} — ${e.message}`);
  }
};

load('installs', pick('install') && !pick('uninstall') ? pick('install') : files.find((f) => /(^|[^n])install/i.test(f)),
  sumSeries, (v) => { stats.installs = v; });
load('uninstalls', pick('uninstall'), sumSeries, (v) => { stats.uninstalls = v; });
load('regions', pick('region'), breakdown, (v) => { stats.regions = v; });
load('platforms', pick('os'), breakdown, (v) => { stats.platforms = v; });

stats.period = stats.period || { from: '', to: '' };
writeFileSync(OUT, JSON.stringify(stats, null, 2) + '\n');

console.log(`\nwrote ${OUT}`);
console.log(`  installs ${stats.installs}, uninstalls ${stats.uninstalls}`);
if (problems.length) {
  console.log('\nNot updated (left as they were):');
  for (const p of problems) console.log('  - ' + p);
}
console.log('\nSet "period" by hand to the range the dashboard was showing.');
