// Edge emulation only; synthetic insets are not Safari/iOS validation.
// node tools/check-iphone-layout.cjs PLAYWRIGHT_MODULE EDGE_EXECUTABLE OUTPUT_DIRECTORY [baseline]
const {chromium}=require(process.argv[2]);
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../public'),output=process.argv[4],baseline=process.argv[5]==='baseline';
fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',{'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream');res.end(data)});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
 try{for(const size of [{width:375,height:812},{width:320,height:568},{width:390,height:844},{width:430,height:932},{width:1280,height:800}]){
  const mobile=size.width<600,tag=`${size.width}x${size.height}`,context=await browser.newContext({viewport:size,deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle'});
  if(size.width===375)await page.addStyleTag({content:':root{--safe-top:44px!important;--safe-bottom:34px!important}'});
  await page.evaluate(()=>document.fonts.ready);
  const metrics=[];
  const audit=async(selector)=>{
   const data=await page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return {selector:el.id||el.className,rect:{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom},clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,clientHeight:el.clientHeight,scrollHeight:el.scrollHeight}});
   metrics.push(data);if(!baseline){assert.ok(data.scrollWidth<=data.clientWidth+(selector==='#phone-message'?4:selector.includes('entry-window')||selector==='.player-window'?3:1),'horizontal overflow '+selector);assert.ok(data.rect.x>=-1&&data.rect.x+data.rect.width<=size.width+1,'outside viewport '+selector);}return data;
  };
  const shot=async(name)=>page.screenshot({path:path.join(output,`${tag}-${name}.png`)});
  await audit('.welcome-body');await audit('#welcome .entry-window');await shot('welcome');
  await page.locator('.entry-stamp').scrollIntoViewIfNeeded();await shot('welcome-bottom');
  await page.locator('#enter').click();
  for(let i=0;i<4;i++){
   if(i)await page.locator('#outfit-next').click();await page.locator('#outfit-portrait').evaluate(img=>img.decode());
   await page.locator('#player-card').evaluate(el=>el.scrollTop=0);await audit('.player-window');await audit('.player-portrait');await audit('.player-details');
   await shot(`outfit-${i+1}-top`);
   await page.locator('#launch').scrollIntoViewIfNeeded();await audit('.player-profile');await audit('#outfit-description');await audit('#launch');
   if(!baseline&&mobile){assert.ok(await page.locator('#outfit-description').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=14),'readable description');assert.ok(await page.locator('#launch').evaluate(el=>el.getBoundingClientRect().height>=44));}
   await shot(`outfit-${i+1}-details`);
   // Scroll back so the arrows can be reached on the next iteration.
   await page.locator('#outfit-next').scrollIntoViewIfNeeded();
  }
  await page.locator('#launch').click();await page.locator('#boot').waitFor({state:'visible'});await audit('#boot');await shot('loading');
  await page.locator('#start').waitFor({state:'hidden'});await page.locator('#world-arrival').waitFor({state:'visible'});await audit('#world-arrival');await shot('arrival');
  await page.locator('#chat-actions').waitFor({state:'visible'});await audit('#phone-message');await audit('.phone-display');
  if(!baseline&&mobile){const r=await page.locator('#phone-message').boundingBox();const top=size.width===375?44:0,bottom=size.width===375?34:0;assert.ok(r.y>=top&&r.y+r.height<=size.height-bottom,'phone outside safe area');}
  await page.locator('.phone-conversation').evaluate(el=>el.scrollTop=0);await shot('phone-messages');
  await page.locator('#explore').scrollIntoViewIfNeeded();await audit('#chat-actions');await shot('phone-actions');
  await page.locator('#explore').click();await page.locator('#movement-tip').waitFor({state:'hidden'});await audit('.desktop');await audit('.location');await audit('.audio-controls');await audit('.controls');await shot('playground');
  if(!baseline&&mobile){
   const a=await page.locator('.audio-controls').boundingBox(),f=await page.locator('.status-bar').boundingBox();assert.ok(a.y>=f.y+f.height,'audio does not cover footer');
   for(const id of ['#music-toggle','#sound-toggle','#back'])assert.ok(await page.locator(id).evaluate(el=>el.getBoundingClientRect().height>=44),'touch target '+id);
   assert.equal(await page.evaluate(()=>window.visualViewport.scale),1,'zoom remains 100%');
  }
  if(!baseline&&size.width===375){
   await page.setViewportSize({width:375,height:700});await page.waitForTimeout(100);
   const d=await page.locator('.desktop').boundingBox();assert.ok(d.height<=700,'dynamic viewport fits reduced browser area');
   await page.setViewportSize(size);
   await page.locator('#back').click();
   // Layout stress test with primary text 25% larger, without changing browser zoom.
   await page.evaluate(()=>document.querySelectorAll('.editorial-copy,.quick-option,.player-details dd,.player-profile p,.chat-bubble,.entry-button').forEach(el=>{el.style.fontSize=parseFloat(getComputedStyle(el).fontSize)*1.25+'px';}));
   await page.locator('#enter').scrollIntoViewIfNeeded();await shot('larger-text-welcome');await page.locator('#enter').click();
   await page.locator('#launch').scrollIntoViewIfNeeded();await shot('larger-text-details');
   assert.ok(await page.locator('.player-details').evaluate(el=>el.scrollWidth<=el.clientWidth));
   assert.equal(await page.evaluate(()=>window.visualViewport.scale),1);
  }
  if(!baseline&&!mobile&&process.argv[5]) {
   const before=JSON.parse(fs.readFileSync(path.join(process.argv[5],tag+'-metrics.json'),'utf8'));
   assert.deepEqual(metrics.filter(m=>m.selector!=='phone-display'),before,'desktop layout unchanged');
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,`${tag}-metrics.json`),JSON.stringify(metrics,null,2));
  console.log('PASS layout',tag,mobile?'DPR 3':'desktop',baseline?'baseline':'responsive');await context.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());

