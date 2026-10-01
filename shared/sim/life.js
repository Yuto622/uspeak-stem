// Life: a rabbit-and-fox meadow, a plant on a windowsill, a heart that beats faster
// when you run. Simple models with the shape of the real ones, stepped deterministically.

// Lotka-Volterra, stepped daily for `days`. Grass growth sets how fast rabbits breed.
export const GRASS = { low: { en: 'Little grass', ja: 'くさ すこし', r: 0.06 }, medium: { en: 'Some grass', ja: 'くさ ふつう', r: 0.1 }, high: { en: 'Lots of grass', ja: 'くさ たくさん', r: 0.16 } };
export function meadow({ rabbits, foxes, grass = 'medium', days = 120 }) {
  const r = GRASS[grass].r; const a = 0.004; const b = 0.0012; const d = 0.08;
  let R = rabbits; let F = foxes;
  const trace = []; let rabbitPeak = R; let foxPeak = F; let cycles = 0; let rising = true;
  for (let t = 0; t <= days; t++) {
    trace.push([Math.round(R), Math.round(F)]);
    const dR = r * R - a * R * F; const dF = b * R * F - d * F;
    const nR = Math.max(0, R + dR); const nF = Math.max(0, F + dF);
    if (nR > rabbitPeak) rabbitPeak = nR; if (nF > foxPeak) foxPeak = nF;
    if (rising && nR < R && R > rabbits) { rising = false; cycles++; } else if (!rising && nR > R) rising = true;
    R = nR < 0.5 ? 0 : nR; F = nF < 0.5 ? 0 : nF;
  }
  const fate = R === 0 && F === 0 ? 'both-die' : F === 0 ? 'foxes-die' : R === 0 ? 'rabbits-die' : 'both-live';
  return { fate, rabbitPeak: Math.round(rabbitPeak), foxPeak: Math.round(foxPeak), cycles, rabbitsEnd: Math.round(R), foxesEnd: Math.round(F), trace };
}

export const LIGHT = { dark: { en: 'Dark cupboard', ja: 'くらい たな', f: 0.05 }, window: { en: 'Window', ja: 'まど', f: 0.7 }, sun: { en: 'Full sun', ja: 'ひなた', f: 1.0 } };
// Fourteen days of a bean seedling: height in cm from light, water and warmth.
export function plant({ water, light, tempC, days = 14 }) {
  const lf = LIGHT[light].f;
  const wf = water === 0 ? 0 : water <= 2 ? water / 2 : Math.max(0, 1 - (water - 2) * 0.35); // too much drowns it
  const tf = tempC < 8 ? 0 : tempC > 32 ? 0.3 : Math.min(1, (tempC - 8) / 14);
  const rate = 1.6 * lf * wf * tf;
  const height = Math.round(rate * days * 10) / 10;
  const alive = wf > 0 && tf > 0;
  return { height, leaves: alive ? Math.max(1, Math.round(height / 2.5)) : 0, alive: alive ? 'grows' : 'wilts', color: lf < 0.2 && alive ? 'pale' : 'green' };
}

export const ACTIVITY = { rest: { en: 'Resting', ja: 'やすむ', k: 0 }, walk: { en: 'Walking', ja: 'あるく', k: 0.35 }, run: { en: 'Running', ja: 'はしる', k: 0.7 }, sprint: { en: 'Sprinting', ja: 'ぜんりょくで はしる', k: 0.95 } };
// Heart rate for a child: resting ~80 at 6 falling to ~70 at 15; max 220 - age.
export function heart({ activity, minutes = 3, age = 10 }) {
  const rest = 80 - (age - 6) * 1.1; const max = 220 - age;
  const k = ACTIVITY[activity].k;
  const bpm = Math.round(rest + (max - rest) * k * Math.min(1, 0.5 + minutes / 6));
  const recovery = Math.round((bpm - rest) * 1.1);
  return { bpm, breaths: Math.round(14 + (bpm - rest) * 0.25), recovery, faster: bpm > rest + 5 ? 'faster' : 'same' };
}
