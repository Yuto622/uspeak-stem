// Language. English is the default; あ switches to Japanese.
//
// Static text is written twice in the HTML (<b class="en"> / <i class="ja">) and CSS
// picks one by <html data-lang>. Text built in JavaScript goes through `t()`, which
// takes an {en, ja} pair. There is no dictionary to go out of date: every string is
// written in both languages where it is made.
//
// Learning content is not translated. The experiment's science words (crash / orbit /
// escape, waxing crescent) stay as the child meets them; the Japanese gloss sits next
// to them, not instead of them.

const KEY = 'uspeak-stem-lang';
let lang = 'en';
try { lang = localStorage.getItem(KEY) === 'ja' ? 'ja' : 'en'; } catch { /* fine */ }
const listeners = new Set();

export function getLang() { return lang; }
export function isJa() { return lang === 'ja'; }
export function t(pair) { return typeof pair === 'string' ? pair : (pair?.[lang] ?? pair?.en ?? ''); }
// A pair as HTML, so a switch mid-screen flips it without a redraw.
export function both(pair) {
  if (typeof pair === 'string') return esc(pair);
  return `<b class="en">${esc(pair.en)}</b><i class="ja">${esc(pair.ja ?? pair.en)}</i>`;
}
export function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
export function setLang(next) {
  lang = next === 'ja' ? 'ja' : 'en';
  document.documentElement.dataset.lang = lang;
  document.documentElement.lang = lang;
  try { localStorage.setItem(KEY, lang); } catch { /* fine */ }
  for (const fn of listeners) fn(lang);
}
export function onLang(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function toggleLang() { setLang(lang === 'ja' ? 'en' : 'ja'); }
document.documentElement.dataset.lang = lang;
document.documentElement.lang = lang;

// Words the panels need that are not in the experiment data.
export const UI = {
  enter: { en: 'Enter', ja: 'はいる' },
  next: { en: 'Next →', ja: 'つぎへ →' },
  predict: { en: 'I predict…', ja: 'よそうする…' },
  lockPrediction: { en: 'Lock my prediction', ja: 'よそうを きめる' },
  run: { en: 'Run it!', ja: 'やってみる！' },
  measure: { en: 'What did you measure?', ja: 'なにを はかった？' },
  send: { en: 'Send', ja: 'おくる' },
  explain: { en: 'Explain in English', ja: 'えいごで せつめいする' },
  done: { en: 'Done — try another', ja: 'おわり。もう いっかい' },
  right: { en: 'Your prediction was right!', ja: 'よそうが あたった！' },
  wrong: { en: 'Not this time. The experiment says:', ja: 'こんかいは ちがった。じっけんの こたえは：' },
  measureOk: { en: 'Your measurement matches the instrument.', ja: 'はかった あたいが きかいと あっている。' },
  measureNo: { en: 'That is not what the instrument shows. Look again.', ja: 'きかいの あたいと ちがう。もういちど 見よう。' },
  real: { en: 'At home / in class', ja: 'おうちや きょうしつで' },
  realSend: { en: 'I looked!', ja: '見たよ！' },
  aims: { en: 'Things to say', ja: 'いえると いいこと' },
  level: { explore: { en: 'Explore', ja: 'Explore（4〜7）' }, investigate: { en: 'Investigate', ja: 'Investigate（8〜11）' }, engineer: { en: 'Engineer', ja: 'Engineer（12〜15）' } },
  online: { en: 'online', ja: 'にん' },
  offline: { en: 'offline', ja: 'オフライン' },
  noAnswer: { en: '(no reading yet)', ja: '（まだ よめない）' },
  outcomes: { crash: { en: 'Crash', ja: 'おちる' }, orbit: { en: 'Orbit', ja: 'まわる' }, escape: { en: 'Escape', ja: 'とんでいく' } },
  dipsLabel: { en: 'How many dips?', ja: 'なんかい くらくなる？' },
};
