// A seeded random number generator shared by the browser and the server.
//
// Every experiment that uses chance (noise on a light curve, where a rock lands)
// draws from this, seeded by the server. The server can then re-run the same
// experiment with the same seed and get the same numbers — which is how it checks
// what a child reports without trusting the page. Math.random() cannot do that.
//
// mulberry32: small, fast, good enough for classroom noise. Not for cryptography.

export function rng(seed) {
  let a = (seed >>> 0) || 1;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Approximately normal(0, 1) by summing uniforms — plenty for measurement noise.
  const normal = () => {
    let s = 0;
    for (let i = 0; i < 12; i++) s += next();
    return s - 6;
  };
  return { next, normal };
}

// Turn any string (an experiment id plus a session id) into a 32-bit seed.
export function seedOf(text) {
  let h = 2166136261;
  for (const ch of String(text)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
