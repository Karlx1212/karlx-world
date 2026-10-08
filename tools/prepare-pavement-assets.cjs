// Lossless packaging of native Canvas sampling/reflected repeats, not new art.
// node tools/prepare-pavement-assets.cjs PLAYWRIGHT_MODULE EDGE_EXE PINK_SOURCE CREAM_SOURCE
const {chromium}=require(process.argv[2]);const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
 try{
  const page=await browser.newPage();await page.goto('about:blank');
  for(const [name,file] of [['pearl-pink',process.argv[4]],['cream-stone',process.argv[5]]]){
   const result=await page.evaluate(async base64=>{
    const image=new Image();image.src='data:image/png;base64,'+base64;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    for(const x of [0,1])for(const y of [0,1]){ctx.save();ctx.translate(x?512:0,y?512:0);ctx.scale(x?-1:1,y?-1:1);ctx.drawImage(image,0,0,256,256);ctx.restore()}
    const data=ctx.getImageData(0,0,512,512).data;
    const same=(x,y,xx,yy)=>{for(let c=0;c<4;c++)if(data[(y*512+x)*4+c]!==data[(yy*512+xx)*4+c])throw Error('seam')};
    for(let i=0;i<512;i++){same(0,i,511,i);same(i,0,i,511);same(255,i,256,i);same(i,255,i,256)}
    return canvas.toDataURL('image/png').split(',')[1];
   },fs.readFileSync(file).toString('base64'));
   const dest=path.resolve(__dirname,`../public/assets/world/pavement/${name}.png`);fs.writeFileSync(dest,Buffer.from(result,'base64'));assert.ok(fs.statSync(dest).size>0);console.log('PASS packaged',name,'512x512, exact repeat and internal joins');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
