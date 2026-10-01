// The sky, the textbook sequence: 月や星の動き (小4), 太陽の高さと季節・太陽系 (中3).

// 小4 星の動き: the sky turns 15° an hour. Looking east, stars rise up and to the
// right; looking south they move right; looking west they sink; looking north they
// circle the Pole Star anticlockwise.
export function stars({ hours = 2, direction = 'east' }) {
  const degrees = hours * 15;
  const motion = { east: 'up-right', south: 'right', west: 'down-right', north: 'anticlockwise' }[direction];
  return { degrees, motion, fixed: direction === 'north' ? 'Polaris' : 'none', back: 'yes' };
}

// 中3 太陽の高さと季節: the noon altitude is 90 − latitude + declination, so summer is
// high and long; the day lasts longer the higher the sun climbs.
export function seasons({ month = 6, lat = 35.7 }) {
  const decl = 23.44 * Math.sin(((2 * Math.PI) / 12) * (month - 3));
  const noonAlt = Math.round((90 - lat + decl) * 10) / 10;
  const rad = Math.PI / 180;
  const cosH = -Math.tan(lat * rad) * Math.tan(decl * rad);
  const dayHours = Math.round(((2 * Math.acos(Math.max(-1, Math.min(1, cosH)))) / rad / 15) * 10) / 10;
  const season = month >= 3 && month <= 5 ? 'spring' : month >= 6 && month <= 8 ? 'summer' : month >= 9 && month <= 11 ? 'autumn' : 'winter';
  return { noonAlt, dayHours, season, higher: noonAlt > 55 ? 'high' : 'low', sunriseDir: decl > 5 ? 'NE' : decl < -5 ? 'SE' : 'E' };
}

// 中3 太陽系: Kepler's third law. A planet at a AU takes a^1.5 years to go round.
export const PLANETS = { mercury: { en: 'Mercury', ja: 'すいせい', au: 0.39 }, venus: { en: 'Venus', ja: 'きんせい', au: 0.72 }, earth: { en: 'Earth', ja: 'ちきゅう', au: 1 }, mars: { en: 'Mars', ja: 'かせい', au: 1.52 }, jupiter: { en: 'Jupiter', ja: 'もくせい', au: 5.2 }, saturn: { en: 'Saturn', ja: 'どせい', au: 9.58 } };
export function planets({ planet = 'mars' }) {
  const au = PLANETS[planet].au;
  const years = Math.round(Math.pow(au, 1.5) * 100) / 100;
  return { years, au, slower: years > 1 ? 'slower' : years < 1 ? 'faster' : 'same', speedKms: Math.round((29.8 / Math.sqrt(au)) * 10) / 10 };
}
