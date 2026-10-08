// Edge integration, full entry, four outfits, depth and recorded render frames.
// node tools/check-magical-fountain.cjs PLAYWRIGHT_MODULE EDGE_EXECUTABLE OUTPUT
const {chromium}=require(process.argv[2]);
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../public'),out=process.argv[4];fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':req.url));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(error,data)=>{
  if(error)return res.writeHead(404).end();
  res.setHeader('Content-Type',{'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream');
  if(file.endsWith(path.join('js','game.js'))){
   data=Buffer.from(data.toString().replace('update(dt);render(time);requestAnimationFrame(frame);','update(dt);render(window.__fountainTime ?? time);requestAnimationFrame(frame);')+'\nwindow.__fountainTest={player,view,render,update,blocked,clearInput,keys};');
  }
  res.end(data);
 });
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
 try{
  for(const mobile of [false,true])for(const reduced of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:375,height:812}:{width:1920,height:900},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference'});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle'});
   if(mobile)await page.addStyleTag({content:':root{--safe-top:44px!important;--safe-bottom:34px!important}'});
   await page.locator('#enter').click();await page.locator('#launch').click();await page.locator('#explore').waitFor({state:'visible'});await page.locator('#explore').click();
   const prefix=(mobile?'iphone-x':'desktop')+'-'+(reduced?'reduced':'normal');
   await page.evaluate(()=>{window.__fountainTime=0;window.__fountainTest.render(0)});
   const geometry=await page.evaluate(async()=>{
    const t=window.__fountainTest,{worldMap}=await import('/js/world-map.js');const f=worldMap.objects[0];
    return {spawn:{x:t.player.x,y:t.player.y},center:{x:f.x,y:f.y},scale:f.scale,view:{...t.view},top:f.y+(24-f.assets.originY)*f.scale,bottom:f.y+(388-f.assets.originY)*f.scale,width:474*f.scale};
   });
   assert.deepEqual(geometry.spawn,{x:700,y:640});assert.deepEqual(geometry.center,{x:700,y:520});assert.equal(geometry.scale,.58);
   assert.ok(Math.abs((700-geometry.view.x)*geometry.view.scale-geometry.view.width/2)<.5,'centered fountain');
   assert.ok((geometry.top-geometry.view.y)*geometry.view.scale>=0,'entire elevated art visible at arrival');
   assert.ok((geometry.bottom-geometry.view.y)*geometry.view.scale<geometry.view.height,'base visible at arrival');
   fs.writeFileSync(path.join(out,prefix+'-geometry.json'),JSON.stringify(geometry,null,2));
   for(const id of ['01','02','03','04']){
    await page.evaluate(async id=>{(await import('/js/player-state.js')).selectOutfit('outfit-'+id);const t=window.__fountainTest;t.clearInput();t.player.x=700;t.player.y=640;t.player.facing='down';t.update(0);t.render(0)},id);
    await page.screenshot({path:path.join(out,prefix+'-'+id+'.png')});
    const result=await page.evaluate(async reduced=>{
     const t=window.__fountainTest,{worldMap}=await import('/js/world-map.js'),{fountainFrame}=await import('/js/magical-fountain.js');
     const verify=(ok,msg)=>{if(!ok)throw Error(msg)};
     for(const [time,expected] of [[0,0],[59,0],[60,1],[1919,31],[1920,0],[3840,0]])verify(fountainFrame(time,reduced)===(reduced?0:expected),'animation timing');
     const walk=(x,y)=>{for(const [axis,target,negative,positive] of [['x',x,'a','d'],['y',y,'w','s']]){let n=0;while(Math.abs(t.player[axis]-target)>1e-7){const delta=target-t.player[axis];t.clearInput();t.keys.add(delta<0?negative:positive);t.update(Math.min(.05,Math.abs(delta)/210));t.clearInput();verify(++n<400,'blocked route');verify(!t.blocked(t.player.x,t.player.y),'walking inside footprint')}}};
     for(const p of [[540,640],[540,410],[860,410],[860,640],[700,640],[700,915],[700,640],[540,640],[540,560],[42,560],[540,560],[540,410],[700,410],[700,270],[700,410],[860,410],[860,560],[1358,560],[860,560],[860,640],[700,640]])walk(...p);
     // Every band edge blocks entry; standing within the ground ellipse is blocked.
     for(const o of worldMap.obstacles){const y=o.y+o.h/2;verify(t.blocked(o.x-10.9,y),'west band edge');verify(t.blocked(o.x+o.w+10.9,y),'east band edge')}
     for(let angle=0;angle<Math.PI*2;angle+=.05)verify(t.blocked(700+136*Math.cos(angle),520+83*Math.sin(angle)),'platform perimeter');
     verify(!t.blocked(700,640)&&!t.blocked(540,520)&&!t.blocked(860,520)&&!t.blocked(700,410),'clear circulation');
     t.clearInput();t.player.x=700;t.player.y=640;t.update(0);t.render(0);return true;
    },reduced);assert.equal(result,true);
   }
   // Inspect the actual draw order, including the avatar among independent pieces.
   for(const [side,x,y] of [['north',700,431],['south',700,609],['west',540,520],['east',860,520]]){
    const order=await page.evaluate(async({x,y})=>{
     const t=window.__fountainTest,{selectOutfit}=await import('/js/player-state.js');selectOutfit('outfit-01');t.clearInput();t.player.x=x;t.player.y=y;t.player.facing='down';t.update(0);
     const ctx=document.querySelector('#world').getContext('2d'),draw=ctx.drawImage,calls=[];
     ctx.drawImage=function(image,...args){calls.push({src:image.src ?? '[cached canvas]',args});return draw.call(this,image,...args)};
     t.render(0);ctx.drawImage=draw;return calls;
    },{x,y});
    const playerIndex=order.findIndex(c=>c.src.includes('/outfit-01-'));
    const centralIndex=order.findIndex(c=>c.src.endsWith('/central-static.png'));
    assert.ok(playerIndex>=0&&centralIndex>=0);
    if(side==='north')assert.ok(centralIndex>playerIndex,'central column occludes northern player');
    if(side==='south')assert.ok(centralIndex<playerIndex,'southern player in front');
    fs.writeFileSync(path.join(out,prefix+'-'+side+'-draw-order.json'),JSON.stringify(order,null,2));
    await page.screenshot({path:path.join(out,prefix+'-'+side+'.png')});
   }
   await page.evaluate(()=>{const t=window.__fountainTest;t.player.x=700;t.player.y=640;t.update(0);t.render(0)});
   // Real canvas readback must change for normal motion and remain exact for reduce.
   const animation=await page.evaluate(()=>{
    const t=window.__fountainTest,c=document.querySelector('#world'),ctx=c.getContext('2d');
    t.render(0);const a=ctx.getImageData(0,0,c.width,c.height).data;t.render(480);const b=ctx.getImageData(0,0,c.width,c.height).data;
    let changed=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])changed++;return changed;
   });assert.ok(reduced?animation===0:animation>0,'water motion/reduced canvas pixels');
   if(!mobile&&!reduced){
    const dir=path.join(out,'recording');fs.mkdirSync(dir,{recursive:true});
    for(let frame=0;frame<32;frame++){
     await page.evaluate(time=>{window.__fountainTime=time;window.__fountainTest.render(time)},frame*60);
     await page.screenshot({path:path.join(dir,String(frame).padStart(2,'0')+'.png')});
    }
   }
   assert.deepEqual(errors,[]);console.log('PASS fountain',prefix,': four outfits, full entry, footprint, paths, independent depth, animated/static readback');await context.close();
  }
  // A pending/missing new fountain resource must use existing loading/error flow.
  for(const mode of ['slow','error']){
   const context=await browser.newContext({viewport:{width:1920,height:900},reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   let release;const gate=new Promise(resolve=>{release=resolve});
   await page.route('**/magical-fountain/base-water.png',async route=>{
    if(mode==='error')return route.fulfill({status:404,body:'missing'});
    await gate;await route.continue();
   });
   await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'domcontentloaded'});
   await page.locator('#welcome').waitFor({state:'visible'});await page.locator('#enter').click();await page.locator('#launch').click();
   if(mode==='slow'){
    await page.locator('#boot').waitFor({state:'visible'});
    assert.equal(await page.locator('#explore').isVisible(),false);
    assert.equal(await page.locator('#world').evaluate(c=>c.inert),true);
    release();await page.locator('#explore').waitFor({state:'visible'});await page.locator('#explore').click();
    await page.evaluate(async()=>{await (await import('/js/game.js')).game.ready});
   }else{
    await page.locator('#retry').waitFor({state:'visible'});
    assert.equal(await page.locator('#world').evaluate(c=>c.inert),true);
    assert.equal(await page.locator('#explore').isVisible(),false);
   }
   assert.deepEqual(errors,[]);console.log('PASS fountain asset',mode,': existing safe loading flow');await context.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
