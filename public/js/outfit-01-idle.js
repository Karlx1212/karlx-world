import { frontWalkPreview } from './front-walk-preview.js';
import { leftWalk } from './left-walk.js';
import { rightWalk } from './right-walk.js';
import { backWalk } from './back-walk.js';

// Provisional fixed poses copied by reference, with their original scale/anchor.
// Frame numbers are zero-based; no sprite sheet or walking sequence is changed.
const poses = {
  down: { manifest: frontWalkPreview, frame: 0 },
  left: { manifest: leftWalk, frame: 1 },
  right: { manifest: rightWalk, frame: 1 },
  up: { manifest: backWalk, frame: 1 },
};
export const outfit01IdleReady = Promise.all(Object.values(poses).map(pose => new Promise((resolve, reject) => {
  const image = new Image();
  pose.image = image;
  image.onload = () => {
    const m = pose.manifest;
    if (image.naturalWidth !== m.frameWidth*m.frameCount || image.naturalHeight !== m.frameHeight) {
      reject(new Error('Dimensiones de reposo de KARLX inválidas.')); return;
    }
    pose.loaded = true;
    resolve();
  };
  image.onerror = () => reject(new Error('No se pudo cargar el reposo de KARLX.'));
  image.src = pose.manifest.src;
})));

export function getOutfit01Idle(player) {
  if (player.outfit !== 'outfit-01') return null;
  const pose = poses[player.facing];
  if (!pose?.loaded) return null;
  return { image: pose.image, manifest: pose.manifest, frame: pose.frame, isIdle: true };
}
