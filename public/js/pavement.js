let surface;
let extensions = [];
let plazaOverlay;
let overlayOrigin;

// The recovered materials are assembled once at native world resolution.
// This ground-only layer keeps the approved map geometry and depth unchanged.
function prepareBasePavement(worldMap) {
  const image = new Image();
  return new Promise((resolve, reject) => {
    image.onload = () => {
      surface = image;
      // Reuse native approved straight-path pixels, including their side curbs.
      // Mirrored strips join with identical edge pixels; no independent scaling.
      extensions = (worldMap.terrain.extensions ?? []).map(road => {
        const vertical = road.w===120, length=vertical?road.h:road.w;
        const layer=document.createElement('canvas');
        layer.width=vertical?130:length;layer.height=vertical?length:130;
        const c=layer.getContext('2d');c.imageSmoothingEnabled=false;
        for(let offset=0,index=0;offset<length;offset+=120,index++) {
          c.save();
          if(vertical){c.translate(0,offset+(index%2?120:0));c.scale(1,index%2?-1:1);c.drawImage(image,635,765,130,120,0,0,130,120);}
          else {c.translate(offset+(index%2?120:0),0);c.scale(index%2?-1:1,1);c.drawImage(image,100,495,120,130,0,0,120,130);}
          c.restore();
        }
        return { image:layer, x:road.x-(vertical?5:0), y:road.y-(vertical?0:5) };
      });
      resolve();
    };
    image.onerror = () => reject(new Error('No se pudo cargar el pavimento de la plaza.'));
    image.src = worldMap.terrain.pavement.surface.src;
  });
}
export function drawPavement(ctx) {
  if (!surface) return;
  ctx.imageSmoothingEnabled = false;
  for (const {image,x,y} of extensions) ctx.drawImage(image,x,y);
  ctx.drawImage(surface, 0, 0);
  if (plazaOverlay) ctx.drawImage(plazaOverlay, overlayOrigin.x, overlayOrigin.y);
}

// Load through the existing ready/error flow; no independent timers or animation.
export async function preparePavement(worldMap) {
  const overlay = worldMap.terrain.pavement.overlay;
  await Promise.all([prepareBasePavement(worldMap), overlay ? new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => { plazaOverlay = image; overlayOrigin = overlay; resolve(); };
    image.onerror = () => reject(new Error('No se pudo cargar el terreno de la plaza.'));
    image.src = overlay.src;
  }) : Promise.resolve()]);
}
