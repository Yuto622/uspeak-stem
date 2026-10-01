// Electricity, the textbook sequence: 電気の通り道 (小3), かん電池のつなぎ方 (小4),
// 電磁石 (小5), 発電と蓄電 (小6). Pure functions.

// 小3: metals conduct; paper, wood, plastic, glass, rubber do not.
export const CONDUCT_ITEMS = {
  clip: { en: 'Steel clip', ja: 'てつの クリップ', conducts: true }, coin: { en: 'Aluminium coin', ja: 'アルミの こうか', conducts: true }, wire: { en: 'Copper wire', ja: 'どうの はりがね', conducts: true }, foil: { en: 'Aluminium foil', ja: 'アルミはく', conducts: true },
  pencil: { en: 'Pencil lead', ja: 'えんぴつの しん', conducts: true },
  paper: { en: 'Paper', ja: 'かみ', conducts: false }, wood: { en: 'Wooden stick', ja: 'きの ぼう', conducts: false }, plastic: { en: 'Plastic ruler', ja: 'プラスチックの じょうぎ', conducts: false }, glass: { en: 'Glass', ja: 'ガラス', conducts: false }, eraser: { en: 'Eraser', ja: 'けしゴム', conducts: false },
};
export function conductor({ item = 'clip' }) {
  const it = CONDUCT_ITEMS[item];
  return { lights: it.conducts ? 'yes' : 'no', conducts: it.conducts ? 'yes' : 'no', kind: it.conducts ? 'metal' : 'not-metal', conductivity: it.conducts ? 1 : 0 };
}

// 小4: two cells in series double the push (and the bulb's brightness); in parallel
// the bulb is as bright as with one cell but the cells last twice as long.
export function cells({ count = 2, wiring = 'series' }) {
  const volts = wiring === 'series' ? 1.5 * count : 1.5;
  const current = Math.round(volts / 5 * 1000) / 1000; // a 5 Ω bulb, in A
  const brightness = volts >= 3 ? 'brighter' : 'same';
  const hours = wiring === 'series' ? 2 : 2 * count;
  return { volts, mA: Math.round(current * 1000), brightness, hours, motor: volts >= 3 ? 'faster' : 'same' };
}

// 小5: more turns or more current, a stronger electromagnet. About four clips for 100
// turns on one cell; it scales with both.
export function electromagnet({ turns = 100, cellsN = 1 }) {
  const clips = Math.round((turns / 100) * cellsN * 4);
  return { clips, stronger: turns > 100 || cellsN > 1 ? 'stronger' : 'same', pole: 'N', flips: 'yes' };
}

// 小6: a hand-cranked generator charges a capacitor; a bulb drains it in seconds, an
// LED for far longer, a motor somewhere between.
export const DEVICES = { bulb: { en: 'Bulb', ja: 'まめでんきゅう', drainW: 0.5 }, led: { en: 'LED', ja: 'LED', drainW: 0.05 }, motor: { en: 'Motor', ja: 'モーター', drainW: 0.2 }, buzzer: { en: 'Buzzer', ja: 'ブザー', drainW: 0.1 } };
export function generator({ turns = 20, device = 'led' }) {
  const stored = turns * 0.25; // joules, roughly
  const seconds = Math.round((stored / DEVICES[device].drainW) * 10) / 10;
  return { seconds, stored: Math.round(stored * 100) / 100, longer: device === 'led' ? 'led' : 'bulb', bucket: seconds < 20 ? 'under-20' : seconds < 60 ? '20-60' : 'over-60' };
}
