// Fresh entry, before movement. Edge emulation does not validate Safari/iOS.
// node tools/check-desktop-framing.cjs PLAYWRIGHT_MODULE EDGE_EXECUTABLE OUTPUT_DIRECTORY [baseline|BEFORE_DIRECTORY]
const {chromium}=require(process.argv[2]);
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../public'),output=process.argv[4],baseline=process.argv[5]==='baseline';
fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':req.url));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',{'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream');
 if(file.endsWith(path.join('js','game.js')))data=Buffer.from(data.toString()+'\nwindow.__framing={player,view,render,update,keys,clearInput};');res.end(data)});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
 try{for(const size of [{width:1280,height:800},{width:1920,height:900},{width:2560,height:1080},{width:375,height:812}]){
  const mobile=size.width===375;
  for(const outfit of ['01','02','03','04']){
   if(baseline&&!mobile&&outfit!=='01')continue;
   const context=await browser.newContext({viewport:size,deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile,reducedMotion:size.width===1920&&outfit==='01'?'no-preference':'reduce'});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle'});
   if(mobile)await page.addStyleTag({content:':root{--safe-top:44px!important;--safe-bottom:34px!important}'});
   await page.locator('#enter').click();for(let i=1;i<Number(outfit);i++)await page.locator('#outfit-next').click();
   await page.locator('#launch').click();await page.locator('#chat-actions').waitFor({state:'visible'});
   const before=await page.evaluate(()=>({...window.__framing.view}));
   await page.locator('#explore').click();
   // No keys, touches, teleports or update calls before first-frame measurements.
   const frames=await page.evaluate(()=>new Promise(resolve=>{
    const values=[];const read=()=>{const {player:p,view:v}=window.__framing;values.push({x:p.x,y:p.y,view:{...v},fountainX:(700-v.x)*v.scale,canvasCenter:v.width/2});if(values.length===12)resolve(values);else requestAnimationFrame(read)};requestAnimationFrame(read);
   }));
   assert.ok(frames.every(f=>f.x===700&&f.y===640),'arrival is unchanged');
   assert.ok(frames.every(f=>JSON.stringify(f.view)===JSON.stringify(frames[0].view)),'first frames are stable');
   assert.deepEqual(frames[0].view,before,'phone transition does not move camera');
   const f=frames[0],w=f.view.width/f.view.scale,h=f.view.height/f.view.scale;
   if(!baseline){assert.ok(Math.abs(f.fountainX-f.canvasCenter)<.5,'initial fountain centered');assert.ok(w<=1400+1e-8&&h<=960+1e-8,'viewport fits world');}
   const name=`${size.width}x${size.height}-${outfit}`;
   await page.screenshot({path:path.join(output,name+'.png')});
   const pixels=await page.evaluate(()=>document.querySelector('#world').toDataURL('image/png').split(',')[1]);fs.writeFileSync(path.join(output,name+'-canvas.png'),Buffer.from(pixels,'base64'));
   fs.writeFileSync(path.join(output,name+'.json'),JSON.stringify({before,frames},null,2));
   if(!baseline&&mobile&&process.argv[5])assert.ok(fs.readFileSync(path.join(output,name+'-canvas.png')).equals(fs.readFileSync(path.join(process.argv[5],name+'-canvas.png'))),'iPhone canvas unchanged');
   if(!baseline){
    await page.evaluate(()=>{
     const t=window.__framing;
     const verify=(ok,msg)=>{if(!ok)throw Error(msg);};
     const step=(key,dt)=>{t.clearInput();t.keys.add(key);t.update(dt);t.clearInput();t.render(1000);const v=t.view,w=v.width/v.scale,h=v.height/v.scale;verify(v.x===Math.max(0,Math.min(1400-w,t.player.x-w/2)),'horizontal follow');verify(v.y===Math.max(0,Math.min(960-h,t.player.y-h*.66)),'vertical follow');};
     for(const [key,inverse] of [['a','d'],['d','a'],['w','s'],['s','w']]){
      // Stay south of the approved fountain's wider platform while testing return.
      for(let n=0;n<2;n++)step(key,.05);
      for(let n=0;n<2;n++)step(inverse,.05);
      verify(Math.abs(t.player.x-700)<1e-8&&Math.abs(t.player.y-640)<1e-8,'return to arrival');
      verify(Math.abs((700-t.view.x)*t.view.scale-t.view.width/2)<.5,'return stays centered');
     }
    });
    await page.keyboard.down('ArrowRight');await page.waitForFunction(()=>window.__framing.player.x>700);await page.keyboard.up('ArrowRight');
   }
   assert.deepEqual(errors,[]);console.log('PASS framing',name,baseline?'baseline':'corrected','offset:',f.fountainX-f.canvasCenter);await context.close();
  }
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
