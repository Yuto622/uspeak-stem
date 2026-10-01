// The look of every experiment stage: sky domes, studio floors, lights with shadows,
// glows, drifting motes, procedural textures and a few richer shapes (gears, hearts,
// rounded boxes, tubes). Nothing in here knows a result; builders call these to
// dress what the room already decided.

import * as THREE from './vendor/three.module.js';

// ---- small caches -----------------------------------------------------------
const cache = new Map();
const memo = (key, make) => { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); };
const srgb = (tex) => { tex.colorSpace = THREE.SRGBColorSpace; return tex; };

// A soft round sprite: the base of every glow, mote, spark and star.
export const softTex = () => memo('soft', () => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.25, 'rgba(255,255,255,0.75)'); grd.addColorStop(0.6, 'rgba(255,255,255,0.18)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
});

// ---- materials ---------------------------------------------------------------
export const mat = (color, { rough = 0.55, metal = 0, emissive = 0x000000, emissiveIntensity = 1, flat = false, ...rest } = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, emissive, emissiveIntensity, flatShading: flat, ...rest });
export const metalMat = (color = 0xb8c0c8, extra = {}) => mat(color, { rough: 0.3, metal: 0.85, ...extra });
export const plasticMat = (color, extra = {}) => mat(color, { rough: 0.35, metal: 0.05, ...extra });
export const glassMat = (color = 0xdff3ff, opacity = 0.22) => new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity, roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide, depthWrite: false });
export const glass = (geometry, color, opacity) => { const m = new THREE.Mesh(geometry, glassMat(color, opacity)); m.castShadow = false; m.renderOrder = 3; return m; };
export const woodMat = (tone = 0xa58c62) => mat(0xffffff, { rough: 0.7, map: woodTex(tone) });
export const stoneMat = (tone = 0x9a9585) => mat(0xffffff, { rough: 0.9, map: noiseTex(tone, 0.12) });

// ---- procedural textures -----------------------------------------------------
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;
function shade(n, f) { const c = new THREE.Color(n); c.multiplyScalar(f); return `#${c.getHexString()}`; }

export const woodTex = (tone) => memo(`wood${tone}`, () => {
  const [c, g] = canvas(256, 256);
  g.fillStyle = hex(tone); g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) { g.strokeStyle = shade(tone, 0.82 + Math.random() * 0.3); g.lineWidth = 1 + Math.random() * 3; g.globalAlpha = 0.5; g.beginPath(); const y = Math.random() * 256; g.moveTo(0, y); g.bezierCurveTo(80, y + (Math.random() - 0.5) * 14, 170, y + (Math.random() - 0.5) * 14, 256, y); g.stroke(); }
  g.globalAlpha = 1;
  const t = srgb(new THREE.CanvasTexture(c)); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
});
export const noiseTex = (tone, amount = 0.15) => memo(`noise${tone}${amount}`, () => {
  const [c, g] = canvas(256, 256);
  g.fillStyle = hex(tone); g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) { g.fillStyle = shade(tone, 1 - amount + Math.random() * amount * 2); g.globalAlpha = 0.35; g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 9, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1;
  const t = srgb(new THREE.CanvasTexture(c)); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
});
export const feltTex = (tone) => memo(`felt${tone}`, () => {
  const [c, g] = canvas(256, 256);
  g.fillStyle = hex(tone); g.fillRect(0, 0, 256, 256);
  const d = g.getImageData(0, 0, 256, 256); for (let i = 0; i < d.data.length; i += 4) { const n = (Math.random() - 0.5) * 22; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n; } g.putImageData(d, 0, 0);
  const t = srgb(new THREE.CanvasTexture(c)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t;
});
// A planet: a sea colour, blotches of land, polar caps, a little banding.
export const planetTex = (sea, land, { caps = true, bands = 0, seed = 1 } = {}) => memo(`planet${sea}${land}${caps}${bands}${seed}`, () => {
  const [c, g] = canvas(512, 256); let s = seed; const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  g.fillStyle = hex(sea); g.fillRect(0, 0, 512, 256);
  for (let b = 0; b < bands; b++) { g.fillStyle = shade(sea, 0.85 + rnd() * 0.3); g.globalAlpha = 0.5; g.fillRect(0, (b / bands) * 256, 512, 256 / bands / 2); }
  g.globalAlpha = 1;
  for (let i = 0; i < 26; i++) { const x = rnd() * 512; const y = 40 + rnd() * 176; const r = 12 + rnd() * 40; for (let k = 0; k < 9; k++) { g.fillStyle = shade(land, 0.85 + rnd() * 0.3); g.beginPath(); g.arc(x + (rnd() - 0.5) * r * 1.6, y + (rnd() - 0.5) * r, r * (0.4 + rnd() * 0.5), 0, Math.PI * 2); g.fill(); } }
  if (caps) { g.fillStyle = '#f4f7fb'; g.fillRect(0, 0, 512, 16); g.fillRect(0, 240, 512, 16); g.globalAlpha = 0.6; g.fillRect(0, 16, 512, 10); g.fillRect(0, 230, 512, 10); g.globalAlpha = 1; }
  return srgb(new THREE.CanvasTexture(c));
});
export const cratersTex = () => memo('craters', () => {
  const [c, g] = canvas(512, 256);
  g.fillStyle = '#cfcbc0'; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 160; i++) { const x = Math.random() * 512; const y = Math.random() * 256; const r = 2 + Math.random() * 14; g.fillStyle = `rgba(90,86,78,${0.15 + Math.random() * 0.3})`; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.6, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(120,116,108,0.35)'; g.beginPath(); g.ellipse(Math.random() * 512, 60 + Math.random() * 140, 40 + Math.random() * 60, 25 + Math.random() * 30, 0, 0, Math.PI * 2); g.fill(); }
  return srgb(new THREE.CanvasTexture(c));
});
export const sunTex = (tone = 0xffd36b) => memo(`sun${tone}`, () => {
  const [c, g] = canvas(256, 128);
  g.fillStyle = hex(tone); g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 900; i++) { g.fillStyle = shade(tone, 0.8 + Math.random() * 0.4); g.globalAlpha = 0.5; g.beginPath(); g.arc(Math.random() * 256, Math.random() * 128, 1 + Math.random() * 5, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1; return srgb(new THREE.CanvasTexture(c));
});
// Dice faces: six canvases, pips in a classic layout.
export const diceMats = () => memo('dice', () => {
  const pips = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  return [1, 6, 2, 5, 3, 4].map((n) => { const [c, g] = canvas(128, 128); g.fillStyle = '#fbf8f0'; g.beginPath(); g.roundRect(0, 0, 128, 128, 22); g.fill(); g.fillStyle = n === 1 ? '#d9433a' : '#1c2a3a'; for (const [x, y] of pips[n]) { g.beginPath(); g.arc(64 + x * 32, 64 + y * 32, n === 1 ? 14 : 10, 0, Math.PI * 2); g.fill(); } return mat(0xffffff, { rough: 0.35, map: srgb(new THREE.CanvasTexture(c)) }); });
});

// ---- sky and ground ------------------------------------------------------------
// A dome whose colour runs top → horizon → below, so turning the camera turns the sky.
export function dome(scene, [top, horizon, below], r = 80) {
  const geo = new THREE.SphereGeometry(r, 32, 24); const pos = geo.attributes.position; const col = new Float32Array(pos.count * 3);
  const T = new THREE.Color(top); const Hh = new THREE.Color(horizon); const B = new THREE.Color(below); const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / r; if (y >= 0) c.copy(Hh).lerp(T, Math.pow(y, 0.6)); else c.copy(Hh).lerp(B, Math.pow(-y, 0.5)); col.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })); m.renderOrder = -10; m.userData.noShadow = true; scene.add(m); return m;
}
// Stars with a little colour and size variety, drawn as soft points.
export function stars(scene, n = 500, r = 60, { tint = true } = {}) {
  const pos = new Float32Array(n * 3); const col = new Float32Array(n * 3); const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const th = Math.random() * Math.PI * 2; const ph = Math.acos(2 * Math.random() - 1);
    pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3);
    const k = Math.random(); c.setHSL(tint ? (k < 0.2 ? 0.08 : k < 0.5 ? 0.6 : 0.15) : 0, tint ? 0.5 : 0, 0.75 + Math.random() * 0.25); col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ map: softTex(), vertexColors: true, size: 2.6, sizeAttenuation: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  scene.add(p); return p;
}
// A soft wisp of nebula: a few big additive sprites far away.
export function nebula(scene, colors = [0x3a2a6a, 0x1a3a5a], r = 50) {
  for (let i = 0; i < 5; i++) { const s = glow(colors[i % colors.length], 30 + Math.random() * 30, 0.10); const th = Math.random() * Math.PI * 2; const y = (Math.random() - 0.4) * 30; s.position.set(Math.cos(th) * r, y, Math.sin(th) * r); scene.add(s); }
}
// A round studio floor with a radial light pool and an optional faint grid.
export function ground(scene, { color = 0x8c917c, r = 9, y = -1.5, grid = false, gridColor = 0xffffff, tex = null } = {}) {
  const [c, g] = canvas(256, 256); const C = new THREE.Color(color);
  const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128); grd.addColorStop(0, `#${C.clone().multiplyScalar(1.18).getHexString()}`); grd.addColorStop(0.6, `#${C.getHexString()}`); grd.addColorStop(1, `#${C.clone().multiplyScalar(0.55).getHexString()}`);
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  if (tex) { g.globalAlpha = 0.5; g.drawImage(tex.image, 0, 0, 256, 256); g.globalAlpha = 1; }
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 64), mat(0xffffff, { rough: 0.85, map: srgb(new THREE.CanvasTexture(c)) }));
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; scene.add(m);
  if (grid) {
    const pts = []; const n = Math.floor(r); for (let i = -n; i <= n; i++) { pts.push(new THREE.Vector3(-r, 0, i), new THREE.Vector3(r, 0, i), new THREE.Vector3(i, 0, -r), new THREE.Vector3(i, 0, r)); }
    const l = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: gridColor, transparent: true, opacity: 0.08 })); l.position.y = y + 0.005; scene.add(l);
  }
  return m;
}
// A rectangular bench top with a wood or stone face and a slim apron.
export function slab(scene, { x = 0, y = -1.6, z = 0, w = 8, d = 4, h = 0.25, material = woodMat() } = {}) {
  const m = new THREE.Mesh(roundedBox(w, h, d, 0.05), material); m.position.set(x, y, z); m.receiveShadow = true; m.castShadow = true; scene.add(m); return m;
}

// ---- light --------------------------------------------------------------------
export function studioLights(scene, { key = 0xfff1d0, keyPos = [4, 7, 5], intensity = 2.0, sky = 0xdfe8ff, floor = 0x4a4636, rim = 0x7fd1ff, shadowSize = 12 } = {}) {
  scene.add(new THREE.HemisphereLight(sky, floor, 0.75));
  const k = new THREE.DirectionalLight(key, intensity); k.position.set(...keyPos); k.castShadow = true;
  k.shadow.mapSize.set(1024, 1024); k.shadow.camera.near = 0.5; k.shadow.camera.far = 60;
  k.shadow.camera.left = k.shadow.camera.bottom = -shadowSize; k.shadow.camera.right = k.shadow.camera.top = shadowSize; k.shadow.bias = -0.0008; k.shadow.normalBias = 0.02; k.shadow.radius = 4;
  scene.add(k); scene.add(k.target);
  const f = new THREE.DirectionalLight(0xffffff, 0.35); f.position.set(-5, 3, 4); scene.add(f);
  const rr = new THREE.DirectionalLight(rim, 0.6); rr.position.set(-3, 4, -6); scene.add(rr);
  return k;
}
// After a builder has run: everything solid casts and receives.
export function addShadows(scene) {
  scene.traverse((o) => {
    if (!o.isMesh || o.userData.noShadow) return;
    const m = o.material; const see = Array.isArray(m) ? m[0] : m;
    if (see?.transparent || see?.side === THREE.BackSide || o.isSprite || o.isPoints) { o.castShadow = false; return; }
    if (o.castShadow === undefined || o.castShadow === false) o.castShadow = true;
    o.receiveShadow = true;
  });
}

// ---- glows and particles -------------------------------------------------------
export function glow(color, size = 1, opacity = 0.8) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  s.scale.set(size, size, 1); s.renderOrder = 4; return s;
}
// Drifting motes (dust in a lab, fireflies at dusk, plankton in a pond).
export function motes(scene, { n = 80, box = [8, 4, 6], center = [0, 0, 0], color = 0xffffff, size = 0.12, speed = 0.15, opacity = 0.6 } = {}) {
  const pos = new Float32Array(n * 3); const vel = [];
  for (let i = 0; i < n; i++) { pos.set([center[0] + (Math.random() - 0.5) * box[0], center[1] + (Math.random() - 0.5) * box[1], center[2] + (Math.random() - 0.5) * box[2]], i * 3); vel.push([(Math.random() - 0.5) * speed, (Math.random() - 0.2) * speed, (Math.random() - 0.5) * speed, Math.random() * 6]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ map: softTex(), color, size, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(p);
  anim(scene, (dt, tt) => {
    const a = g.attributes.position;
    for (let i = 0; i < n; i++) {
      const v = vel[i]; let x = a.getX(i) + v[0] * dt + Math.sin(tt + v[3]) * 0.002; let y = a.getY(i) + v[1] * dt; let z = a.getZ(i) + v[2] * dt;
      if (Math.abs(x - center[0]) > box[0] / 2) x = center[0] - (x - center[0]); if (y - center[1] > box[1] / 2) y = center[1] - box[1] / 2; if (Math.abs(z - center[2]) > box[2] / 2) z = center[2] - (z - center[2]);
      a.setXYZ(i, x, y, z);
    }
    a.needsUpdate = true;
  });
  return p;
}
// A burst of sparks or bubbles: particles with their own life, re-emitted from a point.
export function emitter(scene, { n = 40, color = 0xffffff, size = 0.1, rate = 20, life = 1.2, origin = [0, 0, 0], spread = 0.2, vel = [0, 1, 0], gravity = 0, additive = true } = {}) {
  const pos = new Float32Array(n * 3).fill(-999); const parts = Array.from({ length: n }, () => ({ t: life + 1, v: [0, 0, 0] }));
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ map: softTex(), color, size, transparent: true, opacity: 0.9, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
  const p = new THREE.Points(g, m); scene.add(p);
  const state = { on: true, origin: [...origin], acc: 0, rate };
  anim(scene, (dt) => {
    const a = g.attributes.position; state.acc += state.on ? dt * state.rate : 0;
    for (let i = 0; i < n; i++) {
      const q = parts[i];
      if (q.t > life && state.acc >= 1) { state.acc -= 1; q.t = 0; q.v = [vel[0] + (Math.random() - 0.5) * spread * 2, vel[1] + (Math.random() - 0.5) * spread, vel[2] + (Math.random() - 0.5) * spread * 2]; a.setXYZ(i, state.origin[0] + (Math.random() - 0.5) * spread * 0.4, state.origin[1], state.origin[2] + (Math.random() - 0.5) * spread * 0.4); }
      if (q.t <= life) { q.t += dt; q.v[1] -= gravity * dt; a.setXYZ(i, a.getX(i) + q.v[0] * dt, a.getY(i) + q.v[1] * dt, a.getZ(i) + q.v[2] * dt); if (q.t > life) a.setXYZ(i, -999, -999, -999); }
    }
    a.needsUpdate = true;
  });
  p.userData.state = state; return p;
}
// Builders register per-frame work here; the stage runs it before the builder's update.
export function anim(scene, fn) { (scene.userData.anims ||= []).push(fn); }

// ---- shapes -------------------------------------------------------------------
export function roundedBox(w, h, d, r = 0.06) {
  const rr = Math.min(r, w / 2, h / 2, d / 2);
  const s = new THREE.Shape(); const x = -w / 2 + rr; const y = -h / 2 + rr; const W = w - rr * 2; const H = h - rr * 2;
  s.moveTo(x, y - rr); s.lineTo(x + W, y - rr); s.absarc(x + W, y, rr, -Math.PI / 2, 0, false); s.lineTo(x + W + rr, y + H); s.absarc(x + W, y + H, rr, 0, Math.PI / 2, false); s.lineTo(x, y + H + rr); s.absarc(x, y + H, rr, Math.PI / 2, Math.PI, false); s.lineTo(x - rr, y); s.absarc(x, y, rr, Math.PI, Math.PI * 1.5, false);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - rr * 2), bevelEnabled: true, bevelThickness: rr, bevelSize: rr, bevelSegments: 3, curveSegments: 6 });
  g.center(); return g;
}
export function gearGeometry(teeth, r, depth = 0.3, hole = 0.12) {
  const s = new THREE.Shape(); const ro = r; const ri = r * 0.84; const n = teeth * 4;
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; const k = i % 4; const rad = k === 0 || k === 3 ? ri : ro; const x = Math.cos(a) * rad; const y = Math.sin(a) * rad; if (i === 0) s.moveTo(x, y); else s.lineTo(x, y); }
  const h = new THREE.Path(); h.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(h);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 4 }); g.center(); g.rotateX(Math.PI / 2); return g;
}
export function heartGeometry(size = 1, depth = 0.5) {
  const s = new THREE.Shape(); const x = 0; const y = 0;
  s.moveTo(x, y + 0.5); s.bezierCurveTo(x, y + 0.5, x - 0.1, y + 0.9, x - 0.5, y + 0.9); s.bezierCurveTo(x - 1.1, y + 0.9, x - 1.1, y + 0.2, x - 1.1, y + 0.2); s.bezierCurveTo(x - 1.1, y - 0.2, x - 0.7, y - 0.6, x, y - 1.0); s.bezierCurveTo(x + 0.7, y - 0.6, x + 1.1, y - 0.2, x + 1.1, y + 0.2); s.bezierCurveTo(x + 1.1, y + 0.2, x + 1.1, y + 0.9, x + 0.5, y + 0.9); s.bezierCurveTo(x + 0.1, y + 0.9, x, y + 0.5, x, y + 0.5);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.18, bevelSegments: 5, curveSegments: 12 }); g.center(); g.scale(size * 0.5, size * 0.5, size * 0.5); return g;
}
export function tube(points, radius = 0.04, color = 0x333333, { closed = false, segments = 64, metal = false } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, 'catmullrom', 0.2);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, 8, closed), metal ? metalMat(color) : mat(color, { rough: 0.5 }));
}
// A tree in the island's own style: a trunk and two or three leaf tiers.
export function tree(scene, x, z, { h = 1.6, y = -1.5, leaf = 0x3f7a52, trunk = 0x6f5b3e } = {}) {
  const g = new THREE.Group(); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, h * 0.5, 8), mat(trunk, { rough: 0.9 })); t.position.y = h * 0.25; g.add(t);
  for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.55 - i * 0.12, 0.7, 8), mat(leaf, { rough: 0.8, flat: true })); c.position.y = h * 0.45 + i * 0.35; g.add(c); }
  g.position.set(x, y, z); scene.add(g); return g;
}
// A low ring of hills on the horizon, so a sky scene has a ground line.
export function hills(scene, { color = 0x5f8a4e, r = 14, y = -1.6, n = 14 } = {}) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + Math.random() * 0.3; const rr = r + Math.random() * 4; const m = new THREE.Mesh(new THREE.SphereGeometry(3 + Math.random() * 3, 12, 8), mat(color, { rough: 1, flat: true })); m.position.set(Math.cos(a) * rr, y - 2.5 + Math.random(), Math.sin(a) * rr); m.scale.y = 0.6 + Math.random() * 0.3; g.add(m); }
  scene.add(g); return g;
}
export function sunDisc(scene, x, y, z, { r = 0.6, color = 0xffd36b, haze = 0xffe6a8 } = {}) {
  const s = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), new THREE.MeshBasicMaterial({ color, map: sunTex(color), fog: false })); s.position.set(x, y, z); scene.add(s);
  const g1 = glow(haze, r * 7, 0.55); g1.position.copy(s.position); scene.add(g1); const g2 = glow(color, r * 3.2, 0.9); g2.position.copy(s.position); scene.add(g2);
  return s;
}
// Dark-matte vignette on the camera, so edges fall away like a photograph.
export function vignette(camera) {
  const [c, g] = canvas(256, 256); const grd = g.createRadialGradient(128, 128, 70, 128, 128, 180); grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(5,8,20,0.55)'); g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  const q = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false, depthWrite: false, fog: false }));
  q.position.z = -1; q.renderOrder = 20; camera.add(q); return q;
}

// Common dressings, one call per mood.
export const THEMES = {
  space(scene, { lights = true } = {}) { scene.background = new THREE.Color(0x070a1a); dome(scene, [0x05071a, 0x121a3a, 0x05071a]); nebula(scene); stars(scene, 700); if (lights) studioLights(scene, { intensity: 1.6, rim: 0x6a7fff, floor: 0x101020 }); else scene.add(new THREE.AmbientLight(0x223355, 0.35)); },
  lab(scene) { dome(scene, [0x0f1a2a, 0x1e3246, 0x0a1018]); scene.fog = new THREE.Fog(0x14222f, 14, 36); studioLights(scene, { intensity: 2.1, rim: 0x7fd1ff }); motes(scene, { n: 60, color: 0xcfe8ff, size: 0.08, opacity: 0.35 }); },
  sky(scene, { dusk = false } = {}) { dome(scene, dusk ? [0x3b3f7a, 0xf2a46a, 0x2a2a3a] : [0x4e95e8, 0xcfe9f6, 0x8db98a]); scene.fog = new THREE.Fog(dusk ? 0xd9a070 : 0xcfe9f6, 18, 48); studioLights(scene, { intensity: 2.3, rim: 0xffffff, sky: 0xbfdcff, floor: 0x6a8a4a }); },
  night(scene) { dome(scene, [0x05071a, 0x1c2a4a, 0x05071a]); stars(scene, 400); scene.fog = new THREE.Fog(0x0b1026, 16, 40); studioLights(scene, { key: 0xcfd8ff, intensity: 1.3, rim: 0xffd36b, sky: 0x8a9ac8, floor: 0x1a1a2a }); },
};
