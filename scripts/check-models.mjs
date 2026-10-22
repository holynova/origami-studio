// Verify actual exported mesh area, finite coordinates and rigid animation.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {prepareFace,facePositions,prepareStep,stepPositions} from '../dist/fold.js';
for(const name of ['crane','boat','airplane','butterfly','frog']){
 const model=JSON.parse(readFileSync(new URL(`../dist/models/${name}.json`,import.meta.url)));let drift=0,endpointError=0,areaError=0;
 let projectedError=0;
 for(const step of model.steps){
  const prepared=prepareStep(step);
  for(const t of [.05,.25,.5,.75,.95]){const positions=stepPositions(prepared,t,400);for(const [a,b,length] of prepared.constraints)projectedError=Math.max(projectedError,Math.abs(positions[a].distanceTo(positions[b])-length));}

  let area=0;
  for(const raw of step.faces){
   assert(raw.a.flat().every(Number.isFinite));assert(raw.b.flat().every(Number.isFinite));
   for(let i=1;i+1<raw.uv.length;i++){const [a,b,c]=[raw.uv[0],raw.uv[i],raw.uv[i+1]];area+=Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;}
   const face=prepareFace(raw);if(!face)continue;
   for(const t of [.01,.25,.5,.75,.99]){const positions=facePositions(face,t);for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++)drift=Math.max(drift,Math.abs(positions[i].distanceTo(positions[j])-face.a[i].distanceTo(face.a[j])));}
   for(let i=0;i<raw.a.length;i++)for(let j=i+1;j<raw.a.length;j++)endpointError=Math.max(endpointError,Math.abs(face.a[i].distanceTo(face.a[j])-face.b[i].distanceTo(face.b[j])));
  }
  const xs=model.corners.map(p=>p[0]),ys=model.corners.map(p=>p[1]);const expected=(Math.max(...xs)-Math.min(...xs))*(Math.max(...ys)-Math.min(...ys));areaError=Math.max(areaError,Math.abs(area-expected)/expected);
 }
 assert(projectedError<1.1,`${name} shared mesh length tolerance exceeds budget`);
 assert(drift<1e-7,`${name} rigid animation drifts by ${drift}`);assert(areaError<1e-5,`${name} paper area changes ${areaError}`);assert(endpointError<1.6,`${name} upstream coordinate tolerance exceeds budget`);
 console.log(`${name}: ${model.steps.length} folds; rigid interpolation drift ${drift.toExponential(2)}; paper area error ${areaError.toExponential(2)}; shared mesh tolerance ${(projectedError*150/400).toFixed(3)} mm; source endpoint tolerance ${(endpointError*150/400).toFixed(3)} mm at 150mm width`);
}
