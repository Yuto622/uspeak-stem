// Forces and motion: a pendulum, a ramp with friction, a lever. Textbook formulae a
// child can be walked to, with the real constants. Pure functions.

export const G = 9.81;

// A pendulum's period, with the first large-angle correction so a 30° swing is
// honestly a little slower than a 10° one.
export function pendulum({ length, angle = 15, seconds = 30 }) {
  const th = (angle * Math.PI) / 180;
  const period = 2 * Math.PI * Math.sqrt(length / G) * (1 + (th * th) / 16);
  return { period: Math.round(period * 100) / 100, swings: Math.floor(seconds / period), bucket: period < 1 ? 'under-1' : period <= 2 ? '1-2' : 'over-2' };
}

export const SURFACES = {
  ice: { en: 'Ice', ja: 'こおり', mu: 0.05 },
  wood: { en: 'Wood', ja: 'き', mu: 0.3 },
  rubber: { en: 'Rubber', ja: 'ゴム', mu: 0.7 },
};

// A block on a ramp: slides if the slope beats friction; then how fast at the bottom.
export function ramp({ angle, surface, length = 2 }) {
  const th = (angle * Math.PI) / 180;
  const mu = SURFACES[surface].mu;
  const a = G * (Math.sin(th) - mu * Math.cos(th));
  if (a <= 0) return { moves: 'stays', accel: 0, speed: 0, time: null };
  const time = Math.sqrt((2 * length) / a);
  return { moves: 'slides', accel: Math.round(a * 100) / 100, speed: Math.round(a * time * 100) / 100, time: Math.round(time * 100) / 100 };
}

// A seesaw: which way it tips, and the mass that would balance it.
export function lever({ leftMass, leftDist, rightMass, rightDist }) {
  const l = leftMass * leftDist; const r = rightMass * rightDist;
  const tilt = Math.abs(l - r) < 1e-9 ? 'balanced' : l > r ? 'left' : 'right';
  return { tilt, balanceMass: Math.round((l / rightDist) * 100) / 100, advantage: Math.round((rightDist / leftDist) * 100) / 100 };
}
