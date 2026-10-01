// Earth science, the textbook sequence: 太陽とかげ (小3), 雨水のゆくえ (小4),
// 流れる水のはたらき (小5), 土地のつくり (小6), 火山 (中1). Pure functions.

// 小3 太陽と地面: the sun's position over Tokyo (35.7°N) by hour and month, and the
// shadow of a 1 m stick: opposite the sun, long in the morning, shortest at noon.
export function shadow({ hour = 12, month = 6, lat = 35.7 }) {
  const decl = 23.44 * Math.sin(((2 * Math.PI) / 12) * (month - 3)); // rough declination by month
  const H = (hour - 12) * 15; // hour angle
  const rad = Math.PI / 180;
  const sinAlt = Math.sin(lat * rad) * Math.sin(decl * rad) + Math.cos(lat * rad) * Math.cos(decl * rad) * Math.cos(H * rad);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt))) / rad;
  const cosAz = (Math.sin(decl * rad) - Math.sin(alt * rad) * Math.sin(lat * rad)) / (Math.cos(alt * rad) * Math.cos(lat * rad));
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz))) / rad; if (H > 0) az = 360 - az; // from north, clockwise
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const sunDir = dirs[Math.round(az / 45) % 8];
  const shadowDir = dirs[(Math.round(az / 45) + 4) % 8];
  const length = alt > 0 ? Math.round((1 / Math.tan(alt * rad)) * 100) / 100 : null;
  return { altitude: Math.round(alt * 10) / 10, sunDir, shadowDir, length, up: alt > 0 ? 'yes' : 'no', shortestAt: 12, warmer: alt > 45 ? 'yes' : 'no' };
}

// 小4 雨水のゆくえ: water drains through gravel in seconds, sand in a minute, clay slowly.
export const GRAINS = { gravel: { en: 'Gravel', ja: 'れき（こいし）', seconds: 8 }, sand: { en: 'Sand', ja: 'すな', seconds: 45 }, soil: { en: 'Garden soil', ja: 'はたけの つち', seconds: 180 }, clay: { en: 'Clay', ja: 'ねんど', seconds: 900 } };
export function soil({ grain = 'sand' }) {
  const s = GRAINS[grain].seconds;
  return { seconds: s, fastest: 'gravel', slowest: 'clay', puddle: s > 300 ? 'yes' : 'no', bucket: s < 30 ? 'fast' : s < 300 ? 'medium' : 'slow', grainSize: { gravel: 4, sand: 3, soil: 2, clay: 1 }[grain] };
}

// 小5 流れる水のはたらき: steeper and fuller, faster; the outside of a bend is cut
// away, the inside builds up; fast water carries bigger grains.
export function river({ slope = 3, flow = 'medium' }) {
  const q = { low: 0.6, medium: 1, high: 1.6 }[flow];
  const speed = Math.round(Math.sqrt(slope * q) * 0.5 * 100) / 100; // m/s
  const carries = speed < 0.5 ? 'mud' : speed < 1.0 ? 'sand' : 'gravel';
  return { speed, erodes: 'outer', deposits: 'inner', carries, flood: flow === 'high' && slope >= 3 ? 'yes' : 'no', faster: slope > 3 || flow === 'high' ? 'faster' : 'same' };
}

// 小6 地層: tip mixed gravel, sand and mud into still water. The heavy, big grains
// settle first; the mud last, on top. Do it twice and you have layers.
export function strata({ pours = 1, mix = 'all' }) {
  const order = mix === 'all' ? ['gravel', 'sand', 'mud'] : mix === 'sand-mud' ? ['sand', 'mud'] : ['gravel', 'sand'];
  return { bottom: order[0], top: order[order.length - 1], layers: order.length * pours, order: order.join('-'), middle: order.length === 3 ? 'sand' : 'none' };
}

// 中1 火山: sticky magma makes a steep dome and violent eruptions with pale rock; runny
// magma makes a gentle shield with dark rock.
export function volcano({ viscosity = 'medium' }) {
  const v = { runny: 0, medium: 1, sticky: 2 }[viscosity];
  return { shape: ['shield', 'cone', 'dome'][v], eruption: ['gentle', 'moderate', 'explosive'][v], rock: ['black', 'grey', 'white'][v], steep: v === 2 ? 'steep' : v === 0 ? 'flat' : 'medium', example: ['Mauna Loa', 'Sakurajima', 'Unzen'][v], stickiness: v, steepness: v };
}
