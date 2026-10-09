from pathlib import Path
from PIL import Image, ImageDraw
import zipfile,io,sys,json,hashlib
import numpy as np
root=Path(__file__).resolve().parents[1]
folder=root/'public/assets/world/pavement/recovered'
archive=Path(sys.argv[1])
info=json.loads((folder/'provenance.json').read_text(encoding='utf-8'))
assert hashlib.sha256(archive.read_bytes()).hexdigest()==info['archiveSha256']
z=zipfile.ZipFile(archive)
names=['materials/pink-quilted.png','materials/cream-quilted.png','pieces/horizontal-curb.png','pieces/horizontal-path.png','pieces/vertical-path.png','pieces/vertical-curb.png']+['pieces/'+side+'-diagonal.png' for side in ['northeast','northwest','southeast','southwest']]
def encode(a):return a[:,0].astype('uint32')*65536+a[:,1].astype('uint32')*256+a[:,2]
palette=[]
for n in names:
 a=np.array(Image.open(io.BytesIO(z.read(n))).convert('RGBA'))
 palette.append(encode(a[a[:,:,3]>0,:3]))
 if 'quilted' in n:
  assert np.array_equal(a[0],a[-1]) and np.array_equal(a[:,0],a[:,-1])
palette=np.unique(np.concatenate(palette))
im=Image.open(folder/'ground-C.png').convert('RGBA');a=np.array(im)
assert im.size==(1400,960)
assert np.all(np.isin(encode(a[a[:,:,3]>0,:3]),palette)),'new RGB color introduced'
mask=Image.new('L',im.size);draw=ImageDraw.Draw(mask)
for points in info['paths']+[info['plaza']]:draw.polygon(points,fill=255)
assert np.all(a[np.array(mask)>0,3]==255),'transparent pavement hole'
assert info['plaza']==[[550,325],[850,325],[1000,435],[1000,625],[850,735],[550,735],[400,625],[400,435]]
print('PASS recovered pavement: approved ZIP hash, source-only RGB, common scale, tile edge continuity, opaque geometry C.')
