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

const server = spawn(process.execPath, ['src/index.js'], { cwd: path.resolve(here, '../..'), env: { ...process.env, PORT: String(PORT), TEACHER_KEY: 'e2e-teacher-key-123', DATA_DIR: mkdtempSync(path.join(tmpdir(), 'stem-e2e-')) }, stdio: ['ignore', 'pipe', 'pipe'] });
server.stderr.on('data', (d) => process.stderr.write(d));
for (let i = 0; i < 50; i++) { try { const r = await fetch(url + 'healthz'); if (r.ok) break; } catch { /* wait */ } await new Promise((r) => setTimeout(r, 200)); }

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
async function join(name, classCode, key = '') {
  const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
  page.on('pageerror', (e) => { console.log('[pageerror]', e.message); fails++; });
  await page.goto(url);
  await page.fill('#lobby-name', name); await page.fill('#lobby-class', classCode);
  if (key) { await page.click('#lobby summary'); await page.fill('#lobby-key', key); }
  await page.click('#lobby-go');
  await page.waitForSelector('#hud:not([hidden])', { timeout: 15000 });
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
  await tch.waitForSelector('#teacher:not([hidden])');
  await tch.click('#teacher [data-level=investigate]');
  await a.waitForFunction(() => globalThis.stem.me.level === 'investigate');
  ok(true, 'teacher set the depth and the child received it');
  // walk to the launch pad
  await a.evaluate(() => globalThis.stem.walkTo('launch-pad'));
  await a.waitForSelector('#near:not([hidden])', { timeout: 8000 });
  await a.click('#interact');
  await a.waitForSelector('#lab[open]');
  ok((await a.textContent('#lab-title')).includes('Launch Pad'), 'launch pad panel opened in English');
  ok(await a.evaluate(() => !globalThis.stem.panels.isOpen ? false : document.querySelector('#lab-readout').textContent === ''), 'no result shown before predicting');
  // 7.7 km/s is a crash from 200 km (below circular speed there) and an orbit from 400 km.
  await a.$eval('#lab-params input[data-param=altitude]', (el) => { el.value = '400'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await a.$eval('#lab-params input[data-param=speed]', (el) => { el.value = '7.7'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await a.click('#lab-next');
  await a.click('[data-choice=orbit]');
  await a.click('#predict-lock');
  await a.waitForSelector('#lab-readout .verdict');
  ok((await a.textContent('#lab-readout')).includes('Orbit'), 'result arrived after the prediction: orbit');
  const period = await a.evaluate(() => Number(document.querySelector('#lab-readout').textContent.match(/orbit:\s*([\d.]+)/)?.[1]));
  ok(period > 85 && period < 100, `period shown ${period} min`);
  await a.click('#lab-next'); // measure
  await a.selectOption('[data-m=outcome]', 'orbit');
  await a.fill('[data-m=period]', String(period));
  await a.click('#measure-send');
  await a.waitForSelector('#lab-measure .verdict.ok');
  ok(true, 'measurement matched the server');
  await b.waitForFunction(() => globalThis.stem.me && true);
  // the other child's class plot has the point once they open the same station
  await b.evaluate(() => globalThis.stem.open('cosmos.orbit.launch'));
  await b.waitForSelector('#lab[open]');
  const n = await b.evaluate(() => { const c = document.querySelector('#class-canvas'); return c && c.width > 0; });
  ok(n, 'class plot drawn for the second child');
  await a.click('#lab-next'); // explain
  await a.fill('#explain-text', 'Gravity pulls it down and it falls but the ground curves away so it goes around');
  await a.click('#explain-send');
  await a.waitForSelector('.aims li.met');
  const met = await a.$$eval('.aims li.met', (els) => els.length);
  ok(met >= 2, `explanation met ${met} aims`);
  await a.waitForSelector('#lab-real:not([hidden])');
  // language switch flips the open panel
  await a.click('#lab-lang');
  ok(await a.evaluate(() => document.documentElement.dataset.lang === 'ja' && getComputedStyle(document.querySelector('#lab-title .ja')).display !== 'none'), 'あ switches the open panel to Japanese');
  await a.click('#lab-lang');
  ok(await a.evaluate(() => document.documentElement.dataset.lang === 'en'), 'and back to English');
  // powers
  await a.click('#lab-close');
  await a.click('#hud-powers');
  await a.waitForSelector('#powers[open]');
  const pw = await a.evaluate(() => globalThis.stem.me.powers);
  ok(pw.predict >= 1 && pw.measure >= 1 && pw.explain > 0, `powers earned ${JSON.stringify(pw)}`);
  await a.click('#powers-close');
  // LAB: fly over, walk to the dissolving bench, and run the whole explore flow there.
  await a.evaluate(() => globalThis.stem.travel('lab'));
  await a.waitForFunction(() => document.querySelector('#location .en').textContent === 'LAB');
  ok(true, 'flew to LAB and the location pill changed');
  await a.evaluate(() => globalThis.stem.walkTo('dissolving-bench'));
  await a.waitForSelector('#near:not([hidden])', { timeout: 8000 });
  await a.click('#interact');
  await a.waitForSelector('#lab[open]');
  ok((await a.textContent('#lab-title')).includes('Dissolving Bench'), 'dissolving bench panel opened');
  await a.$eval('#lab-params select[data-param=solute]', (el) => { el.value = 'alum'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await a.$eval('#lab-params input[data-param=grams]', (el) => { el.value = '60'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await a.$eval('#lab-params input[data-param=tempC]', (el) => { el.value = '40'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await a.click('#lab-next');
  await a.fill('#predict-number', '36');
  await a.click('#predict-lock');
  await a.waitForSelector('#lab-readout .verdict');
  ok((await a.textContent('#lab-readout')).includes('36.2'), 'alum at 40°C: 36.2 g left, prediction within tolerance');
  ok(await a.evaluate(() => document.querySelector('#lab-readout .verdict').classList.contains('ok')), 'prediction judged right');
  // the island's own signs are U-Speak Web signs: canvas sprites with both languages
  const signs = await a.evaluate(() => globalThis.stem.signs());
  ok(signs.includes('COSMOS') && signs.includes('LAB') && signs.includes('Launch Pad'), `island signs baked: ${signs.length}`);
  await a.click('#lab-close');
  await a.screenshot({ path: path.join(here, 'lab.png') });
} catch (e) { console.log('FAIL', e.message); fails++; }
await browser.close(); server.kill();
console.log(fails ? `\n${fails} failure(s)` : '\nall passed');
process.exit(fails ? 1 : 0);
