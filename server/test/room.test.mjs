// The room over a real socket: order enforced, teacher-only level, class data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

process.env.TEACHER_KEY = 'test-teacher-key-123';
process.env.DATA_DIR = mkdtempSync(path.join(tmpdir(), 'stem-'));
const { startServer } = await import('../src/index.js');
const { Client } = await import('colyseus.js');

const PORT = 2591;
const srv = await startServer({ port: PORT });
const client = new Client(`ws://localhost:${PORT}`);

function next(room, type, { timeout = 5000 } = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout ${type}`)), timeout);
    room.onMessage(type, (m) => { clearTimeout(timer); resolve(m); });
  });
}

test('a result is only sent after a prediction, and the prediction cannot change', async () => {
  const room = await client.joinOrCreate('lab', { name: 'Hikari', classCode: 'T1' });
  const hello = await next(room, 'lab:hello');
  assert.equal(hello.role, 'student'); assert.equal(hello.level, 'explore');
  room.send('lab:start', { exp: 'cosmos.orbit.launch', params: { speed: 7.7, altitude: 400, body: 'jupiter' } });
  const ready = await next(room, 'lab:ready');
  assert.equal(ready.params.body, 'earth', 'explore fixes the body');
  // measuring before predicting is refused
  const err = next(room, 'lab:error');
  room.send('lab:measure', { trialId: ready.trialId, reported: { outcome: 'orbit' } });
  assert.equal((await err).reason, 'predict first');
  room.send('lab:predict', { trialId: ready.trialId, prediction: 'orbit' });
  const res = await next(room, 'lab:result');
  assert.equal(res.prediction.ok, true); assert.equal(res.result.outcome, 'orbit'); assert.ok(res.result.trail.length > 10);
  const err2 = next(room, 'lab:error');
  room.send('lab:predict', { trialId: ready.trialId, prediction: 'crash' });
  assert.equal((await err2).reason, 'already predicted');
  // forged measurement
  room.send('lab:measure', { trialId: ready.trialId, reported: { outcome: 'crash' } });
  const j = await next(room, 'lab:judged');
  assert.equal(j.measurement.ok, false);
  assert.equal(j.powers.measure, 0); assert.equal(j.powers.predict, 1);
  await room.leave();
});

test('only the teacher sets the depth, and it reaches everyone; investigate records class points', async () => {
  const kid = await client.joinOrCreate('lab', { name: 'Sora', classCode: 'T2' });
  await next(kid, 'lab:hello');
  const errP = next(kid, 'lab:error');
  kid.send('teacher:level', { level: 'engineer' });
  assert.equal((await errP).reason, 'teacher only');
  const teacher = await client.joinOrCreate('lab', { name: 'Ms. Sato', classCode: 'T2', teacherKey: 'test-teacher-key-123' });
  const th = await next(teacher, 'lab:hello'); assert.equal(th.role, 'teacher');
  const lvl = next(kid, 'lab:level');
  teacher.send('teacher:level', { level: 'investigate' });
  assert.equal((await lvl).level, 'investigate');
  // a full trial at investigate adds a class point that the teacher also receives
  kid.send('lab:start', { exp: 'cosmos.orbit.launch', params: { speed: 8, altitude: 600 } });
  const ready = await next(kid, 'lab:ready'); assert.equal(ready.level, 'investigate');
  kid.send('lab:predict', { trialId: ready.trialId, prediction: 'orbit' });
  const res = await next(kid, 'lab:result');
  const cls = next(teacher, 'lab:class');
  kid.send('lab:measure', { trialId: ready.trialId, reported: { outcome: res.result.outcome, period: res.result.period } });
  const j = await next(kid, 'lab:judged');
  assert.equal(j.measurement.ok, true); assert.equal(j.recorded, true);
  const c = await cls;
  assert.equal(c.exp, 'cosmos.orbit.launch'); assert.equal(c.points.length, 1); assert.equal(c.points[0].x, 8); assert.equal(c.points[0].who, 'Sora');
  // explanation
  kid.send('lab:explain', { trialId: ready.trialId, text: 'Gravity pulls it but it falls around because the ground curves away' });
  const ex = await next(kid, 'lab:explained');
  assert.deepEqual(ex.met, ['gravity-pulls', 'falls-around']);
  assert.ok(ex.powers.explain > 0);
  await kid.leave(); await teacher.leave();
});

test('a wrong teacher key is a student', async () => {
  const r = await client.joinOrCreate('lab', { name: 'X', classCode: 'T3', teacherKey: 'nope' });
  const h = await next(r, 'lab:hello'); assert.equal(h.role, 'student');
  await r.leave();
});

test.after(async () => { await srv.close(); });
