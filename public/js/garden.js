// Approved C vegetation and C2 grass share the map's world coordinates.
const images = new Map();
let grass;

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
  grass.width = map.dimensions.width;
  grass.height = map.dimensions.height;
  const context = grass.getContext('2d');
  context.imageSmoothingEnabled = false;
  context.fillStyle = context.createPattern(tile, 'repeat');
  context.fillRect(0, 0, grass.width, grass.height);
}

export function drawGrass(ctx) {
  if (!grass) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(grass, 0, 0);
}

export function drawGardenObject(ctx, object) {
  const image = images.get(object.src)?.image;
  if (!image?.complete || !image.naturalWidth) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, object.x-object.w/2, object.y-object.h, object.w, object.h);
}
