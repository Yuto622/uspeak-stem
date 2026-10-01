// Boot: lobby → connect → island → panels.
import { t, both, toggleLang, UI } from './i18n.js';
import { createIsland, STATIONS } from './island.js';
import { connect } from './net.js';
import { createPanels } from './panels.js';

const $ = (s) => document.querySelector(s);
let toastTimer = 0;
function toast(pair) { const el = $('#toast'); el.textContent = t(pair); el.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 2600); }

$('#lang').onclick = toggleLang;
const me = { name: '', role: 'student', level: 'explore', powers: { predict: 0, measure: 0, data: 0, explain: 0, build: 0 } };
const island = createIsland($('#world'));
$('#loading').remove();
// The lobby must be in the top layer, above the fixed world canvas: open it as a modal.
$('#lobby').removeAttribute('open'); $('#lobby').showModal();

try { $('#lobby-name').value = localStorage.getItem('uspeak-stem-name') || ''; $('#lobby-class').value = localStorage.getItem('uspeak-stem-class') || ''; } catch { /* fine */ }

$('#lobby-go').onclick = async () => {
  const name = $('#lobby-name').value.trim() || 'Explorer';
  const classCode = $('#lobby-class').value.trim() || 'demo';
  const teacherKey = $('#lobby-key').value;
  try { localStorage.setItem('uspeak-stem-name', name); localStorage.setItem('uspeak-stem-class', classCode); } catch { /* fine */ }
  $('#lobby-go').disabled = true;
  const net = connect({ name, classCode, teacherKey });
  const panels = createPanels({ net, toast, me });
  net.on('lab:hello', (m) => {
    me.name = m.name; me.role = m.role; me.level = m.level; me.powers = m.powers;
    $('#hud-level').innerHTML = both(UI.level[m.level]);
    $('#teacher').hidden = m.role !== 'teacher';
    if (m.role === 'teacher') for (const b of document.querySelectorAll('#teacher [data-level]')) { b.classList.toggle('active', b.dataset.level === m.level); b.onclick = () => net.send('teacher:level', { level: b.dataset.level }); }
  });
  net.on('lab:level', (m) => { me.level = m.level; $('#hud-level').innerHTML = both(UI.level[m.level]); panels.setLevel(m.level); for (const b of document.querySelectorAll('#teacher [data-level]')) b.classList.toggle('active', b.dataset.level === m.level); toast({ en: `Depth is now ${m.level}.`, ja: `ふかさが ${m.level} に なった。` }); });
  net.on('roster', (m) => {
    $('#hud-online').textContent = `${m.players.length} ${t(UI.online)}`;
    const mine = net.room?.sessionId;
    const seen = new Set();
    for (const p of m.players) { if (p.id === mine) continue; seen.add(p.id); island.setOther(p.id, p.name, p.pos.x, p.pos.z); }
    $('#teacher-roster').innerHTML = m.players.map((p) => `<li>${p.role === 'teacher' ? '★ ' : ''}${p.name}</li>`).join('');
  });
  net.on('pos', (m) => island.setOther(m.id, '', m.x, m.z));
  net.on('lab:error', (m) => toast({ en: m.reason, ja: m.reason }));
  try {
    const room = await net.join();
    room.onLeave(() => { $('#hud-online').textContent = t(UI.offline); toast({ en: 'Connection lost. Reload to rejoin.', ja: 'せつぞくが きれた。よみこみなおしてね。' }); });
  } catch (e) {
    toast({ en: 'Could not join. Is the server running?', ja: 'はいれなかった。サーバーは うごいている？' });
    $('#lobby-go').disabled = false;
    return;
  }
  $('#lobby').close(); $('#hud').hidden = false; $('#pad').hidden = false;
  island.onMove((x, z) => net.send('pos', { x, z }));
  island.onNear((s) => {
    const near = $('#near'); near.hidden = !s;
    if (s) { $('#near-btn').innerHTML = `${both(UI.enter)} · ${both({ en: s.en, ja: s.ja })}`; $('#near-btn').onclick = () => { panels.open(s.exp, me.level); }; }
  });
  $('#lab').addEventListener('close', () => island.freeze(false));
  $('#lab').addEventListener('toggle', () => island.freeze($('#lab').open));
  const obs = new MutationObserver(() => island.freeze($('#lab').open || $('#powers').open));
  obs.observe($('#lab'), { attributes: true, attributeFilter: ['open'] }); obs.observe($('#powers'), { attributes: true, attributeFilter: ['open'] });
  $('#hud-powers').onclick = () => panels.openPowers();
  // Hooks for tests and for the console.
  globalThis.stem = { net, island, panels, me, STATIONS, open: (exp) => panels.open(exp, me.level), walkTo: (id) => { const s = STATIONS.find((x) => x.id === id); island.me.position.set(s.x, 2, s.z + 2); } };
};
