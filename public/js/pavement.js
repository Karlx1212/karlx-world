const images = new Map();
let surface;
function canvas(width, height) {
  const c = document.createElement('canvas'); c.width = width; c.height = height;
  return c;
}
function load(src) {
  const image = new Image(); images.set(src, image);
  return new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error('No se pudo cargar el pavimento de la plaza.'));
    image.src = src;
  });
}
function pathShape(ctx, worldMap) {
  ctx.beginPath();
  for (const path of worldMap.terrain.paths) {
    path.points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    ctx.closePath();
  }
  const a = worldMap.terrain.promenade;
  ctx.moveTo(a.x+a.rx,a.y);ctx.ellipse(a.x,a.y,a.rx,a.ry,0,0,Math.PI*2);ctx.closePath();
}
function materialTile(material) {
  const image = images.get(material.src);
  const tile = canvas(image.naturalWidth, image.naturalHeight);
  const ctx = tile.getContext('2d');
  ctx.drawImage(image, 0, 0);
  // Color grades retain the original pixel clusters and repeat boundaries.
  if (material.tint) {
    ctx.fillStyle = material.tint;
    ctx.fillRect(0, 0, tile.width, tile.height);
  }
  return tile;
}
function build(worldMap) {
  const material = worldMap.terrain.pavement;
  const { width, height } = worldMap.dimensions;
  surface = canvas(width,height);const ctx = surface.getContext('2d');
  const rose = materialTile(material.plaza);
  const cream = materialTile(material.paths);
  const p = worldMap.terrain.plaza;
  ctx.fillStyle = ctx.createPattern(rose,'repeat');ctx.fillRect(p.x,p.y,p.w,p.h);
  ctx.save();pathShape(ctx,worldMap);ctx.clip();ctx.fillStyle=ctx.createPattern(cream,'repeat');ctx.fillRect(0,0,width,height);ctx.restore();

  // Rasterize the union once, then find its inside border. Internal overlaps
  // (roads entering the promenade) never become decorative dividing lines.
  const mask = canvas(width,height), mctx = mask.getContext('2d');
  pathShape(mctx,worldMap);mctx.fillStyle='#fff';mctx.fill();
  const pixels = mctx.getImageData(0,0,width,height).data;
  const border = canvas(width,height), bctx = border.getContext('2d');
  const edge = bctx.createImageData(width,height), r = material.borderWidth;
  const neighbors = [[r,0],[-r,0],[0,r],[0,-r],[r-2,r-2],[r-2,2-r],[2-r,r-2],[2-r,2-r]];
  for (let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const i=(y*width+x)*4;if(!pixels[i+3])continue;
    if(neighbors.some(([dx,dy]) => x+dx<0||x+dx>=width||y+dy<0||y+dy>=height||pixels[((y+dy)*width+x+dx)*4+3]<128)) {
      edge.data[i]=255;edge.data[i+1]=255;edge.data[i+2]=255;edge.data[i+3]=pixels[i+3];
    }
  }
  bctx.putImageData(edge,0,0);
  const trim=canvas(width,height), tctx=trim.getContext('2d');
  tctx.fillStyle=tctx.createPattern(rose,'repeat');tctx.fillRect(0,0,width,height);
  tctx.globalCompositeOperation='source-atop';tctx.fillStyle='#a8799450';tctx.fillRect(0,0,width,height);
  tctx.globalCompositeOperation='destination-in';tctx.drawImage(border,0,0);
  ctx.drawImage(trim,0,0);
  ctx.imageSmoothingEnabled=false;
  const ornament=material.ornament;
  for(const {x,y} of ornament.positions)ctx.drawImage(images.get(ornament.src),x-ornament.width/2,y-ornament.height/2,ornament.width,ornament.height);
}
export function preparePavement(worldMap) {
  const material = worldMap.terrain.pavement;
  return Promise.all([material.plaza.src,material.paths.src,material.ornament.src].map(load)).then(() => build(worldMap));
}
export function drawPavement(ctx) {
  if(!surface)return;
  ctx.imageSmoothingEnabled=false;ctx.drawImage(surface,0,0);
}
