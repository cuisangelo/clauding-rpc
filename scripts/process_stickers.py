#!/usr/bin/env python3
"""Remove white/sticker background and normalize all Clawd stickers to 1024x1024 transparent PNG."""

from PIL import Image
from collections import deque
from pathlib import Path

SRC = Path(__file__).parent.parent / 'assets' / 'stickers' / 'originals'
OUT = Path(__file__).parent.parent / 'assets' / 'stickers' / 'processed'
OUT.mkdir(exist_ok=True)

# clawd-shiny is byte-identical to clawd; clawd-wave is a broken die-cut mockup.
SKIP = {'clawd-shiny.png', 'clawd-wave.png'}

TARGET_SIZE = 1024
PADDING_PCT = 0.05          # 5% transparent margin inside the final 1024 canvas
WHITE_TOLERANCE = 35        # how close to (255,255,255) counts as background
ALPHA_THRESHOLD = 30        # below this counts as transparent
PIXEL_ART_THRESHOLD = 300   # inputs smaller than this use nearest-neighbor upscale


def remove_background(im: Image.Image) -> Image.Image:
    """Flood-fill from all 4 perimeters through any white-or-transparent connected region."""
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()
    seen = bytearray(w * h)

    def is_bg(r, g, b, a):
        if a < ALPHA_THRESHOLD:
            return True
        return (r >= 255 - WHITE_TOLERANCE
                and g >= 255 - WHITE_TOLERANCE
                and b >= 255 - WHITE_TOLERANCE)

    queue = deque()
    def seed(x, y):
        if seen[y * w + x]:
            return
        r, g, b, a = px[x, y]
        if is_bg(r, g, b, a):
            seen[y * w + x] = 1
            queue.append((x, y))

    for x in range(w):
        seed(x, 0); seed(x, h - 1)
    for y in range(h):
        seed(0, y); seed(w - 1, y)

    while queue:
        x, y = queue.popleft()
        px[x, y] = (0, 0, 0, 0)
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
                r, g, b, a = px[nx, ny]
                if is_bg(r, g, b, a):
                    seen[ny * w + nx] = 1
                    queue.append((nx, ny))

    # Final sweep: kill any remaining ghosts (drop-shadow remnants that flood-fill couldn't reach,
    # e.g. dark low-alpha pixels trapped between narrow gaps in the design).
    SHADOW_ALPHA_MAX = 35       # alpha at or below this counts as ghost
    LEGITIMATE_BRIGHTNESS = 60  # but if RGB is bright (e.g. anti-aliased fringe of light color), keep
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if 0 < a <= SHADOW_ALPHA_MAX and max(r, g, b) < LEGITIMATE_BRIGHTNESS:
                px[x, y] = (0, 0, 0, 0)
    return im


def crop_to_content(im: Image.Image) -> Image.Image:
    bbox = im.getbbox()
    return im.crop(bbox) if bbox else im


def normalize_to_square(im: Image.Image) -> Image.Image:
    """Upscale (nearest for pixel art, lanczos for smooth) → pad to square → resize to 1024."""
    w, h = im.size
    smaller = min(w, h)

    if smaller < PIXEL_ART_THRESHOLD:
        scale = max(1, (TARGET_SIZE // 2) // smaller)
        im = im.resize((w * scale, h * scale), Image.NEAREST)
        w, h = im.size

    side = max(w, h)
    padded_side = int(side * (1 + 2 * PADDING_PCT))
    canvas = Image.new('RGBA', (padded_side, padded_side), (0, 0, 0, 0))
    canvas.paste(im, ((padded_side - w) // 2, (padded_side - h) // 2), im)

    final = canvas.resize((TARGET_SIZE, TARGET_SIZE), Image.LANCZOS)

    # Alpha-threshold: kill all anti-aliasing fringe — pixel art doesn't need soft edges.
    # Anything <128 alpha disappears; anything >=128 becomes fully opaque.
    fpx = final.load()
    for y in range(TARGET_SIZE):
        for x in range(TARGET_SIZE):
            r, g, b, a = fpx[x, y]
            if a < 128:
                fpx[x, y] = (0, 0, 0, 0)
            elif a < 255:
                fpx[x, y] = (r, g, b, 255)

    # Kill every near-white pixel — Clawd's design has zero legitimate whites,
    # so any white in the output is sticker artwork (headband, reflections, sparkles, etc.)
    # that we treat as background.
    for y in range(TARGET_SIZE):
        for x in range(TARGET_SIZE):
            r, g, b, a = fpx[x, y]
            if a > 0 and r >= 240 and g >= 240 and b >= 240:
                fpx[x, y] = (0, 0, 0, 0)

    return final


def main():
    files = [f for f in sorted(SRC.glob('clawd*.png')) if f.name not in SKIP]
    print(f"Processing {len(files)} stickers → {OUT}\n")
    for src in files:
        im = Image.open(src)
        before = im.size
        cleaned = remove_background(im)
        cropped = crop_to_content(cleaned)
        final = normalize_to_square(cropped)
        out_path = OUT / src.name
        final.save(out_path, 'PNG', optimize=True)
        print(f"  {src.name:28s} {before[0]:4d}x{before[1]:4d} → {final.size[0]}x{final.size[1]}  "
              f"({out_path.stat().st_size // 1024} KB)")


if __name__ == '__main__':
    main()
