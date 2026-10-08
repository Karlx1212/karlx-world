"""Check shipped cropped PNGs/atlases against every approved ZIP composition."""
from pathlib import Path
from PIL import Image
import numpy as np
import zipfile, io, json, sys

root=Path(__file__).resolve().parents[1]
z=zipfile.ZipFile(sys.argv[1])
source=(root/'public/js/fountain-assets.js').read_text(encoding='utf-8')
m=json.loads(source.split('export const fountainAssets = ',1)[1].rstrip().removesuffix(';'))
def local(src):return np.array(Image.open(root/'public'/src.lstrip('/')).convert('RGBA'))
mask=np.array(Image.open(io.BytesIO(z.read('water-mask.png'))))>0
master=np.array(Image.open(io.BytesIO(z.read('master-frame-01.png'))).convert('RGBA'))
images={p['id']:(local(p['static']),local(p['water']) if p['water'] else None) for p in m['parts']}
for frame in range(32):
    result=np.zeros_like(master);coverage=np.zeros((400,576),dtype=np.uint8)
    for p in m['parts']:
        static,atlas=images[p['id']];h,w=p['height'],p['width'];chunk=static.copy()
        assert chunk.shape==(h,w,4)
        if atlas is not None:
            assert atlas.shape==(h*8,w*4,4)
            dy,dx=(frame//4)*h,(frame%4)*w
            water=atlas[dy:dy+h,dx:dx+w];wet=water[:,:,3]>0;chunk[wet]=water[wet]
        y,x=p['y'],p['x'];visible=chunk[:,:,3]>0
        dest=result[y:y+h,x:x+w];dest[visible]=chunk[visible]
        coverage[y:y+h,x:x+w]+=visible.astype('uint8')
    assert coverage.max()==1,'overlapping depth pieces'
    expected=np.array(Image.open(io.BytesIO(z.read(f'composites/frame-{frame+1:02}.png'))).convert('RGBA'))
    assert np.array_equal(result,expected),f'changed approved frame {frame+1}'
    assert np.array_equal(result[~mask],master[~mask]),'architecture changed'
print('PASS: all shipped PNGs reconstruct 32 approved frames exactly; exclusive depth pieces; invariant architecture.')
