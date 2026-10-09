"""Compare shipped assets and placements with approved external C + C2."""
from pathlib import Path
from PIL import Image
import numpy as np,hashlib,json,sys
root=Path(__file__).resolve().parents[1]
approved=Path(sys.argv[1])
folder=root/'public/assets/world/garden'
hashes={}
for name in ['tree','shrub','rose','lilac','bed','meadow','grass-C2']:
 source=approved/('C2.png' if name=='grass-C2' else f'{name}.png')
 target=folder/f'{name}.png'
 assert source.read_bytes()==target.read_bytes(),f'changed approved resource {name}'
 image=Image.open(target)
 if name=='grass-C2':assert np.all(np.array(image.convert('RGBA'))[:,:,3]==255),'transparent grass holes'
 else:assert np.min(np.array(image.convert('RGBA'))[:,:,3])==0,'missing sprite transparency'
 hashes[name]=hashlib.sha256(target.read_bytes()).hexdigest()
source=(root/'public/js/garden-data.js').read_text(encoding='utf-8-sig')
placements=json.loads(source.split('const placements =',1)[1].split(';',1)[0])
assert placements==json.loads((approved/'layouts.json').read_text())['C2'],'placement drift'
assert len(placements)==26 and sum(o['type']=='tree' for o in placements)==2
tile=np.array(Image.open(folder/'grass-C2.png').convert('RGB').resize((512,512),Image.Resampling.NEAREST)).astype(float)
vertical=float(abs(tile[:,0]-tile[:,-1]).mean());horizontal=float(abs(tile[0]-tile[-1]).mean())
internal_x=float(abs(np.diff(tile,axis=1)).mean());internal_y=float(abs(np.diff(tile,axis=0)).mean())
assert vertical<internal_x*1.3 and horizontal<internal_y*1.3,'tile edge has excessive color discontinuity'
print('PASS garden assets: seven exact approved PNGs, opaque grass, transparent plants, 26 exact placements, two trees; seam deltas within 1.3x internal detail.')
