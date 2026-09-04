/**
 * Pull the release notes the extension already ships to its users.
 *
 * remote-config.json is the single source: the same notes drive the What's New
 * modal in the popup, so the site cannot drift into describing a release
 * differently from the extension announcing it.
 *
 *   node scripts/import-changelog.mjs [path/to/LeetSync]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.argv[2] || '../LeetSync-main');
const src = join(root, 'remote-config.json');

let config;
try {
  config = JSON.parse(readFileSync(src, 'utf8'));
} catch (error) {
  console.error(`Could not read ${src}\n  ${error.message}`);
  console.error('Pass the extension folder as the first argument.');
  process.exit(1);
}

// The manifest is what actually shipped; latestVersion is only what the config
// advertises, and the two disagree while a release is being prepared.
let version = config.latestVersion;
try {
  version = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8')).version || version;
} catch { /* fall back to the config's own idea */ }

const notes = (config.changelog && config.changelog[version]) || [];
if (!notes.length) {
  console.error(`No changelog entry for ${version} in ${src}`);
  process.exit(1);
}

// "Fixed: …" reads as a separate list on a landing page; the extension's modal
// shows one run because it is four lines tall.
const fixedAt = (s) => /^fixed:/i.test(s);
const out = {
  version,
  generatedAt: new Date().toISOString(),
  added: notes.filter(n => !fixedAt(n)),
  fixed: notes.filter(fixedAt).map(n => n.replace(/^fixed:\s*/i, '')),
};

writeFileSync('data/changelog.json', JSON.stringify(out, null, 2) + '\n');
console.log(`data/changelog.json — v${version}: ${out.added.length} new, ${out.fixed.length} fixed`);
