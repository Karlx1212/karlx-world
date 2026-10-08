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
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
  try {
    const cases = [
      {id:'01',mobile:false,reduced:false},
      ...['02','03','04'].map(id=>({id,mobile:true,reduced:true})),
      {id:'04',mobile:true,reduced:true,slow:true},
      {id:'02',mobile:true,reduced:true,error:true},
      {id:'04',mobile:true,reduced:false},
    ];
    for(const options of process.argv[4] === 'mobile-motion' ? cases.slice(-1) : cases) {
      const context=await browser.newContext({viewport:options.mobile?{width:390,height:844}:{width:1280,height:800},
        isMobile:options.mobile,hasTouch:options.mobile,reducedMotion:options.reduced?'reduce':'no-preference'});
      const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
      if(options.slow||options.error) await page.route('**/outfit-04-front-walk.png',async route=>{
        if(options.error) await route.abort();
        else {await new Promise(r=>setTimeout(r,4500));await route.continue();}
      });
      await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.getElementById('enter').onclick === null && document.getElementById('outfit-label').textContent.includes('01'));
      assert.equal(await page.locator('#boot').isVisible(),false);
      assert.equal(await page.locator('#welcome').isVisible(),true);
      await page.locator('#enter').click();await page.locator('#player-card').waitFor({state:'visible'});
      for(let n=1;n<Number(options.id);n++) await page.locator('#outfit-next').click();
      const checkClass = async () => {
        const expected = classes[Number(options.id)-1];
        assert.equal(await page.locator('#outfit-class').textContent(),expected[0]);
        assert.equal(await page.locator('#outfit-ability').textContent(),expected[1]);
        assert.ok((await page.locator('#outfit-description').textContent()).length>60);
        assert.ok((await page.locator('#outfit-portrait').getAttribute('src')).endsWith(`outfit-${options.id}-idle.png`));
        assert.ok(await page.locator('#player-card').evaluate(el=>el.scrollWidth<=el.clientWidth),'selector fits viewport');
      };
      await checkClass();
      if(options.id==='04' && !options.slow && !options.error) {
        await page.reload({waitUntil:'domcontentloaded'});
        await page.locator('#enter').click();
        await checkClass();
      }
      if(process.argv[5] && !options.slow && !options.error) {
        await page.locator('#outfit-portrait').evaluate(img=>img.decode());
        await page.screenshot({path:path.join(process.argv[5],`class-${options.id}-${options.mobile?'mobile':'desktop'}.png`)});
      }
      const began=Date.now();await page.locator('#launch').click();
      if(!options.reduced||options.slow||options.error) await page.locator('#boot').waitFor({state:'visible'});
      assert.equal(await page.locator('#connection').isVisible(),false);
      if(options.error) {
        await page.locator('#retry').waitFor({state:'visible'});
        assert.equal(await page.locator('#start').isVisible(),true);
      } else {
        await page.locator('#start').waitFor({state:'hidden'});
        if(!options.reduced) assert.ok(Date.now()-began>=3000);
        await page.locator('#explore').waitFor({state:'visible'});await page.locator('#explore').click();
        const selected=await page.evaluate(async()=>{
          const {game}=await import('/js/game.js');
          return {outfit:game.playerOutfit,source:game.playerAppearance.spriteSource,storage:localStorage.getItem('karlx-selected-outfit'),inert:document.getElementById('world').inert};
        });
        assert.equal(selected.outfit,'outfit-'+options.id);
        assert.equal(selected.storage, options.id === '01' ? null : options.id);
        assert.equal(selected.inert,false);
        assert.ok(selected.source.includes('outfit-'+options.id));
        assert.deepEqual(errors,[]);
      }
      await context.close();console.log('PASS browser',options);
    }
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
