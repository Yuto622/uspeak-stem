// A transiting exoplanet's light curve, the way Kepler and TESS see it.
//
// A planet crossing in front of its star blocks a little light. How much tells the
// planet's size; how often tells its orbital period; and the period with the star's
// mass gives the orbit's radius. Those three steps are the whole of the Exoplanet
// Hunter, and all three are plain formulae a child can be walked to.
//
// The curve is generated, not fetched: the real archive curves are noisy in ways that
// take a graduate course to clean. But the parameters (depth, period, duration) are
// chosen to match real worlds (see `shared/experiments/exoplanet-hunter.json`), so a
// child who looks up TRAPPIST-1 b afterwards finds the same period.
//
// Deterministic given the seed, so the server regenerates the identical curve.

import { rng } from './rng.js';

export const SOLAR_RADIUS_KM = 695700;
export const JUPITER_RADIUS_KM = 69911;
export const EARTH_RADIUS_KM = 6371;

// Depth of the dip as a fraction of the star's light: (Rp / Rs)^2.
export function transitDepth(planetRadiusKm, starRadiusKm) {
  const k = planetRadiusKm / starRadiusKm;
  return k * k;
}

// Planet radius from a measured depth and the star's radius.
export function planetRadiusFromDepth(depth, starRadiusKm) {
  return Math.sqrt(Math.max(0, depth)) * starRadiusKm;
}

// Orbit radius from the period (days) and the star's mass in solar masses, in AU.
// Kepler's third law with the Sun as the unit: a^3 = M * P^2 (P in years).
export function orbitRadiusAU(periodDays, starMassSolar) {
  const years = periodDays / 365.25;
  return Math.cbrt(starMassSolar * years * years);
}

// Generate a light curve.
//
// `days` long, one point every `cadenceMinutes`. The dip is a flat-bottomed box with
// short ramps (good enough; limb darkening is a later level). Noise is gaussian with
// the given standard deviation, in the same fractional units as the depth.
export function lightCurve({ periodDays, depth, durationHours, days = 27, cadenceMinutes = 30, noise = 0.0005, phase = 0.3, seed = 1 }) {
  const r = rng(seed);
  const step = cadenceMinutes / 1440;
  const half = durationHours / 48; // half-duration in days
  const ramp = Math.min(half * 0.2, 0.02);
  const t = [];
  const flux = [];
  const first = phase * periodDays; // time of the first mid-transit
  for (let time = 0; time <= days; time += step) {
    // distance to the nearest mid-transit
    let d = ((time - first) % periodDays + periodDays) % periodDays;
    if (d > periodDays / 2) d = periodDays - d;
    let dip = 0;
    if (d < half - ramp) dip = depth;
    else if (d < half + ramp) dip = depth * (1 - (d - (half - ramp)) / (2 * ramp));
    t.push(Math.round(time * 1e4) / 1e4);
    flux.push(1 - dip + r.normal() * noise);
  }
  return { t, flux, truth: { periodDays, depth, durationHours, first } };
}

// What a careful child can measure from a curve, used by the judge: the times of the
// dips (local minima below a threshold), from which period and depth follow.
export function findTransits(curve, threshold = 0.6) {
  const { t, flux } = curve;
  const n = flux.length;
  // median as the baseline
  const sorted = [...flux].sort((a, b) => a - b);
  const base = sorted[Math.floor(n / 2)];
  const minFlux = sorted[Math.floor(n * 0.002)];
  const cut = base - (base - minFlux) * threshold;
  const dips = [];
  let inDip = false; let start = 0; let lowest = Infinity;
  for (let i = 0; i < n; i++) {
    if (flux[i] < cut) {
      if (!inDip) { inDip = true; start = i; lowest = Infinity; }
      if (flux[i] < lowest) lowest = flux[i];
    } else if (inDip) {
      inDip = false;
      const end = i - 1;
      dips.push({ mid: (t[start] + t[end]) / 2, depth: base - lowest, hours: (t[end] - t[start]) * 24 });
    }
  }
  const period = dips.length >= 2 ? (dips[dips.length - 1].mid - dips[0].mid) / (dips.length - 1) : null;
  const depth = dips.length ? dips.reduce((s, d) => s + d.depth, 0) / dips.length : null;
  return { dips, period, depth };
}
