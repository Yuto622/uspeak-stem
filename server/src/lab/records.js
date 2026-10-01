// Records per class: a JSON file of powers per child plus an append-only log of trials.
//
// Deliberately small. The pilot runs on one machine; a database comes when a second
// one is needed. What matters now is that every trial and every explanation is written
// down, because the parent report is built from these and nothing else.

import { mkdirSync, readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const BLANK = () => ({ predict: 0, measure: 0, data: 0, explain: 0, build: 0 });

export function createRecords(dir, classCode) {
  const safe = String(classCode).replace(/[^A-Za-z0-9_-]/g, '_');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${safe}.json`);
  const logFile = path.join(dir, `${safe}.log.jsonl`);
  let db = { children: {} };
  if (existsSync(file)) {
    try { db = JSON.parse(readFileSync(file, 'utf8')); } catch { db = { children: {} }; }
  }
  const flush = () => writeFileSync(file, JSON.stringify(db, null, 2));
  return {
    load(name) {
      const c = db.children[name] || (db.children[name] = { powers: BLANK(), firstSeen: new Date().toISOString() });
      for (const k of Object.keys(BLANK())) if (typeof c.powers[k] !== 'number') c.powers[k] = 0;
      return c;
    },
    save(name, patch) {
      const c = this.load(name);
      Object.assign(c, patch, { lastSeen: new Date().toISOString() });
      flush();
    },
    log(name, entry) {
      appendFileSync(logFile, JSON.stringify({ at: new Date().toISOString(), name, ...entry }) + '\n');
    },
    all() { return db; },
  };
}
