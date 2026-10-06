const canvas = document.querySelector('#world');
const ctx = canvas.getContext('2d');
const hud = document.querySelector('#hud');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const WORLD = { width: 1400, height: 960 };
const player = { x: 700, y: 580, speed: 210, moving: false, facing: 'down' };
// Replace this manifest with professional directional frames later.
const character = { src: '/assets/characters/karlx/idle-front.png', width: 52, height: 122 };
const sprite = new Image();
const keys = new Set();
let active = false;
let ready = false;
let previous = 0;
let walkTime = 0;
let view = { width: 1, height: 1, scale: 1, x: 0, y: 0 };
// Future sound integration can subscribe without loading audio now.
const gameEvents = new EventTarget();
const obstacles = [
  { x: 130, y: 245, w: 325, h: 195 },
  { x: 580, y: 145, w: 275, h: 180 },
  { x: 1010, y: 300, w: 260, h: 185 },
  { x: 440, y: 650, w: 150, h: 35 },
  { x: 870, y: 660, w: 150, h: 35 },
];
const trees = [[85,380,1.05],[490,280,.8],[920,285,.92],[1320,450,1.1],[160,720,1.15],[1200,765,1.15],[390,860,1.2],[1050,915,1.3]];
for (const [x,y] of trees) obstacles.push({x:x-18,y:y-13,w:36,h:26});
function resize() {
  const box = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(box.width*dpr);
  canvas.height = Math.round(box.height*dpr);
  view.width = box.width; view.height = box.height;
  view.scale = Math.min(box.width/1160,box.height/790);
}
new ResizeObserver(resize).observe(canvas);
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function line(x1,y1,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function poly(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
function text(value,x,y,size,color='#43435f',font='monospace'){ctx.fillStyle=color;ctx.font=`${size}px ${font}`;ctx.textAlign='center';ctx.fillText(value,x,y);}
function floor(time){
  rect(0,0,1400,960,'#a5c2aa');
  // A deterministic texture keeps the world stable between frames.
  for(let i=0;i<430;i++){let x=(i*137)%1400,y=(i*79)%960;rect(x,y,3,2,i%3?'#96b69d':'#bdd0ad');}
  poly([[35,460],[590,330],[1330,445],[1400,665],[710,780],[0,660]],'#8b9c92');
  poly([[35,450],[590,320],[1330,435],[1400,650],[710,765],[0,645]],'#e5dfce');
  poly([[650,285],[780,285],[880,960],[690,960]],'#e5dfce');
  ctx.save();ctx.beginPath();[[35,450],[590,320],[1330,435],[1400,650],[710,765],[0,645]].forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();
  for(let y=330;y<780;y+=32){line(0,y,1400,y,'#c9c4b9');for(let x=(y%64?0:30);x<1400;x+=64)line(x,y,x+8,y+32,'#c9c4b9');}ctx.restore();
  ellipse(745,549,132,62,'#c4b8cc');ellipse(745,544,124,56,'#e5d9e4');ellipse(745,544,105,47,'#d8cedd');
  text('K',745,559,45,'#eee9e8','Georgia');
  for(const [x,y] of [[235,490],[1160,540],[570,745],[955,775]]){ellipse(x,y,28,11,'#829c8a');for(let i=0;i<7;i++){const fx=x+(i*11)%45-20,fy=y-(i%3)*7;line(fx,fy,fx,fy-12,'#6d926d',2);ellipse(fx,fy-12,4,3,i%2?'#f4b3c5':'#f3eab3');}}
  for(let i=0;i<10;i++){const x=260+i*103,y=400+(i%3)*83;const alpha=reducedMotion?.45:.3+.3*Math.sin(time*.001+i);ctx.globalAlpha=Math.max(.05,alpha);sparkle(x,y,5);ctx.globalAlpha=1;}
}
function sparkle(x,y,s){poly([[x,y-s],[x+2,y-2],[x+s,y],[x+2,y+2],[x,y+s],[x-2,y+2],[x-s,y],[x-2,y-2]],'#fff9e8');}
function building(x,y,w,h,type){
  const palette = type==='studio'?['#eee2d0','#d1bcb7','#b29db6']:type==='lab'?['#b8d7e3','#8ba7bf','#8e8caf']:['#edd1da','#c0a2bd','#9894ae'];
  ellipse(x+w*.56,y+h+23,w*.64,31,'#536a7040');
  poly([[x+w,y],[x+w+35,y-28],[x+w+35,y+h-28],[x+w,y+h]],palette[1]);
  rect(x,y,w,h,palette[0]);
  poly([[x-10,y],[x+30,y-43],[x+w+40,y-43],[x+w+10,y]],palette[2]);
  line(x-10,y,x+w+10,y,'#f4eef6',4);line(x+30,y-43,x+w+40,y-43,'#68667f',3);
  rect(x+12,y+12,w-24,33,'#f4f0e8');
  text(type==='studio'?'ESTUDIO CREATIVO':type==='lab'?'LAB. COMERCIO ONLINE':'TIENDA DE SERVICIOS',x+w/2,y+34,type==='studio'?17:15);
  for(let i=0;i<4;i++){line(x+12,y+60+i*31,x+w-12,y+60+i*31,palette[1]);}
  if(type==='studio'){
    rect(x+18,y+61,190,112,'#6d7485');rect(x+23,y+66,180,102,'#adbfca');
    poly([[x+25,y+67],[x+117,y+67],[x+25,y+135]],'#dfe5de');
    rect(x+35,y+89,48,60,'#f0bbce');text('HAZ',x+59,y+110,11);text('LO',x+59,y+126,13);text('REAL.',x+59,y+141,10);
    rect(x+126,y+99,59,43,'#e8e0bf');poly([[x+144,y+106],[x+177,y+115],[x+153,y+133]],'#8f83ae');
    line(x+111,y+65,x+111,y+169,'#f8efe2',5);line(x+21,y+149,x+204,y+149,'#eee8dd',4);
    rect(x+226,y+61,70,130,'#777782');rect(x+232,y+67,58,121,'#9dacc0');rect(x+239,y+79,44,68,'#d7c6db');text('01',x+260,y+121,25,'#7d728e');rect(x+275,y+153,4,4,'#f9efbd');
  }else if(type==='lab'){
    rect(x+17,y+61,w-34,h-67,'#6e819f');rect(x+23,y+67,w-46,h-79,'#a9c8dd');
    for(let i=1;i<4;i++)line(x+18+i*(w-36)/4,y+62,x+18+i*(w-36)/4,y+h-6,'#e0e6f1',4);
    rect(x+38,y+86,100,53,'#56627d');rect(x+43,y+91,90,42,'#bedbbc');text('hola, mundo',x+87,y+113,9,'#3f6767');
    rect(x+168,y+93,54,48,'#dddce9');ellipse(x+195,y+117,18,18,'#929eb6');ellipse(x+195,y+117,5,5,'#dae5ed');
    line(x+26,y+70,x+107,y+h-16,'#f1f6fa88',9);
  }else{
    rect(x+15,y+66,145,103,'#766c87');rect(x+20,y+71,135,94,'#d5becf');
    line(x+66,y+104,x+57,y+151,'#534963',3);poly([[x+57,y+96],[x+75,y+96],[x+88,y+128],[x+48,y+128]],'#333348');
    rect(x+108,y+117,30,34,'#a989c3');line(x+114,y+117,x+114,y+109,'#706284',2);line(x+132,y+117,x+132,y+109,'#706284',2);
    rect(x+180,y+66,60,119,'#8c7794');rect(x+185,y+72,50,72,'#e4cddd');text('ABIERTO',x+209,y+107,10);rect(x+226,y+151,4,4,'#f9efbd');
    for(let i=0;i<8;i++){poly([[x+10+i*30,y+54],[x+40+i*30,y+54],[x+46+i*30,y+85],[x+16+i*30,y+85]],i%2?'#f4e6de':'#b881a1');ellipse(x+31+i*30,y+85,15,6,i%2?'#f4e6de':'#b881a1');}
  }
  rect(x-6,y+h,w+17,8,'#9493a3');rect(x-14,y+h+8,w+28,7,'#b5b0b5');
}
function tree(x,y,s,time){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ellipse(3,0,44,13,'#5b776c45');rect(-8,-65,16,67,'#897f75');rect(-3,-65,5,60,'#a39b85');const sway=reducedMotion?0:Math.sin(time*.00065+x)*1.5;ctx.translate(sway,0);ellipse(0,-82,42,47,'#688f87');ellipse(-21,-91,31,30,'#7ca397');ellipse(18,-104,31,33,'#92b0a0');ellipse(-5,-119,29,31,'#a1bb9d');for(let i=0;i<8;i++)rect((i*17)%60-30,-80-(i*23)%60,5,3,'#c3cfad');ctx.restore();}
function bench(x,y){ellipse(x+75,y+15,88,14,'#6b737030');for(let i=0;i<3;i++)rect(x,y-28+i*9,150,6,'#b496a5');rect(x,y,150,12,'#ceafb9');for(let dx of [10,130]){rect(x+dx,y-30,5,50,'#696b7d');line(x+dx-7,y+20,x+dx+13,y+20,'#696b7d',3);}}
function lamp(x,y,time){ellipse(x,y,18,7,'#526e7140');rect(x-3,y-110,6,110,'#666880');rect(x-10,y-3,20,6,'#666880');poly([[x-14,y-116],[x,y-127],[x+14,y-116]],'#707088');rect(x-10,y-115,20,24,'#e9dfa9');line(x,y-116,x,y-91,'#666880',2);if(!reducedMotion){ctx.globalAlpha=.1+.04*Math.sin(time*.002);ellipse(x,y-105,30,29,'#fff5bc');ctx.globalAlpha=1;}}
function sign(x,y){rect(x-3,y-90,6,90,'#8d869a');rect(x-62,y-101,124,44,'#f5eddc');rect(x-65,y-105,130,4,'#9586ad');text('BARRIO CREATIVO',x,y-83,9);text('FUND. ~2000',x,y-68,8,'#9d829a');}
function planter(x,y){ellipse(x,y+4,24,8,'#62756e45');poly([[x-20,y-24],[x+20,y-24],[x+15,y+3],[x-15,y+3]],'#b49fac');ellipse(x,y-24,21,6,'#ddc3cc');for(let i=0;i<6;i++){line(x,y-24,x+(i-3)*6,y-48-(i%2)*13,'#647f76',3);ellipse(x+(i-3)*6,y-48-(i%2)*13,7,13,i%2?'#8caa91':'#aaba8c');}}
function drawPlayer(){ellipse(player.x,player.y+3,23,8,'#3e45674a');const bounce=player.moving&&!reducedMotion?Math.sin(walkTime*17)*2:0;ctx.imageSmoothingEnabled=true;ctx.drawImage(sprite,player.x-character.width/2,player.y-character.height+bounce,character.width,character.height);}
function blocked(x,y){if(x<42||x>1358||y<330||y>915)return true;return obstacles.some(o=>x+11>o.x&&x-11<o.x+o.w&&y+5>o.y&&y-5<o.y+o.h);}
function update(dt){if(!active){player.moving=false;return;}let dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));let dy=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));const len=Math.hypot(dx,dy);const before={x:player.x,y:player.y};if(len){dx=dx/len*player.speed*dt;dy=dy/len*player.speed*dt;if(!blocked(player.x+dx,player.y))player.x+=dx;if(!blocked(player.x,player.y+dy))player.y+=dy;player.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');}player.moving=before.x!==player.x||before.y!==player.y;if(player.moving)walkTime+=dt;else walkTime=0;}
function render(time){const dpr=canvas.width/view.width;ctx.setTransform(dpr,0,0,dpr,0,0);rect(0,0,view.width,view.height,'#a5c2aa');const visibleW=view.width/view.scale,visibleH=view.height/view.scale;view.x=Math.max(0,Math.min(WORLD.width-visibleW,player.x-visibleW/2));view.y=Math.max(0,Math.min(WORLD.height-visibleH,player.y-visibleH*.66));ctx.translate(-view.x*view.scale,-view.y*view.scale);ctx.scale(view.scale,view.scale);floor(time);
  const objects=[{y:440,draw:()=>building(130,245,325,195,'studio')},{y:325,draw:()=>building(580,145,275,180,'lab')},{y:485,draw:()=>building(1010,300,260,185,'shop')},...trees.map(([x,y,s])=>({y,draw:()=>tree(x,y,s,time)})),...[[440,650],[870,660]].map(([x,y])=>({y:y+35,draw:()=>bench(x,y)})),...[[340,440],[990,450],[300,760],[1090,740]].map(([x,y])=>({y,draw:()=>lamp(x,y,time)})),{y:550,draw:()=>sign(1230,550)},...[[470,425],[955,393],[112,472],[1295,535],[625,830]].map(([x,y])=>({y,draw:()=>planter(x,y)}))];if(ready)objects.push({y:player.y,draw:drawPlayer});objects.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
  ctx.setTransform(dpr,0,0,dpr,0,0);const shade=ctx.createLinearGradient(0,0,0,view.height);shade.addColorStop(0,'#7672a31a');shade.addColorStop(.7,'#ffffff00');shade.addColorStop(1,'#51496d26');ctx.fillStyle=shade;ctx.fillRect(0,0,view.width,view.height);
}
function frame(time){const dt=previous?Math.min((time-previous)/1000,.05):0;previous=time;update(dt);render(time);requestAnimationFrame(frame);}
const movementKeys=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
window.addEventListener('keydown',event=>{const key=event.key.toLowerCase();if(active&&movementKeys.includes(key)){event.preventDefault();keys.add(key);}});
window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{keys.clear();previous=0;});
let resolveReady;
let rejectReady;
const assetsReady = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
sprite.onload=()=>{ready=true;resolveReady();};
sprite.onerror=()=>{const error=document.querySelector('#error');error.hidden=false;error.textContent='No se pudo cargar a KARLX. Recargá la página para volver a intentarlo.';rejectReady(new Error('No se pudo cargar a KARLX.'));};
export const game = {
  ready: assetsReady,
  events: gameEvents,
  reveal() { hud.hidden=false; active=false; keys.clear(); },
  resume() { if(!ready)return; active=true; keys.clear(); canvas.focus({preventScroll:true}); gameEvents.dispatchEvent(new Event('enter')); },
  pause() { active=false; keys.clear(); },
  menu() { active=false; keys.clear(); hud.hidden=true; gameEvents.dispatchEvent(new Event('menu')); },
};
document.querySelector('#back').addEventListener('click',()=>game.menu());
sprite.src=character.src;
resize();requestAnimationFrame(frame);
