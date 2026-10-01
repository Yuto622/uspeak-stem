// Boot: lobby → connect → islands → notebook, map, panels.
import { t, both, esc, toggleLang, onLang, UI } from './i18n.js';
import { createWorld } from './island.js';
import { connect } from './net.js';
import { createPanels } from './panels.js';
import { EXPERIMENT_BY_ID, REGIONS } from '/shared/experiments/index.js';
import { phaseAt } from './world-clock.js';

const $ = (s) => document.querySelector(s);
let toastTimer = 0;
function toast(pair) { const el = $('#toast'); el.textContent = t(pair); el.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 2600); }

const me = { name: '', role: 'student', level: 'explore', powers: { predict: 0, measure: 0, data: 0, explain: 0, build: 0 }, done: new Set() };
const world = createWorld($('#world'));
const islandsData = await (await fetch('islands.json', { cache: 'no-cache' })).json();
world.load(islandsData);
$('#loading').remove();
$('#lobby').showModal(); // in the top layer, above the fixed canvas
$('#lang').onclick = toggleLang;

try { $('#lobby-name').value = localStorage.getItem('uspeak-stem-name') || ''; $('#lobby-class').value = localStorage.getItem('uspeak-stem-class') || ''; } catch { /* fine */ }

function powersTotal() { return Math.round(Object.values(me.powers).reduce((a, b) => a + b, 0) * 10) / 10; }

// The notebook on the left: this island's stations, the one you are near highlighted.
function renderNotebook(nearId) {
  const d = world.island;
  const list = $('#quests');
  list.innerHTML = d.spots.map((sp, i) => {
    const e = EXPERIMENT_BY_ID[sp.exp];
    return `<button class="quest ${sp.id === nearId ? 'selected' : ''}" data-station="${sp.id}"><span class="num">${String(i + 1).padStart(2, '0')}</span><div><strong>${both(e.title)}</strong><small>${esc(sp.character)} · ${both({ en: sp.en, ja: sp.ja })}${me.done.has(e.id) ? ' · ✓' : ''}</small></div><span class="arrow">›</span></button>`;
  }).join('');
  for (const b of list.querySelectorAll('[data-station]')) b.onclick = () => { world.walkTo(b.dataset.station); };
  const done = d.spots.filter((sp) => me.done.has(sp.exp)).length;
  $('#count').textContent = `${done} / ${d.spots.length}`;
  $('#progress').style.width = `${(done / d.spots.length) * 100}%`;
  $('#notebook-no').textContent = String(REGIONS.findIndex((r) => r.id === d.id) + 1).padStart(2, '0');
}
function renderLocation() {
  const d = world.island;
  $('#location').innerHTML = `<span>✦</span><b class="en">${esc(d.en)}</b><i class="ja">${esc(d.name)}</i>`;
  $('#map-title').textContent = d.en;
  document.title = `U-Speak STEM — ${d.en}`;
}
function renderTravel() {
  $('#travel-list').innerHTML = REGIONS.map((r) => { const d = islandsData.islands.find((x) => x.id === r.id); return `<button data-travel="${r.id}" class="${world.current === r.id ? 'here' : ''}"><span>${r.icon || '✦'}</span><div><strong>${esc(r.en)} · ${esc(r.ja)}</strong><small>${d.spots.map((s) => s.en).join(' · ')}</small></div></button>`; }).join('');
  for (const b of $('#travel-list').querySelectorAll('[data-travel]')) b.onclick = () => { $('#travel').close(); if (b.dataset.travel !== world.current) { world.travel(b.dataset.travel); toast({ en: `Welcome to ${world.island.en}.`, ja: `${world.island.name}へ ようこそ。` }); } };
}

$('#lobby-go').onclick = async () => {
  const name = $('#lobby-name').value.trim() || 'Explorer';
  const classCode = $('#lobby-class').value.trim() || 'demo';
  const teacherKey = $('#lobby-key').value;
  try { localStorage.setItem('uspeak-stem-name', name); localStorage.setItem('uspeak-stem-class', classCode); } catch { /* fine */ }
  $('#lobby-go').disabled = true;
  const net = connect({ name, classCode, teacherKey });
  const panels = createPanels({ net, toast, me, onDone: (expId) => { me.done.add(expId); renderNotebook(null); } });
  net.on('lab:hello', (m) => {
    me.name = m.name; me.role = m.role; me.level = m.level; me.powers = m.powers;
    $('#hud-level').innerHTML = both(UI.level[m.level]); $('#hud-name').textContent = `◉ ${m.name}`; $('#powers-total').textContent = String(powersTotal());
    $('#teacher').hidden = m.role !== 'teacher';
    if (m.role === 'teacher') for (const b of document.querySelectorAll('#teacher [data-level]')) { b.classList.toggle('active', b.dataset.level === m.level); b.onclick = () => net.send('teacher:level', { level: b.dataset.level }); }
  });
  net.on('lab:level', (m) => { me.level = m.level; $('#hud-level').innerHTML = both(UI.level[m.level]); panels.setLevel(m.level); for (const b of document.querySelectorAll('#teacher [data-level]')) b.classList.toggle('active', b.dataset.level === m.level); toast({ en: `Depth is now ${m.level}.`, ja: `ふかさが ${m.level} に なった。` }); });
  net.on('roster', (m) => {
    $('#online-pill').textContent = `${m.players.length} ✦`;
    const mine = net.room?.sessionId;
    for (const p of m.players) { if (p.id === mine) continue; world.setOther(p.id, p.name, p.pos.x, p.pos.z); }
    $('#teacher-roster').innerHTML = m.players.map((p) => `<li>${p.role === 'teacher' ? '★ ' : ''}${esc(p.name)}</li>`).join('');
  });
  net.on('pos', (m) => world.setOther(m.id, '', m.x, m.z));
  net.on('lab:error', (m) => toast({ en: m.reason, ja: m.reason }));
  try {
    const room = await net.join();
    room.onLeave(() => { $('#online-pill').textContent = t(UI.offline); toast({ en: 'Connection lost. Reload to rejoin.', ja: 'せつぞくが きれた。よみこみなおしてね。' }); });
  } catch (e) {
    toast({ en: 'Could not join. Is the server running?', ja: 'はいれなかった。サーバーは うごいている？' });
    $('#lobby-go').disabled = false; return;
  }
  $('#lobby').close();
  for (const id of ['#hud', '#notebook', '#rail', '#bottom', '#pad']) $(id).hidden = false;
  renderLocation(); renderNotebook(null); renderTravel();
  world.onIsland(() => { renderLocation(); renderNotebook(null); renderTravel(); });
  world.onMove((x, z) => net.send('pos', { x, z }));
  let nearSpot = null;
  world.onNear((sp) => {
    nearSpot = sp; $('#near').hidden = !sp;
    if (sp) { const e = EXPERIMENT_BY_ID[sp.exp]; $('#interact-text').innerHTML = `${both({ en: `Enter · ${e.title.en}`, ja: `はいる · ${e.title.ja}` })}`; $('#area').textContent = t({ en: sp.en, ja: sp.name }); }
    else $('#area').textContent = t({ en: 'On the path', ja: 'みちの うえ' });
    renderNotebook(sp?.id || null);
  });
  const enter = () => { if (nearSpot) panels.open(nearSpot.exp, me.level); };
  $('#interact').onclick = enter;
  addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'e' && !document.querySelector('dialog[open]') && !e.target.closest('input,textarea')) enter(); });
  // dialogs freeze walking
  const obs = new MutationObserver(() => world.freeze(!!document.querySelector('dialog[open]')));
  for (const d of document.querySelectorAll('dialog')) obs.observe(d, { attributes: true, attributeFilter: ['open'] });
  // rail and hotbar
  const openPowers = () => { $('#powers-total').textContent = String(powersTotal()); panels.openPowers(); };
  $('#powers-button').onclick = openPowers; $('#hud-powers').onclick = openPowers; $('#hb-powers').onclick = openPowers;
  const openTravel = () => { renderTravel(); $('#travel').showModal(); };
  $('#flight-button').onclick = openTravel; $('#hb-map').onclick = openTravel; $('#travel-close').onclick = () => $('#travel').close();
  $('#hb-home').onclick = () => world.travel(world.current);
  // the world's clock, in the rail
  setInterval(() => { const p = phaseAt(); $('#time-pill').innerHTML = `${p.phase.mark} <b class="en">${p.phase.en}</b><i class="ja">${p.phase.ja}</i> <span>${Math.floor(p.left / 60)}:${String(Math.floor(p.left % 60)).padStart(2, '0')}</span>`; }, 1000);
  // minimap
  const mapCtx = $('#map').getContext('2d');
  setInterval(() => { world.drawMap(mapCtx); }, 120);
  onLang(() => { renderLocation(); renderNotebook(nearSpot?.id || null); renderTravel(); });
  globalThis.stem = { net, world, panels, me, open: (exp) => panels.open(exp, me.level), walkTo: (id) => world.walkTo(id), travel: (id) => world.travel(id), signs: () => world.signs() };
};
