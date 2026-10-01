// The world's clock, the same one U-Speak Web keeps: a long afternoon, a slow dusk, a
// night worth exploring, a short morning. A pure function of the wall clock, so every
// child in every class sees the same sky without the server saying a word.

export const PHASES = [
  { id: 'day', ja: 'ひるま', en: 'Day', mark: '☀', seconds: 300, from: 0, to: 0 },
  { id: 'dusk', ja: 'ゆうがた', en: 'Dusk', mark: '🌇', seconds: 120, from: 0, to: 1 },
  { id: 'night', ja: 'よる', en: 'Night', mark: '☾', seconds: 240, from: 1, to: 1 },
  { id: 'dawn', ja: 'あさ', en: 'Dawn', mark: '🌅', seconds: 45, from: 1, to: 0 },
];
export const CYCLE_SEC = PHASES.reduce((s, p) => s + p.seconds, 0); // 705
const STARTS = PHASES.reduce((acc, p) => { acc.push(acc[acc.length - 1] + p.seconds); return acc; }, [0]);

export function phaseAt(now = Date.now()) {
  const at = (((now / 1000) % CYCLE_SEC) + CYCLE_SEC) % CYCLE_SEC;
  let i = 0;
  while (i < PHASES.length - 1 && at >= STARTS[i + 1]) i += 1;
  const phase = PHASES[i];
  const into = at - STARTS[i];
  const t = into / phase.seconds;
  const smooth = t * t * (3 - 2 * t);
  return { phase, into, left: phase.seconds - into, night: phase.from + (phase.to - phase.from) * smooth };
}
