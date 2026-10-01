// Newtonian gravity in two dimensions, integrated with velocity Verlet at a fixed step.
//
// This is the engine under the launch pad on COSMOS: a child picks a speed, the body
// falls back, circles, or escapes. Velocity Verlet is symplectic, so an orbit that
// should close keeps closing instead of slowly spiralling in or out — the thing a
// child would notice first, and the thing a naive Euler step gets wrong.
//
// It is deterministic and the step is fixed, so the server can run the same launch
// with the same inputs and compare its period with the one the page reports. The
// browser and the server import this same file.
//
// Units: kilometres, seconds, kilograms. G is in km^3 kg^-1 s^-2.

export const G = 6.674e-20;

// Bodies a child can launch from. Real numbers, because a child who later looks
// them up should find the same ones.
export const BODIES = {
  earth: { id: 'earth', en: 'Earth', ja: 'ちきゅう', mass: 5.972e24, radius: 6371, color: 0x3f7fd0 },
  moon: { id: 'moon', en: 'Moon', ja: 'つき', mass: 7.348e22, radius: 1737, color: 0xc9c7c0 },
  mars: { id: 'mars', en: 'Mars', ja: 'かせい', mass: 6.417e23, radius: 3390, color: 0xd4713d },
  jupiter: { id: 'jupiter', en: 'Jupiter', ja: 'もくせい', mass: 1.898e27, radius: 69911, color: 0xd9a066 },
};

export const DT = 1; // one second per step; a low orbit takes ~5,000 steps

// Circular orbit speed at a radius (km/s). The number the Investigate level asks for.
export function circularSpeed(body, r) {
  return Math.sqrt((G * body.mass) / r);
}

// Escape speed at a radius (km/s).
export function escapeSpeed(body, r) {
  return Math.sqrt((2 * G * body.mass) / r);
}

// Period of a circular orbit at a radius (seconds). Kepler's third law in its simplest form.
export function circularPeriod(body, r) {
  return 2 * Math.PI * Math.sqrt((r * r * r) / (G * body.mass));
}

// Radius of a circular orbit with a given period (km). Geostationary: 86,164 s -> 42,164 km.
export function radiusForPeriod(body, seconds) {
  return Math.cbrt((G * body.mass * seconds * seconds) / (4 * Math.PI * Math.PI));
}

// Launch sideways from a height above the surface at a speed, and follow the path.
//
// Returns the outcome a child sees: 'crash' (came back down), 'orbit' (came round to
// where it started), or 'escape' (got far away and kept going), plus the period when
// it orbits and a thinned trail of positions for drawing.
//
// `maxSteps` bounds the work: a geostationary orbit is 86,164 steps at DT=1, so the
// default allows two of those. The server runs this too and must never loop forever.
export function launch({ body, altitude, speed, maxSteps = 200000, trailEvery = 20 }) {
  const b = typeof body === 'string' ? BODIES[body] : body;
  const r0 = b.radius + altitude;
  const mu = G * b.mass;
  let x = r0; let y = 0; let vx = 0; let vy = speed;
  const accel = (px, py) => {
    const d2 = px * px + py * py;
    const d = Math.sqrt(d2);
    const a = -mu / (d2 * d);
    return [a * px, a * py];
  };
  let [ax, ay] = accel(x, y);
  const trail = [[x, y]];
  let outcome = 'orbit';
  let period = null;
  let maxR = r0;
  let minR = r0;
  let prevAngle = 0;
  let turned = 0; // accumulated angle, to know when a full lap is done
  let steps = 0;
  const escapeR = r0 * 60; // far enough that a bound orbit this big is not what a child meant
  for (; steps < maxSteps; steps++) {
    // velocity Verlet
    x += vx * DT + 0.5 * ax * DT * DT;
    y += vy * DT + 0.5 * ay * DT * DT;
    const [nax, nay] = accel(x, y);
    vx += 0.5 * (ax + nax) * DT;
    vy += 0.5 * (ay + nay) * DT;
    ax = nax; ay = nay;
    const r = Math.sqrt(x * x + y * y);
    if (r > maxR) maxR = r;
    if (r < minR) minR = r;
    if (steps % trailEvery === 0) trail.push([x, y]);
    if (r <= b.radius) { outcome = 'crash'; break; }
    if (r > escapeR) { outcome = 'escape'; break; }
    const angle = Math.atan2(y, x);
    let d = angle - prevAngle;
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    turned += d;
    prevAngle = angle;
    if (Math.abs(turned) >= 2 * Math.PI) { period = (steps + 1) * DT; break; }
  }
  if (outcome === 'orbit' && period === null) outcome = 'escape'; // ran out of steps: unbound or too slow to matter
  // An orbit that never gets near the ground but whose energy is positive is an escape
  // even if we stopped early; the energy check is the honest answer.
  const v2 = vx * vx + vy * vy;
  const energy = v2 / 2 - mu / Math.sqrt(x * x + y * y);
  if (outcome === 'orbit' && energy >= 0) outcome = 'escape';
  trail.push([x, y]);
  return {
    outcome,
    period,              // seconds, or null
    apoapsis: maxR - b.radius,
    periapsis: minR - b.radius,
    steps,
    trail,
    energy,
  };
}
