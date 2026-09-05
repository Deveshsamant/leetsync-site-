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

**Modernist is the default.** A visitor's previous choice still wins, but a
first-timer gets Modernist whatever their OS prefers. The markup is authored in
Modernist tokens and `site.css` paints the same ground, so first paint already
matches and there is nothing to flash before JS runs.

## The moving parts

| Behaviour | Driven by |
| --- | --- |
| Scroll progress bar, section rail, nav shrink | one `requestAnimationFrame` loop |
| Hero grid parallax, cursor spotlight, card tilt | pointer position, same loop |
| **How it works** — 300vh pinned, line and token track scroll | `data-pin-flow` |
| **Screens** — a tab per extension screen, clicked | `data-screen-btn` / `data-screen-panel` |
| Tracker rising into place | scroll-mapped `rotateX` + `scale` |
| Counters, flip/scale/slide reveals | `IntersectionObserver` |

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

## The screenshots are real, and whole

Every image is the actual extension, captured from `preview-popup.html` and
`preview-tracker.html` — the real popup and tracker running against a stubbed
`chrome` API. Nothing is a mockup.

They are also **entire screens rather than the top of one**. The popup is
420×600 with each tab scrolling inside it, so a plain capture shows a third of
Settings and calls it a screenshot. `?full=1` lifts that fixed height in the
preview, the capture window is made deliberately over-tall, and
`scripts/trim-shots.py` cuts the surplus back off — Chrome cannot report how
tall the page ended up, so over-shoot and trim is the only single-pass way to
get it. Settings comes out around 4,400 device pixels; the site shows it in a
frame that scrolls.

Two of the seven are the onboarding wizard, which the popup's own tab bar
cannot reach: `?screen=setup&step=2` is where the token and username are
entered, and `step=4` is the consent screen — the one worth showing on a page
that makes claims about what is collected.

Each `<img>` carries a `data-shot` base name and the theme decides the suffix:

```
img/popup-sheets-dark.png     Signal
img/popup-sheets-light.png    Modernist
```

Adding a screen is two files, one tab button and one panel — no mapping to
keep in sync, because `SCREENS` in `site.js` is read from the buttons.

To retake them after a UI change:

```bash
# 1. rebuild the previews from the real popup/tracker
cd ../LeetSync-main && node scripts/make-preview.mjs

# 2. serve the extension folder on :8123, then capture
bash ../leetsync-site/scripts/capture-screens.sh
```

The previews accept `?theme=signal|light`,
`?tab=dashboard|problems|sheets|battle|settings`, `?screen=setup&step=N`,
`?full=1` and `?capture=1`, and set `data-preview-ready` on `<html>` once
painted, so the capture waits for the real thing rather than a fixed delay.
`capture=1` also stops animations and hides whatever the developer happens to
be broadcasting that day, which is live data and would otherwise land on top of
whichever screen is being photographed.

The tracker is deliberately **not** captured full-height: it lists all 895
problems, so growing it to fit photographs the dataset instead of the page.

## Release notes

The **What changed** section reads `data/changelog.json`, imported from the
extension's own `remote-config.json` — the same notes that drive the What's New
modal in the popup. Writing them once means the site cannot describe a release
differently from the extension announcing it.

```bash
node scripts/import-changelog.mjs                 # defaults to ../LeetSync-main
node scripts/import-changelog.mjs path/to/LeetSync
```

It takes the notes for the version in `manifest.json` rather than
`latestVersion`, because those disagree while a release is being prepared, and
splits `Fixed:` lines into their own column. If the file is missing or has no
notes the section hides itself.

## No public usage figures

The site used to carry an install count, a retention percentage and a
country-by-country breakdown, imported from the Chrome Web Store dashboard's
CSV exports. That section is gone, along with `data/store-stats.json` and its
importer. Those numbers are the developer's own dashboard; publishing them
tells a visitor how few other people have installed it, which is not
information they came for.

## The store link

`STORE_URL` at the top of `site.js` feeds every element marked
`data-store-link` — the three "Add to Chrome" buttons. The `utm_source` the
store's share button appends is deliberately left off: it would tag ordinary
site traffic as share-link clicks and skew the referrer breakdown.

## Deploy

The repo is the site. Import it at vercel.com/new, framework preset **Other**,
no build command, no output directory.

```bash
npx vercel --prod
```
