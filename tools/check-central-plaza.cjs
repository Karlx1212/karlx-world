const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={};vm.runInNewContext(fs.readFileSync('public/js/central-plaza-data.js','utf8').replaceAll('export const ','var '),context);const objects=context.plazaObjects,obstacles=context.plazaObstacles;
assert.equal(objects.length,171);assert.equal(obstacles.length,60);assert.equal(new Set(objects.map(o=>o.id)).size,171);assert.equal(objects.filter(o=>o.type==='bench').length,4);assert.equal(objects.filter(o=>o.type==='lamp').length,8);
for(const o of objects){assert(Number.isFinite(o.depth));assert(o.w>0&&o.h>0);assert(o.src.startsWith('/assets/world/central-plaza/'));assert(fs.existsSync(path.join('public',o.src)));}
for(const o of obstacles){assert(o.w>0&&o.h>0);assert(Number.isFinite(o.x)&&Number.isFinite(o.y));}
const image=fs.readFileSync('public/assets/world/central-plaza/plaza-overlay.png');assert.equal(image.readUInt32BE(16),1245);assert.equal(image.readUInt32BE(20),877);assert.equal(image[25],6,'overlay must be RGBA');
const map=fs.readFileSync('public/js/world-map.js','utf8');assert(map.includes('obstacles: [...fountainObstacles, ...plazaObstacles]'));assert(map.includes('objects: [fountain, ...plazaObjects]'));assert(map.includes("overlay: { src: '/assets/world/central-plaza/plaza-overlay.png', x: 78, y: 91 }"));assert(!map.includes('terrain-static.png'));
console.log('PASS central plaza: 171 objects, shared assets, 60 footprints, RGBA overlay and single fountain collision set');
