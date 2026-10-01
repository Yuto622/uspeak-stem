// The 3D stages for the five newer islands. Same contract as stage.js's builders:
// { update(dt), replay() }, drawing only what the room has already decided.

import * as THREE from './vendor/three.module.js';
import { t } from './i18n.js';
import * as force from '/shared/sim/force.js';
import * as life from '/shared/sim/life.js';
import * as maker from '/shared/sim/maker.js';

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
const box = (scene, x, y, z, w, h, d, color, extra) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std(color, extra)); m.position.set(x, y, z); scene.add(m); return m; };
const ball = (scene, x, y, z, r, color, extra) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), std(color, extra)); m.position.set(x, y, z); scene.add(m); return m; };
const floor = (scene, color = 0x8c917c, w = 10, d = 6, y = -1.5) => box(scene, 0, y, 0, w, 0.2, d, color);
const glass = (geo) => new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0xcfe8f0, transparent: true, opacity: 0.28, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false }));

export function moreBuilders({ labelSprite, graph }) {
  const say = (scene, labels, pair, x, y, z, w = 3) => { const s = labelSprite(pair, { width: w }); s.position.set(x, y, z); scene.add(s); labels.push(s); return s; };
  return {
    pendulum({ scene, params, result, camera, labels }) {
      scene.background = new THREE.Color(0x1a2a3a); floor(scene);
      const L = params.length; const top = 2.4; const scale = 1.6;
      for (const sx of [-2, 2]) box(scene, sx, 0.4, 0, 0.2, 4, 0.2, 0x6f5b3e); box(scene, 0, top, 0, 4.4, 0.2, 0.2, 0x6f5b3e);
      const rope = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, top, 0), new THREE.Vector3(0, top - L * scale, 0)]), new THREE.LineBasicMaterial({ color: 0xd4c49b })); scene.add(rope);
      const bob = ball(scene, 0, top - L * scale, 0, params.mass === 'heavy' ? 0.26 : 0.16, 0x8d9aa0, { metalness: 0.4 });
      say(scene, labels, { en: `${L} m string · ${params.angle}° · ${params.mass} bob`, ja: `ひも ${L} m · ${params.angle}° · おもり ${params.mass === 'heavy' ? 'おもい' : 'かるい'}` }, 0, 3.2, 0, 4);
      const timer = say(scene, labels, '0 swings', -2.8, 1.2, 0, 1.8);
      camera.position.set(0.5, 0.8, 7); camera.lookAt(0, 0.6, 0);
      const T = result?.period ?? 2 * Math.PI * Math.sqrt(L / force.G); const th0 = (params.angle * Math.PI) / 180;
      let tt = 0;
      return { update(dt) { tt += dt; const th = th0 * Math.cos((2 * Math.PI * tt) / T); const x = Math.sin(th) * L * scale; const y = top - Math.cos(th) * L * scale; bob.position.set(x, y, 0); rope.geometry.setFromPoints([new THREE.Vector3(0, top, 0), new THREE.Vector3(x, y, 0)]); if (result) timer.userData.set(`${Math.min(result.swings, Math.floor(tt / T))} / 30 s`); }, replay() { tt = 0; } };
    },

    ramp({ scene, params, result, camera, labels }) {
      scene.background = new THREE.Color(0x1a2a3a); floor(scene);
      const a = (params.angle * Math.PI) / 180; const len = 4;
      const plank = box(scene, 0, -0.6 + Math.sin(a) * len / 2, 0, len, 0.2, 1.4, { ice: 0xcfe8f0, wood: 0xa58c62, rubber: 0x334455 }[params.surface]); plank.rotation.z = a;
      const block = box(scene, 0, 0, 0, 0.6, 0.6, 0.6, 0xd04030);
      say(scene, labels, { en: `${params.angle}° · ${force.SURFACES[params.surface].en}`, ja: `${params.angle}° · ${force.SURFACES[params.surface].ja}` }, 0, 2.6, 0, 3);
      const speed = say(scene, labels, '', 2.6, 1.6, 0, 2.2);
      camera.position.set(0.6, 1.2, 7); camera.lookAt(0, 0, 0);
      let tt = 0; const place = (s) => { const d = len / 2 - s; block.position.set(-Math.cos(a) * d, -0.6 + Math.sin(a) * len / 2 + Math.sin(a) * d + 0.45, 0); block.rotation.z = a; };
      place(0);
      return { update(dt) { if (!result || result.moves === 'stays') { place(0); if (result) speed.userData.set(t({ en: 'stays put', ja: 'とまったまま' })); return; } tt += dt; const s = Math.min(2, 0.5 * result.accel * tt * tt / 2 * 2); place(s); speed.userData.set(`${Math.min(result.speed, result.accel * tt).toFixed(2)} m/s`); if (s >= 2) tt = Math.min(tt, result.time); }, replay() { tt = 0; } };
    },

    lever({ scene, params, result, camera, labels }) {
      scene.background = new THREE.Color(0x1a2a3a); floor(scene);
      box(scene, 0, -0.9, 0, 0.8, 1.0, 0.8, 0x7b6647);
      const plank = box(scene, 0, -0.3, 0, 5.2, 0.16, 0.9, 0xa58c62);
      const lw = box(scene, 0, 0, 0, 0.3 + params.leftMass * 0.06, 0.3 + params.leftMass * 0.06, 0.6, 0x3a6fd0); plank.add(lw);
      const rw = box(scene, 0, 0, 0, 0.3 + params.rightMass * 0.06, 0.3 + params.rightMass * 0.06, 0.6, 0xd04030); plank.add(rw);
      lw.position.set(-params.leftDist * 1.2, 0.3 + params.leftMass * 0.03, 0); rw.position.set(params.rightDist * 1.2, 0.3 + params.rightMass * 0.03, 0);
      say(scene, labels, `${params.leftMass} kg · ${params.leftDist} m`, -2, 1.6, 0, 2); say(scene, labels, `${params.rightMass} kg · ${params.rightDist} m`, 2, 1.6, 0, 2);
      camera.position.set(0, 1.4, 6.5); camera.lookAt(0, 0, 0);
      const target = result ? (result.tilt === 'left' ? 0.22 : result.tilt === 'right' ? -0.22 : 0) : 0;
      return { update(dt) { plank.rotation.z += (target - plank.rotation.z) * Math.min(1, dt * 2); }, replay() { plank.rotation.z = 0; } };
    },

    meadow({ scene, params, result, camera, labels }) {
      scene.background = new THREE.Color(0x9fd3dc); box(scene, 0, -1.5, 0, 12, 0.2, 8, 0x6aa35a);
      const rab = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.22, 0.3), std(0xf4f1ea), 220); const fox = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.3, 0.5), std(0xd4713d), 90);
      scene.add(rab); scene.add(fox); const dummy = new THREE.Object3D();
      const seats = []; for (let i = 0; i < 220; i++) seats.push([(Math.random() - 0.5) * 11, (Math.random() - 0.5) * 7]);
      const show = (R, F) => { for (let i = 0; i < 220; i++) { dummy.position.set(seats[i][0], i < R ? -1.28 : -99, seats[i][1]); dummy.updateMatrix(); rab.setMatrixAt(i, dummy.matrix); } for (let i = 0; i < 90; i++) { dummy.position.set(-seats[i][0], i < F ? -1.25 : -99, -seats[i][1]); dummy.updateMatrix(); fox.setMatrixAt(i, dummy.matrix); } rab.instanceMatrix.needsUpdate = true; fox.instanceMatrix.needsUpdate = true; };
      show(Math.min(220, params.rabbits), Math.min(90, params.foxes));
      const g = graph({ w: 4, h: 1.6, xLabel: { en: 'days', ja: '日' }, yLabel: { en: 'rabbits (white) · foxes (orange)', ja: 'ウサギ（しろ）・キツネ（オレンジ）' } }); g.position.set(0, 1.9, -2); scene.add(g); labels.push(g.children[2], g.children[3]);
      const day = say(scene, labels, { en: 'day 0', ja: '0日め' }, -4.5, 1.4, 0, 1.6);
      camera.position.set(0, 4.5, 8.5); camera.lookAt(0, 0.2, 0);
      let lines = null; let tt = 0; const dur = 10;
      if (result?.trace) { const tr = result.trace; const maxY = Math.max(...tr.flat()) * 1.1; lines = [g.userData.plot(tr.map((p, i) => [i, p[0]]), { color: 0xffffff, xr: [0, tr.length], yr: [0, maxY] }), g.userData.plot(tr.map((p, i) => [i, p[1]]), { color: 0xd4713d, xr: [0, tr.length], yr: [0, maxY] })]; for (const l of lines) l.geometry.setDrawRange(0, 0); }
      return { update(dt) { if (!lines) return; tt = Math.min(dur, tt + dt); const i = Math.floor((tt / dur) * (result.trace.length - 1)); for (const l of lines) l.geometry.setDrawRange(0, i + 1); const [R, F] = result.trace[i]; show(Math.min(220, R), Math.min(90, F)); day.userData.set(t({ en: `day ${i}`, ja: `${i}日め` })); }, replay() { tt = 0; } };
    },

    plant({ scene, params, result, camera, labels }) {
      scene.background = new THREE.Color(params.light === 'dark' ? 0x111318 : 0x9fd3dc); floor(scene, 0xa58c62, 8, 4);
      box(scene, 0, -1.1, 0, 1.2, 0.8, 1.2, 0xb86e46); box(scene, 0, -0.68, 0, 1.0, 0.08, 1.0, 0x5a4632);
      if (params.light === 'sun') ball(scene, 3, 2.6, -1, 0.6, 0xffd36b, { emissive: 0xffb300, emissiveIntensity: 0.6 });
      if (params.light === 'window') { box(scene, 3, 1.2, -1.5, 2.2, 2.6, 0.1, 0xcfe8f0, { transparent: true, opacity: 0.5 }); box(scene, 3, 1.2, -1.5, 2.4, 0.12, 0.14, 0xffffff); box(scene, 3, 1.2, -1.5, 0.12, 2.8, 0.14, 0xffffff); }
      for (let i = 0; i < params.water; i++) box(scene, -2.4 + i * 0.5, -0.9, 0.8, 0.36, 0.5, 0.36, 0x7fd1ff);
      say(scene, labels, { en: `${params.water} cups/day · ${life.LIGHT[params.light].en} · ${params.tempC}°C`, ja: `みず ${params.water} · ${life.LIGHT[params.light].ja} · ${params.tempC}°C` }, 0, 3.3, 0, 4);
      const stem = box(scene, 0, -0.6, 0, 0.1, 0.01, 0.1, 0x4f8f4a); const leaves = [];
      const h = say(scene, labels, '', -2.6, 1.4, 0, 1.6);
      camera.position.set(0.4, 1.2, 6); camera.lookAt(0, 0.4, 0);
      let tt = 0; const H = result ? result.height * 0.12 : 0; const col = result?.color === 'pale' ? 0xc9d98a : 0x4f8f4a; const dur = 4;
      return { update(dt) { if (!result) return; tt = Math.min(dur, tt + dt); const f = tt / dur; const hh = Math.max(0.01, H * f); stem.scale.y = hh / 0.01; stem.position.y = -0.64 + hh / 2; stem.material.color.set(col); const want = Math.round(result.leaves * f); while (leaves.length < want) { const l = box(scene, 0, 0, 0, 0.5, 0.06, 0.3, col); l.position.set(leaves.length % 2 ? 0.3 : -0.3, -0.64 + (leaves.length + 1) * (H / Math.max(1, result.leaves)), 0); l.rotation.z = leaves.length % 2 ? -0.4 : 0.4; leaves.push(l); } h.userData.set(`${(result.height * f).toFixed(1)} cm`); }, replay() { tt = 0; for (const l of leaves) scene.remove(l); leaves.length = 0; } };
    },

    heart({ scene, params, result, camera, labels }) {
      scene.background = new THREE.Color(0x1a2a3a); floor(scene, 0xc0604a, 10, 4);
      const heart = new THREE.Group(); heart.add(new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), std(0xd9433a))); const l2 = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), std(0xd9433a)); l2.position.x = 0.5; heart.add(l2); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.0, 16), std(0xd9433a)); tip.rotation.z = Math.PI; tip.position.set(0.25, -0.65, 0); heart.add(tip); heart.position.set(-2.4, 1.2, 0); scene.add(heart);
      const runner = new THREE.Group(); runner.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.3), std(0x3a6fd0))); const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), std(0xe8c39a)); head.position.y = 0.65; runner.add(head); runner.position.set(1.5, -0.95, 0); scene.add(runner);
      say(scene, labels, { en: `${life.ACTIVITY[params.activity].en} · ${params.minutes} min · age ${params.age}`, ja: `${life.ACTIVITY[params.activity].ja} · ${params.minutes} ぷん · ${params.age} さい` }, 0, 3, 0, 4);
      const bpm = say(scene, labels, '— bpm', -2.4, 2.5, 0, 1.8);
      camera.position.set(0.3, 1.2, 6.5); camera.lookAt(0, 0.4, 0);
      const rate = result ? result.bpm : 70 - (params.age - 6); const k = life.ACTIVITY[params.activity].k; let tt = 0;
      return { update(dt) { tt += dt; const beat = 1 + 0.12 * Math.max(0, Math.sin((tt * rate / 60) * Math.PI * 2)) ** 8; heart.scale.setScalar(beat); if (result) bpm.userData.set(`${result.bpm} bpm`); runner.position.x = 1.5 + Math.sin(tt * (0.5 + k * 3)) * 2 * (k > 0 ? 1 : 0); runner.rotation.y = Math.cos(tt * (0.5 + k * 3)) > 0 ? 0 : Math.PI; }, replay() { tt = 0; } };
    },

    quake({ scene, params, result, camera, labels }) {
      scene.background = new THREE.Color(0x9fd3dc); box(scene, 0, -1.5, 0, 14, 0.2, 6, 0x8fa65c);
      const house = new THREE.Group(); house.add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.2), std(0xe8dcc0))); const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.8, 4), std(0xb86e46)); roof.position.y = 1.0; roof.rotation.y = Math.PI / 4; house.add(roof); house.position.set(4.5, -0.8, 0); scene.add(house);
      const epi = ball(scene, -5.5, -1.4, 0, 0.25, 0xd04030, { emissive: 0xd04030, emissiveIntensity: 0.6 });
      const scale = 10 / params.distance; // km -> scene units
      const ringP = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.16, 48), new THREE.MeshBasicMaterial({ color: 0x7fd1ff, side: THREE.DoubleSide })); ringP.rotation.x = -Math.PI / 2; ringP.position.set(-5.5, -1.38, 0); scene.add(ringP);
      const ringS = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.22, 48), new THREE.MeshBasicMaterial({ color: 0xf06a52, side: THREE.DoubleSide })); ringS.rotation.x = -Math.PI / 2; ringS.position.set(-5.5, -1.37, 0); scene.add(ringS);
      say(scene, labels, { en: `epicenter ${params.distance} km away · M${params.magnitude}`, ja: `しんげんまで ${params.distance} km · M${params.magnitude}` }, 0, 2.6, 0, 4);
      const clockL = say(scene, labels, '0.0 s', -5.5, 0.4, 0, 1.6); const status = say(scene, labels, '', 4.5, 1.4, 0, 2.6);
      camera.position.set(0, 4, 8); camera.lookAt(0, -0.5, 0);
      let tt = 0; const speedUp = result ? Math.max(1, result.sSeconds / 8) : 1;
      return { update(dt) { if (!result) return; tt += dt * speedUp; const rp = tt * 6 * scale; const rs = tt * 3.5 * scale; ringP.scale.setScalar(Math.max(0.01, rp)); ringS.scale.setScalar(Math.max(0.01, rs)); clockL.userData.set(`${Math.min(tt, result.sSeconds + 2).toFixed(1)} s`); if (tt >= result.sSeconds) { house.position.y = -0.8 + Math.sin(tt * 40) * 0.05 * result.shaking; status.userData.set(t({ en: 'S wave: shaking!', ja: 'S なみ：ゆれる！' })); } else if (tt >= result.pSeconds) status.userData.set(t({ en: `P wave arrived · ${(result.sSeconds - tt).toFixed(1)} s to go`, ja: `P なみ とうちゃく · あと ${(result.sSeconds - tt).toFixed(1)} びょう` })); else status.userData.set(t({ en: 'quiet', ja: 'しずか' })); }, replay() { tt = 0; house.position.y = -0.8; } };
    },

    tsunami({ scene, params, result, camera, labels }) {
      scene.background = new THREE.Color(0x9fd3dc);
      const depthU = Math.min(2.5, 0.5 + params.depth / 2000);
      box(scene, 2, -1.2 - depthU, 0, 8, 0.2, 4, 0x8a7a5c); box(scene, -3.5, -1.3, 0, 3, 0.6, 4, 0xd9c38a); box(scene, -5.3, -0.6, 0, 0.6, 1.4, 4, 0x9a9585);
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(9, 4, 60, 1), new THREE.MeshStandardMaterial({ color: 0x14305a, transparent: true, opacity: 0.8, side: THREE.DoubleSide })); sea.rotation.x = -Math.PI / 2; sea.position.set(2, -1.2, 0); scene.add(sea);
      say(scene, labels, { en: `depth ${params.depth} m · ${params.distance} km to the harbour`, ja: `ふかさ ${params.depth} m · みなとまで ${params.distance} km` }, 0, 2.4, 0, 4);
      const spd = say(scene, labels, '', 2, 1.2, 0, 2.4);
      camera.position.set(0, 1.5, 7.5); camera.lookAt(0, -0.8, 0);
      const pos = sea.geometry.attributes.position; let tt = 0;
      return { update(dt) { if (!result) return; tt += dt; const x0 = 6.5 - ((tt * 1.2) % 10); const amp = params.depth > 1000 ? 0.12 : 0.5; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); const dx = x - x0; pos.setZ(i, amp * Math.exp(-dx * dx * 2) * (x < -1 ? 2.2 : 1)); } pos.needsUpdate = true; spd.userData.set(`${result.speedKmh} km/h · ${result.minutes} min`); }, replay() { tt = 0; } };
    },

    cloud({ scene, params, result, camera, labels }) {
      scene.background = new THREE.Color(0x9fd3dc); box(scene, 0, -1.6, 0, 10, 0.2, 5, 0x8fa65c);
      for (let i = 0; i < 4; i++) box(scene, 3.5, -1.2 + i * 0.9, 0, 0.9 - i * 0.15, 0.9, 0.9 - i * 0.15, i % 2 ? 0x8d9aa0 : 0x9aa0aa);
      const parcel = ball(scene, -1.5, -1.2, 0, 0.5, 0xffd36b, { transparent: true, opacity: 0.6 });
      const cloudG = new THREE.Group(); for (const [x, y, r] of [[0, 0, 0.5], [0.5, 0.1, 0.4], [-0.5, 0.05, 0.4], [0.2, 0.35, 0.35]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), std(0xffffff)); b.position.set(x, y, 0); cloudG.add(b); } cloudG.visible = false; scene.add(cloudG);
      say(scene, labels, { en: `${params.tempC}°C · ${params.humidity}% humidity`, ja: `${params.tempC}°C · しつど ${params.humidity}%` }, 0, 3.2, 0, 3.4);
      const hL = say(scene, labels, '0 m', -3.5, 1.2, 0, 1.6);
      camera.position.set(0, 1.5, 7.5); camera.lookAt(0, 0.6, 0);
      const top = result ? Math.min(2.4, result.cloudBase / 1000) : 2.4; let tt = 0;
      return { update(dt) { if (!result) return; tt = Math.min(5, tt + dt); const f = tt / 5; const y = -1.2 + top * f * 1.6; parcel.position.y = y; parcel.material.color.set(new THREE.Color(0xffd36b).lerp(new THREE.Color(0x7fd1ff), f)); hL.userData.set(`${Math.round(result.cloudBase * f)} m · ${(params.tempC - (params.tempC - result.dewPoint) * f).toFixed(1)}°C`); if (f >= 1 && result.forms === 'cloud') { cloudG.visible = true; cloudG.position.set(-1.5, y + 0.2, 0); parcel.visible = false; } }, replay() { tt = 0; cloudG.visible = false; parcel.visible = true; } };
    },

    bridge({ scene, params, result, camera, labels }) {
      scene.background = new THREE.Color(0x9fd3dc); box(scene, 0, -1.8, 0, 12, 0.2, 5, 0x6aa35a);
      const L = params.span * 1.1; for (const sx of [-1, 1]) box(scene, sx * (L / 2 + 0.4), -1.1, 0, 0.8, 1.4, 1.6, 0x9a9585);
      const geo = new THREE.BoxGeometry(L, Math.max(0.06, params.thickness * 0.03), 1.2, 24, 1, 1); const plank = new THREE.Mesh(geo, std({ wood: 0xa58c62, steel: 0x8d9aa0, plastic: 0x7fd1ff }[params.material])); plank.position.y = -0.3; scene.add(plank);
      const base = geo.attributes.position.array.slice();
      const load = box(scene, 0, 0.1 + params.load * 0.001, 0, 0.5 + params.load * 0.002, 0.5 + params.load * 0.002, 0.5 + params.load * 0.002, 0xd04030);
      say(scene, labels, { en: `${params.span} m · ${maker.MATERIALS[params.material].en} · ${params.thickness} cm · ${params.load} kg`, ja: `${params.span} m · ${maker.MATERIALS[params.material].ja} · ${params.thickness} cm · ${params.load} kg` }, 0, 1.9, 0, 4.4);
      const sagL = say(scene, labels, '', 0, -1.2, 1.2, 2.4);
      camera.position.set(0, 1.4, 7.5); camera.lookAt(0, -0.2, 0);
      let tt = 0; const sag = result ? Math.min(1.2, result.sagMm / 60) : 0;
      return { update(dt) { if (!result) return; tt = Math.min(2, tt + dt); const f = tt / 2; const pos = geo.attributes.position; for (let i = 0; i < pos.count; i++) { const x = base[i * 3]; const u = (2 * x) / L; pos.setY(i, base[i * 3 + 1] - sag * f * (1 - u * u)); } pos.needsUpdate = true; load.position.y = 0.1 + params.load * 0.001 - sag * f; sagL.userData.set(`${result.sagMm} mm · ${result.holds}`); if (result.holds === 'breaks' && f >= 1) { plank.rotation.z = Math.sin(tt * 3) * 0.02; plank.position.y = -0.3 - (tt - 2) * 0; load.position.y -= dt * 2; if (load.position.y < -1.3) load.position.y = -1.3; } }, replay() { tt = 0; load.position.y = 0.1 + params.load * 0.001; } };
    },

    circuit({ scene, params, result, camera, labels }) {
      scene.background = new THREE.Color(0x1a2a3a); floor(scene, 0xa58c62, 9, 5);
      box(scene, -2.5, -0.9, 0, 1.2, 1.2, 0.8, 0x334455); box(scene, -2.5, -0.2, 0, 0.3, 0.2, 0.3, 0xd4c49b);
      const wire = new THREE.Line(new THREE.BufferGeometry().setFromPoints([[-2.5, -0.1, 0], [-2.5, 1.2, 0], [2.5, 1.2, 0], [2.5, -1.3, 0], [-2.5, -1.3, 0], [-2.5, -0.1, 0]].map((p) => new THREE.Vector3(...p))), new THREE.LineBasicMaterial({ color: 0xd04030 })); scene.add(wire);
      const res = box(scene, 0, 1.2, 0, 1.2, 0.3, 0.3, 0xe4c239); for (let i = 0; i < 4; i++) box(scene, -0.4 + i * 0.26, 1.2, 0, 0.08, 0.32, 0.32, [0x8d6b44, 0x1c2a3a, 0xd04030, 0xd4c49b][i]);
      const bulbs = []; for (let i = 0; i < params.bulbs; i++) { const b = ball(scene, 2.5, 0.6 - i * 0.9, 0, 0.3, 0xffe6ad, { emissive: 0xffb300, emissiveIntensity: 0 }); bulbs.push(b); }
      const electrons = []; for (let i = 0; i < 12; i++) electrons.push(ball(scene, 0, 0, 0, 0.06, 0x7fd1ff, { emissive: 0x7fd1ff, emissiveIntensity: 1 }));
      say(scene, labels, { en: `${params.volts} V · ${params.resistance} Ω · ${params.bulbs} bulb${params.bulbs > 1 ? 's' : ''}`, ja: `${params.volts} V · ${params.resistance} Ω · でんきゅう ${params.bulbs}` }, 0, 2.4, 0, 3.2);
      const mA = say(scene, labels, '', 0, -0.4, 0.6, 2);
      camera.position.set(0, 0.8, 6.5); camera.lookAt(0, 0, 0);
      const path = [[-2.5, -0.1], [-2.5, 1.2], [2.5, 1.2], [2.5, -1.3], [-2.5, -1.3]]; const segLen = [1.3, 5, 2.5, 5, 1.2]; const total = segLen.reduce((a, b) => a + b, 0);
      const at = (s) => { let d = ((s % total) + total) % total; for (let i = 0; i < path.length; i++) { const a = path[i]; const b = path[(i + 1) % path.length]; if (d <= segLen[i]) { const f = d / segLen[i]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; } d -= segLen[i]; } return path[0]; };
      let tt = 0;
      return { update(dt) { const speed = result ? Math.min(6, result.mA / 15) : 0.3; tt += dt * speed; electrons.forEach((e, i) => { const [x, y] = at(tt + (i * total) / 12); e.position.set(x, y, 0.2); }); const glow = result ? { off: 0, dim: 0.6, bright: 1.6, blown: 0 }[result.brightness] : 0; for (const b of bulbs) { b.material.emissiveIntensity = glow; b.material.color.set(result?.brightness === 'blown' ? 0x555 : 0xffe6ad); } if (result) mA.userData.set(`${result.mA} mA · ${result.brightness}`); }, replay() { tt = 0; } };
    },

    gears({ scene, params, result, camera, labels }) {
      scene.background = new THREE.Color(0x1a2a3a);
      const mk = (teeth, color) => { const g = new THREE.Group(); const r = 0.12 + teeth * 0.045; g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.3, 32), std(color))); for (let i = 0; i < teeth; i++) { const a = (i / teeth) * Math.PI * 2; const tth = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.16), std(color)); tth.position.set(Math.cos(a) * (r + 0.06), 0, Math.sin(a) * (r + 0.06)); tth.rotation.y = -a; g.add(tth); } g.rotation.x = Math.PI / 2; g.userData.r = r; return g; };
      const a = mk(params.driverTeeth, 0xb08655); const b = mk(params.drivenTeeth, 0xd4c49b); a.position.x = -(a.userData.r + 0.1); b.position.x = b.userData.r + 0.1; scene.add(a); scene.add(b);
      say(scene, labels, `${params.driverTeeth} → ${params.drivenTeeth} ${t({ en: 'teeth', ja: 'は' })} · ${params.rpm} rpm`, 0, 2.4, 0, 3);
      const outL = say(scene, labels, '', b.position.x, -2.0, 0, 2);
      camera.position.set(0, 0.6, 6.5); camera.lookAt(0, 0, 0);
      const outRpm = result ? result.outRpm : (params.rpm * params.driverTeeth) / params.drivenTeeth;
      return { update(dt) { a.rotation.y += (params.rpm / 60) * Math.PI * 2 * dt * 0.25; b.rotation.y -= (outRpm / 60) * Math.PI * 2 * dt * 0.25; if (result) outL.userData.set(`${result.outRpm} rpm · ${result.direction}`); }, replay() {} };
    },

    dice({ scene, params, result, camera, labels }) {
      scene.background = new THREE.Color(0x1a2a3a); floor(scene, 0x3f7a52, 10, 6);
      const dice = []; for (let i = 0; i < params.count; i++) { const d = box(scene, -3 + i * 1.1, -0.9, 1.4, 0.7, 0.7, 0.7, 0xf4f1ea); dice.push(d); }
      say(scene, labels, { en: `${params.count} dice × ${params.rolls} rolls`, ja: `サイコロ ${params.count} × ${params.rolls} かい` }, 0, 2.6, 0, 3);
      camera.position.set(0, 2.5, 7); camera.lookAt(0, 0, 0);
      const bars = []; let tt = 0;
      if (result?.hist) { const max = Math.max(...result.hist.map(([, v]) => v)); const n = result.hist.length; result.hist.forEach(([k, v], i) => { const x = -3.5 + (i / Math.max(1, n - 1)) * 7; const b = box(scene, x, -1.39, -1, Math.min(0.7, 6 / n), 0.01, 0.6, k === result.mode ? 0xf2b134 : 0x7fd1ff); b.userData.h = (v / max) * 2.4; bars.push(b); const l = labelSprite(String(k), { width: 0.6, background: null }); l.position.set(x, -1.6, -0.5); scene.add(l); }); }
      const mL = say(scene, labels, '', 3.2, 1.6, 0, 2.2);
      return { update(dt) { tt += dt; for (const d of dice) { d.rotation.x += dt * 4 * (tt < 2 ? 1 : 0); d.rotation.z += dt * 3 * (tt < 2 ? 1 : 0); } const f = Math.min(1, Math.max(0, (tt - 1.5) / 2.5)); for (const b of bars) { b.scale.y = Math.max(0.01, b.userData.h * f) / 0.01; b.position.y = -1.39 + (b.userData.h * f) / 2; } if (result && f > 0) mL.userData.set(`${t({ en: 'most common', ja: 'いちばん おおい' })}: ${result.mode} · ${t({ en: 'mean', ja: 'へいきん' })} ${result.mean}`); }, replay() { tt = 0; } };
    },

    pond({ scene, params, result, camera, labels }) {
      scene.background = new THREE.Color(0x9fd3dc); box(scene, 0, -1.6, 0, 11, 0.2, 7, 0x8fa65c);
      const water = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.3, 40), std(0x4b8090, { transparent: true, opacity: 0.85 })); water.position.y = -1.35; scene.add(water);
      const fish = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.1, 0.16), std(0xf2b134), 300); const marked = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.1, 0.16), std(0xd04030), 300); scene.add(fish); scene.add(marked);
      const seats = []; for (let i = 0; i < 300; i++) { const r = Math.sqrt(Math.random()) * 3.6; const a = Math.random() * Math.PI * 2; seats.push([Math.cos(a) * r, Math.sin(a) * r, Math.random() * 6]); }
      const dummy = new THREE.Object3D();
      const show = (n, m, time) => { for (let i = 0; i < 300; i++) { const s = seats[i]; const vis = i < n; dummy.position.set(vis ? s[0] + Math.sin(time + s[2]) * 0.2 : 0, vis ? -1.25 : -99, vis ? s[1] : 0); dummy.rotation.set(0, s[2], 0); dummy.updateMatrix(); (i < m ? marked : fish).setMatrixAt(i, dummy.matrix); (i < m ? fish : marked).setMatrixAt(i, new THREE.Matrix4().makeTranslation(0, -99, 0)); } fish.instanceMatrix.needsUpdate = true; marked.instanceMatrix.needsUpdate = true; };
      say(scene, labels, { en: `mark ${params.marked} · catch ${params.caught} again`, ja: `${params.marked} ひきに しるし · ${params.caught} ひき また つかまえる` }, 0, 2.6, 0, 3.6);
      const countL = say(scene, labels, result ? '' : '?', 0, 1.6, 0, 3.2);
      camera.position.set(0, 4.5, 7.5); camera.lookAt(0, -0.8, 0);
      let tt = 0;
      return { update(dt) { tt += dt; const n = result ? Math.min(300, result.truth) : 80; show(n, Math.min(n, params.marked), tt); if (result) countL.userData.set(`${result.recaptured} ${t({ en: 'marked in the catch', ja: 'ひき しるしつき' })} → ${t({ en: 'estimate', ja: 'みつもり' })} ${result.estimate ?? '?'} · ${t({ en: 'truth', ja: 'ほんとう' })} ${result.truth}`); }, replay() { tt = 0; } };
    },

    classify({ scene, params, result, camera, labels }) {
      scene.background = new THREE.Color(0x1a2a3a);
      const g = graph({ w: 5, h: 3, xLabel: { en: 'weight (g)', ja: 'おもさ（g）' }, yLabel: { en: 'colour: green → orange', ja: 'いろ：みどり → オレンジ' } }); scene.add(g); labels.push(g.children[2], g.children[3]);
      const X = (w) => -2.5 + ((w - 80) / 200) * 5; const Y = (c) => -1.5 + c * 3;
      if (result?.train) for (const p of result.train) { const m = ball(scene, X(p.w), Y(p.c), 0.1, 0.07, p.label === 'apple' ? 0xd9433a : 0xf2a034); m.position.z = 0.1; }
      const me = ball(scene, X(params.weight), Y(params.color), 0.15, 0.12, 0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.4 });
      if (result?.near) for (const p of result.near) { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(X(params.weight), Y(params.color), 0.12), new THREE.Vector3(X(p.w), Y(p.c), 0.12)]), new THREE.LineBasicMaterial({ color: 0x7fd1ff })); scene.add(l); }
      say(scene, labels, { en: `${params.weight} g · colour ${params.color} · k = ${params.k}`, ja: `${params.weight} g · いろ ${params.color} · k = ${params.k}` }, 0, 2.2, 0, 3.4);
      const verdict = say(scene, labels, '', 0, -2.3, 0.2, 3.2);
      camera.position.set(0, 0.2, 6.2); camera.lookAt(0, 0, 0);
      let tt = 0;
      return { update(dt) { tt += dt; me.scale.setScalar(1 + Math.sin(tt * 3) * 0.15); if (result) verdict.userData.set(`${result.label} · ${result.confidence}% ${t({ en: 'sure', ja: 'たしか' })}`); }, replay() { tt = 0; } };
    },
  };
}
