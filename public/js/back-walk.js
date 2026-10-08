export const backWalk = Object.freeze({
  src: '/assets/characters/karlx/outfits/outfit-01-back-walk.png',
  frameWidth: 128, frameHeight: 256, frameCount: 4, frameDuration: 120,
  anchorX: 64, anchorY: 250, scale: 122 / 224,
});
const image = new Image();
let loaded = false;
image.onload = () => { loaded = image.naturalWidth === 512 && image.naturalHeight === 256; };
image.onerror = () => { loaded = false; };
image.src = backWalk.src;

export function getBackWalk(player, walkTime, reducedMotion) {
  if (!loaded || reducedMotion || player.outfit !== 'outfit-01' || !player.moving || player.facing !== 'up') return null;
  return { image, manifest: backWalk, frame: Math.floor(walkTime * 1000 / backWalk.frameDuration) % backWalk.frameCount };
}
