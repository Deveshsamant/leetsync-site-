# LeetSync marketing site

**Live at [leetsync-site.vercel.app](https://leetsync-site.vercel.app/)**

Static landing page for the [LeetSync](https://github.com/Deveshsamant/LeetSync)
Chrome extension. Three files and a folder of screenshots — no build step, no
dependencies.

Ported from the Claude Design project **LeetSync Site**.

## How it is put together

The palette lives as CSS custom properties on the root element and JS swaps
the whole set at once, rather than shipping a second stylesheet. That is what
lets one toggle restyle the page *and* repoint every screenshot on it.

`site.css` therefore holds only what an inline style cannot express: the
reset, the keyframes, and the hover rules the design wrote as `style-hover`
attributes. Everything else is inline, exactly as the design authored it.

## The moving parts

| Behaviour | Driven by |
| --- | --- |
| Scroll progress bar, section rail, nav shrink | one `requestAnimationFrame` loop |
| Hero grid parallax, cursor spotlight, card tilt | pointer position, same loop |
| **How it works** — 300vh pinned, line and token track scroll | `data-pin-flow` |
| **Screens** — 520vh pinned, scroll position picks the tab | `data-pin-screens` |
| Tracker rising into place | scroll-mapped `rotateX` + `scale` |
| Counters, flip/scale/slide reveals, typed README | `IntersectionObserver` |

Breakpoints are applied from JS rather than media queries, because the pinned
stage has to be sized against the *viewport height* — something a media query
cannot express.

Everything respects `prefers-reduced-motion`: reveals resolve immediately, the
marquee stops, and tilt is not bound at all.

## The README shot is the live one

The "A repo worth linking to" section shows the actual
[leetcode-solutions](https://github.com/Deveshsamant/leetcode-solutions) README
— its content fetched from the repo, its stat panel the real generated SVG,
inlined. The only thing supplied locally is GitHub's own chrome: the palette,
the table rules and the markdown-body metrics, so the shot looks like the page
a visitor actually lands on.

```bash
bash scripts/capture-readme.sh                 # defaults to the repo above
bash scripts/capture-readme.sh owner/other     # or any public repo
```

It fetches, renders light and dark, captures both, and deletes its
intermediates.

## The screenshots are real

Every image is the actual extension, captured from `preview-popup.html` and
`preview-tracker.html` — the real popup and tracker running against a stubbed
`chrome` API. Nothing is a mockup.

Each `<img>` carries a `data-shot` base name and the theme decides the suffix:

```
img/popup-sheets-dark.png     Signal
img/popup-sheets-light.png    Modernist
```

Adding a screen is two files and one tab button — no mapping to keep in sync.

To retake them after a UI change:

```bash
# 1. rebuild the previews from the real popup/tracker
cd ../LeetSync-main && node scripts/make-preview.mjs

# 2. serve the extension folder on :8123, then capture
bash ../leetsync-site/scripts/capture-screens.sh
```

The previews accept `?theme=signal|light` and
`?tab=dashboard|problems|sheets|battle|settings`, and set `data-preview-ready`
on `<html>` once painted, so the capture waits for the real thing rather than
a fixed delay.

## Chrome Web Store figures

The "Real usage" section reads `data/store-stats.json`. Those numbers **cannot
be fetched live** — the Chrome Web Store API covers publishing only (upload,
update, publish), so install counts and the region/OS breakdowns exist purely
in the dashboard UI and its *Export to CSV* buttons.

To refresh them: Dashboard → your item → **Stats**, hit *Export to CSV* on the
panels you want, drop the files in a folder, then

```bash
node scripts/import-store-csv.mjs ./csv
```

It matches files by name (`install`, `uninstall`, `region`, `os`), reports
anything it cannot parse instead of guessing, and leaves the previous value in
place. Set `period` by hand to the range the dashboard was showing.

Editing the JSON directly is fine too. If the file is missing or malformed the
section hides itself rather than showing a broken claim.

## Before deploying

`STORE_URL` at the top of `site.js` is **empty**. Every "Add to Chrome" button
falls back to the GitHub repo until it is filled in — wrong, but honest,
rather than a guessed listing URL that 404s. Set it and every button updates.

## Deploy

The repo is the site. Import it at vercel.com/new, framework preset **Other**,
no build command, no output directory.

```bash
npx vercel --prod
```
