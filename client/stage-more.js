// The 3D stages for the five newer islands. Same contract as stage.js's builders:
// { update(dt), replay() }, drawing only what the room has already decided.
// Every scene is dressed by stage-look.js: a sky or lab dome, a studio floor with a
// light pool, shadows, glows and particles.

import * as THREE from './vendor/three.module.js';
import { t } from './i18n.js';
import * as force from '/shared/sim/force.js';
import * as life from '/shared/sim/life.js';
import * as maker from '/shared/sim/maker.js';

export function moreBuilders({ labelSprite, graph, look }) {
  const { mat, metalMat, plasticMat, glass, glassMat, glow, anim, THEMES, ground, slab, woodMat, stoneMat, feltTex, diceMats, sunDisc, motes, emitter, roundedBox, gearGeometry, heartGeometry, tube, tree, hills } = look;
  const add = (scene, mesh, x = 0, y = 0, z = 0) => { mesh.position.set(x, y, z); scene.add(mesh); return mesh; };
  const box = (scene, x, y, z, w, h, d, color, extra) => add(scene, new THREE.Mesh(roundedBox(w, h, d, Math.min(0.05, w / 4, h / 4, d / 4)), typeof color === 'number' ? mat(color, extra) : color), x, y, z);
  const ball = (scene, x, y, z, r, color, extra) => add(scene, new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), typeof color === 'number' ? mat(color, extra) : color), x, y, z);
  const say = (scene, labels, pair, x, y, z, w = 3, opts = {}) => { const s = labelSprite(pair, { width: w, ...opts }); s.position.set(x, y, z); scene.add(s); labels.push(s); return s; };
  const ghostTrail = (scene, n, color, r = 0.05) => { const g = []; for (let i = 0; i < n; i++) { const s = glow(color, r * 6, 0.5 * (1 - i / n)); s.visible = false; scene.add(s); g.push(s); } return { push(p) { for (let i = n - 1; i > 0; i--) { g[i].position.copy(g[i - 1].position); g[i].visible = g[i - 1].visible; } g[0].position.copy(p); g[0].visible = true; }, reset() { for (const s of g) s.visible = false; } }; };

  return {
    pendulum({ scene, params, result, camera, labels }) {
      THEMES.lab(scene); ground(scene, { color: 0x2f3b48, r: 10, y: -1.5, grid: true });
      const L = params.length; const top = 2.4; const scale = 1.6;
      for (const sx of [-2, 2]) { box(scene, sx, 0.45, 0, 0.22, 4.1, 0.22, woodMat(0x6f5b3e)); box(scene, sx, -1.42, 0, 0.9, 0.14, 0.9, woodMat(0x6f5b3e)); }
      box(scene, 0, top, 0, 4.4, 0.22, 0.22, woodMat(0x6f5b3e));
      const pivot = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 12), metalMat(0xd4c49b)), 0, top, 0); pivot.rotation.x = Math.PI / 2;
      // a protractor behind the pivot: the pull-back angle, drawn in degrees
      const arc = add(scene, new THREE.Mesh(new THREE.RingGeometry(0.75, 0.8, 48, 1, -Math.PI / 2 - 0.6, 1.2), new THREE.MeshBasicMaterial({ color: 0x7fd1ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide })), 0, top, -0.15);
      const th0 = (params.angle * Math.PI) / 180;
      const tick = add(scene, new THREE.Mesh(new THREE.RingGeometry(0.7, 0.86, 48, 1, -Math.PI / 2 - th0, th0 * 2), new THREE.MeshBasicMaterial({ color: 0xf2b134, transparent: true, opacity: 0.6, side: THREE.DoubleSide })), 0, top, -0.14);
      void arc; void tick;
      const rope = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6), mat(0xd4c49b, { rough: 0.9 })), 0, 0, 0);
      const br = params.mass === 'heavy' ? 0.26 : 0.16;
      const bob = ball(scene, 0, top - L * scale, 0, br, metalMat(params.mass === 'heavy' ? 0x6d7a84 : 0xc9a24a));
      const shine = glow(0xffffff, br * 2.2, 0.35); bob.add(shine); shine.position.set(-br * 0.3, br * 0.4, br * 0.5);
      const trail = ghostTrail(scene, 8, 0xf2b134, br * 0.22);
      say(scene, labels, { en: `${L} m string · ${params.angle}° · ${params.mass} bob`, ja: `ひも ${L} m · ${params.angle}° · おもり ${params.mass === 'heavy' ? 'おもい' : 'かるい'}` }, 0, 3.25, 0, 4, { accent: '#f2b134' });
      const timer = say(scene, labels, '0 swings', -2.9, 1.2, 0, 1.8);
      const stopwatch = say(scene, labels, '0.0 s', 2.9, 1.2, 0, 1.4, { size: 36 });
      camera.position.set(0.5, 0.9, 7); camera.lookAt(0, 0.6, 0);
      const T = result?.period ?? 2 * Math.PI * Math.sqrt(L / force.G);
      let tt = 0; let frames = 0;
      return {
        update(dt) {
          tt += dt; frames += 1;
          const th = th0 * Math.cos((2 * Math.PI * tt) / T); const x = Math.sin(th) * L * scale; const y = top - Math.cos(th) * L * scale;
          bob.position.set(x, y, 0); rope.position.set(x / 2, (top + y) / 2, 0); rope.scale.y = L * scale; rope.rotation.z = th;
          if (frames % 2 === 0) trail.push(bob.position);
          const swings = Math.floor(Math.min(tt, 30) / T);
          timer.userData.set(`${swings} ${t({ en: swings === 1 ? 'swing' : 'swings', ja: 'かい' })}`); stopwatch.userData.set(`${Math.min(tt, 30).toFixed(1)} s`);
        },
        replay() { tt = 0; trail.reset(); },
      };
    },

    ramp({ scene, params, result, camera, labels }) {
      THEMES.lab(scene); ground(scene, { color: 0x2f3b48, r: 10, y: -1.5, grid: true });
      const a = (params.angle * Math.PI) / 180; const len = 4;
      const surf = { ice: new THREE.MeshPhysicalMaterial({ color: 0xdff6ff, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85 }), wood: woodMat(0xa58c62), rubber: mat(0x2c3540, { rough: 1, map: look.noiseTex(0x2c3540, 0.2) }) }[params.surface];
      const plank = add(scene, new THREE.Mesh(roundedBox(len, 0.2, 1.4, 0.04), surf), 0, -0.6 + Math.sin(a) * len / 2, 0); plank.rotation.z = a;
      // a wedge under the high end, and a stop block at the low end
      const hi = add(scene, new THREE.Mesh(new THREE.BoxGeometry(0.4, Math.max(0.05, Math.sin(a) * len), 1.4), woodMat(0x6f5b3e)), -Math.cos(a) * len / 2 + 0.2, -1.4 + Math.sin(a) * len / 2, 0); hi.castShadow = true;
      box(scene, Math.cos(a) * len / 2 + 0.3, -1.25, 0, 0.3, 0.3, 1.4, woodMat(0x6f5b3e));
      const block = add(scene, new THREE.Mesh(roundedBox(0.6, 0.6, 0.6, 0.06), plasticMat(0xd04030)), 0, 0, 0);
      const eye = (x) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), mat(0x222222)); e.position.set(x, 0.1, 0.31); block.add(e); }; eye(-0.12); eye(0.12);
      const dust = emitter(scene, { n: 30, color: 0xd4c49b, size: 0.12, rate: 0, life: 0.8, spread: 0.3, vel: [0, 0.6, 0], additive: false });
      say(scene, labels, { en: `${params.angle}° · ${force.SURFACES[params.surface].en}`, ja: `${params.angle}° · ${force.SURFACES[params.surface].ja}` }, 0, 2.6, 0, 3, { accent: '#7fd1ff' });
      const speed = say(scene, labels, '', 2.6, 1.6, 0, 2.2);
      const gArrow = add(scene, new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 10), new THREE.MeshBasicMaterial({ color: 0xf2b134 })), 0, 0, 0); gArrow.rotation.x = Math.PI; gArrow.visible = false;
      camera.position.set(0.6, 1.3, 7); camera.lookAt(0, 0, 0);
      let tt = 0; const place = (s) => { const d = len / 2 - s; block.position.set(-Math.cos(a) * d, -0.6 + Math.sin(a) * len / 2 + Math.sin(a) * d + 0.45, 0); block.rotation.z = a; };
      place(0);
      return {
        update(dt) {
          if (!result || result.moves === 'stays') { place(0); if (result) speed.userData.set(t({ en: 'stays put', ja: 'とまったまま' })); return; }
          tt += dt; const s = Math.min(len - 0.6, 0.5 * result.accel * tt * tt); place(s);
          const v = Math.min(result.speed, result.accel * tt); speed.userData.set(`${v.toFixed(1)} m/s`);
          dust.userData.state.origin = [block.position.x - 0.2, block.position.y - 0.3, block.position.z]; dust.userData.state.on = s < len - 0.6; dust.userData.state.rate = 18;
          gArrow.visible = s < len - 0.6; gArrow.position.set(block.position.x + 0.5, block.position.y + 0.2, 0.4);
        },
        replay() { tt = 0; place(0); },
      };
    },

    lever({ scene, params, result, camera, labels }) {
      THEMES.lab(scene); ground(scene, { color: 0x2f3b48, r: 10, y: -1.5, grid: true });
      const fulcrum = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.7, 1.1, 3), woodMat(0x7b6647)), 0, -0.95, 0); fulcrum.rotation.y = Math.PI / 2; fulcrum.castShadow = true;
      const plank = add(scene, new THREE.Mesh(roundedBox(5.2, 0.16, 0.9, 0.04), woodMat(0xa58c62)), 0, -0.3, 0);
      for (let i = -2; i <= 2; i++) { if (i === 0) continue; const m = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.9), mat(0x3a2a1a)); m.position.set(i * 1.2, 0.09, 0); plank.add(m); }
      const kettle = (massKg, color) => { const g = new THREE.Group(); const r = 0.2 + massKg * 0.03; const b = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), metalMat(color)); b.position.y = r; g.add(b); const h = new THREE.Mesh(new THREE.TorusGeometry(r * 0.55, r * 0.12, 8, 24, Math.PI), metalMat(0x333333)); h.position.y = r * 1.9; g.add(h); const tag = labelSprite(`${massKg} kg`, { width: 1.1, background: null }); tag.position.y = r * 2.6; g.add(tag); return g; };
      const lw = kettle(params.leftMass, 0x3a6fd0); const rw = kettle(params.rightMass, 0xd04030); plank.add(lw); plank.add(rw);
      lw.position.set(-params.leftDist * 1.2, 0.08, 0); rw.position.set(params.rightDist * 1.2, 0.08, 0);
      say(scene, labels, `${params.leftMass} kg × ${params.leftDist} m`, -2, 2.0, 0, 2, { accent: '#3a6fd0' }); say(scene, labels, `${params.rightMass} kg × ${params.rightDist} m`, 2, 2.0, 0, 2, { accent: '#d04030' });
      const verdict = say(scene, labels, '', 0, -1.25, 1.3, 2.6);
      camera.position.set(0, 1.5, 6.5); camera.lookAt(0, 0, 0);
      const target = result ? (result.tilt === 'left' ? 0.22 : result.tilt === 'right' ? -0.22 : 0) : 0;
      let vel = 0; let tt = 0;
      return {
        update(dt) {
          tt += dt; if (!result) { plank.rotation.z = Math.sin(tt * 0.8) * 0.02; return; }
          // a spring with a little overshoot, so the seesaw lands with weight
          const acc = (target - plank.rotation.z) * 18 - vel * 3.2; vel += acc * dt; plank.rotation.z += vel * dt;
          verdict.userData.set(t({ left: { en: 'Tips left', ja: 'ひだりに かたむく' }, right: { en: 'Tips right', ja: 'みぎに かたむく' }, balanced: { en: 'Balanced!', ja: 'つりあった！' } }[result.tilt]));
        },
        replay() { plank.rotation.z = 0; vel = 0; tt = 0; },
      };
    },

    meadow({ scene, params, result, camera, labels }) {
      THEMES.sky(scene); sunDisc(scene, 9, 7, -14, { r: 1 }); hills(scene, { color: 0x5f8a4e, r: 16, y: -1.5 });
      ground(scene, { color: 0x6aa35a, r: 9, y: -1.5, tex: look.noiseTex(0x6aa35a, 0.1) });
      for (const [x, z] of [[-6, -4], [6.5, -3], [-5, 4.5], [5.5, 5], [0, -6.5], [-7, 1]]) tree(scene, x, z, { h: 1.8 + Math.random() * 0.6 });
      // grass: a few hundred blades that lean in the wind
      const blades = new THREE.InstancedMesh(new THREE.ConeGeometry(0.04, 0.35, 4), mat(0x4f9a52, { rough: 1, flat: true }), 400); const d = new THREE.Object3D();
      const bl = []; for (let i = 0; i < 400; i++) { const r = Math.sqrt(Math.random()) * 8.5; const a = Math.random() * Math.PI * 2; bl.push([Math.cos(a) * r, Math.sin(a) * r, Math.random() * 6]); }
      scene.add(blades); blades.receiveShadow = true;
      anim(scene, (dt, tt) => { bl.forEach((b, i) => { d.position.set(b[0], -1.33, b[1]); d.rotation.set(0, b[2], Math.sin(tt * 1.3 + b[2]) * 0.2); d.updateMatrix(); blades.setMatrixAt(i, d.matrix); }); blades.instanceMatrix.needsUpdate = true; });
      const rab = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.11, 0.16, 4, 10), mat(0xf4f1ea, { rough: 0.9 }), 220); const ears = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.025, 0.14, 2, 6), mat(0xf0d4d4, { rough: 0.9 }), 440);
      const fox = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.15, 0.3, 4, 10), mat(0xd4713d, { rough: 0.8 }), 90); const tails = new THREE.InstancedMesh(new THREE.ConeGeometry(0.09, 0.3, 8), mat(0xf4f1ea, { rough: 0.9 }), 90);
      rab.castShadow = fox.castShadow = true; scene.add(rab); scene.add(ears); scene.add(fox); scene.add(tails);
      const seats = []; for (let i = 0; i < 220; i++) { const r = Math.sqrt(Math.random()) * 8; const a = Math.random() * Math.PI * 2; seats.push([Math.cos(a) * r, Math.sin(a) * r, Math.random() * 6]); }
      let R = Math.min(220, params.rabbits); let F = Math.min(90, params.foxes);
      const show = (tt) => {
        for (let i = 0; i < 220; i++) { const s = seats[i]; const on = i < R; const hop = on ? Math.abs(Math.sin(tt * 3 + s[2])) * 0.12 : 0; d.position.set(s[0], on ? -1.25 + hop : -99, s[1]); d.rotation.set(Math.PI / 2, 0, s[2]); d.scale.setScalar(1); d.updateMatrix(); rab.setMatrixAt(i, d.matrix); for (let k = 0; k < 2; k++) { d.position.set(s[0] + Math.cos(s[2]) * (k ? 0.05 : -0.05), on ? -1.0 + hop : -99, s[1] + Math.sin(s[2]) * (k ? 0.05 : -0.05)); d.rotation.set(0, 0, 0); d.updateMatrix(); ears.setMatrixAt(i * 2 + k, d.matrix); } }
        for (let i = 0; i < 90; i++) { const s = seats[(i * 7) % 220]; const on = i < F; const x = -s[0] + Math.sin(tt * 0.5 + s[2]) * 0.4; const z = -s[1]; d.position.set(x, on ? -1.2 : -99, z); d.rotation.set(Math.PI / 2, 0, s[2] + 1); d.updateMatrix(); fox.setMatrixAt(i, d.matrix); d.position.set(x - Math.cos(s[2] + 1) * 0.3, on ? -1.15 : -99, z - Math.sin(s[2] + 1) * 0.3); d.rotation.set(0, 0, Math.PI / 2 + s[2] + 1); d.updateMatrix(); tails.setMatrixAt(i, d.matrix); }
        rab.instanceMatrix.needsUpdate = ears.instanceMatrix.needsUpdate = fox.instanceMatrix.needsUpdate = tails.instanceMatrix.needsUpdate = true;
      };
      const g = graph({ w: 4, h: 1.6, xLabel: { en: 'days', ja: '日' }, yLabel: { en: 'rabbits (white) · foxes (orange)', ja: 'ウサギ（しろ）・キツネ（オレンジ）' }, tone: 0xffffff }); g.position.set(0, 2.2, -3); scene.add(g); labels.push(...g.userData.labels);
      const day = say(scene, labels, { en: 'day 0', ja: '0日め' }, -4.6, 1.6, 0, 1.6, { accent: '#f2b134' });
      const counts = say(scene, labels, '', 4.6, 1.6, 0, 2.2);
      camera.position.set(0, 4.8, 9); camera.lookAt(0, 0.2, 0);
      let lines = null; let tt = 0; const dur = 10;
      if (result?.trace) { const tr = result.trace; const maxY = Math.max(...tr.flat()) * 1.1; lines = [g.userData.plot(tr.map((p, i) => [i, p[0]]), { color: 0xffffff, xr: [0, tr.length], yr: [0, maxY] }), g.userData.plot(tr.map((p, i) => [i, p[1]]), { color: 0xf2a034, xr: [0, tr.length], yr: [0, maxY] })]; for (const l of lines) l.geometry.setDrawRange(0, 0); }
      return {
        update(dt) {
          tt = Math.min(dur, tt + dt); show(tt);
          if (!lines) return;
          const i = Math.floor((tt / dur) * (result.trace.length - 1)); for (const l of lines) l.geometry.setDrawRange(0, i + 1);
          [R, F] = result.trace[i]; R = Math.min(220, Math.round(R)); F = Math.min(90, Math.round(F));
          day.userData.set(t({ en: `day ${i}`, ja: `${i}日め` })); counts.userData.set(`🐇 ${Math.round(result.trace[i][0])} · 🦊 ${Math.round(result.trace[i][1])}`);
        },
        replay() { tt = 0; },
      };
    },

    plant({ scene, params, result, camera, labels }) {
      const dark = params.light === 'dark';
      if (dark) THEMES.night(scene); else THEMES.sky(scene);
      ground(scene, { color: dark ? 0x3a3f4a : 0xc9b48a, r: 9, y: -1.5, tex: look.noiseTex(0xc9b48a, 0.08) });
      slab(scene, { y: -1.4, w: 7, d: 3, h: 0.2, material: woodMat(0xa58c62) });
      const pot = add(scene, new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.35, 0), new THREE.Vector2(0.5, 0.6), new THREE.Vector2(0.56, 0.62), new THREE.Vector2(0.56, 0.72), new THREE.Vector2(0.5, 0.72)], 32), mat(0xb86e46, { rough: 0.8, map: look.noiseTex(0xb86e46, 0.12) })), 0, -1.3, 0); pot.castShadow = true;
      add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.08, 32), mat(0x4a3826, { rough: 1, map: look.noiseTex(0x4a3826, 0.25) })), 0, -0.62, 0);
      if (params.light === 'sun') sunDisc(scene, 3.5, 3.2, -2, { r: 0.7 });
      if (params.light === 'window') { const w = add(scene, new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.6), glassMat(0xdff6ff, 0.35)), 3, 1.2, -1.5); void w; box(scene, 3, 1.2, -1.5, 2.4, 0.12, 0.14, 0xffffff); box(scene, 3, 1.2, -1.5, 0.12, 2.8, 0.14, 0xffffff); box(scene, 3, -0.2, -1.5, 2.4, 0.12, 0.14, 0xffffff); box(scene, 3, 2.6, -1.5, 2.4, 0.12, 0.14, 0xffffff); const beam = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 5), new THREE.MeshBasicMaterial({ color: 0xfff1c0, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })); beam.position.set(2.2, 0.6, -0.4); beam.rotation.y = 0.5; beam.rotation.x = -0.5; scene.add(beam); motes(scene, { n: 50, box: [3, 3, 2], center: [2, 0.6, -0.6], color: 0xfff1c0, size: 0.07, opacity: 0.5 }); }
      if (dark) { const lamp = glow(0x7a86b8, 2, 0.2); lamp.position.set(-2, 2.5, 0); scene.add(lamp); }
      for (let i = 0; i < params.water; i++) { const cup = glass(new THREE.CylinderGeometry(0.17, 0.14, 0.5, 20, 1, true)); cup.position.set(-2.4 + i * 0.5, -1.05, 0.8); scene.add(cup); add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.36, 20), new THREE.MeshPhysicalMaterial({ color: 0x7fd1ff, transparent: true, opacity: 0.55, roughness: 0.05, clearcoat: 1 })), -2.4 + i * 0.5, -1.1, 0.8); }
      say(scene, labels, { en: `${params.water} cups/day · ${life.LIGHT[params.light].en} · ${params.tempC}°C`, ja: `みず ${params.water} · ${life.LIGHT[params.light].ja} · ${params.tempC}°C` }, 0, 3.3, 0, 4, { accent: '#4fd08a' });
      const stem = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1, 10), mat(0x4f8f4a, { rough: 0.8 })), 0, -0.6, 0); stem.scale.y = 0.01; stem.castShadow = true;
      const leafGeo = new THREE.SphereGeometry(0.22, 12, 8); leafGeo.scale(1, 0.25, 0.6);
      const leaves = []; const leafMat = mat(0x4f8f4a, { rough: 0.7, side: THREE.DoubleSide });
      const h = say(scene, labels, '', -2.6, 1.6, 0, 1.6, { accent: '#4fd08a' });
      const sparkle = emitter(scene, { n: 20, color: 0xbfffcf, size: 0.08, rate: 0, life: 0.9, origin: [0, 0, 0], spread: 0.4, vel: [0, 0.5, 0] });
      camera.position.set(0.4, 1.3, 6); camera.lookAt(0, 0.4, 0);
      let tt = 0; const H = result ? result.height * 0.12 : 0; const col = result?.color === 'pale' ? 0xc9d98a : result?.alive === 'wilts' ? 0x8a7a3a : 0x4f8f4a; const dur = 4;
      return {
        update(dt) {
          if (!result) return; tt = Math.min(dur, tt + dt); const f = tt / dur; const hh = Math.max(0.01, H * f);
          stem.scale.y = hh; stem.position.y = -0.6 + hh / 2; stem.material.color.set(col); leafMat.color.set(col);
          const want = Math.round(result.leaves * f);
          while (leaves.length < want) { const i = leaves.length; const lf = new THREE.Mesh(leafGeo, leafMat); lf.castShadow = true; lf.position.set(0, -0.6 + ((i + 1) / (result.leaves + 1)) * H, 0); lf.rotation.y = i * 2.4; lf.rotation.z = 0.25; lf.translateX(0.2); scene.add(lf); leaves.push(lf); sparkle.userData.state.origin = [lf.position.x, lf.position.y, lf.position.z]; sparkle.userData.state.acc = 6; }
          if (result.alive === 'wilts') { stem.rotation.z = Math.min(0.5, f * 0.6); leaves.forEach((lf) => { lf.rotation.z = -0.9 * f; }); }
          else leaves.forEach((lf, i) => { lf.rotation.z = 0.25 + Math.sin(tt * 2 + i) * 0.05; });
          h.userData.set(`${(result.height * f).toFixed(1)} cm`);
        },
        replay() { tt = 0; for (const lf of leaves) scene.remove(lf); leaves.length = 0; stem.rotation.z = 0; },
      };
    },

    heart({ scene, params, result, camera, labels }) {
      THEMES.lab(scene); ground(scene, { color: 0x2f3b48, r: 10, y: -1.5, grid: true });
      const track = add(scene, new THREE.Mesh(new THREE.RingGeometry(2.2, 3.4, 64), mat(0xc0604a, { rough: 0.9 })), 0, -1.48, 0); track.rotation.x = -Math.PI / 2; track.receiveShadow = true;
      for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.RingGeometry(2.5 + i * 0.3, 2.52 + i * 0.3, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide })); l.rotation.x = -Math.PI / 2; l.position.y = -1.47; scene.add(l); }
      const heart = add(scene, new THREE.Mesh(heartGeometry(1.1, 0.5), mat(0xd9433a, { rough: 0.25, metal: 0.05, emissive: 0x6a0a0a, emissiveIntensity: 0.4 })), 0, 0.9, 0); heart.castShadow = true;
      const pulse = glow(0xff6a5a, 2.4, 0.3); pulse.position.set(0, 0.9, -0.3); scene.add(pulse);
      const runner = new THREE.Group(); const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.45, 4, 12), plasticMat(0x3a6fd0)); body.position.y = 0.55; runner.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), mat(0xe8c39a, { rough: 0.7 })); head.position.y = 1.1; runner.add(head);
      const legs = [0, 1].map((k) => { const lg = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.4, 3, 8), mat(0x1c2a3a)); lg.position.set(k ? 0.12 : -0.12, 0.2, 0); runner.add(lg); return lg; });
      const arms = [0, 1].map((k) => { const ar = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.35, 3, 8), mat(0xe8c39a)); ar.position.set(k ? 0.3 : -0.3, 0.65, 0); runner.add(ar); return ar; });
      runner.traverse((o) => { if (o.isMesh) o.castShadow = true; }); runner.position.set(2.8, -1.45, 0); scene.add(runner);
      const g = graph({ w: 3.2, h: 1.1, xLabel: { en: 'time', ja: 'じかん' }, yLabel: { en: 'heartbeat', ja: 'しんぞうの はくどう' }, tone: 0xff6a5a }); g.position.set(-3.1, 1.6, -0.5); g.rotation.y = 0.35; scene.add(g); labels.push(...g.userData.labels);
      const N = 120; const ecg = new Array(N).fill(0); const line = g.userData.plot(ecg.map((v, i) => [i, v]), { color: 0xff6a5a, xr: [0, N - 1], yr: [-0.4, 1.2] });
      say(scene, labels, { en: `${life.ACTIVITY[params.activity].en} · ${params.minutes} min · age ${params.age}`, ja: `${life.ACTIVITY[params.activity].ja} · ${params.minutes} ぷん · ${params.age} さい` }, 0, 3, 0, 4, { accent: '#ff6a5a' });
      const bpm = say(scene, labels, '— bpm', 0, 2.2, 0, 1.8, { size: 38 });
      camera.position.set(0.3, 1.6, 7); camera.lookAt(0, 0.4, 0);
      const rate = result ? result.bpm : 70 - (params.age - 6); const k = life.ACTIVITY[params.activity].k; let tt = 0; let lap = 0;
      return {
        update(dt) {
          tt += dt; const phase = ((tt * rate) / 60) % 1; const beat = 1 + 0.14 * Math.max(0, Math.sin(phase * Math.PI * 2)) ** 8; heart.scale.setScalar(beat); pulse.material.opacity = 0.15 + 0.4 * (beat - 1) / 0.14;
          const spike = phase < 0.06 ? 1.1 : phase < 0.12 ? -0.3 : phase > 0.3 && phase < 0.4 ? 0.25 : 0; ecg.push(spike + (Math.random() - 0.5) * 0.04); ecg.shift();
          const pos = line.geometry.attributes.position; for (let i = 0; i < N; i++) pos.setY(i, -0.55 + ((ecg[i] + 0.4) / 1.6) * 1.1); pos.needsUpdate = true;
          if (result) bpm.userData.set(`${result.bpm} bpm`);
          lap += dt * (0.3 + k * 1.2); runner.position.set(Math.cos(lap) * 2.8, -1.45 + Math.abs(Math.sin(lap * 8)) * 0.06 * k, -Math.sin(lap) * 2.8); runner.rotation.y = lap + Math.PI / 2;
          legs.forEach((lg, i) => { lg.rotation.x = Math.sin(lap * 8 + i * Math.PI) * 0.6 * Math.min(1, k * 2); }); arms.forEach((ar, i) => { ar.rotation.x = -Math.sin(lap * 8 + i * Math.PI) * 0.5 * Math.min(1, k * 2); });
        },
        replay() { tt = 0; },
      };
    },

    quake({ scene, params, result, camera, labels }) {
      THEMES.sky(scene, { dusk: true }); hills(scene, { color: 0x6a6a5a, r: 18, y: -1.6 });
      const land = add(scene, new THREE.Mesh(new THREE.CircleGeometry(9, 96), mat(0x8fa65c, { rough: 1, map: look.noiseTex(0x8fa65c, 0.1) })), 0, -1.5, 0); land.rotation.x = -Math.PI / 2; land.receiveShadow = true;
      const base = land.geometry.attributes.position.array.slice();
      const house = new THREE.Group(); house.add(new THREE.Mesh(roundedBox(1.4, 1.2, 1.2, 0.04), mat(0xe8dcc0, { rough: 0.9 }))); const roof = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.8, 4), mat(0xb86e46, { rough: 0.9 })); roof.position.y = 1.0; roof.rotation.y = Math.PI / 4; house.add(roof);
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ color: 0xfff1c0 })); win.position.set(0.3, 0.1, 0.61); house.add(win); const door = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.5), mat(0x6f5b3e)); door.position.set(-0.3, -0.35, 0.61); house.add(door);
      house.traverse((o) => { if (o.isMesh) o.castShadow = true; }); house.position.set(4.5, -0.9, 0); scene.add(house);
      for (const [x, z] of [[2, -3], [6.5, -2.5], [6, 2.5], [3, 3.2]]) tree(scene, x, z, { h: 1.3 + Math.random() * 0.5, y: -1.5 });
      const epi = add(scene, new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), mat(0xd04030, { emissive: 0xd04030, emissiveIntensity: 0.8 })), -5.5, -1.4, 0); const epiGlow = glow(0xff6a52, 1.4, 0.8); epiGlow.position.copy(epi.position); scene.add(epiGlow);
      const scale = 10 / params.distance; // km -> scene units
      const ringP = add(scene, new THREE.Mesh(new THREE.RingGeometry(0.1, 0.16, 64), new THREE.MeshBasicMaterial({ color: 0x7fd1ff, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })), -5.5, -1.46, 0); ringP.rotation.x = -Math.PI / 2;
      const ringS = add(scene, new THREE.Mesh(new THREE.RingGeometry(0.1, 0.25, 64), new THREE.MeshBasicMaterial({ color: 0xf06a52, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })), -5.5, -1.45, 0); ringS.rotation.x = -Math.PI / 2;
      // the seismograph: a drum whose paper is a canvas the pen draws on
      const paper = document.createElement('canvas'); paper.width = 512; paper.height = 128; const pc = paper.getContext('2d'); pc.fillStyle = '#fff8e6'; pc.fillRect(0, 0, 512, 128); const rule = () => { pc.strokeStyle = 'rgba(28,42,58,0.12)'; pc.lineWidth = 1; for (let y = 16; y < 128; y += 16) { pc.beginPath(); pc.moveTo(0, y); pc.lineTo(512, y); pc.stroke(); } }; rule(); const ptex = new THREE.CanvasTexture(paper); ptex.colorSpace = THREE.SRGBColorSpace;
      const drum = add(scene, new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.85), new THREE.MeshBasicMaterial({ map: ptex })), 3.6, 1.7, -0.5); drum.rotation.x = -0.15;
      const frameL = add(scene, new THREE.Mesh(roundedBox(3.6, 1.05, 0.08, 0.04), mat(0x1c2a3a)), 3.6, 1.7, -0.56); frameL.rotation.x = -0.15;
      let penX = 0; let penY = 64; const draw = (v) => { const y = 64 + v * 52; pc.fillStyle = '#fff8e6'; pc.fillRect(penX + 1, 0, 6, 128); pc.strokeStyle = '#1c2a3a'; pc.lineWidth = 2.5; pc.lineCap = 'round'; pc.beginPath(); pc.moveTo(penX, penY); pc.lineTo(penX + 3, y); pc.stroke(); penX += 3; penY = y; if (penX >= 510) { penX = 0; pc.fillStyle = '#fff8e6'; pc.fillRect(0, 0, 512, 128); rule(); } ptex.needsUpdate = true; };
      say(scene, labels, { en: `epicenter ${params.distance} km away · M${params.magnitude}`, ja: `しんげんまで ${params.distance} km · M${params.magnitude}` }, 0, 2.9, 0, 4, { accent: '#f06a52' });
      const clockL = say(scene, labels, '0.0 s', -5.5, 0.4, 0, 1.6, { size: 36 }); const status = say(scene, labels, '', 4.5, 0.9, 0, 2.6);
      camera.position.set(0, 4.2, 8.5); camera.lookAt(0, -0.5, 0);
      let tt = 0; const speedUp = result ? Math.max(1, result.sSeconds / 8) : 1; const pos = land.geometry.attributes.position;
      return {
        update(dt) {
          epiGlow.material.opacity = 0.5 + Math.sin(tt * 6) * 0.3;
          if (!result) return; tt += dt * speedUp; const rp = tt * 6 * scale; const rs = tt * 3.5 * scale;
          ringP.scale.setScalar(Math.max(0.01, rp)); ringS.scale.setScalar(Math.max(0.01, rs)); ringP.material.opacity = Math.max(0, 1 - rp / 14); ringS.material.opacity = Math.max(0.2, 1 - rs / 14);
          // the ground itself: a small ripple at the P front, a big one at the S front
          for (let i = 0; i < pos.count; i++) { const x = base[i * 3]; const y = base[i * 3 + 1]; const dist = Math.hypot(x + 5.5, y); const p = Math.exp(-((dist - rp) ** 2) * 6) * 0.04; const s = Math.exp(-((dist - rs) ** 2) * 2.5) * 0.16 * Math.sin(dist * 6 - tt * 20) ; pos.setZ(i, p + s); }
          pos.needsUpdate = true; land.geometry.computeVertexNormals();
          clockL.userData.set(`${Math.min(tt, result.sSeconds + 3).toFixed(1)} s`);
          const atHouse = 10; const pHit = tt >= result.pSeconds; const sHit = tt >= result.sSeconds; void atHouse;
          const shake = sHit ? Math.max(0, 1 - (tt - result.sSeconds) / 6) * 0.08 * params.magnitude / 5 : pHit ? 0.01 : 0;
          house.position.set(4.5 + (Math.random() - 0.5) * shake, -0.9 + (Math.random() - 0.5) * shake * 0.5, (Math.random() - 0.5) * shake); house.rotation.z = (Math.random() - 0.5) * shake * 0.5;
          draw(sHit ? (Math.random() - 0.5) * 1.6 * Math.max(0.05, 1 - (tt - result.sSeconds) / 8) : pHit ? (Math.random() - 0.5) * 0.25 : 0);
          status.userData.set(t(sHit ? { en: 'S wave: shaking!', ja: 'S なみ：ゆれる！' } : pHit ? { en: 'P wave: a gentle tap', ja: 'P なみ：コトッ' } : { en: 'quiet…', ja: 'しずか…' }));
        },
        replay() { tt = 0; penX = 0; penY = 64; pc.fillStyle = '#fff8e6'; pc.fillRect(0, 0, 512, 128); rule(); ptex.needsUpdate = true; },
      };
    },

    tsunami({ scene, params, result, camera, labels }) {
      THEMES.sky(scene); sunDisc(scene, -8, 6, -14, { r: 0.9 });
      const depthU = Math.min(2.5, 0.5 + params.depth / 2000);
      box(scene, 2.5, -1.2 - depthU, 0, 9, 0.2, 5, mat(0x5a6b7a, { rough: 1 }));
      const beach = add(scene, new THREE.Mesh(roundedBox(3.2, 0.6, 5, 0.05), mat(0xd9c38a, { rough: 1, map: look.noiseTex(0xd9c38a, 0.08) })), -3.6, -1.3, 0); beach.receiveShadow = true;
      box(scene, -5.4, -0.55, 0, 0.6, 1.5, 5, stoneMat(0x9a9585));
      // a lighthouse on the wall, a boat out at sea
      const lh = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.6, 16), mat(0xffffff, { rough: 0.6 })), -5.4, 1.0, -1.4); lh.castShadow = true;
      for (let i = 0; i < 3; i++) { const band = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.2, 16), mat(0xd04030)); band.position.y = -0.5 + i * 0.5; lh.add(band); }
      const lamp = glow(0xfff1c0, 1.2, 0.8); lamp.position.set(-5.4, 1.95, -1.4); scene.add(lamp);
      const boat = new THREE.Group(); const hull = new THREE.Mesh(roundedBox(0.9, 0.25, 0.4, 0.08), woodMat(0x8a5a3a)); boat.add(hull); const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8), mat(0x6f5b3e)); mast.position.y = 0.45; boat.add(mast); const sail = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), mat(0xfff4d7, { side: THREE.DoubleSide })); sail.position.set(0.2, 0.5, 0); boat.add(sail);
      boat.traverse((o) => { if (o.isMesh) o.castShadow = true; }); boat.position.set(4.5, -1.1, -0.8); scene.add(boat);
      const sea = add(scene, new THREE.Mesh(new THREE.PlaneGeometry(10, 5, 120, 20), new THREE.MeshPhysicalMaterial({ color: 0x1f5a8a, transparent: true, opacity: 0.88, roughness: 0.15, clearcoat: 1, side: THREE.DoubleSide, vertexColors: true })), 2.3, -1.2, 0); sea.rotation.x = -Math.PI / 2;
      const spos = sea.geometry.attributes.position; const cols = new Float32Array(spos.count * 3).fill(1); sea.geometry.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      const spray = emitter(scene, { n: 40, color: 0xffffff, size: 0.1, rate: 0, life: 0.7, spread: 0.6, vel: [-0.5, 1.2, 0], gravity: 2.5 });
      say(scene, labels, { en: `depth ${params.depth} m · ${params.distance} km to the harbour`, ja: `ふかさ ${params.depth} m · みなとまで ${params.distance} km` }, 0, 2.15, 0, 4, { accent: '#7fd1ff' });
      const spd = say(scene, labels, '', 2, 1.4, 0, 2.4, { size: 34 });
      camera.position.set(0, 2.3, 8.2); camera.lookAt(0, -0.8, 0);
      let tt = 0; const deep = new THREE.Color(0x1f5a8a); const foam = new THREE.Color(0xeaf6ff);
      return {
        update(dt) {
          tt += dt; const running = !!result;
          const x0 = running ? 6.8 - ((tt * 1.3) % 11) : 99; // the wave front, moving left toward the shore
          const amp = params.depth > 1000 ? 0.1 : 0.45;
          for (let i = 0; i < spos.count; i++) {
            const x = spos.getX(i); const y = spos.getY(i); const shoal = Math.max(0, (-x + 1) / 6); // taller and steeper near the beach
            const dx = x - x0; const crest = amp * (1 + shoal * 2.5) * Math.exp(-dx * dx * (1.8 + shoal * 3));
            const ripple = 0.03 * Math.sin(x * 3 + tt * 2) * Math.cos(y * 2 + tt);
            spos.setZ(i, crest + ripple);
            const f = Math.min(1, crest / (amp * 1.2)); const c = deep.clone().lerp(foam, f * f); cols.set([c.r, c.g, c.b], i * 3);
          }
          spos.needsUpdate = true; sea.geometry.attributes.color.needsUpdate = true; sea.geometry.computeVertexNormals();
          const bob = amp * (1 + Math.max(0, (-boat.position.x + 1) / 6) * 2.5) * Math.exp(-((boat.position.x - 2.3 - x0) ** 2) * 1.8); boat.position.y = -1.1 + bob; boat.rotation.z = -bob * 0.8;
          spray.userData.state.origin = [x0 + 2.3 - 0.4, -1.2 + amp * 2, 0]; spray.userData.state.on = running && x0 < -2; spray.userData.state.rate = 30;
          lamp.material.opacity = 0.5 + Math.sin(tt * 2) * 0.3;
          if (result) spd.userData.set(`${result.speedKmh} km/h · ${result.minutes} ${t({ en: 'min', ja: 'ふん' })}`);
        },
        replay() { tt = 0; },
      };
    },

    cloud({ scene, params, result, camera, labels }) {
      THEMES.sky(scene); sunDisc(scene, -9, 6, -14, { r: 0.9 }); hills(scene, { color: 0x5f8a4e, r: 16, y: -1.8 });
      ground(scene, { color: 0x8fa65c, r: 9, y: -1.6, tex: look.noiseTex(0x8fa65c, 0.1) });
      const mtn = add(scene, new THREE.Mesh(new THREE.ConeGeometry(2.6, 4.2, 6), mat(0x7a7f88, { rough: 1, flat: true })), 4, 0.5, -2.5); mtn.castShadow = true;
      const snow = add(scene, new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.5, 6), mat(0xffffff, { rough: 1, flat: true })), 4, 1.86, -2.5);
      void snow;
      // an altitude ruler: a glowing post with a tick every 500 m
      for (let i = 0; i <= 5; i++) { const y = -1.6 + i * 0.8; const tk = add(scene, new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: 0xfff4d7 })), -3.5, y, 0); void tk; const lab = labelSprite(`${i * 500} m`, { width: 1.5, background: null, size: 32 }); lab.position.set(-4.5, y, 0); scene.add(lab); }
      add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4.2, 8), new THREE.MeshBasicMaterial({ color: 0xfff4d7, transparent: true, opacity: 0.6 })), -3.5, 0.4, 0);
      const parcel = ball(scene, -1.5, -1.2, 0, 0.5, new THREE.MeshPhysicalMaterial({ color: 0xffd36b, transparent: true, opacity: 0.55, roughness: 0.2, clearcoat: 1 }));
      const parcelGlow = glow(0xffd36b, 1.8, 0.5); parcelGlow.position.copy(parcel.position); scene.add(parcelGlow);
      const heat = emitter(scene, { n: 30, color: 0xffe6a8, size: 0.08, rate: 10, life: 1.2, origin: [-1.5, -1.5, 0], spread: 0.5, vel: [0, 0.6, 0] });
      const cloudG = new THREE.Group(); for (const [x, y, r] of [[0, 0, 0.55], [0.55, 0.1, 0.42], [-0.55, 0.05, 0.42], [0.2, 0.4, 0.38], [-0.2, 0.35, 0.34]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat(0xffffff, { rough: 1 })); b.position.set(x, y, 0); b.castShadow = true; cloudG.add(b); } cloudG.scale.setScalar(0.01); cloudG.position.set(-1.5, 0, 0); scene.add(cloudG);
      const drops = emitter(scene, { n: 40, color: 0x7fd1ff, size: 0.06, rate: 0, life: 1.4, origin: [-1.5, 0, 0], spread: 0.8, vel: [0, -1.6, 0], gravity: 1 });
      say(scene, labels, { en: `${params.tempC}°C · ${params.humidity}% humidity`, ja: `${params.tempC}°C · しつど ${params.humidity}%` }, 0, 3.4, 0, 3.4, { accent: '#7fd1ff' });
      const hL = say(scene, labels, '0 m', -1.5, -1.95, 0.6, 1.6);
      const tL = say(scene, labels, `${params.tempC}°C`, 1.2, -1.2, 0.6, 1.2, { background: null });
      camera.position.set(0, 1.6, 8); camera.lookAt(0, 0.6, 0);
      const top = result ? Math.min(2.4, result.cloudBase / 1000) : 2.4; let tt = 0;
      return {
        update(dt) {
          heat.userData.state.on = params.tempC > 15;
          if (!result) { parcel.position.y = -1.2 + Math.sin(tt += dt) * 0.03; parcelGlow.position.copy(parcel.position); return; }
          tt = Math.min(5, tt + dt); const f = tt / 5; const y = -1.2 + top * f * 1.6; parcel.position.set(-1.5, y, 0); parcelGlow.position.copy(parcel.position);
          const tempNow = params.tempC - (top * f * 1000) / 100; tL.userData.set(`${tempNow.toFixed(0)}°C`); tL.position.set(-0.6, y, 0.6);
          parcel.material.color.set(new THREE.Color(0xffd36b).lerp(new THREE.Color(0x7fd1ff), f)); parcelGlow.material.color.copy(parcel.material.color); parcel.scale.setScalar(1 + f * 0.4);
          hL.userData.set(`${Math.round(top * f * 1000)} m`);
          if (f >= 1 && result.forms === 'cloud') { cloudG.position.set(-1.5, y, 0); cloudG.scale.setScalar(Math.min(1.4, cloudG.scale.x + dt * 1.2)); parcel.visible = false; parcelGlow.visible = false; drops.userData.state.on = result.rain === 'likely'; drops.userData.state.origin = [-1.5, y - 0.3, 0]; drops.userData.state.rate = 14; }
        },
        replay() { tt = 0; cloudG.scale.setScalar(0.01); parcel.visible = true; parcelGlow.visible = true; drops.userData.state.on = false; },
      };
    },

    bridge({ scene, params, result, camera, labels }) {
      THEMES.sky(scene); sunDisc(scene, -8, 6, -12, { r: 0.8 }); hills(scene, { color: 0x5f8a4e, r: 16, y: -2.2 });
      const river = add(scene, new THREE.Mesh(new THREE.PlaneGeometry(30, 6, 1, 1), new THREE.MeshPhysicalMaterial({ color: 0x3f8fc0, roughness: 0.1, clearcoat: 1, transparent: true, opacity: 0.9 })), 0, -2.0, 0); river.rotation.x = -Math.PI / 2;
      const L = params.span * 1.1;
      for (const sx of [-1, 1]) { const bank = add(scene, new THREE.Mesh(roundedBox(6, 1.0, 5, 0.1), mat(0x6aa35a, { rough: 1, map: look.noiseTex(0x6aa35a, 0.1) })), sx * (L / 2 + 3.3), -1.6, 0); bank.receiveShadow = true; const pier = add(scene, new THREE.Mesh(roundedBox(0.8, 1.6, 1.6, 0.05), stoneMat(0x9a9585)), sx * (L / 2 + 0.4), -1.1, 0); pier.castShadow = true; tree(scene, sx * (L / 2 + 4.5), -1.5, { h: 1.6, y: -1.1 }); }
      const thick = Math.max(0.06, params.thickness * 0.03);
      const material = { wood: woodMat(0xa58c62), steel: metalMat(0x8d9aa0), plastic: plasticMat(0x7fd1ff) }[params.material];
      const geo = new THREE.BoxGeometry(L, thick, 1.2, 32, 1, 1); const plank = add(scene, new THREE.Mesh(geo, material), 0, -0.3 + thick / 2, 0); plank.castShadow = true;
      const base = geo.attributes.position.array.slice();
      const crate = new THREE.Group(); const size = 0.5 + params.load * 0.002; crate.add(new THREE.Mesh(roundedBox(size, size, size, 0.04), woodMat(0x8a5a3a))); for (const k of [-1, 1]) { const strap = new THREE.Mesh(new THREE.BoxGeometry(size * 1.02, 0.06, size * 1.02), metalMat(0x444444)); strap.position.y = k * size * 0.3; crate.add(strap); }
      const tag = labelSprite(`${params.load} kg`, { width: 1.3, background: null }); tag.position.y = size * 0.8; crate.add(tag); crate.traverse((o) => { if (o.isMesh) o.castShadow = true; }); crate.position.set(0, -0.3 + thick + size / 2, 0); scene.add(crate);
      const halves = [-1, 1].map((k) => { const h = new THREE.Mesh(new THREE.BoxGeometry(L / 2, thick, 1.2), material); h.visible = false; h.position.set(k * L / 4, -0.3 + thick / 2, 0); scene.add(h); return h; });
      const splinters = emitter(scene, { n: 30, color: 0xd4c49b, size: 0.1, rate: 0, life: 1, spread: 1, vel: [0, 1.5, 0], gravity: 4, additive: false });
      say(scene, labels, { en: `${params.span} m · ${maker.MATERIALS[params.material].en} · ${params.thickness} cm · ${params.load} kg`, ja: `${params.span} m · ${maker.MATERIALS[params.material].ja} · ${params.thickness} cm · ${params.load} kg` }, 0, 2.0, 0, 4.4, { accent: '#f2b134' });
      const sagL = say(scene, labels, '', 0, -1.2, 1.2, 2.4);
      camera.position.set(0, 1.4, 7.5); camera.lookAt(0, -0.2, 0);
      let tt = 0; const sag = result ? Math.min(1.2, result.sagMm / 60) : 0; const breaks = result?.holds === 'breaks'; let snapped = false;
      return {
        update(dt) {
          if (!result) return; tt = Math.min(3, tt + dt); const f = Math.min(1, tt / 2);
          if (breaks && f >= 1) {
            if (!snapped) { snapped = true; plank.visible = false; halves.forEach((h) => { h.visible = true; }); splinters.userData.state.origin = [0, -0.3, 0]; splinters.userData.state.acc = 30; }
            halves.forEach((h, i) => { h.rotation.z += (i ? 1 : -1) * dt * 1.6; h.position.y -= dt * 1.2; }); crate.position.y -= dt * 2.2; crate.rotation.z += dt;
            sagL.userData.set(t({ en: 'It broke!', ja: 'おれた！' }));
            return;
          }
          const pos = geo.attributes.position; for (let i = 0; i < pos.count; i++) { const x = base[i * 3]; const u = (x / L) * 2; const bend = -sag * f * (1 - u * u) ** 2; pos.setY(i, base[i * 3 + 1] + bend); } pos.needsUpdate = true; geo.computeVertexNormals();
          crate.position.y = -0.3 + thick + size / 2 - sag * f;
          sagL.userData.set(`${(result.sagMm * f).toFixed(1)} mm · ${t(result.holds === 'holds' ? { en: 'holds', ja: 'ささえる' } : { en: 'about to break…', ja: 'おれそう…' })}`);
        },
        replay() { tt = 0; snapped = false; plank.visible = true; halves.forEach((h, i) => { h.visible = false; h.rotation.z = 0; h.position.set((i ? 1 : -1) * L / 4, -0.3 + thick / 2, 0); }); crate.position.set(0, -0.3 + thick + size / 2, 0); crate.rotation.z = 0; },
      };
    },

    circuit({ scene, params, result, camera, labels }) {
      THEMES.lab(scene); ground(scene, { color: 0x2f3b48, r: 10, y: -1.6, grid: true });
      slab(scene, { y: -1.5, w: 9, d: 5, material: woodMat(0xa58c62) });
      const batt = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.3, 32), metalMat(0x334455)), -2.5, -0.75, 0); batt.castShadow = true;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.25, 32), metalMat(0xd4c49b)); cap.position.y = 0.55; batt.add(cap); const nub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16), metalMat(0xd4c49b)); nub.position.y = 0.72; batt.add(nub);
      const plus = labelSprite(`+ ${params.volts} V`, { width: 1.3, background: null }); plus.position.set(-2.5, 0.35, 0.3); scene.add(plus);
      const path = [[-2.5, 0.1, 0], [-2.5, 1.4, 0], [-1, 1.4, 0], [1, 1.4, 0], [2.5, 1.4, 0], [2.5, -1.3, 0], [-2.5, -1.3, 0], [-2.5, -1.0, 0]];
      scene.add(tube(path, 0.035, 0xb87333, { metal: true, segments: 120 }));
      const res = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.1, 24), plasticMat(0xe4c239)), 0, 1.4, 0); res.rotation.z = Math.PI / 2;
      [0x8d6b44, 0x1c2a3a, 0xd04030, 0xd4c49b].forEach((c, i) => { const band = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 24), plasticMat(c)); band.position.y = -0.35 + i * 0.22; res.add(band); });
      const rl = labelSprite(`${params.resistance} Ω`, { width: 1.3, background: null }); rl.position.set(0, 1.9, 0); scene.add(rl);
      const bulbs = []; for (let i = 0; i < params.bulbs; i++) { const y = 0.7 - i * 0.9; const sock = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.25, 16), metalMat(0x666666)), 2.5, y - 0.3, 0); void sock; const b = add(scene, glass(new THREE.SphereGeometry(0.3, 24, 18), 0xfff6d0, 0.3), 2.5, y, 0); const fil = glow(0xffb300, 0.5, 0); fil.position.copy(b.position); scene.add(fil); const halo = glow(0xffd36b, 2.4, 0); halo.position.copy(b.position); scene.add(halo); const light = new THREE.PointLight(0xffd36b, 0, 5, 2); light.position.set(2.3, y, 0.3); scene.add(light); bulbs.push({ b, fil, halo, light }); }
      const electrons = []; for (let i = 0; i < 16; i++) electrons.push(glow(0x7fd1ff, 0.22, 0.95)); electrons.forEach((e) => scene.add(e));
      const smoke = emitter(scene, { n: 30, color: 0x888888, size: 0.2, rate: 0, life: 1.6, origin: [2.5, 0.9, 0], spread: 0.2, vel: [0, 0.6, 0], additive: false });
      say(scene, labels, { en: `${params.volts} V · ${params.resistance} Ω · ${params.bulbs} bulb${params.bulbs > 1 ? 's' : ''}`, ja: `${params.volts} V · ${params.resistance} Ω · でんきゅう ${params.bulbs}` }, 0, 2.6, 0, 3.4, { accent: '#ffd36b' });
      const mA = say(scene, labels, '', 0, -0.4, 0.6, 2, { size: 36 });
      camera.position.set(0, 1.0, 6.8); camera.lookAt(0, 0, 0);
      const curve = new THREE.CatmullRomCurve3(path.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.2);
      let tt = 0;
      return {
        update(dt) {
          const speed = result ? Math.min(0.5, result.mA / 120) : 0.03; tt += dt * speed;
          electrons.forEach((e, i) => { const p = curve.getPointAt(((tt + i / 16) % 1 + 1) % 1); e.position.copy(p); e.position.z += 0.05; e.material.opacity = result && result.mA > 0 ? 0.95 : 0.25; });
          const br = result ? { off: 0, dim: 0.35, bright: 1, blown: 0 }[result.brightness] : 0; const flick = result?.brightness === 'blown' ? 0 : 1 + Math.sin(tt * 90) * 0.03;
          bulbs.forEach(({ fil, halo, light }) => { fil.material.opacity = br * flick; fil.scale.setScalar(0.5 + br * 0.3); halo.material.opacity = br * 0.55 * flick; light.intensity = br * 10; });
          smoke.userData.state.on = result?.brightness === 'blown'; smoke.userData.state.rate = 8;
          if (result) mA.userData.set(`${result.mA} mA · ${t({ off: { en: 'off', ja: 'つかない' }, dim: { en: 'dim', ja: 'くらい' }, bright: { en: 'bright', ja: 'あかるい' }, blown: { en: 'blown!', ja: 'きれた！' } }[result.brightness])}`);
        },
        replay() { tt = 0; },
      };
    },

    gears({ scene, params, result, camera, labels }) {
      THEMES.lab(scene); ground(scene, { color: 0x2f3b48, r: 10, y: -1.6, grid: true });
      slab(scene, { y: -1.5, w: 8, d: 4, material: woodMat(0x6f5b3e) });
      const plate = add(scene, new THREE.Mesh(roundedBox(6, 0.15, 3, 0.05), metalMat(0x4a5560)), 0, -1.3, 0); plate.receiveShadow = true;
      const mk = (teeth, color) => { const r = 0.2 + teeth * 0.06; const g = new THREE.Mesh(gearGeometry(teeth, r, 0.28), metalMat(color, { rough: 0.35 })); g.castShadow = true; g.userData.r = r; const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.4, 16), metalMat(0x333333)); axle.position.y = -0.4; g.add(axle); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.34, 16), metalMat(0x222222)); g.add(hub); const dot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0xd04030 })); dot.position.set(r * 0.72, 0.17, 0); g.add(dot); return g; };
      const a = mk(params.driverTeeth, 0xc9a24a); const b = mk(params.drivenTeeth, 0x9aa5ad); a.position.set(-(a.userData.r + 0.1), -0.3, 0); b.position.set(b.userData.r + 0.1, -0.3, 0); scene.add(a); scene.add(b);
      // tilt the whole works toward the camera so the teeth read
      a.rotation.x = b.rotation.x = 0; const rig = new THREE.Group(); scene.add(rig);
      const crank = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), metalMat(0x333333)); crank.rotation.z = Math.PI / 2; crank.position.set(-a.userData.r * 0.5, 0.5, 0); a.add(crank);
      say(scene, labels, `${params.driverTeeth} → ${params.drivenTeeth} ${t({ en: 'teeth', ja: 'は' })} · ${params.rpm} rpm`, 0, 2.4, 0, 3, { accent: '#c9a24a' });
      const inL = say(scene, labels, `${params.rpm} rpm`, a.position.x, 1.4, 0, 1.4, { background: null });
      const outL = say(scene, labels, '', b.position.x, 1.4, 0, 2.2);
      camera.position.set(0.3, 2.0, 4.8); camera.lookAt(0, -0.2, 0);
      const outRpm = result ? result.outRpm : (params.rpm * params.driverTeeth) / params.drivenTeeth;
      let spin = 0;
      return {
        update(dt) {
          spin += dt; const k = result ? 1 : 0.35;
          a.rotation.y = (params.rpm / 60) * Math.PI * 2 * spin * 0.25 * k; b.rotation.y = -(outRpm / 60) * Math.PI * 2 * spin * 0.25 * k + Math.PI / params.drivenTeeth;
          if (result) outL.userData.set(`${result.outRpm} rpm · ${t({ en: result.direction, ja: 'ぎゃく むき' })}`); else outL.userData.set('?');
          void inL; void rig;
        },
        replay() { spin = 0; },
      };
    },

    dice({ scene, params, result, camera, labels }) {
      THEMES.lab(scene); ground(scene, { color: 0x1f3a2a, r: 10, y: -1.6, tex: feltTex(0x3f7a52) });
      const table = slab(scene, { y: -1.5, w: 10, d: 6, material: mat(0xffffff, { rough: 0.95, map: feltTex(0x3f7a52) }) }); void table;
      const rim = add(scene, new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.12, 12, 64), woodMat(0x6f5b3e)), 0, -1.38, 0); rim.rotation.x = Math.PI / 2; rim.scale.set(1.2, 0.72, 1);
      const dice = []; for (let i = 0; i < params.count; i++) { const d = add(scene, new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), diceMats()), -3 + i * 1.1, -0.9, 1.6); d.castShadow = true; d.userData.seed = i * 1.7; dice.push(d); }
      say(scene, labels, { en: `${params.count} dice × ${params.rolls} rolls`, ja: `サイコロ ${params.count} × ${params.rolls} かい` }, 0, 2.6, 0, 3, { accent: '#f2b134' });
      camera.position.set(0, 3.0, 7.5); camera.lookAt(0, 0, 0);
      const bars = []; let tt = 0; let best = null;
      if (result?.hist) {
        const max = Math.max(...result.hist.map(([, v]) => v)); const n = result.hist.length;
        result.hist.forEach(([k, v], i) => { const x = -3.5 + (i / Math.max(1, n - 1)) * 7; const hue = 0.55 - (v / max) * 0.45; const b = add(scene, new THREE.Mesh(roundedBox(Math.min(0.7, 6 / n), 1, 0.5, 0.03), plasticMat(new THREE.Color().setHSL(hue, 0.7, 0.55))), x, -1.39, -1); b.userData.h = 0.3 + (v / max) * 2.4; b.scale.y = 0.01; b.castShadow = true; bars.push(b); const lab = labelSprite(String(k), { width: 0.7, background: null, size: 28 }); lab.position.set(x, -1.65, -0.6); scene.add(lab); const cnt = labelSprite(String(v), { width: 0.8, background: null, size: 24 }); cnt.position.set(x, -1.3, -1); b.userData.cnt = cnt; scene.add(cnt); if (v === max) best = b; });
        if (best) { const g = glow(0xf2b134, 2, 0.5); g.position.set(best.position.x, -1.3, -1); scene.add(g); best.userData.glow = g; }
      }
      const mL = say(scene, labels, '', 3.6, 1.6, 0, 2.6); mL.visible = false;
      return {
        update(dt) {
          tt += dt;
          for (const d of dice) { if (tt < 2) { d.rotation.x += dt * 5; d.rotation.z += dt * 3.7; d.position.y = -0.9 + Math.abs(Math.sin(tt * 6 + d.userData.seed)) * 0.6 * (1 - tt / 2); } else { d.rotation.x += (Math.round(d.rotation.x / (Math.PI / 2)) * (Math.PI / 2) - d.rotation.x) * dt * 8; d.rotation.z += (Math.round(d.rotation.z / (Math.PI / 2)) * (Math.PI / 2) - d.rotation.z) * dt * 8; d.position.y += (-1.0 - d.position.y) * dt * 8; } }
          const f = Math.min(1, Math.max(0, (tt - 1.5) / 2.5));
          for (const b of bars) { const h = Math.max(0.01, b.userData.h * f); b.scale.y = h; b.position.y = -1.39 + h / 2; b.userData.cnt.position.y = -1.39 + h + 0.2; if (b.userData.glow) b.userData.glow.position.y = -1.39 + h; }
          if (result && f >= 1) { mL.visible = true; } if (result && f >= 1) mL.userData.set(`${t({ en: 'most often', ja: 'いちばん おおい' })}: ${result.mode} · ${t({ en: 'mean', ja: 'へいきん' })} ${result.mean}`);
        },
        replay() { tt = 0; },
      };
    },

    pond({ scene, params, result, camera, labels }) {
      THEMES.sky(scene); sunDisc(scene, 8, 7, -12, { r: 0.9 }); hills(scene, { color: 0x5f8a4e, r: 16, y: -1.7 });
      ground(scene, { color: 0x8fa65c, r: 9, y: -1.6, tex: look.noiseTex(0x8fa65c, 0.1) });
      for (const [x, z] of [[-6, -3], [6, -4], [-5.5, 4], [6.5, 3.5]]) tree(scene, x, z, { h: 1.8, y: -1.6 });
      const bank = add(scene, new THREE.Mesh(new THREE.TorusGeometry(4.1, 0.25, 10, 64), mat(0x9a8a5c, { rough: 1, map: look.noiseTex(0x9a8a5c, 0.12) })), 0, -1.5, 0); bank.rotation.x = Math.PI / 2;
      const water = add(scene, new THREE.Mesh(new THREE.CircleGeometry(4, 64, 0, Math.PI * 2), new THREE.MeshPhysicalMaterial({ color: 0x3f8fa0, transparent: true, opacity: 0.55, roughness: 0.08, clearcoat: 1 })), 0, -1.32, 0); water.rotation.x = -Math.PI / 2;
      const bed = add(scene, new THREE.Mesh(new THREE.CircleGeometry(4, 48), mat(0x2f4a3a, { rough: 1 })), 0, -1.5, 0); bed.rotation.x = -Math.PI / 2;
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; const pad = add(scene, new THREE.Mesh(new THREE.CircleGeometry(0.28, 16, 0.4, Math.PI * 1.8), mat(0x4f9a52, { rough: 0.8, side: THREE.DoubleSide })), Math.cos(a) * 3.2, -1.3, Math.sin(a) * 3.2); pad.rotation.x = -Math.PI / 2; pad.rotation.z = a; if (i % 3 === 0) { const fl = add(scene, new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.15, 6), mat(0xffb6c1)), pad.position.x, -1.22, pad.position.z); void fl; } }
      for (let i = 0; i < 12; i++) { const a = Math.random() * Math.PI * 2; const r = 4.3 + Math.random() * 0.5; const reed = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1 + Math.random() * 0.8, 6), mat(0x6a8a3a)), Math.cos(a) * r, -1.1, Math.sin(a) * r); reed.rotation.z = (Math.random() - 0.5) * 0.2; }
      const fishGeo = new THREE.CapsuleGeometry(0.06, 0.18, 3, 8); fishGeo.rotateZ(Math.PI / 2);
      const fish = new THREE.InstancedMesh(fishGeo, mat(0xf2b134, { rough: 0.4 }), 300); const marked = new THREE.InstancedMesh(fishGeo, mat(0xd04030, { rough: 0.4 }), 300); const tailGeo = new THREE.ConeGeometry(0.06, 0.12, 6); tailGeo.rotateZ(Math.PI / 2); const tails = new THREE.InstancedMesh(tailGeo, mat(0xf2b134, { rough: 0.6 }), 300);
      scene.add(fish); scene.add(marked); scene.add(tails);
      const seats = []; for (let i = 0; i < 300; i++) { const r = Math.sqrt(Math.random()) * 3.5; const a = Math.random() * Math.PI * 2; seats.push([Math.cos(a) * r, Math.sin(a) * r, Math.random() * 6, 0.4 + Math.random() * 0.6]); }
      const d = new THREE.Object3D();
      const show = (n, m, time) => { for (let i = 0; i < 300; i++) { const s = seats[i]; const vis = i < n; const a = s[2] + time * s[3] * 0.3; const x = s[0] + Math.cos(a) * 0.3; const z = s[1] + Math.sin(a) * 0.3; d.position.set(vis ? x : 0, vis ? -1.3 : -99, vis ? z : 0); d.rotation.set(0, -a - Math.PI / 2, 0); d.updateMatrix(); fish.setMatrixAt(i, i < m ? d.matrix.clone().setPosition(0, -99, 0) : d.matrix); marked.setMatrixAt(i, i < m ? d.matrix : d.matrix.clone().setPosition(0, -99, 0)); d.position.x -= Math.cos(-a - Math.PI / 2 + Math.PI / 2) * 0.16; d.position.z += Math.sin(-a) * 0.0; d.rotation.set(0, -a - Math.PI / 2, Math.sin(time * 6 + s[2]) * 0.4); d.updateMatrix(); tails.setMatrixAt(i, d.matrix); } fish.instanceMatrix.needsUpdate = marked.instanceMatrix.needsUpdate = tails.instanceMatrix.needsUpdate = true; };
      const net = new THREE.Group(); net.add(new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.03, 8, 32), metalMat(0x888888))); const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.4 })); mesh.rotation.x = Math.PI; net.add(mesh); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8), woodMat(0x8a5a3a)); pole.position.set(1.1, 0.6, 0); pole.rotation.z = -1.0; net.add(pole); net.rotation.x = Math.PI / 2; net.position.set(1.2, -0.2, 1.2); scene.add(net);
      const ripples = emitter(scene, { n: 10, color: 0xffffff, size: 0.35, rate: 1.5, life: 1.5, origin: [1.2, -1.3, 1.2], spread: 0.1, vel: [0, 0.01, 0] });
      say(scene, labels, { en: `mark ${params.marked} · catch ${params.caught} again`, ja: `${params.marked} ひきに しるし · ${params.caught} ひき また つかまえる` }, 0, 2.6, 0, 3.6, { accent: '#d04030' });
      const countL = say(scene, labels, result ? '' : '?', 0, 1.7, 0, 3.4);
      camera.position.set(0, 4.8, 8); camera.lookAt(0, -0.8, 0);
      let tt = 0;
      return {
        update(dt) {
          tt += dt; const n = result ? Math.min(300, result.truth) : 80; show(n, Math.min(n, params.marked), tt);
          net.position.y = -0.2 + Math.sin(tt * 1.2) * 0.5 - 0.5; ripples.userData.state.on = net.position.y < -1.1;
          if (result) countL.userData.set(`${result.recaptured} ${t({ en: 'marked in the catch', ja: 'ひき しるしつき' })} → ${t({ en: 'estimate', ja: 'みつもり' })} ${result.estimate ?? '?'} · ${t({ en: 'truth', ja: 'ほんとう' })} ${result.truth}`);
        },
        replay() { tt = 0; },
      };
    },

    classify({ scene, params, result, camera, labels }) {
      THEMES.space(scene);
      const g = graph({ w: 5, h: 3, xLabel: { en: 'weight (g)', ja: 'おもさ（g）' }, yLabel: { en: 'colour: green → orange', ja: 'いろ：みどり → オレンジ' }, tone: 0x7fd1ff }); scene.add(g); labels.push(...g.userData.labels);
      const X = (w) => -2.5 + ((w - 80) / 200) * 5; const Y = (c) => -1.5 + c * 3;
      const fruit = (x, y, label, r = 0.09) => { const m = ball(scene, x, y, 0.1, r, plasticMat(label === 'apple' ? 0xd9433a : 0xf2a034, { emissive: label === 'apple' ? 0x5a0a0a : 0x5a3a00, emissiveIntensity: 0.5 })); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, r * 0.8, 4), mat(0x4a3826)); st.position.y = r; m.add(st); return m; };
      if (result?.train) for (const p of result.train) fruit(X(p.w), Y(p.c), p.label);
      const me = fruit(X(params.weight), Y(params.color), '?', 0.13); me.material = mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.5, rough: 0.3 }); const ring = glow(0xffffff, 1.0, 0.6); ring.position.copy(me.position); scene.add(ring);
      const lines = [];
      if (result?.near) for (const p of result.near) { const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(X(params.weight), Y(params.color), 0.12), new THREE.Vector3(X(p.w), Y(p.c), 0.12)]); const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: p.label === 'apple' ? 0xff8a7a : 0xffd36b, transparent: true, opacity: 0.9 })); l.geometry.setDrawRange(0, 0); scene.add(l); lines.push(l); const sp = glow(p.label === 'apple' ? 0xff8a7a : 0xffd36b, 0.6, 0.6); sp.position.set(X(p.w), Y(p.c), 0.15); sp.visible = false; scene.add(sp); l.userData.spark = sp; }
      say(scene, labels, { en: `${params.weight} g · colour ${params.color} · k = ${params.k}`, ja: `${params.weight} g · いろ ${params.color} · k = ${params.k}` }, 0, 2.35, 0, 3.4, { accent: '#7fd1ff' });
      const verdict = say(scene, labels, '', 0, -2.4, 0.2, 3.2, { size: 34 });
      motes(scene, { n: 40, box: [7, 5, 2], color: 0x7fd1ff, size: 0.06, opacity: 0.4 });
      camera.position.set(0, 0.3, 6.6); camera.lookAt(0, 0, 0);
      let tt = 0;
      return {
        update(dt) {
          tt += dt; me.scale.setScalar(1 + Math.sin(tt * 3) * 0.12); ring.scale.setScalar(1.0 + Math.sin(tt * 3) * 0.3); ring.material.opacity = 0.4 + Math.sin(tt * 3) * 0.2;
          lines.forEach((l, i) => { const on = tt > 0.6 + i * 0.35; l.geometry.setDrawRange(0, on ? 2 : 0); l.userData.spark.visible = on; });
          if (result && tt > 0.6 + lines.length * 0.35) { verdict.userData.set(`${t(result.label === 'apple' ? { en: 'Apple', ja: 'りんご' } : { en: 'Orange', ja: 'みかん' })} · ${result.confidence}% ${t({ en: 'sure', ja: 'たしか' })}`); me.material.color.set(result.label === 'apple' ? 0xd9433a : 0xf2a034); me.material.emissive.set(result.label === 'apple' ? 0xd9433a : 0xf2a034); }
        },
        replay() { tt = 0; me.material.color.set(0xffffff); me.material.emissive.set(0xffffff); },
      };
    },
  };
}
