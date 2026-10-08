"""Extract Outfit 04 from the original RGBA sheet using Pillow.

Usage: python tools/prepare-outfit-04.py SOURCE.png
Trace the transparent gaps between figures that cross nominal grid boundaries.
No colors are filtered, no poses are generated, and the source is never changed.
"""
import sys
from collections import deque
from pathlib import Path
from PIL import Image

source = Image.open(sys.argv[1]).convert('RGBA')
assert source.size == (1254, 1254)
output = Path(__file__).resolve().parents[1] / 'public/assets/characters/karlx/outfits'
x_ranges = [(115, 390), (400, 625), (635, 890), (895, 1145)]
poses = []

def boundary_at(x, lo, hi, center):
    # In these narrowly inspected contact bands only, the lower figure starts
    # with its reddish hair and the upper figure ends with a sneaker.
    # This locates a separation edge; it never removes colors from a figure.
    for y in range(lo, hi):
        r, g, b, a = source.getpixel((x, y))
        if a > 16 and r > 35 and r > g*1.35 and r > b*1.3:
            return y
    return min(range(lo, hi), key=lambda y: (source.getpixel((x, y))[3], abs(y-center)))

def clean_external_fragments(pose):
    w, h = pose.size
    alpha = pose.getchannel('A').tobytes(); seen = bytearray(w*h); components = []
    for start, a in enumerate(alpha):
        if a <= 16 or seen[start]:
            continue
        queue = deque([start]); seen[start] = 1; pixels = []
        while queue:
            p = queue.popleft(); pixels.append(p); x, y = p % w, p // w
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    xx, yy = x+dx, y+dy
                    if 0 <= xx < w and 0 <= yy < h:
                        n = yy*w+xx
                        if not seen[n] and alpha[n] > 16:
                            seen[n] = 1; queue.append(n)
        components.append(pixels)
    principal = max(components, key=len)
    top, bottom = min(p//w for p in principal), max(p//w for p in principal)
    # Keep the original soft edge within two pixels; remove remnants from the
    # adjacent row outside this vertical envelope, including nearly-zero alpha.
    for y in range(h):
        if y < top-2 or y > bottom+2:
            for x in range(w):
                pose.putpixel((x, y), (0, 0, 0, 0))
    for pixels in components:
        if len(pixels) < 256 and all(p//w < top or p//w > bottom for p in pixels):
            for p in pixels:
                pose.putpixel((p % w, p // w), (0, 0, 0, 0))

for row, direction in enumerate(('front', 'left', 'right', 'back')):
    for col, (x0, x1) in enumerate(x_ranges):
        pose = Image.new('RGBA', (x1-x0, 1254))
        for x in range(x0, x1):
            # The most transparent pixel traces the local gap. At a contact,
            # choose its lowest-alpha boundary rather than cropping a whole row.
            boundaries = [boundary_at(x, lo, hi, center)
                          for lo, hi, center in [(310, 329, 318), (618, 639, 625), (918, 940, 927)]]
            limits = [0, *boundaries, 1254]
            for y in range(limits[row], limits[row+1]):
                pose.putpixel((x-x0, y), source.getpixel((x, y)))
        clean_external_fragments(pose)
        # Use visible bounds, with a two-pixel margin for the original soft edge.
        box = pose.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox()
        box = (max(0, box[0]-2), max(0, box[1]-2), min(pose.width, box[2]+2), min(pose.height, box[3]+2))
        poses.append((direction, col, pose.crop(box)))

max_width = max(p.width for _, _, p in poses)
max_height = max(p.height for _, _, p in poses)
preparation_scale = min(118/max_width, 224/max_height)
print(f'Bounds including edge margin: max {max_width}x{max_height}; preparation {preparation_scale}; render {122/(max_height*preparation_scale)}')
for row, direction in enumerate(('front', 'left', 'right', 'back')):
    sheet = Image.new('RGBA', (512, 256))
    for _, col, pose in poses[row*4:row*4+4]:
        size = tuple(round(v * preparation_scale) for v in pose.size)
        pose = pose.resize(size, Image.Resampling.LANCZOS)
        sheet.alpha_composite(pose, (col*128+64-size[0]//2, 250-size[1]))
        print(direction, col+1, size)
    sheet.save(output / f'outfit-04-{direction}-walk.png')
