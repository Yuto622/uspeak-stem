// The two STEM islands, built with U-Speak Web's island kit so they look like the
// islands a child already knows: layered voxel ground, a jetty, timber houses with
// their names on a bracket, lamps along the paths, a day sky over open water.
//
// COSMOS sits at the origin and LAB 135 m east, the same spacing the English world
// uses for its second island, so the sea between them reads as sea and not as a gap.

import * as THREE from './vendor/three.module.js';
import { createIsland, NEAR_DISTANCE, shade } from './island-kit.js';
import { t, onLang } from './i18n.js';

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
  const water = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshStandardMaterial({ color: 0x64b9c0, metalness: 0.32, roughness: 0.24, transparent: true, opacity: 0.9 }));
  water.rotation.x = -Math.PI / 2; water.position.y = -1.55; water.receiveShadow = true; scene.add(water);
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const box = (x, y, z, w, h, d, color, parent = scene) => { const m = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color, roughness: 0.85 })); m.position.set(x, y, z); m.scale.set(w, h, d); parent.add(m); return m; };
  let s = 7;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  // Far enough into the haze to read as a coast, not as blocks in the sky.
  for (let i = 0; i < 22; i++) { const x = -160 + i * 20; const z = -150 - rand() * 40; const h = 5 + rand() * 10; box(x, -4, z, 18, h, 14, 0x9fb5ad); box(x, h / 2 - 3, z, 14, 2, 11, 0x9cb09e); box(x + 1, h / 2 - 1, z, 8, 3, 8, 0xa9b9a7); }
  const clouds = [];
  for (let i = 0; i < 14; i++) { const g = new THREE.Group(); g.position.set((rand() - 0.5) * 260 + 60, 28 + rand() * 18, -30 - rand() * 50); scene.add(g); for (let j = 0; j < 5; j++) box(j * 3, rand() * 1.1, rand() * 2, 5, 1.2, 3.5, 0xedf0df, g); clouds.push(g); }

  // The islands.
  const islands = new Map();
  const defs = new Map();
  function define(data) {
    defs.set(data.id, data);
    const island = createIsland({ scene, seed: data.id === 'cosmos' ? 20250910 : 30414159, build: data.id === 'cosmos' ? buildCosmos : buildLab });
    island.receive(data);
    island.show(true);
    islands.set(data.id, island);
  }

  // COSMOS: a hill with the Moon over it, a launch pad with a rocket, an observatory.
  function buildCosmos({ island, B, D, house, path, resident, door, scatter, lamp, flowers, bench, fence, bunting, obstacles, rand: r }) {
    for (const sp of island.spots) path(sp.path.x, sp.path.z, sp.x, sp.z + 4.2);
    path(0, 19, 0, 12);
    const [hill, pad, obs] = island.spots;
    // Phase Hill: a grassy mound, a model Earth on a post and a Moon that circles it.
    for (let i = 0; i < 4; i++) D(hill.x, 0.3 + i * 0.5, hill.z - 3, 9 - i * 1.8, 0.5, 7 - i * 1.4, i % 2 ? 0x8fb061 : 0x9cbb6a);
    D(hill.x, 3.2, hill.z - 3, 0.3, 2.4, 0.3, 0x6f5b3e);
    B(hill.x, 4.6, hill.z - 3, 1.3, 1.3, 1.3, 0x3f7fd0);
    const moon = B(hill.x + 3, 5.2, hill.z - 3, 0.7, 0.7, 0.7, 0xe6e2d6);
    moon.userData.orbit = { cx: hill.x, cz: hill.z - 3, r: 3.2 };
    obstacles.push({ x: hill.x, z: hill.z - 3, w: 4, d: 3 });
    house(hill.x, hill.z - 10, 5, 4.5, 0xe8dcc0, 0x6b8fb8, { en: hill.en, ja: hill.name });
    // Launch Pad: a concrete apron, a gantry and a rocket.
    D(pad.x, 0.3, pad.z - 4, 9, 0.3, 9, 0x8a8f99);
    D(pad.x, 0.5, pad.z - 4, 7.5, 0.2, 7.5, 0x9aa0aa);
    D(pad.x + 2.4, 4.8, pad.z - 4, 1.0, 9, 1.0, 0xc9cdd6);
    D(pad.x + 1.4, 7.5, pad.z - 4, 1.6, 0.3, 0.6, 0xc9cdd6);
    D(pad.x, 2.4, pad.z - 4, 1.4, 4, 1.4, 0xf2f2f2);
    D(pad.x, 5.2, pad.z - 4, 1.0, 1.6, 1.0, 0xf2f2f2);
    D(pad.x, 6.4, pad.z - 4, 0.6, 0.9, 0.6, 0xd04030);
    for (const [fx, fz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) D(pad.x + fx * 0.9, 0.9, pad.z - 4 + fz * 0.9, fx ? 0.8 : 0.3, 1.2, fz ? 0.8 : 0.3, 0xd04030);
    obstacles.push({ x: pad.x, z: pad.z - 4, w: 4, d: 4 });
    fence(pad.x - 6, pad.z - 9.5, 9); bunting(pad.x - 6, pad.z + 1, pad.x + 6, pad.z + 1, 4);
    house(pad.x - 11, pad.z - 2, 5, 4.5, 0xe3e9f0, 0x5c8583, { en: 'Mission Control', ja: 'かんせいしつ' });
    // Observatory: a round tower with a dome and a telescope.
    for (let i = 0; i < 6; i++) D(obs.x, 0.5 + i, obs.z - 4, 6.4 - (i > 4 ? 0.6 : 0), 1, 6.4 - (i > 4 ? 0.6 : 0), i % 2 ? 0xe8e2d0 : 0xdcd4c0);
    for (let i = 0; i < 4; i++) D(obs.x, 6.6 + i * 0.7, obs.z - 4, 6.2 - i * 1.4, 0.7, 6.2 - i * 1.4, 0xb9c6d6);
    D(obs.x + 0.8, 8.6, obs.z - 4.4, 0.8, 0.8, 3.2, 0x334455);
    D(obs.x, 1.5, obs.z - 0.9, 1.4, 2.6, 0.3, 0x50412f);
    obstacles.push({ x: obs.x, z: obs.z - 4, w: 3.6, d: 3.6 });
    for (const sx of [-5, 5]) lamp(obs.x + sx, obs.z + 1);
    for (const sp of island.spots) resident(sp);
    for (const [x, z] of [[-8, 6], [8, 6], [-24, 6], [24, 6]]) flowers(x, z, 0xf0d98a);
    bench(-5, 14, Math.PI); bench(5, 14, Math.PI);
    scatter(island, 100);
    island._moon = moon;
  }

  // LAB: a long timber workshop, a shelf of coloured bottles and a stone hearth.
  function buildLab({ island, B, D, house, path, resident, scatter, lamp, flowers, bench, crate, barrel, fence, obstacles }) {
    for (const sp of island.spots) path(sp.path.x, sp.path.z, sp.x, sp.z + 4.2);
    path(0, 19, 0, 12);
    const [bench_, shelf, corner] = island.spots;
    // Dissolving Bench: a workbench under an awning with beakers of coloured water.
    D(bench_.x, 1.0, bench_.z - 4, 7, 0.3, 2.4, 0xa58c62);
    for (const sx of [-3.2, 3.2]) for (const sz of [-1, 1]) D(bench_.x + sx, 0.5, bench_.z - 4 + sz, 0.3, 1, 0.3, 0x7b6647);
    const waters = [0x7fd1ff, 0xd9c4ff, 0xf6f1c8, 0xa9f0d1];
    waters.forEach((c, i) => { D(bench_.x - 2.4 + i * 1.6, 1.6, bench_.z - 4, 0.7, 0.9, 0.7, 0xe8f2f5); D(bench_.x - 2.4 + i * 1.6, 1.45, bench_.z - 4, 0.6, 0.5, 0.6, c); });
    for (const sx of [-3.6, 3.6]) D(bench_.x + sx, 2.6, bench_.z - 5.2, 0.25, 3.2, 0.25, 0x6f5b3e);
    D(bench_.x, 4.2, bench_.z - 4.4, 8.4, 0.2, 3.6, 0xb86e46);
    obstacles.push({ x: bench_.x, z: bench_.z - 4, w: 3.8, d: 1.6 });
    house(bench_.x, bench_.z - 11, 6, 5, 0xf0e6cc, 0xb86e46, { en: bench_.en, ja: bench_.name });
    // Indicator Shelf: a tall cabinet of bottles in indicator colours.
    D(shelf.x, 2.0, shelf.z - 4, 7, 4, 1.4, 0x8a6a45);
    const tints = [0xd9433a, 0xe98ab0, 0x7a4ea8, 0x3a6fd0, 0x3f9a52, 0xe4c239];
    for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) D(shelf.x - 2.5 + i, 0.9 + row * 1.2, shelf.z - 3.2, 0.5, 0.8, 0.5, tints[(i + row) % 6]);
    D(shelf.x, 4.1, shelf.z - 4, 7.4, 0.2, 1.8, 0x6d543a);
    obstacles.push({ x: shelf.x, z: shelf.z - 4, w: 3.7, d: 0.9 });
    house(shelf.x - 11, shelf.z - 2, 5.5, 4.5, 0xdde6d2, 0x5c8583, { en: 'Stockroom', ja: 'やくひんしつ' });
    crate(shelf.x + 6, shelf.z - 3); barrel(shelf.x + 7.4, shelf.z - 3);
    // Burning Corner: a stone hearth with a candle under a glass jar.
    D(corner.x, 0.4, corner.z - 4, 5, 0.6, 5, 0x9a9585);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; D(corner.x + Math.cos(a) * 2, 0.9, corner.z - 4 + Math.sin(a) * 2, 0.6, 0.5, 0.6, 0x8c917c); }
    D(corner.x, 1.2, corner.z - 4, 0.4, 1.0, 0.4, 0xfff4d7);
    D(corner.x, 1.9, corner.z - 4, 0.3, 0.4, 0.3, 0xffc66a, 2.2);
    D(corner.x, 1.7, corner.z - 4, 1.6, 2.2, 1.6, 0xd8ecf2);
    obstacles.push({ x: corner.x, z: corner.z - 4, w: 2.6, d: 2.6 });
    fence(corner.x - 4, corner.z - 8, 6);
    house(corner.x, corner.z - 11, 5, 4.5, 0xe6d8c8, 0x8e795f, { en: corner.en, ja: corner.name });
    for (const sp of island.spots) resident(sp);
    for (const sx of [-5, 5]) lamp(sx, 10);
    for (const [x, z] of [[-9, 6], [9, 6], [-24, 8], [24, 8]]) flowers(x, z, 0xe89bb0);
    bench(-5, 14, Math.PI); bench(5, 14, Math.PI);
    scatter(island, 100);
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
  const listeners = { near: [], move: [], island: [] };
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
    const cm = islands.get('cosmos')?._moon;
    if (cm) { const o = cm.userData.orbit; cm.position.x = o.cx + Math.cos(time * 0.6) * o.r; cm.position.z = o.cz + Math.sin(time * 0.6) * o.r; }
    for (const c of clouds) c.position.x += dt * 0.6;
    const near = island?.nearest(me)?.spot || null;
    if (near !== nearSpot) { nearSpot = near; for (const fn of listeners.near) fn(near); }
    const d = defs.get(current);
    if (d) { sun.position.set(d.x - 35, 27, d.z - 25); sun.target.position.set(d.x, 0, d.z); sun.target.updateMatrixWorld(); }
    const dist = zoom; const h = 23 * (zoom / 32) + pitch * 18;
    const target = new THREE.Vector3(me.position.x + Math.sin(yaw) * dist, h, me.position.z + Math.cos(yaw) * dist);
    camera.position.lerp(target, 0.12);
    camera.lookAt(me.position.x, me.position.y + 1.6, me.position.z);
    sky.position.copy(camera.position);
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
