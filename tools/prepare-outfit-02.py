"""Extract the supplied Outfit 02 PNG; Pillow only, no generated poses.

Usage: python tools/prepare-outfit-02.py SOURCE.png
The touching shoe/hair boundaries are traced geometrically, not by hue.
"""
import sys
from collections import deque
from pathlib import Path
from PIL import Image

source = Image.open(sys.argv[1]).convert('RGBA')
assert source.size == (1254, 1254)
output = Path(__file__).resolve().parents[1] / 'public/assets/characters/karlx/outfits'
x_ranges = [(95, 345), (370, 620), (635, 880), (900, 1150)]
# Each sloping boundary follows the gap between a shoe and the next head.
contacts = [(190, 209), (485, 506), (734, 753), (990, 1010)]
preparation_scale = 118 / 227

def remove_external_fragments(pose):
    """Remove tiny disconnected fragments outside the principal silhouette bounds."""
    alpha = pose.getchannel('A').tobytes()
    w, h = pose.size
    seen = bytearray(w*h)
    components = []
    for start, a in enumerate(alpha):
        if a <= 9 or seen[start]:
            continue
        queue = deque([start]); seen[start] = 1; pixels = []
        while queue:
            p = queue.popleft(); pixels.append(p)
            x, y = p % w, p // w
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    xx, yy = x+dx, y+dy
                    if 0 <= xx < w and 0 <= yy < h:
                        n = yy*w+xx
                        if not seen[n] and alpha[n] > 9:
                            seen[n] = 1; queue.append(n)
        components.append(pixels)
    principal = max(components, key=len)
    top, bottom = min(p//w for p in principal), max(p//w for p in principal)
    for pixels in components:
        if len(pixels) < 128 and all(p//w < top or p//w > bottom for p in pixels):
            for p in pixels:
                pose.putpixel((p % w, p // w), (0, 0, 0, 0))

for row, direction in enumerate(('front', 'left', 'right', 'back')):
    sheet = Image.new('RGBA', (512, 256))
    for col, (x0, x1) in enumerate(x_ranges):
        pose = Image.new('RGBA', (x1-x0, 1254))
        start, end = contacts[col]
        for x in range(x0, x1):
            boundary = round(624 - 4 * max(0, min(1, (x-start)/(end-start))))
            limits = (0, 314, boundary, 930, 1254)
            for y in range(limits[row], limits[row+1]):
                pixel = source.getpixel((x, y))
                # Only nearly invisible alpha noise is removed, irrespective of RGB.
                if pixel[3] > 9:
                    pose.putpixel((x-x0, y), pixel)
        remove_external_fragments(pose)
        bounds = pose.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox()
        pose = pose.crop(bounds)
        size = tuple(round(v * preparation_scale) for v in pose.size)
        assert size[0] <= 128 and size[1] <= 244, (direction, col, size)
        pose = pose.resize(size, Image.Resampling.LANCZOS)
        sheet.alpha_composite(pose, (col*128+64-size[0]//2, 250-size[1]))
    sheet.save(output / f'outfit-02-{direction}-walk.png')
