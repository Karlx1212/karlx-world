export const rightWalk = Object.freeze({
  src: '/assets/characters/karlx/outfits/outfit-01-right-walk.png',
  frameWidth: 128, frameHeight: 256, frameCount: 4, frameDuration: 120,
  anchorX: 64, anchorY: 250, scale: 122 / 204,
});
const image = new Image();
let loaded = false;
image.onload = () => { loaded = image.naturalWidth === 512 && image.naturalHeight === 256; };
image.onerror = () => { loaded = false; };
image.src = rightWalk.src;

export function getRightWalk(player, walkTime, reducedMotion) {
  if (!loaded || reducedMotion || player.outfit !== 'outfit-01' || !player.moving || player.facing !== 'right') return null;
  return { image, manifest: rightWalk, frame: Math.floor(walkTime * 1000 / rightWalk.frameDuration) % rightWalk.frameCount };
}
