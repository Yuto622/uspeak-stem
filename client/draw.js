// Canvas drawing for the instruments: orbit, moon, light curve, class plot, powers.
// Pure drawing; every number comes in as an argument.

import { t } from './i18n.js';

function clear(ctx, w, h, bg = '#0b1026') { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }

// The launch pad: the planet, the tower, the trail.
export function drawOrbit(canvas, { body, altitude, trail, outcome }) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width; const h = canvas.height;
  clear(ctx, w, h);
  // stars
  ctx.fillStyle = '#ffffff55';
  for (let i = 0; i < 80; i++) ctx.fillRect((i * 97) % w, (i * 53) % h, 1.5, 1.5);
  const maxR = trail ? Math.max(body.radius * 1.3, ...trail.map(([x, y]) => Math.hypot(x, y))) : body.radius * 2;
  const scale = (Math.min(w, h) * 0.46) / Math.min(maxR, body.radius * 12);
  const cx = w / 2; const cy = h / 2;
  ctx.fillStyle = '#' + body.color.toString(16).padStart(6, '0');
  ctx.beginPath(); ctx.arc(cx, cy, body.radius * scale, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffffff33'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, (body.radius + altitude) * scale, 0, Math.PI * 2); ctx.stroke();
  if (trail && trail.length > 1) {
    ctx.strokeStyle = outcome === 'crash' ? '#f06a52' : outcome === 'escape' ? '#f2b134' : '#7fd1ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    trail.forEach(([x, y], i) => { const px = cx + x * scale; const py = cy - y * scale; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
    ctx.stroke();
    const [lx, ly] = trail[trail.length - 1];
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + lx * scale, cy - ly * scale, 4, 0, Math.PI * 2); ctx.fill();
  }
  // the launch point
  ctx.fillStyle = '#f2b134'; ctx.fillRect(cx + (body.radius + altitude) * scale - 2, cy - 6, 4, 12);
}

// The phase hill: Sun on the left, Earth in the middle, Moon on its circle; and the
// Moon as seen from Earth in the corner once the run has happened.
export function drawMoon(canvas, { angle, result }) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width; const h = canvas.height;
  clear(ctx, w, h);
  const cx = w * 0.55; const cy = h / 2; const R = Math.min(w, h) * 0.32;
  // sunlight from the left
  const grad = ctx.createLinearGradient(0, 0, w, 0); grad.addColorStop(0, '#f2b13444'); grad.addColorStop(0.5, '#00000000');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#f2b134'; ctx.beginPath(); ctx.arc(26, cy, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '12px system-ui'; ctx.fillText(t({ en: 'Sun', ja: 'たいよう' }), 10, cy + 40);
  // earth
  ctx.fillStyle = '#3f7fd0'; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000000aa'; ctx.beginPath(); ctx.arc(cx, cy, 22, -Math.PI / 2, Math.PI / 2); ctx.fill();
  ctx.strokeStyle = '#ffffff33'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  // moon on its circle: angle 0 = toward the Sun (left), going counter-clockwise
  const a = (angle * Math.PI) / 180;
  const mx = cx - Math.cos(a) * R; const my = cy + Math.sin(a) * R;
  ctx.fillStyle = '#c9c7c0'; ctx.beginPath(); ctx.arc(mx, my, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000000aa'; ctx.beginPath(); ctx.arc(mx, my, 12, -Math.PI / 2, Math.PI / 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText(t({ en: 'Moon', ja: 'つき' }), mx + 16, my + 4);
  if (result) {
    // the Moon as seen from Earth, in the corner
    const vx = w - 70; const vy = 70; const vr = 44;
    ctx.fillStyle = '#ffffff22'; ctx.fillRect(w - 140, 10, 130, 120);
    ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(vx, vy, vr, 0, Math.PI * 2); ctx.fill();
    // lit fraction, right side while waxing
    const lit = result.lit; const right = result.side === 'right';
    ctx.save(); ctx.beginPath(); ctx.arc(vx, vy, vr, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#efe9d6';
    if (right) { ctx.beginPath(); ctx.arc(vx, vy, vr, -Math.PI / 2, Math.PI / 2); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(vx, vy, vr, Math.PI / 2, (3 * Math.PI) / 2); ctx.fill(); }
    // terminator ellipse
    const k = Math.abs(2 * lit - 1);
    ctx.fillStyle = lit >= 0.5 ? '#efe9d6' : '#1b1b1b';
    ctx.beginPath(); ctx.ellipse(vx, vy, vr * k, vr, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.fillText(t({ en: 'from Earth', ja: 'ちきゅうから' }), w - 128, 122);
  }
}

// The observatory: brightness against time. Autoscaled so a 0.015% dip is visible.
export function drawLightCurve(canvas, { curve, dips }) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width; const h = canvas.height;
  clear(ctx, w, h);
  if (!curve) { ctx.fillStyle = '#fff'; ctx.font = '14px system-ui'; ctx.fillText(t({ en: 'Press Run to start watching the star.', ja: '「やってみる」で ほしを 見はじめる。' }), 20, 40); return; }
  const { t: tt, flux } = curve;
  const pad = { l: 56, r: 12, t: 16, b: 30 };
  const lo = Math.min(...flux); const hi = Math.max(...flux);
  const range = Math.max(hi - lo, 1e-5);
  const X = (x) => pad.l + (x / tt[tt.length - 1]) * (w - pad.l - pad.r);
  const Y = (f) => pad.t + (1 - (f - lo) / range) * (h - pad.t - pad.b);
  ctx.strokeStyle = '#ffffff22'; ctx.beginPath(); ctx.moveTo(pad.l, Y(1)); ctx.lineTo(w - pad.r, Y(1)); ctx.stroke();
  ctx.fillStyle = '#7fd1ff';
  for (let i = 0; i < flux.length; i++) ctx.fillRect(X(tt[i]) - 1, Y(flux[i]) - 1, 2, 2);
  if (dips) for (const d of dips) { ctx.strokeStyle = '#f2b13488'; ctx.beginPath(); ctx.moveTo(X(d.mid), pad.t); ctx.lineTo(X(d.mid), h - pad.b); ctx.stroke(); }
  ctx.fillStyle = '#fff'; ctx.font = '11px system-ui';
  ctx.fillText(t({ en: 'days', ja: '日' }), w - 40, h - 8);
  for (let d = 0; d <= tt[tt.length - 1]; d += 5) ctx.fillText(String(d), X(d) - 4, h - 8);
  ctx.save(); ctx.translate(14, h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(t({ en: 'brightness', ja: 'あかるさ' }), -30, 0); ctx.restore();
  ctx.fillText(`−${(range * 100).toFixed(3)}%`, 4, h - pad.b); ctx.fillText('100%', 20, Y(1) + 4);
}

// The class plot: everyone's points on the same axes. Mine in a different colour.
export function drawClass(canvas, { points, plot, me }) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width; const h = canvas.height;
  clear(ctx, w, h, '#ffffff');
  const pad = { l: 50, r: 14, t: 14, b: 34 };
  ctx.fillStyle = '#4a5668'; ctx.font = '12px system-ui';
  ctx.fillText(t(plot.xLabel), w / 2 - 40, h - 8);
  ctx.save(); ctx.translate(12, h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(t(plot.yLabel), -40, 0); ctx.restore();
  ctx.strokeStyle = '#d9d0bb'; ctx.strokeRect(pad.l, pad.t, w - pad.l - pad.r, h - pad.t - pad.b);
  const pts = (points || []).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (!pts.length) { ctx.fillText(t({ en: 'No points yet. Yours will be the first.', ja: 'まだ てんが ない。きみのが さいしょ。' }), pad.l + 10, pad.t + 24); return; }
  const xs = pts.map((p) => p.x); const ys = pts.map((p) => p.y);
  const x0 = Math.min(...xs); const x1 = Math.max(...xs); const y0 = Math.min(...ys); const y1 = Math.max(...ys);
  const X = (x) => pad.l + ((x - x0) / Math.max(x1 - x0, 1e-9)) * (w - pad.l - pad.r) * 0.92 + 8;
  const Y = (y) => pad.t + (1 - (y - y0) / Math.max(y1 - y0, 1e-9)) * (h - pad.t - pad.b) * 0.9 + 8;
  for (const p of pts) {
    ctx.fillStyle = p.who === me ? '#2d6cdf' : '#f2b134';
    ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), p.who === me ? 6 : 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#4a5668';
  ctx.fillText(String(Math.round(x0 * 100) / 100), pad.l, h - pad.b + 14); ctx.fillText(String(Math.round(x1 * 100) / 100), w - pad.r - 30, h - pad.b + 14);
  ctx.fillText(String(Math.round(y1 * 1000) / 1000), 2, pad.t + 10); ctx.fillText(String(Math.round(y0 * 1000) / 1000), 2, h - pad.b);
  ctx.fillText(`n = ${pts.length}`, w - pad.r - 50, pad.t + 14);
}

// The five powers as a radar.
export function drawPowers(canvas, powers, labels) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width; const h = canvas.height;
  clear(ctx, w, h, '#fffaf0');
  const cx = w / 2; const cy = h / 2 + 6; const R = Math.min(w, h) * 0.34;
  const ids = ['predict', 'measure', 'data', 'explain', 'build'];
  const max = Math.max(10, ...ids.map((k) => powers[k] || 0));
  ctx.strokeStyle = '#d9d0bb';
  for (let ring = 1; ring <= 4; ring++) {
    ctx.beginPath();
    ids.forEach((_, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; const r = (R * ring) / 4; const x = cx + Math.cos(a) * r; const y = cy + Math.sin(a) * r; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.closePath(); ctx.stroke();
  }
  ctx.fillStyle = '#2d6cdf66'; ctx.strokeStyle = '#2d6cdf'; ctx.lineWidth = 2;
  ctx.beginPath();
  ids.forEach((k, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; const r = (R * (powers[k] || 0)) / max; const x = cx + Math.cos(a) * r; const y = cy + Math.sin(a) * r; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1c2a3a'; ctx.font = '13px system-ui'; ctx.textAlign = 'center';
  ids.forEach((k, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; const x = cx + Math.cos(a) * (R + 22); const y = cy + Math.sin(a) * (R + 22) + 4; ctx.fillText(`${t(labels[k])} ${powers[k] || 0}`, x, y); });
  ctx.textAlign = 'start';
}

// LAB — the dissolving bench: a beaker with what dissolved and what stayed, beside the
// solubility curve with this trial marked on it.
export function drawSolubility(canvas, { solute, table, tempC, grams, result }) {
  const ctx = canvas.getContext('2d'); const w = canvas.width; const h = canvas.height;
  clear(ctx, w, h, '#1a2a3a');
  // beaker
  const bx = 110; const by = 70; const bw = 150; const bh = 260;
  ctx.strokeStyle = '#dfe8ee'; ctx.lineWidth = 4; ctx.strokeRect(bx, by, bw, bh);
  const level = by + 40;
  ctx.fillStyle = result ? '#7fd1ff88' : '#7fd1ff44'; ctx.fillRect(bx + 2, level, bw - 4, by + bh - level - 2);
  if (result) {
    const left = result.left; const pile = Math.min(60, (left / Math.max(grams, 1)) * 90);
    ctx.fillStyle = solute.color; ctx.beginPath(); ctx.ellipse(bx + bw / 2, by + bh - 6, bw / 2 - 12, pile / 2, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '13px system-ui';
    ctx.fillText(`${t({ en: 'dissolved', ja: 'とけた' })} ${result.dissolved} g`, bx, by + bh + 22);
    ctx.fillText(`${t({ en: 'left', ja: 'のこった' })} ${result.left} g`, bx, by + bh + 40);
  }
  ctx.fillStyle = '#ffb347'; ctx.fillRect(bx - 30, by + bh - 20, 20, 20); ctx.fillStyle = '#fff'; ctx.font = '12px system-ui'; ctx.fillText(`${tempC}°C`, bx - 40, by + bh - 28);
  ctx.fillText(`${grams} g ${t(solute)}`, bx, by - 14);
  // curve
  const gx = 330; const gy = 40; const gw = w - gx - 30; const gh = h - gy - 50;
  const maxS = Math.max(...table.map(([, v]) => v), grams) * 1.1;
  const X = (tc) => gx + (tc / 100) * gw; const Y = (v) => gy + gh - (v / maxS) * gh;
  ctx.strokeStyle = '#ffffff33'; ctx.strokeRect(gx, gy, gw, gh);
  ctx.strokeStyle = '#f2b134'; ctx.lineWidth = 3; ctx.beginPath();
  table.forEach(([tc, v], i) => { if (i) ctx.lineTo(X(tc), Y(v)); else ctx.moveTo(X(tc), Y(v)); }); ctx.stroke();
  ctx.setLineDash([4, 4]); ctx.strokeStyle = '#7fd1ff'; ctx.beginPath(); ctx.moveTo(gx, Y(grams)); ctx.lineTo(gx + gw, Y(grams)); ctx.stroke(); ctx.setLineDash([]);
  if (result) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(tempC), Y(result.limit), 6, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#fff'; ctx.font = '11px system-ui';
  ctx.fillText(t({ en: 'g in 100 g water', ja: '100 g の みずに とける g' }), gx, gy - 8);
  for (const tc of [0, 20, 40, 60, 80, 100]) ctx.fillText(String(tc), X(tc) - 6, gy + gh + 14);
  ctx.fillText('°C', gx + gw + 4, gy + gh + 14);
  ctx.fillText(`${t({ en: 'you put in', ja: 'いれた りょう' })}: ${grams} g`, gx + 6, Y(grams) - 4);
}

// LAB — the indicator shelf: a test tube that takes the indicator's colour.
export function drawAcidBase(canvas, { liquid, indicator, result, colorHex }) {
  const ctx = canvas.getContext('2d'); const w = canvas.width; const h = canvas.height;
  clear(ctx, w, h, '#1a2a3a');
  const tx = w / 2 - 40; const ty = 40; const tw = 80; const th = 300;
  ctx.fillStyle = result ? (colorHex[result.color] || '#cfd8dc') : '#cfd8dc55';
  ctx.beginPath(); ctx.roundRect(tx, ty + 40, tw, th - 40, [0, 0, 40, 40]); ctx.fill();
  ctx.strokeStyle = '#dfe8ee'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, [6, 6, 40, 40]); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = '15px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(t(liquid), w / 2, ty + th + 30);
  ctx.font = '12px system-ui'; ctx.fillText(`+ ${t(indicator)}`, w / 2, ty + th + 50);
  if (result) { ctx.font = 'bold 20px system-ui'; ctx.fillText(result.color, w / 2, ty - 10); }
  ctx.textAlign = 'start';
  // pH scale
  const sx = 40; const sy = h - 30; const sw = w - 80;
  for (let i = 0; i <= 14; i++) { const hue = 0 + (i / 14) * 270; ctx.fillStyle = `hsl(${hue} 60% 55%)`; ctx.fillRect(sx + (i / 14) * sw, sy, sw / 14, 10); }
  ctx.fillStyle = '#fff'; ctx.font = '10px system-ui'; ctx.fillText('pH 0', sx, sy - 4); ctx.fillText('7', sx + sw / 2 - 3, sy - 4); ctx.fillText('14', sx + sw - 12, sy - 4);
  if (result && result.pH !== undefined && result.pH !== null) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(sx + (result.pH / 14) * sw, sy - 2); ctx.lineTo(sx + (result.pH / 14) * sw - 6, sy - 12); ctx.lineTo(sx + (result.pH / 14) * sw + 6, sy - 12); ctx.fill(); }
}

// LAB — the burning corner: a candle under a jar, with the seconds and the lime water.
export function drawCandle(canvas, { litres, candles, o2, result }) {
  const ctx = canvas.getContext('2d'); const w = canvas.width; const h = canvas.height;
  clear(ctx, w, h, '#1a2a3a');
  const jw = 120 + litres * 24; const jh = 200 + litres * 14; const jx = w / 2 - jw / 2; const jy = h - 60 - jh;
  ctx.fillStyle = '#d8ecf222'; ctx.fillRect(jx, jy, jw, jh);
  ctx.strokeStyle = '#dfe8ee'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(jx, jy, jw, jh, [30, 30, 0, 0]); ctx.stroke();
  for (let i = 0; i < candles; i++) {
    const cx = w / 2 + (i - (candles - 1) / 2) * 40; const cy = h - 60;
    ctx.fillStyle = '#fff4d7'; ctx.fillRect(cx - 8, cy - 50, 16, 50);
    const lit = !result || result.seconds > 0;
    ctx.fillStyle = lit ? '#ffc66a' : '#777'; ctx.beginPath(); ctx.ellipse(cx, cy - 62, 7, 14, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#8c917c'; ctx.fillRect(jx - 40, h - 60, jw + 80, 12);
  ctx.fillStyle = '#fff'; ctx.font = '13px system-ui';
  ctx.fillText(`${litres} L · ${t({ en: 'in the jar', ja: 'びんの なか' })}: ${o2 === '1' ? t({ en: 'pure oxygen', ja: 'さんそだけ' }) : o2 === '0.16' ? t({ en: 'used air (16% O2)', ja: 'つかった くうき（さんそ 16%）' }) : t({ en: 'air (21% O2)', ja: 'くうき（さんそ 21%）' })}`, 20, 30);
  if (result) {
    ctx.font = 'bold 28px system-ui'; ctx.fillText(`${result.seconds} s`, 20, 70);
    ctx.font = '13px system-ui'; ctx.fillText(t({ en: 'until the flame goes out', ja: 'ひが きえるまで' }), 20, 90);
    // lime water
    const lx = w - 110; ctx.strokeStyle = '#dfe8ee'; ctx.lineWidth = 3; ctx.strokeRect(lx, h - 170, 60, 110);
    ctx.fillStyle = result.limewater === 'cloudy' ? '#f4f4f4cc' : '#cfe8f044'; ctx.fillRect(lx + 2, h - 120, 56, 58);
    ctx.fillStyle = '#fff'; ctx.font = '11px system-ui'; ctx.fillText(t({ en: 'lime water', ja: 'せっかいすい' }), lx - 8, h - 180); ctx.fillText(result.limewater, lx + 8, h - 48);
  } else { ctx.font = '13px system-ui'; ctx.fillText(t({ en: 'Lock your prediction, then watch the flame.', ja: 'よそうを きめてから、ひを 見よう。' }), 20, 70); }
}
