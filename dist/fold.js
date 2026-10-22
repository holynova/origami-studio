// Rigid face interpolation. Copyright 2026 Paper in Motion. GPL-3.0.
import * as T from './vendor/three/three.module.js';
const v = a => new T.Vector3(...a);
function basis(points,i,j) {
 const x=points[i].clone().sub(points[0]).normalize();
 const normal=points[i].clone().sub(points[0]).cross(points[j].clone().sub(points[0])).normalize();
 return new T.Matrix4().makeBasis(x,normal.clone().cross(x),normal);
}
export function prepareFace(face) {
 const a=face.a.map(v),b=face.b.map(v);let best=0,bi=0,bj=0;
 // The same material vertices must define both reference frames.
 for(let i=1;i<a.length;i++)for(let j=i+1;j<a.length;j++){
  const area=a[i].clone().sub(a[0]).cross(a[j].clone().sub(a[0])).lengthSq();
  if(area>best){best=area;bi=i;bj=j;}
 }
 if(best<1e-12)return null;
 const ma=basis(a,bi,bj),mb=basis(b,bi,bj);
 const rotation=mb.clone().multiply(ma.clone().invert());
 const q=new T.Quaternion().setFromRotationMatrix(rotation).normalize();
 if(q.w<0)q.set(-q.x,-q.y,-q.z,-q.w);
 if(Math.abs(q.w)<1e-7){const axis=[q.x,q.y,q.z],i=axis.reduce((m,x,i)=>Math.abs(x)>Math.abs(axis[m])?i:m,0);if(axis[i]<0)q.set(-q.x,-q.y,-q.z,-q.w);q.w=0;q.normalize();}
 const angle=2*Math.acos(T.MathUtils.clamp(q.w,-1,1));
 const axis=angle>1e-7?new T.Vector3(q.x,q.y,q.z).normalize():new T.Vector3(0,0,1);
 const translation=b[0].clone().sub(a[0].clone().applyQuaternion(q));
 const axial=axis.clone().multiplyScalar(translation.dot(axis));
 const planar=translation.clone().sub(axial);
 const pivot=angle>1e-7?planar.clone().add(axis.clone().cross(planar).multiplyScalar(1/Math.tan(angle/2))).multiplyScalar(.5):new T.Vector3();
 return {...face,a,b,q,axis,angle,pivot,axial,translation};
}
const tempQ=new T.Quaternion();
export function facePositions(face,t) {
 if(t<=0)return face.a;
 if(t>=1)return face.b;
 if(face.angle<1e-7)return face.a.map(p=>p.clone().addScaledVector(face.translation,t));
 tempQ.setFromAxisAngle(face.axis,face.angle*t);
 return face.a.map(p=>p.clone().sub(face.pivot).applyQuaternion(tempQ).add(face.pivot).addScaledVector(face.axial,t));
}
export const ease=t=>t*t*(3-2*t);

// Shared paper vertices stay connected during compound opening folds.
export function prepareStep(raw) {
 const faces=raw.faces.map(prepareFace).filter(Boolean),lookup=new Map(),vertices=[];
 for(const face of faces){face.indices=face.uv.map((uv,i)=>{const key=uv.map(x=>x.toFixed(4)).join(',');if(!lookup.has(key)){lookup.set(key,vertices.length);vertices.push({uv,base:face.a[i]});}return lookup.get(key);});}
 const pairs=new Map();
 for(const f of faces)for(let i=0;i<f.indices.length;i++)for(let j=i+1;j<f.indices.length;j++){
  const a=f.indices[i],b=f.indices[j],key=[a,b].sort((x,y)=>x-y).join(',');if(!pairs.has(key))pairs.set(key,[a,b,Math.hypot(vertices[a].uv[0]-vertices[b].uv[0],vertices[a].uv[1]-vertices[b].uv[1])]);
 }
 return {...raw,faces,vertices,constraints:[...pairs.values()]};
}
export function stepPositions(step,t,iterations=120) {
 const positions=step.vertices.map(()=>new T.Vector3()),counts=new Uint16Array(positions.length);
 for(const f of step.faces){const ps=facePositions(f,t);for(let i=0;i<ps.length;i++){positions[f.indices[i]].add(ps[i]);counts[f.indices[i]]++;}}
 positions.forEach((p,i)=>p.divideScalar(counts[i]));
 if(t<=0||t>=1)return positions;
 const originalCenter=positions.reduce((sum,p)=>sum.add(p),new T.Vector3()).divideScalar(positions.length);
 // Project the shared mesh onto its paper-length constraints, including face diagonals.
 for(let iteration=0;iteration<iterations;iteration++){
  let maxError=0;
  for(const [ai,bi,length] of step.constraints){const a=positions[ai],b=positions[bi],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,distance=Math.hypot(dx,dy,dz);if(distance<1e-9)continue;const error=distance-length;maxError=Math.max(maxError,Math.abs(error));const weight=error/distance*.5;a.x+=dx*weight;a.y+=dy*weight;a.z+=dz*weight;b.x-=dx*weight;b.y-=dy*weight;b.z-=dz*weight;}
  if(maxError<.0001)break;
 }
 const center=positions.reduce((sum,p)=>sum.add(p),new T.Vector3()).divideScalar(positions.length).sub(originalCenter);positions.forEach(p=>p.sub(center));return positions;
}
