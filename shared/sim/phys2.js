// Physics, the second shelf: 風とゴム・じしゃく・光・音 (小3), ばね (中1), as pure functions.

// 小3 ゴムの力: a rubber-band car. The energy stored grows with the square of the
// stretch, so the car goes about four times as far for twice the pull. Textbook data:
// 10 cm → about 1.3 m, 15 cm → 3.5 m, 20 cm → 6 m.
export function rubber({ stretch = 10, mass = 'light' }) {
  const k = mass === 'heavy' ? 0.0095 : 0.015;
  const metres = Math.round(k * stretch * stretch * 100) / 100;
  return { metres, farther: stretch > 10 ? 'farther' : stretch < 10 ? 'shorter' : 'same', bucket: metres < 2 ? 'under-2' : metres < 5 ? '2-5' : 'over-5' };
}

// 小3 じしゃく: what sticks, how many clips at a distance, and what two poles do.
export const TEST_ITEMS = {
  clip: { en: 'Steel clip', ja: 'てつの クリップ', iron: true }, nail: { en: 'Iron nail', ja: 'てつの くぎ', iron: true }, can: { en: 'Steel can', ja: 'スチールかん', iron: true },
  coin: { en: 'Aluminium coin', ja: 'アルミの こうか', iron: false }, wire: { en: 'Copper wire', ja: 'どうの はりがね', iron: false }, eraser: { en: 'Eraser', ja: 'けしゴム', iron: false }, paper: { en: 'Paper', ja: 'かみ', iron: false },
};
export function magnet({ item = 'clip', distance = 0, poles = 'N-S' }) {
  const it = TEST_ITEMS[item];
  const clips = it.iron ? Math.max(0, Math.round(12 / (1 + (distance / 1.5) ** 2))) : 0;
  return { sticks: it.iron ? 'yes' : 'no', clips, pushPull: poles === 'N-S' || poles === 'S-N' ? 'pull' : 'push', material: it.iron ? 'iron' : 'not-iron' };
}

// 小3 光: mirrors bounce sunlight onto a black card; more mirrors, warmer and brighter.
export function mirrors({ count = 1, minutes = 3 }) {
  const tempC = Math.min(60, Math.round((20 + count * minutes * 1.3) * 10) / 10);
  return { tempC, brighter: count > 1 ? 'brighter' : 'same', rise: Math.round((tempC - 20) * 10) / 10, warmer: count > 1 ? 'warmer' : 'same' };
}

// 小3/中1 音: a plucked string. Shorter, tighter, thinner → higher; a harder pluck is
// louder (a bigger shake), not higher.
export function sound({ length = 60, pluck = 'soft', tension = 'medium' }) {
  const base = 110 * (60 / length) * ({ loose: 0.8, medium: 1, tight: 1.25 }[tension]);
  const hz = Math.round(base);
  return { hz, pitch: hz > 115 ? 'higher' : hz < 105 ? 'lower' : 'same', loud: pluck === 'hard' ? 'louder' : 'softer', shake: pluck === 'hard' ? 'big' : 'small', amplitude: pluck === 'hard' ? 3 : 1 };
}

// 中1 ばね: Hooke's law. A spring of stiffness k (N/cm) stretches by F / k.
export const SPRINGS = { soft: { en: 'Soft spring', ja: 'やわらかい ばね', k: 0.2 }, medium: { en: 'Medium spring', ja: 'ふつうの ばね', k: 0.5 }, stiff: { en: 'Stiff spring', ja: 'かたい ばね', k: 1.0 } };
export function spring({ grams = 100, kind = 'medium' }) {
  const F = grams * 0.0098; // newtons
  const cm = Math.round((F / SPRINGS[kind].k) * 100) / 100;
  return { cm, newtons: Math.round(F * 100) / 100, doubles: 'doubles', proportional: 'yes', bucket: cm < 2 ? 'short' : cm <= 5 ? 'medium' : 'long' };
}
