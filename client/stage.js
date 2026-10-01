// The experiment stage: every experiment is a small three.js scene a child can turn
// with a finger. The physics comes from `shared/sim` through the room; the stage only
// shows it. Nothing here computes a result, so nothing here can leak one.
//
// One renderer, one canvas in the panel, rebuilt for each experiment. The loop runs
// only while the panel is open (the island behind it is paused by the dialog anyway).

import * as THREE from './vendor/three.module.js';
import { t, onLang } from './i18n.js';
import { gravity, moon } from '/shared/sim/index.js';
import * as chem from '/shared/sim/chem.js';
import { moreBuilders } from './stage-more.js';

const W = 720; const H = 420;

function labelSprite(textOrPair, { size = 30, color = '#fff4d7', background = '#1c2a3acc', width = 2.4 } = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  s.scale.set(width, width * 96 / 512, 1); s.renderOrder = 5;
  const paint = (text = textOrPair) => {
    ctx.clearRect(0, 0, 512, 96);
    if (background) { ctx.fillStyle = background; ctx.beginPath(); ctx.roundRect(4, 4, 504, 88, 20); ctx.fill(); }
    ctx.fillStyle = color; ctx.font = `600 ${size}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(typeof text === 'string' ? text : t(text), 256, 50, 490);
    tex.needsUpdate = true;
  };
  paint();
  s.userData.set = (text) => paint(text);
  s.userData.repaint = () => paint();
  return s;
}

function stars(scene, n = 400, r = 60) {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const th = Math.random() * Math.PI * 2; const ph = Math.acos(2 * Math.random() - 1); pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false })));
}

// A line graph in the scene: an axes board with a polyline on it.
function graph({ w = 4, h = 2.4, xLabel, yLabel }) {
  const g = new THREE.Group();
  const board = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.6, h + 0.8), new THREE.MeshStandardMaterial({ color: 0x13203a, roughness: 0.9 }));
  g.add(board);
  const axes = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-w / 2, -h / 2, 0.01), new THREE.Vector3(w / 2, -h / 2, 0.01), new THREE.Vector3(-w / 2, -h / 2, 0.01), new THREE.Vector3(-w / 2, h / 2, 0.01)]), new THREE.LineBasicMaterial({ color: 0xffffff }));
  g.add(axes);
  const lx = labelSprite(xLabel, { size: 26, background: null, width: w * 0.7 }); lx.position.set(0, -h / 2 - 0.3, 0.05); g.add(lx);
  const ly = labelSprite(yLabel, { size: 26, background: null, width: w * 0.7 }); ly.position.set(0, h / 2 + 0.3, 0.05); g.add(ly);
  const lines = [];
  g.userData.plot = (points, { color = 0xf2b134, dashed = false, xr, yr } = {}) => {
    const X = (x) => -w / 2 + ((x - xr[0]) / (xr[1] - xr[0])) * w; const Y = (y) => -h / 2 + ((y - yr[0]) / (yr[1] - yr[0])) * h;
    const geo = new THREE.BufferGeometry().setFromPoints(points.map(([x, y]) => new THREE.Vector3(X(x), Y(y), 0.03)));
    const mat = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.08, gapSize: 0.06 }) : new THREE.LineBasicMaterial({ color, linewidth: 2 });
    const line = new THREE.Line(geo, mat); if (dashed) line.computeLineDistances();
    g.add(line); lines.push(line); return line;
  };
  g.userData.mark = (x, y, { xr, yr, color = 0xffffff }) => {
    const X = -w / 2 + ((x - xr[0]) / (xr[1] - xr[0])) * w; const Y = -h / 2 + ((y - yr[0]) / (yr[1] - yr[0])) * h;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), new THREE.MeshBasicMaterial({ color })); m.position.set(X, Y, 0.05); g.add(m); return m;
  };
  g.userData.clear = () => { for (const l of lines) { g.remove(l); l.geometry.dispose(); } lines.length = 0; };
  return g;
}

function glass(geometry, color = 0xcfe8f0) { return new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity: 0.28, roughness: 0.1, metalness: 0, side: THREE.DoubleSide, depthWrite: false })); }

// ---- builders: one per sim. Each returns { update(dt), replay(), dispose() }.
const BUILDERS = {
  gravity({ scene, params, result, camera, labels }) {
    const body = gravity.BODIES[params.body];
    const R = 1; const k = R / body.radius;
    stars(scene);
    const planet = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 28), new THREE.MeshStandardMaterial({ color: body.color, roughness: 0.9 }));
    scene.add(planet);
    const ring = new THREE.Mesh(new THREE.RingGeometry((body.radius + params.altitude) * k - 0.004, (body.radius + params.altitude) * k + 0.004, 96), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
    scene.add(ring);
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.03), new THREE.MeshStandardMaterial({ color: 0xf2b134 }));
    tower.position.set((body.radius + params.altitude) * k, 0, 0); scene.add(tower);
    const nameL = labelSprite({ en: `${body.en} · launch at ${params.altitude} km, ${params.speed} km/s`, ja: `${body.ja} · ${params.altitude} km の たかさから ${params.speed} km/s` }, { width: 4 });
    nameL.position.set(0, -R - 0.9, 0); scene.add(nameL); labels.push(nameL);
    let trailPts = []; let ball = null; let line = null; let tt = 0; let duration = 1;
    if (result?.trail) {
      trailPts = result.trail.map(([x, y]) => new THREE.Vector3(x * k, y * k, 0));
      const geo = new THREE.BufferGeometry().setFromPoints(trailPts);
      line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: result.outcome === 'crash' ? 0xf06a52 : result.outcome === 'escape' ? 0xf2b134 : 0x7fd1ff }));
      line.geometry.setDrawRange(0, 0); scene.add(line);
      ball = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff })); scene.add(ball);
      duration = Math.min(8, 2 + trailPts.length / 120);
      const out = labelSprite({ en: { crash: 'It fell back down.', orbit: `It orbits! ${result.period} min per lap`, escape: 'It escaped the planet!' }[result.outcome], ja: { crash: 'おちてきた。', orbit: `まわった！ 1しゅう ${result.period} ぷん`, escape: 'ほしから とんでいった！' }[result.outcome] }, { width: 4 });
      out.position.set(0, R + 0.7, 0); scene.add(out); labels.push(out);
    }
    const maxR = trailPts.length ? Math.max(1.4, ...trailPts.map((p) => p.length())) : 1.6;
    camera.position.set(0, 0.6, Math.min(maxR, 12) * 2.3); camera.lookAt(0, 0, 0);
    return {
      update(dt) {
        planet.rotation.y += dt * 0.08;
        if (!ball) return;
        tt = Math.min(duration, tt + dt);
        const i = Math.min(trailPts.length - 1, Math.floor((tt / duration) * (trailPts.length - 1)));
        ball.position.copy(trailPts[i]); line.geometry.setDrawRange(0, i + 1);
      },
      replay() { tt = 0; },
    };
  },

  moon({ scene, params, result, camera, labels, renderer }) {
    stars(scene, 300);
    const sun = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 18), new THREE.MeshBasicMaterial({ color: 0xffd36b }));
    sun.position.set(-7, 0, 0); scene.add(sun);
    const sunLight = new THREE.DirectionalLight(0xfff1d0, 3.2); sunLight.position.set(-7, 0, 0); sunLight.target.position.set(0, 0, 0); scene.add(sunLight); scene.add(sunLight.target);
    const earth = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 24), new THREE.MeshStandardMaterial({ color: 0x3f7fd0, roughness: 0.8 })); scene.add(earth);
    const land = new THREE.Mesh(new THREE.SphereGeometry(0.705, 16, 12), new THREE.MeshStandardMaterial({ color: 0x5aa05a, roughness: 0.9, transparent: true, opacity: 0.45 })); earth.add(land);
    const orbitR = 3;
    const ring = new THREE.Mesh(new THREE.RingGeometry(orbitR - 0.01, orbitR + 0.01, 96), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; scene.add(ring);
    const a = (params.angle * Math.PI) / 180;
    // angle 0 = between Earth and Sun; the Moon travels anticlockwise seen from above.
    const mx = -Math.cos(a) * orbitR; const mz = Math.sin(a) * orbitR;
    const moonM = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 18), new THREE.MeshStandardMaterial({ color: 0xd8d4c8, roughness: 1 })); moonM.position.set(mx, 0, mz); scene.add(moonM);
    const sl = labelSprite({ en: 'Sun', ja: 'たいよう' }, { width: 1.4, background: null }); sl.position.set(-7, 1.3, 0); scene.add(sl); labels.push(sl);
    const el = labelSprite({ en: 'Earth', ja: 'ちきゅう' }, { width: 1.4, background: null }); el.position.set(0, 1.1, 0); scene.add(el); labels.push(el);
    const ml = labelSprite({ en: `Moon · ${params.angle}°`, ja: `つき · ${params.angle}°` }, { width: 1.8, background: null }); ml.position.set(mx, 0.7, mz); scene.add(ml); labels.push(ml);
    camera.position.set(2.5, 5.5, 6.5); camera.lookAt(-1, 0, 0);
    // The answer: the Moon as seen from the Earth, drawn in the corner by a second
    // camera standing on the Earth. Only once the room has sent the result.
    const eye = new THREE.PerspectiveCamera(14, 1, 0.1, 50);
    let showInset = !!result;
    if (result) {
      const ph = moon.PHASES.find((p) => p.id === result.phase);
      const rl = labelSprite({ en: `${ph.en} · ${Math.round(result.lit * 100)}% lit`, ja: `${ph.ja}（${ph.en}）· ${Math.round(result.lit * 100)}%` }, { width: 4 });
      rl.position.set(-1, -1.6, 2); scene.add(rl); labels.push(rl);
    }
    return {
      update(dt) { earth.rotation.y += dt * 0.3; },
      afterRender() {
        if (!showInset) return;
        const size = 150;
        renderer.setScissorTest(true); renderer.setViewport(W - size - 10, 10, size, size); renderer.setScissor(W - size - 10, 10, size, size);
        eye.position.set(0, 0, 0); eye.lookAt(mx, 0, mz); eye.aspect = 1; eye.updateProjectionMatrix();
        renderer.clearDepth(); renderer.render(scene, eye);
        renderer.setScissorTest(false); renderer.setViewport(0, 0, W, H);
      },
      insetLabel: result ? t({ en: 'from Earth', ja: 'ちきゅうから' }) : '',
    };
  },

  transit({ scene, params, result, camera, labels, exp }) {
    stars(scene, 500);
    const tg = exp.targets[params.target];
    const star = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), new THREE.MeshBasicMaterial({ color: tg.starMassSolar < 0.3 ? 0xff8a5c : 0xfff0c0 })); scene.add(star);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(1.08, 40, 28), new THREE.MeshBasicMaterial({ color: 0xffd080, transparent: true, opacity: 0.18 })); scene.add(glow);
    const k = Math.sqrt(tg.depth); // Rp / Rs
    const planet = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.035, k), 20, 14), new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 1 })); scene.add(planet);
    const orbitR = 2.6;
    const nl = labelSprite({ en: `${tg.en} · ${result ? 'watching for 27 days' : 'telescope ready'}`, ja: `${tg.ja} · ${result ? '27日 見つづける' : 'ぼうえんきょう じゅんび OK'}` }, { width: 4.2 }); nl.position.set(0, 1.8, 0); scene.add(nl); labels.push(nl);
    const g = graph({ w: 5.2, h: 1.6, xLabel: { en: 'days', ja: '日' }, yLabel: { en: 'brightness of the star', ja: 'ほしの あかるさ' } });
    g.position.set(0, -2.6, 0); scene.add(g); labels.push(g.children[2], g.children[3]);
    const meter = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1, 0.25), new THREE.MeshBasicMaterial({ color: 0x7fd1ff })); meter.position.set(3.2, 0, 0); scene.add(meter);
    const mlab = labelSprite('100.00%', { width: 1.6 }); mlab.position.set(3.2, 0.9, 0); scene.add(mlab);
    camera.position.set(0, 1.2, 9.5); camera.lookAt(0, -0.6, 0);
    let tt = 0; const duration = 12; let line = null; let curve = null;
    if (result?.curve) {
      curve = result.curve;
      const lo = Math.min(...curve.flux); const hi = Math.max(...curve.flux);
      line = g.userData.plot(curve.t.map((x, i) => [x, curve.flux[i]]), { color: 0x7fd1ff, xr: [0, curve.t[curve.t.length - 1]], yr: [lo - (hi - lo) * 0.1, hi + (hi - lo) * 0.1] });
      line.geometry.setDrawRange(0, 0);
    }
    return {
      update(dt) {
        if (!curve) { planet.position.set(orbitR * Math.cos(tt), 0, orbitR * Math.sin(tt)); tt += dt * 0.4; return; }
        tt = Math.min(duration, tt + dt);
        const frac = tt / duration; const n = Math.floor(frac * curve.t.length);
        line.geometry.setDrawRange(0, n);
        const days = frac * curve.t[curve.t.length - 1];
        const phase = ((days - result.first) / tg.periodDays) * Math.PI * 2;
        // the planet crosses in front of the star at mid-transit: angle 0 is toward the camera
        planet.position.set(orbitR * Math.sin(phase), 0, orbitR * Math.cos(phase));
        planet.visible = planet.position.z > -0.9 || Math.abs(planet.position.x) > 1;
        const f = curve.flux[Math.max(0, n - 1)] ?? 1;
        const lo = Math.min(...curve.flux); const vis = (f - lo) / Math.max(1 - lo, 1e-6);
        meter.scale.y = 0.2 + 0.8 * vis; meter.position.y = (meter.scale.y - 1) / 2;
        mlab.userData.set(`${(f * 100).toFixed(2)}%`);
      },
      replay() { tt = 0; },
    };
  },

  solubility({ scene, params, result, camera, labels }) {
    const sol = chem.SOLUTES[params.solute];
    scene.background = new THREE.Color(0x1a2a3a);
    const table = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 4), new THREE.MeshStandardMaterial({ color: 0xa58c62 })); table.position.y = -1.6; scene.add(table);
    const beaker = glass(new THREE.CylinderGeometry(0.9, 0.85, 2.4, 32, 1, true)); beaker.position.set(-1.6, -0.3, 0); scene.add(beaker);
    const base = glass(new THREE.CircleGeometry(0.85, 32)); base.rotation.x = -Math.PI / 2; base.position.set(-1.6, -1.49, 0); scene.add(base);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.8, 1.7, 32), new THREE.MeshStandardMaterial({ color: 0x7fd1ff, transparent: true, opacity: 0.45 })); water.position.set(-1.6, -0.62, 0); scene.add(water);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 32), new THREE.MeshStandardMaterial({ color: 0x333, emissive: 0xff5a1f, emissiveIntensity: params.tempC / 80 * 1.6 })); plate.position.set(-1.6, -1.56, 0); scene.add(plate);
    const tl = labelSprite(`${params.tempC}°C`, { width: 1.2 }); tl.position.set(-1.6, -2.0, 0.9); scene.add(tl);
    const gl = labelSprite({ en: `${params.grams} g ${sol.en}`, ja: `${sol.ja} ${params.grams} g` }, { width: 2.4 }); gl.position.set(-1.6, 1.3, 0); scene.add(gl); labels.push(gl);
    // crystals: one little cube per 2 g
    const n = Math.max(1, Math.round(params.grams / 2));
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: sol.color, roughness: 0.4 }), n);
    const seeds = []; const dummy = new THREE.Object3D();
    for (let i = 0; i < n; i++) { const r = Math.random() * 0.7; const a = Math.random() * Math.PI * 2; seeds.push({ x: -1.6 + Math.cos(a) * r, z: Math.sin(a) * r, y: 0.1 + Math.random() * 0.6, rot: Math.random() * 3, dissolves: false, fall: 0 }); }
    scene.add(inst);
    const dissolvedFrac = result ? result.dissolved / Math.max(params.grams, 1) : 0;
    seeds.forEach((s, i) => { s.dissolves = i < Math.round(n * dissolvedFrac); });
    const g = graph({ w: 3.4, h: 2.2, xLabel: { en: 'water temperature °C', ja: 'みずの おんど °C' }, yLabel: { en: 'g that dissolve in 100 g water', ja: '100 g の みずに とける g' } });
    g.position.set(2.2, 0.1, -0.6); scene.add(g); labels.push(g.children[2], g.children[3]);
    const maxS = Math.max(...sol.table.map(([, v]) => v), params.grams) * 1.1;
    g.userData.plot(sol.table, { color: 0xf2b134, xr: [0, 100], yr: [0, maxS] });
    g.userData.plot([[0, params.grams], [100, params.grams]], { color: 0x7fd1ff, dashed: true, xr: [0, 100], yr: [0, maxS] });
    if (result) {
      g.userData.mark(params.tempC, result.limit, { xr: [0, 100], yr: [0, maxS] });
      const rl = labelSprite({ en: result.left > 0 ? `${result.dissolved} g dissolved · ${result.left} g left on the bottom` : `All ${result.dissolved} g dissolved`, ja: result.left > 0 ? `${result.dissolved} g とけた · ${result.left} g のこった` : `${result.dissolved} g ぜんぶ とけた` }, { width: 4.4 });
      rl.position.set(0.4, -2.2, 1); scene.add(rl); labels.push(rl);
    }
    camera.position.set(0.6, 1.4, 6.2); camera.lookAt(0.3, -0.4, 0);
    let tt = 0;
    return {
      update(dt) {
        tt += dt;
        seeds.forEach((s, i) => {
          let y = s.y; let sc = 1;
          if (result) {
            if (s.dissolves) sc = Math.max(0, 1 - tt / 2.5);               // fades into the water
            else { s.fall = Math.min(1, s.fall + dt * 0.5); y = s.y - (s.y + 1.4) * s.fall; } // settles on the bottom
          } else y = s.y + Math.sin(tt * 1.5 + i) * 0.03;
          dummy.position.set(s.x, y, s.z); dummy.rotation.set(s.rot, tt * 0.3, 0); dummy.scale.setScalar(sc); dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix);
        });
        inst.instanceMatrix.needsUpdate = true;
      },
      replay() { tt = 0; seeds.forEach((s) => { s.fall = 0; }); },
    };
  },

  acidbase({ scene, params, result, camera, labels }) {
    const liq = chem.LIQUIDS[params.liquid]; const ind = chem.INDICATORS[params.indicator];
    scene.background = new THREE.Color(0x1a2a3a);
    const bench = new THREE.Mesh(new THREE.BoxGeometry(7, 0.2, 3), new THREE.MeshStandardMaterial({ color: 0xa58c62 })); bench.position.y = -1.7; scene.add(bench);
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.0), new THREE.MeshStandardMaterial({ color: 0x7b6647 })); rack.position.set(0, -1.35, 0); scene.add(rack);
    const tube = glass(new THREE.CylinderGeometry(0.32, 0.32, 2.2, 24, 1, true)); tube.position.set(0, 0.1, 0); scene.add(tube);
    const bottom = glass(new THREE.SphereGeometry(0.32, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)); bottom.position.set(0, -1.0, 0); scene.add(bottom);
    const liquidMat = new THREE.MeshStandardMaterial({ color: 0xd8e4e8, transparent: true, opacity: 0.75, roughness: 0.2 });
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 1.4, 24), liquidMat); liquid.position.set(0, -0.3, 0); scene.add(liquid);
    const liquidBottom = new THREE.Mesh(new THREE.SphereGeometry(0.29, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), liquidMat); liquidBottom.position.set(0, -1.0, 0); scene.add(liquidBottom);
    const dropper = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.03, 0.9, 12), new THREE.MeshStandardMaterial({ color: 0xeeeeee })); dropper.position.set(0, 2.2, 0); scene.add(dropper);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), new THREE.MeshStandardMaterial({ color: 0xd04030 })); bulb.position.y = 0.5; dropper.add(bulb);
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshStandardMaterial({ color: 0x9a6fd0 })); drop.visible = false; scene.add(drop);
    const ll = labelSprite({ en: liq.en, ja: liq.ja }, { width: 2.6 }); ll.position.set(0, -2.15, 0.8); scene.add(ll); labels.push(ll);
    const il = labelSprite({ en: `+ ${ind.en}`, ja: `+ ${ind.ja}` }, { width: 2.6, background: null }); il.position.set(0, 2.9, 0); scene.add(il); labels.push(il);
    // pH scale as fifteen tiles
    for (let i = 0; i <= 14; i++) { const tile = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.3), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL((i / 14) * 0.75, 0.6, 0.55) })); tile.position.set(-2.1 + i * 0.3, -1.55, 1.1); scene.add(tile); }
    const s0 = labelSprite('pH 0', { width: 0.8, background: null }); s0.position.set(-2.1, -1.3, 1.1); scene.add(s0);
    const s14 = labelSprite('14', { width: 0.6, background: null }); s14.position.set(2.1, -1.3, 1.1); scene.add(s14);
    const marker = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); marker.rotation.x = Math.PI; marker.visible = false; scene.add(marker);
    let rl = null;
    if (result) {
      const name = { acid: { en: 'Acid', ja: 'さんせい' }, base: { en: 'Base', ja: 'アルカリせい' }, neutral: { en: 'Neutral', ja: 'ちゅうせい' } }[result.kind];
      rl = labelSprite({ en: `${result.color} → ${name.en}`, ja: `${result.color} → ${name.ja}` }, { width: 3.2 }); rl.position.set(2.3, 1.2, 0); rl.visible = false; scene.add(rl); labels.push(rl);
    }
    camera.position.set(0.2, 0.9, 5.8); camera.lookAt(0, -0.3, 0);
    let tt = 0;
    const target = result ? new THREE.Color(chem.COLOR_HEX[result.color] || '#cccccc') : null;
    return {
      update(dt) {
        tt += dt;
        if (!result) { dropper.position.y = 2.2 + Math.sin(tt) * 0.05; return; }
        // 0-1 s: the dropper comes down; 1-1.6 s: a drop falls; 1.6-3 s: the colour spreads
        dropper.position.y = 2.2 - Math.min(1, tt) * 0.7;
        if (tt > 1 && tt < 1.6) { drop.visible = true; drop.position.set(0, 1.0 - (tt - 1) / 0.6 * 0.8, 0); } else drop.visible = false;
        if (tt > 1.6) { const f = Math.min(1, (tt - 1.6) / 1.4); liquidMat.color.copy(new THREE.Color(0xd8e4e8)).lerp(target, f); if (f >= 1) { marker.visible = true; marker.position.set(-2.1 + (result.pH / 14) * 4.2, -1.3, 1.1); if (rl) rl.visible = true; } }
      },
      replay() { tt = 0; marker.visible = false; if (rl) rl.visible = false; liquidMat.color.set(0xd8e4e8); },
    };
  },

  candle({ scene, params, result, camera, labels }) {
    scene.background = new THREE.Color(0x1a2a3a);
    const table = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 4), new THREE.MeshStandardMaterial({ color: 0x8c917c })); table.position.y = -1.5; scene.add(table);
    const litres = params.litres; const jr = 0.55 * Math.cbrt(litres) + 0.3; const jh = 1.2 * Math.cbrt(litres) + 1.2;
    const jar = new THREE.Group();
    jar.add(glass(new THREE.CylinderGeometry(jr, jr, jh, 32, 1, true)));
    const dome = glass(new THREE.SphereGeometry(jr, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2)); dome.position.y = jh / 2; jar.add(dome);
    jar.position.set(0, -1.4 + jh / 2 + (result ? 2.5 : 2.5), 0); scene.add(jar);
    const flames = []; const lights = [];
    for (let i = 0; i < params.candles; i++) {
      const x = (i - (params.candles - 1) / 2) * 0.5;
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.9, 12), new THREE.MeshStandardMaterial({ color: 0xfff4d7 })); c.position.set(x, -0.95, 0); scene.add(c);
      const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 6), new THREE.MeshStandardMaterial({ color: 0x222 })); wick.position.set(x, -0.45, 0); scene.add(wick);
      const f = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), new THREE.MeshStandardMaterial({ color: 0xffc66a, emissive: 0xff7528, emissiveIntensity: 2.3 })); f.position.set(x, -0.3, 0); f.scale.set(0.7, 1.8, 0.7); scene.add(f); flames.push(f);
      const l = new THREE.PointLight(0xffa449, 6, 6, 2); l.position.set(x, -0.1, 0); scene.add(l); lights.push(l);
    }
    const dish = glass(new THREE.CylinderGeometry(0.5, 0.4, 0.4, 24, 1, true)); dish.position.set(2.4, -1.2, 0.4); scene.add(dish);
    const lime = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.38, 0.3, 24), new THREE.MeshStandardMaterial({ color: 0xcfe8f0, transparent: true, opacity: 0.35 })); lime.position.set(2.4, -1.22, 0.4); scene.add(lime);
    const dl = labelSprite({ en: 'lime water', ja: 'せっかいすい' }, { width: 1.6, background: null }); dl.position.set(2.4, -0.75, 0.4); scene.add(dl); labels.push(dl);
    const jl = labelSprite({ en: `${litres} L jar · ${params.o2 === '1' ? 'pure oxygen' : params.o2 === '0.16' ? 'used air' : 'air'}`, ja: `${litres} L の びん · ${params.o2 === '1' ? 'さんそだけ' : params.o2 === '0.16' ? 'つかった くうき' : 'くうき'}` }, { width: 3.4 }); jl.position.set(0, 2.5, 0); scene.add(jl); labels.push(jl);
    const timer = labelSprite('0.0 s', { width: 1.6, size: 40 }); timer.position.set(-2.6, 0.8, 0); scene.add(timer);
    camera.position.set(0.4, 0.8, 6.4); camera.lookAt(0.3, -0.3, 0);
    let tt = 0; const speed = result ? Math.max(1, result.seconds / 8) : 1; // the whole burn fits in ~8 s
    let smoke = null;
    return {
      update(dt) {
        tt += dt;
        const flicker = 1 + Math.sin(tt * 20) * 0.08 + Math.sin(tt * 7.3) * 0.05;
        if (!result) { flames.forEach((f) => f.scale.set(0.7 * flicker, 1.8 * flicker, 0.7)); lights.forEach((l) => { l.intensity = 6 * flicker; }); return; }
        // 0-1 s: the jar comes down. Then the clock runs at `speed` times real time.
        const down = Math.min(1, tt);
        jar.position.y = -1.4 + jh / 2 + 2.5 * (1 - down);
        const burn = Math.max(0, (tt - 1) * speed);
        const left = Math.max(0, result.seconds - burn);
        timer.userData.set(`${Math.min(result.seconds, burn).toFixed(1)} s`);
        const alive = left > 0 && !(result.seconds === 0 && tt > 1);
        const frac = result.seconds > 0 ? left / result.seconds : 0;
        flames.forEach((f) => { f.visible = alive; f.scale.set(0.7 * flicker, (0.6 + 1.2 * frac) * flicker, 0.7); });
        lights.forEach((l) => { l.intensity = alive ? 6 * flicker * (0.4 + 0.6 * frac) : 0; });
        if (!alive && !smoke && tt > 1) {
          smoke = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshStandardMaterial({ color: 0xb5b3a3, transparent: true, opacity: 0.4 })); smoke.position.set(0, -0.2, 0); scene.add(smoke);
          const ol = labelSprite({ en: `Out after ${result.seconds} s`, ja: `${result.seconds} びょうで きえた` }, { width: 2.6 }); ol.position.set(0, 1.4, 0.4); scene.add(ol); labels.push(ol);
        }
        if (smoke) { smoke.position.y += dt * 0.4; smoke.scale.addScalar(dt * 0.6); smoke.material.opacity = Math.max(0, smoke.material.opacity - dt * 0.12); }
        if (result.limewater === 'cloudy') { const f = Math.min(1, burn / Math.max(result.seconds, 1)); lime.material.opacity = 0.35 + 0.6 * f; lime.material.color.lerp(new THREE.Color(0xf4f4f4), dt); }
      },
      replay() { tt = 0; if (smoke) { scene.remove(smoke); smoke = null; } lime.material.opacity = 0.35; lime.material.color.set(0xcfe8f0); },
    };
  },
};

Object.assign(BUILDERS, moreBuilders({ labelSprite, graph }));

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.05, 300);
  let scene = null; let current = null; let running = false; let labels = [];
  let yaw = 0; let pitch = 0; let drag = false; let lx = 0; let ly = 0; let home = new THREE.Vector3(); let lookAt = new THREE.Vector3();
  canvas.addEventListener('pointerdown', (e) => { drag = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!drag) return; yaw -= (e.clientX - lx) * 0.008; pitch = THREE.MathUtils.clamp(pitch + (e.clientY - ly) * 0.006, -0.8, 1.2); lx = e.clientX; ly = e.clientY; });
  canvas.addEventListener('pointerup', () => { drag = false; }); canvas.addEventListener('pointercancel', () => { drag = false; });
  const clock = new THREE.Clock();
  let lastFrame = 0;
  function frame(now = 0) {
    if (!running) return;
    // 30 fps is plenty for a panel, and halves the cost on a weak GPU.
    if (now - lastFrame < 33) { requestAnimationFrame(frame); return; }
    lastFrame = now;
    // Up to a quarter second per frame, so a slow tablet still plays in real time.
    const dt = Math.min(clock.getDelta(), 0.25);
    if (current && scene) {
      current.update?.(dt);
      // orbit the camera around where the builder pointed it
      const r = home.distanceTo(lookAt);
      const base = Math.atan2(home.x - lookAt.x, home.z - lookAt.z);
      const el = Math.asin((home.y - lookAt.y) / r);
      const a = base + yaw; const e = THREE.MathUtils.clamp(el + pitch, -0.3, 1.4);
      camera.position.set(lookAt.x + Math.sin(a) * Math.cos(e) * r, lookAt.y + Math.sin(e) * r, lookAt.z + Math.cos(a) * Math.cos(e) * r);
      camera.lookAt(lookAt);
      renderer.render(scene, camera);
      current.afterRender?.();
    }
    requestAnimationFrame(frame);
  }
  onLang(() => { for (const l of labels) l.userData?.repaint?.(); });
  return {
    show({ exp, params, result }) {
      if (scene) scene.traverse((o) => { o.geometry?.dispose?.(); if (o.material?.dispose) o.material.dispose(); });
      scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b1026);
      scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x3a3a2a, 1.1));
      const key = new THREE.DirectionalLight(0xfff1d0, 1.6); key.position.set(4, 6, 5); scene.add(key);
      labels = []; yaw = 0; pitch = 0;
      camera.position.set(0, 2, 8); camera.lookAt(0, 0, 0);
      current = BUILDERS[exp.sim]({ scene, params, result, camera, labels, renderer, exp });
      home.copy(camera.position);
      // where the builder looked: recover it from the camera's forward direction
      const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
      const dist = current.lookDistance ?? Math.max(1, home.length());
      lookAt.copy(home).addScaledVector(dir, dist * 0.9);
      if (exp.sim === 'moon') lookAt.set(-1, 0, 0);
      if (exp.sim === 'gravity') lookAt.set(0, 0, 0);
      if (exp.sim === 'transit') lookAt.set(0, -0.6, 0);
      if (exp.sim === 'solubility') lookAt.set(0.3, -0.4, 0);
      if (exp.sim === 'acidbase') lookAt.set(0, -0.3, 0);
      if (exp.sim === 'candle') lookAt.set(0.3, -0.3, 0);
      const LOOK = { pendulum: [0, 0.6, 0], ramp: [0, 0, 0], lever: [0, 0, 0], meadow: [0, 0.2, 0], plant: [0, 0.4, 0], heart: [0, 0.4, 0], quake: [0, -0.5, 0], tsunami: [0, -0.8, 0], cloud: [0, 0.6, 0], bridge: [0, -0.2, 0], circuit: [0, 0, 0], gears: [0, 0, 0], dice: [0, 0, 0], pond: [0, -0.8, 0], classify: [0, 0, 0] };
      if (LOOK[exp.sim]) lookAt.set(...LOOK[exp.sim]);
      clock.getDelta();
      if (!running) { running = true; requestAnimationFrame(frame); }
    },
    replay() { current?.replay?.(); },
    stop() { running = false; },
    start() { if (!running && scene) { running = true; clock.getDelta(); requestAnimationFrame(frame); } },
    get active() { return running && !!scene; },
    renderer,
  };
}
