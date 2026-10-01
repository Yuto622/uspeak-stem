// The experiment panel: set → predict → run → measure → explain, plus the class plot.
//
// The page runs the shared sim to draw, but it draws only after the room has sent the
// result — which the room does only after a prediction is locked. The page never
// computes a result to show before that, so a child cannot peek.

import { t, both, esc, UI, isJa, onLang, toggleLang } from './i18n.js';
import { EXPERIMENT_BY_ID, freeParams, sanitizeParams, POWERS } from '/shared/experiments/index.js';
import { gravity, moon } from '/shared/sim/index.js';
import { dipsBucket } from '/shared/sim/run.js';
import { drawOrbit, drawMoon, drawLightCurve, drawClass, drawPowers } from './draw.js';
import { ask } from './net.js';

const $ = (s, r = document) => r.querySelector(s);

export function createPanels({ net, toast, me }) {
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

  function drawView() {
    const canvas = $('#lab-canvas'); const { exp, params, result } = state;
    if (exp.sim === 'gravity') drawOrbit(canvas, { body: gravity.BODIES[params.body], altitude: params.altitude, trail: result?.trail, outcome: result?.outcome });
    else if (exp.sim === 'moon') drawMoon(canvas, { angle: params.angle, result });
    else drawLightCurve(canvas, { curve: result?.curve, dips: result ? findDipsForDrawing(result) : null });
    const ro = $('#lab-readout');
    if (!result) { ro.innerHTML = ''; return; }
    const lv = exp.levels[state.level];
    ro.innerHTML = lv.measure.map((f) => `<b>${esc(labelFor(f))}: ${esc(showValue(f, result[f]))}</b>`).join('');
  }
  function findDipsForDrawing(result) { return null; } // the server marks nothing; the child finds the dips

  function labelFor(f) {
    const L = {
      outcome: { en: 'What happened', ja: 'どうなった' }, period: { en: 'Minutes per orbit', ja: '1しゅうの ふん' }, apoapsis: { en: 'Highest point (km)', ja: 'いちばん たかい ところ（km）' },
      phase: { en: 'Phase', ja: 'かたち' }, lit: { en: 'Lit part', ja: 'ひかる わりあい' }, side: { en: 'Lit side', ja: 'ひかる がわ' },
      dips: { en: 'Dips', ja: 'くらくなった かいすう' }, periodDays: { en: 'Days between dips', ja: 'あいだ（日）' }, depth: { en: 'Dip depth', ja: 'ふかさ' }, planetRadiusEarths: { en: 'Planet size (Earths)', ja: 'わくせいの 大きさ（ちきゅう＝1）' }, orbitAU: { en: 'Orbit (AU)', ja: 'きどう（AU）' },
    };
    return t(L[f] || { en: f, ja: f });
  }
  function showValue(f, v) {
    if (v === null || v === undefined) return t(UI.noAnswer);
    if (f === 'outcome') return t(UI.outcomes[v]);
    if (f === 'phase') { const p = moon.PHASES.find((x) => x.id === v); return isJa() ? `${p.en}（${p.ja}）` : p.en; }
    if (f === 'lit') return `${Math.round(v * 100)}%`;
    if (f === 'depth') return `${(v * 100).toFixed(3)}%`;
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
  function predictQuestion(exp, level) {
    const spec = exp.levels[level].predict;
    const Q = {
      outcome: { en: 'What will the ball do?', ja: 'ボールは どうなる？' }, period: { en: 'How many minutes will one orbit take?', ja: '1しゅう なんぷん かかる？' },
      phase: { en: 'What shape will the Moon be tonight?', ja: 'こんや つきは どんな かたち？' }, lit: { en: 'What percent of the Moon will be lit?', ja: 'つきの なんパーセントが ひかる？' },
      dips: UI.dipsLabel, periodDays: { en: 'How many days between dips?', ja: 'くらくなる あいだは なんにち？' }, planetRadiusEarths: { en: 'How big is the planet, in Earths?', ja: 'わくせいは ちきゅうの なんばい？' },
    };
    return Q[spec.field] || { en: spec.field, ja: spec.field };
  }
  function choiceLabel(field, c) {
    if (field === 'outcome') return `${t(UI.outcomes[c])}${isJa() ? '' : ''}`;
    if (field === 'phase') { const p = moon.PHASES.find((x) => x.id === c); return isJa() ? `${p.en} ${p.ja}` : p.en; }
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
  }
  $('#lab-close').onclick = () => dlg.close();
  $('#lab-lang').onclick = toggleLang; // the HUD is inert while the modal is open
  onLang(() => { if (state && dlg.open) { drawView(); drawClassPlot(); } });

  function openPowers() {
    const d = $('#powers');
    drawPowers($('#powers-canvas'), me.powers, Object.fromEntries(POWERS.map((p) => [p.id, { en: p.en, ja: p.ja }])));
    $('#powers-list').innerHTML = POWERS.map((p) => `<li>${both({ en: p.en, ja: p.ja })}: <b>${me.powers[p.id] || 0}</b></li>`).join('');
    d.showModal();
  }
  $('#powers-close').onclick = () => $('#powers').close();

  return { open, openPowers, get isOpen() { return dlg.open; }, setLevel(l) { if (state) state.level = l; } };
}
