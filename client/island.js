// The Island of the Sky, in three.js. Three stations on one island; walk to one and
// its panel opens. Other children in the class walk around you.

import * as THREE from './vendor/three.module.js';
import { t, onLang } from './i18n.js';

export const STATIONS = [
  { id: 'phase-hill', exp: 'cosmos.moon.phases', x: -22, z: -6, en: 'Phase Hill', ja: 'つきの おか' },
  { id: 'launch-pad', exp: 'cosmos.orbit.launch', x: 0, z: -26, en: 'Launch Pad', ja: 'うちあげだい' },
  { id: 'observatory', exp: 'cosmos.exoplanet.hunter', x: 24, z: -4, en: 'Observatory', ja: 'てんもんだい' },
];
const REACH = 5;
const SPEED = 9; // m/s
const ISLAND_R = 38;

function label(text, scale = 1) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  const paint = () => {
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = '#1c2a3acc'; ctx.beginPath(); ctx.roundRect(40, 24, 432, 80, 24); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 44px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(t(text), 256, 80);
  };
  paint();
  const tex = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  s.scale.set(8 * scale, 2 * scale, 1);
  onLang(() => { paint(); tex.needsUpdate = true; });
  return s;
}

export function createIsland(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1026);
  scene.fog = new THREE.Fog(0x0b1026, 60, 160);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);

  // sky: stars
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(1500 * 3);
  for (let i = 0; i < 1500; i++) { const r = 180; const th = Math.random() * Math.PI * 2; const ph = Math.acos(Math.random() * 0.95); starPos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3); }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: false })));
  // a big moon in the sky
  const moon = new THREE.Mesh(new THREE.SphereGeometry(10, 24, 24), new THREE.MeshStandardMaterial({ color: 0xd8d4c8, emissive: 0x44403a }));
  moon.position.set(-90, 70, -120); scene.add(moon);

  scene.add(new THREE.HemisphereLight(0x9bb7ff, 0x1a2a1a, 0.9));
  const sun = new THREE.DirectionalLight(0xfff1d0, 1.1); sun.position.set(-40, 60, 30); scene.add(sun);

  // sea and island
  scene.add(new THREE.Mesh(new THREE.CircleGeometry(300, 48), new THREE.MeshStandardMaterial({ color: 0x14305a })).rotateX(-Math.PI / 2));
  const island = new THREE.Mesh(new THREE.CylinderGeometry(ISLAND_R, ISLAND_R + 4, 2, 48), new THREE.MeshStandardMaterial({ color: 0x4f8f4a, flatShading: true }));
  island.position.y = 1; scene.add(island);
  const sand = new THREE.Mesh(new THREE.RingGeometry(ISLAND_R - 1, ISLAND_R + 1, 48), new THREE.MeshStandardMaterial({ color: 0xd9c38a })); sand.rotateX(-Math.PI / 2); sand.position.y = 2.01; scene.add(sand);
  // paths
  for (const s of STATIONS) {
    const len = Math.hypot(s.x, s.z); const path = new THREE.Mesh(new THREE.PlaneGeometry(2.4, len), new THREE.MeshStandardMaterial({ color: 0xb8a97a }));
    path.rotateX(-Math.PI / 2); path.position.set(s.x / 2, 2.02, s.z / 2); path.rotation.z = -Math.atan2(s.x, s.z); scene.add(path);
  }
  // trees
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x7a5a3a }); const leafM = new THREE.MeshStandardMaterial({ color: 0x2f6b3a, flatShading: true });
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2; const r = ISLAND_R - 5 - (i % 3) * 3;
    const x = Math.cos(a) * r; const z = Math.sin(a) * r;
    if (Math.hypot(x, z) < 6 || STATIONS.some((s) => Math.hypot(x - s.x, z - s.z) < 7)) continue;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.4, 6), trunkM); trunk.position.set(x, 3.2, z); scene.add(trunk);
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.4, 7), leafM); leaf.position.set(x, 5.8, z); scene.add(leaf);
  }

  // stations
  const stationMeshes = {};
  const hill = new THREE.Group();
  hill.add(new THREE.Mesh(new THREE.SphereGeometry(6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x6aa35a, flatShading: true })));
  const hillMoon = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 16), new THREE.MeshStandardMaterial({ color: 0xe6e2d6, emissive: 0x333333 })); hillMoon.position.set(0, 8.5, 0); hill.add(hillMoon);
  const hillEarth = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 16), new THREE.MeshStandardMaterial({ color: 0x3f7fd0 })); hillEarth.position.set(0, 6.6, 0); hill.add(hillEarth);
  hill.position.set(STATIONS[0].x, 2, STATIONS[0].z); scene.add(hill); stationMeshes['phase-hill'] = hill;

  const pad = new THREE.Group();
  pad.add(new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 0.6, 24), new THREE.MeshStandardMaterial({ color: 0x8a8f99 })));
  const tower = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9, 1.2), new THREE.MeshStandardMaterial({ color: 0xc9cdd6 })); tower.position.set(2.2, 4.8, 0); pad.add(tower);
  const rocket = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3, 12), new THREE.MeshStandardMaterial({ color: 0xf2f2f2 })); rocket.position.set(0, 4.6, 0); pad.add(rocket);
  const rocketBody = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 3.4, 12), new THREE.MeshStandardMaterial({ color: 0xf2f2f2 })); rocketBody.position.set(0, 2, 0); pad.add(rocketBody);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.8, 0.2), new THREE.MeshStandardMaterial({ color: 0xd04030 })); fin.position.set(0, 0.7, 0); pad.add(fin);
  pad.position.set(STATIONS[1].x, 2, STATIONS[1].z); scene.add(pad); stationMeshes['launch-pad'] = pad;

  const obs = new THREE.Group();
  obs.add(new THREE.Mesh(new THREE.CylinderGeometry(4, 4.4, 5, 20), new THREE.MeshStandardMaterial({ color: 0xe8e2d0 })));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(4, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xb9c6d6, metalness: 0.3 })); dome.position.y = 2.5; obs.add(dome);
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 5, 10), new THREE.MeshStandardMaterial({ color: 0x334 })); scope.position.set(0, 5, -1); scope.rotation.x = -0.9; obs.add(scope);
  obs.position.set(STATIONS[2].x, 4.5, STATIONS[2].z); scene.add(obs); stationMeshes.observatory = obs;

  for (const s of STATIONS) { const l = label({ en: s.en, ja: s.ja }); l.position.set(s.x, 13, s.z); scene.add(l); }

  // the player
  function avatar(color) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1, 6, 12), new THREE.MeshStandardMaterial({ color })); body.position.y = 1.1; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), new THREE.MeshStandardMaterial({ color: 0xffe0c0 })); head.position.y = 2.2; g.add(head);
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.52, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })); visor.position.y = 2.2; g.add(visor);
    return g;
  }
  const me = avatar(0x2d6cdf); me.position.set(0, 2, 10); scene.add(me);
  const others = new Map();

  const keys = new Set();
  addEventListener('keydown', (e) => { if (e.target.closest('input,textarea')) return; keys.add(e.key.toLowerCase()); });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  for (const b of document.querySelectorAll('#pad button')) {
    const k = b.dataset.key;
    const on = (e) => { e.preventDefault(); keys.add(k); }; const off = () => keys.delete(k);
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
    b.oncontextmenu = (e) => e.preventDefault();
  }

  let frozen = false;
  let nearStation = null;
  const listeners = { near: [], move: [] };
  const clock = new THREE.Clock();
  let lastSent = 0;

  function resize() {
    const w = innerWidth; const h = innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  function tick() {
    const dt = Math.min(clock.getDelta(), 0.1);
    if (!frozen) {
      let dx = 0; let dz = 0;
      if (keys.has('w') || keys.has('arrowup')) dz -= 1;
      if (keys.has('s') || keys.has('arrowdown')) dz += 1;
      if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
      if (keys.has('d') || keys.has('arrowright')) dx += 1;
      if (dx || dz) {
        const n = Math.hypot(dx, dz);
        me.position.x += (dx / n) * SPEED * dt; me.position.z += (dz / n) * SPEED * dt;
        const r = Math.hypot(me.position.x, me.position.z);
        if (r > ISLAND_R - 1.5) { me.position.x *= (ISLAND_R - 1.5) / r; me.position.z *= (ISLAND_R - 1.5) / r; }
        me.rotation.y = Math.atan2(dx, dz);
        const now = performance.now();
        if (now - lastSent > 100) { lastSent = now; for (const fn of listeners.move) fn(me.position.x, me.position.z); }
      }
    }
    hillMoon.position.x = Math.cos(performance.now() / 3000) * 3.2; hillMoon.position.z = Math.sin(performance.now() / 3000) * 3.2;
    const near = STATIONS.find((s) => Math.hypot(me.position.x - s.x, me.position.z - s.z) < REACH) || null;
    if (near !== nearStation) { nearStation = near; for (const fn of listeners.near) fn(near); }
    camera.position.lerp(new THREE.Vector3(me.position.x, me.position.y + 11, me.position.z + 16), 0.1);
    camera.lookAt(me.position.x, me.position.y + 2, me.position.z);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  return {
    onNear(fn) { listeners.near.push(fn); },
    onMove(fn) { listeners.move.push(fn); },
    freeze(v) { frozen = v; keys.clear(); },
    setOther(id, name, x, z) {
      let o = others.get(id);
      if (!o) { o = avatar(0xf2b134); const l = label(name, 0.5); l.position.y = 3.4; o.add(l); scene.add(o); others.set(id, o); }
      o.position.set(x, 2, z);
    },
    removeOther(id) { const o = others.get(id); if (o) { scene.remove(o); others.delete(id); } },
    me,
    stationMeshes,
    STATIONS,
  };
}
