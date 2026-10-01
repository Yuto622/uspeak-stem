// Data and AI: dice, counting fish you cannot see, and a classifier a child can read.
// All seeded, so the server rolls the same dice.

import { rng } from './rng.js';

export function dice({ count, rolls, seed }) {
  const r = rng(seed);
  const hist = {};
  let sum = 0;
  for (let i = 0; i < rolls; i++) {
    let s = 0; for (let d = 0; d < count; d++) s += 1 + Math.floor(r.next() * 6);
    hist[s] = (hist[s] || 0) + 1; sum += s;
  }
  const entries = Object.entries(hist).map(([k, v]) => [Number(k), v]).sort((a, b) => a[0] - b[0]);
  const mode = entries.reduce((m, e) => (e[1] > m[1] ? e : m), entries[0]);
  return { mode: mode[0], mean: Math.round((sum / rolls) * 100) / 100, sevenPercent: count === 2 ? Math.round(((hist[7] || 0) / rolls) * 1000) / 10 : null, hist: entries };
}

// Capture-recapture: mark `marked` fish, let them mix, catch `caught`, count marks.
// The pond's true number is drawn from the seed and only revealed with the result.
export function pond({ marked, caught, seed }) {
  const r = rng(seed);
  const truth = 60 + Math.floor(r.next() * 240);
  // each caught fish is marked with probability marked/truth
  let recaptured = 0; for (let i = 0; i < caught; i++) if (r.next() < marked / truth) recaptured++;
  const estimate = recaptured ? Math.round((marked * caught) / recaptured) : null;
  return { recaptured, estimate, truth, bucket: truth > 150 ? 'over-150' : 'under-150', error: estimate === null ? null : Math.round((Math.abs(estimate - truth) / truth) * 100) };
}

// k-nearest neighbours on fruit: weight (g) and colour (0 green .. 1 orange).
export function classify({ weight, color, k = 5, seed }) {
  const r = rng(seed);
  const train = [];
  for (let i = 0; i < 40; i++) {
    const apple = i % 2 === 0;
    train.push({ w: apple ? 140 + r.normal() * 25 : 190 + r.normal() * 30, c: apple ? 0.3 + r.normal() * 0.15 : 0.85 + r.normal() * 0.1, label: apple ? 'apple' : 'orange' });
  }
  const dist = (p) => Math.hypot((p.w - weight) / 60, (p.c - color) / 0.4);
  const near = [...train].sort((a, b) => dist(a) - dist(b)).slice(0, k);
  const apples = near.filter((p) => p.label === 'apple').length;
  const label = apples > k / 2 ? 'apple' : 'orange';
  const confidence = Math.round((Math.max(apples, k - apples) / k) * 100);
  // accuracy of the rule on the training set (leave-one-out)
  let right = 0;
  for (const p of train) {
    const nn = train.filter((q) => q !== p).sort((a, b) => Math.hypot((a.w - p.w) / 60, (a.c - p.c) / 0.4) - Math.hypot((b.w - p.w) / 60, (b.c - p.c) / 0.4)).slice(0, k);
    const ap = nn.filter((q) => q.label === 'apple').length;
    if ((ap > k / 2 ? 'apple' : 'orange') === p.label) right++;
  }
  return { label, confidence, accuracy: Math.round((right / train.length) * 100), train, near: near.map((p) => ({ w: Math.round(p.w), c: Math.round(p.c * 100) / 100, label: p.label })) };
}

// 小5 プログラミング: a turtle walks `sides` steps, turning `angle` each time. It comes
// home when the turns add up to a whole number of circles.
export const POLYGONS = { 3: { en: 'triangle', ja: 'さんかくけい' }, 4: { en: 'square', ja: 'せいほうけい' }, 5: { en: 'pentagon', ja: 'ごかくけい' }, 6: { en: 'hexagon', ja: 'ろっかくけい' }, 8: { en: 'octagon', ja: 'はっかくけい' } };
export function polygon({ sides = 4, angle = 90 }) {
  const total = sides * angle;
  const closes = Math.abs(total / 360 - Math.round(total / 360)) < 1e-9 && total > 0;
  const regular = closes && Math.abs(angle - 360 / sides) < 1e-9;
  const name = regular ? sides : closes ? 'star' : 'open';
  // the turtle's path, for drawing
  const pts = [[0, 0]]; let x = 0; let y = 0; let h = 0;
  for (let i = 0; i < sides; i++) { x += Math.cos((h * Math.PI) / 180); y += Math.sin((h * Math.PI) / 180); pts.push([Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]); h += angle; }
  return { closes: closes ? 'yes' : 'no', rightAngle: 360 / sides, name: String(name), turns: total / 360, path: pts };
}
