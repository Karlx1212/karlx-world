from pathlib import Path
from PIL import Image,ImageDraw
import zipfile,io,json,math
import numpy as np
import sys,hashlib
ZIP=Path(sys.argv[1])
ROOT=Path(__file__).resolve().parents[1]
AUDIT=Path(sys.argv[2]) if len(sys.argv)>2 else None
if AUDIT:AUDIT.mkdir(parents=True,exist_ok=True)
OUT=ROOT/'public/assets/world/pavement/recovered'
OUT.mkdir(parents=True,exist_ok=True)
z=zipfile.ZipFile(ZIP)
read=lambda n:np.array(Image.open(io.BytesIO(z.read(n))).convert('RGBA'))
factor=1.32
W,H=1400,960
plaza=[[550,325],[850,325],[1000,435],[1000,625],[850,735],[550,735],[400,625],[400,435]]
roads=[[[640,270],[760,270],[760,460],[640,460]],[[640,580],[760,580],[760,915],[640,915]],[[42,500],[580,500],[580,620],[42,620]],[[820,500],[1358,500],[1358,620],[820,620]]]
mask=Image.new('L',(W,H));d=ImageDraw.Draw(mask)
for polygon in roads+[plaza]:d.polygon(polygon,fill=255)
union=np.array(mask)>0
pm=Image.new('L',(W,H));ImageDraw.Draw(pm).polygon(plaza,fill=255);pinkMask=np.array(pm)>0
yy,xx=np.indices((H,W));sx=np.floor((xx-400)*factor).astype(int)%384;sy=np.floor((yy-325)*factor).astype(int)%384
pink=read('materials/pink-quilted.png');cream=read('materials/cream-quilted.png')
surface=np.where(pinkMask[:,:,None],pink[sy,sx],cream[sy,sx]);surface[~union]=0
# Literal strips: one common source-pixel/world-unit scale. No piece stretching.
top=read('pieces/horizontal-curb.png')
hp=read('pieces/horizontal-path.png')
vp=read('pieces/vertical-path.png')
vc=read('pieces/vertical-curb.png')
# Each source edge retains its own orientation, including the four diagonal sprites.
sources=[
(top,(0,4),(289,4)),
(read('pieces/northeast-diagonal.png'),(12,5),(190,130)),
(vp[:,142:173],(22,0),(22,109)),
(read('pieces/southeast-diagonal.png'),(190,15),(12,141)),
(hp[100:125],(289,20),(0,20)),
(read('pieces/southwest-diagonal.png'),(180,141),(4,15)),
(vc,(4,30),(4,0)),
(read('pieces/northwest-diagonal.png'),(4,130),(180,5))]
# Path edge sources follow clockwise order (top, right, bottom, left).
pathSources=[sources[0],sources[2],sources[4],(vp[:,:31],(9,109),(9,0))]
best=np.full((H,W),np.inf)
literal=np.zeros((H,W),bool)
for polygon,defs in [(plaza,sources)]+[(road,pathSources) for road in roads]:
 for i,(a,b) in enumerate(zip(polygon,polygon[1:]+polygon[:1])):
  source,sa,sb=defs[i];a=np.array(a,float);b=np.array(b,float)
  tangent=(b-a)/np.linalg.norm(b-a);normal=np.array([-tangent[1],tangent[0]])
  st=(np.array(sb)-sa);length=np.linalg.norm(st);st=st/length;sn=np.array([-st[1],st[0]])
  x0=max(0,int(min(a[0],b[0])-25));x1=min(W,int(max(a[0],b[0])+26))
  y0=max(0,int(min(a[1],b[1])-25));y1=min(H,int(max(a[1],b[1])+26))
  Y,X=np.indices((y1-y0,x1-x0));X=X+x0;Y=Y+y0
  dx=X+.5-a[0];dy=Y+.5-a[1]
  along=dx*tangent[0]+dy*tangent[1];perp=dx*normal[0]+dy*normal[1]
  clipped=np.clip(along,0,np.linalg.norm(b-a))
  bx=a[0]+clipped*tangent[0];by=a[1]+clipped*tangent[1]
  def at(x,y):
   return union[np.clip(np.floor(y).astype(int),0,H-1),np.clip(np.floor(x).astype(int),0,W-1)]
  exposed=at(bx+normal[0]*2,by+normal[1]*2)!=at(bx-normal[0]*2,by-normal[1]*2)
  distance=np.sqrt(perp**2+(along-clipped)**2)
  pos=(along*factor)%max(1,length-1)
  if i in [1,3,5,7] and len(polygon)==8:
   # Preserve the literal end corners. Insert only an interior stone fragment
   # to lengthen the diagonal; never wrap a corner back to the beginning.
   raw=along*factor;extra=max(0,np.linalg.norm(b-a)*factor-length)
   middle=length/2
   pos=np.where(raw<=middle,raw,np.where(raw<middle+extra,middle-extra+(raw-middle),raw-extra))
   pos=np.clip(pos,0,length)
  u=np.rint(sa[0]+pos*st[0]+perp*factor*sn[0]).astype(int)
  v=np.rint(sa[1]+pos*st[1]+perp*factor*sn[1]).astype(int)
  valid=(u>=0)&(u<source.shape[1])&(v>=0)&(v<source.shape[0])&(perp>=-5)&(perp<=22)&exposed&(distance<best[y0:y1,x0:x1])&(along>=-1)&(along<=np.linalg.norm(b-a)+1)
  sampled=source[np.clip(v,0,source.shape[0]-1),np.clip(u,0,source.shape[1]-1)]
  valid &= sampled[:,:,3]>0
  region=surface[y0:y1,x0:x1];region[valid]=sampled[valid];best[y0:y1,x0:x1][valid]=distance[valid];literal[y0:y1,x0:x1][valid]=True
# Retain opaque pavement beneath exclusive literal border pixels.
surface[union,3]=255
Image.fromarray(surface).save(OUT/'ground-C.png')
if AUDIT:mask.save(AUDIT/'coverage-C.png')
if AUDIT:Image.fromarray((literal*255).astype('uint8')).save(AUDIT/'literal-C.png')
if AUDIT:Image.fromarray(((union&~literal)*255).astype('uint8')).save(AUDIT/'reconstructed-C.png')
(OUT/'provenance.json').write_text(json.dumps({'archive':ZIP.name,'archiveSha256':hashlib.sha256(ZIP.read_bytes()).hexdigest(),'sourcePixelsPerWorldUnit':factor,'dimensions':[W,H],'plaza':plaza,'paths':roads,'literalBorderPixels':int(literal.sum()),'reconstructedSurfacePixels':int((union&~literal).sum()),'method':'Original quilted surfaces; exclusive strips sampled from literal transparent pieces with one shared isotropic scale; lengths filled by repeating fragments. No new colors, no independent piece stretching.','limitations':'Reference joints have direction-dependent widths. Junction surfaces are reconstructed from existing quilted materials; literal corner and curb pixels retain source RGB.'},indent=2),encoding='utf-8')
print('Prepared',OUT/'ground-C.png')
