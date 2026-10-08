// Real Edge baseline comparison and world invariants. Test hooks are injected only in HTTP responses.
const { chromium } = require(process.argv[2]);
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../public');
const mode = process.argv[4];
const reference = process.argv[5];
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + (req.url === '/' ? '/index.html' : req.url));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, data) => {
    if (error) return res.writeHead(404).end();
    res.setHeader('Content-Type', { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png' }[path.extname(file)] || 'application/octet-stream');
    if (file.endsWith(path.join('js', 'game.js'))) data = Buffer.from(data.toString() + '\nwindow.__worldTest = {player, view, blocked, update, render, clearInput, keys};');
    res.end(data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, executablePath: process.argv[3] });
  try {
    for (const mobile of [false, true]) {
      const context = await browser.newContext({ viewport: mobile ? {width:390,height:844} : {width:1280,height:800}, isMobile:mobile, hasTouch:mobile, reducedMotion:'reduce' });
      const page = await context.newPage();
      const errors=[]; page.on('pageerror', error=>errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      await page.evaluate(async()=>{ await (await import('/js/game.js')).game.ready; });
      await page.locator('#enter').click(); await page.locator('#launch').click();
      await page.locator('#explore').waitFor({state:'visible'}); await page.locator('#explore').click();
      const facts = await page.evaluate(()=>{
        const t=window.__worldTest;
        const sample=[];
        for(let y=0;y<=960;y+=5) for(let x=0;x<=1400;x+=5) sample.push(t.blocked(x,y)?1:0);
        return {spawn:{x:t.player.x,y:t.player.y},sample};
      });
      assert.deepEqual(facts.spawn,{x:700,y:580});
      const suffix=mobile?'mobile':'desktop';
      const factsFile=path.join(reference,`${suffix}-collision.json`);
      if(mode==='baseline') fs.writeFileSync(factsFile,JSON.stringify(facts));
      else assert.deepEqual(facts,JSON.parse(fs.readFileSync(factsFile)), 'all sampled collisions match original');
      for(const id of ['01','02','03','04']) {
        await page.evaluate(async id=>{(await import('/js/player-state.js')).selectOutfit(`outfit-${id}`); const t=window.__worldTest;t.player.x=700;t.player.y=580;t.player.facing='down';t.player.moving=false;t.render(1000);},id);
        const file=path.join(reference,`${suffix}-${id}.png`);
        const pixels=await page.locator('#world').screenshot();
        if(mode==='baseline') fs.writeFileSync(file,pixels);
        else assert.ok(pixels.equals(fs.readFileSync(file)),`${suffix} outfit ${id}: identical canvas PNG`);
      }
      if(mode!=='baseline') {
        const definition=await page.evaluate(async()=>{
          const {worldMap:m}=await import('/js/world-map.js');
          return {dimensions:m.dimensions,spawn:m.spawn,bounds:m.walkableBounds,
            counts:Object.fromEntries(['building','tree','bench','lamp','sign','planter'].map(kind=>[kind,m.objects.filter(o=>o.kind===kind).length])),obstacles:m.obstacles.length};
        });
        assert.deepEqual(definition,{dimensions:{width:1400,height:960},spawn:{x:700,y:580},bounds:{minX:42,maxX:1358,minY:330,maxY:915},counts:{building:3,tree:8,bench:2,lamp:4,sign:1,planter:5},obstacles:13});
        const result=await page.evaluate(async()=>{
          const t=window.__worldTest; const game=(await import('/js/game.js')).game;
          const movements=[];
          for(const id of ['01','02','03','04']) {
            (await import('/js/player-state.js')).selectOutfit(`outfit-${id}`);
            for(const key of ['s','a','d','w']) {t.player.x=700;t.player.y=580;t.clearInput();t.keys.add(key);t.update(.05);movements.push([t.player.x,t.player.y]);t.clearInput();t.update(.05);}
          }
          // Actual update must reject buildings, banks, trunks and each boundary.
          const cases=[[400,450,'w'],[700,340,'w'],[1100,495,'w'],[500,690,'w'],[930,700,'w'],[85,398,'w'],[43,580,'a'],[1357,580,'d'],[700,331,'w'],[700,914,'s']];
          const blocked=cases.map(([x,y,key])=>{t.player.x=x;t.player.y=y;t.clearInput();t.keys.add(key);t.update(.05);return t.player.x===x&&t.player.y===y;});
          t.clearInput();t.player.x=700;t.player.y=580;
          t.keys.add('s');t.keys.add('d');t.update(.05);const diagonal=Math.hypot(t.player.x-700,t.player.y-580);t.clearInput();
          t.player.x=500;t.player.y=690;t.keys.add('w');t.keys.add('d');t.update(.05);
          const slide={x:t.player.x,y:t.player.y};t.clearInput();
          const cameras=[];
          for(const [x,y] of [[42,330],[700,580],[1358,915]]) {
            t.player.x=x;t.player.y=y;t.render(1000);cameras.push({player:{x,y},view:{...t.view}});
          }
          t.render(1000);const camera={...t.view};
          return {movements,blocked,diagonal,camera,cameras,slide};
        });
        for(let n=0;n<4;n++) assert.deepEqual(result.movements.slice(n*4,n*4+4),[[700,590.5],[689.5,580],[710.5,580],[700,569.5]]);
        assert.ok(result.blocked.every(Boolean),'collision movement and boundaries');
        assert.ok(Math.abs(result.diagonal-10.5)<1e-8);
        assert.equal(result.slide.y,690); assert.ok(result.slide.x>500,'slide along bench');
        for(const {player,view} of result.cameras) {
          const w=view.width/view.scale,h=view.height/view.scale;
          assert.equal(view.scale,Math.min(view.width/1160,view.height/790));
          assert.equal(view.x,Math.max(0,Math.min(1400-w,player.x-w/2)));
          assert.equal(view.y,Math.max(0,Math.min(960-h,player.y-h*.66)));
        }
        assert.ok(result.camera.x>=0 && result.camera.y>=0);
        if(mobile) {
          await page.evaluate(()=>{const t=window.__worldTest;t.player.x=700;t.player.y=580; const c=document.querySelector('#world'); const emit=(type,x,y)=>c.dispatchEvent(new PointerEvent(type,{pointerId:1,pointerType:'touch',isPrimary:true,clientX:x,clientY:y,bubbles:true,cancelable:true})); c.setPointerCapture=()=>{};emit('pointerdown',100,100);emit('pointermove',140,100);t.update(.05);emit('pointerup',140,100);});
          assert.equal(await page.evaluate(()=>window.__worldTest.player.x),710.5);
        }
      }
      assert.deepEqual(errors,[]); console.log(`PASS ${mode} ${suffix}: four outfits, entry, canvas and collision reference`);
      await context.close();
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());

