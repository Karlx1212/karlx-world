// Playable geometry only: provisional colors, no final art or interactions.
const fountain = {
  kind: 'fountain', layer: 'ground', x: 700, y: 520, depth: 580,
  width: 240, height: 120, color: '#d8b8c9',
  water: { width: 190, height: 84, color: '#9bd7d8' },
};
export const worldMap = {
  id: 'central-plaza',
  dimensions: { width: 1400, height: 960 },
  spawn: { x: 700, y: 640 },
  walkableBounds: { minX: 42, maxX: 1358, minY: 330, maxY: 915 },
  // One conservative rectangle covers water and rim. No leftover obstacles.
  obstacles: [{ x: fountain.x-fountain.width/2, y: fountain.y-fountain.height/2,
    w: fountain.width, h: fountain.height }],
  // Ground objects precede the character; future raised parts may use depth.
  objects: [fountain],
  terrain: {
    color: '#a5c2aa',
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
