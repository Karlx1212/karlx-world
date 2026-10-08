// Exercise the real game modules with a canvas/DOM harness and actual PNG headers.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const storage = new Map();
async function load(reducedMotion = false) {
  const callbacks = {}; let raf; let clock = 1000;
  const draws = [];
  const context2d = new Proxy({}, { get: (_, key) => key === 'createLinearGradient'
    ? () => ({ addColorStop() {} }) : key === 'drawImage' ? (...args) => draws.push(args)
    : ['getImageData','createImageData'].includes(key) ? (...args) => ({ data: new Uint8ClampedArray(args.at(-2)*args.at(-1)*4) }) : () => {} });
  const canvas = { getContext: () => context2d, getBoundingClientRect: () => ({ width: 1160, height: 790 }),
    addEventListener() {}, style: {}, focus() {} };
  const elements = { '#world': canvas, '#hud': {}, '#error': {}, '#back': { addEventListener() {} } };
  const context = vm.createContext({ console, Event, EventTarget,
    document: { querySelector: key => elements[key], addEventListener() {}, createElement: () => ({ getContext: () => context2d }) },
    window: { addEventListener: (type, fn) => { callbacks[type] = fn; } },
    localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) },
    matchMedia: () => ({ matches: reducedMotion }), devicePixelRatio: 1,
    ResizeObserver: class { observe() {} }, requestAnimationFrame: fn => { raf = fn; },
    Image: class { set src(value) {
      this.source = value;
      const bytes = fs.readFileSync(path.join(root, 'public', value));
      this.naturalWidth = bytes.readUInt32BE(16); this.naturalHeight = bytes.readUInt32BE(20);
      queueMicrotask(() => this.onload?.());
    } },
  });
  const cache = new Map();
  async function module(file) {
    if (cache.has(file)) return cache.get(file);
    const m = new vm.SourceTextModule(fs.readFileSync(file, 'utf8'), { context, identifier: file });
    cache.set(file, m);
    await m.link((specifier, parent) => module(path.resolve(path.dirname(parent.identifier), specifier)));
    return m;
  }
  const m = await module(path.join(root, 'public/js/game.js')); await m.evaluate();
  await m.namespace.game.ready;
  return { game: m.namespace.game, select: cache.get(path.join(root, 'public/js/player-state.js')).namespace.selectOutfit,
    pose: cache.get(path.join(root, 'public/js/outfit-04-animation.js')).namespace.getOutfit04Pose,
    draws, tick: () => { clock += 50; raf(clock); }, key: (type, key) => callbacks[type]({ key, preventDefault() {} }) };
}
(async () => {
  const app = await load();
  app.select('outfit-04'); app.game.resume(); app.tick(1000);
  let x = 700, y = 640;
  for (const [key, direction] of [['s','front'], ['a','left'], ['d','right'], ['w','back']]) {
    app.key('keydown', key); app.tick(1050);
    const walking = app.game.playerAppearance;
    assert.equal(walking.pose, 'walk'); assert.equal(walking.usesFallback, false);
    assert.ok(walking.spriteSource.endsWith(`outfit-04-${direction}-walk.png`));
    if (key === 's') y += 10.5;
    if (key === 'w') y -= 10.5;
    if (key === 'a') x -= 10.5;
    if (key === 'd') x += 10.5;
    const draw = app.draws.at(-1), scale = walking.animation.scale;
    assert.ok(Math.abs(draw[5] + 64*scale - x) < 1e-8);
    assert.ok(Math.abs(draw[6] + 250*scale - y) < 1e-8);
    assert.equal(draw[7], 128*scale); assert.equal(draw[8], 256*scale);
    app.key('keyup', key); app.tick(1100);
    assert.equal(app.game.playerAppearance.pose, 'idle');
    assert.equal(app.game.playerAppearance.spriteSource, walking.spriteSource);
  }
  for (const facing of ['down','left','right','up']) {
    const p = { outfit: 'outfit-04', moving: true, facing };
    for (let n=0; n<8; n++) assert.equal(app.pose(p, (n*120+1)/1000, false).frame, n%4);
    assert.equal(app.pose(p, 0.5, true).isIdle, true);
    assert.equal(app.pose(p, 0.5, true).frame, 0);
    p.moving = false; assert.equal(app.pose(p, 1, false).isIdle, true);
    p.outfit = 'outfit-01'; assert.equal(app.pose(p, 1, false), null);
  }
  assert.equal(storage.get('karlx-selected-outfit'), '04');
  const restored = await load(); assert.equal(restored.game.playerOutfit, 'outfit-04');
  for (const [key, name] of [['s','front'], ['a','left'], ['d','right'], ['w','back']]) {
    restored.select('outfit-01'); restored.game.resume(); restored.tick(1000);
    restored.key('keydown', key); restored.tick(1050);
    assert.equal(restored.game.playerAppearance.pose, 'walk');
    assert.ok(restored.game.playerAppearance.spriteSource.includes(`outfit-01-${name}`));
    restored.key('keyup', key); restored.tick(1100);
    assert.equal(restored.game.playerAppearance.pose, 'idle');
  }
  for (const [key, name] of [['s','front'], ['a','left'], ['d','right'], ['w','back']]) {
    restored.select('outfit-02'); restored.game.resume(); restored.tick();
    restored.key('keydown', key); restored.tick();
    assert.equal(restored.game.playerAppearance.pose, 'walk');
    assert.ok(restored.game.playerAppearance.spriteSource.endsWith(`outfit-02-${name}-walk.png`));
    restored.key('keyup', key); restored.tick();
    assert.equal(restored.game.playerAppearance.pose, 'idle');
  }
  for (const [key, name] of [['s','front'], ['a','left'], ['d','right'], ['w','back']]) {
    restored.select('outfit-03'); restored.game.resume(); restored.tick();
    restored.key('keydown', key); restored.tick();
    assert.equal(restored.game.playerAppearance.pose, 'walk');
    assert.ok(restored.game.playerAppearance.spriteSource.endsWith(`outfit-03-${name}-walk.png`));
    restored.key('keyup', key); restored.tick();
    assert.equal(restored.game.playerAppearance.pose, 'idle');
  }
  restored.select('outfit-04'); assert.equal(restored.game.playerAppearance.usesFallback, false);
  assert.equal(restored.game.playerAppearance.pose, 'idle');
  restored.select('outfit-04'); assert.equal(restored.game.playerAppearance.pose, 'idle');
  const reduced = await load(true); reduced.game.resume(); reduced.tick();
  for (const key of ['s','a','d','w']) {
    reduced.key('keydown', key); reduced.tick();
    assert.equal(reduced.game.playerAppearance.pose, 'idle');
    assert.equal(reduced.draws.at(-1)[1], 0);
    reduced.key('keyup', key); reduced.tick();
  }
  console.log('PASS: real game render, four directions and idle, 120ms sequence, reduced-motion poses, Outfits 01, 02 and 03, switching, persistence, PNG loading.');
})().catch(error => { console.error(error); process.exitCode = 1; });
