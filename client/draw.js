// Canvas drawing for the two charts that stay flat: the class plot and the powers radar.
// Every experiment itself is a 3D scene (`stage.js`).

import { t } from './i18n.js';

function clear(ctx, w, h, bg = '#0b1026') { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }

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

