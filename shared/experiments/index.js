// Loads and checks the experiment definitions. Shared by browser and server.
//
// An experiment is data (see the JSON files beside this). The server runs the sim to
// judge; the page runs the same sim to show. Both read the same definition, so the
// knobs a child sees are exactly the knobs the judge expects. A broken definition
// throws here, at load, not in a lesson.
//
// Rule: nothing in these files is an answer. Answers are computed by the sim.

import moonPhases from './moon-phases.json' with { type: 'json' };
import orbitLaunch from './orbit-launch.json' with { type: 'json' };
import exoplanetHunter from './exoplanet-hunter.json' with { type: 'json' };
import solubility from './solubility.json' with { type: 'json' };
import acidBase from './acid-base.json' with { type: 'json' };
import candle from './candle.json' with { type: 'json' };
import forcePendulum from './force-pendulum.json' with { type: 'json' };
import forceRamp from './force-ramp.json' with { type: 'json' };
import forceLever from './force-lever.json' with { type: 'json' };
import lifeMeadow from './life-meadow.json' with { type: 'json' };
import lifePlant from './life-plant.json' with { type: 'json' };
import lifeHeart from './life-heart.json' with { type: 'json' };
import earthQuake from './earth-quake.json' with { type: 'json' };
import earthTsunami from './earth-tsunami.json' with { type: 'json' };
import earthCloud from './earth-cloud.json' with { type: 'json' };
import makerBridge from './maker-bridge.json' with { type: 'json' };
import makerCircuit from './maker-circuit.json' with { type: 'json' };
import makerGears from './maker-gears.json' with { type: 'json' };
import dataDice from './data-dice.json' with { type: 'json' };
import dataPond from './data-pond.json' with { type: 'json' };
import dataClassify from './data-classify.json' with { type: 'json' };

export const LEVELS = ['explore', 'investigate', 'engineer'];
export const POWERS = [
  { id: 'predict', en: 'Predict', ja: 'よそうする' },
  { id: 'measure', en: 'Measure', ja: 'はかる' },
  { id: 'data', en: 'Read data', ja: 'データを よむ' },
  { id: 'explain', en: 'Explain', ja: 'せつめいする' },
  { id: 'build', en: 'Build', ja: 'つくる' },
];
const SIMS = new Set(['moon', 'gravity', 'transit', 'solubility', 'acidbase', 'candle', 'pendulum', 'ramp', 'lever', 'meadow', 'plant', 'heart', 'quake', 'tsunami', 'cloud', 'bridge', 'circuit', 'gears', 'dice', 'pond', 'classify']);

function check(e) {
  const bad = (why) => { throw new Error(`experiment ${e?.id || '?'}: ${why}`); };
  if (!/^[a-z0-9.-]+$/.test(e.id || '')) bad('id');
  if (!SIMS.has(e.sim)) bad(`unknown sim ${e.sim}`);
  if (!e.title?.en || !e.title?.ja) bad('title needs en and ja');
  if (!e.params || typeof e.params !== 'object') bad('params');
  for (const [k, p] of Object.entries(e.params)) {
    if (p.choices) { if (!Array.isArray(p.choices) || !p.choices.length) bad(`param ${k} choices`); }
    else if (!(Number.isFinite(p.min) && Number.isFinite(p.max) && p.step > 0 && p.min < p.max)) bad(`param ${k} range`);
  }
  if (!e.levels) bad('levels');
  for (const l of LEVELS) {
    const lv = e.levels[l];
    if (!lv) bad(`level ${l} missing`);
    if (!lv.predict || !['choice', 'number'].includes(lv.predict.kind)) bad(`level ${l} predict`);
    if (lv.predict.kind === 'choice' && !(lv.predict.choices?.length >= 2)) bad(`level ${l} choices`);
    if (lv.predict.kind === 'number' && !(lv.predict.tolerance > 0)) bad(`level ${l} tolerance`);
    if (!Array.isArray(lv.measure) || !lv.measure.length) bad(`level ${l} measure`);
    for (const k of Object.keys(lv.fixed || {})) if (!e.params[k]) bad(`level ${l} fixes unknown param ${k}`);
  }
  if (!Array.isArray(e.explain?.aims) || !e.explain.aims.length) bad('explain aims');
  for (const a of e.explain.aims) {
    if (!a.id || !a.en || !a.ja) bad(`aim ${a.id}`);
    if (!Array.isArray(a.keys) || !a.keys.length || !a.keys.every((g) => Array.isArray(g) && g.length)) bad(`aim ${a.id} keys`);
  }
  if (!e.classPlot?.x || !e.classPlot?.y) bad('classPlot');
  if (!e.powers || POWERS.some((p) => !Number.isInteger(e.powers[p.id]))) bad('powers');
  return e;
}

export const EXPERIMENTS = [moonPhases, orbitLaunch, exoplanetHunter, solubility, acidBase, candle, forcePendulum, forceRamp, forceLever, lifeMeadow, lifePlant, lifeHeart, earthQuake, earthTsunami, earthCloud, makerBridge, makerCircuit, makerGears, dataDice, dataPond, dataClassify].map(check);
export const REGIONS = [
  { id: 'cosmos', en: 'COSMOS', ja: 'そらの しま', icon: '🚀' },
  { id: 'lab', en: 'LAB', ja: 'かがくの しま', icon: '🧪' },
  { id: 'force', en: 'FORCE', ja: 'ちからの しま', icon: '🎢' },
  { id: 'life', en: 'LIFE', ja: 'いのちの しま', icon: '🌱' },
  { id: 'earth', en: 'EARTH', ja: 'ちきゅうの しま', icon: '🌋' },
  { id: 'maker', en: 'MAKER', ja: 'つくる しま', icon: '🔧' },
  { id: 'data', en: 'DATA', ja: 'データの しま', icon: '🎲' },
];
export const EXPERIMENT_BY_ID = Object.fromEntries(EXPERIMENTS.map((e) => [e.id, e]));

// The parameters a given level actually lets a child change (fixed ones are hidden).
export function freeParams(e, level) {
  const fixed = e.levels[level]?.fixed || {};
  return Object.fromEntries(Object.entries(e.params).filter(([k]) => !(k in fixed)));
}

// Clamp and snap a child's chosen parameters to what the definition allows. Both
// sides do this, so a page cannot send a speed of 10^9 and the server never sees one.
export function sanitizeParams(e, level, raw) {
  const out = { ...(e.levels[level]?.fixed || {}) };
  for (const [k, p] of Object.entries(freeParams(e, level))) {
    const v = raw?.[k];
    if (p.choices) out[k] = p.choices.includes(v) ? v : p.choices[0];
    else {
      const n = Number(v);
      const c = Number.isFinite(n) ? Math.min(p.max, Math.max(p.min, n)) : p.min;
      out[k] = Math.round((c - p.min) / p.step) * p.step + p.min;
      out[k] = Math.round(out[k] * 1e6) / 1e6;
    }
  }
  return out;
}
