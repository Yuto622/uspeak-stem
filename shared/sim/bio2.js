// Biology, the textbook sequence: チョウの育ち方 (小3), 発芽の条件・メダカ (小5),
// だ液のはたらき・呼吸・日光とでんぷん (小6), 遺伝 (中3). Pure functions; the one that
// uses chance takes a seed.

import { rng } from './rng.js';

// 小5 発芽の条件: water, air and a mild temperature. Light is not needed.
export function germination({ water = 'yes', air = 'yes', tempC = 20, light = 'light' }) {
  const ok = water === 'yes' && air === 'yes' && tempC >= 15 && tempC <= 35;
  const days = ok ? Math.max(3, Math.round(12 - (tempC - 15) * 0.3)) : null;
  return { germinates: ok ? 'yes' : 'no', days, missing: water !== 'yes' ? 'water' : air !== 'yes' ? 'air' : tempC < 15 ? 'cold' : tempC > 35 ? 'hot' : 'none', lightMatters: 'no', light };
}

// 小5 メダカ: the eggs hatch in about ten days at 25°C; colder, slower; too cold or
// too hot, never.
export function medaka({ tempC = 25 }) {
  if (tempC < 15 || tempC > 35) return { hatches: 'no', days: null, bucket: 'never' };
  const days = Math.round((150 / (tempC - 10)) * 10) / 10;
  return { hatches: 'yes', days, bucket: days < 9 ? 'under-9' : days <= 12 ? '9-12' : 'over-12' };
}

// 小6 だ液: starch with saliva at body warmth turns to sugar in about ten minutes, so
// iodine no longer goes blue-black. Cold, or no saliva, and the starch is still there.
export function saliva({ saliva = 'yes', tempC = 40, minutes = 10 }) {
  const rate = saliva === 'yes' ? Math.max(0, 1 - Math.abs(tempC - 37) / 30) : 0;
  const starchLeft = Math.round(Math.max(0, 100 - rate * minutes * 12));
  return { starchLeft, iodine: starchLeft > 40 ? 'blue-black' : 'brown', digested: starchLeft <= 40 ? 'yes' : 'no', sugar: starchLeft <= 40 ? 'yes' : 'no' };
}

// 小6 呼吸: the air we breathe out has less oxygen and more carbon dioxide; lime water
// turns cloudy with it. Exercise makes us breathe more often.
export function breath({ activity = 'rest', sample = 'out' }) {
  const o2 = sample === 'in' ? 21 : 16.5; const co2 = sample === 'in' ? 0.04 : 4;
  const perMin = { rest: 16, walk: 22, run: 36 }[activity] || 16;
  return { o2, co2, limewater: sample === 'out' ? 'cloudy' : 'clear', breathsPerMin: perMin, moreCO2: sample === 'out' ? 'yes' : 'no', effort: { rest: 0, walk: 1, run: 2 }[activity] ?? 0 };
}

// 小6 日光とでんぷん: a leaf in the sun makes starch; covered with foil, or in the
// dark, it does not. Iodine shows it.
export function photosynthesis({ light = 'sun', hours = 4, cover = 'none' }) {
  const made = light === 'sun' && cover === 'none' && hours >= 2;
  return { starch: made ? 'yes' : 'no', starchScore: made ? 1 : 0, iodine: made ? 'blue-black' : 'brown', why: light !== 'sun' ? 'dark' : cover !== 'none' ? 'covered' : hours < 2 ? 'short' : 'ok' };
}

// 小3 チョウの育ち方: egg → larva → pupa → adult in about a month at 25°C. Warmer, faster.
export const STAGES = [{ id: 'egg', en: 'Egg', ja: 'たまご' }, { id: 'larva', en: 'Caterpillar', ja: 'よう虫' }, { id: 'pupa', en: 'Pupa', ja: 'さなぎ' }, { id: 'adult', en: 'Butterfly', ja: 'せい虫' }];
export function butterfly({ tempC = 25, day = 10 }) {
  const total = Math.round((450 / Math.max(1, tempC - 10)) * 10) / 10; // days to adult
  const bounds = [0.13, 0.6, 0.85]; // fraction of the way at the end of egg, larva, pupa
  const f = day / total;
  const stage = f < bounds[0] ? 'egg' : f < bounds[1] ? 'larva' : f < bounds[2] ? 'pupa' : 'adult';
  return { stage, totalDays: total, eggDays: Math.round(total * bounds[0] * 10) / 10, larvaDays: Math.round(total * (bounds[1] - bounds[0]) * 10) / 10, pupaDays: Math.round(total * (bounds[2] - bounds[1]) * 10) / 10 };
}

// 中3 遺伝: Mendel's peas. Round (R) is dominant. Count 100 seeds of a cross.
export const CROSSES = { 'RR-rr': { en: 'Pure round × pure wrinkled', ja: 'まる（RR）× しわ（rr）' }, 'Rr-Rr': { en: 'Hybrid × hybrid', ja: 'ざっしゅ（Rr）× ざっしゅ（Rr）' }, 'Rr-rr': { en: 'Hybrid × pure wrinkled', ja: 'ざっしゅ（Rr）× しわ（rr）' }, 'rr-rr': { en: 'Wrinkled × wrinkled', ja: 'しわ（rr）× しわ（rr）' } };
export function genetics({ cross = 'Rr-Rr', seeds = 100, seed = 1 }) {
  const pRound = { 'RR-rr': 1, 'Rr-Rr': 0.75, 'Rr-rr': 0.5, 'rr-rr': 0 }[cross];
  const r = rng(seed); let round = 0;
  for (let i = 0; i < seeds; i++) if (r.next() < pRound) round++;
  const wrinkled = seeds - round;
  const ratio = pRound === 1 ? 'all-round' : pRound === 0.75 ? '3:1' : pRound === 0.5 ? '1:1' : 'all-wrinkled';
  return { round, wrinkled, ratio, roundPct: Math.round((round / seeds) * 100), expectedRound: Math.round(pRound * seeds) };
}
