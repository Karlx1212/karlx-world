// Package the approved two-material atlas using native Canvas nearest sampling.
// node tools/prepare-octagonal-pavement.cjs PLAYWRIGHT EDGE ATLAS CURB
const {chromium}=require(process.argv[2]);
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
 try{
  const page=await browser.newPage();
  const tiles=await page.evaluate(async base64=>{
   const im=new Image();im.src='data:image/png;base64,'+base64;await im.decode();
   return [0,1].map(half=>{
    const c=document.createElement('canvas');c.width=384;c.height=768;
    const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
    for(const x of [0,1])for(const y of [0,1]){
     ctx.save();ctx.translate(x?384:0,y?768:0);ctx.scale(x?-1:1,y?-1:1);
     ctx.drawImage(im,half*im.width/2,0,im.width/2,im.height,0,0,192,384);ctx.restore();
    }
    return c.toDataURL().split(',')[1];
   });
  },fs.readFileSync(process.argv[4]).toString('base64'));
  for(const [i,name] of ['pink','cream'].entries())fs.writeFileSync(path.join(__dirname,`../public/assets/world/pavement/octagonal-${name}.png`),Buffer.from(tiles[i],'base64'));
  const curb=await page.evaluate(async base64=>{
   const im=new Image();im.src='data:image/png;base64,'+base64;await im.decode();
   const c=document.createElement('canvas');c.width=c.height=384;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
   for(const x of [0,1])for(const y of [0,1]){ctx.save();ctx.translate(x?384:0,y?384:0);ctx.scale(x?-1:1,y?-1:1);ctx.drawImage(im,0,0,192,192);ctx.restore()}
   return c.toDataURL().split(',')[1];
  },fs.readFileSync(process.argv[5]).toString('base64'));
  fs.writeFileSync(path.join(__dirname,'../public/assets/world/pavement/octagonal-curb.png'),Buffer.from(curb,'base64'));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
