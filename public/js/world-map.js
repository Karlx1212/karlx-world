import { fountainAssets } from './fountain-assets.js';
// Surface art is independent of playable geometry and fountain depth pieces.
const fountain = {
  kind: 'fountain', layer: 'layered', x: 700, y: 520,
  scale: .58, assets: fountainAssets,
  // Projected ground footprint of the broad platform, not the elevated crystal.
  footprint: { rx: 137, ry: 84 },
};
// Conservative horizontal bands follow the platform without blocking corners
// of its bounding rectangle. The existing foot-rectangle collision engine stays.
const fountainObstacles = Array.from({ length: 12 }, (_, i) => {
  const { rx, ry } = fountain.footprint, height = ry*2/12;
  const top = -ry+i*height, bottom = top+height;
  const nearest = Math.min(Math.abs(top), Math.abs(bottom));
  const halfWidth = rx*Math.sqrt(1-(nearest/ry)**2);
  return { x: fountain.x-halfWidth, y: fountain.y+top, w: halfWidth*2, h: height };
});
export const worldMap = {
  id: 'central-plaza',
  dimensions: { width: 1400, height: 960 },
  spawn: { x: 700, y: 640 },
  walkableBounds: { minX: 42, maxX: 1358, minY: 330, maxY: 915 },
  obstacles: fountainObstacles,
  // The platform is ground; each raised piece has its own projected depth.
  objects: [fountain],
  terrain: {
    color: '#a5c2aa',
    pavement: {
      plaza: { src: '/assets/world/pavement/pearl-pink.png', tint: '#a967b04d' },
      paths: { src: '/assets/world/pavement/cream-stone.png', tint: '#fff5d966' },
      borderWidth: 8,
      ornament: { src: '/assets/world/pavement/pearl-star.svg', width: 24, height: 16,
        positions: [{ x: 700, y: 375 }, { x: 485, y: 560 }, { x: 915, y: 560 }, { x: 700, y: 690 }] },
    },
    texture: { count: 430, xStep: 137, yStep: 79, w: 3, h: 2, colors: ['#bdd0ad', '#96b69d'] },
    plaza: { x: 400, y: 350, w: 600, h: 450, color: '#ded7e2' },
    paths: [
      { id: 'north', points: [[640,330],[760,330],[760,460],[640,460]], color: '#eee5d9' },
      { id: 'south', points: [[640,580],[760,580],[760,915],[640,915]], color: '#eee5d9' },
      { id: 'west', points: [[42,500],[580,500],[580,620],[42,620]], color: '#eee5d9' },
      { id: 'east', points: [[820,500],[1358,500],[1358,620],[820,620]], color: '#eee5d9' },
    ],
    // Filled ellipse is the continuous walkable apron around the basin.
    promenade: { x: 700, y: 520, rx: 190, ry: 130, color: '#eee5d9' },
  },
  ambient: { background: '#a5c2aa', shade: [[0,'#7672a31a'],[.7,'#ffffff00'],[1,'#51496d26']] },
};
