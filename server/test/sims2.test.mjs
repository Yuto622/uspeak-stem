import test from 'node:test';
import assert from 'node:assert/strict';
import * as force from '../../shared/sim/force.js';
import * as life from '../../shared/sim/life.js';
import * as earth from '../../shared/sim/earth.js';
import * as maker from '../../shared/sim/maker.js';
import * as data from '../../shared/sim/data.js';

test('force: a 1 m pendulum ticks in 2 s, friction holds a shallow ramp, levers balance by moment', () => {
  assert.ok(Math.abs(force.pendulum({ length: 1, angle: 10 }).period - 2.0) < 0.03);
  assert.equal(force.pendulum({ length: 0.25, angle: 10 }).period, 1.0);
  assert.equal(force.ramp({ angle: 10, surface: 'rubber' }).moves, 'stays');
  assert.equal(force.ramp({ angle: 30, surface: 'ice' }).moves, 'slides');
  assert.ok(force.ramp({ angle: 45, surface: 'ice' }).speed > force.ramp({ angle: 20, surface: 'ice' }).speed);
  assert.deepEqual(force.lever({ leftMass: 4, leftDist: 1, rightMass: 2, rightDist: 2 }).tilt, 'balanced');
  assert.equal(force.lever({ leftMass: 10, leftDist: 0.4, rightMass: 2, rightDist: 2 }).tilt, 'balanced', 'a 2 kg child lifts 10 kg from 5x the distance');
});

test('life: predator and prey cycle, a plant needs water and light, the heart answers effort', () => {
  const m = life.meadow({ rabbits: 100, foxes: 10, grass: 'medium' });
  assert.equal(m.fate, 'both-live'); assert.ok(m.cycles >= 1); assert.ok(m.rabbitPeak > 100);
  assert.equal(life.meadow({ rabbits: 100, foxes: 0 }).fate, 'foxes-die');
  assert.equal(life.plant({ water: 0, light: 'sun', tempC: 20 }).alive, 'wilts');
  assert.ok(life.plant({ water: 2, light: 'sun', tempC: 22 }).height > life.plant({ water: 2, light: 'dark', tempC: 22 }).height);
  assert.ok(life.plant({ water: 4, light: 'sun', tempC: 22 }).height < life.plant({ water: 2, light: 'sun', tempC: 22 }).height, 'too much water');
  assert.ok(life.heart({ activity: 'sprint', minutes: 3 }).bpm > life.heart({ activity: 'walk', minutes: 3 }).bpm);
  assert.equal(life.heart({ activity: 'rest', minutes: 3 }).faster, 'same');
});

test('earth: S-P gap gives distance, tsunami speed is sqrt(g h), dew point matches the chart', () => {
  const q = earth.quake({ distance: 84 });
  assert.ok(Math.abs(q.gap - 10) < 0.1, 'the 8.4 rule: 10 s gap ~ 84 km');
  assert.equal(q.distanceFromGap, 84);
  assert.ok(Math.abs(earth.tsunami({ depth: 4000, distance: 1000 }).speedKmh - 713) < 5);
  assert.equal(earth.tsunami({ depth: 100, distance: 100 }).height, 'high');
  const c = earth.cloud({ tempC: 25, humidity: 60 });
  assert.ok(Math.abs(c.dewPoint - 16.7) < 0.3); assert.ok(Math.abs(c.cloudBase - 1040) < 40);
  assert.equal(earth.cloud({ tempC: 20, humidity: 100 }).cloudBase, 0);
});

test('maker: beams, Ohm, gears', () => {
  const thin = maker.bridge({ span: 2, material: 'wood', thickness: 2, load: 50 });
  const thick = maker.bridge({ span: 2, material: 'wood', thickness: 4, load: 50 });
  assert.ok(Math.abs(thin.sagMm / thick.sagMm - 8) < 0.2, 'twice as thick, eight times stiffer');
  assert.equal(maker.bridge({ span: 5, material: 'plastic', thickness: 1, load: 500 }).holds, 'breaks');
  assert.equal(maker.circuit({ volts: 3, resistance: 100, bulbs: 1 }).mA, 25);
  assert.equal(maker.circuit({ volts: 9, resistance: 430, bulbs: 1 }).mA, 20);
  assert.deepEqual(maker.gears({ driverTeeth: 20, drivenTeeth: 10, rpm: 60 }).outRpm, 120);
  assert.equal(maker.gears({ driverTeeth: 8, drivenTeeth: 40, rpm: 60 }).torqueRatio, 5);
});

test('data: seeded dice, capture-recapture, k-NN', () => {
  const d = data.dice({ count: 2, rolls: 1000, seed: 11 });
  assert.equal(d.mode, 7); assert.ok(Math.abs(d.mean - 7) < 0.25); assert.ok(d.sevenPercent > 12 && d.sevenPercent < 22);
  assert.deepEqual(data.dice({ count: 2, rolls: 100, seed: 5 }).hist, data.dice({ count: 2, rolls: 100, seed: 5 }).hist, 'same seed, same rolls');
  const p = data.pond({ marked: 40, caught: 40, seed: 3 });
  assert.ok(p.truth >= 60 && p.truth < 300); assert.ok(p.estimate === null || p.error >= 0);
  const c = data.classify({ weight: 140, color: 0.3, k: 5, seed: 1 });
  assert.equal(c.label, 'apple'); assert.ok(c.accuracy > 85);
  assert.equal(data.classify({ weight: 200, color: 0.9, k: 5, seed: 1 }).label, 'orange');
});
