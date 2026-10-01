// Chemistry, the second shelf: the experiments Japanese textbooks run from 小3 to 中3,
// as pure functions of their inputs. 物と重さ (小3), とじこめた空気と水・体積と温度・
// 水のすがた (小4), 金属と水溶液 (小6), 密度・蒸留 (中1), 質量保存・定比例・電気分解
// (中2), 中和・電池 (中3). Numbers are the textbook numbers.

// 小3 物と重さ / 中1 密度: what a cubic centimetre weighs (g/cm³).
export const MATERIALS = {
  foam: { en: 'Foam', ja: 'はっぽうスチロール', density: 0.03 },
  wood: { en: 'Wood', ja: 'き', density: 0.5 },
  ice: { en: 'Ice', ja: 'こおり', density: 0.92 },
  plastic: { en: 'Plastic', ja: 'プラスチック', density: 1.05 },
  rubber: { en: 'Rubber', ja: 'ゴム', density: 1.2 },
  glass: { en: 'Glass', ja: 'ガラス', density: 2.5 },
  aluminium: { en: 'Aluminium', ja: 'アルミニウム', density: 2.7 },
  iron: { en: 'Iron', ja: 'てつ', density: 7.87 },
  copper: { en: 'Copper', ja: 'どう', density: 8.96 },
};
export const SHAPES = { ball: { en: 'a ball', ja: 'まるめる' }, flat: { en: 'flattened', ja: 'ひらたく' }, pieces: { en: 'in pieces', ja: 'ちぎる' } };

// Change the shape of a lump of clay and weigh it again: the same. Then compare the
// same volume of different materials: the heavy ones are heavy per cubic centimetre.
export function massShape({ material = 'plastic', volume = 50, shape = 'ball' }) {
  const d = MATERIALS[material].density;
  const grams = Math.round(d * volume * 10) / 10;
  return { grams, shapeChanges: 'same', heavierThanWood: grams > MATERIALS.wood.density * volume ? 'heavier' : 'lighter', density: d, shape };
}

// 小4 とじこめた空気と水: push a piston on a 50 mL syringe. Air squashes (Boyle: pV
// is constant; pushing with one atmosphere more halves it) and pushes back; water does
// not move at all.
export function compress({ fluid = 'air', push = 1 }) {
  const v0 = 50;
  const volume = fluid === 'air' ? Math.round((v0 / (1 + push)) * 10) / 10 : v0;
  return { volume, squashes: fluid === 'air' ? 'yes' : 'no', pushBack: fluid === 'air' && push > 0 ? 'strong' : 'none', pressed: Math.round((v0 - volume) * 10) / 10 };
}

// 小4 物の体積と温度: warm 100 mL of air, water or iron by ΔT. Air grows about 1/273
// of itself per degree; water a few ten-thousandths; iron a few hundred-thousandths.
export const EXPAND = { air: { en: 'Air', ja: 'くうき', beta: 1 / 273 }, water: { en: 'Water', ja: 'みず', beta: 2.1e-4 }, metal: { en: 'Metal (iron)', ja: 'きんぞく（てつ）', beta: 3.6e-5 } };
export function expansion({ substance = 'air', deltaT = 30 }) {
  const ml = 100 * EXPAND[substance].beta * deltaT;
  return { deltaMl: Math.round(ml * 100) / 100, most: 'air', least: 'metal', ringPasses: substance === 'metal' && deltaT >= 100 ? 'no' : 'yes', bigger: ml > 0 ? 'bigger' : 'same' };
}

// 小4 水のすがた: heat 150 g of ice at -10°C on a burner. Only about a third of the
// burner's heat reaches the beaker, which is why a class watches the thermometer sit
// at 0°C for five minutes while the ice melts, climb, then sit at 100°C while it boils.
export function heating({ minutes = 5, power = 500 }) {
  const J = power * 0.35 * 60 * minutes; // joules that reach the water
  const m = 150;
  const stages = [
    { to: 0, kind: 'ice', J: m * 2.1 * 10 },           // warm the ice -10 → 0
    { to: 0, kind: 'melting', J: m * 334 },              // melt
    { to: 100, kind: 'water', J: m * 4.18 * 100 },       // warm the water 0 → 100
    { to: 100, kind: 'boiling', J: m * 2260 },           // boil away
  ];
  let left = J; let tempC = -10; let state = 'ice';
  for (const s of stages) {
    if (left >= s.J) { left -= s.J; tempC = s.to; state = s.kind === 'melting' ? 'water' : s.kind === 'boiling' ? 'steam' : s.kind; continue; }
    const f = left / s.J;
    if (s.kind === 'ice') { tempC = -10 + 10 * f; state = 'ice'; }
    else if (s.kind === 'melting') { tempC = 0; state = 'melting'; }
    else if (s.kind === 'water') { tempC = 100 * f; state = 'water'; }
    else { tempC = 100; state = 'boiling'; }
    left = 0; break;
  }
  const meltEnd = (stages[0].J + stages[1].J) / (power * 0.35 * 60); const boilStart = meltEnd + stages[2].J / (power * 0.35 * 60);
  return { tempC: Math.round(tempC * 10) / 10, state, meltEndMin: Math.round(meltEnd * 10) / 10, boilStartMin: Math.round(boilStart * 10) / 10, flat: state === 'melting' || state === 'boiling' ? 'flat' : 'rising' };
}

// 小6 水溶液 / 中3: metals in dilute acid or dilute sodium hydroxide. Aluminium and zinc
// go in both (hydrogen bubbles); iron and magnesium only in acid; copper in neither.
export const METALS = {
  magnesium: { en: 'Magnesium', ja: 'マグネシウム', acid: 'fast', base: 'none' },
  aluminium: { en: 'Aluminium', ja: 'アルミニウム', acid: 'yes', base: 'yes' },
  zinc: { en: 'Zinc', ja: 'あえん', acid: 'yes', base: 'slow' },
  iron: { en: 'Iron', ja: 'てつ', acid: 'slow', base: 'none' },
  copper: { en: 'Copper', ja: 'どう', acid: 'none', base: 'none' },
};
export const SOLUTIONS = { hcl: { en: 'Dilute hydrochloric acid', ja: 'うすい えんさん' }, naoh: { en: 'Dilute sodium hydroxide', ja: 'うすい すいさんかナトリウム' }, water: { en: 'Water', ja: 'みず' } };
export function metalAcid({ metal = 'aluminium', solution = 'hcl' }) {
  const m = METALS[metal];
  const rate = solution === 'water' ? 'none' : solution === 'hcl' ? m.acid : m.base;
  const reacts = rate !== 'none';
  return { bubbles: reacts ? 'yes' : 'no', rate, gas: reacts ? 'hydrogen' : 'none', dissolves: reacts ? 'yes' : 'no', bubbleRate: { none: 0, slow: 1, yes: 3, fast: 8 }[rate], reactivity: { magnesium: 4, aluminium: 3, zinc: 2, iron: 1, copper: 0 }[metal] };
}

// 中1 密度: mass ÷ volume tells you what it is, and whether it floats in water.
export function density({ material = 'wood', volume = 20 }) {
  const d = MATERIALS[material].density;
  return { grams: Math.round(d * volume * 10) / 10, density: d, floats: d < 1 ? 'floats' : 'sinks', denserThanWater: d > 1 ? 'yes' : 'no' };
}

// 中1 蒸留: boil a water–ethanol mixture and collect three test tubes in turn. The
// first is mostly ethanol (it boils at 78°C), the last mostly water (100°C).
export function distill({ ethanolPct = 20, tube = 1 }) {
  const first = Math.min(95, 60 + ethanolPct * 1.2); const second = Math.min(70, 25 + ethanolPct); const third = Math.max(2, ethanolPct * 0.3);
  const pct = [first, second, third][Math.min(2, Math.max(0, tube - 1))];
  const burns = pct >= 40 ? 'yes' : 'no';
  return { pct: Math.round(pct), burns, tempStart: 78, tempEnd: 100, smell: pct >= 40 ? 'strong' : 'faint', firstOut: 'ethanol' };
}

// 中2 質量保存: three classroom reactions on a balance, with the lid on or off.
export const REACTIONS = {
  fizz: { en: 'Baking soda + vinegar', ja: 'じゅうそう ＋ す', gasOut: 0.52, gasIn: 0 },        // CO2 leaves an open cup
  ironSulfur: { en: 'Iron + sulfur (heated)', ja: 'てつ ＋ いおう', gasOut: 0, gasIn: 0 },
  copperAir: { en: 'Copper heated in air', ja: 'どうを くうきで かねつ', gasOut: 0, gasIn: 0.25 }, // O2 joins
  precipitate: { en: 'Two clear solutions → white solid', ja: 'とうめいな えき 2つ → しろい こな', gasOut: 0, gasIn: 0 },
};
export function conservation({ reaction = 'fizz', lid = 'on', grams = 1 }) {
  const r = REACTIONS[reaction];
  const before = 100 + grams;
  const open = lid === 'off';
  const delta = (open ? -r.gasOut * grams : 0) + (reaction === 'copperAir' ? r.gasIn * grams : 0);
  const after = Math.round((before + delta) * 100) / 100;
  return { before, after, change: Math.abs(delta) < 1e-9 ? 'same' : delta < 0 ? 'less' : 'more', deltaG: Math.round(delta * 100) / 100 };
}

// 中2 定比例: heat copper or magnesium until it stops gaining mass. Cu:O = 4:1, Mg:O = 3:2.
export const OXIDE = { copper: { en: 'Copper', ja: 'どう', ratio: 1 / 4, oxide: { en: 'black copper oxide', ja: 'くろい さんかどう' } }, magnesium: { en: 'Magnesium', ja: 'マグネシウム', ratio: 2 / 3, oxide: { en: 'white magnesium oxide', ja: 'しろい さんかマグネシウム' } } };
export function oxidation({ metal = 'copper', grams = 2 }) {
  const o = OXIDE[metal];
  const oxygen = Math.round(grams * o.ratio * 100) / 100;
  return { oxygen, oxide: Math.round((grams + oxygen) * 100) / 100, ratio: metal === 'copper' ? '4:1' : '3:2', heavier: 'heavier', color: metal === 'copper' ? 'black' : 'white' };
}

// 中2 電気分解: water with a little sodium hydroxide, a current for some minutes.
// Twice as much hydrogen (at the − side) as oxygen (at the +). 1 A for 60 s makes
// about 7.6 mL of hydrogen at room temperature.
export function electrolysis({ current = 0.5, minutes = 5 }) {
  const coulombs = current * minutes * 60;
  const h2 = (coulombs / 96485 / 2) * 24400; // mL at 25°C
  return { h2ml: Math.round(h2 * 10) / 10, o2ml: Math.round((h2 / 2) * 10) / 10, ratio: '2:1', more: 'hydrogen', cathodeGas: 'hydrogen', pops: 'yes' };
}

// 中3 中和: 10 mL of acid, base dripped in. BTB goes yellow → green → blue; a drop
// of evaporated green solution leaves salt crystals.
export function titration({ acidMl = 10, acidC = 0.1, baseC = 0.1, baseMl = 5 }) {
  const nA = acidC * acidMl; const nB = baseC * baseMl;
  const neutralMl = Math.round(((acidC * acidMl) / baseC) * 10) / 10;
  const excess = nB - nA;
  const state = Math.abs(excess) < 1e-9 ? 'neutral' : excess < 0 ? 'acidic' : 'basic';
  return { color: state === 'neutral' ? 'green' : state === 'acidic' ? 'yellow' : 'blue', state, neutralMl, salt: baseMl >= neutralMl * 0.5 ? 'yes' : 'no', ionsLeft: state === 'acidic' ? 'H+' : state === 'basic' ? 'OH-' : 'none' };
}

// 中3 電池: two metals in a salt solution. The more reactive metal is the − pole; the
// voltage is the gap between their standard potentials (idealised).
export const ELECTRODES = { magnesium: { en: 'Magnesium', ja: 'マグネシウム', E: -2.37 }, zinc: { en: 'Zinc', ja: 'あえん', E: -0.76 }, iron: { en: 'Iron', ja: 'てつ', E: -0.44 }, copper: { en: 'Copper', ja: 'どう', E: 0.34 }, silver: { en: 'Silver', ja: 'ぎん', E: 0.80 } };
export function cell({ metalA = 'zinc', metalB = 'copper' }) {
  const a = ELECTRODES[metalA]; const b = ELECTRODES[metalB];
  const volts = Math.round(Math.abs(a.E - b.E) * 100) / 100;
  const negative = a.E < b.E ? metalA : b.E < a.E ? metalB : 'none';
  return { volts, negative, works: volts > 0 ? 'yes' : 'no', lights: volts >= 1.0 ? 'yes' : 'no', dissolving: negative, rank: { magnesium: 5, zinc: 4, iron: 3, copper: 2, silver: 1 }[metalA] };
}
