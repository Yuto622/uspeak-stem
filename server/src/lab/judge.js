// The judge. Everything a child claims is checked here, by running the science again.
//
// Three things are judged, and each one works the same way: the server computes the
// truth from the parameters, then compares. A page is never asked "did you get it
// right?" — it is asked "what did you predict?" before the run, and "what did you
// measure?" after, and the difference between its answer and the recomputation is
// the score.
//
// 1. Prediction: a choice (crash / orbit / escape) or a number with a tolerance.
// 2. Measurement: what the page reports it read off the instrument, against what the
//    same sim produces on the server. Agreeing is the normal case; disagreeing means
//    the page did not run the sim it was given, or a child typed a number.
// 3. Explanation: an English sentence against the aims (key-word groups), the same
//    scripted matcher the English product uses when no AI key is set. The AI tutor
//    can replace this later without changing the room.

import { runExperiment, measurementsOnly, dipsBucket } from '../../../shared/sim/run.js';

// Read a measurement field off a result, including the derived ones a level may ask
// for (the Explore level of the exoplanet hunter predicts a bucket, not a count).
function fieldOf(result, field) {
  if (field === 'dips' && typeof result.dips === 'number') return result.dips;
  return result[field];
}

function closeEnough(got, want, tolerance) {
  if (got === null || want === null || got === undefined || want === undefined) return false;
  const g = Number(got); const w = Number(want);
  if (!Number.isFinite(g) || !Number.isFinite(w)) return false;
  if (w === 0) return Math.abs(g) <= tolerance;
  return Math.abs(g - w) / Math.abs(w) <= tolerance;
}

// Run the truth for this experiment, level, and parameters.
export function truthFor(exp, level, params, seed) {
  const result = runExperiment(exp, params, { seed });
  return { result, measurements: measurementsOnly(result) };
}

// Judge a prediction made BEFORE the run.
export function judgePrediction(exp, level, prediction, truth) {
  const spec = exp.levels[level].predict;
  const want = fieldOf(truth, spec.field);
  if (spec.kind === 'choice') {
    const wantChoice = spec.field === 'dips' ? dipsBucket(want) : String(want);
    const got = String(prediction ?? '');
    return { ok: spec.choices.includes(got) && got === wantChoice, want: wantChoice, got };
  }
  // number: the page predicts in the unit the level shows (minutes, %, days, Earths).
  let w = want;
  if (spec.field === 'lit') w = want * 100; // the page shows a percentage
  const got = Number(prediction);
  return { ok: closeEnough(got, w, spec.tolerance), want: w === null ? null : Math.round(w * 100) / 100, got: Number.isFinite(got) ? got : null };
}

// Judge what the page says it measured against what the server measured.
// `fields` is the level's measure list. Every field must agree.
export function judgeMeasurement(exp, level, reported, truth) {
  const fields = exp.levels[level].measure;
  const wrong = [];
  for (const f of fields) {
    const want = fieldOf(truth, f);
    const got = reported?.[f];
    if (typeof want === 'number') { if (!closeEnough(got, want, 0.02)) wrong.push(f); }
    else if (String(got ?? '') !== String(want ?? '')) wrong.push(f);
  }
  return { ok: wrong.length === 0, wrong };
}

// Judge an explanation in English against the aims. Each aim is a list of key groups;
// an aim is met when every group has at least one of its words in the text. Lower-case
// word-boundary matching, so "pulls" matches "pull" only when listed — the lists carry
// the forms a child actually writes.
export function judgeExplanation(exp, text) {
  const words = new Set(String(text || '').toLowerCase().replace(/[^a-z' ]+/g, ' ').split(/\s+/).filter(Boolean));
  const met = [];
  for (const aim of exp.explain.aims) {
    const ok = aim.keys.every((group) => group.some((k) => words.has(k.toLowerCase())));
    if (ok) met.push(aim.id);
  }
  // Too short to be an explanation, whatever it hit.
  const enough = words.size >= 4;
  return { met: enough ? met : [], total: exp.explain.aims.length, enough };
}

// Points toward the five powers for one completed trial. Small numbers, added up over
// a term; the radar on the report normalises them.
export function powersEarned(exp, level, { prediction, measurement, explanation, recorded }) {
  const base = exp.powers;
  const out = { predict: 0, measure: 0, data: 0, explain: 0, build: 0 };
  if (prediction?.ok) out.predict += base.predict;
  else if (prediction) out.predict += Math.ceil(base.predict / 2); // a wrong prediction, made honestly, is still science
  if (measurement?.ok) out.measure += base.measure;
  if (recorded) out.data += base.data;
  if (explanation && explanation.met.length) out.explain += Math.round((base.explain * explanation.met.length) / explanation.total * 10) / 10;
  if (level === 'engineer' && measurement?.ok) out.build += base.build;
  return out;
}
