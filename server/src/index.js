// U-Speak STEM server: serves the page, hosts the class rooms, judges the science.
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { Server, matchMaker, WebSocketTransport } from './colyseus.js';
import { config, validateConfig } from './config.js';
import { LabRoom } from './rooms/LabRoom.js';
import { EXPERIMENTS } from '../../shared/experiments/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const log = console;

export function originAllowed(origin) {
  if (!origin) return true;
  if (config.corsOrigins.includes('*')) return true;
  if (!config.corsOrigins.length) return !config.isProduction;
  return config.corsOrigins.includes(origin);
}

export async function startServer({ port = config.port } = {}) {
  const problems = validateConfig(log);
  if (problems.length) { for (const p of problems) log.error('[config]', p); throw new Error('invalid configuration'); }

  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: (origin, cb) => cb(null, originAllowed(origin)) }));
  app.use(compression({ threshold: 1024 }));
  app.get('/healthz', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ status: 'ok', rooms: matchMaker.stats.local.roomCount, clients: matchMaker.stats.local.ccu, experiments: EXPERIMENTS.map((e) => e.id) });
  });
  // The page, and the shared code it imports. `shared/` is served because the browser
  // runs the same sim; nothing in it is secret (the truth comes from running it, and the
  // room only runs it after a prediction is in).
  app.use('/shared', express.static(path.join(root, 'shared')));
  app.use(express.static(path.join(root, 'client')));

  const server = http.createServer(app);
  const game = new Server({ transport: new WebSocketTransport({ server }) });
  game.define('lab', LabRoom).filterBy(['classCode']);
  await game.listen(port);
  log.info(`[stem] listening on :${port} — experiments: ${EXPERIMENTS.map((e) => e.id).join(', ')}`);
  return { app, server, game, close: () => game.gracefullyShutdown(false) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer().catch((e) => { log.error(e); process.exit(1); });
}
