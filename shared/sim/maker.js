// Engineering: a beam that sags, a circuit that lights, gears that turn.

export const MATERIALS = {
  wood: { en: 'Wood', ja: 'き', E: 11e9, strength: 40e6 },
  steel: { en: 'Steel', ja: 'はがね', E: 200e9, strength: 250e6 },
  plastic: { en: 'Plastic', ja: 'プラスチック', E: 2.5e9, strength: 30e6 },
};
// A simply supported beam, load in the middle, 10 cm wide. Sag and whether it holds.
export function bridge({ span, material, thickness, load }) {
  const { E, strength } = MATERIALS[material];
  const b = 0.1; const h = thickness / 100; const L = span; const F = load * 9.81;
  const I = (b * h * h * h) / 12;
  const sag = (F * L * L * L) / (48 * E * I);               // m
  const stress = (F * L / 4) * (h / 2) / I;                 // Pa
  const maxLoad = (strength * I * 4) / (L * (h / 2) * 9.81);  // kg
  return { sagMm: Math.round(sag * 1000 * 10) / 10, holds: stress < strength ? 'holds' : 'breaks', maxLoad: Math.round(maxLoad), stressMPa: Math.round(stress / 1e6) };
}

// Ohm's law with bulbs in series: each bulb is 20 ohms; brightness from current.
export function circuit({ volts, resistance, bulbs = 1 }) {
  const R = resistance + bulbs * 20;
  const amps = volts / R;
  const mA = Math.round(amps * 1000 * 10) / 10;
  return { mA, brightness: mA < 5 ? 'off' : mA < 30 ? 'dim' : mA < 120 ? 'bright' : 'blown', watts: Math.round(volts * amps * 100) / 100, forTwenty: Math.round(volts / 0.02 - bulbs * 20) };
}

// Two meshed gears: speed and direction follow the teeth.
export function gears({ driverTeeth, drivenTeeth, rpm }) {
  const ratio = driverTeeth / drivenTeeth;
  return { outRpm: Math.round(rpm * ratio * 10) / 10, direction: 'opposite', faster: ratio > 1 ? 'faster' : ratio < 1 ? 'slower' : 'same', torqueRatio: Math.round((1 / ratio) * 100) / 100 };
}
