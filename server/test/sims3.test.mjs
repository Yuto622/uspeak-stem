import test from 'node:test';
import assert from 'node:assert/strict';
import * as chem2 from '../../shared/sim/chem2.js';
import * as phys2 from '../../shared/sim/phys2.js';
import * as elec from '../../shared/sim/elec.js';
import * as bio2 from '../../shared/sim/bio2.js';
import * as geo2 from '../../shared/sim/geo2.js';
import * as sky2 from '../../shared/sim/sky2.js';
import { polygon } from '../../shared/sim/data.js';

test('chemistry 小3〜小4: shape keeps mass, air squashes, air swells most, water pauses at 0 and 100', () => {
  assert.equal(chem2.massShape({ material: 'plastic', volume: 50, shape: 'flat' }).shapeChanges, 'same');
  assert.ok(chem2.massShape({ material: 'iron', volume: 50 }).grams > chem2.massShape({ material: 'wood', volume: 50 }).grams);
  assert.equal(chem2.compress({ fluid: 'air', push: 1 }).volume, 25); assert.equal(chem2.compress({ fluid: 'water', push: 3 }).volume, 50);
  assert.ok(chem2.expansion({ substance: 'air', deltaT: 30 }).deltaMl > chem2.expansion({ substance: 'water', deltaT: 30 }).deltaMl * 10);
  assert.equal(chem2.heating({ minutes: 0.1 }).state, 'ice'); assert.equal(chem2.heating({ minutes: 2 }).tempC, 0); assert.equal(chem2.heating({ minutes: 2 }).state, 'melting');
  assert.ok(Math.abs(chem2.heating({ minutes: 8 }).meltEndMin - 5.1) < 0.2); assert.equal(chem2.heating({ minutes: 15 }).state, 'boiling'); assert.equal(chem2.heating({ minutes: 15 }).tempC, 100);
});
test('chemistry 小6〜中3: metals and acid, density floats, distillation, conservation, 4:1 and 3:2, 2:1, BTB, cells', () => {
  assert.equal(chem2.metalAcid({ metal: 'copper', solution: 'hcl' }).bubbles, 'no'); assert.equal(chem2.metalAcid({ metal: 'aluminium', solution: 'naoh' }).bubbles, 'yes'); assert.equal(chem2.metalAcid({ metal: 'magnesium', solution: 'hcl' }).rate, 'fast');
  assert.equal(chem2.density({ material: 'wood', volume: 20 }).floats, 'floats'); assert.equal(chem2.density({ material: 'iron', volume: 20 }).grams, 157.4);
  assert.equal(chem2.distill({ ethanolPct: 20, tube: 1 }).burns, 'yes'); assert.equal(chem2.distill({ ethanolPct: 20, tube: 3 }).burns, 'no');
  assert.equal(chem2.conservation({ reaction: 'fizz', lid: 'on', grams: 1 }).change, 'same'); assert.equal(chem2.conservation({ reaction: 'fizz', lid: 'off', grams: 1 }).change, 'less'); assert.equal(chem2.conservation({ reaction: 'copperAir', lid: 'off', grams: 1 }).change, 'more');
  assert.equal(chem2.oxidation({ metal: 'copper', grams: 4 }).oxygen, 1); assert.equal(chem2.oxidation({ metal: 'magnesium', grams: 3 }).oxide, 5);
  const el = chem2.electrolysis({ current: 1, minutes: 1 }); assert.ok(Math.abs(el.h2ml - 7.6) < 0.1); assert.ok(Math.abs(el.h2ml / el.o2ml - 2) < 0.01);
  assert.equal(chem2.titration({ acidMl: 10, acidC: 0.1, baseC: 0.1, baseMl: 10 }).color, 'green'); assert.equal(chem2.titration({ acidMl: 10, acidC: 0.1, baseC: 0.1, baseMl: 4 }).color, 'yellow'); assert.equal(chem2.titration({ acidMl: 10, acidC: 0.1, baseC: 0.1, baseMl: 14 }).color, 'blue');
  assert.equal(chem2.cell({ metalA: 'zinc', metalB: 'copper' }).volts, 1.1); assert.equal(chem2.cell({ metalA: 'zinc', metalB: 'copper' }).negative, 'zinc'); assert.equal(chem2.cell({ metalA: 'copper', metalB: 'copper' }).works, 'no');
});
test('forces, light, sound, electricity', () => {
  assert.ok(phys2.rubber({ stretch: 20 }).metres > phys2.rubber({ stretch: 10 }).metres * 3.5);
  assert.equal(phys2.magnet({ item: 'coin' }).sticks, 'no'); assert.equal(phys2.magnet({ item: 'clip', poles: 'N-N' }).pushPull, 'push'); assert.ok(phys2.magnet({ item: 'clip', distance: 3 }).clips < phys2.magnet({ item: 'clip', distance: 0 }).clips);
  assert.ok(phys2.mirrors({ count: 3, minutes: 3 }).tempC > phys2.mirrors({ count: 1, minutes: 3 }).tempC);
  assert.equal(phys2.sound({ length: 30 }).pitch, 'higher'); assert.equal(phys2.sound({ length: 60, pluck: 'hard' }).loud, 'louder');
  assert.equal(phys2.spring({ grams: 200, kind: 'medium' }).cm, phys2.spring({ grams: 100, kind: 'medium' }).cm * 2);
  assert.equal(elec.conductor({ item: 'wire' }).lights, 'yes'); assert.equal(elec.conductor({ item: 'eraser' }).lights, 'no');
  assert.equal(elec.cells({ count: 2, wiring: 'series' }).volts, 3); assert.equal(elec.cells({ count: 2, wiring: 'parallel' }).hours, 4);
  assert.equal(elec.electromagnet({ turns: 200, cellsN: 2 }).clips, 16);
  assert.ok(elec.generator({ turns: 20, device: 'led' }).seconds > elec.generator({ turns: 20, device: 'bulb' }).seconds * 5);
});
test('life: germination needs water, air and warmth (not light); medaka at 25°C in 10 days; saliva; breath; starch; butterfly; peas 3:1', () => {
  assert.equal(bio2.germination({ water: 'yes', air: 'yes', tempC: 20, light: 'dark' }).germinates, 'yes'); assert.equal(bio2.germination({ water: 'yes', air: 'yes', tempC: 5 }).missing, 'cold'); assert.equal(bio2.germination({ water: 'yes', air: 'no', tempC: 20 }).germinates, 'no');
  assert.equal(bio2.medaka({ tempC: 25 }).days, 10); assert.equal(bio2.medaka({ tempC: 10 }).hatches, 'no');
  assert.equal(bio2.saliva({ saliva: 'yes', tempC: 40, minutes: 10 }).iodine, 'brown'); assert.equal(bio2.saliva({ saliva: 'no', tempC: 40, minutes: 10 }).iodine, 'blue-black'); assert.equal(bio2.saliva({ saliva: 'yes', tempC: 0, minutes: 10 }).iodine, 'blue-black');
  assert.equal(bio2.breath({ sample: 'out' }).limewater, 'cloudy'); assert.ok(bio2.breath({ activity: 'run' }).breathsPerMin > bio2.breath({ activity: 'rest' }).breathsPerMin);
  assert.equal(bio2.photosynthesis({ light: 'sun', hours: 4, cover: 'none' }).starch, 'yes'); assert.equal(bio2.photosynthesis({ light: 'sun', hours: 4, cover: 'foil' }).starch, 'no');
  assert.equal(bio2.butterfly({ tempC: 25, day: 1 }).stage, 'egg'); assert.equal(bio2.butterfly({ tempC: 25, day: 40 }).stage, 'adult'); assert.ok(bio2.butterfly({ tempC: 30 }).totalDays < bio2.butterfly({ tempC: 20 }).totalDays);
  const g = bio2.genetics({ cross: 'Rr-Rr', seeds: 400, seed: 3 }); assert.equal(g.ratio, '3:1'); assert.ok(g.roundPct > 68 && g.roundPct < 82); assert.equal(bio2.genetics({ cross: 'RR-rr', seeds: 50, seed: 1 }).wrinkled, 0);
});
test('earth and sky: noon shadow north and short, gravel drains fast, outer bank, gravel at the bottom, sticky magma domes, 15°/h, June high, Mars 1.88 y, square closes', () => {
  const noon = geo2.shadow({ hour: 12, month: 6 }); assert.equal(noon.shadowDir, 'N'); assert.ok(noon.length < geo2.shadow({ hour: 9, month: 6 }).length);
  assert.ok(geo2.soil({ grain: 'gravel' }).seconds < geo2.soil({ grain: 'clay' }).seconds); assert.equal(geo2.soil({ grain: 'clay' }).puddle, 'yes');
  assert.equal(geo2.river({ slope: 3, flow: 'medium' }).erodes, 'outer'); assert.ok(geo2.river({ slope: 6, flow: 'high' }).speed > geo2.river({ slope: 1, flow: 'low' }).speed);
  assert.equal(geo2.strata({ pours: 2, mix: 'all' }).bottom, 'gravel'); assert.equal(geo2.strata({ pours: 2, mix: 'all' }).layers, 6);
  assert.equal(geo2.volcano({ viscosity: 'sticky' }).shape, 'dome'); assert.equal(geo2.volcano({ viscosity: 'runny' }).rock, 'black');
  assert.equal(sky2.stars({ hours: 2, direction: 'east' }).degrees, 30); assert.equal(sky2.stars({ direction: 'north' }).fixed, 'Polaris');
  assert.ok(sky2.seasons({ month: 6 }).noonAlt > 75); assert.ok(sky2.seasons({ month: 12 }).dayHours < 10.5); assert.equal(sky2.seasons({ month: 7 }).season, 'summer');
  assert.ok(Math.abs(sky2.planets({ planet: 'mars' }).years - 1.88) < 0.02); assert.equal(sky2.planets({ planet: 'mercury' }).slower, 'faster');
  assert.equal(polygon({ sides: 4, angle: 90 }).closes, 'yes'); assert.equal(polygon({ sides: 5, angle: 144 }).name, 'star'); assert.equal(polygon({ sides: 4, angle: 80 }).closes, 'no');
});
