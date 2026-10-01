// The 3D stages for the chemistry shelf (LAB 小3〜小6, ATOMS 中1〜中3). Same contract as
// the other builders: { update(dt), replay(), lookAt? }, drawing only what the room decided.

import * as THREE from './vendor/three.module.js';
import { t } from './i18n.js';
import * as chem2 from '/shared/sim/chem2.js';

export function chemBuilders({ labelSprite, graph, look }) {
  const { mat, metalMat, plasticMat, glass, glassMat, glow, THEMES, ground, slab, woodMat, stoneMat, emitter, roundedBox, tube } = look;
  const add = (scene, mesh, x = 0, y = 0, z = 0) => { mesh.position.set(x, y, z); scene.add(mesh); return mesh; };
  const box = (scene, x, y, z, w, h, d, color, extra) => add(scene, new THREE.Mesh(roundedBox(w, h, d, Math.min(0.05, w / 4, h / 4, d / 4)), typeof color === 'number' ? mat(color, extra) : color), x, y, z);
  const ball = (scene, x, y, z, r, color, extra) => add(scene, new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), typeof color === 'number' ? mat(color, extra) : color), x, y, z);
  const say = (scene, labels, pair, x, y, z, w = 3, opts = {}) => { const s = labelSprite(pair, { width: w, ...opts }); s.position.set(x, y, z); scene.add(s); labels.push(s); return s; };
  const lab = (scene, { floorColor = 0x33424f, benchMat = woodMat(0xa58c62), w = 8, d = 4 } = {}) => { THEMES.lab(scene); ground(scene, { color: floorColor, r: 10, y: -1.75, grid: true }); slab(scene, { y: -1.6, w, d, material: benchMat }); };
  const beaker = (scene, x, r = 0.6, h = 1.4, liquid = 0x7fd1ff, fill = 0.6, y0 = -1.48) => { const g = glass(new THREE.CylinderGeometry(r, r * 0.95, h, 40, 1, true)); g.position.set(x, y0 + h / 2, 0); scene.add(g); const base = glass(new THREE.CircleGeometry(r * 0.95, 40)); base.rotation.x = -Math.PI / 2; base.position.set(x, y0 + 0.01, 0); scene.add(base); const lq = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.93, r * 0.9, h * fill, 40), new THREE.MeshPhysicalMaterial({ color: liquid, transparent: true, opacity: 0.5, roughness: 0.05, clearcoat: 1 })); lq.position.set(x, y0 + (h * fill) / 2, 0); scene.add(lq); return lq; };
  const MATCOL = { foam: 0xf4f1ea, wood: 0xa58c62, ice: 0xdff6ff, plastic: 0x7fd1ff, rubber: 0x2c3540, glass: 0xcfe8f0, aluminium: 0xc9d0d6, iron: 0x6d7a84, copper: 0xb87333 };
  const matFor = (m) => m === 'glass' ? glassMat(0xdff6ff, 0.5) : m === 'ice' ? glassMat(0xdff6ff, 0.6) : ['aluminium', 'iron', 'copper'].includes(m) ? metalMat(MATCOL[m]) : m === 'wood' ? woodMat(0xa58c62) : plasticMat(MATCOL[m]);

  return {
    // 小3 物と重さ: a balance, a lump that changes shape, a pointer that reads the grams.
    massShape({ scene, params, result, camera, labels }) {
      lab(scene);
      const post = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.6, 12), metalMat(0x8d9aa0)), 0, -0.7, 0); void post;
      const beam = add(scene, new THREE.Mesh(roundedBox(4.2, 0.1, 0.25, 0.03), metalMat(0xb8c0c8)), 0, 0.1, 0);
      const pans = [-1.8, 1.8].map((x) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.7, 0.1, 32), metalMat(0xd4c49b)); p.position.set(x, -0.5, 0); scene.add(p); const wire = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6, 6), metalMat(0x333333)), x, -0.2, 0); return { p, wire }; });
      const s = Math.cbrt(params.volume / 50) * 0.5;
      const lump = params.shape === 'ball' ? ball(scene, -1.8, -0.45 + s, 0, s, matFor(params.material)) : params.shape === 'flat' ? box(scene, -1.8, -0.4, 0, s * 2.2, s * 0.5, s * 2.2, matFor(params.material)) : (() => { const g = new THREE.Group(); for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(s * 0.5, 12, 10), matFor(params.material)); m.position.set(Math.cos(i * 1.3) * s * 0.9, s * 0.5, Math.sin(i * 1.3) * s * 0.9); g.add(m); } g.position.set(-1.8, -0.45, 0); scene.add(g); return g; })();
      void lump;
      const weights = []; const grams = result ? result.grams : 0;
      say(scene, labels, { en: `${chem2.MATERIALS[params.material].en} · ${params.volume} cm³ · ${chem2.SHAPES[params.shape].en}`, ja: `${chem2.MATERIALS[params.material].ja} · ${params.volume} cm³ · ${chem2.SHAPES[params.shape].ja}` }, 0, 2.2, 0, 4.2, { accent: '#7fd1ff' });
      const readout = say(scene, labels, '— g', 0, 1.3, 0, 1.6, { size: 38 });
      camera.position.set(0.3, 1.0, 6.4); camera.lookAt(0, -0.2, 0);
      let tt = 0;
      return {
        update(dt) {
          tt += dt; if (!result) return;
          const f = Math.min(1, tt / 2.5); const shown = Math.round(grams * f);
          while (weights.length < Math.min(8, Math.ceil(grams / 50)) && weights.length < Math.ceil(shown / 50)) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16), metalMat(0xb87333)); w.position.set(1.8 + Math.cos(weights.length) * 0.35, -0.42 + weights.length * 0.13, Math.sin(weights.length) * 0.35); scene.add(w); weights.push(w); }
          beam.rotation.z = -0.15 * (1 - f) * (grams > 0 ? 1 : 0); pans.forEach(({ p, wire }, i) => { const x = i ? 1.8 : -1.8; const y = -0.5 + Math.sin(beam.rotation.z) * x; p.position.y = y; wire.position.y = y + 0.3; });
          readout.userData.set(`${shown} g`);
        },
        replay() { tt = 0; for (const w of weights) scene.remove(w); weights.length = 0; },
        lookAt: [0, -0.2, 0],
      };
    },

    // 小4 とじこめた空気と水: a syringe you push; air squashes, water refuses.
    compress({ scene, params, result, camera, labels }) {
      lab(scene);
      const barrel = glass(new THREE.CylinderGeometry(0.45, 0.45, 2.6, 40, 1, true)); barrel.position.set(0, -0.2, 0); scene.add(barrel);
      const bottom = glass(new THREE.CircleGeometry(0.45, 40)); bottom.rotation.x = Math.PI / 2; bottom.position.set(0, -1.5, 0); scene.add(bottom);
      const content = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 1, 40), params.fluid === 'water' ? new THREE.MeshPhysicalMaterial({ color: 0x7fd1ff, transparent: true, opacity: 0.55, roughness: 0.05, clearcoat: 1 }) : new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 })); scene.add(content);
      const plunger = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 40), plasticMat(0x1c2a3a)), 0, 0.5, 0);
      const rod = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 12), metalMat(0xb8c0c8)), 0, 1.3, 0);
      const thumb = add(scene, new THREE.Mesh(roundedBox(1.2, 0.18, 0.5, 0.05), plasticMat(0xd04030)), 0, 2.1, 0);
      const hand = add(scene, new THREE.Mesh(roundedBox(0.9, 0.5, 0.6, 0.15), mat(0xe8c39a, { rough: 0.8 })), 0, 2.5, 0); hand.visible = params.push > 0;
      for (let i = 0; i <= 5; i++) { const tick = labelSprite(`${i * 10}`, { width: 0.6, background: null, size: 22 }); tick.position.set(0.75, -1.45 + i * 0.5, 0); scene.add(tick); }
      const motes = params.fluid === 'air' ? emitter(scene, { n: 30, color: 0xcfe8ff, size: 0.06, rate: 10, life: 2, origin: [0, -1.2, 0], spread: 0.5, vel: [0, 0.4, 0] }) : null;
      say(scene, labels, { en: `${params.fluid === 'air' ? 'Air' : 'Water'} · push ${params.push}`, ja: `${params.fluid === 'air' ? 'くうき' : 'みず'} · おす つよさ ${params.push}` }, 0, 3.0, 0, 3, { accent: '#7fd1ff' });
      const vol = say(scene, labels, '50 mL', -2.2, 0.4, 0, 1.6, { size: 36 });
      camera.position.set(0.2, 0.8, 6.2); camera.lookAt(0, 0.2, 0);
      const h0 = 2.5; let tt = 0;
      const setFill = (ml) => { const h = (ml / 50) * h0; content.scale.y = h; content.position.y = -1.5 + h / 2; plunger.position.y = -1.5 + h + 0.07; rod.position.y = plunger.position.y + 0.85; thumb.position.y = rod.position.y + 0.85; hand.position.y = thumb.position.y + 0.4; };
      setFill(50);
      return {
        update(dt) { tt += dt; if (!result) return; const f = Math.min(1, tt / 2); const ml = 50 + (result.volume - 50) * f; setFill(ml); vol.userData.set(`${ml.toFixed(1)} mL`); if (motes) motes.userData.state.rate = 10 + (50 - ml) * 2; if (params.fluid === 'air' && f >= 1) { hand.position.y += Math.sin(tt * 3) * 0.01; } },
        replay() { tt = 0; setFill(50); },
        lookAt: [0, 0.2, 0],
      };
    },

    // 小4 体積と温度: a flask over a burner, a thin tube with a bead of coloured water that climbs.
    expansion({ scene, params, result, camera, labels }) {
      lab(scene, { benchMat: stoneMat(0x5a6670) });
      const burner = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.5, 24), metalMat(0x334455)), 0, -1.25, 0); void burner;
      const flame = glow(0x7fd1ff, 1.2, 0.8); flame.position.set(0, -0.8, 0); scene.add(flame); const flame2 = glow(0xffa449, 0.6, 0.9); flame2.position.set(0, -0.7, 0); scene.add(flame2);
      const flask = glass(new THREE.SphereGeometry(0.75, 32, 24)); flask.position.set(0, 0.2, 0); scene.add(flask);
      const neck = glass(new THREE.CylinderGeometry(0.25, 0.25, 0.8, 24, 1, true)); neck.position.set(0, 1.1, 0); scene.add(neck);
      const fill = params.substance === 'metal' ? new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 18), metalMat(0x8d9aa0)) : params.substance === 'water' ? new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 18), new THREE.MeshPhysicalMaterial({ color: 0x7fd1ff, transparent: true, opacity: 0.5, roughness: 0.05 })) : null;
      if (fill) { fill.position.set(0, 0.2, 0); scene.add(fill); }
      const tubeG = glass(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 16, 1, true)); tubeG.position.set(0, 2.5, 0); scene.add(tubeG);
      const bead = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.25, 12), plasticMat(0xd04030)), 0, 1.4, 0);
      for (let i = 0; i <= 4; i++) { const tk = labelSprite(`${i * 3} mL`, { width: 0.9, background: null, size: 22 }); tk.position.set(0.6, 1.4 + i * 0.55, 0); scene.add(tk); }
      say(scene, labels, { en: `${chem2.EXPAND[params.substance].en} · +${params.deltaT}°C`, ja: `${chem2.EXPAND[params.substance].ja} · +${params.deltaT}°C` }, 0, 4.0, 0, 3, { accent: '#ff7528' });
      const readout = say(scene, labels, '0 mL', -2.4, 2.4, 0, 1.6, { size: 36 });
      camera.position.set(0.3, 1.6, 7.2); camera.lookAt(0, 1.2, 0);
      let tt = 0;
      return {
        update(dt) { tt += dt; flame.material.opacity = 0.6 + Math.sin(tt * 20) * 0.15; flame2.scale.setScalar(0.6 + Math.sin(tt * 17) * 0.1); if (!result) return; const f = Math.min(1, tt / 3); const ml = result.deltaMl * f; bead.position.y = 1.4 + Math.min(2.3, (ml / 12) * 2.2); readout.userData.set(`${ml.toFixed(2)} mL`); if (fill && params.substance === 'metal') fill.scale.setScalar(1 + f * 0.02); },
        replay() { tt = 0; },
        lookAt: [0, 1.2, 0],
      };
    },

    // 小4 水のすがた: a beaker of ice over a burner, a thermometer, a clock; the curve on a board.
    heating({ scene, params, result, camera, labels }) {
      lab(scene, { benchMat: stoneMat(0x5a6670) });
      add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.4, 24), metalMat(0x334455)), -1.4, -1.3, 0);
      const flame = glow(0x7fd1ff, 1.4, 0.8); flame.position.set(-1.4, -0.85, 0); scene.add(flame);
      const lq = beaker(scene, -1.4, 0.7, 1.6, 0x9fd3ff, 0.6, -1.05);
      const ice = []; for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(roundedBox(0.25, 0.25, 0.25, 0.05), glassMat(0xffffff, 0.75)); c.position.set(-1.4 + Math.cos(i * 1.1) * 0.35, -0.6 + (i % 2) * 0.2, Math.sin(i * 1.1) * 0.35); scene.add(c); ice.push(c); }
      const steam = emitter(scene, { n: 40, color: 0xffffff, size: 0.2, rate: 0, life: 1.8, origin: [-1.4, 0.6, 0], spread: 0.3, vel: [0, 0.8, 0], additive: false });
      const bubbles = emitter(scene, { n: 30, color: 0xffffff, size: 0.06, rate: 0, life: 0.8, origin: [-1.4, -1.0, 0], spread: 0.5, vel: [0, 1.2, 0] });
      const thermo = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 12), glassMat(0xffffff, 0.5)), -0.6, 0.1, 0.3); void thermo;
      const mercury = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 8), plasticMat(0xd04030)), -0.6, -0.5, 0.3);
      const g = graph({ w: 3.4, h: 2.0, xLabel: { en: 'minutes', ja: 'ふん' }, yLabel: { en: 'temperature °C', ja: 'おんど °C' }, tone: 0xff7528 }); g.position.set(2.2, 0.4, -0.4); scene.add(g); labels.push(...g.userData.labels);
      const pts = []; for (let m = 0; m <= 30; m += 0.25) pts.push([m, chem2.heating({ minutes: m, power: Number(params.power) }).tempC]);
      const line = g.userData.plot(pts, { color: 0xff7528, xr: [0, 30], yr: [-10, 110] }); line.geometry.setDrawRange(0, 0);
      say(scene, labels, { en: `${params.minutes} min on the ${{ 250: 'low', 500: 'medium', 1000: 'high' }[params.power]} burner`, ja: `${params.minutes} ぷん · コンロ ${{ 250: 'よわい', 500: 'ふつう', 1000: 'つよい' }[params.power]}` }, 0, 2.6, 0, 3.6, { accent: '#ff7528' });
      const tempL = say(scene, labels, '-10°C', -1.4, 1.9, 0, 1.6, { size: 38 }); const clockL = say(scene, labels, '0:00', -3.2, 1.0, 0, 1.3);
      camera.position.set(0.4, 1.2, 6.8); camera.lookAt(0.3, -0.1, 0);
      let tt = 0; const dur = Math.max(2, Math.min(8, params.minutes * 0.4));
      return {
        update(dt) {
          tt += dt; flame.material.opacity = 0.6 + Math.sin(tt * 20) * 0.15; if (!result) return;
          const f = Math.min(1, tt / dur); const minutes = params.minutes * f; const now = chem2.heating({ minutes, power: Number(params.power) });
          tempL.userData.set(`${now.tempC.toFixed(0)}°C`); clockL.userData.set(`${Math.floor(minutes)}:${String(Math.floor((minutes % 1) * 60)).padStart(2, '0')}`);
          mercury.scale.y = 0.2 + ((now.tempC + 10) / 120) * 1.6; mercury.position.y = -1.0 + mercury.scale.y / 2;
          const melt = now.state === 'ice' ? 1 : now.state === 'melting' ? 1 - (minutes - 0) / Math.max(0.1, now.meltEndMin) : 0; ice.forEach((c, i) => { c.visible = melt > i / 6; c.scale.setScalar(Math.max(0.2, Math.min(1, melt * 1.2))); });
          bubbles.userData.state.on = now.state === 'boiling'; bubbles.userData.state.rate = 20; steam.userData.state.on = now.state === 'boiling' || now.state === 'steam'; steam.userData.state.rate = 8;
          lq.material.color.set(now.tempC > 50 ? 0xbfe6ff : 0x9fd3ff); lq.scale.y = now.state === 'steam' ? 0.2 : 1;
          line.geometry.setDrawRange(0, Math.floor((minutes / 30) * pts.length));
        },
        replay() { tt = 0; },
        lookAt: [0.3, -0.1, 0],
      };
    },

    // 小6 金属と水溶液: a strip of metal in a test tube; bubbles if it reacts.
    metalAcid({ scene, params, result, camera, labels }) {
      lab(scene);
      const rack = add(scene, new THREE.Mesh(roundedBox(2.6, 0.5, 1.0, 0.06), woodMat(0x7b6647)), 0, -1.3, 0); void rack;
      const tubeG = glass(new THREE.CylinderGeometry(0.34, 0.34, 2.2, 32, 1, true)); tubeG.position.set(0, 0.1, 0); scene.add(tubeG);
      const bottom = glass(new THREE.SphereGeometry(0.34, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)); bottom.position.set(0, -1.0, 0); scene.add(bottom);
      const liqColor = params.solution === 'naoh' ? 0xdfe8ff : params.solution === 'hcl' ? 0xf4f8ff : 0xbfe6ff;
      const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.3, 32), new THREE.MeshPhysicalMaterial({ color: liqColor, transparent: true, opacity: 0.55, roughness: 0.05, clearcoat: 1 })); liquid.position.set(0, -0.35, 0); scene.add(liquid);
      const metalCol = { magnesium: 0xd8dde3, aluminium: 0xc9d0d6, zinc: 0xa8b0b8, iron: 0x6d7a84, copper: 0xb87333 }[params.metal];
      const strip = add(scene, new THREE.Mesh(roundedBox(0.16, 1.1, 0.06, 0.02), metalMat(metalCol)), 0.05, -0.45, 0.05); strip.rotation.z = 0.12;
      const bubbles = emitter(scene, { n: 60, color: 0xffffff, size: 0.05, rate: 0, life: 1.1, origin: [0.05, -0.9, 0], spread: 0.25, vel: [0, 1.0, 0] });
      const popGlow = glow(0xffd36b, 0.8, 0); popGlow.position.set(0, 1.4, 0); scene.add(popGlow);
      const match = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8), woodMat(0xa58c62)), 0.6, 1.5, 0.2); match.rotation.z = 0.6; const matchFlame = glow(0xffa449, 0.35, 0.9); matchFlame.position.set(0.95, 1.75, 0.2); scene.add(matchFlame);
      say(scene, labels, { en: `${chem2.METALS[params.metal].en} in ${chem2.SOLUTIONS[params.solution].en}`, ja: `${chem2.METALS[params.metal].ja} を ${chem2.SOLUTIONS[params.solution].ja} に` }, 0, 2.6, 0, 4, { accent: '#7fd1ff' });
      const status = say(scene, labels, '', 0, -2.1, 0.8, 2.6);
      camera.position.set(0.2, 0.7, 5.6); camera.lookAt(0, -0.2, 0);
      let tt = 0;
      return {
        update(dt) {
          tt += dt; matchFlame.scale.setScalar(0.35 + Math.sin(tt * 15) * 0.05); if (!result) return;
          const on = result.bubbleRate > 0 && tt > 0.8; bubbles.userData.state.on = on; bubbles.userData.state.rate = result.bubbleRate * 4;
          if (on) { strip.scale.y = Math.max(0.3, 1 - (tt - 0.8) * 0.02 * result.bubbleRate); strip.position.y = -0.45 - (1 - strip.scale.y) * 0.5; }
          if (tt > 4 && result.gas === 'hydrogen') { popGlow.material.opacity = Math.max(0, 1 - (tt - 4) * 1.5) * 0.9; popGlow.scale.setScalar(0.8 + (tt - 4) * 2); }
          status.userData.set(t(result.bubbles === 'yes' ? { en: `bubbles of hydrogen · ${result.rate}`, ja: `すいその あわ · ${result.rate}` } : { en: 'nothing happens', ja: 'なにも おきない' }));
        },
        replay() { tt = 0; strip.scale.y = 1; strip.position.y = -0.45; popGlow.material.opacity = 0; popGlow.scale.setScalar(0.8); },
        lookAt: [0, -0.2, 0],
      };
    },

    // 中1 密度: weigh the block, dunk it in the measuring cylinder, drop it in the tank.
    density({ scene, params, result, camera, labels }) {
      lab(scene);
      const s = Math.cbrt(params.volume / 50) * 0.5;
      const block = box(scene, -2.2, -1.45 + s / 2, 0, s, s, s, matFor(params.material));
      const scaleBody = add(scene, new THREE.Mesh(roundedBox(1.4, 0.3, 1.2, 0.08), metalMat(0x334455)), -2.2, -1.6, 0); void scaleBody;
      const display = say(scene, labels, '0 g', -2.2, 0.0 + s, 0.7, 1.4, { size: 34 });
      const cyl = glass(new THREE.CylinderGeometry(0.45, 0.45, 2.2, 32, 1, true)); cyl.position.set(0, -0.4, 0); scene.add(cyl);
      const water = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 1, 32), new THREE.MeshPhysicalMaterial({ color: 0x7fd1ff, transparent: true, opacity: 0.5, roughness: 0.05, clearcoat: 1 })); water.position.set(0, -1.0, 0); scene.add(water);
      for (let i = 0; i <= 4; i++) { const tk = labelSprite(`${50 + i * 25}`, { width: 0.6, background: null, size: 20 }); tk.position.set(0.7, -1.0 + i * 0.45, 0); scene.add(tk); }
      const tank = glass(new THREE.BoxGeometry(2.2, 1.8, 1.4)); tank.position.set(2.4, -0.6, 0); scene.add(tank);
      const tankWater = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.3, 1.3), new THREE.MeshPhysicalMaterial({ color: 0x7fd1ff, transparent: true, opacity: 0.45, roughness: 0.05 })); tankWater.position.set(2.4, -0.8, 0); scene.add(tankWater);
      const block2 = box(scene, 2.4, 1.2, 0, s, s, s, matFor(params.material));
      say(scene, labels, { en: `${chem2.MATERIALS[params.material].en} · ${params.volume} cm³`, ja: `${chem2.MATERIALS[params.material].ja} · ${params.volume} cm³` }, 0, 2.4, 0, 3, { accent: '#7fd1ff' });
      const verdict = say(scene, labels, '', 2.4, 0.9, 0, 2.2);
      camera.position.set(0.3, 1.0, 6.8); camera.lookAt(0.2, -0.3, 0);
      let tt = 0; const d = chem2.MATERIALS[params.material].density;
      return {
        update(dt) {
          tt += dt; if (!result) return; const f = Math.min(1, tt / 2);
          display.userData.set(`${(result.grams * f).toFixed(1)} g`);
          const rise = (params.volume / 100) * 0.45 * f; water.scale.y = 1 + rise; water.position.y = -1.0 + (water.scale.y - 1) / 2;
          const floatY = d < 1 ? -0.15 + s / 2 - s * d : -1.45 + s / 2; block2.position.y = Math.max(floatY, 1.2 - tt * 1.5); if (block2.position.y <= floatY + 0.01) block2.position.y = floatY + Math.sin(tt * 2) * 0.01 * (d < 1 ? 1 : 0);
          if (tt > 1.5) verdict.userData.set(`${result.density} g/cm³ · ${t(result.floats === 'floats' ? { en: 'floats', ja: 'うく' } : { en: 'sinks', ja: 'しずむ' })}`);
          void block;
        },
        replay() { tt = 0; block2.position.y = 1.2; },
        lookAt: [0.2, -0.3, 0],
      };
    },

    // 中1 蒸留: flask, condenser, three tubes; the first fills with ethanol.
    distill({ scene, params, result, camera, labels }) {
      lab(scene, { benchMat: stoneMat(0x5a6670), w: 9 });
      add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.4, 24), metalMat(0x334455)), -2.6, -1.3, 0);
      const flame = glow(0x7fd1ff, 1.2, 0.8); flame.position.set(-2.6, -0.9, 0); scene.add(flame);
      const flask = glass(new THREE.SphereGeometry(0.7, 32, 24)); flask.position.set(-2.6, 0.0, 0); scene.add(flask);
      const mix = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 18), new THREE.MeshPhysicalMaterial({ color: 0xffb3c0, transparent: true, opacity: 0.5, roughness: 0.05 })); mix.position.set(-2.6, 0.0, 0); mix.scale.y = 0.6; scene.add(mix);
      scene.add(tube([[-2.6, 0.7, 0], [-2.6, 1.6, 0], [-1.2, 1.6, 0], [0.6, 0.6, 0], [1.2, -0.3, 0]], 0.09, 0xdff6ff, { segments: 60 })); scene.getObjectByProperty('type', 'Mesh');
      const jacket = glass(new THREE.CylinderGeometry(0.28, 0.28, 1.8, 24, 1, true)); jacket.position.set(-0.3, 1.1, 0); jacket.rotation.z = Math.PI / 2 - Math.atan2(1.0, 1.8); scene.add(jacket);
      const thermo = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 10), glassMat(0xffffff, 0.5)), -2.6, 2.1, 0); void thermo;
      const tempL = say(scene, labels, '20°C', -2.6, 3.1, 0, 1.4, { size: 34 });
      const tubes = [0, 1, 2].map((i) => { const tg = glass(new THREE.CylinderGeometry(0.16, 0.16, 1.2, 20, 1, true)); tg.position.set(1.2 + i * 0.7, -0.9, 0); scene.add(tg); const lq = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1, 20), new THREE.MeshPhysicalMaterial({ color: 0xf6f1c8, transparent: true, opacity: 0.6, roughness: 0.05 })); lq.position.set(1.2 + i * 0.7, -1.4, 0); lq.scale.y = 0.01; scene.add(lq); const lab2 = labelSprite(String(i + 1), { width: 0.5, background: null, size: 26 }); lab2.position.set(1.2 + i * 0.7, -1.7, 0.3); scene.add(lab2); return lq; });
      const drip = emitter(scene, { n: 10, color: 0xdff6ff, size: 0.08, rate: 0, life: 0.5, origin: [1.2, -0.3, 0], spread: 0.05, vel: [0, -1.5, 0], gravity: 3 });
      const flameTube = glow(0xff8a7a, 0.9, 0); flameTube.position.set(1.2 + (Number(params.tube) - 1) * 0.7, -0.1, 0); scene.add(flameTube);
      say(scene, labels, { en: `${params.ethanolPct}% ethanol in water · tube ${params.tube}`, ja: `エタノール ${params.ethanolPct}% の みず · ${params.tube}本め` }, 0, 2.9, 0, 3.6, { accent: '#f2b134' });
      const verdict = say(scene, labels, '', 1.9, 0.7, 0, 2.4);
      camera.position.set(0.0, 1.3, 7.4); camera.lookAt(-0.4, 0.3, 0);
      let tt = 0; const chosen = Number(params.tube) - 1;
      return {
        update(dt) {
          tt += dt; flame.material.opacity = 0.6 + Math.sin(tt * 20) * 0.15; if (!result) return;
          const f = Math.min(1, tt / 8); const temp = 20 + Math.min(80, f * 3 * 60) + Math.max(0, f - 0.5) * 2 * 20; tempL.userData.set(`${Math.min(100, temp).toFixed(0)}°C`);
          const filling = Math.min(2, Math.floor(f * 3)); drip.userData.state.on = f > 0.1 && f < 1; drip.userData.state.rate = 6; drip.userData.state.origin = [1.2 + filling * 0.7, -0.3, 0];
          tubes.forEach((lq, i) => { const fill = Math.max(0.01, Math.min(1, (f * 3 - i))); lq.scale.y = fill * 0.9; lq.position.y = -1.4 + (fill * 0.9) / 2; });
          mix.scale.y = 0.6 - f * 0.3;
          if (f >= 1) { verdict.userData.set(`${result.pct}% · ${t(result.burns === 'yes' ? { en: 'it burns!', ja: 'もえた！' } : { en: 'does not burn', ja: 'もえない' })}`); flameTube.material.opacity = result.burns === 'yes' ? 0.7 + Math.sin(tt * 12) * 0.2 : 0; }
          if (chosen > 2) void 0;
        },
        replay() { tt = 0; flameTube.material.opacity = 0; },
        lookAt: [-0.4, 0.3, 0],
      };
    },

    // 中2 質量保存: a flask on a digital balance, lid on or off; the number before and after.
    conservation({ scene, params, result, camera, labels }) {
      lab(scene);
      const scaleBody = add(scene, new THREE.Mesh(roundedBox(2.6, 0.4, 1.8, 0.1), metalMat(0x334455)), 0, -1.3, 0); void scaleBody;
      const pan = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.06, 40), metalMat(0xb8c0c8)), 0, -1.07, 0); void pan;
      const flask = glass(new THREE.SphereGeometry(0.6, 32, 24)); flask.position.set(0, -0.4, 0); scene.add(flask);
      const neck = glass(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 24, 1, true)); neck.position.set(0, 0.35, 0); scene.add(neck);
      const liquid = new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 18), new THREE.MeshPhysicalMaterial({ color: params.reaction === 'precipitate' ? 0xdff6ff : params.reaction === 'copperAir' ? 0xb87333 : 0xf6f1c8, transparent: true, opacity: 0.6, roughness: 0.05 })); liquid.position.set(0, -0.4, 0); liquid.scale.y = 0.5; scene.add(liquid);
      const lid = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 24), plasticMat(0xd04030)), 0, params.lid === 'on' ? 0.7 : 1.6, params.lid === 'on' ? 0 : 1.2);
      const fizz = emitter(scene, { n: 50, color: 0xffffff, size: 0.05, rate: 0, life: 0.8, origin: [0, -0.4, 0], spread: 0.4, vel: [0, 1.0, 0] });
      const escape = emitter(scene, { n: 30, color: 0xcfe8ff, size: 0.1, rate: 0, life: 1.4, origin: [0, 0.7, 0], spread: 0.3, vel: [0, 0.9, 0] });
      const display = say(scene, labels, `${100 + params.grams}.00 g`, 0, -1.75, 1.0, 1.9, { size: 40, accent: '#7fd1ff' });
      say(scene, labels, { en: `${chem2.REACTIONS[params.reaction].en} · lid ${params.lid}`, ja: `${chem2.REACTIONS[params.reaction].ja} · ふた ${params.lid === 'on' ? 'あり' : 'なし'}` }, 0, 2.3, 0, 4.2, { accent: '#f2b134' });
      const verdict = say(scene, labels, '', 2.4, 1.0, 0, 2.2);
      camera.position.set(0.2, 0.9, 6.0); camera.lookAt(0, -0.3, 0);
      let tt = 0;
      return {
        update(dt) {
          tt += dt; if (!result) return; const f = Math.min(1, Math.max(0, (tt - 0.5) / 3));
          fizz.userData.state.on = params.reaction === 'fizz' && f > 0 && f < 1; fizz.userData.state.rate = 25; escape.userData.state.on = params.reaction === 'fizz' && params.lid === 'off' && f > 0 && f < 1; escape.userData.state.rate = 12;
          if (params.reaction === 'copperAir') liquid.material.color.set(new THREE.Color(0xb87333).lerp(new THREE.Color(0x222222), f));
          if (params.reaction === 'precipitate') liquid.material.color.set(new THREE.Color(0xdff6ff).lerp(new THREE.Color(0xffffff), f)), (liquid.material.opacity = 0.6 + f * 0.35);
          display.userData.set(`${(result.before + (result.after - result.before) * f).toFixed(2)} g`);
          if (f >= 1) verdict.userData.set(t({ same: { en: 'the same mass', ja: 'おなじ しつりょう' }, less: { en: 'lighter: gas escaped', ja: 'かるくなった：きたいが にげた' }, more: { en: 'heavier: oxygen joined', ja: 'おもくなった：さんそが ついた' } }[result.change]));
        },
        replay() { tt = 0; },
        lookAt: [0, -0.3, 0],
      };
    },

    // 中2 定比例: copper powder on a dish over a burner, a balance, the straight line.
    oxidation({ scene, params, result, camera, labels }) {
      lab(scene, { benchMat: stoneMat(0x5a6670) });
      add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.4, 24), metalMat(0x334455)), -1.6, -1.3, 0);
      const flame = glow(0x7fd1ff, 1.3, 0.8); flame.position.set(-1.6, -0.85, 0); scene.add(flame);
      const tripod = [0, 1, 2].map((i) => add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8), metalMat(0x333333)), -1.6 + Math.cos(i * 2.1) * 0.6, -0.75, Math.sin(i * 2.1) * 0.6)); void tripod;
      const dish = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.5, 0.2, 32), mat(0xf4f1ea, { rough: 0.5 })), -1.6, 0.05, 0);
      const powderCol = params.metal === 'copper' ? 0xb87333 : 0xc9d0d6;
      const powder = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 32), mat(powderCol, { rough: 0.9 })), -1.6, 0.2, 0);
      const sparks = emitter(scene, { n: 40, color: params.metal === 'magnesium' ? 0xffffff : 0xffa449, size: 0.07, rate: 0, life: 0.7, origin: [-1.6, 0.3, 0], spread: 0.5, vel: [0, 1.4, 0], gravity: 2 });
      const bright = glow(0xffffff, 2.5, 0); bright.position.set(-1.6, 0.4, 0); scene.add(bright);
      const g = graph({ w: 3.0, h: 2.0, xLabel: { en: `${chem2.OXIDE[params.metal].en} (g)`, ja: `${chem2.OXIDE[params.metal].ja}（g）` }, yLabel: { en: 'oxygen joined (g)', ja: 'むすびついた さんそ（g）' }, tone: 0xf2b134 }); g.position.set(2.0, 0.4, -0.4); scene.add(g); labels.push(...g.userData.labels);
      const ratio = chem2.OXIDE[params.metal].ratio; g.userData.plot([[0, 0], [4, 4 * ratio]], { color: 0xf2b134, xr: [0, 4], yr: [0, 3] });
      const mark = result ? g.userData.mark(params.grams, result.oxygen, { xr: [0, 4], yr: [0, 3] }) : null; if (mark) mark.visible = false;
      const display = say(scene, labels, `${params.grams.toFixed(2)} g`, -1.6, 1.4, 0, 1.6, { size: 38 });
      say(scene, labels, { en: `${params.grams} g ${chem2.OXIDE[params.metal].en} in the flame`, ja: `${chem2.OXIDE[params.metal].ja} ${params.grams} g を かねつ` }, 0, 2.6, 0, 3.6, { accent: '#f2b134' });
      camera.position.set(0.3, 1.2, 6.6); camera.lookAt(0.2, 0.1, 0);
      let tt = 0;
      return {
        update(dt) {
          tt += dt; flame.material.opacity = 0.6 + Math.sin(tt * 20) * 0.15; if (!result) return; const f = Math.min(1, tt / 4);
          sparks.userData.state.on = f < 1; sparks.userData.state.rate = params.metal === 'magnesium' ? 30 : 8; bright.material.opacity = params.metal === 'magnesium' && f < 1 ? 0.8 : 0;
          powder.material.color.set(new THREE.Color(powderCol).lerp(new THREE.Color(params.metal === 'copper' ? 0x1a1a1a : 0xffffff), f)); dish.position.y = 0.05;
          display.userData.set(`${(params.grams + result.oxygen * f).toFixed(2)} g`); if (mark && f >= 1) mark.visible = true;
        },
        replay() { tt = 0; if (mark) mark.visible = false; },
        lookAt: [0.2, 0.1, 0],
      };
    },

    // 中2 電気分解: an H-tube with two electrodes; gas rises into each arm, twice as much on the left.
    electrolysis({ scene, params, result, camera, labels }) {
      lab(scene);
      const base = glass(new THREE.BoxGeometry(3.2, 0.5, 0.8)); base.position.set(0, -1.2, 0); scene.add(base);
      const arms = [-1, 1].map((k) => { const a = glass(new THREE.CylinderGeometry(0.3, 0.3, 2.6, 24, 1, true)); a.position.set(k * 1.1, 0.3, 0); scene.add(a); const lq = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 2.4, 24), new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.5, roughness: 0.05, clearcoat: 1 })); lq.position.set(k * 1.1, 0.2, 0); scene.add(lq); const el = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 10), metalMat(k < 0 ? 0x333333 : 0xb87333)), k * 1.1, -0.6, 0); const gas = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 1, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })); gas.position.set(k * 1.1, 1.5, 0); gas.scale.y = 0.01; scene.add(gas); const bub = emitter(scene, { n: 40, color: 0xffffff, size: 0.05, rate: 0, life: 1.2, origin: [k * 1.1, -1.0, 0], spread: 0.2, vel: [0, 1.0, 0] }); return { lq, el, gas, bub, k }; });
      const liquidMid = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.4, 0.7), new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.5, roughness: 0.05 })); liquidMid.position.set(0, -1.2, 0); scene.add(liquidMid);
      const batt = add(scene, new THREE.Mesh(roundedBox(1.2, 0.7, 0.6, 0.08), metalMat(0x334455)), 0, -2.0 + 0.5, 1.6); const plus = labelSprite(`${(params.current * 6).toFixed(1)} V`, { width: 1.2, background: null }); plus.position.set(0, -1.1, 1.6); scene.add(plus); void batt;
      scene.add(tube([[-1.1, -1.2, 0.2], [-1.1, -1.8, 1.2], [-0.5, -1.9, 1.6]], 0.03, 0x333333, { metal: true })); scene.add(tube([[1.1, -1.2, 0.2], [1.1, -1.8, 1.2], [0.5, -1.9, 1.6]], 0.03, 0xd04030));
      const minus = labelSprite('−  H₂', { width: 1.1, background: null, size: 30 }); minus.position.set(-1.1, 2.0, 0); scene.add(minus); const plusL = labelSprite('+  O₂', { width: 1.1, background: null, size: 30 }); plusL.position.set(1.1, 2.0, 0); scene.add(plusL);
      say(scene, labels, { en: `${params.current} A for ${params.minutes} min`, ja: `${params.current} A を ${params.minutes} ぷん` }, 0, 2.8, 0, 2.6, { accent: '#7fd1ff' });
      const hL = say(scene, labels, '0 mL', -2.6, 1.0, 0, 1.3, { size: 32 }); const oL = say(scene, labels, '0 mL', 2.6, 1.0, 0, 1.3, { size: 32 });
      camera.position.set(0.2, 0.8, 6.6); camera.lookAt(0, 0.1, 0);
      let tt = 0; const dur = 6;
      return {
        update(dt) {
          tt += dt; if (!result) return; const f = Math.min(1, tt / dur);
          for (const a of arms) { const ml = (a.k < 0 ? result.h2ml : result.o2ml) * f; const frac = Math.min(1, ml / Math.max(result.h2ml, 1)); a.gas.scale.y = Math.max(0.01, frac * 1.6); a.gas.position.y = 1.5 - (frac * 1.6) / 2 + 0.0; a.lq.scale.y = 1 - frac * 0.6; a.lq.position.y = 0.2 - (frac * 0.6 * 2.4) / 2; a.bub.userData.state.on = f < 1; a.bub.userData.state.rate = a.k < 0 ? 24 : 12; }
          hL.userData.set(`${(result.h2ml * f).toFixed(1)} mL`); oL.userData.set(`${(result.o2ml * f).toFixed(1)} mL`);
        },
        replay() { tt = 0; },
        lookAt: [0, 0.1, 0],
      };
    },

    // 中3 中和: a burette drips base into a flask of acid with BTB; yellow → green → blue.
    titration({ scene, params, result, camera, labels }) {
      lab(scene);
      const stand = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.4, 10), metalMat(0x8d9aa0)), -1.4, 0.6, 0); void stand;
      add(scene, new THREE.Mesh(roundedBox(1.6, 0.1, 1.0, 0.03), metalMat(0x334455)), -1.1, -1.55, 0);
      const arm = add(scene, new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8), metalMat(0x8d9aa0)), -0.7, 1.6, 0); arm.rotation.z = Math.PI / 2;
      const burette = glass(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 16, 1, true)); burette.position.set(0, 1.7, 0); scene.add(burette);
      const baseLq = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 2.2, 16), new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.6, roughness: 0.05 })); baseLq.position.set(0, 1.8, 0); scene.add(baseLq);
      const tap = add(scene, new THREE.Mesh(roundedBox(0.3, 0.12, 0.12, 0.03), plasticMat(0x3a6fd0)), 0, 0.35, 0); void tap;
      const flask = glass(new THREE.ConeGeometry(0.8, 1.4, 32, 1, true)); flask.position.set(0, -0.8, 0); scene.add(flask);
      const acid = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.9, 32), new THREE.MeshPhysicalMaterial({ color: 0xe4c239, transparent: true, opacity: 0.7, roughness: 0.05, clearcoat: 1 })); acid.position.set(0, -1.0, 0); scene.add(acid);
      const drops = emitter(scene, { n: 12, color: 0xcfe8ff, size: 0.08, rate: 0, life: 0.5, origin: [0, 0.2, 0], spread: 0.02, vel: [0, -2, 0], gravity: 4 });
      const swirl = emitter(scene, { n: 20, color: 0xffffff, size: 0.05, rate: 0, life: 0.8, origin: [0, -1.0, 0], spread: 0.5, vel: [0, 0.3, 0] });
      const pH = graph({ w: 2.6, h: 1.8, xLabel: { en: 'base added (mL)', ja: 'たした アルカリ（mL）' }, yLabel: { en: 'pH', ja: 'pH' }, tone: 0x3f9a52 }); pH.position.set(2.4, 0.6, -0.4); scene.add(pH); labels.push(...pH.userData.labels);
      const nMl = result ? result.neutralMl : 10; const curve = []; for (let v = 0; v <= 30; v += 0.5) { const ex = Number(params.baseC) * v - Number(params.acidC) * params.acidMl; const p = Math.abs(ex) < 1e-9 ? 7 : ex < 0 ? Math.max(1, -Math.log10(Math.max(1e-7, -ex / (params.acidMl + v)))) : Math.min(13, 14 + Math.log10(Math.max(1e-7, ex / (params.acidMl + v)))); curve.push([v, p]); }
      const line = pH.userData.plot(curve, { color: 0x3f9a52, xr: [0, 30], yr: [0, 14] }); line.geometry.setDrawRange(0, 0);
      say(scene, labels, { en: `${params.acidMl} mL acid (${params.acidC} mol/L) · ${params.baseMl} mL base`, ja: `さん ${params.acidMl} mL（${params.acidC} mol/L）· アルカリ ${params.baseMl} mL` }, 0, 3.2, 0, 4.2, { accent: '#3f9a52' });
      const readout = say(scene, labels, '0.0 mL', -2.6, 1.2, 0, 1.6, { size: 34 });
      camera.position.set(0.3, 1.0, 6.8); camera.lookAt(0.3, 0.2, 0);
      const COL = { yellow: 0xe4c239, green: 0x3f9a52, blue: 0x3a6fd0 }; let tt = 0; const dur = Math.max(2, Math.min(7, params.baseMl * 0.3));
      return {
        update(dt) {
          tt += dt; if (!result) return; const f = Math.min(1, tt / dur); const ml = params.baseMl * f;
          drops.userData.state.on = f < 1 && params.baseMl > 0; drops.userData.state.rate = 8; swirl.userData.state.on = f < 1; swirl.userData.state.rate = 6;
          const col = ml < nMl - 0.4 ? COL.yellow : ml > nMl + 0.4 ? COL.blue : COL.green; acid.material.color.lerp(new THREE.Color(col), Math.min(1, dt * 4)); acid.scale.setScalar(1 + ml / 60);
          baseLq.scale.y = 1 - (ml / 30) * 0.9; baseLq.position.y = 1.8 + (1 - baseLq.scale.y) * 1.1;
          readout.userData.set(`${ml.toFixed(1)} mL`); line.geometry.setDrawRange(0, Math.floor((ml / 30) * curve.length));
          void nMl;
        },
        replay() { tt = 0; acid.material.color.set(COL.yellow); },
        lookAt: [0.3, 0.2, 0],
      };
    },

    // 中3 電池: two metal plates in a beaker of salt water, a voltmeter and an LED.
    cell({ scene, params, result, camera, labels }) {
      lab(scene);
      const lq = beaker(scene, -1.0, 0.9, 1.6, 0x9fd3ff, 0.65, -1.48); void lq;
      const COL = { magnesium: 0xd8dde3, zinc: 0xa8b0b8, iron: 0x6d7a84, copper: 0xb87333, silver: 0xf0f0f0 };
      const plates = [params.metalA, params.metalB].map((m, i) => add(scene, new THREE.Mesh(roundedBox(0.6, 1.8, 0.08, 0.02), metalMat(COL[m])), -1.0 + (i ? 0.45 : -0.45), -0.4, 0));
      const tags = [params.metalA, params.metalB].map((m, i) => { const l = labelSprite({ en: chem2.ELECTRODES[m].en, ja: chem2.ELECTRODES[m].ja }, { width: 1.5, background: null, size: 26 }); l.position.set(-1.0 + (i ? 0.45 : -0.45), 0.8, 0.3); scene.add(l); labels.push(l); return l; }); void tags;
      scene.add(tube([[-1.45, 0.5, 0], [-1.45, 1.6, 0], [1.2, 1.6, 0], [1.2, 0.9, 0]], 0.03, 0x333333, { metal: true })); scene.add(tube([[-0.55, 0.5, 0], [-0.55, 1.3, 0], [1.9, 1.3, 0], [1.9, 0.9, 0]], 0.03, 0xd04030));
      const meter = add(scene, new THREE.Mesh(roundedBox(1.6, 1.0, 0.6, 0.08), plasticMat(0x1c2a3a)), 1.55, 0.4, 0); void meter;
      const screen = say(scene, labels, '0.00 V', 1.55, 0.5, 0.32, 1.3, { size: 36, background: '#0b1630ee', accent: '#7fd1ff' });
      const led = add(scene, new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), glassMat(0xff8a7a, 0.5)), 1.55, -0.6, 0.2); void led; const ledGlow = glow(0xff6a5a, 1.2, 0); ledGlow.position.set(1.55, -0.6, 0.3); scene.add(ledGlow);
      const bubbles = emitter(scene, { n: 30, color: 0xffffff, size: 0.04, rate: 0, life: 1.0, origin: [-1.45, -1.2, 0], spread: 0.1, vel: [0, 0.8, 0] });
      const electrons = []; for (let i = 0; i < 10; i++) { const e = glow(0x7fd1ff, 0.16, 0); scene.add(e); electrons.push(e); }
      const path = new THREE.CatmullRomCurve3([[-1.45, 0.5, 0.05], [-1.45, 1.6, 0.05], [1.2, 1.6, 0.05], [1.2, 0.9, 0.05]].map((p) => new THREE.Vector3(...p)));
      say(scene, labels, { en: `${chem2.ELECTRODES[params.metalA].en} + ${chem2.ELECTRODES[params.metalB].en} in salt water`, ja: `${chem2.ELECTRODES[params.metalA].ja} と ${chem2.ELECTRODES[params.metalB].ja} を しおみずに` }, 0, 2.5, 0, 4.2, { accent: '#f2b134' });
      const verdict = say(scene, labels, '', 0.3, -2.1, 1.0, 3.0);
      camera.position.set(0.2, 0.9, 6.2); camera.lookAt(0.2, -0.2, 0);
      let tt = 0;
      return {
        update(dt) {
          tt += dt; if (!result) return; const f = Math.min(1, tt / 1.5);
          screen.userData.set(`${(result.volts * f).toFixed(2)} V`); ledGlow.material.opacity = result.lights === 'yes' ? 0.8 * f : 0.15 * f * (result.volts > 0 ? 1 : 0);
          const neg = result.negative === params.metalA ? 0 : result.negative === params.metalB ? 1 : -1; if (neg >= 0) { bubbles.userData.state.origin = [-1.0 + (neg ? 0.45 : -0.45), -1.2, 0]; bubbles.userData.state.on = true; bubbles.userData.state.rate = 6; plates[neg].scale.x = Math.max(0.5, 1 - tt * 0.01); }
          electrons.forEach((e, i) => { const p = path.getPointAt(((tt * 0.15 * Math.min(2, result.volts) + i / 10) % 1 + 1) % 1); e.position.copy(p); e.material.opacity = result.volts > 0 ? 0.9 : 0; });
          if (f >= 1) verdict.userData.set(result.volts > 0 ? `${t({ en: 'minus pole', ja: 'マイナスきょく' })}: ${chem2.ELECTRODES[result.negative].en}` : t({ en: 'same metal: no battery', ja: 'おなじ きんぞく：でんちに ならない' }));
        },
        replay() { tt = 0; },
        lookAt: [0.2, -0.2, 0],
      };
    },
  };
}
