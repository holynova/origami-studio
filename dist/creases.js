// Screen-space crease rendering. Paper in Motion, 2026-10-23. GPL-3.0.
import * as T from './vendor/three/three.module.js';

export function createCreases() {
  const geometry = new T.BufferGeometry();
  const material = new T.ShaderMaterial({
    uniforms: {
      resolution: {value: new T.Vector2(1, 1)},
      ink: {value: new T.Color('#482e28')},
      ridge: {value: new T.Color('#fff3d5')},
      accent: {value: new T.Color('#e7a637')},
      foldHighlight: {value: 0},
    },
    vertexShader: `
      attribute vec3 other;
      attribute float side;
      attribute float across;
      attribute float kind;
      uniform vec2 resolution;
      varying float vSide;
      varying float vKind;
      void main() {
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec4 q = projectionMatrix * modelViewMatrix * vec4(other, 1.0);
        vec2 direction = (p.xy / p.w - q.xy / q.w) * resolution;
        float extent = max(length(direction), 0.001);
        vec2 normal = vec2(-direction.y, direction.x) / extent;
        float width = kind < 0.5 ? 3.2 : 7.2;
        p.xy += normal * side * width / resolution * p.w;
        p.z -= 0.0000002 * p.w;
        gl_Position = p;
        vSide = across;
        vKind = kind;
      }
    `,
    fragmentShader: `
      uniform vec3 ink;
      uniform vec3 ridge;
      uniform vec3 accent;
      uniform float foldHighlight;
      varying float vSide;
      varying float vKind;
      void main() {
        float d = abs(vSide);
        float core = 1.0 - smoothstep(0.12, 0.34, d);
        float shadow = (1.0 - smoothstep(0.18, 1.0, d)) * 0.24;
        float light = (1.0 - smoothstep(0.08, 0.25, abs(vSide - 0.43))) * 0.42;
        float emphasis = step(1.5, vKind) * foldHighlight;
        vec3 color = mix(ink, accent, emphasis);
        float alpha = max(core * 0.88, shadow);
        if (vKind > 0.5 && light > alpha) { color = ridge; alpha = light; }
        if (vKind < 0.5) alpha = core * 0.83;
        gl_FragColor = vec4(color, alpha);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: T.DoubleSide,
  });
  const mesh = new T.Mesh(geometry, material);
  mesh.renderOrder = 3;
  mesh.frustumCulled = false;
  return mesh;
}

export function updateCreases(mesh, segments, width, height, active) {
  const positions = [], other = [], sides = [], kinds = [], across = [];
  for (const {a, b, kind} of segments) {
    if (a.distanceToSquared(b) < 1e-8) continue;
    // The end's side is reversed because its direction points back to the start.
    for (const [point, opposite, side] of [
      [a,b,-1], [a,b,1], [b,a,1],
      [b,a,1], [a,b,1], [b,a,-1],
    ]) {
      positions.push(point.x,point.y,point.z);
      other.push(opposite.x,opposite.y,opposite.z);
      sides.push(side);
      across.push(point === a ? side : -side);
      kinds.push(kind);
    }
  }
  const geometry = mesh.geometry;
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('other', new T.Float32BufferAttribute(other,3));
  geometry.setAttribute('side', new T.Float32BufferAttribute(sides,1));
  geometry.setAttribute('kind', new T.Float32BufferAttribute(kinds,1));
  geometry.setAttribute('across', new T.Float32BufferAttribute(across,1));
  mesh.material.uniforms.resolution.value.set(width,height);
  mesh.material.uniforms.foldHighlight.value = active ? 1 : 0;
}

export function creaseKinds(step) {
  const edges = new Map();
  for (const face of step.faces) for(let i=0;i<face.indices.length;i++) {
    const j=(i+1)%face.indices.length;
    const key=[face.indices[i],face.indices[j]].sort((a,b)=>a-b).join(',');
    const record=edges.get(key) ?? {count:0,moving:false,fixed:true};
    record.count++;
    record.moving ||= face.a.some((p,k)=>p.distanceTo(face.b[k])>1);
    record.fixed &&= face.a[i].distanceTo(face.b[i])<1.5 && face.a[j].distanceTo(face.b[j])<1.5;
    edges.set(key,record);
  }
  return new Map([...edges].map(([key,e])=>[key,e.count===1?0:e.moving&&e.fixed?2:1]));
}
