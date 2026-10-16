import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { existsSync } from 'node:fs';
import api from '../worker/index.ts';
import { openDatabase } from './db.ts';

const required = ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'SESSION_SECRET', 'APP_URL', 'ADMIN_DISCORD_IDS'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) console.warn(`[warn] 未設定の環境変数: ${missing.join(', ')}`);
if ((process.env.SESSION_SECRET ?? '').length < 32) console.warn('[warn] SESSION_SECRET は32文字以上が必要です');

const env: Env = {
  DB: openDatabase(process.env.DB_PATH || './data/astra.db', './migrations'),
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ?? '',
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET ?? '',
  SESSION_SECRET: process.env.SESSION_SECRET ?? '',
  APP_URL: process.env.APP_URL ?? '',
  ADMIN_DISCORD_IDS: process.env.ADMIN_DISCORD_IDS ?? '',
  BOT_API_URL: process.env.BOT_API_URL,
  BOT_API_SECRET: process.env.BOT_API_SECRET,
};

// Workers の ExecutionContext 相当（waitUntil を受け付けるだけ）
const executionCtx = {
  waitUntil: (promise: Promise<unknown>) => { promise.catch((e) => console.error(e)); },
  passThroughOnException: () => {},
} as unknown as ExecutionContext;

const web = new Hono();

web.get('/health', (c) => c.json({ status: 'ok' }));
web.all('/api/*', (c) => api.fetch(c.req.raw, env, executionCtx));
web.all('/auth/*', (c) => api.fetch(c.req.raw, env, executionCtx));

if (!existsSync('./dist/index.html')) console.warn('[warn] dist/ がありません。先に `npm run build` を実行してください。');
web.use('*', serveStatic({ root: './dist' }));
web.get('*', serveStatic({ path: './dist/index.html' })); // SPA フォールバック

const port = Number(process.env.PORT || 3000);
serve({ fetch: web.fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.log(`ASTRA dashboard listening on :${info.port}`);
});
