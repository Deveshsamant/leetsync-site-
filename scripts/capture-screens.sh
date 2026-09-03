#!/usr/bin/env bash
# Capture the real popup and tracker with headless Chrome, every tab in both
# themes. Run with the preview server already serving the extension folder.
set -u

CHROME="/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"
BASE="http://localhost:8123"
OUT="$(cd "$(dirname "$0")/.." && pwd)/img"
PROFILE="$(mktemp -d)"

shot() {   # shot <url> <file> <w> <h>
  "$CHROME" \
    --headless=new --disable-gpu --hide-scrollbars --no-first-run \
    --no-default-browser-check --disable-extensions \
    --user-data-dir="$PROFILE" \
    --force-device-scale-factor=2 \
    --virtual-time-budget=6000 \
    --window-size="$3,$4" \
    --screenshot="$OUT/$2" \
    "$1" >/dev/null 2>&1
  if [ -f "$OUT/$2" ]; then
    printf '  %-28s %s bytes\n' "$2" "$(stat -c%s "$OUT/$2")"
  else
    printf '  %-28s FAILED\n' "$2"
  fi
}

mkdir -p "$OUT"
echo "Popup — 420x600, 2x"
for theme in dark light; do
  for tab in dashboard problems sheets battle settings; do
    shot "$BASE/preview-popup.html?theme=$theme&tab=$tab" \
         "popup-$tab-$theme.png" 420 600
  done
done

echo "Tracker — 1280x900, 2x"
for theme in dark light; do
  shot "$BASE/preview-tracker.html?theme=$theme" "tracker-$theme.png" 1280 900
done

rm -rf "$PROFILE"
echo "done"
