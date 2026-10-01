// One class, one room. Everyone in it sees the same island and the same class data.
//
// The order of a trial is the whole point and the room enforces it:
//
//   lab:start   { exp, params }          -> lab:ready   { trialId, params }   (no result yet)
//   lab:predict { trialId, prediction }  -> lab:result  { measurements, ... } (only now)
//   lab:measure { trialId, reported }    -> lab:judged  { measurement ok?, powers }
//   lab:explain { trialId, text }        -> lab:explained { aims met }
//
// A page cannot get the result before it has predicted, because the result message is
// sent in reply to the prediction. The prediction is stored with the trial before the
// truth is revealed, so it cannot be edited afterwards. That is the one rule that turns
// a simulation into an experiment.
//
// The teacher sets the depth for the class (explore / investigate / engineer). A page
// that sends a level is ignored; the room's level is the one used to judge.

import { Room } from '../colyseus.js';
import { EXPERIMENT_BY_ID, LEVELS, sanitizeParams } from '../../../shared/experiments/index.js';
import { truthFor, judgePrediction, judgeMeasurement, judgeExplanation, powersEarned } from '../lab/judge.js';
import { seedOf } from '../../../shared/sim/rng.js';
import { config } from '../config.js';
import { createRecords } from '../lab/records.js';

const MAX_TRIALS_PER_PLAYER = 400;      // a lesson's worth, with room for a keen child
const EXPLAIN_MAX = 400;                // characters

function clean(s, n = 24) { return String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n); }

export class LabRoom extends Room {
  onCreate(options) {
    this.maxClients = config.maxClassSize;
    this.classCode = clean(options.classCode, 32) || 'demo';
    this.level = 'explore';
    this.players = new Map();   // sessionId -> { name, role, trials: Map, powers }
    this.classData = new Map(); // expId -> [{ x, y, who }]
    this.records = createRecords(config.dataDir, this.classCode);
    this.setMetadata({ classCode: this.classCode });

    this.onMessage('lab:start', (client, m) => this.start(client, m));
    this.onMessage('lab:predict', (client, m) => this.predict(client, m));
    this.onMessage('lab:measure', (client, m) => this.measure(client, m));
    this.onMessage('lab:explain', (client, m) => this.explain(client, m));
    this.onMessage('lab:real', (client, m) => this.real(client, m));
    this.onMessage('teacher:level', (client, m) => this.setLevel(client, m));
    this.onMessage('pos', (client, m) => this.pos(client, m));
  }

  onJoin(client, options) {
    const name = clean(options.name) || 'Explorer';
    const role = config.teacherKey && options.teacherKey === config.teacherKey ? 'teacher' : 'student';
    const saved = this.records.load(name);
    this.players.set(client.sessionId, { name, role, trials: new Map(), powers: saved.powers, pos: { x: 0, z: 0 } });
    client.send('lab:hello', { role, level: this.level, name, powers: saved.powers, classCode: this.classCode });
    for (const [exp, points] of this.classData) client.send('lab:class', { exp, points });
    this.broadcastRoster();
  }

  onLeave(client) {
    this.players.delete(client.sessionId);
    this.broadcastRoster();
  }

  broadcastRoster() {
    const list = [...this.players.entries()].map(([id, p]) => ({ id, name: p.name, role: p.role, pos: p.pos }));
    this.broadcast('roster', { players: list, level: this.level });
  }

  pos(client, m) {
    const p = this.players.get(client.sessionId);
    if (!p) return;
    const x = Number(m?.x); const z = Number(m?.z);
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    p.pos = { x: Math.max(-80, Math.min(80, x)), z: Math.max(-80, Math.min(80, z)) };
    this.broadcast('pos', { id: client.sessionId, x: p.pos.x, z: p.pos.z }, { except: client });
  }

  setLevel(client, m) {
    const p = this.players.get(client.sessionId);
    if (!p || p.role !== 'teacher') return client.send('lab:error', { reason: 'teacher only' });
    if (!LEVELS.includes(m?.level)) return client.send('lab:error', { reason: 'bad level' });
    this.level = m.level;
    this.broadcast('lab:level', { level: this.level });
    this.broadcastRoster();
  }

  start(client, m) {
    const p = this.players.get(client.sessionId);
    const exp = EXPERIMENT_BY_ID[m?.exp];
    if (!p || !exp) return client.send('lab:error', { reason: 'unknown experiment' });
    if (p.trials.size >= MAX_TRIALS_PER_PLAYER) return client.send('lab:error', { reason: 'enough for today' });
    const level = this.level; // the room's, never the page's
    const params = sanitizeParams(exp, level, m?.params);
    const trialId = `${Date.now().toString(36)}-${p.trials.size}`;
    const seed = seedOf(`${this.classCode}|${p.name}|${trialId}`);
    p.trials.set(trialId, { exp: exp.id, level, params, seed, prediction: null, at: Date.now() });
    client.send('lab:ready', { trialId, exp: exp.id, level, params });
  }

  predict(client, m) {
    const p = this.players.get(client.sessionId);
    const t = p?.trials.get(m?.trialId);
    if (!t) return client.send('lab:error', { reason: 'no trial' });
    if (t.prediction !== null) return client.send('lab:error', { reason: 'already predicted' });
    const exp = EXPERIMENT_BY_ID[t.exp];
    const spec = exp.levels[t.level].predict;
    const raw = spec.kind === 'choice' ? clean(m?.prediction, 32) : Number(m?.prediction);
    if (spec.kind === 'choice' && !spec.choices.includes(raw)) return client.send('lab:error', { reason: 'bad prediction' });
    if (spec.kind === 'number' && !Number.isFinite(raw)) return client.send('lab:error', { reason: 'bad prediction' });
    t.prediction = raw;
    // Only now is the truth computed and sent.
    const { result, measurements } = truthFor(exp, t.level, t.params, t.seed);
    t.truth = measurements;
    t.predictionJudged = judgePrediction(exp, t.level, raw, measurements);
    client.send('lab:result', {
      trialId: m.trialId,
      prediction: t.predictionJudged,
      // The page gets the drawing data and the measurements the instrument shows. The
      // judge still asks the page to report them back, so a page that skips the reading
      // gets no measure points.
      result,
    });
  }

  measure(client, m) {
    const p = this.players.get(client.sessionId);
    const t = p?.trials.get(m?.trialId);
    if (!t || !t.truth) return client.send('lab:error', { reason: 'predict first' });
    if (t.measured) return client.send('lab:error', { reason: 'already measured' });
    const exp = EXPERIMENT_BY_ID[t.exp];
    t.measured = judgeMeasurement(exp, t.level, m?.reported, t.truth);
    const lv = exp.levels[t.level];
    let recorded = false;
    if (lv.record && t.measured.ok) {
      const plot = exp.classPlot;
      const x = t.params[plot.x] ?? t.truth[plot.x];
      const y = t.truth[plot.y] ?? t.params[plot.y];
      if (Number.isFinite(Number(x)) && Number.isFinite(Number(y))) {
        const pts = this.classData.get(exp.id) || [];
        pts.push({ x: Number(x), y: Number(y), who: p.name });
        if (pts.length > 600) pts.shift();
        this.classData.set(exp.id, pts);
        this.broadcast('lab:class', { exp: exp.id, points: pts });
        recorded = true;
      }
    }
    t.recorded = recorded;
    this.award(p, exp, t);
    client.send('lab:judged', { trialId: m.trialId, measurement: t.measured, recorded, powers: p.powers });
  }

  explain(client, m) {
    const p = this.players.get(client.sessionId);
    const t = p?.trials.get(m?.trialId);
    if (!t || !t.truth) return client.send('lab:error', { reason: 'predict first' });
    const exp = EXPERIMENT_BY_ID[t.exp];
    const text = String(m?.text ?? '').slice(0, EXPLAIN_MAX);
    const judged = judgeExplanation(exp, text);
    // Keep the best attempt; a child may try several sentences.
    if (!t.explanation || judged.met.length > t.explanation.met.length) t.explanation = judged;
    this.award(p, exp, t);
    this.records.log(p.name, { exp: exp.id, level: t.level, kind: 'explain', text, met: judged.met });
    client.send('lab:explained', { trialId: m.trialId, met: judged.met, total: judged.total, enough: judged.enough, powers: p.powers });
  }

  // A real-world observation typed in by a child or a parent: "tonight the Moon was a
  // crescent". Not judged (we cannot see their sky), but recorded and worth a point for
  // looking up.
  real(client, m) {
    const p = this.players.get(client.sessionId);
    const exp = EXPERIMENT_BY_ID[m?.exp];
    if (!p || !exp) return;
    const value = clean(m?.value, 64);
    if (!value) return;
    this.records.log(p.name, { exp: exp.id, kind: 'real', value });
    p.powers.measure += 1;
    this.records.save(p.name, { powers: p.powers });
    client.send('lab:real-ok', { exp: exp.id, powers: p.powers });
  }

  // Points are awarded once per trial, recomputed from what the trial has so far, so a
  // child who explains after measuring gets the explain points added, not doubled.
  award(p, exp, t) {
    const now = powersEarned(exp, t.level, { prediction: t.predictionJudged, measurement: t.measured, explanation: t.explanation, recorded: t.recorded });
    const before = t.awarded || { predict: 0, measure: 0, data: 0, explain: 0, build: 0 };
    for (const k of Object.keys(now)) p.powers[k] = Math.round((p.powers[k] + now[k] - before[k]) * 10) / 10;
    t.awarded = now;
    this.records.save(p.name, { powers: p.powers });
    this.records.log(p.name, { exp: exp.id, level: t.level, kind: 'trial', params: t.params, prediction: t.prediction, predicted: t.predictionJudged?.ok, measured: t.measured?.ok });
  }
}
