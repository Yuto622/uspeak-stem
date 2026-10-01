// Earth: the two waves of an earthquake, the speed of a tsunami, where clouds form.
// These are the numbers behind Japan's early warnings, which is why they are here.

export const P_SPEED = 6.0;   // km/s in the crust
export const S_SPEED = 3.5;

// P arrives first and does little; S arrives later and shakes. The gap is the warning.
export function quake({ distance, magnitude = 5 }) {
  const p = distance / P_SPEED; const s = distance / S_SPEED;
  const gap = s - p;
  const shaking = Math.max(0, Math.min(7, Math.round((magnitude - 1 - Math.log10(Math.max(10, distance)) * 1.5) * 10) / 10));
  return { first: 'P', pSeconds: Math.round(p * 10) / 10, sSeconds: Math.round(s * 10) / 10, gap: Math.round(gap * 10) / 10, warning: Math.round(Math.max(0, gap - 3) * 10) / 10, shaking, distanceFromGap: Math.round(gap * (P_SPEED * S_SPEED) / (P_SPEED - S_SPEED)) };
}

// A tsunami moves at sqrt(g * depth): a jet in the deep ocean, a bus near the shore.
export function tsunami({ depth, distance }) {
  const ms = Math.sqrt(9.81 * depth); const kmh = ms * 3.6;
  const hours = distance / kmh;
  return { speedKmh: Math.round(kmh), deeper: depth > 1000 ? 'deep-faster' : 'shallow-slower', minutes: Math.round(hours * 60), height: depth > 1000 ? 'low' : 'high' };
}

// Dew point (Magnus) and the height where a rising parcel reaches it: the cloud base.
export function cloud({ tempC, humidity }) {
  const a = 17.27; const b = 237.7;
  const g = (a * tempC) / (b + tempC) + Math.log(humidity / 100);
  const dew = (b * g) / (a - g);
  const base = Math.max(0, (tempC - dew) * 125);
  return { dewPoint: Math.round(dew * 10) / 10, cloudBase: Math.round(base), forms: base < 2500 ? 'cloud' : 'clear', rain: humidity >= 90 && tempC - dew < 2 ? 'likely' : 'unlikely' };
}
