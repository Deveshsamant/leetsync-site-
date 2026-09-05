#!/usr/bin/env python3
"""Trim the dead background off the bottom of a full-height capture.

The popup is normally 420x600 with the tab scrolling inside it. To photograph
a whole screen the preview lifts that height (`?full=1`), so the capture has to
be taken into a window taller than any screen could be -- and every screen then
ends with a band of empty background.

Chrome cannot be asked how tall the page turned out, so the window is
deliberately over-tall and the surplus is cut here: rows are dropped from the
bottom while they are uniformly the background colour, then a small margin is
put back so the content does not sit flush against the edge.
"""
import sys
from PIL import Image

PAD = 40          # device pixels of breathing room kept below the content
MIN_H = 400       # never crop shorter than this, whatever the scan says


def trim(path):
    im = Image.open(path).convert('RGB')
    w, h = im.size
    px = im.load()
    # The bottom-left pixel is background by construction: it is below every
    # screen's content. Sampling it beats hardcoding a per-theme colour.
    bg = px[1, h - 2]

    last = h - 1
    while last > MIN_H:
        row = [px[x, last] for x in range(0, w, 7)]
        if any(c != bg for c in row):
            break
        last -= 1

    cut = min(h, last + 1 + PAD)
    if cut >= h:
        print(f'  {path}  {w}x{h}  (nothing to trim)')
        return
    im.crop((0, 0, w, cut)).save(path, optimize=True)
    print(f'  {path}  {w}x{h} -> {w}x{cut}')


if __name__ == '__main__':
    for p in sys.argv[1:]:
        try:
            trim(p)
        except Exception as exc:                       # a failed shot, not a crash
            print(f'  {p}  SKIPPED ({exc})')
