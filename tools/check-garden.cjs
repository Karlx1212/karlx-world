// node tools/check-garden.cjs PLAYWRIGHT_MODULE EDGE_EXECUTABLE OUTPUT
const {chromium}=require(process.argv[2]);
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../public'),out=process.argv[4];fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':req.url));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(error,data)=>{
  if(error)return res.writeHead(404).end();
  res.setHeader('Content-Type',{'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream');
  if(file.endsWith(path.join('js','game.js')))data=Buffer.from(data.toString()+'\nwindow.__gardenTest={player,view,render,blocked,update,keys,clearInput,ctx};');
  res.end(data);
 });
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
 try{
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:375,height:812}:{width:1920,height:900},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[],missing=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url())});
   await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle'});
   if(mobile)await page.addStyleTag({content:':root{--safe-top:44px!important;--safe-bottom:34px!important}'});
   await page.locator('#enter').click();await page.locator('#launch').click();await page.locator('#explore').waitFor({state:'visible'});await page.locator('#explore').click();await page.locator('#movement-tip').waitFor({state:'hidden'});
   const report=await page.evaluate(async()=>{
    const t=window.__gardenTest,{game}=await import('/js/game.js'),{worldMap:m}=await import('/js/world-map.js');
    const {gardenObjects:objects,gardenObstacles:solid}=await import('/js/garden-data.js');
    const verify=(value,label)=>{if(!value)throw Error(label)};
    verify(objects.length===26,'plant count');verify(objects.filter(o=>o.type==='tree').length===2,'two trees');
    verify(solid.length===4,'four small footprints');
    verify(t.player.x===700&&t.player.y===640,'spawn');
    verify(m.terrain.grass.src.endsWith('grass-C2.png')&&m.terrain.grass.tileSize===512,'approved C2 sampling');
    verify(JSON.stringify(objects.filter(o=>o.type==='tree').map(o=>[o.x,o.y,o.h]))==='[[210,455,165],[1110,450,175]]','approved tree coordinates');
    game.resume();
    for(const o of solid){
     const cx=o.x+o.w/2,cy=o.y+o.h/2;
     verify(t.blocked(cx,cy),'solid center');
     for(const [x,y,key] of [[o.x-11,cy,'d'],[o.x+o.w+11,cy,'a'],[cx,o.y-5,'s'],[cx,o.y+o.h+5,'w']]){
      t.clearInput();t.player.x=x;t.player.y=y;t.keys.add(key);t.update(.05);t.clearInput();
      verify(t.player.x===x&&t.player.y===y,'collision from four sides');
     }
     verify(!t.blocked(o.x-13,cy)&&!t.blocked(o.x+o.w+13,cy),'no wide invisible rectangle');
    }
    for(const o of objects.filter(o=>!['tree','bed'].includes(o.type)))verify(!t.blocked(o.x,o.y),'flowers and shrubs remain walkable');
    game.pause();
    // Record the real draw order, including the avatar's directional sprite.
    const original=t.ctx.drawImage.bind(t.ctx);let order=[];
    t.ctx.drawImage=(image,...args)=>{if(image.src?.includes('/tree.png'))order.push('tree');if(image.src?.includes('/characters/'))order.push('player');original(image,...args)};
    for(const o of objects.filter(o=>o.type==='tree')){
     t.player.x=o.x+30;
     for(const [dy,behind] of [[-30,true],[30,false]]){
      t.player.y=o.y+dy;order=[];t.render(0);
      verify(behind?order.indexOf('player')<order.lastIndexOf('tree'):order.indexOf('player')>order.indexOf('tree'),'tree depth');
      verify(!t.blocked(t.player.x,t.player.y),'pass around trunk');
     }
    }
    t.ctx.drawImage=original;t.player.x=700;t.player.y=640;t.player.facing='down';t.render(0);
    const before=performance.now();for(let i=0;i<120;i++)t.render(0);
    const averageRenderMs=(performance.now()-before)/120;
    verify(averageRenderMs<50,'render performance gross regression');
    return {averageRenderMs,treePositions:objects.filter(o=>o.type==='tree').map(o=>({x:o.x,y:o.y,w:o.w,h:o.h})),collisions:solid,view:{...t.view}};
   });
   await page.waitForTimeout(60);
   const prefix=mobile?'mobile':'desktop';
   await page.screenshot({path:path.join(out,`${prefix}-initial.png`),scale:'css'});
   for(const [label,x,y] of [['tree-left',240,470],['tree-right',1140,470],['beds',700,795]]){
    await page.evaluate(({x,y})=>{const t=window.__gardenTest;t.player.x=x;t.player.y=y;t.render(0)},{x,y});
    await page.waitForTimeout(40);await page.screenshot({path:path.join(out,`${prefix}-${label}.png`),scale:'css'});
   }
   fs.writeFileSync(path.join(out,`${prefix}-report.json`),JSON.stringify(report,null,2));
   assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('PASS garden',prefix,report.averageRenderMs.toFixed(2),'ms/render');
   await context.close();
  }
  const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage();
  await page.route('**/assets/world/garden/tree.png',route=>route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.locator('#enter').click();await page.locator('#launch').click();
  await page.locator('#retry').waitFor({state:'visible'});
  assert.match(await page.locator('#boot-message').textContent(),/No se pudo cargar/);
  assert.equal(await page.locator('#explore').isVisible(),false,'failed resource must not enter game');
  console.log('PASS garden load failure handled by existing entry error');await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
