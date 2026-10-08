export const leftWalk = Object.freeze({
  src: '/assets/characters/karlx/outfits/outfit-01-left-walk.png',
  frameWidth: 128, frameHeight: 256, frameCount: 4, frameDuration: 120,
  anchorX: 64, anchorY: 250, scale: 122 / 224,
});
const image = new Image();
let loaded = false;
image.onload = () => { loaded = image.naturalWidth === 512 && image.naturalHeight === 256; };
image.onerror = () => { loaded = false; };
image.src = leftWalk.src;

export function getLeftWalk(player, walkTime, reducedMotion) {
  if (!loaded || reducedMotion || player.outfit !== 'outfit-01' || !player.moving || player.facing !== 'left') return null;
  return { image, manifest: leftWalk, frame: Math.floor(walkTime * 1000 / leftWalk.frameDuration) % leftWalk.frameCount };
}
