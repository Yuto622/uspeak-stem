// The experiment stage: every experiment is a small three.js scene a child can turn
// with a finger. The physics comes from `shared/sim` through the room; the stage only
// shows it. Nothing here computes a result, so nothing here can leak one.
//
// One renderer, one canvas in the panel, rebuilt for each experiment. The loop runs
// only while the panel is open (the island behind it is paused by the dialog anyway).
// The look (sky domes, studio floors, shadows, glows, motes) lives in stage-look.js.

import * as THREE from './vendor/three.module.js';
import { t, onLang } from './i18n.js';
import { gravity, moon } from '/shared/sim/index.js';
import * as chem from '/shared/sim/chem.js';
import { moreBuilders } from './stage-more.js';
import * as look from './stage-look.js';

const W = 720; const H = 420;
const { mat, metalMat, glass, glow, THEMES, ground, slab, woodMat, stoneMat, planetTex, cratersTex, sunDisc, emitter, roundedBox, addShadows, vignette } = look;

// A label in the scene: a soft pill with a hairline and a drop shadow, both languages.
function labelSprite(textOrPair, { size = 30, color = '#fff4d7', background = '#1c2a3acc', width = 2.4, accent = null } = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  s.scale.set(width, width * 96 / 512, 1); s.renderOrder = 6;
  const paint = (text = textOrPair) => {
    ctx.clearRect(0, 0, 512, 96);
    const str = typeof text === 'string' ? text : t(text);
    if (background) {
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
      ctx.fillStyle = background; ctx.beginPath(); ctx.roundRect(6, 6, 500, 84, 24); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(255,244,215,0.22)'; ctx.lineWidth = 2; ctx.stroke();
      if (accent) { ctx.fillStyle = accent; ctx.beginPath(); ctx.roundRect(14, 24, 8, 48, 4); ctx.fill(); }
    } else { ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8; }
    ctx.fillStyle = color; ctx.font = `600 ${size}px "Segoe UI", "Hiragino Sans", "Noto Sans JP", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(str, 256 + (accent ? 8 : 0), 50, 470);
    ctx.shadowColor = 'transparent';
    tex.needsUpdate = true;
  };
  paint();
  s.userData.set = (text) => paint(text);
  s.userData.repaint = () => paint();
  return s;
}

// A holographic graph: a translucent board with a glowing frame, grid and a polyline.
// children: [board, frame, grid, axes, halo, xLabel, yLabel, ...lines]
function graph({ w = 4, h = 2.4, xLabel, yLabel, tone = 0x7fd1ff }) {
  const g = new THREE.Group();
  const board = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.6, h + 0.8), new THREE.MeshBasicMaterial({ color: 0x0b1630, transparent: true, opacity: 0.72, depthWrite: false })); board.renderOrder = 1; g.add(board);
  const frame = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-w / 2 - 0.3, -h / 2 - 0.4, 0.01), new THREE.Vector3(w / 2 + 0.3, -h / 2 - 0.4, 0.01), new THREE.Vector3(w / 2 + 0.3, h / 2 + 0.4, 0.01), new THREE.Vector3(-w / 2 - 0.3, h / 2 + 0.4, 0.01)]), new THREE.LineBasicMaterial({ color: tone, transparent: true, opacity: 0.6 })); g.add(frame);
  const gridPts = []; for (let i = 1; i < 5; i++) { gridPts.push(new THREE.Vector3(-w / 2, -h / 2 + (h * i) / 5, 0.01), new THREE.Vector3(w / 2, -h / 2 + (h * i) / 5, 0.01)); } for (let i = 1; i < 6; i++) { gridPts.push(new THREE.Vector3(-w / 2 + (w * i) / 6, -h / 2, 0.01), new THREE.Vector3(-w / 2 + (w * i) / 6, h / 2, 0.01)); }
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gridPts), new THREE.LineBasicMaterial({ color: tone, transparent: true, opacity: 0.12 })));
  const axes = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-w / 2, -h / 2, 0.02), new THREE.Vector3(w / 2, -h / 2, 0.02), new THREE.Vector3(-w / 2, -h / 2, 0.02), new THREE.Vector3(-w / 2, h / 2, 0.02)]), new THREE.LineBasicMaterial({ color: 0xfff4d7, transparent: true, opacity: 0.8 }));
  g.add(axes);
  const halo = glow(tone, w * 1.4, 0.12); halo.position.z = -0.05; g.add(halo);
  const lx = labelSprite(xLabel, { size: 26, background: null, width: w * 0.7 }); lx.position.set(0, -h / 2 - 0.3, 0.05); g.add(lx);
  const ly = labelSprite(yLabel, { size: 26, background: null, width: w * 0.7 }); ly.position.set(0, h / 2 + 0.3, 0.05); g.add(ly);
  g.userData.labels = [lx, ly];
  const lines = [];
  g.userData.plot = (points, { color = 0xf2b134, dashed = false, xr, yr } = {}) => {
    const X = (x) => -w / 2 + ((x - xr[0]) / (xr[1] - xr[0])) * w; const Y = (y) => -h / 2 + ((y - yr[0]) / (yr[1] - yr[0])) * h;
    const pts = points.map(([x, y]) => new THREE.Vector3(X(x), Y(y), 0.03));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const m = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.08, gapSize: 0.06 }) : new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geo, m); if (dashed) line.computeLineDistances();
    g.add(line); lines.push(line);
    if (!dashed && pts.length > 2) { // the line's own glow: a few wider, fainter copies behind it
      for (const [dx, dy] of [[0.012, 0], [-0.012, 0], [0, 0.012], [0, -0.012]]) { const twin = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.22 })); twin.position.set(dx, dy, -0.004); g.add(twin); lines.push(twin); }
    }
    return line;
  };
  g.userData.mark = (x, y, { xr, yr, color = 0xffffff }) => {
    const X = -w / 2 + ((x - xr[0]) / (xr[1] - xr[0])) * w; const Y = -h / 2 + ((y - yr[0]) / (yr[1] - yr[0])) * h;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), new THREE.MeshBasicMaterial({ color })); m.position.set(X, Y, 0.06); g.add(m);
    const gl = glow(color, 0.5, 0.7); gl.position.set(X, Y, 0.07); g.add(gl); return m;
  };
  g.userData.clear = () => { for (const l of lines) { g.remove(l); } lines.length = 0; };
  return g;
}

// ---- builders: one per sim. Each returns { update(dt), replay(), afterRender?() }.
const BUILDERS = {
  gravity({ scene, params, result, camera, labels }) {
    const body = gravity.BODIES[params.body];
    const R = 1; const k = R / body.radius;
    THEMES.space(scene);
    const tex = { earth: planetTex(0x2f6fd0, 0x4f9a52, { seed: 3 }), moon: cratersTex(), mars: planetTex(0xb55a32, 0x8a3f22, { caps: true, seed: 5 }), jupiter: planetTex(0xd9b07a, 0xb0784a, { caps: false, bands: 9, seed: 7 }) }[params.body] || planetTex(body.color, 0x888888, { seed: 2 });
    const planet = new THREE.Mesh(new THREE.SphereGeometry(R, 56, 40), mat(0xffffff, { rough: 0.85, map: tex })); scene.add(planet);
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.03, 40, 28), new THREE.MeshBasicMaterial({ color: body.color, transparent: true, opacity: 0.18, side: THREE.BackSide, blending: THREE.AdditiveBlending })); scene.add(atmo);
    const halo = glow(body.color, R * 3.2, 0.35); scene.add(halo);
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.4); sun.position.set(-6, 3, 4); scene.add(sun);
    const ring = new THREE.Mesh(new THREE.RingGeometry((body.radius + params.altitude) * k - 0.004, (body.radius + params.altitude) * k + 0.004, 128), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide })); scene.add(ring);
    const pad = new THREE.Group(); const tower = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.03), metalMat(0xf2b134)); pad.add(tower);
    const padLight = glow(0xf2b134, 0.25, 0.9); pad.add(padLight); pad.position.set((body.radius + params.altitude) * k, 0, 0); scene.add(pad);
    const nameL = labelSprite({ en: `${body.en} · launch at ${params.altitude} km, ${params.speed} km/s`, ja: `${body.ja} · ${params.altitude} km の たかさから ${params.speed} km/s` }, { width: 4, accent: '#f2b134' });
    nameL.position.set(0, -R - 0.9, 0); scene.add(nameL); labels.push(nameL);
    let trailPts = []; let ship = null; let line = null; let tt = 0; let duration = 1; let fire = null;
    if (result?.trail) {
      trailPts = result.trail.map(([x, y]) => new THREE.Vector3(x * k, y * k, 0));
      const color = result.outcome === 'crash' ? 0xf06a52 : result.outcome === 'escape' ? 0xf2b134 : 0x7fd1ff;
      const geo = new THREE.BufferGeometry().setFromPoints(trailPts);
      const cols = new Float32Array(trailPts.length * 3); const c = new THREE.Color(color); for (let i = 0; i < trailPts.length; i++) { const f = 0.35 + 0.65 * (i / trailPts.length); cols.set([c.r * f, c.g * f, c.b * f], i * 3); }
      geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      line = new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 }));
      line.geometry.setDrawRange(0, 0); scene.add(line);
      ship = new THREE.Group(); const cone = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 10), metalMat(0xffffff)); ship.add(cone);
      const exhaust = glow(color, 0.3, 0.9); exhaust.position.y = -0.06; ship.add(exhaust); scene.add(ship);
      fire = emitter(scene, { n: 30, color, size: 0.08, rate: 24, life: 0.5, spread: 0.08, vel: [0, 0, 0] });
      duration = Math.min(8, 2 + trailPts.length / 120);
      const out = labelSprite({ en: { crash: 'It fell back down.', orbit: `It orbits! ${result.period} min per lap`, escape: 'It escaped the planet!' }[result.outcome], ja: { crash: 'おちてきた。', orbit: `まわった！ 1しゅう ${result.period} ぷん`, escape: 'ほしから にげだした！' }[result.outcome] }, { width: 4, accent: `#${c.getHexString()}` });
      out.position.set(0, R + 0.7, 0); scene.add(out); labels.push(out);
    }
    const maxR = trailPts.length ? Math.max(1.4, ...trailPts.map((p) => p.length())) : 1.6;
    camera.position.set(0.4, 0.9, Math.min(Math.max(2.1, maxR), 12) * 2.3); camera.lookAt(0, 0, 0);
    const up = new THREE.Vector3(0, 1, 0);
    return {
      update(dt, tnow = performance.now()) {
        planet.rotation.y += dt * 0.06; atmo.rotation.y += dt * 0.04; padLight.material.opacity = 0.5 + Math.sin(tnow / 200) * 0.4;
        if (!ship) return;
        tt = Math.min(duration, tt + dt);
        const i = Math.min(trailPts.length - 1, Math.floor((tt / duration) * (trailPts.length - 1)));
        ship.position.copy(trailPts[i]); line.geometry.setDrawRange(0, i + 1);
        const next = trailPts[Math.min(trailPts.length - 1, i + 2)]; const dir = next.clone().sub(trailPts[i]); if (dir.length() > 1e-6) ship.quaternion.setFromUnitVectors(up, dir.normalize());
        fire.userData.state.origin = [ship.position.x, ship.position.y, ship.position.z]; fire.userData.state.on = tt < duration;
      },
      replay() { tt = 0; },
    };
  },

  moon({ scene, params, result, camera, labels, renderer }) {
    THEMES.space(scene, { lights: false }); // the Sun is the only light, or the phases lie
    const sun = sunDisc(scene, -7, 0, 0, { r: 0.9 });
    const sunLight = new THREE.DirectionalLight(0xfff1d0, 3.4); sunLight.position.set(-7, 0, 0); sunLight.target.position.set(0, 0, 0); scene.add(sunLight); scene.add(sunLight.target);
    const earth = new THREE.Mesh(new THREE.SphereGeometry(0.7, 48, 36), mat(0xffffff, { rough: 0.7, map: planetTex(0x2f6fd0, 0x4f9a52, { seed: 3 }) })); scene.add(earth);
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 1, alphaMap: look.noiseTex(0x808080, 0.9) })); earth.add(clouds);
    const air = new THREE.Mesh(new THREE.SphereGeometry(0.76, 32, 24), new THREE.MeshBasicMaterial({ color: 0x7fb8ff, transparent: true, opacity: 0.2, side: THREE.BackSide, blending: THREE.AdditiveBlending })); scene.add(air);
    const orbitR = 3;
    const ring = new THREE.Mesh(new THREE.RingGeometry(orbitR - 0.012, orbitR + 0.012, 128), new THREE.MeshBasicMaterial({ color: 0x9fc8ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; scene.add(ring);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const tick = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshBasicMaterial({ color: 0x9fc8ff })); tick.position.set(-Math.cos(a) * orbitR, 0, Math.sin(a) * orbitR); scene.add(tick); }
    const a = (params.angle * Math.PI) / 180;
    // angle 0 = between Earth and Sun; the Moon travels anticlockwise seen from above.
    const mx = -Math.cos(a) * orbitR; const mz = Math.sin(a) * orbitR;
    const moonM = new THREE.Mesh(new THREE.SphereGeometry(0.26, 36, 28), mat(0xffffff, { rough: 1, map: cratersTex() })); moonM.position.set(mx, 0, mz); scene.add(moonM);
    const sl = labelSprite({ en: 'Sun', ja: 'たいよう' }, { width: 1.8, background: null }); sl.position.set(-7, 1.7, 0); scene.add(sl); labels.push(sl);
    const el = labelSprite({ en: 'Earth', ja: 'ちきゅう' }, { width: 1.8, background: null }); el.position.set(0, 1.2, 0); scene.add(el); labels.push(el);
    const ml = labelSprite({ en: `Moon · ${params.angle}°`, ja: `つき · ${params.angle}°` }, { width: 2.2, background: null }); ml.position.set(mx, 0.75, mz); scene.add(ml); labels.push(ml);
    camera.position.set(2.5, 5.5, 6.5); camera.lookAt(-1, 0, 0);
    // The answer: the Moon as seen from the Earth, drawn in the corner by a second
    // camera standing on the Earth. Only once the room has sent the result.
    const eye = new THREE.PerspectiveCamera(14, 1, 0.1, 50);
    const showInset = !!result;
    if (result) {
      const ph = moon.PHASES.find((p) => p.id === result.phase);
      const rl = labelSprite({ en: `${ph.en} · ${Math.round(result.lit * 100)}% lit`, ja: `${ph.ja}（${ph.en}）· ${Math.round(result.lit * 100)}%` }, { width: 4, accent: '#ffd36b' });
      rl.position.set(-1, -1.6, 2); scene.add(rl); labels.push(rl);
    }
    return {
      update(dt) { earth.rotation.y += dt * 0.25; clouds.rotation.y += dt * 0.05; sun.rotation.y += dt * 0.02; },
      afterRender() {
        if (!showInset) return;
        const size = 150;
        renderer.setScissorTest(true); renderer.setViewport(W - size - 10, 10, size, size); renderer.setScissor(W - size - 10, 10, size, size);
        eye.position.set(0, 0, 0); eye.lookAt(mx, 0, mz); eye.aspect = 1; eye.updateProjectionMatrix();
        renderer.clearDepth(); renderer.render(scene, eye);
        renderer.setScissorTest(false); renderer.setViewport(0, 0, W, H);
      },
    };
  },

  transit({ scene, params, result, camera, labels, exp }) {
    THEMES.space(scene);
    const tg = exp.targets[params.target];
    const tone = tg.starMassSolar < 0.3 ? 0xff8a5c : 0xfff0c0;
    const star = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 36), new THREE.MeshBasicMaterial({ color: tone, map: look.sunTex(tone) })); scene.add(star);
    const corona = glow(tone, 4.2, 0.55); scene.add(corona); const corona2 = glow(0xffffff, 2.5, 0.5); scene.add(corona2);
    scene.add(new THREE.PointLight(tone, 30, 20, 2));
    const k = Math.sqrt(tg.depth); // Rp / Rs
    const planet = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.035, k), 24, 18), mat(0x223344, { rough: 1 })); scene.add(planet);
    const limb = glow(0x7fb8ff, Math.max(0.035, k) * 4, 0.3); planet.add(limb);
    const orbitR = 2.6;
    const nl = labelSprite({ en: `${tg.en} · ${result ? 'watching for 27 days' : 'telescope ready'}`, ja: `${tg.ja} · ${result ? '27日 見つづける' : 'ぼうえんきょう じゅんび OK'}` }, { width: 4.2, accent: '#7fd1ff' }); nl.position.set(0, 1.9, 0); scene.add(nl); labels.push(nl);
    const g = graph({ w: 5.2, h: 1.6, xLabel: { en: 'days', ja: '日' }, yLabel: { en: 'brightness of the star', ja: 'ほしの あかるさ' } });
    g.position.set(0, -2.6, 0); scene.add(g); labels.push(...g.userData.labels);
    const meterBody = glass(new THREE.CylinderGeometry(0.22, 0.22, 1.2, 24, 1, true)); meterBody.position.set(3.4, 0, 0); scene.add(meterBody);
    const meter = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1, 24), new THREE.MeshBasicMaterial({ color: 0x7fd1ff })); meter.position.set(3.4, 0, 0); scene.add(meter);
    const meterGlow = glow(0x7fd1ff, 1.2, 0.5); meterGlow.position.set(3.4, 0, 0); scene.add(meterGlow);
    const mlab = labelSprite('100.00%', { width: 1.6 }); mlab.position.set(3.4, 0.95, 0); scene.add(mlab);
    camera.position.set(0.3, 1.3, 9.5); camera.lookAt(0, -0.6, 0);
    let tt = 0; const duration = 12; let line = null; let curve = null;
    if (result?.curve) {
      curve = result.curve;
      const lo = Math.min(...curve.flux); const hi = Math.max(...curve.flux);
      line = g.userData.plot(curve.t.map((x, i) => [x, curve.flux[i]]), { color: 0x7fd1ff, xr: [0, curve.t[curve.t.length - 1]], yr: [lo - (hi - lo) * 0.1, hi + (hi - lo) * 0.1] });
      line.geometry.setDrawRange(0, 0);
    }
    return {
      update(dt) {
        star.rotation.y += dt * 0.03; corona.material.opacity = 0.5 + Math.sin(performance.now() / 700) * 0.06;
        if (!curve) { planet.position.set(orbitR * Math.cos(tt), 0, orbitR * Math.sin(tt)); tt += dt * 0.4; return; }
        tt = Math.min(duration, tt + dt);
        const frac = tt / duration; const n = Math.floor(frac * curve.t.length);
        line.geometry.setDrawRange(0, n);
        const days = frac * curve.t[curve.t.length - 1];
        const phase = ((days - result.first) / tg.periodDays) * Math.PI * 2;
        planet.position.set(orbitR * Math.sin(phase), 0, orbitR * Math.cos(phase));
        planet.visible = planet.position.z > -0.9 || Math.abs(planet.position.x) > 1;
        const f = curve.flux[Math.max(0, n - 1)] ?? 1;
        const lo = Math.min(...curve.flux); const vis = (f - lo) / Math.max(1 - lo, 1e-6);
        meter.scale.y = 0.2 + 0.8 * vis; meter.position.y = (meter.scale.y - 1) / 2; meterGlow.material.opacity = 0.2 + 0.4 * vis; corona.scale.setScalar(4.2 * (0.9 + 0.1 * vis));
        mlab.userData.set(`${(f * 100).toFixed(2)}%`);
      },
      replay() { tt = 0; },
    };
  },

  solubility({ scene, params, result, camera, labels }) {
    const sol = chem.SOLUTES[params.solute];
    THEMES.lab(scene); ground(scene, { color: 0x33424f, r: 10, y: -1.75, grid: true });
    slab(scene, { y: -1.6, w: 8, d: 4, material: woodMat(0xa58c62) });
    const beaker = glass(new THREE.CylinderGeometry(0.9, 0.85, 2.4, 48, 1, true)); beaker.position.set(-1.6, -0.3, 0); scene.add(beaker);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.03, 8, 48), look.glassMat(0xffffff, 0.5)); lip.rotation.x = Math.PI / 2; lip.position.set(-1.6, 0.9, 0); scene.add(lip);
    const base = glass(new THREE.CircleGeometry(0.85, 48)); base.rotation.x = -Math.PI / 2; base.position.set(-1.6, -1.49, 0); scene.add(base);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.8, 1.7, 48), new THREE.MeshPhysicalMaterial({ color: 0x7fd1ff, transparent: true, opacity: 0.4, roughness: 0.05, clearcoat: 1 })); water.position.set(-1.6, -0.62, 0); scene.add(water);
    const surface = new THREE.Mesh(new THREE.CircleGeometry(0.84, 48), new THREE.MeshBasicMaterial({ color: 0xcfefff, transparent: true, opacity: 0.35 })); surface.rotation.x = -Math.PI / 2; surface.position.set(-1.6, 0.24, 0); scene.add(surface);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 48), mat(0x2a2a2a, { rough: 0.4, metal: 0.5, emissive: 0xff5a1f, emissiveIntensity: params.tempC / 80 * 1.6 })); plate.position.set(-1.6, -1.56, 0); scene.add(plate);
    const heat = glow(0xff7528, 2.6, Math.min(0.7, params.tempC / 80)); heat.position.set(-1.6, -1.4, 0); scene.add(heat);
    const bubbles = emitter(scene, { n: 40, color: 0xffffff, size: 0.06, rate: params.tempC / 6, life: 1.4, origin: [-1.6, -1.4, 0], spread: 0.6, vel: [0, 1.1, 0] });
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 10), look.glassMat(0xffffff, 0.6)); rod.position.set(-1.25, 0.2, 0.2); rod.rotation.z = -0.35; scene.add(rod);
    const tl = labelSprite(`${params.tempC}°C`, { width: 1.2, accent: '#ff7528' }); tl.position.set(-3.1, -1.1, 0.4); scene.add(tl);
    const gl = labelSprite({ en: `${params.grams} g ${sol.en}`, ja: `${sol.ja} ${params.grams} g` }, { width: 2.4 }); gl.position.set(-1.6, 1.45, 0); scene.add(gl); labels.push(gl);
    // crystals: one little gem per 2 g
    const n = Math.max(1, Math.round(params.grams / 2));
    const inst = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.08, 0), mat(sol.color, { rough: 0.25, metal: 0.1, flat: true }), n); inst.castShadow = true;
    const seeds = []; const dummy = new THREE.Object3D();
    for (let i = 0; i < n; i++) { const r = Math.random() * 0.7; const a = Math.random() * Math.PI * 2; seeds.push({ x: -1.6 + Math.cos(a) * r, z: Math.sin(a) * r, y: 0.1 + Math.random() * 0.6, rot: Math.random() * 3, dissolves: false, fall: 0 }); }
    scene.add(inst);
    const dissolvedFrac = result ? result.dissolved / Math.max(params.grams, 1) : 0;
    seeds.forEach((s, i) => { s.dissolves = i < Math.round(n * dissolvedFrac); });
    const g = graph({ w: 3.4, h: 2.2, xLabel: { en: 'water temperature °C', ja: 'みずの おんど °C' }, yLabel: { en: 'g that dissolve in 100 g water', ja: '100 g の みずに とける g' }, tone: 0xf2b134 });
    g.position.set(2.2, 0.2, -0.6); scene.add(g); labels.push(...g.userData.labels);
    const maxS = Math.max(...sol.table.map(([, v]) => v), params.grams) * 1.1;
    g.userData.plot(sol.table, { color: 0xf2b134, xr: [0, 100], yr: [0, maxS] });
    g.userData.plot([[0, params.grams], [100, params.grams]], { color: 0x7fd1ff, dashed: true, xr: [0, 100], yr: [0, maxS] });
    if (result) {
      g.userData.mark(params.tempC, result.limit, { xr: [0, 100], yr: [0, maxS] });
      const rl = labelSprite({ en: result.left > 0 ? `${result.dissolved} g dissolved · ${result.left} g left on the bottom` : `All ${result.dissolved} g dissolved`, ja: result.left > 0 ? `${result.dissolved} g とけた · ${result.left} g のこった` : `${result.dissolved} g ぜんぶ とけた` }, { width: 4.4, accent: '#f2b134' });
      rl.position.set(0.4, -2.25, 1); scene.add(rl); labels.push(rl);
    }
    camera.position.set(0.6, 1.5, 6.4); camera.lookAt(0.3, -0.4, 0);
    let tt = 0;
    return {
      update(dt) {
        tt += dt; rod.rotation.y += dt * 0.6; surface.position.y = 0.24 + Math.sin(tt * 2) * 0.01;
        seeds.forEach((s, i) => {
          let y = s.y; let sc = 1;
          if (result) {
            if (s.dissolves) sc = Math.max(0, 1 - tt / 2.5);               // fades into the water
            else { s.fall = Math.min(1, s.fall + dt * 0.5); y = s.y - (s.y + 1.4) * s.fall; } // settles on the bottom
          } else y = s.y + Math.sin(tt * 1.5 + i) * 0.03;
          dummy.position.set(s.x, y, s.z); dummy.rotation.set(s.rot, tt * 0.5 + i, 0); dummy.scale.setScalar(sc); dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix);
        });
        inst.instanceMatrix.needsUpdate = true;
        if (result && result.dissolved > 0) water.material.color.lerp(new THREE.Color(sol.color).lerp(new THREE.Color(0x7fd1ff), 0.5), Math.min(1, dt * 0.4));
        bubbles.userData.state.on = params.tempC > 30;
      },
      replay() { tt = 0; seeds.forEach((s) => { s.fall = 0; }); water.material.color.set(0x7fd1ff); },
    };
  },

  acidbase({ scene, params, result, camera, labels }) {
    const liq = chem.LIQUIDS[params.liquid]; const ind = chem.INDICATORS[params.indicator];
    THEMES.lab(scene); ground(scene, { color: 0x33424f, r: 10, y: -1.85, grid: true });
    slab(scene, { y: -1.7, w: 7.5, d: 3.2, material: stoneMat(0x5a6670) });
    const rack = new THREE.Mesh(roundedBox(2.4, 0.5, 1.0, 0.06), woodMat(0x7b6647)); rack.position.set(0, -1.35, 0); scene.add(rack);
    // a row of other tubes behind, each a different colour, so it reads as a lab shelf
    [0xf2a034, 0x7fd1ff, 0x9a6fd0, 0x4fd08a].forEach((c, i) => { const x = -0.9 + i * 0.6; if (Math.abs(x) < 0.3) return; const tb = glass(new THREE.CylinderGeometry(0.16, 0.16, 1.4, 20, 1, true)); tb.position.set(x, -0.5, -0.25); scene.add(tb); const lq = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.8, 20), mat(c, { rough: 0.2, transparent: true, opacity: 0.8 })); lq.position.set(x, -0.75, -0.25); scene.add(lq); });
    const tube = glass(new THREE.CylinderGeometry(0.32, 0.32, 2.2, 32, 1, true)); tube.position.set(0, 0.1, 0); scene.add(tube);
    const bottom = glass(new THREE.SphereGeometry(0.32, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)); bottom.position.set(0, -1.0, 0); scene.add(bottom);
    const liquidMat = new THREE.MeshPhysicalMaterial({ color: 0xd8e4e8, transparent: true, opacity: 0.8, roughness: 0.1, clearcoat: 1 });
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 1.4, 32), liquidMat); liquid.position.set(0, -0.3, 0); scene.add(liquid);
    const liquidBottom = new THREE.Mesh(new THREE.SphereGeometry(0.29, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), liquidMat); liquidBottom.position.set(0, -1.0, 0); scene.add(liquidBottom);
    const tubeGlow = glow(0xffffff, 1.6, 0); tubeGlow.position.set(0, -0.3, 0.2); scene.add(tubeGlow);
    const dropper = new THREE.Group(); const pip = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.03, 0.9, 16), look.glassMat(0xffffff, 0.5)); dropper.add(pip);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), mat(0xd04030, { rough: 0.3 })); bulb.position.y = 0.5; dropper.add(bulb); dropper.position.set(0, 2.2, 0); scene.add(dropper);
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), mat(0x9a6fd0, { rough: 0.1 })); drop.visible = false; scene.add(drop);
    const splash = emitter(scene, { n: 20, color: 0xffffff, size: 0.05, rate: 0, life: 0.5, origin: [0, 0.4, 0], spread: 0.3, vel: [0, 0.8, 0], gravity: 2 });
    const ll = labelSprite({ en: liq.en, ja: liq.ja }, { width: 2.6, accent: '#7fd1ff' }); ll.position.set(0, -2.2, 0.9); scene.add(ll); labels.push(ll);
    const il = labelSprite({ en: `+ ${ind.en}`, ja: `+ ${ind.ja}` }, { width: 2.6, background: null }); il.position.set(0, 3.0, 0); scene.add(il); labels.push(il);
    // pH scale as fifteen glossy tiles
    for (let i = 0; i <= 14; i++) { const tile = new THREE.Mesh(roundedBox(0.26, 0.1, 0.3, 0.03), mat(new THREE.Color().setHSL((i / 14) * 0.75, 0.65, 0.55), { rough: 0.25 })); tile.position.set(-2.1 + i * 0.3, -1.55, 1.1); scene.add(tile); }
    const s0 = labelSprite('pH 0', { width: 0.8, background: null }); s0.position.set(-2.1, -1.3, 1.1); scene.add(s0);
    const s14 = labelSprite('14', { width: 0.6, background: null }); s14.position.set(2.1, -1.3, 1.1); scene.add(s14);
    const marker = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); marker.rotation.x = Math.PI; marker.visible = false; scene.add(marker);
    const markerGlow = glow(0xffffff, 0.6, 0.8); markerGlow.visible = false; scene.add(markerGlow);
    let rl = null;
    if (result) {
      const name = { acid: { en: 'Acid', ja: 'さんせい' }, base: { en: 'Base', ja: 'アルカリせい' }, neutral: { en: 'Neutral', ja: 'ちゅうせい' } }[result.kind];
      rl = labelSprite({ en: `${result.color} → ${name.en}`, ja: `${result.color} → ${name.ja}` }, { width: 3.2, accent: chem.COLOR_HEX[result.color] || '#ffffff' }); rl.position.set(2.3, 1.2, 0); rl.visible = false; scene.add(rl); labels.push(rl);
    }
    camera.position.set(0.2, 0.9, 5.8); camera.lookAt(0, -0.3, 0);
    let tt = 0; let splashed = false;
    const target = result ? new THREE.Color(chem.COLOR_HEX[result.color] || '#cccccc') : null;
    return {
      update(dt) {
        tt += dt;
        if (!result) { dropper.position.y = 2.2 + Math.sin(tt) * 0.05; return; }
        // 0-1 s: the dropper comes down; 1-1.6 s: a drop falls; 1.6-3 s: the colour spreads
        dropper.position.y = 2.2 - Math.min(1, tt) * 0.7;
        if (tt > 1 && tt < 1.6) { drop.visible = true; drop.position.set(0, 1.0 - (tt - 1) / 0.6 * 0.8, 0); } else drop.visible = false;
        if (tt >= 1.6 && !splashed) { splashed = true; splash.userData.state.acc = 12; }
        if (tt > 1.6) { const f = Math.min(1, (tt - 1.6) / 1.4); liquidMat.color.copy(new THREE.Color(0xd8e4e8)).lerp(target, f); tubeGlow.material.color.copy(target); tubeGlow.material.opacity = 0.35 * f; if (f >= 1) { marker.visible = true; markerGlow.visible = true; marker.position.set(-2.1 + (result.pH / 14) * 4.2, -1.3, 1.1); markerGlow.position.copy(marker.position); if (rl) rl.visible = true; } }
      },
      replay() { tt = 0; splashed = false; marker.visible = false; markerGlow.visible = false; if (rl) rl.visible = false; liquidMat.color.set(0xd8e4e8); tubeGlow.material.opacity = 0; },
    };
  },

  candle({ scene, params, result, camera, labels }) {
    THEMES.lab(scene); ground(scene, { color: 0x2b3340, r: 10, y: -1.65, grid: true });
    slab(scene, { y: -1.5, w: 8, d: 4, material: stoneMat(0x7d8378) });
    const litres = params.litres; const jr = 0.55 * Math.cbrt(litres) + 0.3; const jh = 1.2 * Math.cbrt(litres) + 1.2;
    const jar = new THREE.Group();
    jar.add(glass(new THREE.CylinderGeometry(jr, jr, jh, 48, 1, true)));
    const dome = glass(new THREE.SphereGeometry(jr, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2)); dome.position.y = jh / 2; jar.add(dome);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(jr, 0.025, 8, 48), look.glassMat(0xffffff, 0.5)); rim.rotation.x = Math.PI / 2; rim.position.y = -jh / 2; jar.add(rim);
    jar.position.set(0, -1.4 + jh / 2 + 2.5, 0); scene.add(jar);
    const flames = []; const lights = []; const cores = [];
    for (let i = 0; i < params.candles; i++) {
      const x = (i - (params.candles - 1) / 2) * 0.5;
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.9, 20), mat(0xfff4d7, { rough: 0.45 })); c.position.set(x, -0.95, 0); scene.add(c);
      const drip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(0xfff4d7, { rough: 0.3 })); drip.position.set(x + 0.08, -0.6, 0.05); drip.scale.y = 1.8; scene.add(drip);
      const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 6), mat(0x222222)); wick.position.set(x, -0.45, 0); scene.add(wick);
      const f = glow(0xffa449, 0.9, 0.95); f.position.set(x, -0.25, 0); scene.add(f); flames.push(f);
      const core = glow(0xfff6d0, 0.35, 1); core.position.set(x, -0.33, 0); scene.add(core); cores.push(core);
      const l = new THREE.PointLight(0xffa449, 8, 7, 2); l.position.set(x, -0.1, 0); scene.add(l); lights.push(l);
    }
    const dish = glass(new THREE.CylinderGeometry(0.5, 0.4, 0.4, 32, 1, true)); dish.position.set(2.4, -1.2, 0.4); scene.add(dish);
    const lime = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.38, 0.3, 32), new THREE.MeshPhysicalMaterial({ color: 0xcfe8f0, transparent: true, opacity: 0.35, roughness: 0.1 })); lime.position.set(2.4, -1.22, 0.4); scene.add(lime);
    const dl = labelSprite({ en: 'lime water', ja: 'せっかいすい' }, { width: 1.6, background: null }); dl.position.set(2.4, -0.75, 0.4); scene.add(dl); labels.push(dl);
    const jl = labelSprite({ en: `${litres} L jar · ${params.o2 === '1' ? 'pure oxygen' : params.o2 === '0.16' ? 'used air' : 'air'}`, ja: `${litres} L の びん · ${params.o2 === '1' ? 'さんそだけ' : params.o2 === '0.16' ? 'つかった くうき' : 'くうき'}` }, { width: 3.6, accent: '#ffa449' }); jl.position.set(0, 2.9, 0); scene.add(jl); labels.push(jl);
    const timer = labelSprite('0.0 s', { width: 1.6, size: 40 }); timer.position.set(-2.6, 0.8, 0); scene.add(timer);
    const smoke = emitter(scene, { n: 40, color: 0xb5b3a3, size: 0.25, rate: 0, life: 2.2, origin: [0, -0.2, 0], spread: 0.15, vel: [0, 0.45, 0], additive: false });
    camera.position.set(0.4, 0.9, 6.4); camera.lookAt(0.3, -0.3, 0);
    let tt = 0; const speed = result ? Math.max(1, result.seconds / 8) : 1; // the whole burn fits in ~8 s
    let outLabel = null;
    const lit = (alive, frac, flicker) => { flames.forEach((f, i) => { f.visible = alive; f.scale.set(0.9 * flicker, (0.6 + 1.0 * frac) * flicker * 1.4, 1); f.position.x = (i - (params.candles - 1) / 2) * 0.5 + Math.sin(tt * 13 + i) * 0.01; }); cores.forEach((c) => { c.visible = alive; c.scale.setScalar(0.35 * flicker * (0.5 + 0.5 * frac)); }); lights.forEach((l) => { l.intensity = alive ? 8 * flicker * (0.3 + 0.7 * frac) : 0; }); };
    return {
      update(dt) {
        tt += dt;
        const flicker = 1 + Math.sin(tt * 20) * 0.08 + Math.sin(tt * 7.3) * 0.05;
        if (!result) { lit(true, 1, flicker); return; }
        // 0-1 s: the jar comes down. Then the clock runs at `speed` times real time.
        const down = Math.min(1, tt);
        jar.position.y = -1.4 + jh / 2 + 2.5 * (1 - down * down);
        const burn = Math.max(0, (tt - 1) * speed);
        const left = Math.max(0, result.seconds - burn);
        timer.userData.set(`${Math.min(result.seconds, burn).toFixed(1)} s`);
        const alive = left > 0 && !(result.seconds === 0 && tt > 1);
        const frac = result.seconds > 0 ? left / result.seconds : 0;
        lit(alive, frac, flicker);
        smoke.userData.state.on = !alive && tt > 1 && tt < 6; smoke.userData.state.rate = 14;
        if (!alive && !outLabel && tt > 1) {
          outLabel = labelSprite({ en: `Out after ${result.seconds} s`, ja: `${result.seconds} びょうで きえた` }, { width: 2.6, accent: '#b5b3a3' }); outLabel.position.set(0, 1.4, 0.4); scene.add(outLabel); labels.push(outLabel);
        }
        if (result.limewater === 'cloudy') { const f = Math.min(1, burn / Math.max(result.seconds, 1)); lime.material.opacity = 0.35 + 0.6 * f; lime.material.color.lerp(new THREE.Color(0xf4f4f4), dt); }
      },
      replay() { tt = 0; if (outLabel) { scene.remove(outLabel); outLabel = null; } lime.material.opacity = 0.35; lime.material.color.set(0xcfe8f0); },
    };
  },
};

Object.assign(BUILDERS, moreBuilders({ labelSprite, graph, look }));

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.05, 300);
  vignette(camera);
  let scene = null; let current = null; let running = false; let labels = [];
  let yaw = 0; let pitch = 0; let drag = false; let lx = 0; let ly = 0; const home = new THREE.Vector3(); const lookAt = new THREE.Vector3();
  let intro = 0; let idle = 0; let elapsed = 0;
  canvas.addEventListener('pointerdown', (e) => { drag = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!drag) return; yaw -= (e.clientX - lx) * 0.008; pitch = THREE.MathUtils.clamp(pitch + (e.clientY - ly) * 0.006, -0.8, 1.2); lx = e.clientX; ly = e.clientY; idle = 0; });
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
      elapsed += dt; intro = Math.min(1, intro + dt / 1.4); if (!drag) idle += dt;
      for (const fn of scene.userData.anims || []) fn(dt, elapsed);
      current.update?.(dt);
      // orbit the camera around where the builder pointed it; ease in from a little
      // further out, and drift very slowly while nobody is touching it
      const ease = 1 - Math.pow(1 - intro, 3);
      const R0 = home.distanceTo(lookAt); const r = R0 * (1.18 - 0.18 * ease);
      const base = Math.atan2(home.x - lookAt.x, home.z - lookAt.z);
      const el = Math.asin(THREE.MathUtils.clamp((home.y - lookAt.y) / R0, -1, 1));
      const settle = Math.min(1, idle / 3);
      const a = base + yaw + Math.sin(elapsed * 0.22) * 0.07 * settle; const e = THREE.MathUtils.clamp(el + pitch + Math.sin(elapsed * 0.17) * 0.02 * settle, -0.3, 1.4);
      camera.position.set(lookAt.x + Math.sin(a) * Math.cos(e) * r, lookAt.y + Math.sin(e) * r, lookAt.z + Math.cos(a) * Math.cos(e) * r);
      camera.lookAt(lookAt);
      renderer.render(scene, camera);
      current.afterRender?.();
    }
    requestAnimationFrame(frame);
  }
  onLang(() => { for (const l of labels) l.userData?.repaint?.(); });
  const LOOK = { moon: [-1, 0, 0], gravity: [0, 0, 0], transit: [0, -0.6, 0], solubility: [0.3, -0.4, 0], acidbase: [0, -0.3, 0], candle: [0.3, -0.3, 0], pendulum: [0, 0.6, 0], ramp: [0, 0, 0], lever: [0, 0, 0], meadow: [0, 0.2, 0], plant: [0, 0.4, 0], heart: [0, 0.4, 0], quake: [0, -0.5, 0], tsunami: [0, -0.8, 0], cloud: [0, 0.6, 0], bridge: [0, -0.2, 0], circuit: [0, 0, 0], gears: [0, 0, 0], dice: [0, 0, 0], pond: [0, -0.8, 0], classify: [0, 0, 0] };
  return {
    show({ exp, params, result }) {
      if (scene) scene.traverse((o) => { if (o === camera || o.parent === camera) return; o.geometry?.dispose?.(); const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) m?.dispose?.(); });
      scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b1026); scene.userData.anims = [];
      scene.add(camera);
      labels = []; yaw = 0; pitch = 0; intro = 0; idle = 0;
      camera.position.set(0, 2, 8); camera.lookAt(0, 0, 0);
      current = BUILDERS[exp.sim]({ scene, params, result, camera, labels, renderer, exp });
      addShadows(scene);
      home.copy(camera.position);
      // where the builder looked: recover it from the camera's forward direction
      const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
      const dist = current.lookDistance ?? Math.max(1, home.length());
      lookAt.copy(home).addScaledVector(dir, dist * 0.9);
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
