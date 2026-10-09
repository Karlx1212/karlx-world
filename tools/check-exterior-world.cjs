// Edge integration, protected-core pixel comparison and navigation benchmarks.
// node tools/check-exterior-world.cjs PLAYWRIGHT EDGE OUTPUT
const {chromium}=require(process.argv[2]);
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../public'),out=process.argv[4];fs.mkdirSync(out,{recursive:true});
const baseline=new Map(['game','world-map','garden','pavement'].map(name=>['js/'+name+'.js',execFileSync('git',['show','535cf0b:public/js/'+name+'.js'])]));
const server=http.createServer((req,res)=>{
 const relative=req.url==='/'?'index.html':req.url.slice(1),file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(err,data)=>{
  if(err)return res.writeHead(404).end();
  if(req.headers['x-baseline']&&baseline.has(relative))data=baseline.get(relative);
  res.setHeader('Content-Type',{'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream');
  if(relative==='js/game.js')data=Buffer.from(data+'\nwindow.__exterior={player,view,render,update,keys,clearInput,blocked,ctx,resize};');
  res.end(data);
 });
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
 try{
 const report=[];
 for(const mobile of [false,true])for(const old of [true,false]){
  const tag=(mobile?'mobile':'desktop')+'-'+(old?'before':'after');
  const context=await browser.newContext({viewport:mobile?{width:375,height:812}:{width:1920,height:900},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile,extraHTTPHeaders:old?{'x-baseline':'yes'}:{}});
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>{if(!window.__freeze)cb(t)});});
  await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle'});
  if(mobile)await page.addStyleTag({content:':root{--safe-top:44px!important;--safe-bottom:34px!important}'});
  await page.locator('#enter').click();await page.locator('#launch').click();await page.locator('#explore').waitFor({state:'visible'});await page.locator('#explore').click();
  await page.evaluate(()=>{window.__freeze=true});await page.waitForTimeout(40);
  const data=await page.evaluate(async old=>{
   const t=window.__exterior,{worldMap:m}=await import('/js/world-map.js');
   const verify=(ok,msg)=>{if(!ok)throw Error(msg)};
   const origin=m.origin??{x:0,y:0},right=origin.x+m.dimensions.width,bottom=origin.y+m.dimensions.height;
   t.render(1000);const initial={...t.view};
   const {drawGrass}=await import('/js/garden.js'),{drawPavement}=await import('/js/pavement.js');
   const ground=document.createElement('canvas');ground.width=1400;ground.height=960;
   const g=ground.getContext('2d');drawGrass(g);drawPavement(g);
   // Compare the complete old terrain, permitting only new path pixels.
   const groundPNG=ground.toDataURL().split(',')[1];
   const times=[];for(let i=0;i<140;i++){const start=performance.now();t.render(1000);if(i>=20)times.push(performance.now()-start)}
   t.ctx.getImageData(0,0,1,1);
   times.sort((a,b)=>a-b);
   const perf={median:times[60],p95:times[114],mean:times.reduce((a,b)=>a+b,0)/times.length};
   verify(t.player.x===700&&t.player.y===640,'spawn');
   if(!old){
    verify(JSON.stringify(m.dimensions)==='{"width":2400,"height":1960}','dimensions');
    verify(JSON.stringify(origin)==='{"x":-500,"y":-500}','origin');
    verify(JSON.stringify(m.walkableBounds)==='{"minX":-458,"maxX":1858,"minY":-350,"maxY":1418}','bounds');
    verify(m.objects.filter(o=>o.kind==='garden').length===26,'garden count');
    verify(m.obstacles.length===16,'unchanged obstacles');
    const bounds=m.walkableBounds;
    for(const [x,y] of [[-458,0],[1858,0],[0,-350],[0,1418],[0,0],[700,270],[700,915],[42,560],[1358,560],[1240,760]])verify(!t.blocked(x,y),'invisible boundary/reservation');
    for(const [x,y] of [[-459,0],[1859,0],[0,-351],[0,1419]])verify(t.blocked(x,y),'outer boundary');
    for(let y=-350;y<=1418;y+=25)for(let x=-458;x<=1858;x+=25){
     const expected=m.obstacles.some(o=>x+11>o.x&&x-11<o.x+o.w&&y+5>o.y&&y-5<o.y+o.h);
     verify(t.blocked(x,y)===expected,'invisible obstacle');
    }
    const {cameraAxis}=await import('/js/world-camera.js');
    for(const [v,f,lo,hi,legacy] of [[initial.width/initial.scale,.5,-500,1900,1400],[initial.height/initial.scale,.66,-500,1460,960]]){
     let previous=cameraAxis(-458,v,f,lo,hi,legacy);
     for(let p=-457.5;p<hi-42;p+=.5){const c=cameraAxis(p,v,f,lo,hi,legacy);verify(c>=lo-1e-8&&c+v<=hi+1e-8,'camera outside world');verify(Math.abs(c-previous)<=.500001,'camera discontinuity or acceleration');previous=c;}
    }
   }
   return {tag:old?'before':'after',mobile:matchMedia('(max-width:600px)').matches,initial,perf,groundPNG,objects:m.objects,obstacles:m.obstacles,plaza:m.terrain.plaza,paths:m.terrain.paths};
  },old);
  fs.writeFileSync(path.join(out,tag+'-ground.png'),Buffer.from(data.groundPNG,'base64'));delete data.groundPNG;
  await page.screenshot({path:path.join(out,tag+'-initial.png'),scale:'css'});
  // Freeze water clock for deterministic initial canvas comparison.
  fs.writeFileSync(path.join(out,tag+'-canvas.png'),Buffer.from(await page.evaluate(()=>document.querySelector('#world').toDataURL().split(',')[1]),'base64'));
  if(!old){
   for(const [direction,points] of [
    ['north',[[540,640],[540,410],[700,410],[700,-260]]],
    ['south',[[700,1190]]],['east',[[860,640],[860,560],[1590,560]]],['west',[[540,640],[540,560],[-200,560]]],
   ]){
    await page.evaluate(async points=>{
     const t=window.__exterior,{game}=await import('/js/game.js');game.resume();
     for(const outfit of ['01','02','03','04']){
      (await import('/js/player-state.js')).selectOutfit('outfit-'+outfit);t.player.x=700;t.player.y=640;t.clearInput();
      for(const [x,y] of points)for(const [axis,target,neg,pos] of [['x',x,'a','d'],['y',y,'w','s']]){
       let n=0;while(Math.abs(t.player[axis]-target)>1e-7){const delta=target-t.player[axis];t.keys.add(delta<0?neg:pos);t.update(Math.min(.05,Math.abs(delta)/210));t.clearInput();if(++n>500||t.blocked(t.player.x,t.player.y))throw Error('blocked route');}t.render(1000);
       const v=t.view,sx=(t.player.x-v.x)*v.scale,sy=(t.player.y-v.y)*v.scale;
       if(sx<26*v.scale||sx>v.width-26*v.scale||sy<130*v.scale||sy>v.height)throw Error('avatar clipped during exploration');
      }
     }
     t.update(0);game.pause();t.render(1000);
    },points);
    await page.screenshot({path:path.join(out,tag+'-'+direction+'.png'),scale:'css'});
   }
   // Real boundary approach and return, plus camera clamping at every side.
   await page.evaluate(async()=>{
    const t=window.__exterior,{game}=await import('/js/game.js');game.resume();
    for(const [x,y,key,axis,limit] of [[-400,560,'a','x',-458],[1800,560,'d','x',1858],[700,-300,'w','y',-350],[700,1350,'s','y',1418]]){
     t.player.x=x;t.player.y=y;t.clearInput();t.keys.add(key);for(let i=0;i<50;i++)t.update(.05);t.clearInput();
     if(Math.abs(t.player[axis]-limit)>10.5)throw Error('boundary unreachable');t.render(1000);
    }
    t.player.x=700;t.player.y=640;t.update(0);t.render(1000);game.pause();
   });
   if(mobile){
    await page.evaluate(async()=>{(await import('/js/game.js')).game.resume();window.__freeze=false;requestAnimationFrame(function frame(t){if(window.__freeze)return;window.__exterior.update(.016);window.__exterior.render(t);requestAnimationFrame(frame)})});
    const cdp=await context.newCDPSession(page),box=await page.locator('#world').boundingBox();const x=box.x+box.width/2,y=box.y+box.height*.7;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+50,y}]});await page.waitForFunction(()=>window.__exterior.player.x>700);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await page.evaluate(()=>window.__exterior.keys.size),0);await page.evaluate(()=>{window.__freeze=true});
   }else{
    // Diagnostic overview uses the real renderer on an enlarged test canvas;
    // it is not a change to the shipped game's zoom or camera controls.
    await page.evaluate(()=>{const t=window.__exterior,c=document.querySelector('#world');c.width=1200;c.height=980;t.view.width=1200;t.view.height=980;t.view.scale=.5;t.player.x=700;t.player.y=640;t.render(1000)});
    fs.writeFileSync(path.join(out,'world-overview.png'),Buffer.from(await page.evaluate(()=>document.querySelector('#world').toDataURL().split(',')[1]),'base64'));
   }
  }
  assert.deepEqual(errors,[]);report.push(data);console.log('PASS exterior',tag,JSON.stringify(data.perf));await context.close();
 }
 for(const mobile of [false,true]){
  const a=report.find(r=>r.mobile===mobile&&r.tag==='before'),b=report.find(r=>r.mobile===mobile&&r.tag==='after');
  assert.deepEqual(b.initial,a.initial,'initial camera/scale');
  for(const field of ['objects','obstacles','plaza','paths'])assert.deepEqual(b[field],a[field],'protected '+field);
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
