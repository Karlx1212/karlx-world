// Lateral sequences are provisional: original poses do not fully alternate legs.
const poses = Object.fromEntries(['down', 'left', 'right', 'up'].map((direction, index) => {
  const name = ['front', 'left', 'right', 'back'][index];
  return [direction, { manifest: Object.freeze({
    src: `/assets/characters/karlx/outfits/outfit-02-${name}-walk.png`,
    frameWidth: 128, frameHeight: 256, frameCount: 4, frameDuration: 120,
    anchorX: 64, anchorY: 250, scale: 122 / (310 * 118 / 227),
  }), idleFrame: 0 }];
}));

export const outfit02Ready = Promise.all(Object.values(poses).map(pose => new Promise((resolve, reject) => {
  const image = new Image();
  pose.image = image;
  image.onload = () => {
    if (image.naturalWidth !== 512 || image.naturalHeight !== 256) {
      reject(new Error('Dimensiones de Outfit 02 inválidas.')); return;
    }
    pose.loaded = true;
    resolve();
  };
  image.onerror = () => reject(new Error('No se pudo cargar Outfit 02.'));
  image.src = pose.manifest.src;
})));

export function getOutfit02Pose(player, walkTime, reducedMotion) {
  if (player.outfit !== 'outfit-02') return null;
  const pose = poses[player.facing];
  if (!pose?.loaded) return null;
  const isIdle = !player.moving || reducedMotion;
  return { image: pose.image, manifest: pose.manifest, isIdle,
    frame: isIdle ? pose.idleFrame : Math.floor(walkTime * 1000 / pose.manifest.frameDuration) % 4 };
}
