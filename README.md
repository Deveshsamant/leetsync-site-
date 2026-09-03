# LeetSync marketing site

Static landing page for the [LeetSync](https://github.com/Deveshsamant/LeetSync)
Chrome extension. No build step, no dependencies — three files and a folder of
screenshots.

## The theme switch is the pitch

The extension ships two themes, so the page ships both too. The switch in the
header changes the page **and** every screenshot on it, because each `<img>`
carries a `data-shot` base name and the theme decides the suffix:

```
img/popup-sheets-dark.png     Signal
img/popup-sheets-light.png    Modernist
```

Adding a screen means adding two files and one tab button — no per-image
bookkeeping to fall out of sync. With no stored preference the page follows
`prefers-color-scheme`, since the two themes map onto exactly that.

## The screenshots are real

Every image is the actual extension, captured from `preview-popup.html` and
`preview-tracker.html` — the real popup and tracker running against a stubbed
`chrome` API. Nothing is a mockup.

To retake them after a UI change:

```bash
# 1. rebuild the previews from the real popup/tracker
cd ../LeetSync-main && node scripts/make-preview.mjs

# 2. serve the extension folder on :8123, then capture
bash scripts/capture-screens.sh
```

The previews accept `?theme=signal|light` and `?tab=dashboard|problems|sheets|battle|settings`,
and set `data-preview-ready` on `<html>` once painted, so the capture waits for
the real thing rather than a fixed delay.

## Before deploying

`STORE_URL` at the top of `site.js` is **empty**. Every "Add to Chrome" button
falls back to the GitHub repo until it is filled in — wrong, but honest, rather
than a guessed listing URL that 404s. Set it and every button updates.

## Deploy

The repo is the site. Import it at vercel.com/new, framework preset **Other**,
no build command, no output directory.

```bash
npx vercel --prod
```
