// Literal approved C2-preview placements; two trees, no additional plants.
const placements =[
  {
    "type": "tree",
    "x": 210,
    "y": 455,
    "w": 143.4295415959253,
    "h": 165
  },
  {
    "type": "tree",
    "x": 1110,
    "y": 450,
    "w": 152.12224108658742,
    "h": 175
  },
  {
    "type": "shrub",
    "x": 440,
    "y": 365,
    "w": 58,
    "h": 46.168514412416854
  },
  {
    "type": "shrub",
    "x": 970,
    "y": 375,
    "w": 58,
    "h": 46.168514412416854
  },
  {
    "type": "shrub",
    "x": 340,
    "y": 690,
    "w": 58,
    "h": 46.168514412416854
  },
  {
    "type": "shrub",
    "x": 1040,
    "y": 695,
    "w": 58,
    "h": 46.168514412416854
  },
  {
    "type": "rose",
    "x": 345,
    "y": 455,
    "w": 66,
    "h": 36.25157232704402
  },
  {
    "type": "rose",
    "x": 1060,
    "y": 465,
    "w": 66,
    "h": 36.25157232704402
  },
  {
    "type": "rose",
    "x": 480,
    "y": 785,
    "w": 66,
    "h": 36.25157232704402
  },
  {
    "type": "rose",
    "x": 950,
    "y": 775,
    "w": 66,
    "h": 36.25157232704402
  },
  {
    "type": "bed",
    "x": 585,
    "y": 785,
    "w": 84,
    "h": 42.68852459016394
  },
  {
    "type": "bed",
    "x": 815,
    "y": 785,
    "w": 84,
    "h": 42.68852459016394
  },
  {
    "type": "lilac",
    "x": 560,
    "y": 295,
    "w": 36,
    "h": 30.58252427184466
  },
  {
    "type": "lilac",
    "x": 860,
    "y": 310,
    "w": 36,
    "h": 30.58252427184466
  },
  {
    "type": "lilac",
    "x": 350,
    "y": 755,
    "w": 36,
    "h": 30.58252427184466
  },
  {
    "type": "lilac",
    "x": 1050,
    "y": 760,
    "w": 36,
    "h": 30.58252427184466
  },
  {
    "type": "lilac",
    "x": 580,
    "y": 815,
    "w": 36,
    "h": 30.58252427184466
  },
  {
    "type": "lilac",
    "x": 855,
    "y": 820,
    "w": 36,
    "h": 30.58252427184466
  },
  {
    "type": "meadow",
    "x": 260,
    "y": 330,
    "w": 26,
    "h": 15.831111111111111
  },
  {
    "type": "meadow",
    "x": 1020,
    "y": 300,
    "w": 26,
    "h": 15.831111111111111
  },
  {
    "type": "meadow",
    "x": 280,
    "y": 700,
    "w": 26,
    "h": 15.831111111111111
  },
  {
    "type": "meadow",
    "x": 425,
    "y": 810,
    "w": 26,
    "h": 15.831111111111111
  },
  {
    "type": "meadow",
    "x": 585,
    "y": 760,
    "w": 26,
    "h": 15.831111111111111
  },
  {
    "type": "meadow",
    "x": 615,
    "y": 805,
    "w": 26,
    "h": 15.831111111111111
  },
  {
    "type": "meadow",
    "x": 350,
    "y": 840,
    "w": 26,
    "h": 15.831111111111111
  },
  {
    "type": "meadow",
    "x": 460,
    "y": 310,
    "w": 26,
    "h": 15.831111111111111
  }
];
export const gardenObjects = placements.map((p, index) => ({
  ...p, id: `garden-${index + 1}`, kind: 'garden',
  src: `/assets/world/garden/${p.type}.png`,
  layer: p.type === 'tree' ? 'depth' : 'ground', depth: p.y,
}));
// Small solid footprints only. Low shrubs and flowers remain walkable.
export const gardenObstacles = gardenObjects.flatMap(o => {
  if (o.type === 'tree') return [{ x: o.x-6, y: o.y-14, w: 12, h: 12 }];
  if (o.type === 'bed') return [{ x: o.x-30, y: o.y-12, w: 60, h: 10 }];
  return [];
});
