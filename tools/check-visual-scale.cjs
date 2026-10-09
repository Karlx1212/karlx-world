// Local HTTP instrumentation only; screenshots and metrics stay outside the repo.
// node tools/check-visual-scale.cjs PLAYWRIGHT EDGE OUTPUT [BEFORE_DIRECTORY]
const {chromium}=require(process.argv[2]);
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../public'),out=process.argv[4],before=process.argv[5];
fs.mkdirSync(out,{recursive:true});
// Compare the real resize function with its previous formula across desktop,
// portrait/landscape touch profiles and DPRs, independently of browser timing.
{
 const vm=require('node:vm'),source=fs.readFileSync(path.join(root,'js/game.js'),'utf8');
 const resize=source.slice(source.indexOf('function resize()'),source.indexOf('new ResizeObserver'));
 const reference=source.match(/const FRAMING_REFERENCE = [^;]+;/)?.[0];
 assert.ok(reference,'explicit framing reference missing');
 const legacy=resize.replaceAll('FRAMING_REFERENCE','WORLD');
 let checks=0;
 for(const [width,height] of [[306,345],[361,589],[376,621],[416,709],[812,300],[1280,800],[1880,795],[2520,975],[800,1200],[3840,2160]])for(const mobile of [false,true])for(const dpr of [1,3]){
  const evaluate=(body,dimensions)=>{
   const context={WORLD:dimensions,view:{},canvas:{getBoundingClientRect:()=>({width,height})},devicePixelRatio:dpr,matchMedia:()=>({matches:mobile})};
   vm.runInNewContext(reference+'\n'+body+'\nresize();',context);
   return JSON.parse(JSON.stringify({view:context.view,canvas:[context.canvas.width,context.canvas.height]}));
  };
  const expected=evaluate(legacy,{width:1400,height:960});
  for(const dimensions of [{width:1400,height:960},{width:2400,height:1960},{width:3600,height:2700}]){
   assert.deepEqual(evaluate(resize,dimensions),expected);checks++;
  }
 }
 console.log('PASS resize formula',checks,'legacy-equivalence and independent-world cases');
}
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':req.url));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(err,data)=>{
  if(err)return res.writeHead(404).end();
  res.setHeader('Content-Type',{'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream');
  if(file.endsWith(path.join('js','game.js')))data=Buffer.from(data+'\nwindow.__scaleTest={player,view,WORLD,resize,render,update,keys,clearInput};');
  res.end(data);
 });
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
 try{for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:375,height:812}:{width:1920,height:900},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>{if(!window.__freeze)cb(t)});});
  await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle'});
  if(mobile)await page.addStyleTag({content:':root{--safe-top:44px!important;--safe-bottom:34px!important}'});
  await page.locator('#enter').click();await page.locator('#launch').click();await page.locator('#explore').waitFor({state:'visible'});await page.locator('#explore').click();
  await page.evaluate(()=>{window.__freeze=true});await page.waitForTimeout(50);
  const prefix=mobile?'iphone-x':'desktop',metrics={};
  for(const [name,x,y,key] of [['initial',700,640,null],['fountain',850,640,null],['north',700,300,'w'],['south',700,850,'s'],['west',100,560,'a'],['east',1300,560,'d']]){
   metrics[name]=await page.evaluate(({x,y,key})=>{
    const t=window.__scaleTest;t.clearInput();t.player.x=x;t.player.y=y;t.player.facing='down';t.player.moving=false;
    if(key){t.keys.add(key);for(let i=0;i<30;i++)t.update(.05);t.clearInput();t.update(0);}
    t.render(1000);const v=t.view;
    return {player:{x:t.player.x,y:t.player.y},view:{...v},world:{...t.WORLD},fountain:{x:(700-v.x)*v.scale,y:(520-v.y)*v.scale,width:576*.58*v.scale}};
   },{x,y,key});
   await page.screenshot({path:path.join(out,`${prefix}-${name}.png`)});
   const pixels=await page.evaluate(()=>document.querySelector('#world').toDataURL().split(',')[1]);
   const file=`${prefix}-${name}-canvas.png`;fs.writeFileSync(path.join(out,file),Buffer.from(pixels,'base64'));
   if(before)assert.ok(fs.readFileSync(path.join(out,file)).equals(fs.readFileSync(path.join(before,file))),`pixels changed: ${file}`);
  }
  fs.writeFileSync(path.join(out,`${prefix}-metrics.json`),JSON.stringify(metrics,null,2));
  if(before){
   assert.deepEqual(metrics,JSON.parse(fs.readFileSync(path.join(before,`${prefix}-metrics.json`))));
   const invariance=await page.evaluate(()=>{
    const t=window.__scaleTest;const original={...t.WORLD};const expected=t.view.scale;
    try{for(const [width,height] of [[2400,1960],[3600,2700],[1000,800]]){Object.assign(t.WORLD,{width,height});t.resize();if(t.view.scale!==expected)throw Error('scale depends on world dimensions');}}
    finally{Object.assign(t.WORLD,original);t.resize();t.render(1000)}
    return true;
   });assert.ok(invariance);
  }
  assert.deepEqual(errors,[]);console.log('PASS visual-scale',prefix,before?'exact pixels, camera, movement and dimension independence':'baseline');
  await context.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
