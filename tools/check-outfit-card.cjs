// Usage: node tools/check-entry-browser.cjs PLAYWRIGHT_MODULE BROWSER_EXECUTABLE
const { chromium } = require(process.argv[2]);
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const classes = [
  ['CONTENT CREATOR','VIRAL MODE'], ['COMMUNITY MANAGER','COMMUNITY PULSE'],
  ['EDITORIAL','STORY VISION'], ['DISEÑADORA GRÁFICA','PIXEL PERFECT'],
];
const root = path.resolve(__dirname, '../public');
const server = http.createServer((req,res) => {
  const file=path.resolve(root, '.'+decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file,(error,data)=>{
    if(error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', {'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream');res.end(data);
  });
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
 try{for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile});const page=await context.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle'});await page.locator('#enter').click();
  for(let i=0;i<4;i++){
   if(i)await page.locator('#outfit-next').click();await page.locator('#outfit-portrait').evaluate(img=>img.decode());
   await page.waitForTimeout(35);
   const layout=await page.evaluate(()=>{
    const card=document.querySelector('.player-portrait'),preview=document.querySelector('.outfit-preview'),label=document.getElementById('outfit-label'),details=document.querySelector('.outfit-card-details');
    const rect=el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width}};
    return {card:rect(card),preview:rect(preview),label:rect(label),details:rect(details),inside:['outfit-class','outfit-ability','outfit-description'].every(id=>card.contains(document.getElementById(id))),overflow:card.scrollWidth>card.clientWidth,className:document.getElementById('outfit-class').textContent,description:document.getElementById('outfit-description').textContent};
   });
   assert.equal(layout.inside,true);assert.equal(layout.overflow,false);assert.ok(layout.label.bottom<=layout.preview.top);assert.ok(layout.details.top>=layout.preview.bottom);assert.ok(layout.details.bottom<=layout.card.bottom);assert.equal(layout.className,classes[i][0]);assert.ok(layout.card.bottom-layout.card.top>320);
   if(process.argv[4])await page.locator('.player-portrait').screenshot({path:path.join(process.argv[4],`rpg-card-${i+1}-${mobile?'mobile':'desktop'}.png`)});
   console.log('PASS card',mobile?'mobile':'desktop',i+1,layout.card);
  }await context.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
