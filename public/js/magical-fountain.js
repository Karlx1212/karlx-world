import { fountainAssets } from './fountain-assets.js';

const images = new Map();
let ready = false;
function load(src) {
  const image = new Image(); images.set(src, image);
  return new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error('No se pudo cargar la Fuente Mágica. Recargá para volver a intentarlo.'));
    image.src = src;
  });
}
export const fountainReady = Promise.all(fountainAssets.parts.flatMap(p =>
  [load(p.static), ...(p.water ? [load(p.water)] : [])]
)).then(() => { ready = true; });

export function fountainFrame(time, reducedMotion) {
  return reducedMotion ? 0 : Math.floor(time/fountainAssets.frameMs)%fountainAssets.frameCount;
}
function drawPart(ctx, object, part, time, reducedMotion) {
  if (!ready) return;
  const m = object.assets, s = object.scale;
  const x = object.x+(part.x-m.originX)*s;
  const y = object.y+(part.y-m.originY)*s;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(images.get(part.static), x, y, part.width*s, part.height*s);
  if (part.water) {
    const frame = fountainFrame(time, reducedMotion);
    ctx.drawImage(images.get(part.water), (frame%m.columns)*part.width,
      Math.floor(frame/m.columns)*part.height, part.width, part.height,
      x, y, part.width*s, part.height*s);
  }
}
export function drawFountainGround(ctx, object, time, reducedMotion) {
  for (const part of object.assets.parts.filter(p => p.depth === null))
    drawPart(ctx, object, part, time, reducedMotion);
}
export function fountainDepthObjects(ctx, object, time, reducedMotion) {
  return object.assets.parts.filter(p => p.depth !== null).map(part => ({
    y: object.y+(part.depth-object.assets.originY)*object.scale,
    draw: () => drawPart(ctx, object, part, time, reducedMotion),
  }));
}
