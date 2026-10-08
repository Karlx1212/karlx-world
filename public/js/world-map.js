// Current scene data only. Drawing, movement and camera remain in game.js.
// Future terrain formats or scenes can provide their own definition here.
const buildings = [
  {type:'studio',x:130,y:245,w:325,h:195,depth:440},
  {type:'lab',x:580,y:145,w:275,h:180,depth:325},
  {type:'shop',x:1010,y:300,w:260,h:185,depth:485},
];
const trees = [[85,380,1.05],[490,280,.8],[920,285,.92],[1320,450,1.1],[160,720,1.15],[1200,765,1.15],[390,860,1.2],[1050,915,1.3]];
const benches = [[440,650],[870,660]];
export const worldMap = {
  id:'current-playground',
  dimensions:{width:1400,height:960},
  spawn:{x:700,y:580},
  walkableBounds:{minX:42,maxX:1358,minY:330,maxY:915},
  obstacles:[
    ...buildings.map(({x,y,w,h})=>({x,y,w,h})),
    ...benches.map(([x,y])=>({x,y,w:150,h:35})),
    ...trees.map(([x,y])=>({x:x-18,y:y-13,w:36,h:26})),
  ],
  // Preserve insertion order for equal-depth objects in the painter's sort.
  objects:[
    ...buildings.map(building=>({...building,kind:'building'})),
    ...trees.map(([x,y,scale])=>({kind:'tree',x,y,scale,depth:y})),
    ...benches.map(([x,y])=>({kind:'bench',x,y,depth:y+35})),
    ...[[340,440],[990,450],[300,760],[1090,740]].map(([x,y])=>({kind:'lamp',x,y,depth:y})),
    {kind:'sign',x:1230,y:550,depth:550},
    ...[[470,425],[955,393],[112,472],[1295,535],[625,830]].map(([x,y])=>({kind:'planter',x,y,depth:y})),
  ],
  terrain:{
    color:'#a5c2aa',
    texture:{count:430,xStep:137,yStep:79,w:3,h:2,colors:['#bdd0ad','#96b69d']},
    paths:[
      {points:[[35,460],[590,330],[1330,445],[1400,665],[710,780],[0,660]],color:'#8b9c92'},
      {points:[[35,450],[590,320],[1330,435],[1400,650],[710,765],[0,645]],color:'#e5dfce'},
      {points:[[650,285],[780,285],[880,960],[690,960]],color:'#e5dfce'},
    ],
    paving:{pathIndex:1,startY:330,endY:780,rowStep:32,columnStep:64,alternateX:30,slant:8,color:'#c9c4b9'},
    plaza:[ [745,549,132,62,'#c4b8cc'],[745,544,124,56,'#e5d9e4'],[745,544,105,47,'#d8cedd'] ],
    emblem:{text:'K',x:745,y:559,size:45,color:'#eee9e8',font:'Georgia'},
    flowers:{positions:[[235,490],[1160,540],[570,745],[955,775]],bed:[28,11,'#829c8a'],count:7,xStep:11,xRange:45,xOffset:20,yCycle:3,yStep:7,stemHeight:12,stemColor:'#6d926d',stemWidth:2,petalWidth:4,petalHeight:3,colors:['#f3eab3','#f4b3c5']},
    sparkles:{count:10,x:260,xStep:103,y:400,yCycle:3,yStep:83,size:5},
  },
  ambient:{background:'#a5c2aa',shade:[[0,'#7672a31a'],[.7,'#ffffff00'],[1,'#51496d26']]},
};
