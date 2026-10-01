// Everything from the environment, read in one place. No secret has a default.
import 'dotenv/config';

const env = process.env;

export const config = {
  port: Number(env.PORT) || 2568,
  isProduction: env.NODE_ENV === 'production',
  corsOrigins: (env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
  // The teacher key opens the teacher console (set the depth, see the class). One per
  // deployment. Never sent to a page; a page sends it once and gets a role back.
  teacherKey: env.TEACHER_KEY || '',
  // Where records go. A JSON file per class for the pilot; a database later.
  dataDir: env.DATA_DIR || new URL('../data/', import.meta.url).pathname,
  maxClassSize: Number(env.MAX_CLASS_SIZE) || 30,
};

export function validateConfig(log) {
  const problems = [];
  if (config.isProduction && !config.teacherKey) problems.push('TEACHER_KEY is required in production');
  if (config.isProduction && !config.corsOrigins.length) problems.push('CORS_ORIGINS is required in production');
  if (config.teacherKey && config.teacherKey.length < 12) log?.warn?.('[config] TEACHER_KEY is short; use 12+ characters');
  return problems;
}
