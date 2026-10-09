// Pure camera invariants: no DOM, timing or browser dependencies.
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const {cameraAxis}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('public/js/world-camera.js')).toString('base64'));
 let checked=0;
 for(const [width,height,mobile] of [[1880,795,false],[1240,695,false],[2520,975,false],[361,589,true],[306,345,true],[376,621,true],[416,709,true],[800,1200,false]]){
  const base=mobile?Math.max(1.2,width/480,height/640):Math.min(width/1160,height/790);
  const scale=Math.max(base,width/1400,height/960),w=width/scale,h=height/scale;
  for(const [visible,fraction,min,max,legacy,spawn,start,end,near,far] of [[w,.5,-500,1900,1400,700,-458,1858,26,26],[h,.66,-500,1460,960,640,-350,1418,130,0]]){
   const old=Math.max(0,Math.min(legacy-visible,spawn-visible*fraction));
   assert.equal(cameraAxis(spawn,visible,fraction,min,max,legacy,spawn),old,'arrival must match legacy camera');
   let previous;
   for(let player=start;player<=end;player+=.5){
    const camera=cameraAxis(player,visible,fraction,min,max,legacy,spawn);
    assert.ok(camera>=min-1e-8&&camera+visible<=max+1e-8,'viewport outside physical world');
    assert.ok(player-camera>=near-1e-8&&player-camera<=visible-far+1e-8,'avatar outside viewport');
    if(previous!==undefined)assert.ok(camera>=previous-1e-8&&camera-previous<=.500001,'camera jump or discontinuity');
    previous=camera;checked++;
   }
  }
 }
 console.log('PASS camera:',checked,'positions, exact arrival, complete avatar, physical bounds and continuous following');
})().catch(e=>{console.error(e);process.exitCode=1});
