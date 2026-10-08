const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
async function scenario({ reduced = false, readyAt = 0, failure = false, reduceAt, outfitIndex = 0 } = {}) {
  let now = 0, next = 0, resolveReady, rejectReady;
  const timers = new Map(), listeners = new Set(), nodes = new Map();
  let revealCount = 0, resumeCount = 0, revealAt; const handlers = new Map(); const bubbles = [{}, {}, {}, {}];
  const motion = { matches: reduced, addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) };
  const schedule = (fn, ms, interval) => { const id = ++next; timers.set(id, { fn, time: now+ms, interval }); return id; };
  const get = id => {
    if (!nodes.has(id)) nodes.set(id, { hidden: !['start','welcome'].includes(id), style: { setProperty() {} },
      classList: { add() {}, remove() {} }, addEventListener(type, fn) { handlers.set(id+':'+type, fn); }, setAttribute() {}, focus() {},
      querySelectorAll: selector => selector === '.chat-bubble' ? bubbles : [],
      showModal() { this.open = true; }, close() { this.open = false; }, append() {},
      querySelector: () => ({ textContent: '' }), animate: () => {
        let done; const finished = new Promise(r => { done = r; });
        const id = schedule(done, 350);
        return { finished, finish() { timers.delete(id); done(); }, cancel() { timers.delete(id); } };
      } });
    return nodes.get(id);
  };
  const ready = new Promise((resolve, reject) => { resolveReady=resolve; rejectReady=reject; });
  const outfits = ['01','02','03','04'].map(id => ({ id, key: 'outfit-'+id, idle: '', presentation: { width:1, height:1, bounds:[0,0,1,1] } }));
  let selected=outfits[0];
  const context = vm.createContext({ document: { getElementById: get, addEventListener() {}, body: { append() {} } }, matchMedia: () => motion,
    Image: class { naturalWidth = 368; naturalHeight = 1024; decode() { return Promise.resolve(); } },
    setTimeout: (fn, ms) => schedule(fn, ms), clearTimeout: id => timers.delete(id),
    setInterval: (fn, ms) => schedule(fn, ms, ms), clearInterval: id => timers.delete(id),
    requestAnimationFrame: fn => schedule(fn, 16), cancelAnimationFrame: id => timers.delete(id), location: { reload() {} } });
  const exportsByName = {
    './game.js': { game: { ready, reveal() { revealCount++; revealAt=now; }, resume() { resumeCount++; }, events: { addEventListener() {} } } },
    './audio.js': { audio: { preferences: {}, play() {}, addEventListener() {} } },
    './outfits.js': { outfits }, './player-state.js': { playerState: { get outfit() { return selected; } }, selectOutfit(key) { selected=outfits.find(o=>o.key===key); } },
  };
  const module = new vm.SourceTextModule(fs.readFileSync('public/js/intro.js','utf8'), { context });
  await module.link(name => { const values=exportsByName[name]; return new vm.SyntheticModule(Object.keys(values), function() {
    for (const [key,value] of Object.entries(values)) this.setExport(key,value);
  }, { context }); });
  await module.evaluate();
  assert.equal(get('welcome').hidden,false); assert.equal(get('boot').hidden,true);
  handlers.get('enter:click')();
  assert.equal(get('player-card').hidden,false);
  for(let i=0;i<outfitIndex;i++) handlers.get('outfit-next:click')();
  schedule(() => { handlers.get('launch:click')(); handlers.get('launch:click')(); }, 100);
  schedule(() => failure ? rejectReady(new Error('failed')) : resolveReady(), readyAt);
  if (reduceAt !== undefined) schedule(() => { motion.matches=true; for (const fn of [...listeners]) fn(); }, reduceAt);
  const states=[];
  for (let step=0; step<500 && timers.size; step++) {
    const [id,t] = [...timers.entries()].sort((a,b)=>a[1].time-b[1].time)[0];
    now=t.time; timers.delete(id); if(t.interval) timers.set(id,{...t,time:now+t.interval}); t.fn();
    for(let i=0;i<10;i++) await Promise.resolve();
    states.push({ now, boot: !get('start').hidden && !get('boot').hidden, welcome: !get('welcome').hidden, connection: !get('connection').hidden });
    if (!get('boot').hidden && failure && !get('retry').hidden) break;
  }
  assert.ok(states.every(s => !s.connection), 'old connection never appears');
  assert.equal(listeners.size, 0, 'motion listeners cleaned');
  assert.equal(selected.id, outfits[outfitIndex].id, 'selected identity survives loading');
  const firstBoot=states.find(s=>s.boot); assert.equal(firstBoot.now,100);
  if (failure) {
    assert.equal(get('retry').hidden,false); assert.equal(revealCount,0);
  } else {
    assert.equal(get('start').hidden,true); assert.equal(revealCount,1,'double click launches only once');
    assert.equal(get('phone-message').open,true); assert.equal(get('chat-actions').hidden,false);
    handlers.get('explore:click')(); assert.equal(resumeCount,1); assert.equal(get('world').inert,false);
    // Only the unchanged five-second movement tip remains after entering play.
    for (const [id,t] of [...timers]) { timers.delete(id); t.fn(); }
    const loadingEnd=states.find(s=>s.now>100 && get('start').hidden && !s.boot);
    assert.ok(loadingEnd);
    if(reduced) assert.ok(revealAt<=132);
    else if(reduceAt !== undefined) assert.ok(revealAt<=Math.max(reduceAt,readyAt));
    else assert.ok(revealAt>=Math.max(3132,readyAt));
  }
  assert.equal(timers.size,0,'no accumulated timers');
}
(async()=>{
  for(let outfitIndex=0;outfitIndex<4;outfitIndex++) await scenario({outfitIndex});
  await scenario({readyAt:5000}); await scenario({reduced:true});
  await scenario({reduceAt:500}); await scenario({reduceAt:3200});
  await scenario({failure:true});
  console.log('PASS: fast/slow load, reduced motion and live changes, errors, welcome → selector → loading → arrival → phone → playground, four outfits, double click and timer cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1;});
