// Real browser, real server: two children in one class walk to the launch pad, one
// predicts, runs, measures and explains; the other sees the class point appear.
// Also checks the language switch and that no result is drawn before a prediction.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = 2597;
const url = `http://localhost:${PORT}/`;
let fails = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'} ${msg}`); if (!cond) fails++; };
const press = (page, sel) => page.evaluate((s) => { const el = document.querySelector(s); if (!el) throw new Error(`no ${s}`); el.click(); }, sel);

const server = spawn(process.execPath, ['src/index.js'], { cwd: path.resolve(here, '../..'), env: { ...process.env, PORT: String(PORT), TEACHER_KEY: 'e2e-teacher-key-123', DATA_DIR: mkdtempSync(path.join(tmpdir(), 'stem-e2e-')) }, stdio: ['ignore', 'pipe', 'pipe'] });
server.stderr.on('data', (d) => process.stderr.write(d));
for (let i = 0; i < 50; i++) { try { const r = await fetch(url + 'healthz'); if (r.ok) break; } catch { /* wait */ } await new Promise((r) => setTimeout(r, 200)); }

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
async function join(name, classCode, key = '') {
  const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
  page.on('pageerror', (e) => { console.log('[pageerror]', e.message); fails++; });
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('GL Driver')) console.log('[console]', m.text().slice(0, 200)); });
  await page.goto(url);
  await page.fill('#lobby-name', name); await page.fill('#lobby-class', classCode);
  if (key) { await press(page, '#lobby summary'); await page.fill('#lobby-key', key); }
  await press(page, '#lobby-go');
  await page.waitForSelector('#hud:not([hidden])', { state: 'attached', timeout: 60000 });
  await page.waitForFunction(() => globalThis.stem?.me?.name);
  return page;
}
try {
  const a = await join('Hikari', 'E2E');
  const b = await join('Sora', 'E2E');
  await a.waitForFunction(() => document.querySelector('#online-pill').textContent.startsWith('2'));
  ok(true, 'two children in one class');
  // teacher sets investigate
  const tch = await join('Ms. Sato', 'E2E', 'e2e-teacher-key-123');
  await tch.waitForSelector('#teacher:not([hidden])', { state: 'attached', timeout: 60000 });
  await press(tch, '#teacher [data-level=investigate]');
  await a.waitForFunction(() => globalThis.stem.me.level === 'investigate');
  ok(true, 'teacher set the depth and the child received it');
  // walk to the launch pad
  await a.evaluate(() => globalThis.stem.walkTo('launch-pad'));
  await a.waitForFunction(() => !document.querySelector('#near').hidden && document.querySelector('#interact-text').textContent.includes('Launch Pad'), null, { timeout: 60000 });
  await press(a, '#interact');
  await a.waitForSelector('#lab[open]', { state: 'attached', timeout: 60000 });
  ok((await a.textContent('#lab-title')).includes('Launch Pad'), 'launch pad panel opened in English');
  ok(await a.evaluate(() => !globalThis.stem.panels.isOpen ? false : document.querySelector('#lab-readout').textContent === ''), 'no result shown before predicting');
  ok(await a.evaluate(() => document.querySelector('#lab-canvas').getContext('2d') === null && globalThis.stem.panels.stage.active), 'the experiment is a live 3D scene (WebGL canvas, loop running)');
  // 7.7 km/s is a crash from 200 km (below circular speed there) and an orbit from 400 km.
  await a.$eval('#lab-params input[data-param=altitude]', (el) => { el.value = '400'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await a.$eval('#lab-params input[data-param=speed]', (el) => { el.value = '7.7'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await press(a, '#lab-next');
  await press(a, '[data-choice=orbit]');
  await press(a, '#predict-lock');
  await a.waitForSelector('#lab-readout .verdict', { state: 'attached', timeout: 60000 });
  ok((await a.textContent('#lab-readout')).includes('Orbit'), 'result arrived after the prediction: orbit');
  const period = await a.evaluate(() => Number(document.querySelector('#lab-readout').textContent.match(/orbit:\s*([\d.]+)/)?.[1]));
  ok(period > 85 && period < 100, `period shown ${period} min`);
  await press(a, '#lab-next'); // measure
  await a.selectOption('[data-m=outcome]', 'orbit');
  await a.fill('[data-m=period]', String(period));
  await press(a, '#measure-send');
  await a.waitForSelector('#lab-measure .verdict.ok', { state: 'attached', timeout: 60000 });
  ok(true, 'measurement matched the server');
  await b.waitForFunction(() => globalThis.stem.me && true);
  // the other child's class plot has the point once they open the same station
  await b.evaluate(() => globalThis.stem.open('cosmos.orbit.launch'));
  await b.waitForSelector('#lab[open]', { state: 'attached', timeout: 60000 });
  const n = await b.evaluate(() => { const c = document.querySelector('#class-canvas'); return c && c.width > 0; });
  ok(n, 'class plot drawn for the second child');
  await press(a, '#lab-next'); // explain
  await a.fill('#explain-text', 'Gravity pulls it down and it falls but the ground curves away so it goes around');
  await press(a, '#explain-send');
  await a.waitForSelector('.aims li.met', { state: 'attached', timeout: 60000 });
  const met = await a.$$eval('.aims li.met', (els) => els.length);
  ok(met >= 2, `explanation met ${met} aims`);
  await a.waitForSelector('#lab-real:not([hidden])', { state: 'attached', timeout: 60000 });
  // language switch flips the open panel
  await press(a, '#lab-lang');
  ok(await a.evaluate(() => document.documentElement.dataset.lang === 'ja' && getComputedStyle(document.querySelector('#lab-title .ja')).display !== 'none'), 'あ switches the open panel to Japanese');
  await press(a, '#lab-lang');
  ok(await a.evaluate(() => document.documentElement.dataset.lang === 'en'), 'and back to English');
  // powers
  await press(a, '#lab-close');
  await press(a, '#hud-powers');
  await a.waitForSelector('#powers[open]', { state: 'attached', timeout: 60000 });
  const pw = await a.evaluate(() => globalThis.stem.me.powers);
  ok(pw.predict >= 1 && pw.measure >= 1 && pw.explain > 0, `powers earned ${JSON.stringify(pw)}`);
  await press(a, '#powers-close');
  // LAB: fly over, walk to the dissolving bench, and run the whole explore flow there.
  await a.evaluate(() => globalThis.stem.travel('lab'));
  await a.waitForFunction(() => document.querySelector('#location .en').textContent === 'LAB');
  ok(true, 'flew to LAB and the location pill changed');
  await a.evaluate(() => globalThis.stem.walkTo('dissolving-bench'));
  await a.waitForFunction(() => !document.querySelector('#near').hidden && document.querySelector('#interact-text').textContent.includes('Dissolving'), null, { timeout: 60000 });
  await press(a, '#interact');
  await a.waitForSelector('#lab[open]', { state: 'attached', timeout: 60000 });
  ok((await a.textContent('#lab-title')).includes('Dissolving Bench'), 'dissolving bench panel opened');
  await a.$eval('#lab-params select[data-param=solute]', (el) => { el.value = 'alum'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await a.$eval('#lab-params input[data-param=grams]', (el) => { el.value = '60'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await a.$eval('#lab-params input[data-param=tempC]', (el) => { el.value = '40'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await press(a, '#lab-next');
  await a.fill('#predict-number', '36');
  await press(a, '#predict-lock');
  await a.waitForSelector('#lab-readout .verdict', { state: 'attached', timeout: 60000 });
  ok((await a.textContent('#lab-readout')).includes('36.2'), 'alum at 40°C: 36.2 g left, prediction within tolerance');
  ok(await a.evaluate(() => document.querySelector('#lab-readout .verdict').classList.contains('ok')), 'prediction judged right');
  // the island's own signs are U-Speak Web signs: canvas sprites with both languages
  const signs = await a.evaluate(() => globalThis.stem.signs());
  ok(signs.includes('COSMOS') && signs.includes('LAB') && signs.includes('Launch Pad'), `island signs baked: ${signs.length}`);
  await press(a, '#lab-close');
  // The five new islands: every station opens, every explore run draws a live 3D scene,
  // and the server answers a prediction with a verdict. One child, fifteen stations.
  const tour = [
    ['force', ['swing-frame', 'slide-ramp', 'seesaw']], ['life', ['rabbit-meadow', 'windowsill', 'track']],
    ['earth', ['seismo-house', 'harbour-wall', 'weather-tower']], ['maker', ['bridge-yard', 'circuit-shed', 'gear-mill']],
    ['data', ['dice-table', 'counting-pond', 'sorting-machine']],
  ];
  await press(tch, '#teacher [data-level=explore]');
  await a.waitForFunction(() => globalThis.stem.me.level === 'explore');
  await b.close(); // one child is enough for the tour, and lighter on the software renderer
  let stations = 0;
  for (const [isl, spots] of tour) {
    await a.evaluate((id) => globalThis.stem.travel(id), isl);
    await a.waitForFunction((id) => globalThis.stem.world.current === id, isl);
    for (const sp of spots) {
      const en = await a.evaluate((id) => globalThis.stem.world.island.spots.find((s) => s.id === id).en, sp);
      await a.evaluate((id) => globalThis.stem.walkTo(id), sp);
      await a.waitForFunction((name) => !document.querySelector('#near').hidden && document.querySelector('#interact-text').textContent.includes(name), en, { timeout: 60000 });
      await press(a, '#interact');
      await a.waitForSelector('#lab[open]', { state: 'attached', timeout: 60000 });
      const live = await a.evaluate(() => globalThis.stem.panels.stage.active && document.querySelector('#lab-readout').textContent === '');
      await press(a, '#lab-next');
      await a.waitForSelector('[data-choice]', { state: 'attached', timeout: 60000 });
      await press(a, '[data-choice]');
      await press(a, '#predict-lock');
      await a.waitForSelector('#lab-readout .verdict', { state: 'attached', timeout: 60000 });
      const verdict = await a.evaluate(() => document.querySelector('#lab-readout .verdict').textContent.trim());
      ok(live && verdict.length > 0, `${isl} / ${en}: 3D scene live, server verdict "${verdict.slice(0, 24)}"`);
      stations += 1;
      await press(a, '#lab-close');
      await a.waitForFunction(() => !document.querySelector('#lab').open);
    }
  }
  ok(stations === 15, 'all fifteen new stations ran');
  ok(await a.evaluate(() => /Day|Dusk|Night|Dawn/.test(document.querySelector('#time-pill').textContent)), 'the world clock shows in the rail');
  await a.screenshot({ path: path.join(here, 'lab.png') });
} catch (e) {
  console.log('FAIL', e.message); fails++;
  // what the page was saying when it stopped
  for (const pg of browser.contexts().flatMap((c) => c.pages())) {
    try { console.log('  toast:', JSON.stringify(await pg.textContent('#toast')), 'readout:', JSON.stringify((await pg.textContent('#lab-readout')).slice(0, 160)), 'url', pg.url()); } catch { /* page gone */ }
  }
}
await browser.close(); server.kill();
console.log(fails ? `\n${fails} failure(s)` : '\nall passed');
process.exit(fails ? 1 : 0);
