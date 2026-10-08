// Usage: node tools/check-world-map.cjs PLAYWRIGHT_MODULE EDGE_EXECUTABLE SCREENSHOT_DIRECTORY
// Hooks exist only in local HTTP responses; no testing API is shipped to the game.
const { chromium } = require(process.argv[2]);
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../public');
const output = process.argv[4];
if(output) fs.mkdirSync(output,{recursive:true});
const server = http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':req.url));
  if(!file.startsWith(root+path.sep)) return res.writeHead(403).end();
  fs.readFile(file,(error,data)=>{
    if(error) return res.writeHead(404).end();
    res.setHeader('Content-Type',{'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream');
    if(file.endsWith(path.join('js','game.js'))) data=Buffer.from(data.toString()+'\nwindow.__worldTest={player,view,blocked,update,render,clearInput,keys};');
    res.end(data);
  });
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
  try {
    for(const mobile of [false,true]) for(const reduced of [false,true]) {
      const context=await browser.newContext({viewport:mobile?{width:375,height:812}:{width:1920,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference'});
      const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      assert.equal(await page.locator('#welcome').isVisible(),true);
      await page.locator('#enter').click();await page.locator('#launch').click();
      await page.locator('#explore').waitFor({state:'visible'});await page.locator('#explore').click();
      assert.deepEqual(await page.evaluate(()=>({x:window.__worldTest.player.x,y:window.__worldTest.player.y})),{x:700,y:640});
      const definition=await page.evaluate(async()=>{
        const {worldMap:m}=await import('/js/world-map.js');
        return {id:m.id,dimensions:m.dimensions,spawn:m.spawn,bounds:m.walkableBounds,obstacles:m.obstacles,objects:m.objects.map(o=>({kind:o.kind,layer:o.layer})),paths:m.terrain.paths.map(p=>({id:p.id,points:p.points})),plaza:m.terrain.plaza};
      });
      assert.equal(definition.id,'central-plaza');
      assert.deepEqual(definition.dimensions,{width:1400,height:960});
      assert.deepEqual(definition.spawn,{x:700,y:640});
      assert.deepEqual(definition.bounds,{minX:42,maxX:1358,minY:330,maxY:915});
      assert.equal(definition.obstacles.length,12);
      assert.equal(Math.min(...definition.obstacles.map(o=>o.y)),436);
      assert.equal(Math.max(...definition.obstacles.map(o=>o.y+o.h)),604);
      assert.equal(Math.min(...definition.obstacles.map(o=>o.x)),563);
      assert.equal(Math.max(...definition.obstacles.map(o=>o.x+o.w)),837);
      assert.deepEqual(definition.objects,[{kind:'fountain',layer:'layered'}]);
      assert.deepEqual(definition.paths,[
        {id:'north',points:[[640,330],[760,330],[760,460],[640,460]]},
        {id:'south',points:[[640,580],[760,580],[760,915],[640,915]]},
        {id:'west',points:[[42,500],[580,500],[580,620],[42,620]]},
        {id:'east',points:[[820,500],[1358,500],[1358,620],[820,620]]},
      ]);
      assert.equal(definition.plaza.x,400);assert.equal(definition.plaza.y,350);assert.equal(definition.plaza.w,600);assert.equal(definition.plaza.h,450);
      assert.deepEqual(definition.plaza.points,[[550,350],[850,350],[1000,470],[1000,680],[850,800],[550,800],[400,680],[400,470]]);
      const result=await page.evaluate(async()=>{
        const t=window.__worldTest;const {selectOutfit}=await import('/js/player-state.js');const {game}=await import('/js/game.js');
        const verify=(ok,message)=>{if(!ok)throw Error(message);};
        const reset=(x=700,y=640)=>{t.clearInput();t.player.x=x;t.player.y=y;t.player.facing='down';};
        const step=(key,dt=.05)=>{t.clearInput();t.keys.add(key);t.update(dt);t.clearInput();};
        // Each segment is traversed through real update(), never teleported.
        const walk=(x,y)=>{
          for(const [axis,target,negative,positive] of [['x',x,'a','d'],['y',y,'w','s']]) {
            let count=0;
            while(Math.abs(t.player[axis]-target)>1e-7){
              const distance=target-t.player[axis];step(distance<0?negative:positive,Math.min(.05,Math.abs(distance)/210));
              verify(++count<300,'route blocked');verify(!t.blocked(t.player.x,t.player.y),'route enters obstacle');
            }
          }
        };
        for(const id of ['01','02','03','04']) {
          selectOutfit('outfit-'+id);
          for(const [key,dx,dy,name] of [['s',0,10.5,'front'],['a',-10.5,0,'left'],['d',10.5,0,'right'],['w',0,-10.5,'back']]) {
            reset();step(key);verify(Math.abs(t.player.x-(700+dx))<1e-8&&Math.abs(t.player.y-(640+dy))<1e-8,'speed or direction');
            verify(game.playerAppearance.spriteSource.includes('outfit-'+id+'-'+name),'directional outfit');
            t.update(.05);verify(game.playerAppearance.pose==='idle','directional idle');
          }
          reset();
          for(const point of [[540,640],[540,410],[860,410],[860,640],[700,640]])walk(...point);
          for(const point of [[540,640],[540,410],[700,410],[700,330],[700,410],[860,410],[860,560],[1358,560],[860,560],[860,640],[700,640],[700,915],[700,640],[540,640],[540,560],[42,560],[540,560],[540,640],[700,640]])walk(...point);
        }
        // Basin from every side, followed by diagonal sliding along its south rim.
        for(const [x,y,key] of [[700,609,'w'],[700,431,'s'],[552,520,'d'],[848,520,'a']]){reset(x,y);step(key);verify(t.player.x===x&&t.player.y===y,'fountain collision');}
        reset(700,609);t.keys.add('w');t.keys.add('d');t.update(.05);verify(t.player.y===609&&t.player.x>700,'slide along fountain');
        for(const [x,y,key] of [[42,640,'a'],[1358,640,'d'],[700,330,'w'],[700,915,'s']]){reset(x,y);step(key);verify(t.player.x===x&&t.player.y===y,'boundary');}
        reset();t.keys.add('s');t.keys.add('d');t.update(.05);verify(Math.abs(Math.hypot(t.player.x-700,t.player.y-640)-10.5)<1e-8,'diagonal speed');
        // Dense scan ensures removed objects have no remaining invisible collisions.
        for(let y=330;y<=915;y+=5)for(let x=42;x<=1358;x+=5) {
          const radius=((x-700)/137)**2+((y-520)/84)**2;
          if(radius<1)verify(t.blocked(x,y),'walkable inside platform at '+x+','+y);
          if(radius>1.6)verify(!t.blocked(x,y),'unexpected distant obstacle at '+x+','+y);
        }
        for(const [x,y] of [[42,330],[700,640],[1358,915]]) {
          reset(x,y);t.render(1000);const v=t.view,w=v.width/v.scale,h=v.height/v.scale;
          if(matchMedia('(max-width: 600px), (pointer: coarse) and (max-width: 1000px)').matches) {
            verify(w<=1400+1e-8&&h<=960+1e-8,'mobile viewport stays inside world');
            verify(122*v.scale>=60,'mobile avatar is readable');
          } else verify(v.scale===Math.max(Math.min(v.width/1160,v.height/790),v.width/1400,v.height/960),'desktop viewport fits world');
          verify(v.x===Math.max(0,Math.min(1400-w,x-w/2))&&v.y===Math.max(0,Math.min(960-h,y-h*.66)),'camera bounds');
        }
        reset();t.update(.05);return true;
      });
      assert.equal(result,true);
      await page.keyboard.down('ArrowRight');
      await page.waitForFunction(()=>window.__worldTest.player.x>700);
      await page.keyboard.up('ArrowRight');
      assert.equal(await page.evaluate(()=>window.__worldTest.keys.size),0);
      await page.evaluate(()=>{const t=window.__worldTest;t.clearInput();t.player.x=700;t.player.y=640;t.update(0);});
      if(mobile) {
        // CDP sends real touch input through Edge; pointer capture is not mocked.
        const cdp=await context.newCDPSession(page);const box=await page.locator('#world').boundingBox();const x=box.x+box.width/2,y=box.y+box.height*.7;
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+50,y}]});
        await page.waitForFunction(()=>window.__worldTest.player.x>700);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        assert.equal(await page.evaluate(()=>window.__worldTest.keys.size),0);
        const held=await page.evaluate(()=>window.__worldTest.player.x);await page.waitForTimeout(100);
        assert.equal(await page.evaluate(()=>window.__worldTest.player.x),held);
      }
      const suffix=(mobile?'mobile':'desktop')+'-'+(reduced?'reduced':'normal');
      if(mobile) await page.locator('#movement-tip').waitFor({state:'hidden'});
      for(const id of ['01','02','03','04']) {
        await page.evaluate(async id=>{(await import('/js/player-state.js')).selectOutfit('outfit-'+id);const t=window.__worldTest;t.clearInput();t.player.x=700;t.player.y=640;t.player.facing='down';t.update(0);},id);
        if(output) {
          await page.screenshot({path:path.join(output,`plaza-${suffix}-${id}.png`)});
          const canvas=await page.evaluate(()=>document.querySelector('#world').toDataURL('image/png').split(',')[1]);
          fs.writeFileSync(path.join(output,`canvas-${suffix}-${id}.png`),Buffer.from(canvas,'base64'));
        }
      }
      if(output) {
        fs.writeFileSync(path.join(output,`view-${suffix}.json`),JSON.stringify(await page.evaluate(()=>({...window.__worldTest.view})),null,2));
        if(process.argv[5] && !mobile) for(const id of ['01','02','03','04']) {
          const name=`canvas-${suffix}-${id}.png`;
          assert.ok(fs.readFileSync(path.join(output,name)).equals(fs.readFileSync(path.join(process.argv[5],name))),'desktop pixels unchanged: '+name);
        }
      }
      if(mobile) {
        // Rotate and resize the same running game without resetting player or input.
        for(const size of [{width:320,height:568},{width:844,height:390},{width:430,height:932}]) {
          await page.setViewportSize(size);
          await page.waitForFunction(()=>window.__worldTest.view.width===document.querySelector('#world').getBoundingClientRect().width);
          const framing=await page.evaluate(()=>{
            const t=window.__worldTest;t.render(1000);const v=t.view;
            return {width:v.width,height:v.height,scale:v.scale,x:v.x,y:v.y,player:{x:t.player.x,y:t.player.y}};
          });
          assert.deepEqual(framing.player,{x:700,y:640},'resize preserves world position');
          assert.ok(framing.width/framing.scale<=1400+1e-8 && framing.height/framing.scale<=960+1e-8,'no bands at mobile sizes');
          const top=(436-framing.y)*framing.scale,bottom=(604-framing.y)*framing.scale;
          assert.ok(top>=0 && bottom<=framing.height,'whole fountain visible at arrival');
          assert.ok(122*framing.scale>=60,'readable avatar at mobile sizes');
          if(output) await page.screenshot({path:path.join(output,`plaza-${size.width}x${size.height}-${reduced?'reduced':'normal'}.png`)});
        }
      }
      assert.deepEqual(errors,[]);console.log('PASS plaza',suffix,': spawn, loop, four roads/outfits, collisions, boundaries, camera, touch and entry');
      await context.close();
    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
