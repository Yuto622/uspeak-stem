// The 3D stages for the textbook shelf: forces, light and sound (小3・中1), electricity
// (小3〜小6), life (小3〜中3), earth (小3〜中1), the sky (小4・中3) and the turtle (小5).
// Same contract as the other builders: { update(dt), replay(), lookAt? }.

import * as THREE from './vendor/three.module.js';
import { t } from './i18n.js';
import * as phys2 from '/shared/sim/phys2.js';
import * as elec from '/shared/sim/elec.js';
import * as bio2 from '/shared/sim/bio2.js';
import * as geo2 from '/shared/sim/geo2.js';
import * as sky2 from '/shared/sim/sky2.js';

export function sciBuilders({ labelSprite, graph, look }) {
  const { mat, metalMat, plasticMat, glass, glassMat, glow, THEMES, ground, slab, woodMat, stoneMat, sunDisc, motes, emitter, roundedBox, tube, tree, hills, stars, anim } = look;
  const add = (scene, mesh, x = 0, y = 0, z = 0) => { mesh.position.set(x, y, z); scene.add(mesh); return mesh; };
  const box = (scene, x, y, z, w, h, d, color, extra) => add(scene, new THREE.Mesh(roundedBox(w, h, d, Math.min(0.05, w / 4, h / 4, d / 4)), typeof color === 'number' ? mat(color, extra) : color), x, y, z);
  const ball = (scene, x, y, z, r, color, extra) => add(scene, new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), typeof color === 'number' ? mat(color, extra) : color), x, y, z);
  const say = (scene, labels, pair, x, y, z, w = 3, opts = {}) => { const s = labelSprite(pair, { width: w, ...opts }); s.position.set(x, y, z); scene.add(s); labels.push(s); return s; };
  const lab = (scene, opts = {}) => { THEMES.lab(scene); ground(scene, { color: 0x2f3b48, r: 10, y: -1.6, grid: true }); if (opts.bench !== false) slab(scene, { y: -1.5, w: opts.w || 8, d: opts.d || 4, material: opts.material || woodMat(0xa58c62) }); };
  const outdoors = (scene, { dusk = false, sun = [8, 7, -14] } = {}) => { THEMES.sky(scene, { dusk }); sunDisc(scene, ...sun, { r: 0.9 }); hills(scene, { color: 0x5f8a4e, r: 16, y: -1.6 }); ground(scene, { color: 0x6aa35a, r: 9, y: -1.5, tex: look.noiseTex(0x6aa35a, 0.1) }); };
  const person = (scene, x, z, shirt = 0x3a6fd0) => { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.45, 4, 12), plasticMat(shirt)); body.position.y = 0.55; g.add(body); const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), mat(0xe8c39a, { rough: 0.7 })); head.position.y = 1.1; g.add(head); g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); g.position.set(x, -1.5, z); scene.add(g); return g; };

  return {
    // ---- FORCE ----
    rubber({ scene, params, result, camera, labels }) {
      lab(scene, { bench: false }); ground(scene, { color: 0x2f3b48, r: 11, y: -1.5, grid: true });
      const track = add(scene, new THREE.Mesh(roundedBox(10, 0.06, 1.6, 0.02), mat(0x334455, { rough: 0.9 })), 1.5, -1.47, 0); track.receiveShadow = true;
      for (let i = 0; i <= 7; i++) { const m = add(scene, new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 1.6), new THREE.MeshBasicMaterial({ color: 0xffffff })), -3.2 + i * 1.2, -1.43, 0); void m; const l = labelSprite(`${i} m`, { width: 0.7, background: null, size: 22 }); l.position.set(-3.2 + i * 1.2, -1.2, 0.9); scene.add(l); }
      const post = add(scene, new THREE.Mesh(roundedBox(0.3, 1.0, 1.4, 0.05), woodMat(0x6f5b3e)), -3.6, -1.0, 0); void post;
      const car = new THREE.Group(); car.add(new THREE.Mesh(roundedBox(1.0, 0.35, 0.6, 0.08), plasticMat(params.mass === 'heavy' ? 0x6d7a84 : 0xe4c239))); for (const dx of [-0.3, 0.3]) for (const dz of [-0.33, 0.33]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16), mat(0x1c1c1c)); w.rotation.x = Math.PI / 2; w.position.set(dx, -0.12, dz); car.add(w); }
      if (params.mass === 'heavy') { const brick = new THREE.Mesh(roundedBox(0.6, 0.3, 0.4, 0.04), stoneMat(0x9a9585)); brick.position.y = 0.3; car.add(brick); }
      car.traverse((o) => { if (o.isMesh) o.castShadow = true; }); car.position.set(-3.2, -1.2, 0); scene.add(car);
      const band = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 8), plasticMat(0xd9a06a)), -3.4, -1.2, 0); band.rotation.z = Math.PI / 2;
      const dust = emitter(scene, { n: 20, color: 0xd4c49b, size: 0.1, rate: 0, life: 0.6, spread: 0.3, vel: [-0.5, 0.4, 0], additive: false });
      say(scene, labels, { en: `stretch ${params.stretch} cm · ${params.mass} car`, ja: `${params.stretch} cm のばす · ${params.mass === 'heavy' ? 'おもい' : 'かるい'} くるま` }, 0, 2.2, 0, 3.4, { accent: '#f2b134' });
      const dist = say(scene, labels, '0.00 m', 0, 1.3, 0, 1.6, { size: 36 });
      camera.position.set(0.5, 1.6, 7.5); camera.lookAt(0.8, -0.6, 0);
      let tt = 0; const metres = result ? result.metres : 0; const dur = 3;
      const place = (m) => { car.position.x = -3.2 + m * 1.2; };
      return {
        update(dt) { tt += dt; const pull = Math.min(1, tt / 1.2) * (params.stretch / 20) * 0.8; if (!result) { car.position.x = -3.2 - pull; band.scale.y = 0.4 + pull; band.position.x = -3.4 - pull / 2; return; } if (tt < 1.2) { car.position.x = -3.2 - pull; band.scale.y = 0.4 + pull; band.position.x = -3.4 - pull / 2; return; } const f = Math.min(1, (tt - 1.2) / dur); const eased = 1 - (1 - f) * (1 - f); place(metres * eased); band.scale.y = 0.4; band.position.x = -3.4; dust.userData.state.origin = [car.position.x - 0.5, -1.4, 0]; dust.userData.state.on = f < 1; dust.userData.state.rate = 15; dist.userData.set(`${(metres * eased).toFixed(2)} m`); },
        replay() { tt = 0; place(0); },
        lookAt: [0.8, -0.6, 0],
      };
    },

    magnet({ scene, params, result, camera, labels }) {
      lab(scene);
      const magnet = new THREE.Group(); const red = new THREE.Mesh(roundedBox(0.5, 1.2, 0.5, 0.06), plasticMat(0xd04030)); red.position.x = -0.5; magnet.add(red); const blue = new THREE.Mesh(roundedBox(0.5, 1.2, 0.5, 0.06), plasticMat(0x3a6fd0)); blue.position.x = 0.5; magnet.add(blue); const bar = new THREE.Mesh(roundedBox(1.5, 0.5, 0.5, 0.06), metalMat(0x8d9aa0)); bar.position.y = 0.85; magnet.add(bar);
      const nL = labelSprite('N', { width: 0.5, background: null, size: 36 }); nL.position.set(-0.5, 0, 0.3); magnet.add(nL); const sL = labelSprite('S', { width: 0.5, background: null, size: 36 }); sL.position.set(0.5, 0, 0.3); magnet.add(sL);
      magnet.traverse((o) => { if (o.isMesh) o.castShadow = true; }); magnet.position.set(0, 0.6 + params.distance * 0.25, 0); scene.add(magnet);
      const field = []; for (let i = 0; i < 6; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5 + i * 0.25, 0.01, 6, 48, Math.PI), new THREE.MeshBasicMaterial({ color: 0x7fd1ff, transparent: true, opacity: 0.35 - i * 0.05 })); ring.rotation.z = Math.PI; ring.position.set(0, 0, 0.1); magnet.add(ring); field.push(ring); }
      const itemCol = { clip: 0xb8c0c8, nail: 0x6d7a84, can: 0xd8dde3, coin: 0xc9d0d6, wire: 0xb87333, eraser: 0xffffff, paper: 0xfff8e6 }[params.item];
      const item = box(scene, 0, -1.3, 0, params.item === 'paper' ? 1.0 : 0.4, params.item === 'paper' ? 0.02 : 0.25, params.item === 'paper' ? 1.0 : 0.9, params.item === 'paper' ? mat(itemCol) : ['clip', 'nail', 'can'].includes(params.item) ? metalMat(itemCol) : plasticMat(itemCol));
      const clips = []; for (let i = 0; i < 12; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 16), metalMat(0xb8c0c8)); c.position.set(-1.8 + (i % 6) * 0.3, -1.4, 0.8 + Math.floor(i / 6) * 0.3); c.rotation.x = Math.PI / 2; scene.add(c); clips.push(c); }
      const other = params.poles !== 'N-S' ? (() => { const g = magnet.clone(); g.position.set(2.4, 0.6, 0); g.rotation.y = params.poles === 'N-N' ? Math.PI : 0; scene.add(g); return g; })() : null;
      say(scene, labels, { en: `${phys2.TEST_ITEMS[params.item].en} · ${params.distance} cm away · ${params.poles}`, ja: `${phys2.TEST_ITEMS[params.item].ja} · ${params.distance} cm · ${params.poles}` }, 0, 2.8, 0, 4, { accent: '#d04030' });
      const verdict = say(scene, labels, '', 0, -2.0, 1.0, 2.6);
      camera.position.set(0.2, 0.8, 6.4); camera.lookAt(0, -0.2, 0);
      let tt = 0;
      return {
        update(dt) {
          tt += dt; field.forEach((r, i) => { r.material.opacity = 0.2 + Math.sin(tt * 2 + i) * 0.1; }); if (!result) return; const f = Math.min(1, tt / 1.5);
          if (result.sticks === 'yes') { item.position.y = -1.3 + (magnet.position.y - 0.75 + 1.3) * f; } else item.position.y = -1.3;
          clips.forEach((c, i) => { if (i < result.clips) { const a = (i / 12) * Math.PI * 2; c.position.set(Math.cos(a) * 0.45 * f + (-1.8 + (i % 6) * 0.3) * (1 - f), -1.4 + (magnet.position.y - 0.9 + 1.4) * f, Math.sin(a) * 0.25 * f + (0.8 + Math.floor(i / 6) * 0.3) * (1 - f)); } });
          if (other) { other.position.x = 2.4 + (result.pushPull === 'push' ? 1 : -1) * f * (result.pushPull === 'push' ? 1.2 : 0.95); }
          verdict.userData.set(`${t(result.sticks === 'yes' ? { en: 'sticks', ja: 'つく' } : { en: 'does not stick', ja: 'つかない' })} · ${result.clips} ${t({ en: 'clips', ja: 'こ' })}${other ? ` · ${t(result.pushPull === 'push' ? { en: 'push apart', ja: 'おしあう' } : { en: 'pull together', ja: 'ひきあう' })}` : ''}`);
        },
        replay() { tt = 0; },
        lookAt: [0, -0.2, 0],
      };
    },

    mirrors({ scene, params, result, camera, labels }) {
      outdoors(scene, { sun: [-9, 7, -12] });
      const wall = add(scene, new THREE.Mesh(roundedBox(4, 2.6, 0.3, 0.05), stoneMat(0x9a9585)), 0, -0.2, -2.5); wall.receiveShadow = true;
      const card = add(scene, new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), mat(0x1c1c1c, { rough: 1 })), 0, 0, -2.33);
      const spot = glow(0xfff1c0, 1.4, 0.2); spot.position.set(0, 0, -2.2); scene.add(spot);
      const thermo = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 10), glassMat(0xffffff, 0.5)), 0.7, 0.2, -2.3); void thermo; const merc = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 8), plasticMat(0xd04030)), 0.7, -0.1, -2.3); merc.scale.y = 0.3;
      const mirrors = []; const beams = [];
      for (let i = 0; i < params.count; i++) { const a = (i - (params.count - 1) / 2) * 0.5; const x = Math.sin(a) * 3.5; const z = 1.5 + Math.cos(a) * 1.0; const m = new THREE.Group(); const frame = new THREE.Mesh(roundedBox(0.9, 0.9, 0.08, 0.03), woodMat(0x6f5b3e)); m.add(frame); const g = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshPhysicalMaterial({ color: 0xdff6ff, roughness: 0.02, metalness: 0.9, clearcoat: 1 })); g.position.z = 0.045; m.add(g); const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8), metalMat(0x333333)); stand.position.y = -0.9; m.add(stand); m.position.set(x, -0.3, z); m.lookAt(0, 0, -2.3); scene.add(m); mirrors.push(m); const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.18, 1, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1c0, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })); const from = new THREE.Vector3(x, -0.3, z); const to = new THREE.Vector3(0, 0, -2.3); const mid = from.clone().lerp(to, 0.5); beam.position.copy(mid); beam.scale.y = from.distanceTo(to); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize()); scene.add(beam); beams.push(beam); }
      say(scene, labels, { en: `${params.count} mirror${params.count > 1 ? 's' : ''} · ${params.minutes} min`, ja: `かがみ ${params.count} まい · ${params.minutes} ぷん` }, 0, 2.4, 0, 2.8, { accent: '#ffd36b' });
      const tempL = say(scene, labels, '20.0°C', 2.6, 1.0, -1, 1.6, { size: 36 });
      camera.position.set(0.3, 1.2, 6.5); camera.lookAt(0, 0, -1);
      let tt = 0;
      return {
        update(dt) { tt += dt; if (!result) return; const f = Math.min(1, tt / 3); const temp = 20 + (result.tempC - 20) * f; tempL.userData.set(`${temp.toFixed(1)}°C`); merc.scale.y = 0.3 + ((temp - 20) / 40) * 0.9; merc.position.y = -0.4 + merc.scale.y / 2; beams.forEach((b) => { b.material.opacity = 0.35 * Math.min(1, tt); }); spot.material.opacity = 0.2 + Math.min(1, tt) * 0.15 * params.count; spot.scale.setScalar(1.4 + params.count * 0.2); card.material.color.set(new THREE.Color(0x1c1c1c).lerp(new THREE.Color(0x5a3a2a), f * 0.6)); },
        replay() { tt = 0; },
        lookAt: [0, 0, -1],
      };
    },

    sound({ scene, params, result, camera, labels }) {
      lab(scene, { material: woodMat(0x6f5b3e) });
      const body = add(scene, new THREE.Mesh(roundedBox(5.5, 0.5, 1.6, 0.1), woodMat(0xa58c62)), 0, -1.1, 0); body.castShadow = true;
      const hole = add(scene, new THREE.Mesh(new THREE.CircleGeometry(0.35, 32), mat(0x1c1c1c)), 0.6, -0.84, 0); hole.rotation.x = -Math.PI / 2;
      const L = params.length / 80 * 4.4; const bridgeX = -2.4 + L;
      add(scene, new THREE.Mesh(roundedBox(0.12, 0.4, 1.2, 0.03), mat(0x1c1c1c)), -2.4, -0.65, 0); const fret = add(scene, new THREE.Mesh(roundedBox(0.12, 0.4, 1.2, 0.03), mat(0x1c1c1c)), bridgeX, -0.65, 0); void fret;
      const N = 60; const geo = new THREE.BufferGeometry(); const pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) pos.set([-2.4 + (L * i) / (N - 1), -0.45, 0], i * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const string = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffffff })); scene.add(string); const stringGlow = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.4 })); stringGlow.position.z = 0.01; scene.add(stringGlow);
      const peg = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 12), metalMat(0xd4c49b)), -2.6, -0.3, 0); peg.rotation.x = Math.PI / 2; void peg;
      const rings = []; for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.015, 6, 48), new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0 })); r.position.set(-2.4 + L / 2, 0.2, 0); scene.add(r); rings.push(r); }
      const g = graph({ w: 3.0, h: 1.4, xLabel: { en: 'time', ja: 'じかん' }, yLabel: { en: 'the string', ja: 'げんの うごき' }, tone: 0xffd36b }); g.position.set(0, 1.9, -1); scene.add(g); labels.push(...g.userData.labels);
      const wave = []; for (let i = 0; i <= 120; i++) wave.push([i, 0]); const line = g.userData.plot(wave, { color: 0xffd36b, xr: [0, 120], yr: [-1, 1] });
      say(scene, labels, { en: `${params.length} cm · ${params.pluck} pluck · ${params.tension}`, ja: `${params.length} cm · ${params.pluck === 'hard' ? 'つよく' : 'そっと'} · ${params.tension}` }, 0, 3.2, 0, 3.4, { accent: '#ffd36b' });
      const hz = say(scene, labels, '', 2.8, 0.6, 0, 1.6, { size: 34 });
      camera.position.set(0.2, 1.4, 6.5); camera.lookAt(0, 0.2, 0);
      let tt = 0;
      return {
        update(dt) {
          tt += dt; if (!result) return; const amp = result.amplitude * 0.08 * Math.max(0, 1 - tt / 6); const f = result.hz / 20;
          const a = geo.attributes.position; for (let i = 0; i < N; i++) a.setY(i, -0.45 + Math.sin((i / (N - 1)) * Math.PI) * amp * Math.sin(tt * f * 6.28)); a.needsUpdate = true;
          rings.forEach((r, i) => { const ph = ((tt * 0.8 + i * 0.25) % 1); r.scale.setScalar(0.3 + ph * (1.2 + result.amplitude * 0.5)); r.material.opacity = (1 - ph) * 0.4 * Math.min(1, amp * 8); });
          const wp = line.geometry.attributes.position; for (let i = 0; i <= 120; i++) wp.setY(i, Math.sin((i / 120) * f * 12) * result.amplitude * 0.2 * 1.4 * Math.max(0, 1 - tt / 6)); wp.needsUpdate = true;
          hz.userData.set(`${result.hz} Hz · ${t(result.pitch === 'higher' ? { en: 'higher', ja: 'たかい' } : result.pitch === 'lower' ? { en: 'lower', ja: 'ひくい' } : { en: 'same', ja: 'おなじ' })}`);
        },
        replay() { tt = 0; },
        lookAt: [0, 0.2, 0],
      };
    },

    spring({ scene, params, result, camera, labels }) {
      lab(scene, { bench: false }); ground(scene, { color: 0x2f3b48, r: 10, y: -1.6, grid: true });
      add(scene, new THREE.Mesh(roundedBox(0.3, 4.6, 0.3, 0.05), woodMat(0x6f5b3e)), -1.5, 0.5, 0); add(scene, new THREE.Mesh(roundedBox(2.6, 0.25, 0.3, 0.05), woodMat(0x6f5b3e)), -0.3, 2.7, 0);
      const coils = new THREE.CatmullRomCurve3(Array.from({ length: 80 }, (_, i) => new THREE.Vector3(Math.cos(i * 0.6) * 0.22, 2.5 - i * 0.02, Math.sin(i * 0.6) * 0.22)));
      const springMesh = new THREE.Mesh(new THREE.TubeGeometry(coils, 300, 0.025, 8, false), metalMat(params.kind === 'stiff' ? 0x6d7a84 : params.kind === 'soft' ? 0xd4c49b : 0xb8c0c8)); springMesh.position.set(0.5, 0, 0); springMesh.castShadow = true; scene.add(springMesh);
      const hook = add(scene, new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 16), metalMat(0x333333)), 0.5, 0.9, 0);
      const weight = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5 + params.grams / 600, 24), metalMat(0xb87333)), 0.5, 0.5, 0); const wl = labelSprite(`${params.grams} g`, { width: 0.9, background: null, size: 24 }); weight.add(wl); wl.position.y = -0.5;
      for (let i = 0; i <= 10; i++) { add(scene, new THREE.Mesh(new THREE.BoxGeometry(i % 5 === 0 ? 0.5 : 0.3, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: 0xfff4d7 })), 1.6, 0.9 - i * 0.3, 0); if (i % 5 === 0) { const l = labelSprite(`${i} cm`, { width: 0.8, background: null, size: 22 }); l.position.set(2.2, 0.9 - i * 0.3, 0); scene.add(l); } }
      const g = graph({ w: 2.6, h: 1.8, xLabel: { en: 'weight (g)', ja: 'おもり（g）' }, yLabel: { en: 'stretch (cm)', ja: 'のび（cm）' }, tone: 0x7fd1ff }); g.position.set(-3.0, 0.9, -0.4); scene.add(g); labels.push(...g.userData.labels);
      const k = phys2.SPRINGS[params.kind].k; g.userData.plot([[0, 0], [300, (300 * 0.0098) / k]], { color: 0x7fd1ff, xr: [0, 300], yr: [0, 15] }); const mark = result ? g.userData.mark(params.grams, result.cm, { xr: [0, 300], yr: [0, 15] }) : null; if (mark) mark.visible = false;
      say(scene, labels, { en: `${params.grams} g on the ${phys2.SPRINGS[params.kind].en.toLowerCase()}`, ja: `${phys2.SPRINGS[params.kind].ja}に ${params.grams} g` }, 0, 3.4, 0, 3.2, { accent: '#7fd1ff' });
      const readout = say(scene, labels, '0.0 cm', 2.4, 2.4, 0, 1.4, { size: 34 });
      camera.position.set(0.3, 1.2, 6.8); camera.lookAt(0, 0.8, 0);
      let tt = 0; let vel = 0; let y = 0;
      return {
        update(dt) {
          tt += dt; if (!result) return; const target = result.cm * 0.3; const acc = (target - y) * 30 - vel * 3.5; vel += acc * dt; y += vel * dt;
          springMesh.scale.y = 1 + y / 1.6; hook.position.y = 0.9 - y; weight.position.y = 0.5 - y - (0.5 + params.grams / 600) / 2 + 0.25; readout.userData.set(`${(y / 0.3).toFixed(1)} cm`); if (mark && tt > 2) mark.visible = true;
        },
        replay() { tt = 0; y = 0; vel = 0; },
        lookAt: [0, 0.8, 0],
      };
    },

    // ---- MAKER (electricity) ----
    conductor({ scene, params, result, camera, labels }) {
      lab(scene);
      const batt = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.1, 24), metalMat(0x334455)), -2.2, -0.9, 0); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 12), metalMat(0xd4c49b)); cap.position.y = 0.6; batt.add(cap);
      const bulb = add(scene, glass(new THREE.SphereGeometry(0.32, 24, 18), 0xfff6d0, 0.3), 2.2, 0.2, 0); void bulb; const fil = glow(0xffb300, 0.5, 0); fil.position.set(2.2, 0.2, 0); scene.add(fil); const halo = glow(0xffd36b, 2.2, 0); halo.position.set(2.2, 0.2, 0); scene.add(halo); add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.3, 16), metalMat(0x666666)), 2.2, -0.2, 0);
      scene.add(tube([[-2.2, -0.2, 0], [-2.2, 1.2, 0], [2.2, 1.2, 0], [2.2, 0.5, 0]], 0.03, 0xb87333, { metal: true })); scene.add(tube([[-2.2, -1.4, 0], [-2.2, -1.7, 0.4], [-0.8, -1.7, 0.4], [-0.8, -1.2, 0.4]], 0.03, 0xb87333, { metal: true })); scene.add(tube([[2.2, -0.4, 0], [2.2, -1.7, 0.4], [0.8, -1.7, 0.4], [0.8, -1.2, 0.4]], 0.03, 0xb87333, { metal: true }));
      for (const x of [-0.8, 0.8]) add(scene, new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), metalMat(0xd4c49b)), x, -1.15, 0.4);
      const it = elec.CONDUCT_ITEMS[params.item]; const col = { clip: 0xb8c0c8, coin: 0xc9d0d6, wire: 0xb87333, foil: 0xdfe6ea, pencil: 0x333333, paper: 0xfff8e6, wood: 0xa58c62, plastic: 0x7fd1ff, glass: 0xdff6ff, eraser: 0xffffff }[params.item];
      const item = add(scene, new THREE.Mesh(roundedBox(1.9, params.item === 'paper' || params.item === 'foil' ? 0.02 : 0.18, 0.4, 0.02), it.conducts && params.item !== 'pencil' ? metalMat(col) : params.item === 'glass' ? glassMat(col, 0.5) : mat(col, { rough: 0.8 })), 0, 0.6, 0.4);
      const electrons = []; for (let i = 0; i < 14; i++) { const e = glow(0x7fd1ff, 0.2, 0); scene.add(e); electrons.push(e); }
      const loop = new THREE.CatmullRomCurve3([[-2.2, -0.2, 0.05], [-2.2, 1.2, 0.05], [2.2, 1.2, 0.05], [2.2, 0.5, 0.05], [2.2, -1.7, 0.45], [0.8, -1.7, 0.45], [0.8, -1.1, 0.45], [-0.8, -1.1, 0.45], [-0.8, -1.7, 0.45], [-2.2, -1.7, 0.45], [-2.2, -1.4, 0.05]].map((p) => new THREE.Vector3(...p)), true);
      say(scene, labels, { en: `${it.en} in the gap`, ja: `すきまに ${it.ja}` }, 0, 2.3, 0, 3, { accent: '#ffd36b' });
      const verdict = say(scene, labels, '', 0, -2.2, 1.0, 2.6);
      camera.position.set(0.2, 0.8, 6.6); camera.lookAt(0, -0.2, 0);
      let tt = 0;
      return {
        update(dt) { tt += dt; const f = Math.min(1, tt / 1.2); item.position.y = 0.6 - 1.7 * f; if (!result || f < 1) return; const on = result.lights === 'yes'; fil.material.opacity = on ? 1 : 0; halo.material.opacity = on ? 0.55 + Math.sin(tt * 30) * 0.03 : 0; electrons.forEach((e, i) => { e.material.opacity = on ? 0.9 : 0; e.position.copy(loop.getPointAt(((tt * 0.12 + i / 14) % 1 + 1) % 1)); }); verdict.userData.set(t(on ? { en: 'the bulb lights: it conducts', ja: 'でんきゅうが ついた：でんきを とおす' } : { en: 'dark: it does not conduct', ja: 'つかない：でんきを とおさない' })); },
        replay() { tt = 0; },
        lookAt: [0, -0.2, 0],
      };
    },

    cells({ scene, params, result, camera, labels }) {
      lab(scene);
      const n = params.count; const series = params.wiring === 'series';
      const cellsM = []; for (let i = 0; i < n; i++) { const x = series ? -2.4 + i * 1.1 : -2.0; const z = series ? 0 : (i - (n - 1) / 2) * 0.9; const c = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.0, 24), metalMat(0x334455)), x, -0.9, z); c.rotation.z = series ? Math.PI / 2 : 0; const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 12), metalMat(0xd4c49b)); cap.position.y = 0.55; c.add(cap); cellsM.push(c); }
      const bulb = add(scene, glass(new THREE.SphereGeometry(0.34, 24, 18), 0xfff6d0, 0.3), 2.0, 0.1, 0); void bulb; const fil = glow(0xffb300, 0.5, 0); fil.position.set(2.0, 0.1, 0); scene.add(fil); const halo = glow(0xffd36b, 2.4, 0); halo.position.set(2.0, 0.1, 0); scene.add(halo); const light = new THREE.PointLight(0xffd36b, 0, 6, 2); light.position.set(1.8, 0.1, 0.4); scene.add(light);
      scene.add(tube([[-2.6, -0.9, 0], [-2.6, 1.0, 0], [2.0, 1.0, 0], [2.0, 0.45, 0]], 0.03, 0xb87333, { metal: true })); scene.add(tube([[2.0, -0.25, 0], [2.0, -1.4, 0.3], [-1.0, -1.4, 0.3], [-1.6, -0.9, 0.2]], 0.03, 0xb87333, { metal: true }));
      const motor = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.5, 16), metalMat(0x666666)), 0, -1.0, 0.9); motor.rotation.x = Math.PI / 2; const fan = new THREE.Group(); for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(roundedBox(0.6, 0.12, 0.02, 0.02), plasticMat(0xd04030)); b.rotation.z = (i / 3) * Math.PI * 2; fan.add(b); } fan.position.set(0, -1.0, 1.2); scene.add(fan);
      say(scene, labels, { en: `${n} cell${n > 1 ? 's' : ''} in ${params.wiring}`, ja: `でんち ${n} こ · ${series ? 'ちょくれつ' : 'へいれつ'}` }, 0, 2.3, 0, 3, { accent: '#ffd36b' });
      const readout = say(scene, labels, '', -1.4, 1.6, 0, 2.2, { size: 32 });
      camera.position.set(0.2, 0.9, 6.6); camera.lookAt(0, -0.3, 0);
      let tt = 0;
      return {
        update(dt) { tt += dt; if (!result) return; const br = Math.min(1, result.volts / 4.5); fil.material.opacity = br * (1 + Math.sin(tt * 30) * 0.03); halo.material.opacity = br * 0.6; light.intensity = br * 8; fan.rotation.z += dt * result.volts * 3; readout.userData.set(`${result.volts} V · ${result.mA} mA · ${result.hours} h`); },
        replay() { tt = 0; },
        lookAt: [0, -0.3, 0],
      };
    },

    electromagnet({ scene, params, result, camera, labels }) {
      lab(scene);
      const nail = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 2.4, 12), metalMat(0x6d7a84)), 0, 0.3, 0); nail.castShadow = true;
      const turnsShown = Math.min(40, Math.round(params.turns / 8)); const coil = new THREE.CatmullRomCurve3(Array.from({ length: turnsShown * 12 }, (_, i) => new THREE.Vector3(Math.cos(i * 0.52) * 0.18, 1.0 - (i / (turnsShown * 12)) * 1.4, Math.sin(i * 0.52) * 0.18)));
      const wire = new THREE.Mesh(new THREE.TubeGeometry(coil, turnsShown * 24, 0.025, 8, false), metalMat(0xb87333)); scene.add(wire);
      const cellsM = []; for (let i = 0; i < params.cellsN; i++) { const c = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.0, 24), metalMat(0x334455)), -2.2 + i * 0.75, -1.0, 0.6); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 12), metalMat(0xd4c49b)); cap.position.y = 0.55; c.add(cap); cellsM.push(c); }
      scene.add(tube([[0.18, 1.0, 0], [-0.6, 1.4, 0.3], [-2.2, 1.4, 0.6], [-2.2, -0.45, 0.6]], 0.025, 0xb87333, { metal: true })); scene.add(tube([[0.18, -0.4, 0], [0.6, -1.3, 0.6], [-1.6, -1.4, 0.9], [-2.2 + (params.cellsN - 1) * 0.75, -1.5, 0.6]], 0.025, 0xb87333, { metal: true }));
      const sw = add(scene, new THREE.Mesh(roundedBox(0.5, 0.1, 0.3, 0.03), plasticMat(0xd04030)), 1.0, -1.3, 0.7); sw.rotation.z = 0.5;
      const clips = []; for (let i = 0; i < 24; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 6, 16), metalMat(0xb8c0c8)); c.position.set(-0.9 + (i % 8) * 0.26, -1.45, -0.6 + Math.floor(i / 8) * 0.3); c.rotation.x = Math.PI / 2; scene.add(c); clips.push(c); }
      const field = []; for (let i = 0; i < 5; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.5 + i * 0.3, 0.008, 6, 48), new THREE.MeshBasicMaterial({ color: 0x7fd1ff, transparent: true, opacity: 0 })); r.position.set(0, 0.3, 0); r.rotation.y = Math.PI / 2; scene.add(r); field.push(r); }
      say(scene, labels, { en: `${params.turns} turns · ${params.cellsN} cell${params.cellsN > 1 ? 's' : ''}`, ja: `${params.turns} まき · でんち ${params.cellsN} こ` }, 0, 2.4, 0, 3, { accent: '#b87333' });
      const count = say(scene, labels, '0', 2.4, 0.8, 0, 1.4, { size: 40 });
      camera.position.set(0.3, 0.9, 6.4); camera.lookAt(0, -0.2, 0);
      let tt = 0;
      return {
        update(dt) { tt += dt; if (!result) return; const on = tt > 0.6; sw.rotation.z = on ? 0 : 0.5; const f = Math.min(1, Math.max(0, (tt - 0.6) / 1.2)); field.forEach((r, i) => { r.material.opacity = on ? (0.25 - i * 0.04) * (0.8 + Math.sin(tt * 3 + i) * 0.2) : 0; }); let lifted = 0; clips.forEach((c, i) => { if (i < result.clips) { lifted++; const a = (i / 24) * Math.PI * 2; const ring = Math.floor(i / 8); const tx = Math.cos(a) * (0.12 + ring * 0.1); const tz = Math.sin(a) * (0.12 + ring * 0.1); const ty = -0.95 - ring * 0.15; const ox = -0.9 + (i % 8) * 0.26; const oz = -0.6 + Math.floor(i / 8) * 0.3; c.position.set(ox + (tx - ox) * f, -1.45 + (ty + 1.45) * f, oz + (tz - oz) * f); c.rotation.x = Math.PI / 2 * (1 - f); } }); count.userData.set(`${Math.round(lifted * f)} ${t({ en: 'clips', ja: 'こ' })}`); },
        replay() { tt = 0; },
        lookAt: [0, -0.2, 0],
      };
    },

    generator({ scene, params, result, camera, labels }) {
      lab(scene);
      const gen = add(scene, new THREE.Mesh(roundedBox(1.4, 1.0, 0.9, 0.08), metalMat(0x334455)), -2.0, -0.9, 0); gen.castShadow = true;
      const crank = new THREE.Group(); const arm = new THREE.Mesh(roundedBox(0.7, 0.1, 0.1, 0.03), metalMat(0xd04030)); arm.position.x = 0.3; crank.add(arm); const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 10), plasticMat(0x1c2a3a)); handle.position.set(0.6, 0, 0.2); handle.rotation.x = Math.PI / 2; crank.add(handle); crank.position.set(-2.0, -0.6, 0.5); scene.add(crank);
      const capBody = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 24), plasticMat(0x1c2a3a)), 0, -0.95, 0); void capBody; const capFill = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.01, 24), new THREE.MeshBasicMaterial({ color: 0x7fd1ff, transparent: true, opacity: 0.6 })), 0, -1.4, 0); const capL = labelSprite({ en: 'capacitor', ja: 'コンデンサー' }, { width: 1.6, background: null, size: 24 }); capL.position.set(0, -0.2, 0.3); scene.add(capL); labels.push(capL);
      const dev = params.device; const devM = dev === 'motor' ? add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.5, 16), metalMat(0x666666)), 2.0, -1.0, 0) : add(scene, dev === 'buzzer' ? new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 24), plasticMat(0x1c1c1c)) : glass(new THREE.SphereGeometry(dev === 'led' ? 0.16 : 0.32, 24, 18), dev === 'led' ? 0xff8a7a : 0xfff6d0, 0.35), 2.0, -0.7, 0); void devM;
      const fan = new THREE.Group(); if (dev === 'motor') { for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(roundedBox(0.6, 0.12, 0.02, 0.02), plasticMat(0xd04030)); b.rotation.z = (i / 3) * Math.PI * 2; fan.add(b); } fan.position.set(2.0, -1.0, 0.3); scene.add(fan); }
      const devGlow = glow(dev === 'led' ? 0xff6a5a : 0xffd36b, dev === 'led' ? 1.2 : 2.2, 0); devGlow.position.set(2.0, -0.7, 0.2); scene.add(devGlow);
      const buzz = []; if (dev === 'buzzer') for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.012, 6, 32), new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0 })); r.position.set(2.0, -0.7, 0); scene.add(r); buzz.push(r); }
      scene.add(tube([[-1.3, -0.9, 0], [-0.8, 0.4, 0], [0, 0.4, 0], [0, -0.5, 0]], 0.03, 0xb87333, { metal: true })); scene.add(tube([[0.3, -0.5, 0], [0.8, 0.4, 0], [2.0, 0.4, 0], [2.0, -0.4, 0]], 0.03, 0xd04030));
      say(scene, labels, { en: `${params.turns} cranks → ${elec.DEVICES[dev].en}`, ja: `${params.turns} かい まわす → ${elec.DEVICES[dev].ja}` }, 0, 2.3, 0, 3, { accent: '#7fd1ff' });
      const clock = say(scene, labels, '', 2.0, 0.9, 0, 1.6, { size: 34 }); const stored = say(scene, labels, '0.0 J', 0, 1.2, 0, 1.4, { size: 30 });
      camera.position.set(0.2, 0.9, 6.6); camera.lookAt(0, -0.3, 0);
      let tt = 0; const crankDur = Math.min(4, params.turns * 0.08);
      return {
        update(dt) {
          tt += dt; if (!result) return;
          if (tt < crankDur) { crank.rotation.z += dt * 10; const f = tt / crankDur; capFill.scale.y = Math.max(0.01, f * 85); capFill.position.y = -1.4 + (f * 0.85) / 2; stored.userData.set(`${(result.stored * f).toFixed(1)} J`); return; }
          const run = tt - crankDur; const left = Math.max(0, 1 - run / Math.max(0.5, Math.min(result.seconds, 12))); const shownSec = Math.min(result.seconds, run * (result.seconds / Math.min(result.seconds, 12)));
          capFill.scale.y = Math.max(0.01, left * 85); capFill.position.y = -1.4 + (left * 0.85) / 2; devGlow.material.opacity = left > 0 ? 0.6 + Math.sin(tt * 20) * 0.05 : 0; fan.rotation.z += dt * 12 * left; buzz.forEach((r, i) => { const ph = ((tt * 1.5 + i / 3) % 1); r.scale.setScalar(0.5 + ph); r.material.opacity = left > 0 ? (1 - ph) * 0.5 : 0; });
          clock.userData.set(`${shownSec.toFixed(1)} s${left <= 0 ? ` · ${t({ en: 'empty', ja: 'からっぽ' })}` : ''}`); stored.userData.set(`${(result.stored * left).toFixed(1)} J`);
        },
        replay() { tt = 0; },
        lookAt: [0, -0.3, 0],
      };
    },

    // ---- LIFE ----
    germination({ scene, params, result, camera, labels }) {
      const dark = params.light === 'dark'; if (dark) THEMES.night(scene); else THEMES.sky(scene);
      ground(scene, { color: dark ? 0x3a3f4a : 0xc9b48a, r: 9, y: -1.5 }); slab(scene, { y: -1.4, w: 7, d: 3, h: 0.2, material: woodMat(0xa58c62) });
      const cup = glass(new THREE.CylinderGeometry(0.8, 0.65, 1.0, 32, 1, true)); cup.position.set(0, -0.8, 0); scene.add(cup);
      const cotton = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.6, 0.25, 24), mat(0xf4f1ea, { rough: 1 })), 0, -1.15, 0); void cotton;
      if (params.water === 'yes') { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.64, params.air === 'no' ? 0.95 : 0.35, 32), new THREE.MeshPhysicalMaterial({ color: 0x7fd1ff, transparent: true, opacity: 0.4, roughness: 0.05, clearcoat: 1 })); w.position.set(0, params.air === 'no' ? -0.82 : -1.1, 0); scene.add(w); }
      const seeds = [0, 1, 2].map((i) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), mat(0xe8d8a8, { rough: 0.6 })); s.scale.set(1, 0.7, 1.3); s.position.set(-0.3 + i * 0.3, -1.0, (i % 2) * 0.2 - 0.1); s.castShadow = true; scene.add(s); return s; });
      const shoots = seeds.map((s) => { const g = new THREE.Group(); const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1, 8), mat(0x4f8f4a)); stem.position.y = 0.5; g.add(stem); for (const k of [-1, 1]) { const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), mat(0x5faa5a, { rough: 0.7 })); leaf.scale.set(1, 0.3, 0.6); leaf.position.set(k * 0.15, 1.0, 0); g.add(leaf); } g.position.copy(s.position); g.scale.setScalar(0.01); scene.add(g); return g; });
      const fridge = params.tempC < 10 ? add(scene, new THREE.Mesh(roundedBox(2.4, 2.6, 1.6, 0.1), mat(0xdfe6ea, { rough: 0.4 })), 0, -0.1, -1.4) : null; if (fridge) { const frost = glow(0xbfe6ff, 3, 0.25); frost.position.set(0, 0, 0.2); scene.add(frost); }
      if (params.tempC > 32) { const lamp = glow(0xff7528, 3, 0.35); lamp.position.set(0, 1.5, 0); scene.add(lamp); }
      const thermo = say(scene, labels, `${params.tempC}°C`, -2.0, 0.6, 0, 1.2, { size: 32 }); void thermo;
      say(scene, labels, { en: `water ${params.water} · air ${params.air} · ${params.tempC}°C · ${params.light}`, ja: `みず ${params.water === 'yes' ? 'あり' : 'なし'} · くうき ${params.air === 'yes' ? 'あり' : 'なし'} · ${params.tempC}°C · ${params.light === 'light' ? 'あかるい' : 'くらい'}` }, 0, 2.4, 0, 4.2, { accent: '#4fd08a' });
      const day = say(scene, labels, { en: 'day 0', ja: '0日め' }, 2.2, 0.6, 0, 1.3);
      const verdict = say(scene, labels, '', 0, 1.4, 0, 2.8);
      camera.position.set(0.3, 1.0, 5.8); camera.lookAt(0, -0.3, 0);
      let tt = 0; const dur = 5;
      return {
        update(dt) { tt += dt; if (!result) return; const f = Math.min(1, tt / dur); const days = Math.round(f * (result.days || 12)); day.userData.set(t({ en: `day ${days}`, ja: `${days}日め` })); if (result.germinates === 'yes') { const g = Math.max(0, (f - 0.3) / 0.7); shoots.forEach((s, i) => s.scale.setScalar(Math.max(0.01, g * (0.9 + i * 0.1)))); seeds.forEach((s) => { s.material.color.set(new THREE.Color(0xe8d8a8).lerp(new THREE.Color(0xc9d98a), g)); }); } else seeds.forEach((s) => { s.material.color.set(new THREE.Color(0xe8d8a8).lerp(new THREE.Color(0x8a7a5c), f * 0.5)); }); if (f >= 1) verdict.userData.set(t(result.germinates === 'yes' ? { en: `sprouted on day ${result.days}`, ja: `${result.days}日めに はつが` } : { en: `no sprout: missing ${result.missing}`, ja: `はつがしない：${result.missing} が たりない` })); },
        replay() { tt = 0; shoots.forEach((s) => s.scale.setScalar(0.01)); },
        lookAt: [0, -0.3, 0],
      };
    },

    medaka({ scene, params, result, camera, labels }) {
      THEMES.lab(scene); ground(scene, { color: 0x2f3b48, r: 10, y: -1.6, grid: true }); slab(scene, { y: -1.5, w: 8, d: 4, material: woodMat(0x6f5b3e) });
      const tank = glass(new THREE.BoxGeometry(4.2, 2.2, 1.8)); tank.position.set(0, -0.3, 0); scene.add(tank);
      const water = new THREE.Mesh(new THREE.BoxGeometry(4.1, 1.9, 1.7), new THREE.MeshPhysicalMaterial({ color: 0x7fd1ff, transparent: true, opacity: 0.35, roughness: 0.05 })); water.position.set(0, -0.45, 0); scene.add(water);
      add(scene, new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.2, 1.6), mat(0xd9c38a, { rough: 1, map: look.noiseTex(0xd9c38a, 0.1) })), 0, -1.3, 0);
      for (let i = 0; i < 4; i++) { const w = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 1.4, 8), mat(0x4f9a52)), -1.6 + i * 1.0, -0.6, -0.6); w.rotation.z = (i % 2 ? 1 : -1) * 0.15; }
      const heater = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 10), glassMat(0xffffff, 0.5)), 1.8, -0.6, 0.5); void heater; const hGlow = glow(0xff7528, 0.9, Math.min(0.8, Math.max(0, (params.tempC - 15) / 25))); hGlow.position.set(1.8, -0.6, 0.5); scene.add(hGlow);
      const eggs = [0, 1, 2].map((i) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), glassMat(0xfff1c0, 0.6)); e.position.set(-0.6 + i * 0.6, -0.2 + (i % 2) * 0.2, 0.2); scene.add(e); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), mat(0x1c1c1c)); eye.position.set(0.05, 0.03, 0.12); eye.visible = false; e.add(eye); return { e, eye }; });
      const fry = eggs.map(({ e }) => { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.22, 3, 8), mat(0xf2b134)); body.rotation.z = Math.PI / 2; g.add(body); const tail = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 6), mat(0xf2b134)); tail.rotation.z = Math.PI / 2; tail.position.x = -0.18; g.add(tail); g.position.copy(e.position); g.visible = false; scene.add(g); return g; });
      const bubbles = emitter(scene, { n: 20, color: 0xffffff, size: 0.05, rate: 3, life: 1.6, origin: [-1.7, -1.2, 0.4], spread: 0.1, vel: [0, 0.6, 0] }); void bubbles;
      say(scene, labels, { en: `water at ${params.tempC}°C`, ja: `すいおん ${params.tempC}°C` }, 0, 2.3, 0, 2.4, { accent: '#f2b134' });
      const day = say(scene, labels, { en: 'day 0', ja: '0日め' }, -2.8, 1.0, 0, 1.3); const verdict = say(scene, labels, '', 0, 1.4, 0, 2.6);
      camera.position.set(0.2, 0.8, 6.4); camera.lookAt(0, -0.3, 0);
      let tt = 0; const dur = 6;
      return {
        update(dt) { tt += dt; fry.forEach((g, i) => { if (g.visible) { g.position.x += Math.sin(tt * 2 + i) * dt * 0.6; g.rotation.y = Math.sin(tt * 2 + i) > 0 ? 0 : Math.PI; } }); if (!result) return; const f = Math.min(1, tt / dur); const total = result.days || 20; const days = Math.round(f * total); day.userData.set(t({ en: `day ${days}`, ja: `${days}日め` })); eggs.forEach(({ e, eye }) => { eye.visible = result.hatches === 'yes' && f > 0.4; e.material.opacity = 0.6 - f * 0.2; }); if (result.hatches === 'yes' && f >= 1) { eggs.forEach(({ e }) => { e.visible = false; }); fry.forEach((g) => { g.visible = true; }); verdict.userData.set(t({ en: `hatched on day ${result.days}`, ja: `${result.days}日めに かえった` })); } else if (result.hatches === 'no' && f >= 1) { eggs.forEach(({ e }) => e.material.color.set(0xbbbbbb)); verdict.userData.set(t({ en: 'never hatched', ja: 'かえらなかった' })); } },
        replay() { tt = 0; eggs.forEach(({ e }) => { e.visible = true; e.material.color.set(0xfff1c0); }); fry.forEach((g) => { g.visible = false; }); },
        lookAt: [0, -0.3, 0],
      };
    },

    saliva({ scene, params, result, camera, labels }) {
      lab(scene);
      const bath = glass(new THREE.BoxGeometry(2.6, 1.0, 1.4)); bath.position.set(-0.6, -1.0, 0); scene.add(bath); const bathWater = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 1.3), new THREE.MeshPhysicalMaterial({ color: params.tempC >= 30 ? 0xffd6b0 : 0xbfe6ff, transparent: true, opacity: 0.4, roughness: 0.05 })); bathWater.position.set(-0.6, -1.05, 0); scene.add(bathWater);
      const steam = emitter(scene, { n: 20, color: 0xffffff, size: 0.18, rate: params.tempC >= 50 ? 5 : 0, life: 1.5, origin: [-0.6, -0.5, 0], spread: 1.0, vel: [0, 0.5, 0], additive: false }); void steam;
      const tubes = [-1.1, -0.1].map((x, i) => { const tg = glass(new THREE.CylinderGeometry(0.18, 0.18, 1.6, 20, 1, true)); tg.position.set(x, -0.4, 0); scene.add(tg); const lq = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 20), new THREE.MeshPhysicalMaterial({ color: 0xf4f8ff, transparent: true, opacity: 0.6, roughness: 0.05 })); lq.position.set(x, -0.7, 0); scene.add(lq); const lab2 = labelSprite(i ? { en: 'with saliva', ja: 'だえき あり' } : { en: 'water only', ja: 'みずだけ' }, { width: 1.4, background: null, size: 22 }); lab2.position.set(x, 0.7, 0.2); scene.add(lab2); labels.push(lab2); return lq; });
      const dropper = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.8, 12), glassMat(0xffffff, 0.5)), 1.8, 1.2, 0); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), mat(0x8a5a3a)); bulb.position.y = 0.45; dropper.add(bulb); const iodL = labelSprite({ en: 'iodine', ja: 'ヨウそえき' }, { width: 1.2, background: null, size: 22 }); iodL.position.set(1.8, 2.0, 0); scene.add(iodL); labels.push(iodL);
      const thermo = say(scene, labels, `${params.tempC}°C`, -2.6, 0.2, 0, 1.1, { size: 30 }); void thermo;
      say(scene, labels, { en: `${params.saliva === 'yes' ? 'starch + saliva' : 'starch + water'} · ${params.tempC}°C · ${params.minutes} min`, ja: `でんぷん ＋ ${params.saliva === 'yes' ? 'だえき' : 'みず'} · ${params.tempC}°C · ${params.minutes} ぷん` }, 0, 2.6, 0, 4, { accent: '#8a5a3a' });
      const clock = say(scene, labels, '0:00', 1.0, 1.3, 0, 1.2); const verdict = say(scene, labels, '', 0, -2.1, 1.0, 3.0);
      camera.position.set(0.3, 0.9, 6.2); camera.lookAt(0, -0.2, 0);
      let tt = 0; const dur = 4;
      return {
        update(dt) { tt += dt; if (!result) return; const f = Math.min(1, tt / dur); clock.userData.set(`${Math.floor(params.minutes * f)}:00`); if (f >= 1) { const g = Math.min(1, (tt - dur) / 1.5); dropper.position.set(tubes.length ? (params.saliva === 'yes' ? -0.1 : -1.1) + 1.9 * (1 - g) : 0, 1.2 - 0.3 * g, 0); if (g >= 1) { const target = result.iodine === 'blue-black' ? 0x1c2a4a : 0x9a6a3a; tubes[params.saliva === 'yes' ? 1 : 0].material.color.lerp(new THREE.Color(target), Math.min(1, dt * 2)); tubes[params.saliva === 'yes' ? 0 : 1].material.color.lerp(new THREE.Color(0x1c2a4a), Math.min(1, dt * 2)); verdict.userData.set(`${t(result.iodine === 'blue-black' ? { en: 'blue-black: starch still there', ja: 'あおむらさき：でんぷんが のこっている' } : { en: 'brown: the starch is gone', ja: 'ちゃいろ：でんぷんが なくなった' })} · ${result.starchLeft}%`); } } },
        replay() { tt = 0; tubes.forEach((lq) => lq.material.color.set(0xf4f8ff)); dropper.position.set(1.8, 1.2, 0); },
        lookAt: [0, -0.2, 0],
      };
    },

    breath({ scene, params, result, camera, labels }) {
      lab(scene);
      const kid = person(scene, -2.2, 0, 0x3a6fd0); kid.position.y = -1.5;
      const bag = add(scene, new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 18), glassMat(0xdff6ff, 0.35)), -0.6, -0.4, 0); const strawM = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8), plasticMat(0xd04030)), -1.5, -0.4, 0); strawM.rotation.z = Math.PI / 2;
      const jar = glass(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 32, 1, true)); jar.position.set(1.6, -0.8, 0); scene.add(jar); const lime = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.7, 32), new THREE.MeshPhysicalMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.35, roughness: 0.05 })); lime.position.set(1.6, -1.0, 0); scene.add(lime);
      const limeL = labelSprite({ en: 'lime water', ja: 'せっかいすい' }, { width: 1.4, background: null, size: 22 }); limeL.position.set(1.6, 0.1, 0.3); scene.add(limeL); labels.push(limeL);
      const bubbles = emitter(scene, { n: 30, color: 0xffffff, size: 0.05, rate: 0, life: 0.8, origin: [1.6, -1.3, 0], spread: 0.3, vel: [0, 1.0, 0] });
      const o2 = graph({ w: 2.4, h: 1.5, xLabel: { en: 'O₂ · CO₂', ja: 'さんそ · にさんかたんそ' }, yLabel: { en: '%', ja: '%' }, tone: 0x7fd1ff }); o2.position.set(-0.4, 1.9, -0.6); scene.add(o2); labels.push(...o2.userData.labels);
      const bars = [[-0.6, 0x7fd1ff], [0.6, 0xff8a7a]].map(([x, c]) => { const b = new THREE.Mesh(roundedBox(0.5, 1, 0.1, 0.02), plasticMat(c)); b.position.set(x, -0.75 + 0.005, 0.05); b.scale.y = 0.01; o2.add(b); return b; });
      say(scene, labels, { en: `${params.sample === 'in' ? 'air breathed in' : 'air breathed out'} · after ${params.activity === 'rest' ? 'resting' : params.activity === 'walk' ? 'walking' : 'running'}`, ja: `${params.sample === 'in' ? 'すう くうき' : 'はいた いき'} · ${params.activity === 'rest' ? 'やすんだ' : params.activity === 'walk' ? 'あるいた' : 'はしった'} あと` }, 0, 3.0, 0, 4, { accent: '#ff8a7a' });
      const breaths = say(scene, labels, '', -2.2, 1.0, 0, 1.6); const verdict = say(scene, labels, '', 1.6, 0.9, 0, 2.0);
      camera.position.set(0.3, 0.9, 6.4); camera.lookAt(0, -0.2, 0);
      let tt = 0;
      return {
        update(dt) { tt += dt; const rate = result ? result.breathsPerMin : 16; bag.scale.setScalar(0.8 + Math.abs(Math.sin((tt * rate) / 60 * Math.PI)) * 0.35); kid.scale.y = 1 + Math.sin((tt * rate) / 60 * Math.PI * 2) * 0.02; if (!result) return; const f = Math.min(1, tt / 3); bubbles.userData.state.on = f < 1 && tt > 0.5; bubbles.userData.state.rate = 10; if (params.sample === 'out') { lime.material.opacity = 0.35 + f * 0.55; lime.material.color.lerp(new THREE.Color(0xffffff), dt); } bars[0].scale.y = Math.max(0.01, (result.o2 / 25) * 1.4 * f); bars[0].position.y = -0.75 + bars[0].scale.y / 2; bars[1].scale.y = Math.max(0.01, (result.co2 / 25) * 1.4 * f * 4); bars[1].position.y = -0.75 + bars[1].scale.y / 2; breaths.userData.set(`${result.breathsPerMin} ${t({ en: 'breaths/min', ja: 'かい/ぷん' })}`); if (f >= 1) verdict.userData.set(`O₂ ${result.o2}% · CO₂ ${result.co2}% · ${t(result.limewater === 'cloudy' ? { en: 'cloudy', ja: 'にごった' } : { en: 'clear', ja: 'そのまま' })}`); },
        replay() { tt = 0; lime.material.opacity = 0.35; lime.material.color.set(0xdff6ff); },
        lookAt: [0, -0.2, 0],
      };
    },

    photosynthesis({ scene, params, result, camera, labels }) {
      const dark = params.light === 'dark'; if (dark) THEMES.night(scene); else { THEMES.sky(scene); sunDisc(scene, 6, 6, -10, { r: 0.9 }); }
      ground(scene, { color: dark ? 0x3a3f4a : 0xc9b48a, r: 9, y: -1.5 }); slab(scene, { y: -1.4, w: 7, d: 3, h: 0.2, material: woodMat(0xa58c62) });
      const pot = add(scene, new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.35, 0), new THREE.Vector2(0.5, 0.6), new THREE.Vector2(0.56, 0.62), new THREE.Vector2(0.56, 0.72), new THREE.Vector2(0.5, 0.72)], 32), mat(0xb86e46, { rough: 0.8 })), -1.2, -1.3, 0); pot.castShadow = true;
      const stem = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.6, 10), mat(0x4f8f4a)), -1.2, 0.1, 0); void stem;
      const leafGeo = new THREE.SphereGeometry(0.5, 16, 10); leafGeo.scale(1, 0.12, 0.6);
      const leaf = add(scene, new THREE.Mesh(leafGeo, mat(0x5faa5a, { rough: 0.6, side: THREE.DoubleSide })), -0.75, 0.6, 0.1); leaf.rotation.z = 0.2;
      const foil = add(scene, new THREE.Mesh(roundedBox(0.5, 0.06, 0.6, 0.02), metalMat(0xdfe6ea)), -0.55, 0.66, 0.1); foil.visible = params.cover === 'foil'; foil.rotation.z = 0.2;
      const beam = dark ? null : (() => { const b = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 5), new THREE.MeshBasicMaterial({ color: 0xfff1c0, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })); b.position.set(0.4, 1.6, -0.6); b.rotation.set(-0.5, 0.5, 0.4); scene.add(b); return b; })(); void beam;
      if (!dark) motes(scene, { n: 40, box: [3, 3, 2], center: [-0.5, 1, -0.2], color: 0xfff1c0, size: 0.07, opacity: 0.5 });
      const dish = glass(new THREE.CylinderGeometry(0.9, 0.9, 0.2, 32, 1, true)); dish.position.set(1.6, -1.2, 0.4); scene.add(dish);
      const testLeaf = add(scene, new THREE.Mesh(leafGeo, mat(0xc9d98a, { rough: 0.7, side: THREE.DoubleSide })), 1.6, -1.15, 0.4); testLeaf.visible = false;
      const halfDark = add(scene, new THREE.Mesh(leafGeo, mat(0x1c2a4a, { rough: 0.7, side: THREE.DoubleSide })), 1.6, -1.145, 0.4); halfDark.visible = false; halfDark.scale.set(0.5, 1.05, 1); halfDark.position.x = 1.35;
      const dropper = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.8, 12), glassMat(0xffffff, 0.5)), 1.6, 0.4, 0.4); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), mat(0x8a5a3a)); bulb.position.y = 0.45; dropper.add(bulb); dropper.visible = false;
      say(scene, labels, { en: `${params.hours} h in the ${params.light} · leaf ${params.cover === 'foil' ? 'covered with foil' : 'uncovered'}`, ja: `${params.light === 'sun' ? 'ひなた' : 'くらい ところ'}に ${params.hours} じかん · は ${params.cover === 'foil' ? 'アルミはくで おおう' : 'そのまま'}` }, 0, 2.6, 0, 4.2, { accent: '#4fd08a' });
      const clock = say(scene, labels, '0 h', -2.6, 1.2, 0, 1.2, { size: 30 }); const verdict = say(scene, labels, '', 1.6, -0.3, 0.6, 2.6);
      camera.position.set(0.4, 1.0, 6.2); camera.lookAt(0.2, -0.2, 0);
      let tt = 0;
      return {
        update(dt) { tt += dt; if (!result) return; const f = Math.min(1, tt / 3); clock.userData.set(`${Math.round(params.hours * f)} h`); if (f >= 1) { const g = Math.min(1, (tt - 3) / 2); testLeaf.visible = true; dropper.visible = true; dropper.position.y = 0.4 - g * 0.9; if (g >= 1) { const made = result.starch === 'yes'; testLeaf.material.color.lerp(new THREE.Color(made ? 0x1c2a4a : 0x9a6a3a), Math.min(1, dt * 2)); verdict.userData.set(t(made ? { en: 'blue-black: starch!', ja: 'あおむらさき：でんぷん！' } : { en: `brown: no starch (${result.why})`, ja: `ちゃいろ：でんぷん なし（${result.why}）` })); } } },
        replay() { tt = 0; testLeaf.visible = false; testLeaf.material.color.set(0xc9d98a); dropper.visible = false; },
        lookAt: [0.2, -0.2, 0],
      };
    },

    butterfly({ scene, params, result, camera, labels }) {
      outdoors(scene, { sun: [-8, 7, -14] });
      const cage = glass(new THREE.BoxGeometry(4.2, 3.0, 2.4)); cage.position.set(0, 0, 0); scene.add(cage);
      for (const sx of [-2.1, 2.1]) for (const sz of [-1.2, 1.2]) add(scene, new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.0, 0.08), mat(0xffffff)), sx, 0, sz);
      const plant = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.2, 8), mat(0x4f8f4a)), -0.8, -0.4, 0); void plant;
      const leaves = [0, 1, 2, 3].map((i) => { const g = new THREE.SphereGeometry(0.5, 12, 8); g.scale(1, 0.12, 0.7); const l = add(scene, new THREE.Mesh(g, mat(0x5faa5a, { rough: 0.7, side: THREE.DoubleSide })), -0.8 + (i % 2 ? 0.4 : -0.4), -1.0 + i * 0.5, 0); l.rotation.z = i % 2 ? -0.3 : 0.3; return l; });
      const egg = add(scene, new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat(0xfff1c0)), -0.4, -0.95, 0.2);
      const cat = new THREE.Group(); for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat(i % 2 ? 0x8fcf5a : 0x5faa5a)); s.position.x = i * 0.15; cat.add(s); } cat.position.set(-0.9, -0.45, 0.2); cat.visible = false; scene.add(cat);
      const pupa = add(scene, new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.3, 4, 10), mat(0xc9d98a, { rough: 0.6 })), 0.4, 0.3, 0.1); pupa.visible = false;
      const bfly = new THREE.Group(); const wings = [-1, 1].map((k) => { const w = new THREE.Mesh(new THREE.CircleGeometry(0.35, 16), mat(0xffffff, { side: THREE.DoubleSide })); w.position.x = k * 0.3; w.scale.set(1, 0.7, 1); const dot = new THREE.Mesh(new THREE.CircleGeometry(0.06, 10), mat(0x1c1c1c, { side: THREE.DoubleSide })); dot.position.set(k * 0.12, 0.08, 0.01); w.add(dot); bfly.add(w); return w; }); const bodyM = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.3, 3, 8), mat(0x1c1c1c)); bfly.add(bodyM); bfly.position.set(0.6, 0.6, 0.3); bfly.visible = false; scene.add(bfly);
      const bar = graph({ w: 3.2, h: 0.9, xLabel: { en: 'days', ja: '日' }, yLabel: { en: 'egg · caterpillar · pupa · butterfly', ja: 'たまご · よう虫 · さなぎ · せい虫' }, tone: 0xf2b134 }); bar.position.set(0, 2.6, -1); scene.add(bar); labels.push(...bar.userData.labels);
      const total = result ? result.totalDays : 30; const segs = result ? [[0, result.eggDays, 0xfff1c0], [result.eggDays, result.eggDays + result.larvaDays, 0x5faa5a], [result.eggDays + result.larvaDays, result.eggDays + result.larvaDays + result.pupaDays, 0xc9d98a], [result.eggDays + result.larvaDays + result.pupaDays, total, 0xffffff]] : [];
      segs.forEach(([a, b, c]) => { const m = new THREE.Mesh(roundedBox(((b - a) / total) * 3.2, 0.5, 0.08, 0.02), plasticMat(c)); m.position.set(-1.6 + ((a + b) / 2 / total) * 3.2, 0, 0.05); bar.add(m); });
      const marker = add(bar, new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8, 0.1), new THREE.MeshBasicMaterial({ color: 0xd04030 })), -1.6, 0, 0.1);
      say(scene, labels, { en: `${params.tempC}°C · day ${params.day}`, ja: `${params.tempC}°C · ${params.day}日め` }, 0, 3.6, 0, 2.6, { accent: '#f2b134' });
      const stage = say(scene, labels, '', 2.6, 0.6, 0, 1.8);
      camera.position.set(0.3, 1.3, 7.0); camera.lookAt(0, 0.4, 0);
      let tt = 0; const dur = 5;
      return {
        update(dt) { tt += dt; if (bfly.visible) { bfly.position.x = 0.6 + Math.sin(tt) * 0.8; bfly.position.y = 0.6 + Math.sin(tt * 1.7) * 0.4; wings.forEach((w, i) => { w.rotation.y = (i ? -1 : 1) * Math.abs(Math.sin(tt * 12)) * 1.0; }); } if (!result) return; const f = Math.min(1, tt / dur); const day = params.day * f; const st = bio2.butterfly({ tempC: params.tempC, day }).stage; marker.position.x = -1.6 + Math.min(1, day / total) * 3.2; egg.visible = st === 'egg'; cat.visible = st === 'larva'; pupa.visible = st === 'pupa'; bfly.visible = st === 'adult'; if (st === 'larva') { cat.position.x = -0.9 + Math.sin(tt * 2) * 0.15; cat.scale.setScalar(0.5 + Math.min(1, (day - result.eggDays) / Math.max(1, result.larvaDays)) * 0.8); leaves.forEach((l, i) => { l.scale.x = Math.max(0.3, 1 - Math.max(0, (day - result.eggDays) / Math.max(1, result.larvaDays)) * (0.3 + i * 0.1)); }); } stage.userData.set(t(bio2.STAGES.find((s) => s.id === st))); },
        replay() { tt = 0; leaves.forEach((l) => { l.scale.x = 1; }); },
        lookAt: [0, 0.4, 0],
      };
    },

    genetics({ scene, params, result, camera, labels }) {
      outdoors(scene, { sun: [8, 7, -14] });
      const bed = add(scene, new THREE.Mesh(roundedBox(7, 0.3, 3, 0.05), mat(0x6d543a, { rough: 1, map: look.noiseTex(0x6d543a, 0.15) })), 0, -1.4, 0); bed.receiveShadow = true;
      const plants = [0, 1].map((i) => { const x = i ? 1.6 : -1.6; const stem = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.2, 8), mat(0x4f8f4a)), x, -0.2, 0); void stem; for (let k = 0; k < 4; k++) { const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat(0x5faa5a, { rough: 0.7 })); leaf.scale.set(1, 0.3, 0.6); leaf.position.set(x + (k % 2 ? 0.25 : -0.25), -0.9 + k * 0.5, 0); scene.add(leaf); } const flower = add(scene, new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mat(i ? 0xe98ab0 : 0xffffff, { rough: 0.5 })), x, 1.0, 0); void flower; const g = params.cross.split('-')[i]; const tag = labelSprite(g, { width: 0.9, background: null, size: 34 }); tag.position.set(x, 1.5, 0.2); scene.add(tag); return stem; }); void plants;
      const cross = labelSprite('×', { width: 0.6, background: null, size: 40 }); cross.position.set(0, 0.6, 0); scene.add(cross);
      const tray = add(scene, new THREE.Mesh(roundedBox(4.2, 0.12, 1.6, 0.03), woodMat(0xa58c62)), 0, -1.2, 1.8); tray.receiveShadow = true;
      const N = Math.min(100, Number(params.seeds)); const roundG = new THREE.SphereGeometry(0.1, 12, 10); const wrinkG = new THREE.DodecahedronGeometry(0.1, 0);
      const seedsM = []; const r = result ? result.round / Number(params.seeds) : 0.75; const seq = []; let acc = 0; for (let i = 0; i < N; i++) { acc += r; const isRound = acc >= 1; if (isRound) acc -= 1; seq.push(isRound); }
      for (let i = 0; i < N; i++) { const m = new THREE.Mesh(seq[i] ? roundG : wrinkG, plasticMat(seq[i] ? 0x7fd14a : 0x8fa65c)); m.position.set(-1.9 + (i % 20) * 0.2, 1.5, 1.4 + Math.floor(i / 20) * 0.2); m.visible = false; m.castShadow = true; scene.add(m); seedsM.push(m); }
      const bar = graph({ w: 2.4, h: 1.2, xLabel: { en: 'round · wrinkled', ja: 'まる · しわ' }, yLabel: { en: 'seeds', ja: 'たねの かず' }, tone: 0x7fd14a }); bar.position.set(3.2, 1.0, -0.5); bar.rotation.y = -0.4; scene.add(bar); labels.push(...bar.userData.labels);
      const bars = [[-0.5, 0x7fd14a], [0.5, 0x8fa65c]].map(([x, c]) => { const b = new THREE.Mesh(roundedBox(0.5, 1, 0.1, 0.02), plasticMat(c)); b.position.set(x, -0.6, 0.05); b.scale.y = 0.01; bar.add(b); return b; });
      say(scene, labels, { en: `${bio2.CROSSES[params.cross].en} · ${params.seeds} seeds`, ja: `${bio2.CROSSES[params.cross].ja} · たね ${params.seeds} こ` }, 0, 2.6, 0, 4.4, { accent: '#7fd14a' });
      const verdict = say(scene, labels, '', 0, 0.0, 2.2, 3.0);
      camera.position.set(0.3, 1.6, 7.0); camera.lookAt(0, -0.2, 0.6);
      let tt = 0; const dur = 4;
      return {
        update(dt) { tt += dt; if (!result) return; const f = Math.min(1, tt / dur); const shown = Math.floor(f * N); seedsM.forEach((m, i) => { m.visible = i < shown; if (m.visible) m.position.y = Math.max(-1.05, 1.5 - (tt - (i / N) * dur) * 3); }); const total = Number(params.seeds); bars[0].scale.y = Math.max(0.01, (result.round / total) * 1.1 * f); bars[0].position.y = -0.6 + bars[0].scale.y / 2; bars[1].scale.y = Math.max(0.01, (result.wrinkled / total) * 1.1 * f); bars[1].position.y = -0.6 + bars[1].scale.y / 2; if (f >= 1) verdict.userData.set(`${result.round} ${t({ en: 'round', ja: 'まる' })} · ${result.wrinkled} ${t({ en: 'wrinkled', ja: 'しわ' })} · ${result.ratio}`); },
        replay() { tt = 0; seedsM.forEach((m) => { m.visible = false; m.position.y = 1.5; }); },
        lookAt: [0, -0.2, 0.6],
      };
    },

    // ---- EARTH ----
    shadow({ scene, params, result, camera, labels }) {
      THEMES.sky(scene, { dusk: result ? result.altitude < 20 : false }); hills(scene, { color: 0x5f8a4e, r: 16, y: -1.6 });
      const land = ground(scene, { color: 0xd9c38a, r: 9, y: -1.5, tex: look.noiseTex(0xd9c38a, 0.08) }); void land;
      const stick = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.0, 10), woodMat(0x6f5b3e)), 0, -1.0, 0); stick.castShadow = true;
      const compassDirs = ['N', 'E', 'S', 'W']; compassDirs.forEach((d, i) => { const a = (i / 4) * Math.PI * 2; const l = labelSprite(d, { width: 0.6, background: null, size: 34 }); l.position.set(Math.sin(a) * 3.2, -1.3, -Math.cos(a) * 3.2); scene.add(l); add(scene, new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.1), new THREE.MeshBasicMaterial({ color: 0xfff4d7 })), Math.sin(a) * 2.6, -1.49, -Math.cos(a) * 2.6); });
      for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; add(scene, new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.05), new THREE.MeshBasicMaterial({ color: 0xfff4d7, transparent: true, opacity: 0.6 })), Math.sin(a) * 2.6, -1.49, -Math.cos(a) * 2.6); }
      const sun = sunDisc(scene, 0, 8, 0, { r: 0.8 }); const sunLight = new THREE.DirectionalLight(0xfff1d0, 2.6); sunLight.castShadow = true; sunLight.shadow.mapSize.set(1024, 1024); sunLight.shadow.camera.left = sunLight.shadow.camera.bottom = -6; sunLight.shadow.camera.right = sunLight.shadow.camera.top = 6; scene.add(sunLight); scene.add(sunLight.target);
      const shadowM = add(scene, new THREE.Mesh(new THREE.PlaneGeometry(0.12, 1), new THREE.MeshBasicMaterial({ color: 0x1c2a3a, transparent: true, opacity: 0.55 })), 0, -1.485, 0); shadowM.rotation.x = -Math.PI / 2;
      const thermoS = say(scene, labels, '', 2.6, 0.2, 2.0, 1.4, { size: 26 });
      say(scene, labels, { en: `${params.hour}:00 in month ${params.month}`, ja: `${params.month}がつ · ${params.hour}じ` }, 0, 2.8, 0, 2.8, { accent: '#ffd36b' });
      const verdict = say(scene, labels, '', 0, 1.6, 0, 3.0);
      camera.position.set(2.5, 3.0, 6.5); camera.lookAt(0, -0.8, 0);
      let tt = 0;
      const place = (h) => { const r = geo2.shadow({ hour: h, month: params.month }); const az = ({ N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 }[r.sunDir] || 180) * Math.PI / 180; const alt = Math.max(2, r.altitude) * Math.PI / 180; const d = 7; sun.position.set(Math.sin(az) * Math.cos(alt) * d, Math.sin(alt) * d - 1.5, -Math.cos(az) * Math.cos(alt) * d); sunLight.position.copy(sun.position); sunLight.target.position.set(0, -1.5, 0); const len = Math.min(5, r.length ?? 5); shadowM.scale.set(1, len, 1); shadowM.position.set(-Math.sin(az) * len / 2, -1.485, Math.cos(az) * len / 2); shadowM.rotation.z = -az; return r; };
      place(params.hour);
      return {
        update(dt) { tt += dt; if (!result) return; const f = Math.min(1, tt / 4); const h = 7 + (params.hour - 7) * f; const r = place(h); thermoS.userData.set(`${(18 + Math.max(0, r.altitude) * 0.25).toFixed(0)}°C`); if (f >= 1) verdict.userData.set(`${t({ en: 'shadow', ja: 'かげ' })}: ${result.shadowDir} · ${result.length ?? '–'} m · ${t({ en: 'sun', ja: 'たいよう' })} ${result.altitude}°`); },
        replay() { tt = 0; },
        lookAt: [0, -0.8, 0],
      };
    },

    soil({ scene, params, result, camera, labels }) {
      outdoors(scene, { sun: [-9, 6, -14] });
      const stand = add(scene, new THREE.Mesh(roundedBox(5, 0.2, 2, 0.05), woodMat(0x6f5b3e)), 0, -0.2, 0); stand.castShadow = true; for (const sx of [-2.2, 2.2]) add(scene, new THREE.Mesh(roundedBox(0.2, 1.3, 1.8, 0.03), woodMat(0x6f5b3e)), sx, -0.85, 0);
      const colours = { gravel: 0x9a9585, sand: 0xd9c38a, soil: 0x8a6a45, clay: 0xb8a090 };
      const tubes = Object.keys(geo2.GRAINS).map((g, i) => { const x = -1.8 + i * 1.2; const tg = glass(new THREE.CylinderGeometry(0.4, 0.4, 1.6, 24, 1, true)); tg.position.set(x, 0.7, 0); scene.add(tg); const fill = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.8, 24), mat(colours[g], { rough: 1, map: look.noiseTex(colours[g], 0.15) })), x, 0.3, 0); void fill; const water = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 1, 24), new THREE.MeshPhysicalMaterial({ color: 0x7fd1ff, transparent: true, opacity: 0.5, roughness: 0.05 })); water.position.set(x, 1.0, 0); water.scale.y = 0.01; scene.add(water); const cup = glass(new THREE.CylinderGeometry(0.45, 0.4, 0.8, 24, 1, true)); cup.position.set(x, -0.7, 0); scene.add(cup); const out = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 1, 24), new THREE.MeshPhysicalMaterial({ color: 0x7fd1ff, transparent: true, opacity: 0.5, roughness: 0.05 })); out.position.set(x, -1.05, 0); out.scale.y = 0.01; scene.add(out); const drip = emitter(scene, { n: 10, color: 0x7fd1ff, size: 0.07, rate: 0, life: 0.4, origin: [x, -0.15, 0], spread: 0.05, vel: [0, -1.6, 0], gravity: 3 }); const lab2 = labelSprite({ en: geo2.GRAINS[g].en, ja: geo2.GRAINS[g].ja }, { width: 1.3, background: null, size: 22 }); lab2.position.set(x, 1.8, 0.3); scene.add(lab2); labels.push(lab2); return { g, water, out, drip, chosen: g === params.grain, tg }; });
      say(scene, labels, { en: `a cup of water into ${geo2.GRAINS[params.grain].en.toLowerCase()}`, ja: `${geo2.GRAINS[params.grain].ja}に コップ 1ぱいの みず` }, 0, 2.6, 0, 3.4, { accent: '#7fd1ff' });
      const clock = say(scene, labels, '0 s', -3.0, 1.2, 0, 1.2, { size: 30 }); const verdict = say(scene, labels, '', 0, -1.9, 1.2, 2.6);
      camera.position.set(0.3, 1.2, 6.8); camera.lookAt(0, 0.1, 0);
      let tt = 0; const dur = 5;
      return {
        update(dt) { tt += dt; if (!result) return; const f = Math.min(1, tt / dur); for (const tb of tubes) { const secs = geo2.GRAINS[tb.g].seconds; const prog = Math.min(1, (f * result.seconds * 1.0) / secs); tb.water.scale.y = Math.max(0.01, (1 - prog) * 0.5); tb.water.position.y = 0.7 + tb.water.scale.y / 2; tb.out.scale.y = Math.max(0.01, prog * 0.6); tb.out.position.y = -1.05 + tb.out.scale.y / 2; tb.drip.userData.state.on = prog < 1 && f < 1; tb.drip.userData.state.rate = 8 * Math.min(1, 60 / secs); } clock.userData.set(`${Math.round(result.seconds * f)} s`); if (f >= 1) verdict.userData.set(`${result.seconds} s · ${t(result.puddle === 'yes' ? { en: 'a puddle stays on top', ja: 'みずたまりが できた' } : { en: 'drained through', ja: 'しみこんだ' })}`); },
        replay() { tt = 0; },
        lookAt: [0, 0.1, 0],
      };
    },

    river({ scene, params, result, camera, labels }) {
      outdoors(scene, { sun: [8, 7, -14] });
      const tray = add(scene, new THREE.Mesh(roundedBox(8, 0.4, 4, 0.08), woodMat(0x6f5b3e)), 0, -1.2, 0); tray.rotation.z = (params.slope * Math.PI) / 180 * 0.6; tray.castShadow = true;
      const sand = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 3.6, 60, 30), mat(0xd9c38a, { rough: 1, map: look.noiseTex(0xd9c38a, 0.1) })); sand.rotation.x = -Math.PI / 2; sand.position.set(0, -0.95, 0); sand.rotation.z = 0; const sandPos = sand.geometry.attributes.position; const base = sandPos.array.slice(); scene.add(sand);
      const q = { low: 0.6, medium: 1, high: 1.6 }[params.flow]; const widthR = 0.25 + q * 0.2;
      const riverPts = Array.from({ length: 40 }, (_, i) => { const u = i / 39; return new THREE.Vector3(-3.6 + u * 7.2, -0.9, Math.sin(u * Math.PI * 2) * 1.0); });
      const riverGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(riverPts), 80, widthR, 8, false); const river = new THREE.Mesh(riverGeo, new THREE.MeshPhysicalMaterial({ color: 0x3f8fc0, transparent: true, opacity: 0.8, roughness: 0.1, clearcoat: 1 })); river.scale.y = 0.3; scene.add(river);
      const flow = emitter(scene, { n: 60, color: 0xffffff, size: 0.06, rate: 20 * q, life: 3, origin: [-3.6, -0.75, 0], spread: 0.3, vel: [2.4 * Math.sqrt(params.slope / 3) * q, 0, 0] });
      const carve = (f) => { for (let i = 0; i < sandPos.count; i++) { const x = base[i * 3]; const y = base[i * 3 + 1]; const u = (x + 3.6) / 7.2; const cz = Math.sin(u * Math.PI * 2) * 1.0; const outer = Math.cos(u * Math.PI * 2) * -1 * Math.sign(Math.cos(u * Math.PI * 2) || 1); void outer; const dz = -y - cz; const side = Math.sign(dz) === Math.sign(Math.sin(u * Math.PI * 2 + Math.PI / 2) * -1) ? 1 : -1; const d = Math.abs(dz); const cut = Math.exp(-(d * d) / (0.35 + q * 0.2)) * (side > 0 ? 0.35 : 0.1) * f * Math.sqrt(params.slope / 3); const fill = Math.exp(-(d * d) / 0.25) * (side < 0 ? 0.12 : 0) * f; sandPos.setZ(i, -cut + fill); } sandPos.needsUpdate = true; sand.geometry.computeVertexNormals(); };
      const arrows = []; for (let i = 0; i < 3; i++) { const u = 0.25 + i * 0.25; const a = add(scene, new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 8), new THREE.MeshBasicMaterial({ color: 0xd04030 })), -3.6 + u * 7.2, -0.2, Math.sin(u * Math.PI * 2) * 1.0 + (Math.cos(u * Math.PI * 2) > 0 ? 1 : -1) * 0.9); a.rotation.z = Math.PI; a.visible = false; arrows.push(a); }
      say(scene, labels, { en: `slope ${params.slope}° · ${params.flow} water`, ja: `かたむき ${params.slope}° · みず ${params.flow}` }, 0, 2.4, 0, 3, { accent: '#3f8fc0' });
      const verdict = say(scene, labels, '', 0, 1.5, 0, 3.0);
      camera.position.set(0.3, 3.6, 6.8); camera.lookAt(0, -0.8, 0);
      let tt = 0;
      return {
        update(dt) { tt += dt; river.position.x = 0; if (!result) return; const f = Math.min(1, tt / 5); carve(f); flow.userData.state.on = true; arrows.forEach((a) => { a.visible = f > 0.3; a.position.y = -0.2 + Math.sin(tt * 3) * 0.05; }); if (f >= 1) verdict.userData.set(`${result.speed} m/s · ${t({ en: 'outer bank cut, inner bank built', ja: 'そとがわが けずれ、うちがわに つもる' })} · ${t({ en: 'carries', ja: 'はこぶ' })} ${result.carries}`); },
        replay() { tt = 0; carve(0); },
        lookAt: [0, -0.8, 0],
      };
    },

    strata({ scene, params, result, camera, labels }) {
      lab(scene);
      const jar = glass(new THREE.CylinderGeometry(0.9, 0.9, 3.2, 40, 1, true)); jar.position.set(0, 0.1, 0); scene.add(jar); const base = glass(new THREE.CircleGeometry(0.9, 40)); base.rotation.x = -Math.PI / 2; base.position.set(0, -1.49, 0); scene.add(base);
      const water = new THREE.Mesh(new THREE.CylinderGeometry(0.87, 0.87, 2.8, 40), new THREE.MeshPhysicalMaterial({ color: 0x9fd3dc, transparent: true, opacity: 0.35, roughness: 0.05 })); water.position.set(0, -0.05, 0); scene.add(water);
      const COL = { gravel: 0x9a9585, sand: 0xd9c38a, mud: 0x6d543a }; const order = result ? result.order.split('-') : ['gravel', 'sand', 'mud']; const pours = params.pours;
      const layers = []; for (let p = 0; p < pours; p++) for (const g of order) { const h = { gravel: 0.22, sand: 0.18, mud: 0.14 }[g]; const m = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, h, 40), mat(COL[g], { rough: 1, map: look.noiseTex(COL[g], 0.12) })); m.scale.y = 0.01; scene.add(m); layers.push({ m, h, g, p }); }
      const cloud = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.6, 40), new THREE.MeshBasicMaterial({ color: 0x8a7a5c, transparent: true, opacity: 0 })); cloud.position.set(0, 0, 0); scene.add(cloud);
      const grains = emitter(scene, { n: 80, color: 0xd9c38a, size: 0.05, rate: 0, life: 2.5, origin: [0, 1.4, 0], spread: 0.8, vel: [0, -0.7, 0], gravity: 0.3, additive: false });
      const scoop = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.5, 24, 1, true), glassMat(0xffffff, 0.4)), 1.6, 2.0, 0); const mix = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.29, 0.3, 24), mat(0x8a7a5c, { rough: 1 })); mix.position.y = -0.05; scoop.add(mix);
      const tags = order.map((g) => { const l = labelSprite({ en: g, ja: { gravel: 'れき', sand: 'すな', mud: 'どろ' }[g] }, { width: 1.0, background: null, size: 24 }); l.visible = false; scene.add(l); labels.push(l); return { l, g }; });
      say(scene, labels, { en: `${params.mix === 'all' ? 'gravel, sand and mud' : params.mix} · ${pours} pour${pours > 1 ? 's' : ''}`, ja: `${{ all: 'れき・すな・どろ', 'sand-mud': 'すなと どろ', 'gravel-sand': 'れきと すな' }[params.mix]} · ${pours} かい そそぐ` }, 0, 2.6, 0, 3.4, { accent: '#d9c38a' });
      const verdict = say(scene, labels, '', 0, -2.1, 1.0, 2.6);
      camera.position.set(0.3, 0.9, 6.2); camera.lookAt(0, -0.1, 0);
      let tt = 0; const perPour = 3.5;
      return {
        update(dt) {
          tt += dt; if (!result) return; const pour = Math.min(pours - 1, Math.floor(tt / perPour)); const ph = (tt - pour * perPour) / perPour;
          scoop.position.set(1.6 - Math.min(1, ph * 4) * 1.6, 2.0, 0); scoop.rotation.z = Math.min(1, ph * 4) * 1.2; grains.userData.state.on = ph > 0.15 && ph < 0.5; grains.userData.state.rate = 30; cloud.material.opacity = ph > 0.15 && ph < 0.9 ? 0.35 * (1 - (ph - 0.15) / 0.75) : 0;
          let y = -1.49; layers.forEach((L) => { const idx = order.indexOf(L.g); const start = 0.3 + idx * 0.2; const prog = L.p < pour ? 1 : L.p > pour ? 0 : Math.min(1, Math.max(0, (ph - start) / 0.35)); L.m.scale.y = Math.max(0.01, prog); L.m.position.y = y + (L.h * prog) / 2; y += L.h * prog; });
          tags.forEach((tg, i) => { const L = layers[i]; tg.l.visible = L.m.scale.y > 0.5; tg.l.position.set(1.5, L.m.position.y, 0); });
          if (tt > pours * perPour) verdict.userData.set(`${result.layers} ${t({ en: 'layers', ja: 'そう' })} · ${t({ en: 'bottom', ja: 'した' })}: ${result.bottom} · ${t({ en: 'top', ja: '上' })}: ${result.top}`);
        },
        replay() { tt = 0; },
        lookAt: [0, -0.1, 0],
      };
    },

    volcano({ scene, params, result, camera, labels }) {
      THEMES.sky(scene, { dusk: true }); hills(scene, { color: 0x4a4a44, r: 17, y: -1.8 }); ground(scene, { color: 0x6a5a4a, r: 9, y: -1.5, tex: look.noiseTex(0x6a5a4a, 0.1) });
      const v = { runny: 0, medium: 1, sticky: 2 }[params.viscosity];
      const profile = []; const H = [1.2, 2.4, 3.2][v]; const R = [4.2, 2.6, 1.6][v]; for (let i = 0; i <= 10; i++) { const u = i / 10; const r = R * (1 - u) * (v === 2 ? Math.pow(1 - u * 0.5, 0.3) : v === 0 ? Math.pow(1 - u, 0.5) + u * 0.3 : 1); profile.push(new THREE.Vector2(Math.max(0.3, r), -1.5 + u * H)); }
      const cone = add(scene, new THREE.Mesh(new THREE.LatheGeometry(profile, 36), mat([0x3a3a3a, 0x6a5a4a, 0x9a9585][v], { rough: 1, flat: true, map: look.noiseTex([0x3a3a3a, 0x6a5a4a, 0x9a9585][v], 0.12) })), 0, 0, 0); cone.castShadow = true; cone.receiveShadow = true;
      const crater = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.1, 24), mat(0xff5a1f, { emissive: 0xff3a00, emissiveIntensity: 1.5 })), 0, -1.5 + H, 0); const craterGlow = glow(0xff7528, 2.2, 0.7); craterGlow.position.set(0, -1.4 + H, 0); scene.add(craterGlow);
      const lavaCol = [0xff7528, 0xff5a1f, 0xd04030][v]; const lava = emitter(scene, { n: 60, color: lavaCol, size: [0.12, 0.1, 0.14][v], rate: 0, life: [3, 2, 1.2][v], origin: [0, -1.5 + H, 0], spread: [0.6, 0.5, 1.2][v], vel: [0, [0.8, 1.6, 3.5][v], 0], gravity: [0.5, 1.2, 2.5][v] });
      const ash = emitter(scene, { n: 50, color: 0x6a6a6a, size: 0.35, rate: 0, life: 3, origin: [0, -1.2 + H, 0], spread: 0.6, vel: [0, [0.4, 0.8, 1.6][v], 0], additive: false });
      const flows = []; for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const f = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 1), mat(lavaCol, { emissive: lavaCol, emissiveIntensity: 0.8 })); f.position.set(Math.sin(a) * 0.4, -1.5 + H - 0.1, Math.cos(a) * 0.4); f.rotation.y = a; f.scale.z = 0.01; scene.add(f); flows.push({ f, a }); }
      const rock = add(scene, new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 1), mat([0x1c1c1c, 0x6a6a6a, 0xdcd8d0][v], { rough: 1, flat: true })), 3.2, -1.05, 1.6); rock.castShadow = true; const rockL = labelSprite({ en: `${['black', 'grey', 'white'][v]} rock`, ja: `${['くろい', 'はいいろの', 'しろい'][v]} いわ` }, { width: 1.4, background: null, size: 22 }); rockL.position.set(3.2, -0.3, 1.6); scene.add(rockL); labels.push(rockL);
      say(scene, labels, { en: `${params.viscosity} magma`, ja: `${{ runny: 'さらさら', medium: 'ふつう', sticky: 'ねばねば' }[params.viscosity]}の マグマ` }, 0, 3.2, 0, 2.6, { accent: '#ff7528' });
      const verdict = say(scene, labels, '', 0, 2.4, 0, 3.0);
      camera.position.set(0.3, 1.8, 8.2); camera.lookAt(0, 0.0, 0);
      let tt = 0;
      return {
        update(dt) { tt += dt; craterGlow.material.opacity = 0.5 + Math.sin(tt * 5) * 0.2; crater.material.emissiveIntensity = 1.2 + Math.sin(tt * 7) * 0.5; if (!result) return; lava.userData.state.on = true; lava.userData.state.rate = [14, 18, 30][v]; ash.userData.state.on = v > 0; ash.userData.state.rate = [0, 6, 16][v]; const f = Math.min(1, tt / 5); flows.forEach(({ f: m, a }) => { const len = [3.6, 2.0, 0.8][v] * f; m.scale.z = Math.max(0.01, len); const dy = -H * Math.min(1, len / R) * 0.9; m.position.set(Math.sin(a) * (0.4 + len / 2 * 0.9), -1.5 + H - 0.05 + dy / 2, Math.cos(a) * (0.4 + len / 2 * 0.9)); m.rotation.x = Math.atan2(-dy, len) * 1.0; }); if (v === 2 && tt % 2.5 < 0.1) craterGlow.scale.setScalar(4); craterGlow.scale.lerp(new THREE.Vector3(2.2, 2.2, 1), dt * 2); if (f >= 1) verdict.userData.set(`${result.shape} · ${result.eruption} · ${t({ en: 'like', ja: 'にている' })} ${result.example}`); },
        replay() { tt = 0; },
        lookAt: [0, 0, 0],
      };
    },

    // ---- COSMOS ----
    stars({ scene, params, result, camera, labels }) {
      THEMES.night(scene); hills(scene, { color: 0x1a2a2a, r: 16, y: -1.6 }); ground(scene, { color: 0x1f2a30, r: 9, y: -1.5 });
      const dirIdx = { east: 0, south: 1, west: 2, north: 3 }[params.direction];
      const sky = new THREE.Group(); scene.add(sky);
      const pts = []; const cols = []; for (let i = 0; i < 350; i++) { const th = Math.random() * Math.PI * 2; const ph = Math.acos(2 * Math.random() - 1); pts.push(30 * Math.sin(ph) * Math.cos(th), 30 * Math.cos(ph), 30 * Math.sin(ph) * Math.sin(th)); const c = new THREE.Color().setHSL(0.1 + Math.random() * 0.5, 0.4, 0.8); cols.push(c.r, c.g, c.b); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); const field = new THREE.Points(g, new THREE.PointsMaterial({ map: look.softTex(), vertexColors: true, size: 4, sizeAttenuation: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); sky.add(field);
      const axis = new THREE.Vector3(0, Math.sin(35.7 * Math.PI / 180), -Math.cos(35.7 * Math.PI / 180)).normalize(); // toward the north celestial pole, north = -z
      const polaris = glow(0xffffff, 1.6, 1); polaris.position.copy(axis.clone().multiplyScalar(29)); scene.add(polaris); const pL = labelSprite({ en: 'Pole Star', ja: 'ほっきょくせい' }, { width: 1.8, background: null, size: 26 }); pL.position.copy(axis.clone().multiplyScalar(26)).add(new THREE.Vector3(0, 1.2, 0)); scene.add(pL); labels.push(pL);
      const marked = glow(0xffd36b, 2.4, 1); const startDir = [new THREE.Vector3(1, 0.4, -0.2), new THREE.Vector3(0.2, 0.5, 1), new THREE.Vector3(-1, 0.4, 0.2), new THREE.Vector3(0.6, 0.7, -0.8)][dirIdx].normalize(); marked.position.copy(startDir.clone().multiplyScalar(28)); sky.add(marked);
      const trail = []; for (let i = 0; i < 24; i++) { const s = glow(0xffd36b, 0.8, 0.35 * (1 - i / 24)); s.visible = false; scene.add(s); trail.push(s); }
      const compass = { east: [1, 0, 0], south: [0, 0, 1], west: [-1, 0, 0], north: [0, 0, -1] }; for (const [d, p] of Object.entries(compass)) { const l = labelSprite({ en: d.toUpperCase(), ja: { east: 'ひがし', south: 'みなみ', west: 'にし', north: 'きた' }[d] }, { width: 1.4, background: null, size: 28 }); l.position.set(p[0] * 7, -1.0, p[2] * 7); scene.add(l); labels.push(l); }
      const kid = person(scene, 0, 0, 0x3a6fd0); kid.rotation.y = [Math.PI / 2, 0, -Math.PI / 2, Math.PI][dirIdx] * -1 + Math.PI;
      say(scene, labels, { en: `facing ${params.direction} · ${params.hours} h`, ja: `${{ east: 'ひがし', south: 'みなみ', west: 'にし', north: 'きた' }[params.direction]}を むいて · ${params.hours} じかん` }, 0, 3.4, 0, 3.2, { accent: '#ffd36b' });
      const clock = say(scene, labels, '0:00', -3.2, 2.2, 0, 1.3, { size: 32 }); const verdict = say(scene, labels, '', 0, 2.6, 0, 3.2);
      const lookDir = [[6, 1.5, -1], [1, 1.8, 6], [-6, 1.5, 1], [0.5, 2.2, -6]][dirIdx]; camera.position.set(-lookDir[0] * 0.8, 0.9, -lookDir[2] * 0.8); camera.lookAt(...lookDir);
      let tt = 0; const dur = 6; let frames = 0;
      return {
        update(dt) { tt += dt; frames++; if (!result) return; const f = Math.min(1, tt / dur); const angle = (result.degrees * f * Math.PI) / 180; sky.setRotationFromAxisAngle(axis, -angle); clock.userData.set(`${Math.floor(params.hours * f)}:${String(Math.floor(((params.hours * f) % 1) * 60)).padStart(2, '0')}`); if (frames % 6 === 0) { for (let i = trail.length - 1; i > 0; i--) { trail[i].position.copy(trail[i - 1].position); trail[i].visible = trail[i - 1].visible; } const wp = new THREE.Vector3(); marked.getWorldPosition(wp); trail[0].position.copy(wp); trail[0].visible = true; } if (f >= 1) verdict.userData.set(`${result.degrees}° · ${t({ 'up-right': { en: 'up and to the right', ja: 'みぎ上へ' }, right: { en: 'to the right', ja: 'みぎへ' }, 'down-right': { en: 'down and to the right', ja: 'みぎ下へ' }, anticlockwise: { en: 'round the Pole Star', ja: 'ほっきょくせいの まわりを' } }[result.motion])}`); },
        replay() { tt = 0; trail.forEach((s) => { s.visible = false; }); },
        lookAt: lookDir,
      };
    },

    seasons({ scene, params, result, camera, labels }) {
      THEMES.space(scene, { lights: false }); scene.add(new THREE.AmbientLight(0x334466, 0.5));
      const sun = sunDisc(scene, -6, 0, 0, { r: 1.0 }); void sun; const sunLight = new THREE.DirectionalLight(0xfff1d0, 3); sunLight.position.set(-6, 0, 0); sunLight.target.position.set(0, 0, 0); scene.add(sunLight); scene.add(sunLight.target);
      const earthG = new THREE.Group(); scene.add(earthG); earthG.rotation.z = (-23.44 * Math.PI) / 180;
      const earth = new THREE.Mesh(new THREE.SphereGeometry(1.1, 48, 36), mat(0xffffff, { rough: 0.7, map: look.planetTex(0x2f6fd0, 0x4f9a52, { seed: 3 }) })); earthG.add(earth);
      const axisM = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3.2, 8), new THREE.MeshBasicMaterial({ color: 0xffd36b })); earthG.add(axisM);
      const tokyo = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0xd04030 })); earth.add(tokyo); const lat = (35.7 * Math.PI) / 180; tokyo.position.set(Math.cos(lat) * 1.1 * -1, Math.sin(lat) * 1.1, 0);
      const orbit = new THREE.Mesh(new THREE.RingGeometry(5.95, 6.05, 128), new THREE.MeshBasicMaterial({ color: 0x9fc8ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide })); orbit.rotation.x = -Math.PI / 2; orbit.position.set(-6, 0, 0); scene.add(orbit);
      const ghost = [3, 6, 9, 12].map((m) => { const a = ((m - 3) / 12) * Math.PI * 2; const g2 = new THREE.Group(); g2.position.set(-6 + Math.cos(a) * 6, 0, Math.sin(a) * 6); const e = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), mat(0x3f7fd0, { rough: 0.8 })); g2.add(e); const ax = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.0, 6), new THREE.MeshBasicMaterial({ color: 0xffd36b })); g2.add(ax); g2.rotation.z = (-23.44 * Math.PI) / 180; scene.add(g2); const l = labelSprite({ en: ['Mar', 'Jun', 'Sep', 'Dec'][[3, 6, 9, 12].indexOf(m)], ja: `${m}がつ` }, { width: 1.0, background: null, size: 24 }); l.position.set(g2.position.x, 0.8, g2.position.z); scene.add(l); labels.push(l); return g2; }); void ghost;
      const g = graph({ w: 2.8, h: 1.6, xLabel: { en: 'month', ja: 'つき' }, yLabel: { en: 'noon sun height °', ja: 'なんちゅう こうど °' }, tone: 0xffd36b }); g.position.set(3.4, 1.8, 0); scene.add(g); labels.push(...g.userData.labels);
      const pts = []; for (let m = 1; m <= 12; m += 0.25) pts.push([m, sky2.seasons({ month: m }).noonAlt]); g.userData.plot(pts, { color: 0xffd36b, xr: [1, 12], yr: [20, 90] }); if (result) g.userData.mark(params.month, result.noonAlt, { xr: [1, 12], yr: [20, 90] });
      say(scene, labels, { en: `month ${params.month} at 35.7°N`, ja: `${params.month}がつ · きたい 35.7°` }, 0, 3.0, 0, 2.6, { accent: '#ffd36b' });
      const verdict = say(scene, labels, '', 0, -2.4, 0, 3.4);
      camera.position.set(0.5, 3.5, 8.5); camera.lookAt(-1, 0, 0);
      let tt = 0;
      return {
        update(dt) { tt += dt; earth.rotation.y += dt * 0.6; const a = ((params.month - 3) / 12) * Math.PI * 2; const f = Math.min(1, tt / 2); const cur = a * f; earthG.position.set(-6 + Math.cos(cur) * 6, 0, Math.sin(cur) * 6); if (result && f >= 1) verdict.userData.set(`${result.season} · ${t({ en: 'noon sun', ja: 'なんちゅう こうど' })} ${result.noonAlt}° · ${result.dayHours} h ${t({ en: 'of daylight', ja: 'の ひる' })}`); },
        replay() { tt = 0; },
        lookAt: [-1, 0, 0],
      };
    },

    planets({ scene, params, result, camera, labels }) {
      THEMES.space(scene, { lights: false }); scene.add(new THREE.AmbientLight(0x334466, 0.4));
      const sun = sunDisc(scene, 0, 0, 0, { r: 0.6 }); void sun; scene.add(new THREE.PointLight(0xfff1d0, 40, 40, 2));
      const scale = (au) => 0.9 + Math.log(1 + au * 2) * 1.5; const PL = sky2.PLANETS; const COLS = { mercury: 0x9a9585, venus: 0xe6cfa0, earth: 0x3f7fd0, mars: 0xb55a32, jupiter: 0xd9b07a, saturn: 0xe8d8a8 };
      const bodies = Object.entries(PL).map(([id, p]) => { const r = scale(p.au); const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.01, r + 0.01, 128), new THREE.MeshBasicMaterial({ color: id === params.planet ? 0xffd36b : 0x9fc8ff, transparent: true, opacity: id === params.planet ? 0.8 : 0.25, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; scene.add(ring); const size = { mercury: 0.07, venus: 0.12, earth: 0.13, mars: 0.09, jupiter: 0.36, saturn: 0.3 }[id]; const m = new THREE.Mesh(new THREE.SphereGeometry(size, 20, 14), mat(COLS[id], { rough: 0.8 })); scene.add(m); if (id === 'saturn') { const rg = new THREE.Mesh(new THREE.RingGeometry(size * 1.4, size * 2.2, 32), new THREE.MeshBasicMaterial({ color: 0xe8d8a8, transparent: true, opacity: 0.6, side: THREE.DoubleSide })); rg.rotation.x = -Math.PI / 2 + 0.3; m.add(rg); } const l = labelSprite({ en: p.en, ja: p.ja }, { width: 1.3, background: null, size: 22 }); scene.add(l); labels.push(l); return { id, m, l, r, years: Math.pow(p.au, 1.5), a: Math.random() * Math.PI * 2 }; });
      const chosen = bodies.find((b) => b.id === params.planet); const hl = glow(0xffd36b, 1.2, 0.6); scene.add(hl);
      say(scene, labels, { en: `${PL[params.planet].en} · ${PL[params.planet].au} AU from the Sun`, ja: `${PL[params.planet].ja} · たいようから ${PL[params.planet].au} AU` }, 0, 4.4, 0, 3.4, { accent: '#ffd36b' });
      const clock = say(scene, labels, { en: 'year 0', ja: '0ねん' }, -5.0, 3.2, 0, 1.4); const verdict = say(scene, labels, '', 0, -4.4, 0, 3.4);
      camera.position.set(0.3, 8.5, 9.5); camera.lookAt(0, 0, 0);
      let tt = 0;
      return {
        update(dt) { tt += dt; const years = tt * 0.25; for (const b of bodies) { const ang = b.a + (years / b.years) * Math.PI * 2; b.m.position.set(Math.cos(ang) * b.r, 0, Math.sin(ang) * b.r); b.l.position.set(b.m.position.x, 0.45, b.m.position.z); } hl.position.copy(chosen.m.position); clock.userData.set(t({ en: `year ${years.toFixed(1)}`, ja: `${years.toFixed(1)} ねん` })); if (result) verdict.userData.set(`${t({ en: 'one year on', ja: '1ねんの ながさ' })} ${PL[params.planet].en}: ${result.years} ${t({ en: 'Earth years', ja: 'ねん（ちきゅう）' })} · ${result.speedKms} km/s`); },
        replay() { tt = 0; },
        lookAt: [0, 0, 0],
      };
    },

    // ---- DATA ----
    polygon({ scene, params, result, camera, labels }) {
      THEMES.space(scene); const board = ground(scene, { color: 0x1c2a3a, r: 9, y: -1.5, grid: true, gridColor: 0x7fd1ff }); void board;
      const path = result ? result.path : [[0, 0]]; const scaleU = 1.1;
      const pts = path.map(([x, y]) => new THREE.Vector3(x * scaleU - 1, -1.45, -y * scaleU + 1));
      const geo = new THREE.BufferGeometry().setFromPoints(pts); const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xf2b134 })); line.geometry.setDrawRange(0, 0); scene.add(line);
      const trailGlow = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xf2b134, transparent: true, opacity: 0.4 })); trailGlow.position.y = 0.01; scene.add(trailGlow);
      const turtle = new THREE.Group(); const shell = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), plasticMat(0x4f9a52)); shell.scale.y = 0.5; turtle.add(shell); const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), plasticMat(0x7fd14a)); head.position.set(0.32, -0.02, 0); turtle.add(head); for (const [dx, dz] of [[0.18, 0.2], [0.18, -0.2], [-0.18, 0.2], [-0.18, -0.2]]) { const leg = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), plasticMat(0x7fd14a)); leg.position.set(dx, -0.08, dz); turtle.add(leg); } turtle.traverse((o) => { if (o.isMesh) o.castShadow = true; }); turtle.position.copy(pts[0]).add(new THREE.Vector3(0, 0.2, 0)); scene.add(turtle);
      const home = glow(0x7fd1ff, 0.9, 0.5); home.position.copy(pts[0]).add(new THREE.Vector3(0, 0.05, 0)); scene.add(home);
      const prog = say(scene, labels, { en: `repeat ${params.sides}: forward 1, turn ${params.angle}°`, ja: `${params.sides} かい くりかえす：すすむ 1、まがる ${params.angle}°` }, 0, 2.6, 0, 4.2, { accent: '#f2b134', background: '#0b1630ee' }); void prog;
      const step = say(scene, labels, '', -3.4, 1.4, 0, 1.6); const verdict = say(scene, labels, '', 0, -2.2, 2.4, 2.6);
      camera.position.set(0.3, 5.0, 6.0); camera.lookAt(0, -1.2, 0);
      let tt = 0; const perStep = 0.7;
      return {
        update(dt) { tt += dt; if (!result) return; const n = pts.length - 1; const s = Math.min(n, tt / perStep); const i = Math.floor(s); const f = s - i; if (i < n) { turtle.position.lerpVectors(pts[i], pts[i + 1], f).add(new THREE.Vector3(0, 0.2, 0)); turtle.rotation.y = -Math.atan2(pts[i + 1].z - pts[i].z, pts[i + 1].x - pts[i].x); line.geometry.setDrawRange(0, i + 2); step.userData.set(t({ en: `step ${i + 1} of ${n}`, ja: `${i + 1} / ${n} ほめ` })); } else { line.geometry.setDrawRange(0, n + 1); turtle.position.copy(pts[n]).add(new THREE.Vector3(0, 0.2, 0)); verdict.userData.set(t(result.closes === 'yes' ? { en: `home! turned ${result.turns} time${result.turns === 1 ? '' : 's'} round`, ja: `もどった！ ${result.turns} かい まわった` } : { en: 'not home: the turns do not add up to 360°', ja: 'もどらない：まがった ぶんが 360° に ならない' })); } },
        replay() { tt = 0; },
        lookAt: [0, -1.2, 0],
      };
    },
  };
}
