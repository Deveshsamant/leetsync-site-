/**
 * Render the live LeetCode-Solutions README the way GitHub renders it, so it
 * can be captured for the marketing site.
 *
 * The content is the real README pulled from the repo and the real generated
 * stat panel, inlined — not a mockup, and not a re-typing of either. The only
 * thing this file supplies is GitHub's own chrome: its palette, its table
 * rules and its markdown-body metrics.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const DIR = process.env.LS_SITE_DIR || 'E:/LeetSync-main/leetsync-site/';
const md = readFileSync(DIR + '.readme.md', 'utf8');

const svg = {
  dark: readFileSync(DIR + '.stats-dark.svg', 'utf8'),
  light: readFileSync(DIR + '.stats-light.svg', 'utf8'),
};

// ── Pull the real values out of the markdown rather than restating them ──

const badges = [...md.matchAll(/!\[([^\]]+)\]\((https:\/\/img\.shields\.io[^)]+)\)/g)]
  .map((m) => ({ alt: m[1], src: m[2] }));

const rows = md.split('\n')
  .filter((l) => /^\|\s*\d+\s*\|/.test(l))
  .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));

const title = (/<h1>([^<]+)<\/h1>/.exec(md) || [])[1] || 'LeetCode Solutions';
const tagline = (/<p><em>([^<]+)<\/em><\/p>/.exec(md) || [])[1] || '';
const footer = (/<sub>([\s\S]*?)<\/sub>/.exec(md) || [])[1] || '';

const cell = (text) => text
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="#">$1</a>')
  .replace(/`([^`]+)`/g, '<code>$1</code>');

const THEMES = {
  dark: {
    bg: '#0d1117', fg: '#e6edf3', muted: '#8b949e', border: '#30363d',
    link: '#4493f8', headBg: '#161b22', stripe: '#161b22', code: '#151b23',
  },
  light: {
    bg: '#ffffff', fg: '#1f2328', muted: '#59636e', border: '#d1d9e0',
    link: '#0969da', headBg: '#f6f8fa', stripe: '#f6f8fa', code: '#eff1f3',
  },
};

for (const [name, t] of Object.entries(THEMES)) {
  const page = `<!DOCTYPE html>
<html lang="en" data-theme="${name}">
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: ${t.bg};
    color: ${t.fg};
    font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .frame { border: 1px solid ${t.border}; border-radius: 6px; margin: 0; }
  .tabs {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-bottom: 1px solid ${t.border};
    font-size: 14px; color: ${t.muted};
  }
  .tabs .on { color: ${t.fg}; font-weight: 600; border-bottom: 2px solid #fd8c73; padding-bottom: 9px; margin-bottom: -10px; }
  .body { padding: 32px 40px 40px; }
  h1 { font-size: 32px; font-weight: 600; margin: 0 0 4px; border-bottom: 1px solid ${t.border}; padding-bottom: 12px; }
  h3 { font-size: 20px; font-weight: 600; margin: 0; }
  p { margin: 0 0 16px; }
  em { color: ${t.fg}; }
  hr { height: 1px; border: 0; background: ${t.border}; margin: 24px 0; }
  .center { text-align: center; }
  .badges { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin: 16px 0; }
  .badges img { height: 28px; }
  svg { display: block; margin: 16px auto; max-width: 100%; height: auto; }
  table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 14px; }
  th, td { border: 1px solid ${t.border}; padding: 6px 13px; }
  th { background: ${t.headBg}; font-weight: 600; }
  tr:nth-child(2n) td { background: ${t.stripe}; }
  code { background: ${t.code}; border-radius: 6px; padding: .2em .4em; font-size: 85%;
         font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace; }
  a { color: ${t.link}; text-decoration: none; }
  a:hover { text-decoration: underline; }
  sub { color: ${t.muted}; font-size: 13px; }
  .c1 { text-align: center; } .c2 { text-align: left; }
  .c3, .c4, .c5 { text-align: center; }
</style>
</head>
<body>
  <div class="frame">
    <div class="tabs"><span class="on">README</span></div>
    <div class="body">
      <div class="center">
        <h1>${title}</h1>
        <p><em>${tagline}</em></p>
        <div class="badges">
          ${badges.map((b) => `<img alt="${b.alt}" src="${b.src}">`).join('\n          ')}
        </div>
        ${svg[name]}
      </div>
      <hr>
      <div class="center"><h3>ALL SOLUTIONS</h3></div>
      <table>
        <thead><tr>
          <th class="c1">#</th><th class="c2">Problem</th><th class="c3">Difficulty</th>
          <th class="c4">Language</th><th class="c5">Date</th>
        </tr></thead>
        <tbody>
          ${rows.map((r) => `<tr>${r.map((c, i) => `<td class="c${i + 1}">${cell(c)}</td>`).join('')}</tr>`).join('\n          ')}
        </tbody>
      </table>
      <hr>
      <div class="center"><sub>${footer}</sub></div>
    </div>
  </div>
</body>
</html>`;
  writeFileSync(`${DIR}.readme-${name}.html`, page);
  console.log(`wrote .readme-${name}.html — ${badges.length} badges, ${rows.length} rows`);
}
