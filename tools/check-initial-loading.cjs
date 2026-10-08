const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
async function scenario({ reduced = false, readyAt = 0, failure = false, reduceAt } = {}) {
  let now = 0, next = 0, resolveReady, rejectReady;
  const timers = new Map(), listeners = new Set(), nodes = new Map();
  const motion = { matches: reduced, addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) };
  const schedule = (fn, ms, interval) => { const id = ++next; timers.set(id, { fn, time: now+ms, interval }); return id; };
  const get = id => {
    if (!nodes.has(id)) nodes.set(id, { hidden: !['start','boot'].includes(id), style: { setProperty() {} },
      classList: { add() {}, remove() {} }, addEventListener() {}, setAttribute() {}, focus() {},
      querySelector: () => ({ textContent: '' }), animate: () => {
        let done; const finished = new Promise(r => { done = r; });
        const id = schedule(done, 350);
        return { finished, finish() { timers.delete(id); done(); }, cancel() { timers.delete(id); } };
      } });
    return nodes.get(id);
  };
  const ready = new Promise((resolve, reject) => { resolveReady=resolve; rejectReady=reject; });
  const outfit = { id: '01', idle: '', presentation: { width: 1, height: 1, bounds: [0,0,1,1] } };
  const context = vm.createContext({ document: { getElementById: get, addEventListener() {} }, matchMedia: () => motion,
    setTimeout: (fn, ms) => schedule(fn, ms), clearTimeout: id => timers.delete(id),
    setInterval: (fn, ms) => schedule(fn, ms, ms), clearInterval: id => timers.delete(id),
    requestAnimationFrame: fn => schedule(fn, 16), cancelAnimationFrame: id => timers.delete(id), location: { reload() {} } });
  const exportsByName = {
    './game.js': { game: { ready, events: { addEventListener() {} } } },
    './audio.js': { audio: { preferences: {}, addEventListener() {} } },
    './outfits.js': { outfits: [outfit] }, './player-state.js': { playerState: { outfit }, selectOutfit() {} },
  };
  const module = new vm.SourceTextModule(fs.readFileSync('public/js/intro.js','utf8'), { context });
  await module.link(name => { const values=exportsByName[name]; return new vm.SyntheticModule(Object.keys(values), function() {
    for (const [key,value] of Object.entries(values)) this.setExport(key,value);
  }, { context }); });
  await module.evaluate();
  schedule(() => failure ? rejectReady(new Error('failed')) : resolveReady(), readyAt);
  if (reduceAt !== undefined) schedule(() => { motion.matches=true; for (const fn of [...listeners]) fn(); }, reduceAt);
  const states=[];
  for (let step=0; step<500 && timers.size; step++) {
    const [id,t] = [...timers.entries()].sort((a,b)=>a[1].time-b[1].time)[0];
    now=t.time; timers.delete(id); if(t.interval) timers.set(id,{...t,time:now+t.interval}); t.fn();
    for(let i=0;i<10;i++) await Promise.resolve();
    states.push({ now, boot: !get('boot').hidden, welcome: !get('welcome').hidden, connection: !get('connection').hidden });
    if (!get('boot').hidden && failure && !get('retry').hidden) break;
  }
  assert.ok(states.every(s => s.boot || s.welcome), 'no empty intermediate screen');
  assert.ok(states.every(s => !s.connection), 'no connection screen before welcome');
  assert.equal(listeners.size, 0, 'motion listeners cleaned');
  if (failure) { assert.equal(get('welcome').hidden,true); assert.equal(get('retry').hidden,false); }
  else {
    assert.equal(get('boot').hidden,true); assert.equal(get('welcome').hidden,false);
    const welcomeAt=states.find(s=>s.welcome).now;
    if(reduced) assert.ok(welcomeAt<=32);
    else if(reduceAt !== undefined) assert.ok(welcomeAt<=reduceAt);
    else assert.ok(welcomeAt>=Math.max(3032,readyAt));
  }
  assert.equal(timers.size,0,'no accumulated timers');
}
(async()=>{
  await scenario(); await scenario({readyAt:5000}); await scenario({reduced:true});
  await scenario({reduceAt:500}); await scenario({reduceAt:3100});
  await scenario({failure:true});
  console.log('PASS: fast/slow load, reduced motion and live changes, errors, direct welcome, no empty screens or leftover timers.');
})().catch(e=>{console.error(e);process.exitCode=1;});
