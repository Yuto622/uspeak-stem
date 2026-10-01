import test from 'node:test';
import assert from 'node:assert/strict';
import { gravity, moon, transit, rng, seedOf } from '../../shared/sim/index.js';
import * as chem from '../../shared/sim/chem.js';
import { runExperiment, measurementsOnly } from '../../shared/sim/run.js';
import { EXPERIMENTS, LEVELS, sanitizeParams } from '../../shared/experiments/index.js';

test('gravity matches the textbook: ISS orbit, geostationary radius, escape', () => {
  const e = gravity.BODIES.earth;
  assert.ok(Math.abs(gravity.circularSpeed(e, e.radius + 400) - 7.67) < 0.02);
  assert.ok(Math.abs(gravity.radiusForPeriod(e, 86164) - 42164) < 10);
  const low = gravity.launch({ body: 'earth', altitude: 400, speed: 7.67 });
  assert.equal(low.outcome, 'orbit');
  assert.ok(Math.abs(low.period / 60 - 92.5) < 1, `period ${low.period / 60}`);
  assert.equal(gravity.launch({ body: 'earth', altitude: 400, speed: 5 }).outcome, 'crash');
  assert.equal(gravity.launch({ body: 'earth', altitude: 400, speed: 11.5 }).outcome, 'escape');
});

test('a symplectic orbit keeps its shape: periapsis does not drift over a lap', () => {
  const o = gravity.launch({ body: 'earth', altitude: 400, speed: 9 });
  assert.equal(o.outcome, 'orbit');
  assert.ok(Math.abs(o.periapsis - 400) < 5, `periapsis drifted to ${o.periapsis}`);
});

test('moon: angle to phase, and tonight is a real date', () => {
  assert.equal(moon.phaseOfAngle(0).id, 'new');
  assert.equal(moon.phaseOfAngle(90).id, 'first-quarter');
  assert.equal(moon.phaseOfAngle(180).id, 'full');
  assert.equal(moon.phaseOfAngle(270).id, 'last-quarter');
  assert.equal(moon.litSide(45), 'right'); assert.equal(moon.litSide(300), 'left');
  // 2000-01-21 was a full moon (lunar eclipse). Age should be ~14.8.
  const age = moon.moonAge(new Date('2000-01-21T04:40:00Z'));
  assert.ok(Math.abs(age - 14.4) < 1.2, `age ${age}`);
});

test('transit: deterministic given the seed, and the period is recoverable', () => {
  const a = transit.lightCurve({ periodDays: 3.52, depth: 0.0146, durationHours: 3.1, seed: 9 });
  const b = transit.lightCurve({ periodDays: 3.52, depth: 0.0146, durationHours: 3.1, seed: 9 });
  assert.deepEqual(a.flux, b.flux);
  const c = transit.lightCurve({ periodDays: 3.52, depth: 0.0146, durationHours: 3.1, seed: 10 });
  assert.notDeepEqual(a.flux, c.flux);
  const f = transit.findTransits(a);
  assert.ok(Math.abs(f.period - 3.52) < 0.05, `period ${f.period}`);
  assert.ok(Math.abs(f.depth - 0.0146) / 0.0146 < 0.1, `depth ${f.depth}`);
  // HD 209458 b is ~1.38 Jupiter radii
  const rp = transit.planetRadiusFromDepth(0.0146, 1.2 * transit.SOLAR_RADIUS_KM) / transit.JUPITER_RADIUS_KM;
  assert.ok(Math.abs(rp - 1.45) < 0.1, `Rp ${rp} RJ`);
});

test('rng is seeded and repeatable', () => {
  const a = rng(seedOf('x')); const b = rng(seedOf('x'));
  assert.equal(a.next(), b.next());
  assert.notEqual(rng(seedOf('x')).next(), rng(seedOf('y')).next());
});

test('every experiment runs at every level and the result has every measured field', () => {
  for (const e of EXPERIMENTS) for (const l of LEVELS) {
    const p = sanitizeParams(e, l, { speed: 7.8, altitude: 400, angle: 135, target: 'trappist-1b', body: 'earth' });
    const r = measurementsOnly(runExperiment(e, p, { seed: 3 }));
    for (const f of e.levels[l].measure) assert.ok(f in r, `${e.id}/${l} lacks ${f}`);
  }
});

test('sanitizeParams clamps, snaps and ignores unknown or fixed knobs', () => {
  const e = EXPERIMENTS.find((x) => x.id === 'cosmos.orbit.launch');
  const p = sanitizeParams(e, 'explore', { speed: 1e9, altitude: 5, body: 'jupiter', hack: 1 });
  assert.deepEqual(p, { body: 'earth', altitude: 400, speed: 12 });
  const q = sanitizeParams(e, 'engineer', { speed: 7.734, altitude: 999, body: 'mars' });
  assert.deepEqual(q, { body: 'mars', altitude: 1000, speed: 7.7 });
});

test('chemistry: solubility interpolates the table, saturation and recrystallisation follow', () => {
  assert.equal(chem.solubility('salt', 20), 35.9);
  assert.ok(Math.abs(chem.solubility('saltpetre', 50) - 86.45) < 0.01, 'midpoint of 40 and 60');
  const d = chem.dissolve({ solute: 'alum', grams: 40, tempC: 20 });
  assert.deepEqual(d, { dissolved: 11.4, left: 28.6, saturated: true, limit: 11.4 });
  assert.equal(chem.dissolve({ solute: 'sugar', grams: 100, tempC: 20 }).saturated, false);
  assert.equal(chem.recrystallize({ solute: 'alum', grams: 60, fromC: 60, toC: 20 }).crystals, 46);
});

test('chemistry: indicators follow pH, and the candle follows the oxygen', () => {
  assert.deepEqual(chem.testLiquid({ liquid: 'lemon', indicator: 'btb' }), { pH: 2.3, kind: 'acid', color: 'yellow' });
  assert.equal(chem.testLiquid({ liquid: 'water', indicator: 'cabbage' }).color, 'purple');
  assert.equal(chem.testLiquid({ liquid: 'naoh', indicator: 'phenol' }).color, 'pink');
  assert.equal(chem.testLiquid({ liquid: 'sea', indicator: 'litmus' }).color, 'blue');
  const air1 = chem.candle({ litres: 1 });
  assert.equal(air1.seconds, 20); assert.equal(air1.limewater, 'cloudy');
  assert.equal(chem.candle({ litres: 2 }).seconds, 40, 'twice the jar, twice the time');
  assert.equal(chem.candle({ litres: 1, candles: 2 }).seconds, 10, 'two candles, half the time');
  assert.equal(chem.candle({ litres: 1, o2: 0.16 }).seconds, 0, 'used air: it goes straight out');
  assert.equal(chem.neutralise({ cA: 0.1, vA: 10, cB: 0.2 }).vB, 5);
});
