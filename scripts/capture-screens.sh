#!/usr/bin/env bash
# Capture the real popup and tracker with headless Chrome: every screen, both
# themes, whole-page rather than the top 600px.
#
# The popup is 420x600 with each tab scrolling inside it, so a plain capture
# shows a third of Settings and calls it a screenshot. `?full=1` lifts the
# fixed height in the preview, the window is made deliberately over-tall, and
# trim-shots.py cuts the surplus back off — Chrome cannot report how tall the
# page ended up, so over-shoot and trim is the only single-pass way to do it.
#
# Run with the preview server already serving the extension folder on :8123.
set -u

CHROME="/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"
BASE="http://localhost:8123"
# pwd -W gives a Windows path (E:/...). Plain pwd gives /e/..., which Chrome
# resolves against the current drive as E:\e\... and silently writes nothing.
ROOT="$(cd "$(dirname "$0")/.." && { pwd -W 2>/dev/null || pwd; })"
OUT="$ROOT/img"
PROFILE="$(mktemp -d)"
TALL=3000

shot() {   # shot <query> <file> <w> <h>
  "$CHROME" \
    --headless=new --disable-gpu --hide-scrollbars --no-first-run \
    --no-default-browser-check --disable-extensions \
    --user-data-dir="$PROFILE" \
    --force-device-scale-factor=2 \
    --virtual-time-budget=6000 \
    --window-size="$3,$4" \
    --screenshot="$OUT/$2" \
    "$BASE/$1" >/dev/null 2>&1
  if [ -f "$OUT/$2" ]; then
    printf '  %-28s %s bytes\n' "$2" "$(stat -c%s "$OUT/$2")"
  else
    printf '  %-28s FAILED\n' "$2"
  fi
}

mkdir -p "$OUT"

echo "Popup tabs — 420 wide, full height, 2x"
for theme in dark light; do
  for tab in dashboard problems sheets battle settings; do
    shot "preview-popup.html?capture=1&full=1&theme=$theme&tab=$tab" \
         "popup-$tab-$theme.png" 420 "$TALL"
  done
done

# The wizard is five screens the main popup never shows. Step 2 is where the
# token and username are entered; step 4 is the consent screen, and the one
# worth showing on a page that makes claims about what is collected.
echo "Onboarding — the wizard, which the tabs cannot reach"
for theme in dark light; do
  shot "preview-popup.html?capture=1&full=1&theme=$theme&screen=setup&step=2" \
       "popup-setup-$theme.png" 420 "$TALL"
  shot "preview-popup.html?capture=1&full=1&theme=$theme&screen=setup&step=4" \
       "popup-consent-$theme.png" 420 "$TALL"
done

# Not full-height: the tracker lists all 895 problems, so growing it to fit
# photographs the dataset instead of the page. A window is what a visitor sees.
echo "Tracker - 1280x1000, 2x"
for theme in dark light; do
  shot "preview-tracker.html?capture=1&theme=$theme" "tracker-$theme.png" 1280 1000
done

rm -rf "$PROFILE"

echo "Trimming the over-tall captures"
python "$ROOT/scripts/trim-shots.py" "$OUT"/popup-*.png

echo done
