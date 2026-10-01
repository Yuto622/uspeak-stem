// The experiment panel: set → predict → run → measure → explain, plus the class plot.
//
// The page runs the shared sim to draw, but it draws only after the room has sent the
// result — which the room does only after a prediction is locked. The page never
// computes a result to show before that, so a child cannot peek.

import { t, both, esc, UI, isJa, onLang, toggleLang } from './i18n.js';
import { EXPERIMENT_BY_ID, freeParams, sanitizeParams, POWERS } from '/shared/experiments/index.js';
import { gravity, moon } from '/shared/sim/index.js';
import * as chem from '/shared/sim/chem.js';
import * as force from '/shared/sim/force.js';
import * as life from '/shared/sim/life.js';
import * as maker from '/shared/sim/maker.js';
import { dipsBucket } from '/shared/sim/run.js';
import { drawClass, drawPowers } from './draw.js';
import { createStage } from './stage.js';
import { ask } from './net.js';

const $ = (s, r = document) => r.querySelector(s);

export function createPanels({ net, toast, me, onDone = () => {} }) {
  const dlg = $('#lab');
  const classPoints = new Map(); // expId -> points
  let state = null; // { exp, level, params, trialId, result, step }

  net.on('lab:class', (m) => { classPoints.set(m.exp, m.points); if (state?.exp.id === m.exp) drawClassPlot(); });

  function setStep(step) {
    const order = ['set', 'predict', 'run', 'measure', 'explain'];
    const i = order.indexOf(step);
    for (const li of dlg.querySelectorAll('.steps li')) {
      const j = order.indexOf(li.dataset.step);
      li.classList.toggle('done', j < i); li.classList.toggle('now', j === i);
    }
    state.step = step;
    for (const id of ['params', 'predict', 'measure', 'explain', 'real']) $(`#lab-${id}`).hidden = true;
  }

  let stage = null;
  function drawView() {
    const { exp, params, result } = state;
    if (!stage) stage = createStage($('#lab-canvas'));
    stage.show({ exp, params, result });
    $('#lab-replay').hidden = !result;
    const ro = $('#lab-readout');
    if (!result) { ro.innerHTML = ''; return; }
    const lv = exp.levels[state.level];
    ro.innerHTML = lv.measure.map((f) => `<b>${esc(labelFor(f))}: ${esc(showValue(f, result[f]))}</b>`).join('');
  }

  // A few field names mean different things on different islands (a pendulum's period
  // is seconds, an orbit's is minutes); the sim's own words win over the shared ones.
  const SIM_LABELS = {
    pendulum: { period: { en: 'Seconds per swing', ja: '1かいの びょう' }, bucket: { en: 'How long is one swing?', ja: '1かいは どれくらい？' } },
    pond: { bucket: { en: 'Fewer or more than 150?', ja: '150びき より すくない？ おおい？' } },
    gears: { faster: { en: 'Second gear: faster or slower?', ja: '2つめは はやい？ おそい？' } },
    tsunami: { height: { en: 'Wave height at the shore', ja: 'きしでの なみの たかさ' } },
  };
  function labelFor(f, sim = state.exp?.sim) {
    if (SIM_LABELS[sim]?.[f]) return t(SIM_LABELS[sim][f]);
    const L = {
      outcome: { en: 'What happened', ja: 'どうなった' }, period: { en: 'Minutes per orbit', ja: '1しゅうの ふん' }, apoapsis: { en: 'Highest point (km)', ja: 'いちばん たかい ところ（km）' },
      phase: { en: 'Phase', ja: 'かたち' }, lit: { en: 'Lit part', ja: 'ひかる わりあい' }, side: { en: 'Lit side', ja: 'ひかる がわ' },
      dips: { en: 'Dips', ja: 'くらくなった かいすう' },
      dissolved: { en: 'Dissolved (g)', ja: 'とけた（g）' }, left: { en: 'Left on the bottom (g)', ja: 'そこに のこった（g）' }, saturated: { en: 'Saturated?', ja: 'もう とけない？' }, limit: { en: 'Limit (g per 100 g water)', ja: 'とける かぎり（100 g の みずに）' },
      pH: { en: 'pH', ja: 'pH' }, kind: { en: 'Acid or base', ja: 'さんせい か アルカリせい か' }, color: { en: 'Colour', ja: 'いろ' },
      seconds: { en: 'Seconds until out', ja: 'きえるまでの びょう' },
      swings: { en: 'Swings in 30 s', ja: '30びょうの かいすう' }, bucket: { en: 'Fewer or more than 150?', ja: '150びき より すくない？ おおい？' },
      moves: { en: 'Does it move?', ja: 'うごく？' }, accel: { en: 'Acceleration (m/s²)', ja: 'かそくど（m/s²）' }, speed: { en: 'Speed at the bottom (m/s)', ja: 'したでの はやさ（m/s）' }, time: { en: 'Time to the bottom (s)', ja: 'したまでの びょう' },
      tilt: { en: 'Which way it tips', ja: 'どっちに かたむく' }, balanceMass: { en: 'kg to balance', ja: 'つりあう kg' }, advantage: { en: 'Lifting advantage (×)', ja: 'なんばい もちあがる' },
      fate: { en: 'After 120 days', ja: '120日の あと' }, rabbitPeak: { en: 'Most rabbits', ja: 'いちばん おおい ウサギ' }, foxPeak: { en: 'Most foxes', ja: 'いちばん おおい キツネ' }, cycles: { en: 'Ups and downs', ja: 'ふえたり へったり の かいすう' },
      height: { en: 'Height (cm)', ja: 'たかさ（cm）' }, leaves: { en: 'Leaves', ja: 'はの かず' }, alive: { en: 'Grows or wilts?', ja: 'そだつ？ しおれる？' },
      bpm: { en: 'Heartbeats per minute', ja: '1ぷんの はくどう' }, breaths: { en: 'Breaths per minute', ja: '1ぷんの こきゅう' }, recovery: { en: 'Seconds to calm down', ja: 'もどるまでの びょう' }, faster: { en: 'Faster than resting?', ja: 'やすんでいる ときより はやい？' },
      first: { en: 'Which wave first', ja: 'どっちの なみが さき' }, pSeconds: { en: 'P wave arrives (s)', ja: 'P なみ とうちゃく（びょう）' }, sSeconds: { en: 'S wave arrives (s)', ja: 'S なみ とうちゃく（びょう）' }, gap: { en: 'Gap P→S (s)', ja: 'P と S の あいだ（びょう）' }, warning: { en: 'Warning time (s)', ja: 'けいほうの じかん（びょう）' }, shaking: { en: 'Shaking (0–7)', ja: 'ゆれ（0〜7）' }, distanceFromGap: { en: 'Distance from the gap (km)', ja: 'あいだから もとめた きょり（km）' },
      speedKmh: { en: 'Speed (km/h)', ja: 'はやさ（km/h）' }, deeper: { en: 'Deep or shallow: which is faster?', ja: 'ふかい と あさい、どっちが はやい？' }, minutes: { en: 'Minutes to arrive', ja: 'つくまでの ふん' }, height: { en: 'Height (cm)', ja: 'たかさ（cm）' },
      dewPoint: { en: 'Dew point (°C)', ja: 'ろてん（°C）' }, cloudBase: { en: 'Cloud base (m)', ja: 'くもの そこ（m）' }, forms: { en: 'Cloud or clear?', ja: 'くも？ はれ？' }, rain: { en: 'Rain?', ja: 'あめ？' },
      sagMm: { en: 'Sag (mm)', ja: 'たわみ（mm）' }, holds: { en: 'Holds or breaks?', ja: 'ささえる？ おれる？' }, maxLoad: { en: 'Biggest load it holds (kg)', ja: 'ささえられる おもさ（kg）' }, stressMPa: { en: 'Stress (MPa)', ja: 'おうりょく（MPa）' },
      mA: { en: 'Current (mA)', ja: 'でんりゅう（mA）' }, brightness: { en: 'Brightness', ja: 'あかるさ' }, watts: { en: 'Power (W)', ja: 'でんりょく（W）' }, forTwenty: { en: 'Resistor for 20 mA (Ω)', ja: '20 mA にする ていこう（Ω）' },
      outRpm: { en: 'Second gear (rpm)', ja: '2つめの はやさ（rpm）' }, direction: { en: 'Direction', ja: 'むき' }, torqueRatio: { en: 'Strength (×)', ja: 'つよさ（ばい）' },
      mode: { en: 'Most common total', ja: 'いちばん おおい ごうけい' }, mean: { en: 'Average', ja: 'へいきん' }, sevenPercent: { en: 'Sevens (%)', ja: '7の わりあい（%）' },
      recaptured: { en: 'Marked fish in the catch', ja: 'しるしつきの かず' }, estimate: { en: 'Estimate', ja: 'みつもり' }, truth: { en: 'Fish in the pond', ja: 'いけの さかな' }, error: { en: 'Error (%)', ja: 'ごさ（%）' },
      label: { en: 'Apple or orange?', ja: 'りんご？ みかん？' }, confidence: { en: 'How sure (%)', ja: 'どれくらい たしか（%）' }, accuracy: { en: 'Accuracy (%)', ja: 'せいかいりつ（%）' }, limewater: { en: 'Lime water', ja: 'せっかいすい' }, o2After: { en: 'Oxygen left (%)', ja: 'のこった さんそ（%）' }, co2ml: { en: 'CO2 made (mL)', ja: 'できた にさんかたんそ（mL）' }, longer: { en: 'Longer or shorter than 1 L of air?', ja: '1 L の くうきより ながい？ みじかい？' }, periodDays: { en: 'Days between dips', ja: 'あいだ（日）' }, depth: { en: 'Dip depth', ja: 'ふかさ' }, planetRadiusEarths: { en: 'Planet size (Earths)', ja: 'わくせいの 大きさ（ちきゅう＝1）' }, orbitAU: { en: 'Orbit (AU)', ja: 'きどう（AU）' },
    };
    return t(L[f] || { en: f, ja: f });
  }
  function showValue(f, v) {
    if (v === null || v === undefined) return t(UI.noAnswer);
    if (f === 'outcome') return t(UI.outcomes[v]);
    if (f === 'phase') { const p = moon.PHASES.find((x) => x.id === v); return isJa() ? `${p.en}（${p.ja}）` : p.en; }
    if (f === 'lit') return `${Math.round(v * 100)}%`;
    if (f === 'depth') return `${(v * 100).toFixed(3)}%`;
    if (f === 'saturated') return t(v === 'true' ? { en: 'Yes — saturated', ja: 'うん、もう とけない' } : { en: 'No — it all dissolved', ja: 'ううん、ぜんぶ とけた' });
    if (f === 'kind') return t({ acid: { en: 'Acid', ja: 'さんせい' }, base: { en: 'Base', ja: 'アルカリせい' }, neutral: { en: 'Neutral', ja: 'ちゅうせい' } }[v]);
    if (f === 'longer') return t(v === 'longer' ? { en: 'Longer', ja: 'ながい' } : { en: 'Shorter', ja: 'みじかい' });
    const CAT = {
      bucket: { 'under-1': { en: 'under 1 s', ja: '1びょう より みじかい' }, '1-2': { en: '1–2 s', ja: '1〜2びょう' }, 'over-2': { en: 'over 2 s', ja: '2びょう より ながい' }, 'under-150': { en: 'Fewer than 150', ja: '150びき より すくない' }, 'over-150': { en: 'More than 150', ja: '150びき より おおい' } },
      moves: { stays: { en: 'Stays put', ja: 'とまったまま' }, slides: { en: 'Slides', ja: 'すべる' } },
      tilt: { left: { en: 'Tips left', ja: 'ひだりに' }, balanced: { en: 'Balanced', ja: 'つりあう' }, right: { en: 'Tips right', ja: 'みぎに' } },
      fate: { 'both-live': { en: 'Both live', ja: 'どちらも いきる' }, 'foxes-die': { en: 'Foxes die out', ja: 'キツネが いなくなる' }, 'rabbits-die': { en: 'Rabbits die out', ja: 'ウサギが いなくなる' }, 'both-die': { en: 'Both die out', ja: 'どちらも いなくなる' } },
      alive: { grows: { en: 'Grows', ja: 'そだつ' }, wilts: { en: 'Wilts', ja: 'しおれる' } },
      faster: { same: { en: 'About the same', ja: 'おなじ くらい' }, faster: { en: 'Faster', ja: 'はやい' }, slower: { en: 'Slower', ja: 'おそい' } },
      first: { P: { en: 'P wave (fast, gentle)', ja: 'P なみ（はやくて やさしい）' }, S: { en: 'S wave (slow, shaking)', ja: 'S なみ（おそくて ゆれる）' } },
      deeper: { 'deep-faster': { en: 'Deep is faster', ja: 'ふかい ほうが はやい' }, 'shallow-slower': { en: 'Shallow is faster', ja: 'あさい ほうが はやい' } },
      forms: { cloud: { en: 'A cloud forms', ja: 'くもが できる' }, clear: { en: 'Stays clear', ja: 'はれたまま' } },
      holds: { holds: { en: 'Holds', ja: 'ささえる' }, breaks: { en: 'Breaks', ja: 'おれる' } },
      brightness: { off: { en: 'Off', ja: 'つかない' }, dim: { en: 'Dim', ja: 'くらい' }, bright: { en: 'Bright', ja: 'あかるい' }, blown: { en: 'Blown!', ja: 'きれた！' } },
      direction: { opposite: { en: 'Opposite way', ja: 'ぎゃく むき' } },
      label: { apple: { en: 'Apple', ja: 'りんご' }, orange: { en: 'Orange', ja: 'みかん' } },
      rain: { likely: { en: 'Likely', ja: 'ふりそう' }, unlikely: { en: 'Unlikely', ja: 'ふらなそう' } },
      height: { low: { en: 'Low', ja: 'ひくい' }, high: { en: 'High', ja: 'たかい' } },
      color: { pale: { en: 'Pale', ja: 'うすい' }, green: { en: 'Green', ja: 'みどり' } },
    };
    if (CAT[f] && CAT[f][v]) return t(CAT[f][v]);
    return String(v);
  }

  function renderParams() {
    const { exp, level } = state;
    const free = freeParams(exp, level);
    const box = $('#lab-params'); box.hidden = false;
    box.innerHTML = Object.entries(free).map(([k, p]) => p.choices
      ? `<div class="param"><span>${both({ en: p.en, ja: p.ja })}</span><select data-param="${k}">${p.choices.map((c) => `<option value="${c}">${esc(choiceName(exp, k, c))}</option>`).join('')}</select><output></output></div>`
      : `<div class="param"><span>${both({ en: p.en, ja: p.ja })}</span><input type="range" data-param="${k}" min="${p.min}" max="${p.max}" step="${p.step}" value="${state.params[k] ?? p.min}"><output>${state.params[k] ?? p.min} ${esc(p.unit || '')}</output></div>`).join('');
    for (const el of box.querySelectorAll('[data-param]')) {
      const k = el.dataset.param;
      if (el.tagName === 'SELECT') el.value = state.params[k];
      el.oninput = () => { state.params[k] = el.tagName === 'SELECT' ? el.value : Number(el.value); state.params = sanitizeParams(exp, level, state.params); const out = el.parentElement.querySelector('output'); if (out && el.tagName !== 'SELECT') out.textContent = `${state.params[k]} ${free[k].unit || ''}`; drawView(); };
    }
    if (exp.sim === 'transit') {
      const tgt = exp.targets[state.params.target];
      box.insertAdjacentHTML('beforeend', `<p class="row"><b>${esc(t(tgt))}</b> — ${both(tgt.note)}</p>`);
      box.querySelector('select')?.addEventListener('change', renderParams);
    }
  }
  function choiceName(exp, k, c) {
    if (k === 'body') return t(gravity.BODIES[c]);
    if (k === 'target') return t(exp.targets[c]);
    if (k === 'solute') return t(chem.SOLUTES[c]);
    if (k === 'liquid') return t(chem.LIQUIDS[c]);
    if (k === 'indicator') return t(chem.INDICATORS[c]);
    if (k === 'surface') return t(force.SURFACES[c]);
    if (k === 'grass') return t(life.GRASS[c]);
    if (k === 'light') return t(life.LIGHT[c]);
    if (k === 'activity') return t(life.ACTIVITY[c]);
    if (k === 'material') return t(maker.MATERIALS[c]);
    if (k === 'mass') return t(c === 'heavy' ? { en: 'Heavy', ja: 'おもい' } : { en: 'Light', ja: 'かるい' });
    if (k === 'o2') return t(c === '1' ? { en: 'Pure oxygen', ja: 'さんそだけ' } : c === '0.16' ? { en: 'Used air (16% O2)', ja: 'つかった くうき' } : { en: 'Air (21% O2)', ja: 'ふつうの くうき' });
    return c;
  }

  function renderPredict() {
    const { exp, level } = state; const spec = exp.levels[level].predict;
    const box = $('#lab-predict'); box.hidden = false;
    const q = spec.kind === 'choice'
      ? `<div class="choices">${spec.choices.map((c) => `<button data-choice="${c}">${esc(choiceLabel(spec.field, c))}</button>`).join('')}</div>`
      : `<div class="row"><input id="predict-number" type="number" step="any" style="max-width:160px"><span>${esc(spec.unit)}</span></div>`;
    box.innerHTML = `<h4>${both(UI.predict)}</h4><p>${both(predictQuestion(exp, level))}</p>${q}<div class="row" style="margin-top:8px"><button id="predict-lock" class="primary">${both(UI.lockPrediction)}</button></div>`;
    let picked = null;
    for (const b of box.querySelectorAll('[data-choice]')) b.onclick = () => { picked = b.dataset.choice; for (const o of box.querySelectorAll('[data-choice]')) o.classList.toggle('picked', o === b); };
    $('#predict-lock', box).onclick = async () => {
      const value = spec.kind === 'choice' ? picked : Number($('#predict-number', box).value);
      if (spec.kind === 'choice' ? !picked : !Number.isFinite(value)) return toast({ en: 'Pick a prediction first.', ja: 'さきに よそうを えらんでね。' });
      $('#predict-lock', box).disabled = true;
      try {
        const ready = await ask(net, 'lab:start', { exp: exp.id, params: state.params }, 'lab:ready');
        state.trialId = ready.trialId; state.params = ready.params; state.level = ready.level;
        const res = await ask(net, 'lab:predict', { trialId: state.trialId, prediction: value }, 'lab:result');
        state.result = res.result; state.predicted = res.prediction;
        setStep('run'); drawView();
        const v = res.prediction.ok ? `<div class="verdict ok">${both(UI.right)}</div>` : `<div class="verdict no">${both(UI.wrong)} <b>${esc(showPrediction(spec.field, res.prediction.want))}</b></div>`;
        $('#lab-readout').insertAdjacentHTML('afterbegin', v);
        $('#lab-next').hidden = false; $('#lab-next').innerHTML = both(UI.measure);
        $('#lab-next').onclick = () => { setStep('measure'); renderMeasure(); };
      } catch (e) { toast({ en: `Could not start: ${e.message}`, ja: `はじめられなかった：${e.message}` }); $('#predict-lock', box).disabled = false; }
    };
  }
  const SIM_QUESTIONS = {
    pendulum: { period: { en: 'How many seconds per swing?', ja: '1かいは なんびょう？' }, bucket: { en: 'How long will one swing take?', ja: '1かい ゆれるのに どれくらい？' } },
    pond: { bucket: { en: 'Fewer or more than 150 fish?', ja: 'さかなは 150びき より すくない？ おおい？' } },
    gears: { faster: { en: 'Will the second gear turn faster or slower?', ja: '2つめの はぐるまは はやく まわる？ おそく まわる？' } },
  };
  function predictQuestion(exp, level) {
    const spec = exp.levels[level].predict;
    if (SIM_QUESTIONS[exp.sim]?.[spec.field]) return SIM_QUESTIONS[exp.sim][spec.field];
    const Q = {
      outcome: { en: 'What will the ball do?', ja: 'ボールは どうなる？' }, period: { en: 'How many minutes will one orbit take?', ja: '1しゅう なんぷん かかる？' },
      phase: { en: 'What shape will the Moon be tonight?', ja: 'こんや つきは どんな かたち？' }, lit: { en: 'What percent of the Moon will be lit?', ja: 'つきの なんパーセントが ひかる？' },
      saturated: { en: 'Will it all dissolve?', ja: 'ぜんぶ とける？' }, left: { en: 'How many grams will stay on the bottom?', ja: 'なん g が そこに のこる？' }, limit: { en: 'How many grams dissolve in 100 g of water at this temperature?', ja: 'この おんどで、100 g の みずに なん g とける？' },
      kind: { en: 'Acid, neutral or base?', ja: 'さんせい？ ちゅうせい？ アルカリせい？' }, color: { en: 'What colour will it turn?', ja: 'なにいろに なる？' }, pH: { en: 'What is the pH?', ja: 'pH は いくつ？' },
      longer: { en: 'Longer or shorter than the 1-litre jar in air (20 s)?', ja: 'くうきの 1 L の びん（20びょう）より ながい？ みじかい？' }, seconds: { en: 'How many seconds will it burn?', ja: 'なんびょう もえる？' }, co2ml: { en: 'How many mL of CO2 will it make?', ja: 'にさんかたんそは なん mL できる？' },
      swings: { en: 'How many swings in 30 seconds?', ja: '30びょうで なんかい？' },
      moves: { en: 'Will the box slide?', ja: 'はこは すべる？' }, speed: { en: 'How fast at the bottom (m/s)?', ja: 'したでは なん m/s？' }, accel: { en: 'What acceleration (m/s²)?', ja: 'かそくどは？（m/s²）' },
      tilt: { en: 'Which way will it tip?', ja: 'どっちに かたむく？' }, balanceMass: { en: 'How many kg on the right to balance?', ja: 'みぎに なん kg で つりあう？' }, advantage: { en: 'How many times its weight can the right lift?', ja: 'みぎは じぶんの なんばい もちあげられる？' },
      fate: { en: 'What happens after 120 days?', ja: '120日の あと、どうなる？' }, rabbitPeak: { en: 'Most rabbits at once?', ja: 'いちばん おおいとき ウサギは なんびき？' }, cycles: { en: 'How many ups and downs?', ja: 'ふえて へって、なんかい？' },
      alive: { en: 'Will it grow or wilt?', ja: 'そだつ？ しおれる？' }, height: { en: 'How tall after 14 days (cm)?', ja: '14日めに なん cm？' },
      faster: { en: 'Will the heart beat faster than resting?', ja: 'やすんでいる ときより はやく なる？' }, bpm: { en: 'How many beats per minute?', ja: '1ぷんに なんかい？' }, recovery: { en: 'Seconds to calm down?', ja: 'もどるまで なんびょう？' },
      first: { en: 'Which wave arrives first?', ja: 'どっちの なみが さきに くる？' }, gap: { en: 'Seconds between the two waves?', ja: '2つの なみの あいだは なんびょう？' }, warning: { en: 'Seconds of warning?', ja: 'けいほうは なんびょう まえ？' },
      deeper: { en: 'Faster in deep or shallow water?', ja: 'ふかい うみと あさい うみ、どっちが はやい？' }, speedKmh: { en: 'How fast (km/h)?', ja: 'なん km/h？' }, minutes: { en: 'Minutes until it arrives?', ja: 'なんぷんで つく？' },
      forms: { en: 'Will a cloud form below 2,500 m?', ja: '2,500 m より したに くもが できる？' }, cloudBase: { en: 'How high is the cloud base (m)?', ja: 'くもの そこは なん m？' }, dewPoint: { en: 'What is the dew point (°C)?', ja: 'ろてんは なんど？' },
      holds: { en: 'Will it hold or break?', ja: 'ささえる？ おれる？' }, sagMm: { en: 'How much will it sag (mm)?', ja: 'なん mm たわむ？' }, maxLoad: { en: 'Biggest load it can hold (kg)?', ja: 'なん kg まで ささえられる？' },
      brightness: { en: 'How bright will the bulb be?', ja: 'でんきゅうは どれくらい あかるい？' }, mA: { en: 'How much current (mA)?', ja: 'でんりゅうは なん mA？' }, forTwenty: { en: 'Which resistor gives 20 mA (Ω)?', ja: '20 mA にする ていこうは？（Ω）' },
      outRpm: { en: 'How fast will the second gear turn (rpm)?', ja: '2つめは なん rpm？' }, torqueRatio: { en: 'How many times stronger (×)?', ja: 'なんばい つよい？' },
      mode: { en: 'Which total will come up most?', ja: 'どの ごうけいが いちばん おおい？' }, mean: { en: 'What will the average be?', ja: 'へいきんは？' }, sevenPercent: { en: 'What share will be sevens (%)?', ja: '7は なん%？' },
      truth: { en: 'How many fish are in the pond?', ja: 'いけに さかなは なんびき？' },
      label: { en: 'Apple or orange?', ja: 'りんご？ みかん？' }, confidence: { en: 'How sure will it be (%)?', ja: 'どれくらい たしか？（%）' }, accuracy: { en: 'How often is the rule right (%)?', ja: 'ルールは なん% あたる？' },
      dips: UI.dipsLabel, periodDays: { en: 'How many days between dips?', ja: 'くらくなる あいだは なんにち？' }, planetRadiusEarths: { en: 'How big is the planet, in Earths?', ja: 'わくせいは ちきゅうの なんばい？' },
    };
    return Q[spec.field] || { en: spec.field, ja: spec.field };
  }
  function choiceLabel(field, c) {
    if (field === 'outcome') return `${t(UI.outcomes[c])}${isJa() ? '' : ''}`;
    if (field === 'phase') { const p = moon.PHASES.find((x) => x.id === c); return isJa() ? `${p.en} ${p.ja}` : p.en; }
    if (field === 'saturated') return t(c === 'true' ? { en: 'No, some stays', ja: 'のこる' } : { en: 'Yes, all of it', ja: 'ぜんぶ とける' });
    if (field === 'kind') return t({ acid: { en: 'Acid', ja: 'さんせい' }, base: { en: 'Base', ja: 'アルカリせい' }, neutral: { en: 'Neutral', ja: 'ちゅうせい' } }[c]);
    if (field === 'longer') return t(c === 'longer' ? { en: 'Longer', ja: 'ながい' } : { en: 'Shorter', ja: 'みじかい' });
    if (['bucket', 'moves', 'tilt', 'fate', 'alive', 'faster', 'first', 'deeper', 'forms', 'holds', 'brightness', 'label'].includes(field)) return showValue(field, c);
    return c;
  }
  function showPrediction(field, want) { return field === 'lit' ? `${Math.round(want)}%` : showValue(field, want); }

  function renderMeasure() {
    const { exp, level, result } = state; const lv = exp.levels[level];
    const box = $('#lab-measure'); box.hidden = false;
    // The child reads the instrument and types what it says. The readout is on the
    // canvas; the form asks for the same fields.
    box.innerHTML = `<h4>${both(UI.measure)}</h4>` + lv.measure.map((f) => {
      if (f === 'outcome') return `<div class="param"><span>${esc(labelFor(f))}</span><select data-m="${f}">${['crash', 'orbit', 'escape'].map((c) => `<option value="${c}">${esc(t(UI.outcomes[c]))}</option>`).join('')}</select><output></output></div>`;
      if (f === 'phase') return `<div class="param"><span>${esc(labelFor(f))}</span><select data-m="${f}">${moon.PHASES.map((p) => `<option value="${p.id}">${esc(p.en)}</option>`).join('')}</select><output></output></div>`;
      if (f === 'side') return `<div class="param"><span>${esc(labelFor(f))}</span><select data-m="${f}"><option value="right">right</option><option value="left">left</option></select><output></output></div>`;
      if (f === 'saturated') return `<div class="param"><span>${esc(labelFor(f))}</span><select data-m="${f}"><option value="true">${esc(showValue(f, 'true'))}</option><option value="false">${esc(showValue(f, 'false'))}</option></select><output></output></div>`;
      if (f === 'kind') return `<div class="param"><span>${esc(labelFor(f))}</span><select data-m="${f}">${['acid', 'neutral', 'base'].map((c) => `<option value="${c}">${esc(showValue(f, c))}</option>`).join('')}</select><output></output></div>`;
      if (f === 'color') return `<div class="param"><span>${esc(labelFor(f))}</span><select data-m="${f}">${Object.keys(chem.COLOR_HEX).map((c) => `<option value="${c}">${c}</option>`).join('')}</select><output></output></div>`;
      const CATS = { bucket: exp.sim === 'pond' ? ['under-150', 'over-150'] : ['under-1', '1-2', 'over-2'], moves: ['stays', 'slides'], tilt: ['left', 'balanced', 'right'], fate: ['both-live', 'foxes-die', 'rabbits-die', 'both-die'], alive: ['grows', 'wilts'], faster: exp.sim === 'heart' ? ['same', 'faster'] : ['faster', 'same', 'slower'], first: ['P', 'S'], deeper: ['deep-faster', 'shallow-slower'], forms: ['cloud', 'clear'], holds: ['holds', 'breaks'], brightness: ['off', 'dim', 'bright', 'blown'], direction: ['opposite'], label: ['apple', 'orange'], rain: ['likely', 'unlikely'], height: ['low', 'high'] };
      if (CATS[f] && !(f === 'height' && exp.sim === 'plant')) return `<div class="param"><span>${esc(labelFor(f))}</span><select data-m="${f}">${CATS[f].map((c) => `<option value="${c}">${esc(showValue(f, c))}</option>`).join('')}</select><output></output></div>`;
      if (f === 'limewater') return `<div class="param"><span>${esc(labelFor(f))}</span><select data-m="${f}"><option value="cloudy">cloudy</option><option value="clear">clear</option></select><output></output></div>`;
      return `<div class="param"><span>${esc(labelFor(f))}</span><input type="number" step="any" data-m="${f}"><output></output></div>`;
    }).join('') + `<div class="row"><button id="measure-send" class="primary">${both(UI.send)}</button></div>`;
    $('#measure-send', box).onclick = async () => {
      const reported = {};
      for (const el of box.querySelectorAll('[data-m]')) { const f = el.dataset.m; reported[f] = el.tagName === 'SELECT' ? el.value : (f === 'lit' ? Number(el.value) / 100 : f === 'depth' ? Number(el.value) / 100 : Number(el.value)); }
      $('#measure-send', box).disabled = true;
      try {
        const j = await ask(net, 'lab:measure', { trialId: state.trialId, reported }, 'lab:judged');
        box.insertAdjacentHTML('beforeend', j.measurement.ok ? `<div class="verdict ok">${both(UI.measureOk)}</div>` : `<div class="verdict no">${both(UI.measureNo)} (${j.measurement.wrong.join(', ')})</div>`);
        if (!j.measurement.ok) $('#measure-send', box).disabled = false;
        else { $('#lab-next').hidden = false; $('#lab-next').innerHTML = both(UI.explain); $('#lab-next').onclick = () => { setStep('explain'); renderExplain(); }; }
        me.powers = j.powers;
      } catch (e) { toast({ en: e.message, ja: e.message }); $('#measure-send', box).disabled = false; }
    };
    $('#lab-next').hidden = true;
    drawView();
  }

  function renderExplain() {
    const { exp } = state;
    const box = $('#lab-explain'); box.hidden = false;
    box.innerHTML = `<h4>${both(UI.explain)}</h4><p>${both(exp.explain)}</p><p class="fine">${both(UI.aims)}</p><ul class="aims">${exp.explain.aims.map((a) => `<li data-aim="${a.id}">${both({ en: a.en, ja: a.ja })}</li>`).join('')}</ul><textarea id="explain-text" rows="3" maxlength="400" placeholder="I think… because…"></textarea><div class="row" style="margin-top:8px"><button id="explain-send" class="primary">${both(UI.send)}</button></div>`;
    $('#explain-send', box).onclick = async () => {
      const text = $('#explain-text', box).value.trim();
      if (!text) return;
      try {
        const r = await ask(net, 'lab:explain', { trialId: state.trialId, text }, 'lab:explained');
        for (const li of box.querySelectorAll('[data-aim]')) li.classList.toggle('met', r.met.includes(li.dataset.aim));
        me.powers = r.powers;
        if (!r.enough) toast({ en: 'Say a little more.', ja: 'もう すこし いってみよう。' });
        else if (r.met.length === r.total) toast({ en: 'All three! That is a scientist talking.', ja: '3つ ぜんぶ！ かがくしゃの はなしかただ。' });
        onDone(exp.id);
        $('#lab-next').hidden = false; $('#lab-next').innerHTML = both(UI.done); $('#lab-next').onclick = () => open(exp.id, state.level);
        renderReal();
      } catch (e) { toast({ en: e.message, ja: e.message }); }
    };
    $('#lab-next').hidden = true;
  }

  function renderReal() {
    const { exp } = state; const box = $('#lab-real'); box.hidden = false;
    box.innerHTML = `<h4>${both(UI.real)}</h4><p>${both(exp.real)}</p><div class="row"><input id="real-value" maxlength="64" placeholder="${esc(t({ en: 'what you saw', ja: '見たもの' }))}" style="max-width:260px"><button id="real-send">${both(UI.realSend)}</button></div>${exp.real.citizen ? `<p class="fine">${both(exp.real.citizen)}</p>` : ''}`;
    $('#real-send', box).onclick = () => { const v = $('#real-value', box).value.trim(); if (!v) return; net.send('lab:real', { exp: exp.id, value: v }); toast({ en: 'Recorded. Looking up is science too.', ja: 'きろくした。見上げるのも かがく。' }); };
  }

  function drawClassPlot() { drawClass($('#class-canvas'), { points: classPoints.get(state.exp.id) || [], plot: state.exp.classPlot, me: me.name }); }

  function open(expId, level) {
    const exp = EXPERIMENT_BY_ID[expId];
    state = { exp, level, params: sanitizeParams(exp, level, {}), trialId: null, result: null };
    $('#lab-station').textContent = `${exp.region.toUpperCase()} · ${exp.levels[level].ages}`;
    $('#lab-title').innerHTML = both(exp.title);
    $('#lab-intro').innerHTML = both(exp.intro);
    setStep('set'); renderParams(); drawView(); drawClassPlot();
    $('#lab-next').hidden = false; $('#lab-next').innerHTML = both(UI.next);
    $('#lab-next').onclick = () => { setStep('predict'); renderPredict(); $('#lab-next').hidden = true; };
    if (!dlg.open) dlg.showModal();
    stage?.start();
  }
  $('#lab-close').onclick = () => dlg.close();
  dlg.addEventListener('close', () => stage?.stop()); // the stage sleeps while the panel is shut
  $('#lab-replay').onclick = () => stage?.replay();
  dlg.addEventListener('close', () => stage?.stop());
  $('#lab-lang').onclick = toggleLang; // the HUD is inert while the modal is open
  onLang(() => { if (state && dlg.open) { drawView(); drawClassPlot(); } });

  function openPowers() {
    const d = $('#powers');
    drawPowers($('#powers-canvas'), me.powers, Object.fromEntries(POWERS.map((p) => [p.id, { en: p.en, ja: p.ja }])));
    $('#powers-list').innerHTML = POWERS.map((p) => `<li>${both({ en: p.en, ja: p.ja })}: <b>${me.powers[p.id] || 0}</b></li>`).join('');
    d.showModal();
  }
  $('#powers-close').onclick = () => $('#powers').close();

  return { open, openPowers, get isOpen() { return dlg.open; }, setLevel(l) { if (state) state.level = l; }, get stage() { return stage; } };
}
