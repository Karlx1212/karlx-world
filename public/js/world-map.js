import { fountainAssets } from './fountain-assets.js';
import { plazaObjects, plazaObstacles } from './central-plaza-data.js';
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
  origin: { x: -500, y: -500 },
  dimensions: { width: 2400, height: 1960 },
  spawn: { x: 700, y: 640 },
  // The north margin includes the full avatar above its foot anchor.
  walkableBounds: { minX: -458, maxX: 1858, minY: -350, maxY: 1418 },
  cameraCore: { width: 1400, height: 960 },
  // Reserved only: no shop, access trigger or collision is created.
  reservations: { shop: { x: 1160, y: 690, w: 160, h: 140 } },
  obstacles: [...fountainObstacles, ...plazaObstacles],
  // The platform is ground; each raised piece has its own projected depth.
  objects: [fountain, ...plazaObjects],
  terrain: {
    color: '#a5c2aa',
    pavement: {
      surface: { src: '/assets/world/pavement/recovered/ground-C.png' },
      overlay: { src: '/assets/world/central-plaza/plaza-overlay.png', x: 78, y: 91 },
    },
    grass: { src: '/assets/world/garden/grass-C2.png', tileSize: 512 },
    plaza: { x: 400, y: 325, w: 600, h: 410,
      points: [[550,325],[850,325],[1000,435],[1000,625],[850,735],[550,735],[400,625],[400,435]] },
    paths: [
      { id: 'north', points: [[640,270],[760,270],[760,460],[640,460]], color: '#eee5d9' },
      { id: 'south', points: [[640,580],[760,580],[760,915],[640,915]], color: '#eee5d9' },
      { id: 'west', points: [[42,500],[580,500],[580,620],[42,620]], color: '#eee5d9' },
      { id: 'east', points: [[820,500],[1358,500],[1358,620],[820,620]], color: '#eee5d9' },
    ],
    extensions: [
      { id: 'north', x: 640, y: -260, w: 120, h: 530 },
      { id: 'south', x: 640, y: 915, w: 120, h: 275 },
      { id: 'west', x: -200, y: 500, w: 242, h: 120 },
      { id: 'east', x: 1358, y: 500, w: 232, h: 120 },
    ],
  },
  ambient: { background: '#a5c2aa', shade: [[0,'#7672a31a'],[.7,'#ffffff00'],[1,'#51496d26']] },
};
