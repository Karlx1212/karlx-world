"""Package approved layers without resampling or repainting any source pixels.

Usage: python tools/prepare-magical-fountain.py APPROVED_ZIP
"""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import zipfile, io, json, sys, hashlib

root=Path(__file__).resolve().parents[1]
archive=Path(sys.argv[1]);z=zipfile.ZipFile(archive)
assert 'LEEME.md' in z.namelist()
def read(name):
    im=Image.open(io.BytesIO(z.read(name))).convert('RGBA')
    assert im.size==(576,400),name
    return np.array(im)
static=read('architecture-static.png')
water=[read(f'water-frames/water-{i:02}.png') for i in range(1,33)]
master=read('master-frame-01.png')
mask=np.array(Image.open(io.BytesIO(z.read('water-mask.png'))))>0
original=read('water-original.png');restored=static.copy();restored[mask]=original[mask]
assert np.array_equal(restored,master)
assert all(np.array_equal(a[~mask],np.zeros_like(a[~mask])) for a in water)
# Exclusive masks: each source pixel belongs to one depth piece, never two.
# Depth is the projected foot of each raised piece, not the image bottom.
parts=[
 ('rear-garden',156,[(170,75),(404,75),(382,150),(348,146),(328,105),(252,105),(221,146),(184,150)]),
 ('rear-left',156,[(145,72),(193,72),(193,156),(140,156)]),
 ('rear-right',156,[(382,72),(436,72),(439,156),(382,156)]),
 ('west-garden',253,[(55,143),(143,143),(143,253),(55,253)]),
 ('east-garden',253,[(430,143),(525,143),(525,253),(430,253)]),
 ('central',244,[(253,24),(324,24),(324,82),(349,87),(364,179),(341,218),(311,247),(265,247),(229,218),(211,180),(224,83),(253,79)]),
 ('front-left',304,[(127,207),(196,207),(196,304),(127,304)]),
 ('front-right',304,[(381,207),(451,207),(451,304),(381,304)]),
 ('front-left-flowers',344,[(165,270),(232,270),(232,344),(165,344)]),
 ('front-right-flowers',344,[(346,270),(413,270),(413,344),(346,344)]),
]
labels=np.zeros((400,576),dtype=np.uint8)
for i,(_,_,points) in enumerate(parts,1):
    m=Image.new('L',(576,400));ImageDraw.Draw(m).polygon(points,fill=255)
    labels[np.array(m)>0]=i
definitions=[('base',None,None)]+parts
dest=root/'public/assets/world/magical-fountain';dest.mkdir(parents=True,exist_ok=True)
manifest={'width':576,'height':400,'anchorX':288,'anchorY':388,'originX':288,'originY':244,'frameCount':32,'frameMs':60,'columns':4,'parts':[]}
recomposed=[np.zeros_like(static) for _ in water]
for i,(name,depth,_) in enumerate(definitions):
    selected=labels==i
    opaque=(static[:,:,3]>0)|np.any(np.stack([a[:,:,3]>0 for a in water]),axis=0)
    yy,xx=np.nonzero(selected&opaque)
    if not len(xx):continue
    x0,y0,x1,y1=int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)
    piece=static.copy();piece[~selected]=0
    Image.fromarray(piece[y0:y1,x0:x1]).save(dest/f'{name}-static.png')
    pw,ph=x1-x0,y1-y0
    animated=any(np.any(a[selected,3]>0) for a in water)
    if animated:
        atlas=Image.new('RGBA',(pw*4,ph*8))
        for frame,a in enumerate(water):
            chunk=a.copy();chunk[~selected]=0
            atlas.paste(Image.fromarray(chunk[y0:y1,x0:x1]),((frame%4)*pw,(frame//4)*ph))
        atlas.save(dest/f'{name}-water.png')
    manifest['parts'].append({'id':name,'x':x0,'y':y0,'width':pw,'height':ph,'depth':depth,'static':f'/assets/world/magical-fountain/{name}-static.png','water':f'/assets/world/magical-fountain/{name}-water.png' if animated else None})
    for frame,a in enumerate(water):
        recomposed[frame][selected]=static[selected]
        recomposed[frame][selected&mask]=a[selected&mask]
for frame,a in enumerate(water):
    expected=static.copy();expected[mask]=a[mask]
    assert np.array_equal(recomposed[frame],expected),'partition changed source pixels'
    assert np.array_equal(expected[~mask],master[~mask])
(root/'public/js/fountain-assets.js').write_text('// Generated losslessly by tools/prepare-magical-fountain.py from the approved ZIP.\nexport const fountainAssets = '+json.dumps(manifest,indent=2)+';\n',encoding='utf-8')
(dest/'SOURCE.md').write_text('# Fuente Mágica\n\nSource: approved fuente-magica-CAPAS-PARA-APROBACION.zip.\nSHA-256: '+hashlib.sha256(archive.read_bytes()).hexdigest()+'\n\nStatic and water layers partitioned into exclusive depth pieces, cropped without resampling or repainting. Water atlases: 4 columns × 8 rows, 32 frames at 60 ms (1920 ms). Reassembly of all 32 frames verified pixel-for-pixel. No GIF, masks or preview assets shipped to the game.\n',encoding='utf-8')
print('PASS: approved layers reassemble exactly; 32 invariant architectural frames;',len(manifest['parts']),'exclusive depth pieces')
