// The Moon's phase on a date, and the geometry a child arranges to predict it.
//
// Two things live here. One is the real sky: how full the Moon is tonight, from the
// date alone, good to about a day — enough for "look up tonight and check". The other
// is the model a child builds on the phase hill: put the Sun, the Earth and the Moon
// in a row, and say what the Moon will look like from the Earth. The server runs the
// same function on the same angle, so the "answer" is never sent to the page.

// Mean synodic month (new moon to new moon), days.
export const SYNODIC = 29.530588853;

// A known new moon: 2000-01-06 18:14 UTC (astronomical almanac reference).
const EPOCH_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

// Days since the last new moon, for any date.
export function moonAge(date = new Date()) {
  const days = (date.getTime() - EPOCH_NEW_MOON) / 86400000;
  return ((days % SYNODIC) + SYNODIC) % SYNODIC;
}

// Fraction of the disc that is lit, 0 (new) .. 1 (full), from the age.
export function illumination(age) {
  const phase = (age / SYNODIC) * 2 * Math.PI;
  return (1 - Math.cos(phase)) / 2;
}

// The eight names a child learns, from the age.
export const PHASES = [
  { id: 'new', en: 'New Moon', ja: 'しんげつ' },
  { id: 'waxing-crescent', en: 'Waxing Crescent', ja: 'みかづき' },
  { id: 'first-quarter', en: 'First Quarter', ja: 'じょうげんの つき' },
  { id: 'waxing-gibbous', en: 'Waxing Gibbous', ja: 'ふくらんだ つき' },
  { id: 'full', en: 'Full Moon', ja: 'まんげつ' },
  { id: 'waning-gibbous', en: 'Waning Gibbous', ja: 'かけはじめた つき' },
  { id: 'last-quarter', en: 'Last Quarter', ja: 'かげんの つき' },
  { id: 'waning-crescent', en: 'Waning Crescent', ja: 'ありあけの つき' },
];

export function phaseOfAge(age) {
  const slot = Math.round((age / SYNODIC) * 8) % 8;
  return PHASES[slot];
}

// The model on the hill. `angle` is where the Moon sits around the Earth, in degrees,
// measured from the direction of the Sun: 0 = between Earth and Sun (new), 180 = far
// side (full), 90 = first quarter, 270 = last quarter.
export function phaseOfAngle(angleDeg) {
  const a = ((angleDeg % 360) + 360) % 360;
  return phaseOfAge((a / 360) * SYNODIC);
}

export function illuminationOfAngle(angleDeg) {
  const a = ((angleDeg % 360) + 360) % 360;
  return illumination((a / 360) * SYNODIC);
}

// Which side is lit, as seen from the northern hemisphere: 'right' while waxing,
// 'left' while waning. The detail that separates a crescent from its mirror image.
export function litSide(angleDeg) {
  const a = ((angleDeg % 360) + 360) % 360;
  return a < 180 ? 'right' : 'left';
}
