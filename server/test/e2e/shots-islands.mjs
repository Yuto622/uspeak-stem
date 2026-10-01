// Screenshots of the five new islands and a handful of their 3D stages, for docs/figures.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../../docs/figures');
const PORT = 2598;
const url = `http://localhost:${PORT}/`;
const press = (page, sel) => page.evaluate((s) => document.querySelector(s).click(), sel);
const server = spawn(process.execPath, ['src/index.js'], { cwd: path.resolve(here, '../..'), env: { ...process.env, PORT: String(PORT), DATA_DIR: mkdtempSync(path.join(tmpdir(), 'stem-shots-')) }, stdio: ['ignore', 'pipe', 'pipe'] });
for (let i = 0; i < 50; i++) { try { const r = await fetch(url + 'healthz'); if (r.ok) break; } catch { /* wait */ } await new Promise((r) => setTimeout(r, 200)); }
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(url);
await page.fill('#lobby-name', 'Hikari'); await page.fill('#lobby-class', 'SHOTS');
await press(page, '#lobby-go');
await page.waitForSelector('#hud:not([hidden])', { state: 'attached', timeout: 60000 });
await page.waitForFunction(() => globalThis.stem?.me?.name);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const mode = process.argv[2] || 'all';
// islands, by day
const data = await page.evaluate(() => fetch('islands.json', { cache: 'no-cache' }).then((r) => r.json()));
const sims = await page.evaluate(() => import('/shared/experiments/index.js').then((m) => Object.fromEntries(m.EXPERIMENTS.map((e) => [e.station, e.sim]))));
for (const isl of (mode === 'stages' || mode === 'new' ? [] : data.islands.map((i) => i.id))) {
  await page.evaluate((id) => globalThis.stem.travel(id), isl);
  await page.waitForFunction((id) => globalThis.stem.world.current === id, isl);
  await wait(2500);
  await page.screenshot({ path: path.join(out, `${isl}.png`) });
  console.log('shot', isl);
}
// one station per island, after the prediction so the scene is running
const ALL = [['cosmos', 'phase-hill', 'moon'], ['cosmos', 'launch-pad', 'orbit'], ['cosmos', 'observatory', 'exoplanet'], ['lab', 'dissolving-bench', 'solubility'], ['lab', 'indicator-shelf', 'acid-base'], ['lab', 'burning-corner', 'candle'], ['force', 'swing-frame', 'pendulum'], ['force', 'slide-ramp', 'ramp'], ['force', 'seesaw', 'lever'], ['life', 'rabbit-meadow', 'meadow'], ['life', 'windowsill', 'plant'], ['life', 'track', 'heart'], ['earth', 'seismo-house', 'quake'], ['earth', 'harbour-wall', 'tsunami'], ['earth', 'weather-tower', 'cloud'], ['maker', 'bridge-yard', 'bridge'], ['maker', 'circuit-shed', 'circuit'], ['maker', 'gear-mill', 'gears'], ['data', 'dice-table', 'dice'], ['data', 'counting-pond', 'pond'], ['data', 'sorting-machine', 'classify']];
const SIMNAME = { gravity: 'orbit', transit: 'exoplanet', acidbase: 'acid-base', massShape: 'mass', metalAcid: 'metal-acid', heating: 'states', mirrors: 'light', cell: 'battery' };
const everything = data.islands.flatMap((i) => i.spots.map((s) => [i.id, s.id, SIMNAME[sims[s.id]] || sims[s.id]]));
const stations = mode === 'islands' ? [] : mode === 'stages' ? everything : mode === 'new' ? everything.filter(([, , n]) => !ALL.some(([, , o]) => o === n)) : ALL.filter(([, , n]) => ['pendulum', 'lever', 'meadow', 'heart', 'quake', 'cloud', 'bridge', 'gears', 'dice', 'classify'].includes(n));
// SKIP_EXISTING=1 resumes an interrupted run: stations whose figure is already on disk are skipped.
for (const [isl, sp, name] of stations.filter(([, , n]) => !process.env.SKIP_EXISTING || !existsSync(path.join(out, `exp-${n}.png`)))) {
  if (globalThis.cur !== isl) { await page.evaluate((id) => globalThis.stem.travel(id), isl); await page.waitForFunction((id) => globalThis.stem.world.current === id, isl); globalThis.cur = isl; }
  const en = await page.evaluate((id) => globalThis.stem.world.island.spots.find((s) => s.id === id).en, sp);
  await page.evaluate((id) => globalThis.stem.walkTo(id), sp);
  await page.waitForFunction((n) => !document.querySelector('#near').hidden && document.querySelector('#area').textContent === n, en, { timeout: 60000 });
  await press(page, '#interact');
  await page.waitForSelector('#lab[open]', { state: 'attached', timeout: 60000 });
  await press(page, '#lab-next');
  await page.waitForSelector('[data-choice]', { state: 'attached', timeout: 60000 });
  await press(page, '[data-choice]');
  await press(page, '#predict-lock');
  await page.waitForSelector('#lab-readout .verdict', { state: 'attached', timeout: 60000 });
  await wait(3500);
  await page.screenshot({ path: path.join(out, `exp-${name}.png`) });
  console.log('shot', name);
  await press(page, '#lab-close');
  await page.waitForFunction(() => !document.querySelector('#lab').open);
}
await browser.close(); server.kill();
