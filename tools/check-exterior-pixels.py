"""Check approved ground and initial canvas; only new path regions may differ.
Usage: python tools/check-exterior-pixels.py EDGE_OUTPUT_DIRECTORY
"""
from pathlib import Path
import sys,json
import numpy as np
from PIL import Image

folder=Path(sys.argv[1])
report=json.loads((folder/'report.json').read_text())
def allowed(x,y,margin=0):
    return (((x>=635-margin)&(x<765+margin)&(y>=-260-margin)&(y<270+margin)) |
            ((x>=635-margin)&(x<765+margin)&(y>=915-margin)&(y<1190+margin)) |
            ((y>=495-margin)&(y<625+margin)&(x>=-200-margin)&(x<42+margin)) |
            ((y>=495-margin)&(y<625+margin)&(x>=1358-margin)&(x<1590+margin)))
for mobile in [False,True]:
    tag='mobile' if mobile else 'desktop'
    a=np.array(Image.open(folder/f'{tag}-before-ground.png').convert('RGBA'))
    b=np.array(Image.open(folder/f'{tag}-after-ground.png').convert('RGBA'))
    y,x=np.indices(a.shape[:2]);different=np.any(a!=b,axis=2)
    assert not (different&~allowed(x,y)).any(),'protected ground changed'
    a=np.array(Image.open(folder/f'{tag}-before-canvas.png').convert('RGBA'))
    b=np.array(Image.open(folder/f'{tag}-after-canvas.png').convert('RGBA'))
    assert a.shape==b.shape
    view=next(r['initial'] for r in report if r['mobile']==mobile and r['tag']=='after')
    y,x=np.indices(a.shape[:2]);dpr=a.shape[1]/view['width']
    wx=(x+.5)/dpr/view['scale']+view['x'];wy=(y+.5)/dpr/view['scale']+view['y']
    different=np.any(a!=b,axis=2)
    assert not (different&~allowed(wx,wy,2)).any(),'initial pixels changed outside new paths'
    print('PASS protected pixels',tag,'new visible path pixels:',int(different.sum()))
