// Approved C vegetation and C2 grass share the map's world coordinates.
const images = new Map();
let grass;
let sectors = [];

function load(src) {
  if (!images.has(src)) {
    const image = new Image();
    const ready = new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`No se pudo cargar el jardín: ${src}`));
    });
    images.set(src, { image, ready });
    image.src = src;
  }
  return images.get(src).ready;
}

export async function prepareGarden(map) {
  const source = await load(map.terrain.grass.src);
  await Promise.all(map.objects.filter(o => o.kind === 'garden').map(o => load(o.src)));
  // Match the approved preview's fixed 512-world-unit texture sampling.
  // Both the tile and whole ground are prepared once, never per frame.
  const tile = document.createElement('canvas');
  tile.width = tile.height = map.terrain.grass.tileSize;
  const tileContext = tile.getContext('2d');
  tileContext.imageSmoothingEnabled = false;
  tileContext.drawImage(source, 0, 0, tile.width, tile.height);
  grass = document.createElement('canvas');
  // Keep the original cached core and its sampling exactly as approved.
  grass.width = 1400;
  grass.height = 960;
  const context = grass.getContext('2d');
  context.imageSmoothingEnabled = false;
  context.fillStyle = context.createPattern(tile, 'repeat');
  context.fillRect(0, 0, grass.width, grass.height);
  sectors = [];
  const origin = map.origin ?? { x: 0, y: 0 };
  const right = origin.x+map.dimensions.width, bottom = origin.y+map.dimensions.height;
  // Nonoverlapping exterior strips; all patterns stay anchored to world (0,0).
  const regions = [
    [origin.x,origin.y,right-origin.x,-origin.y],
    [origin.x,960,right-origin.x,bottom-960],
    [origin.x,0,-origin.x,960], [1400,0,right-1400,960],
  ];
  for (const [rx,ry,rw,rh] of regions) for (let y=ry;y<ry+rh;y+=512) for (let x=rx;x<rx+rw;x+=512) {
    const image=document.createElement('canvas');
    image.width=Math.min(512,rx+rw-x); image.height=Math.min(512,ry+rh-y);
    if (image.width<=0 || image.height<=0) continue;
    const c=image.getContext('2d');c.imageSmoothingEnabled=false;
    c.translate(-x,-y);c.fillStyle=c.createPattern(tile,'repeat');c.fillRect(x,y,image.width,image.height);
    sectors.push({x,y,image});
  }
}

export function drawGrass(ctx, visible) {
  if (!grass) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(grass, 0, 0);
  for (const {x,y,image} of sectors) {
    if (visible && (x>visible.x+visible.w || x+image.width<visible.x || y>visible.y+visible.h || y+image.height<visible.y)) continue;
    ctx.drawImage(image,x,y);
  }
}

export function drawGardenObject(ctx, object) {
  const image = images.get(object.src)?.image;
  if (!image?.complete || !image.naturalWidth) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, object.x-object.w/2, object.y-object.h, object.w, object.h);
}
