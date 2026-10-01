// The shared simulation core. One import for the browser, one for the server.
//
// Everything here is a pure function of its inputs. That is the rule that makes the
// whole product honest: the server re-runs what the page ran and compares. A function
// that reads the clock, Math.random(), or the DOM cannot live in this folder.

export * as gravity from './gravity.js';
export * as moon from './moon.js';
export * as transit from './transit.js';
export { rng, seedOf } from './rng.js';
