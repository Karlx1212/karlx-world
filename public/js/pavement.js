let surface;

// The recovered materials are assembled once at native world resolution.
// This ground-only layer keeps the approved map geometry and depth unchanged.
export function preparePavement(worldMap) {
  const image = new Image();
  return new Promise((resolve, reject) => {
    image.onload = () => { surface = image; resolve(); };
    image.onerror = () => reject(new Error('No se pudo cargar el pavimento de la plaza.'));
    image.src = worldMap.terrain.pavement.surface.src;
  });
}
export function drawPavement(ctx) {
  if (!surface) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(surface, 0, 0);
}
