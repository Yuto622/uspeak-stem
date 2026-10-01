// Chemistry: tables of real substances and the rules that turn them into what a child
// sees. No molecule is simulated; a solubility curve, a pH and an indicator chart are
// what the textbook gives, and they are enough to predict, run, measure and explain.
//
// Everything is a pure function of its inputs, like the rest of `shared/sim`, so the
// server recomputes it to judge.

// 1. Solubility (grams that dissolve in 100 g of water), by temperature in °C.
//    Values from standard tables; alum is the hydrate (the crystal a child grows).
export const SOLUTES = {
  salt: { en: 'Salt', ja: 'しお', table: [[0, 35.7], [20, 35.9], [40, 36.4], [60, 37.1], [80, 38.0], [100, 39.2]], color: '#f4f1ea' },
  sugar: { en: 'Sugar', ja: 'さとう', table: [[0, 179], [20, 204], [40, 238], [60, 287], [80, 362], [100, 487]], color: '#fff6dd' },
  alum: { en: 'Alum', ja: 'ミョウバン', table: [[0, 5.7], [20, 11.4], [40, 23.8], [60, 57.4], [80, 321]], color: '#e8f0ff' },
  boric: { en: 'Boric acid', ja: 'ホウさん', table: [[0, 2.8], [20, 4.9], [40, 8.9], [60, 14.9], [80, 23.5], [100, 38]], color: '#ffffff' },
  saltpetre: { en: 'Saltpetre (KNO3)', ja: 'しょうさんカリウム', table: [[0, 13.3], [20, 31.6], [40, 63.9], [60, 109], [80, 169], [100, 246]], color: '#f0f0f0' },
};

// Linear interpolation on the table. Beyond the ends, hold the end value.
export function solubility(soluteId, tempC) {
  const t = SOLUTES[soluteId].table;
  if (tempC <= t[0][0]) return t[0][1];
  for (let i = 1; i < t.length; i++) {
    if (tempC <= t[i][0]) {
      const [t0, s0] = t[i - 1]; const [t1, s1] = t[i];
      return s0 + ((tempC - t0) / (t1 - t0)) * (s1 - s0);
    }
  }
  return t[t.length - 1][1];
}

// Put `grams` of a solute into `water` grams of water at `tempC`: how much dissolves,
// how much stays on the bottom, and whether the solution is saturated.
export function dissolve({ solute, grams, water = 100, tempC }) {
  const limit = (solubility(solute, tempC) * water) / 100;
  const dissolved = Math.min(grams, limit);
  return {
    dissolved: Math.round(dissolved * 10) / 10,
    left: Math.round((grams - dissolved) * 10) / 10,
    saturated: grams >= limit - 1e-9,
    limit: Math.round(limit * 10) / 10,
  };
}

// Cool a saturated solution from one temperature to another: the crystals that come out.
export function recrystallize({ solute, grams, water = 100, fromC, toC }) {
  const before = dissolve({ solute, grams, water, tempC: fromC }).dissolved;
  const after = Math.min(before, (solubility(solute, toC) * water) / 100);
  return { crystals: Math.round((before - after) * 10) / 10 };
}

// 2. Acids and bases. Everyday liquids with their pH, and what each indicator does.
export const LIQUIDS = {
  lemon: { en: 'Lemon juice', ja: 'レモンの しる', pH: 2.3 },
  vinegar: { en: 'Vinegar', ja: 'す', pH: 2.8 },
  cola: { en: 'Cola', ja: 'コーラ', pH: 2.5 },
  orange: { en: 'Orange juice', ja: 'オレンジジュース', pH: 3.5 },
  rain: { en: 'Rain water', ja: 'あまみず', pH: 5.6 },
  milk: { en: 'Milk', ja: 'ぎゅうにゅう', pH: 6.6 },
  water: { en: 'Pure water', ja: 'じゅんすいな みず', pH: 7.0 },
  saltwater: { en: 'Salt water', ja: 'しおみず', pH: 7.0 },
  sea: { en: 'Sea water', ja: 'うみの みず', pH: 8.1 },
  soda: { en: 'Baking soda water', ja: 'じゅうそうすい', pH: 8.3 },
  soap: { en: 'Soapy water', ja: 'せっけんすい', pH: 9.5 },
  ammonia: { en: 'Ammonia water', ja: 'アンモニアすい', pH: 11.5 },
  limewater: { en: 'Lime water', ja: 'せっかいすい', pH: 12.4 },
  hcl: { en: 'Dilute hydrochloric acid', ja: 'うすい えんさん', pH: 1.0 },
  naoh: { en: 'Dilute sodium hydroxide', ja: 'うすい すいさんかナトリウム', pH: 13.0 },
};

export function kindOfPH(pH) { return pH < 6.5 ? 'acid' : pH > 7.5 ? 'base' : 'neutral'; }

export const INDICATORS = {
  litmus: { en: 'Litmus paper', ja: 'リトマスし', color: (pH) => (pH < 6.5 ? 'red' : pH > 7.5 ? 'blue' : 'purple') },
  btb: { en: 'BTB solution', ja: 'BTBよう液', color: (pH) => (pH < 6.0 ? 'yellow' : pH > 7.6 ? 'blue' : 'green') },
  cabbage: {
    en: 'Red cabbage juice', ja: 'むらさきキャベツの しる',
    color: (pH) => (pH < 3 ? 'red' : pH < 6.5 ? 'pink' : pH < 7.5 ? 'purple' : pH < 9.5 ? 'blue' : pH < 12 ? 'green' : 'yellow'),
  },
  phenol: { en: 'Phenolphthalein', ja: 'フェノールフタレイン', color: (pH) => (pH < 8.2 ? 'colorless' : 'pink') },
};
export const COLOR_HEX = { red: '#d9433a', pink: '#e98ab0', purple: '#7a4ea8', blue: '#3a6fd0', green: '#3f9a52', yellow: '#e4c239', colorless: '#f2f5f7' };

export function testLiquid({ liquid, indicator }) {
  const pH = LIQUIDS[liquid].pH;
  return { pH, kind: kindOfPH(pH), color: INDICATORS[indicator].color(pH) };
}

// Neutralisation: how much base of concentration cB neutralises vA of acid at cA.
// (mol/L and mL; monoprotic, which is all a junior-high titration uses.)
export function neutralise({ cA, vA, cB }) { return { vB: Math.round(((cA * vA) / cB) * 10) / 10 }; }

// 3. A candle under a jar. The flame goes out when the oxygen fraction falls to about
//    16%; until then it uses oxygen at a steady rate, making carbon dioxide. A one-litre
//    jar in ordinary air lasts about twenty seconds, which is what a child times.
export const O2_AIR = 0.21;
export const O2_OUT = 0.16;
const O2_RATE_L_PER_S = 0.0025;   // per candle
const CO2_PER_O2 = 0.66;          // paraffin: C25H52 + 38 O2 -> 25 CO2 + 26 H2O

export function candle({ litres, o2 = O2_AIR, candles = 1 }) {
  const usable = Math.max(0, (o2 - O2_OUT) * litres);
  const seconds = usable / (O2_RATE_L_PER_S * candles);
  const co2ml = Math.round(usable * CO2_PER_O2 * 1000);
  return {
    seconds: Math.round(seconds * 10) / 10,
    co2ml,
    o2After: Math.round(Math.max(O2_OUT, o2 - usable / litres) * 1000) / 10, // percent
    limewater: co2ml > 0 ? 'cloudy' : 'clear',
  };
}
