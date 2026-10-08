// Usage: node tools/check-entry-browser.cjs PLAYWRIGHT_MODULE BROWSER_EXECUTABLE
const { chromium } = require(process.argv[2]);
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const classes = [
  ['CONTENT CREATOR','MODO VIRAL'], ['COMMUNITY MANAGER','PULSO COMUNITARIO'],
  ['PRODUCCIÓN AUDIOVISUAL','VISIÓN NARRATIVA'], ['DISEÑADORA GRÁFICA','PÍXEL PERFECTO'],
];
const root = path.resolve(__dirname, '../public');
const server = http.createServer((req,res) => {
  const file=path.resolve(root, '.'+decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file,(error,data)=>{
    if(error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', {'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream');res.end(data);
  });
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
 try {
  for(const mobile of [false,true]) for(const reduced of [false,true]) {
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference'});
   const page=await context.newPage();await page.route('**/outfit-03-idle.png',async route=>{await new Promise(r=>setTimeout(r,800));await route.continue()});
   await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'domcontentloaded'});
   await page.locator('#enter').click();await page.locator('#outfit-portrait').evaluate(i=>i.decode());
   await page.evaluate(()=>{
    window.portraitFrames=[];window.monitorPortrait=true;
    const bounds={ '01':[8,42,368,981], '02':[8,42,371,980], '03':[0,42,362,981], '04':[0,42,360,971] };
    function frame(){
     const image=document.getElementById('outfit-portrait'),css=getComputedStyle(image),stage=image.parentElement.getBoundingClientRect();
     const id=(image.currentSrc.match(/outfit-(\d+)-idle/)||[])[1];
     if(id){const ratio=image.naturalWidth/image.naturalHeight;const h=Math.min(parseFloat(css.height),parseFloat(css.width)/ratio);
      window.portraitFrames.push({id,visibleHeight:h*(bounds[id][3]-bounds[id][1])/image.naturalHeight,reference:204*stage.width/92,stage:[stage.width,stage.height],width:image.width,height:image.height,natural:image.naturalWidth});
     }else window.portraitFrames.push({missing:true});
     if(window.monitorPortrait)requestAnimationFrame(frame);
    } requestAnimationFrame(frame);
   });
   for(const button of ['next','next','next','previous','previous','previous']){
    await page.locator('#outfit-'+button).click();
    await page.waitForTimeout(100);
   }
   await page.waitForTimeout(900);
   for(let n=0;n<20;n++)await page.locator('#outfit-'+(n%3?'next':'previous')).click();
   await page.waitForTimeout(100);
   const frames=await page.evaluate(()=>{window.monitorPortrait=false;return window.portraitFrames});
   assert.ok(frames.length>30);assert.ok(frames.every(f=>!f.missing),'no undecoded image frame');
   for(const f of frames){assert.ok(Math.abs(f.visibleHeight-f.reference)<0.3,JSON.stringify(f));assert.deepEqual(f.stage,frames[0].stage);}
   for(const button of ['next','next','next','previous','previous','previous']){
    await page.locator('#outfit-'+button).click();await page.waitForTimeout(35);
    const result=await page.evaluate(()=>({source:document.getElementById('outfit-portrait').src,selected:localStorage.getItem('karlx-selected-outfit')}));
    assert.ok(result.source.includes('outfit-'+result.selected));
   }
   console.log('PASS stable frames',mobile?'mobile':'desktop',reduced?'reduced':'normal',frames.length);
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
