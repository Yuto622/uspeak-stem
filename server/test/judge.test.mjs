import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPERIMENT_BY_ID } from '../../shared/experiments/index.js';
import { truthFor, judgePrediction, judgeMeasurement, judgeExplanation, powersEarned } from '../src/lab/judge.js';

const orbit = EXPERIMENT_BY_ID['cosmos.orbit.launch'];
const moon = EXPERIMENT_BY_ID['cosmos.moon.phases'];
const exo = EXPERIMENT_BY_ID['cosmos.exoplanet.hunter'];

test('prediction: choice and number, with tolerance', () => {
  const { measurements } = truthFor(orbit, 'explore', { body: 'earth', altitude: 400, speed: 7.7 }, 1);
  assert.equal(judgePrediction(orbit, 'explore', 'orbit', measurements).ok, true);
  assert.equal(judgePrediction(orbit, 'explore', 'crash', measurements).ok, false);
  assert.equal(judgePrediction(orbit, 'explore', 'DROP TABLE', measurements).ok, false);
  const eng = truthFor(orbit, 'engineer', { body: 'earth', altitude: 400, speed: 7.7 }, 1).measurements;
  assert.equal(judgePrediction(orbit, 'engineer', 93, eng).ok, true);
  assert.equal(judgePrediction(orbit, 'engineer', 120, eng).ok, false);
  const m = truthFor(moon, 'engineer', { angle: 90 }, 1).measurements;
  assert.equal(judgePrediction(moon, 'engineer', 50, m).ok, true, 'lit is judged as a percentage');
  const x = truthFor(exo, 'explore', { target: 'hd-209458-b' }, 1).measurements;
  assert.equal(judgePrediction(exo, 'explore', '4-9', x).ok, true, `dips ${x.dips}`);
});

test('measurement must match the server recomputation', () => {
  const { measurements } = truthFor(orbit, 'investigate', { body: 'earth', altitude: 400, speed: 7.7 }, 1);
  assert.equal(judgeMeasurement(orbit, 'investigate', { outcome: 'orbit', period: measurements.period }, measurements).ok, true);
  const forged = judgeMeasurement(orbit, 'investigate', { outcome: 'orbit', period: 10 }, measurements);
  assert.equal(forged.ok, false); assert.deepEqual(forged.wrong, ['period']);
});

test('explanation: aims need every key group, and a few words is not enough', () => {
  const r = judgeExplanation(orbit, 'Gravity pulls the ball down so it falls, but it is going so fast that the ground curves away, and if it goes faster it escapes.');
  assert.deepEqual(r.met, ['gravity-pulls', 'falls-around', 'speed-matters']);
  assert.deepEqual(judgeExplanation(orbit, 'gravity').met, []);
  assert.equal(judgeExplanation(orbit, 'gravity').enough, false);
  assert.deepEqual(judgeExplanation(moon, 'The sun lights half of the moon and we see part of it from the earth').met, ['sun-lights', 'we-see-part']);
});

test('powers: honest wrong prediction still earns, engineer earns build', () => {
  const a = powersEarned(orbit, 'engineer', { prediction: { ok: true }, measurement: { ok: true }, explanation: { met: ['a', 'b', 'c'], total: 3 }, recorded: true });
  assert.deepEqual(a, { predict: 1, measure: 1, data: 1, explain: 1, build: 1 });
  const b = powersEarned(orbit, 'explore', { prediction: { ok: false }, measurement: { ok: false }, explanation: null, recorded: false });
  assert.deepEqual(b, { predict: 1, measure: 0, data: 0, explain: 0, build: 0 });
});
