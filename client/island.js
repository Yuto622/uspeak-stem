// The two STEM islands, built with U-Speak Web's island kit so they look like the
// islands a child already knows: layered voxel ground, a jetty, timber houses with
// their names on a bracket, lamps along the paths, a day sky over open water.
//
// COSMOS sits at the origin and LAB 135 m east, the same spacing the English world
// uses for its second island, so the sea between them reads as sea and not as a gap.

import * as THREE from './vendor/three.module.js';
import { createIsland, NEAR_DISTANCE, shade } from './island-kit.js';
import { t, onLang } from './i18n.js';
import { buildIsland, animateIslands } from './islands-build.js';
import { phaseAt } from './world-clock.js';

const SPEED = 9;
const CAMERA = { yaw: 0.55, pitch: 0.04, zoom: 32 };

export function createWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xd3b99b, 0.0075);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 600);

  // Sky: a dome shaded from a warm horizon to a blue zenith, the colours of the English
  // world's daytime sky shader, without the shader.
  const skyGeo = new THREE.SphereGeometry(280, 24, 16);
  const colors = new Float32Array(skyGeo.attributes.position.count * 3);
  const horizon = new THREE.Color(0.99, 0.70, 0.43); const zenith = new THREE.Color(0.19, 0.45, 0.61);
  for (let i = 0; i < skyGeo.attributes.position.count; i++) {
    const y = skyGeo.attributes.position.getY(i) / 280;
    const c = horizon.clone().lerp(zenith, Math.pow(Math.max(y, 0), 0.48));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  skyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false, fog: false }));
  scene.add(sky);

  const hemi = new THREE.HemisphereLight(0xd6e9f1, 0x7b794c, 1.5); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffd19b, 3.4);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 1, far: 140 });
  sun.shadow.bias = -0.0008;
  scene.add(sun); scene.add(sun.target);

  // Open water, and the far coast of stepped islands and slow clouds the English world has.
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshStandardMaterial({ color: 0x64b9c0, metalness: 0.32, roughness: 0.24, transparent: true, opacity: 0.9 }));
  water.rotation.x = -Math.PI / 2; water.position.set(200, -1.55, 60); water.receiveShadow = true; scene.add(water);
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const box = (x, y, z, w, h, d, color, parent = scene) => { const m = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color, roughness: 0.85 })); m.position.set(x, y, z); m.scale.set(w, h, d); parent.add(m); return m; };
  let s = 7;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  // Far enough into the haze to read as a coast, not as blocks in the sky.
  for (let i = 0; i < 40; i++) { const x = -160 + i * 20; const z = -150 - rand() * 40; const h = 5 + rand() * 10; box(x, -4, z, 18, h, 14, 0x9fb5ad); box(x, h / 2 - 3, z, 14, 2, 11, 0x9cb09e); box(x + 1, h / 2 - 1, z, 8, 3, 8, 0xa9b9a7); }
  const clouds = [];
  for (let i = 0; i < 30; i++) { const g = new THREE.Group(); g.position.set((rand() - 0.5) * 600 + 200, 28 + rand() * 18, -30 - rand() * 50 + (i % 2 ? 160 : 0)); scene.add(g); for (let j = 0; j < 5; j++) box(j * 3, rand() * 1.1, rand() * 2, 5, 1.2, 3.5, 0xedf0df, g); clouds.push(g); }

  // The islands.
  const islands = new Map();
  const defs = new Map();
  let lastNight = -1;
  const skyMoon = new THREE.Mesh(new THREE.SphereGeometry(6, 20, 16), new THREE.MeshBasicMaterial({ color: 0xdfe6f5 })); skyMoon.visible = false; scene.add(skyMoon);
  const nightHorizon = new THREE.Color(0.065, 0.13, 0.21); const nightZenith = new THREE.Color(0.008, 0.022, 0.07);
  function setNight(n) {
    const col = skyGeo.attributes.color;
    for (let i = 0; i < skyGeo.attributes.position.count; i++) {
      const y = skyGeo.attributes.position.getY(i) / 280;
      const c = horizon.clone().lerp(nightHorizon, n).lerp(zenith.clone().lerp(nightZenith, n), Math.pow(Math.max(y, 0), 0.48));
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
    hemi.intensity = 1.5 - 0.92 * n; hemi.color.setHex(0xd6e9f1).lerp(new THREE.Color(0x6086bc), n); hemi.groundColor.setHex(0x7b794c).lerp(new THREE.Color(0x233747), n);
    sun.intensity = 3.4 - 2.7 * n; sun.color.setHex(0xffd19b).lerp(new THREE.Color(0x9ebfea), n);
    scene.fog.color.setHex(0xd3b99b).lerp(new THREE.Color(0x0b1026), n);
    water.material.color.setHex(0x64b9c0).lerp(new THREE.Color(0x15304a), n);
    skyMoon.visible = n > 0.3;
    for (const [, isl] of islands) isl.setNight(n);
    for (const fn of listeners.night) fn(n);
  }
  function define(data) {
    defs.set(data.id, data);
    let seed = 7; for (const ch of data.id) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647; // the same island every time
    const island = createIsland({ scene, seed, build: (k) => buildIsland(k) });
    island.receive(data);
    island.show(true);
    islands.set(data.id, island);
  }

  // People: the same voxel villager the islands use, for me and for everyone else.
  function person(color) {
    const g = new THREE.Group();
    const P = (x, y, z, w, h, d, c) => { const m = box(x, y, z, w, h, d, c, g); m.castShadow = true; return m; };
    P(-0.23, 0.51, 0, 0.33, 0.85, 0.42, 0x4a4436); P(0.23, 0.51, 0, 0.33, 0.85, 0.42, 0x4a4436);
    P(0, 1.32, 0, 0.92, 0.92, 0.62, color);
    for (const side of [-1, 1]) P(side * 0.62, 1.3, 0, 0.3, 0.82, 0.38, color);
    P(0, 2.05, 0, 0.78, 0.62, 0.66, 0xe8c39a);
    P(0, 2.36, -0.03, 0.86, 0.28, 0.74, 0x5a4632);
    for (const side of [-1, 1]) P(side * 0.19, 2.08, 0.34, 0.1, 0.12, 0.06, 0x2b2b28);
    scene.add(g);
    return g;
  }
  function nameplate(text) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 100; const ctx = c.getContext('2d');
    ctx.fillStyle = '#345344'; ctx.beginPath(); ctx.roundRect(6, 8, 500, 84, 17); ctx.fill();
    ctx.font = '600 34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff4d7'; ctx.fillText(text, 256, 52, 490);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true })); sp.scale.set(2.6, 0.5, 1); sp.position.y = 3.2; sp.renderOrder = 3;
    return sp;
  }
  const me = person(0x526f66);
  box(0, 1.4, -0.37, 0.6, 0.68, 0.25, 0xc69b66, me); // a backpack
  const others = new Map();
  let current = 'cosmos';

  // Controls: WASD / arrows relative to the camera, drag to look, wheel to zoom, pad on touch.
  const keys = new Set();
  let yaw = CAMERA.yaw; let pitch = CAMERA.pitch; let zoom = CAMERA.zoom;
  let drag = false; let lastX = 0; let lastY = 0;
  canvas.addEventListener('pointerdown', (e) => { drag = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!drag) return; yaw -= (e.clientX - lastX) * 0.006; pitch = THREE.MathUtils.clamp(pitch - (e.clientY - lastY) * 0.004, -0.6, 0.9); lastX = e.clientX; lastY = e.clientY; });
  canvas.addEventListener('pointerup', () => { drag = false; }); canvas.addEventListener('pointercancel', () => { drag = false; });
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoom = THREE.MathUtils.clamp(zoom + e.deltaY * 0.025, 12, 62); }, { passive: false });
  addEventListener('keydown', (e) => { if (e.target.closest('input,textarea') || document.querySelector('dialog[open]')) return; const k = e.key.toLowerCase(); if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) { e.preventDefault(); keys.add(k); } });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  for (const b of document.querySelectorAll('#pad button')) {
    const k = b.dataset.key; const on = (e) => { e.preventDefault(); keys.add(k); }; const off = () => keys.delete(k);
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
    b.oncontextmenu = (e) => e.preventDefault();
  }

  let frozen = false; let nearSpot = null;
  const listeners = { near: [], move: [], island: [], night: [] };
  const clock = new THREE.Clock(); let lastSent = 0;
  function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();

  function islandAt(x, z) { for (const [id, d] of defs) if (Math.abs(x - d.x) <= 34 && Math.abs(z - d.z) <= 28) return id; return null; }

  function tick() {
    const dt = Math.min(clock.getDelta(), 0.1); const time = clock.elapsedTime;
    const island = islands.get(current);
    if (!frozen) {
      let fwd = 0; let strafe = 0;
      if (keys.has('w') || keys.has('arrowup')) fwd += 1;
      if (keys.has('s') || keys.has('arrowdown')) fwd -= 1;
      if (keys.has('a') || keys.has('arrowleft')) strafe -= 1;
      if (keys.has('d') || keys.has('arrowright')) strafe += 1;
      if (fwd || strafe) {
        const n = Math.hypot(fwd, strafe); const pace = SPEED * (keys.has('shift') ? 1.6 : 1) * dt;
        const dx = ((-Math.sin(yaw) * fwd + Math.cos(yaw) * strafe) / n) * pace;
        const dz = ((-Math.cos(yaw) * fwd - Math.sin(yaw) * strafe) / n) * pace;
        const nx = me.position.x + dx; const nz = me.position.z + dz;
        if (island && !island.blocked(nx, me.position.z)) me.position.x = nx;
        if (island && !island.blocked(me.position.x, nz)) me.position.z = nz;
        me.rotation.y = Math.atan2(dx, dz);
        const now = performance.now();
        if (now - lastSent > 100) { lastSent = now; for (const fn of listeners.move) fn(me.position.x, me.position.z); }
      }
    }
    for (const [, isl] of islands) isl.update(time, me);
    animateIslands(islands, time);
    // the world's clock: the same sky for every child, without the server
    const night = phaseAt().night;
    if (Math.abs(night - lastNight) > 0.002) { lastNight = night; setNight(night); }
    for (const c of clouds) c.position.x += dt * 0.6;
    const near = island?.nearest(me)?.spot || null;
    if (near !== nearSpot) { nearSpot = near; for (const fn of listeners.near) fn(near); }
    const d = defs.get(current);
    if (d) { sun.position.set(d.x - 35, 27, d.z - 25); sun.target.position.set(d.x, 0, d.z); sun.target.updateMatrixWorld(); }
    const dist = zoom; const h = 23 * (zoom / 32) + pitch * 18;
    const target = new THREE.Vector3(me.position.x + Math.sin(yaw) * dist, h, me.position.z + Math.cos(yaw) * dist);
    camera.position.lerp(target, 0.12);
    camera.lookAt(me.position.x, me.position.y + 1.6, me.position.z);
    sky.position.copy(camera.position); skyMoon.position.set(camera.position.x - 90, 70, camera.position.z - 120);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function travel(id, { snap = true } = {}) {
    const d = defs.get(id); if (!d) return;
    current = id;
    me.position.set(d.x + d.spawn.x, 0, d.z + d.spawn.z);
    if (snap) camera.position.set(me.position.x + 18, 23, me.position.z + 28);
    for (const fn of listeners.island) fn(d);
    for (const fn of listeners.move) fn(me.position.x, me.position.z);
  }

  return {
    load(data) { for (const d of data.islands) define(d); travel('cosmos'); },
    onNear(fn) { listeners.near.push(fn); },
    onMove(fn) { listeners.move.push(fn); },
    onIsland(fn) { listeners.island.push(fn); },
    onNight(fn) { listeners.night.push(fn); },
    freeze(v) { frozen = v; keys.clear(); },
    travel,
    get current() { return current; },
    get island() { return defs.get(current); },
    islandOf(x, z) { return islandAt(x, z); },
    drawMap(ctx) { return islands.get(current)?.drawMap(ctx, me) || false; },
    walkTo(stationId) {
      for (const [id, d] of defs) { const sp = d.spots.find((x) => x.id === stationId); if (sp) { if (id !== current) travel(id); me.position.set(d.x + sp.x, 0, d.z + sp.z + 2.5); for (const fn of listeners.move) fn(me.position.x, me.position.z); return true; } }
      return false;
    },
    setOther(id, name, x, z) {
      let o = others.get(id);
      if (!o) { o = person(0x8d6b44 + (id.charCodeAt(0) % 5) * 0x201010); if (name) o.add(nameplate(name)); others.set(id, o); }
      o.position.set(x, 0, z);
    },
    removeOther(id) { const o = others.get(id); if (o) { scene.remove(o); others.delete(id); } },
    me,
    signs() { return [...islands.values()].flatMap((i) => i.signs); },
  };
}
export { NEAR_DISTANCE };
