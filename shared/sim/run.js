// Run an experiment: parameters in, measurements out. The one function both sides call.
//
// The page calls it to draw. The server calls it to judge. Because it is the same
// function on the same inputs with the same seed, the two agree to the last digit, and
// a measurement a page reports that disagrees with the server's was not measured.

import * as gravity from './gravity.js';
import * as moon from './moon.js';
import * as transit from './transit.js';
import * as chem from './chem.js';
import * as force from './force.js';
import * as life from './life.js';
import * as earth from './earth.js';
import * as maker from './maker.js';
import * as data from './data.js';
import * as chem2 from './chem2.js';
import * as phys2 from './phys2.js';
import * as elec from './elec.js';
import * as bio2 from './bio2.js';
import * as geo2 from './geo2.js';
import * as sky2 from './sky2.js';
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
    case 'solubility': {
      const r = chem.dissolve({ solute: params.solute, grams: params.grams, tempC: params.tempC });
      return { dissolved: r.dissolved, left: r.left, saturated: String(r.saturated), limit: r.limit };
    }
    case 'acidbase': {
      const r = chem.testLiquid({ liquid: params.liquid, indicator: params.indicator });
      return { pH: r.pH, kind: r.kind, color: r.color, kindNumber: r.kind === 'acid' ? -1 : r.kind === 'base' ? 1 : 0 };
    }
    case 'candle': {
      const r = chem.candle({ litres: params.litres, o2: Number(params.o2), candles: params.candles });
      // Explore asks "longer or shorter than the 1-litre jar in air (20 s)?"
      const base = chem.candle({ litres: 1, o2: chem.O2_AIR, candles: 1 }).seconds;
      return { ...r, longer: r.seconds > base ? 'longer' : 'shorter' };
    }
    case 'pendulum': return force.pendulum({ length: params.length, angle: params.angle });
    case 'ramp': return force.ramp({ angle: params.angle, surface: params.surface });
    case 'lever': return force.lever(params);
    case 'meadow': return life.meadow({ rabbits: params.rabbits, foxes: params.foxes, grass: params.grass });
    case 'plant': return life.plant({ water: params.water, light: params.light, tempC: params.tempC });
    case 'heart': return life.heart({ activity: params.activity, minutes: params.minutes, age: params.age });
    case 'quake': return earth.quake({ distance: params.distance, magnitude: params.magnitude });
    case 'tsunami': return earth.tsunami({ depth: params.depth, distance: params.distance });
    case 'cloud': return earth.cloud({ tempC: params.tempC, humidity: params.humidity });
    case 'bridge': return maker.bridge({ span: params.span, material: params.material, thickness: params.thickness, load: params.load });
    case 'circuit': return maker.circuit({ volts: params.volts, resistance: Number(params.resistance), bulbs: params.bulbs });
    case 'gears': return maker.gears({ driverTeeth: params.driverTeeth, drivenTeeth: params.drivenTeeth, rpm: params.rpm });
    case 'dice': { const r = data.dice({ count: params.count, rolls: Number(params.rolls), seed: seedOf(`${exp.id}|${seed}`) }); return { ...r, rolls: Number(params.rolls) }; }
    case 'pond': return data.pond({ marked: params.marked, caught: params.caught, seed: seedOf(`${exp.id}|${seed}`) });
    case 'classify': return data.classify({ weight: params.weight, color: params.color, k: Number(params.k), seed: seedOf(`${exp.id}|${seed}`) });
    // chemistry, 小3 → 中3
    case 'massShape': return chem2.massShape({ material: params.material, volume: params.volume, shape: params.shape });
    case 'compress': return chem2.compress({ fluid: params.fluid, push: params.push });
    case 'expansion': return chem2.expansion({ substance: params.substance, deltaT: params.deltaT });
    case 'heating': return chem2.heating({ minutes: params.minutes, power: Number(params.power) });
    case 'metalAcid': return chem2.metalAcid({ metal: params.metal, solution: params.solution });
    case 'density': return chem2.density({ material: params.material, volume: params.volume });
    case 'distill': return chem2.distill({ ethanolPct: params.ethanolPct, tube: Number(params.tube) });
    case 'conservation': return chem2.conservation({ reaction: params.reaction, lid: params.lid, grams: params.grams });
    case 'oxidation': return chem2.oxidation({ metal: params.metal, grams: params.grams });
    case 'electrolysis': return chem2.electrolysis({ current: params.current, minutes: params.minutes });
    case 'titration': return chem2.titration({ acidMl: params.acidMl, acidC: Number(params.acidC), baseC: Number(params.baseC), baseMl: params.baseMl });
    case 'cell': return chem2.cell({ metalA: params.metalA, metalB: params.metalB });
    // forces and light and sound
    case 'rubber': return phys2.rubber({ stretch: params.stretch, mass: params.mass });
    case 'magnet': return phys2.magnet({ item: params.item, distance: params.distance, poles: params.poles });
    case 'mirrors': return phys2.mirrors({ count: params.count, minutes: params.minutes });
    case 'sound': return phys2.sound({ length: params.length, pluck: params.pluck, tension: params.tension });
    case 'spring': return phys2.spring({ grams: params.grams, kind: params.kind });
    // electricity
    case 'conductor': return elec.conductor({ item: params.item });
    case 'cells': return elec.cells({ count: params.count, wiring: params.wiring });
    case 'electromagnet': return elec.electromagnet({ turns: params.turns, cellsN: params.cellsN });
    case 'generator': return elec.generator({ turns: params.turns, device: params.device });
    // life
    case 'germination': return bio2.germination({ water: params.water, air: params.air, tempC: params.tempC, light: params.light });
    case 'medaka': return bio2.medaka({ tempC: params.tempC });
    case 'saliva': return bio2.saliva({ saliva: params.saliva, tempC: params.tempC, minutes: params.minutes });
    case 'breath': return bio2.breath({ activity: params.activity, sample: params.sample });
    case 'photosynthesis': return bio2.photosynthesis({ light: params.light, hours: params.hours, cover: params.cover });
    case 'butterfly': return bio2.butterfly({ tempC: params.tempC, day: params.day });
    case 'genetics': return bio2.genetics({ cross: params.cross, seeds: Number(params.seeds), seed: seedOf(`${exp.id}|${seed}`) });
    // earth
    case 'shadow': return geo2.shadow({ hour: params.hour, month: params.month });
    case 'soil': return geo2.soil({ grain: params.grain });
    case 'river': return geo2.river({ slope: params.slope, flow: params.flow });
    case 'strata': return geo2.strata({ pours: params.pours, mix: params.mix });
    case 'volcano': return geo2.volcano({ viscosity: params.viscosity });
    // sky
    case 'stars': return sky2.stars({ hours: params.hours, direction: params.direction });
    case 'seasons': return sky2.seasons({ month: params.month });
    case 'planets': return sky2.planets({ planet: params.planet });
    // data
    case 'polygon': return data.polygon({ sides: params.sides, angle: params.angle });
    default:
      throw new Error(`unknown sim ${exp.sim}`);
  }
}

// The measurements without the bulky drawing data (trail, curve). What the room stores
// and what the judge compares.
export function measurementsOnly(result) {
  const { trail, curve, trace, hist, train, near, path, ...rest } = result;
  return rest;
}

// Bucket for the Explore level of the exoplanet hunter ("how many dips?").
export function dipsBucket(n) {
  if (n <= 0) return '0';
  if (n <= 3) return '1-3';
  if (n <= 9) return '4-9';
  return '10+';
}
