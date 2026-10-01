// Run an experiment: parameters in, measurements out. The one function both sides call.
//
// The page calls it to draw. The server calls it to judge. Because it is the same
// function on the same inputs with the same seed, the two agree to the last digit, and
// a measurement a page reports that disagrees with the server's was not measured.

import * as gravity from './gravity.js';
import * as moon from './moon.js';
import * as transit from './transit.js';
import { seedOf } from './rng.js';

export function runExperiment(exp, params, { seed = 0 } = {}) {
  switch (exp.sim) {
    case 'moon': {
      const angle = params.angle;
      const phase = moon.phaseOfAngle(angle);
      const lit = moon.illuminationOfAngle(angle);
      return { phase: phase.id, lit: Math.round(lit * 1000) / 1000, side: moon.litSide(angle) };
    }
    case 'gravity': {
      const r = gravity.launch({ body: params.body, altitude: params.altitude, speed: params.speed });
      return {
        outcome: r.outcome,
        period: r.period === null ? null : Math.round((r.period / 60) * 10) / 10, // minutes
        apoapsis: Math.round(r.apoapsis),
        periapsis: Math.round(r.periapsis),
        trail: r.trail,
      };
    }
    case 'transit': {
      const t = exp.targets[params.target];
      const curve = transit.lightCurve({
        periodDays: t.periodDays, depth: t.depth, durationHours: t.durationHours, noise: t.noise,
        seed: seedOf(`${exp.id}|${params.target}|${seed}`),
      });
      const found = transit.findTransits(curve);
      const starR = t.starRadiusSolar * transit.SOLAR_RADIUS_KM;
      const rp = found.depth === null ? null : transit.planetRadiusFromDepth(found.depth, starR);
      return {
        dips: found.dips.length,
        periodDays: found.period === null ? null : Math.round(found.period * 1000) / 1000,
        depth: found.depth === null ? null : Math.round(found.depth * 1e5) / 1e5,
        planetRadiusEarths: rp === null ? null : Math.round((rp / transit.EARTH_RADIUS_KM) * 100) / 100,
        orbitAU: found.period === null ? null : Math.round(transit.orbitRadiusAU(found.period, t.starMassSolar) * 1e4) / 1e4,
        curve: { t: curve.t, flux: curve.flux },
      };
    }
    default:
      throw new Error(`unknown sim ${exp.sim}`);
  }
}

// The measurements without the bulky drawing data (trail, curve). What the room stores
// and what the judge compares.
export function measurementsOnly(result) {
  const { trail, curve, ...rest } = result;
  return rest;
}

// Bucket for the Explore level of the exoplanet hunter ("how many dips?").
export function dipsBucket(n) {
  if (n <= 0) return '0';
  if (n <= 3) return '1-3';
  if (n <= 9) return '4-9';
  return '10+';
}
