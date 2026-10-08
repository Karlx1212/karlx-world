// Provisional visual test: original pose order 1–6, 8; damaged pose 7 omitted.
export const frontWalkPreview = Object.freeze({
  src: '/assets/characters/karlx/outfits/outfit-01-front-walk-preview.png',
  frameWidth: 128, frameHeight: 256, frameCount: 7, frameDuration: 100,
  anchorX: 64, anchorY: 250, scale: 122 / 224, provisional: true,
});
const image = new Image();
let loaded = false;
image.onload = () => { loaded = image.naturalWidth === 896 && image.naturalHeight === 256; };
// A missing preview must never block the intro or the original player sprite.
image.onerror = () => { loaded = false; };
image.src = frontWalkPreview.src;

export function getFrontWalkPreview(player, walkTime, reducedMotion) {
  if (!loaded || reducedMotion || player.outfit !== 'outfit-01' || !player.moving || player.facing !== 'down') return null;
  return { image, manifest: frontWalkPreview, frame: Math.floor(walkTime * 1000 / frontWalkPreview.frameDuration) % frontWalkPreview.frameCount };
}
