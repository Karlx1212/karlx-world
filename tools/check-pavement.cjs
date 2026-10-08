// Native Canvas validation of repeat seams, union transitions and unchanged geometry.
// node tools/check-pavement.cjs PLAYWRIGHT_MODULE EDGE_EXECUTABLE
const {chromium}=require(process.argv[2]);
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../public');
const original=execFileSync('git',['show','952a5d5:public/js/game.js'],{encoding:'utf8'}).replaceAll('\r\n','\n');
const current=fs.readFileSync(path.join(root,'js/game.js'),'utf8').replaceAll('\r\n','\n');
for(const [start,end] of [['function resize()','new ResizeObserver'],['function blocked(','function render('],['function render(','function frame(']])assert.equal(current.slice(current.indexOf(start),current.indexOf(end)),original.slice(original.indexOf(start),original.indexOf(end)),'camera/movement/collisions changed');
assert.equal(execFileSync('git',['diff','0656656','--name-only','--','public/assets/world/magical-fountain','public/assets/world/pavement','public/js/pavement.js','public/js/magical-fountain.js','public/js/fountain-assets.js','public/css','public/js/intro.js','public/js/outfits.js','public/js/player-state.js','public/js/outfit-01-idle.js','public/js/outfit-02-animation.js','public/js/outfit-03-animation.js','public/js/outfit-04-animation.js'],{encoding:'utf8'}).trim(),'','protected resources changed');
const baseline=execFileSync('git',['show','952a5d5:public/js/world-map.js'],{encoding:'utf8'});
const server=http.createServer((req,res)=>{
 if(req.url==='/js/__baseline-world.js'){res.setHeader('Content-Type','text/javascript');return res.end(baseline)}
 const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':req.url));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(e,data)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',{'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream');res.end(data)});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
 try{
  const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle'});
  const result=await page.evaluate(async()=>{
   const {game}=await import('/js/game.js');await game.ready;
   const {worldMap:m}=await import('/js/world-map.js'),{worldMap:b}=await import('/js/__baseline-world.js');
   const current=JSON.parse(JSON.stringify(m)),previous=JSON.parse(JSON.stringify(b));
   for(const map of [current,previous])for(const key of ['pavement','plaza','promenade'])delete map.terrain[key];
   // Only the approved north extension may differ from the original map.
   previous.walkableBounds.minY=270;
   previous.terrain.paths[0].points=[[640,270],[760,270],[760,460],[640,460]];
   if(JSON.stringify(current)!==JSON.stringify(previous))throw Error('protected map data changed');
   const expected=[[550,325],[850,325],[1000,435],[1000,625],[850,735],[550,735],[400,625],[400,435]];
   if(JSON.stringify(m.terrain.plaza.points)!==JSON.stringify(expected)||m.terrain.promenade)throw Error('octagonal geometry regression');
   const {drawPavement}=await import('/js/pavement.js');const tiles={};
   for(const name of ['plaza','paths','curb']){
    const material=m.terrain.pavement[name],im=new Image();im.src=material.src;await im.decode();
    const tile=document.createElement('canvas');tile.width=im.naturalWidth;tile.height=im.naturalHeight;const ctx=tile.getContext('2d');ctx.drawImage(im,0,0);const w=tile.width,h=tile.height,a=ctx.getImageData(0,0,w,h).data;
    const same=(x,y,xx,yy)=>{for(let c=0;c<4;c++)if(a[(y*w+x)*4+c]!==a[(yy*w+xx)*4+c])throw Error('repeat seam '+name)};
    for(let y=0;y<h;y++){same(0,y,w-1,y);same(w/2-1,y,w/2,y)}
    for(let x=0;x<w;x++){same(x,0,x,h-1);same(x,h/2-1,x,h/2)}
    for(let i=3;i<a.length;i+=4)if(a[i]!==255)throw Error('transparent tile hole');
    if(material.color){ctx.fillStyle=material.color;ctx.fillRect(0,0,w,h)}
    else if(material.tint){ctx.fillStyle=material.tint;ctx.fillRect(0,0,w,h)}
    tiles[name]={w,h,data:ctx.getImageData(0,0,w,h).data};
   }
   const c=document.createElement('canvas');c.width=1400;c.height=960;const ctx=c.getContext('2d');drawPavement(ctx);const data=ctx.getImageData(0,0,1400,960).data;
   const inPlaza=(x,y)=>{
    let inside=false;for(let i=0,j=expected.length-1;i<expected.length;j=i++){
     const [xi,yi]=expected[i],[xj,yj]=expected[j];
     if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
    }return inside;
   };
   const inside=(x,y)=>{
    if(inPlaza(x,y))return true;
    if(m.terrain.paths.some(p=>x>=p.points[0][0]&&x<p.points[1][0]&&y>=p.points[0][1]&&y<p.points[2][1]))return true;
    return false;
   };
   for(let y=0;y<960;y++)for(let x=0;x<1400;x++){
    const alpha=data[(y*1400+x)*4+3];if(alpha&&!inside(x+.5,y+.5)&&![[0,-1],[0,1],[-1,0],[1,0]].some(([dx,dy])=>inside(x+.5+dx,y+.5+dy)))throw Error('surface outside octagonal geometry');
    if([[0,0],[0,-2],[0,2],[-2,0],[2,0]].every(([dx,dy])=>inPlaza(x+.5+dx,y+.5+dy))&&alpha!==255)throw Error('plaza has hole '+x+','+y+' alpha '+alpha);
   }
   for(const [x,y] of [[700,324],[700,420],[700,725],[700,745],[399,560],[401,560],[999,560],[1001,560]])for(let k=0;k<4;k++){
    const tile=inPlaza(x,y)?tiles.plaza:tiles.paths;
    if(data[(y*1400+x)*4+k]!==tile.data[((y%tile.h)*tile.w+(x%tile.w))*4+k])throw Error('internal border at road/plaza junction');
   }
   return {protectedGeometry:true,octagonalPlatform:true,repeatEdgesExact:true,internalJoinsExact:true,opaquePlaza:true,surfaceContained:true,cleanRoadTransitions:true};
  });assert.ok(Object.values(result).every(Boolean));console.log('PASS pavement',result);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
