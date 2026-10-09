// Native Canvas validation of repeat seams, union transitions and unchanged geometry.
// node tools/check-pavement.cjs PLAYWRIGHT_MODULE EDGE_EXECUTABLE
const {chromium}=require(process.argv[2]);
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../public');
const original=execFileSync('git',['show','952a5d5:public/js/game.js'],{encoding:'utf8'}).replaceAll('\r\n','\n');
const current=fs.readFileSync(path.join(root,'js/game.js'),'utf8').replaceAll('\r\n','\n');
for(const [start,end] of [['function resize()','new ResizeObserver'],['function blocked(','function render('],['function render(','function frame(']]) {
 const normalize=s=>start==='function resize()'?s.replaceAll('FRAMING_REFERENCE','WORLD').replace(/\/\/[^\n]*/g,'').replace(/\s+/g,''):s;
 assert.equal(normalize(current.slice(current.indexOf(start),current.indexOf(end))),normalize(original.slice(original.indexOf(start),original.indexOf(end))),'camera/movement/collisions changed');
}
assert.equal(execFileSync('git',['diff','43793ab','--name-only','--','public/assets/world/magical-fountain','public/js/magical-fountain.js','public/js/fountain-assets.js','public/css','public/js/intro.js','public/js/outfits.js','public/js/player-state.js','public/js/outfit-01-idle.js','public/js/outfit-02-animation.js','public/js/outfit-03-animation.js','public/js/outfit-04-animation.js'],{encoding:'utf8'}).trim(),'','protected resources changed');
const baseline=execFileSync('git',['show','43793ab:public/js/world-map.js'],{encoding:'utf8'});
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
   // Only the approved garden and grass are new; all earlier geometry stays.
   current.objects=current.objects.filter(o=>o.kind!=='garden');
   current.obstacles=current.obstacles.slice(0,12);
   delete current.terrain.grass;delete previous.terrain.texture;
   for(const map of [current,previous])delete map.terrain.pavement;
   if(JSON.stringify(current)!==JSON.stringify(previous))throw Error('protected map data changed');
   const expected=[[550,325],[850,325],[1000,435],[1000,625],[850,735],[550,735],[400,625],[400,435]];
   if(JSON.stringify(m.terrain.plaza.points)!==JSON.stringify(expected))throw Error('geometry C changed');
   const image=new Image();image.src=m.terrain.pavement.surface.src;await image.decode();
   if(image.naturalWidth!==1400||image.naturalHeight!==960)throw Error('surface dimensions changed');
   const {drawPavement}=await import('/js/pavement.js');
   const c=document.createElement('canvas');c.width=1400;c.height=960;const ctx=c.getContext('2d');drawPavement(ctx);
   const data=ctx.getImageData(0,0,1400,960).data;
   const source=document.createElement('canvas');source.width=1400;source.height=960;
   source.getContext('2d').drawImage(image,0,0);const original=source.getContext('2d').getImageData(0,0,1400,960).data;
   for(let i=0;i<data.length;i++)if(data[i]!==original[i])throw Error('ground image stretched or repainted');
   const inPolygon=(x,y,points)=>{
     let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
       const [xi,yi]=points[i],[xj,yj]=points[j];
       if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
     }return inside;
   };
   const polygons=[m.terrain.plaza.points,...m.terrain.paths.map(p=>p.points)];
   const inside=(x,y)=>polygons.some(p=>inPolygon(x,y,p));
   for(let y=0;y<960;y++)for(let x=0;x<1400;x++){
     const alpha=data[(y*1400+x)*4+3];
     if(inside(x+.5,y+.5)&&alpha!==255)throw Error('transparent pavement hole '+x+','+y);
     if(alpha&&!inside(x+.5,y+.5)&&![[0,-7],[0,7],[-7,0],[7,0],[-5,-5],[5,5],[-5,5],[5,-5]].some(([dx,dy])=>inside(x+.5+dx,y+.5+dy)))throw Error('art outside transition fringe');
   }
   for(const [x,y] of [[700,330],[700,730],[410,560],[990,560],[700,640],[700,270]])
     if(data[(y*1400+x)*4+3]!==255)throw Error('junction or spawn not opaque');
   return {protectedGeometry:true,geometryC:true,nativeGroundPixels:true,opaquePavement:true,transitionsContained:true};
  });assert.ok(Object.values(result).every(Boolean));console.log('PASS pavement',result);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
