#!/usr/bin/env bash
# Capture the live LeetCode-Solutions README as GitHub renders it, light and
# dark, for the "A repo worth linking to" section.
#
# The content is fetched from the repo and the stat panel is the real
# generated SVG — this only supplies GitHub's own chrome so the shot looks
# like the page a visitor lands on.
set -u

REPO="${1:-Deveshsamant/leetcode-solutions}"
RAW="https://raw.githubusercontent.com/$REPO/main"
# pwd -W gives a Windows path (E:/...). Plain pwd gives /e/..., which node
# and Chrome both resolve against the current drive as E:\e\... and fail.
ROOT="$(cd "$(dirname "$0")/.." && { pwd -W 2>/dev/null || pwd; })"
CHROME="/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"
PROFILE="$(mktemp -d)"

echo "Fetching $REPO"
node -e "
const fs=require('fs');
(async()=>{
  const get=async(p)=>{const r=await fetch('$RAW/'+p);if(!r.ok)throw new Error(p+' -> '+r.status);return r.text();};
  fs.writeFileSync('$ROOT/.readme.md', await get('README.md'));
  for (const n of ['stats-dark','stats-light'])
    fs.writeFileSync('$ROOT/.'+n+'.svg', await get('.leetsync/'+n+'.svg'));
  console.log('  fetched README.md and both stat panels');
})();
" || { echo "fetch failed"; exit 1; }

node "$ROOT/scripts/render-readme.mjs" || exit 1

for th in dark light; do
  # Chrome resolves --screenshot against its own working directory, so this
  # path has to be absolute.
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --no-first-run \
    --no-default-browser-check --disable-extensions --user-data-dir="$PROFILE" \
    --force-device-scale-factor=2 --virtual-time-budget=9000 \
    --window-size=860,1020 --screenshot="$ROOT/img/readme-$th.png" \
    "file:///$ROOT/.readme-$th.html" >/dev/null 2>&1
  if [ -f "$ROOT/img/readme-$th.png" ]; then
    printf '  readme-%s.png  %s bytes\n' "$th" "$(stat -c%s "$ROOT/img/readme-$th.png")"
  else
    printf '  readme-%s.png  FAILED\n' "$th"
  fi
done

rm -rf "$PROFILE" "$ROOT"/.readme.md "$ROOT"/.readme-*.html "$ROOT"/.stats-*.svg
echo done
