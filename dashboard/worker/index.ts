import { Hono, type Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { csrf } from 'hono/csrf';
import { sign, verify } from 'hono/jwt';

type NewsItem = {
  id: string;
  title: string;
  body: string;
  category: string;
  published_at: string;
  created_at: string;
};

type SessionPayload = {
  sub: string;
  username: string;
  avatar: string | null;
  exp: number;
};

type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar: string | null;
};

type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner?: boolean;
  permissions: string;
};

type DashboardSession = {
  id: string;
  access_token: string;
  expires_at: number;
};

type BotGuild = { id: string; nickname: string | null };
type BotProfile = { nickname: string | null };
const dashboardCookie = 'astra_dashboard';
const dashboardStateCookie = 'astra_dashboard_state';
const dashboardSessionDuration = 60 * 60 * 24 * 7;

const app = new Hono<{ Bindings: Env }>();
const sessionCookie = 'astra_session';
const sessionDuration = 60 * 60 * 24 * 7;
const categories = new Set(['お知らせ', 'アップデート', 'メンテナンス']);

app.use('/api/*', csrf());
app.use('/auth/dashboard/logout', csrf());

app.get('/auth/discord', (c) => {
  if (!c.env.DISCORD_CLIENT_ID || !c.env.APP_URL || !c.env.DISCORD_CLIENT_SECRET || !c.env.SESSION_SECRET || c.env.SESSION_SECRET.length < 32) {
    return c.text('Discord OAuth is not configured.', 503);
  }

  const state = crypto.randomUUID();
  const authorizeUrl = new URL('https://discord.com/oauth2/authorize');
  authorizeUrl.search = new URLSearchParams({
    client_id: c.env.DISCORD_CLIENT_ID,
    response_type: 'code',
    redirect_uri: `${c.env.APP_URL.replace(/\/$/, '')}/auth/callback`,
    scope: 'identify',
    state,
  }).toString();

  setCookie(c, 'astra_oauth_state', state, {
    httpOnly: true,
    secure: new URL(c.env.APP_URL).protocol === 'https:',
    sameSite: 'Lax',
    path: '/auth',
    maxAge: 600,
  });

  return c.redirect(authorizeUrl.toString());
});

app.get('/auth/dashboard/discord', (c) => {
  if (!c.env.DISCORD_CLIENT_ID || !c.env.APP_URL || !c.env.DISCORD_CLIENT_SECRET || !c.env.SESSION_SECRET || c.env.SESSION_SECRET.length < 32) {
    return c.text('Discord OAuth is not configured.', 503);
  }
  const state = crypto.randomUUID();
  const url = new URL('https://discord.com/oauth2/authorize');
  url.search = new URLSearchParams({
    client_id: c.env.DISCORD_CLIENT_ID,
    response_type: 'code',
    redirect_uri: `${c.env.APP_URL.replace(/\/$/, '')}/auth/dashboard/callback`,
    scope: 'identify guilds',
    state,
  }).toString();
  setCookie(c, dashboardStateCookie, state, {
    httpOnly: true, secure: new URL(c.env.APP_URL).protocol === 'https:',
    sameSite: 'Lax', path: '/auth/dashboard', maxAge: 600,
  });
  return c.redirect(url.toString());
});

app.get('/auth/dashboard/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const expected = getCookie(c, dashboardStateCookie);
  deleteCookie(c, dashboardStateCookie, { path: '/auth/dashboard' });
  if (!code || !state || state !== expected) return c.redirect('/dashboard?dashboard_error=oauth');
  const redirectUri = `${c.env.APP_URL.replace(/\/$/, '')}/auth/dashboard/callback`;
  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: c.env.DISCORD_CLIENT_ID, client_secret: c.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code', code, redirect_uri: redirectUri,
    }),
  });
  if (!tokenResponse.ok) return c.redirect('/dashboard?dashboard_error=oauth');
  const token = await tokenResponse.json() as { access_token?: string; expires_in?: number };
  if (!token.access_token) return c.redirect('/dashboard?dashboard_error=oauth');
  const userResponse = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!userResponse.ok) return c.redirect('/dashboard?dashboard_error=oauth');
  const user = await userResponse.json() as DiscordUser;
  const sessionId = crypto.randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + Math.min(token.expires_in || dashboardSessionDuration, dashboardSessionDuration);
  await c.env.DB.prepare('DELETE FROM dashboard_sessions WHERE expires_at <= ?').bind(Math.floor(Date.now() / 1000)).run();
  const encryptedToken = await encryptAccessToken(c.env.SESSION_SECRET, token.access_token);
  await c.env.DB.prepare('INSERT INTO dashboard_sessions (id, user_id, access_token, expires_at) VALUES (?, ?, ?, ?)')
    .bind(sessionId, user.id, encryptedToken, expiresAt).run();
  const now = Math.floor(Date.now() / 1000);
  const jwt = await sign({ sub: user.id, sid: sessionId, username: user.global_name || user.username, avatar: user.avatar, iat: now, exp: expiresAt }, c.env.SESSION_SECRET, 'HS256');
  setCookie(c, dashboardCookie, jwt, {
    httpOnly: true, secure: new URL(c.env.APP_URL).protocol === 'https:',
    sameSite: 'Lax', path: '/', maxAge: expiresAt - now,
  });
  return c.redirect('/dashboard');
});

app.post('/auth/dashboard/logout', (c) => {
  const jwt = getCookie(c, dashboardCookie);
  if (jwt) {
    const deletion = verify(jwt, c.env.SESSION_SECRET, 'HS256').then((payload) => {
      const sid = (payload as SessionPayload & { sid?: string }).sid;
      if (sid) return c.env.DB.prepare('DELETE FROM dashboard_sessions WHERE id = ?').bind(sid).run();
    }).catch(() => undefined);
    c.executionCtx.waitUntil(deletion);
  }
  deleteCookie(c, dashboardCookie, { path: '/' });
  return c.json({ ok: true });
});

app.get('/api/dashboard/session', async (c) => {
  const session = await readDashboardSession(c);
  if (!session) return c.json({ user: null });
  return c.json({ user: { id: session.userId, username: session.username, avatar: session.avatar } });
});

app.get('/api/dashboard/config', (c) => c.json({ clientId: c.env.DISCORD_CLIENT_ID || null }));

app.get('/api/dashboard/guilds', async (c) => {
  const session = await readDashboardSession(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const guilds = await getManageableGuilds(session.accessToken);
  if (guilds === 'expired') {
    await revokeDashboardSession(c);
    return c.json({ error: 'Discord session expired' }, 401);
  }
  if (!guilds) return c.json({ error: 'Discord API unavailable' }, 503);
  const botGuilds = await botRequest<BotGuild[]>(c.env, '/internal/guilds');
  if (!botGuilds) return c.json({ error: 'Bot service unavailable' }, 503);
  const installed = new Map(botGuilds.map((guild) => [guild.id, guild.nickname]));
  return c.json(guilds.map((guild) => ({
    id: guild.id, name: guild.name,
    icon_url: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
    initials: guild.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(),
    is_bot_installed: installed.has(guild.id), nickname: installed.get(guild.id) ?? null,
  })));
});

app.get('/api/dashboard/guilds/:id/profile', async (c) => {
  const session = await readDashboardSession(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const permitted = await canManageGuild(session.accessToken, c.req.param('id'));
  if (permitted === 'expired') { await revokeDashboardSession(c); return c.json({ error: 'Discord session expired' }, 401); }
  if (permitted === null) return c.json({ error: 'Discord API unavailable' }, 503);
  if (!permitted) return c.json({ error: 'Forbidden' }, 403);
  const profile = await botRequest<BotProfile>(c.env, `/internal/guilds/${encodeURIComponent(c.req.param('id'))}/profile`);
  if (!profile) return c.json({ error: 'Bot service unavailable' }, 503);
  return c.json(profile);
});

app.patch('/api/dashboard/guilds/:id/profile', async (c) => {
  const session = await readDashboardSession(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const guildId = c.req.param('id');
  const permitted = await canManageGuild(session.accessToken, guildId);
  if (permitted === 'expired') { await revokeDashboardSession(c); return c.json({ error: 'Discord session expired' }, 401); }
  if (permitted === null) return c.json({ error: 'Discord API unavailable' }, 503);
  if (!permitted) return c.json({ error: 'Forbidden' }, 403);
  let input: { nickname?: unknown };
  try { input = await c.req.json(); } catch { return c.json({ error: 'Invalid request' }, 400); }
  if (typeof input.nickname !== 'string' || input.nickname.length > 32) {
    return c.json({ error: 'Invalid profile data' }, 400);
  }
  const result = await botRequest<{ ok: true }>(c.env, `/internal/guilds/${encodeURIComponent(guildId)}/profile`, {
    method: 'PATCH', body: JSON.stringify({ nickname: input.nickname }),
  });
  if (!result) return c.json({ error: 'Bot service unavailable or update failed' }, 502);
  return c.json({ ok: true });
});

app.get('/auth/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const expectedState = getCookie(c, 'astra_oauth_state');
  deleteCookie(c, 'astra_oauth_state', { path: '/auth' });

  if (!code || !state || !expectedState || state !== expectedState) {
    return c.redirect('/?error=oauth#admin-login');
  }

  const redirectUri = `${c.env.APP_URL.replace(/\/$/, '')}/auth/callback`;
  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: c.env.DISCORD_CLIENT_ID,
      client_secret: c.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) return c.redirect('/?error=oauth#admin-login');

  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenData.access_token) return c.redirect('/?error=oauth#admin-login');

  const userResponse = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!userResponse.ok) return c.redirect('/?error=oauth#admin-login');

  const user = (await userResponse.json()) as DiscordUser;
  if (!adminIds(c.env).has(user.id)) return c.redirect('/?error=not_admin#admin-login');

  const now = Math.floor(Date.now() / 1000);
  const jwt = await sign(
    { sub: user.id, username: user.global_name || user.username, avatar: user.avatar, iat: now, exp: now + sessionDuration },
    c.env.SESSION_SECRET,
    'HS256',
  );

  setCookie(c, sessionCookie, jwt, {
    httpOnly: true,
    secure: new URL(c.env.APP_URL).protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: sessionDuration,
  });

  return c.redirect('/#admin-dashboard');
});

app.post('/auth/logout', csrf(), (c) => {
  deleteCookie(c, sessionCookie, { path: '/' });
  return c.json({ ok: true });
});

app.get('/api/session', async (c) => {
  const session = await readSession(c);
  if (!session || !adminIds(c.env).has(session.sub)) return c.json({ user: null });
  return c.json({ user: { id: session.sub, username: session.username, avatar: session.avatar } });
});

app.get('/api/news', async (c) => {
  const limit = Math.min(Math.max(Number(c.req.query('limit')) || 100, 1), 100);
  const result = await c.env.DB.prepare(
    'SELECT id, title, body, category, published_at, created_at FROM news ORDER BY published_at DESC LIMIT ?',
  ).bind(limit).all<NewsItem>();
  return c.json(result.results);
});

app.use('/api/news', requireAdminMiddleware);
app.use('/api/news/*', requireAdminMiddleware);

app.post('/api/news', async (c) => {
  const input = await readNewsInput(c.req.raw);
  if (!input) return c.json({ error: 'Invalid news data' }, 400);

  const item: NewsItem = { id: crypto.randomUUID(), ...input, created_at: new Date().toISOString() };
  await c.env.DB.prepare(
    'INSERT INTO news (id, title, body, category, published_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).bind(item.id, item.title, item.body, item.category, item.published_at, item.created_at).run();
  return c.json(item, 201);
});

app.put('/api/news/:id', async (c) => {
  const input = await readNewsInput(c.req.raw);
  if (!input) return c.json({ error: 'Invalid news data' }, 400);

  const result = await c.env.DB.prepare(
    'UPDATE news SET title = ?, body = ?, category = ?, published_at = ? WHERE id = ?',
  ).bind(input.title, input.body, input.category, input.published_at, c.req.param('id')).run();
  if (!result.meta.changes) return c.json({ error: 'News item not found' }, 404);
  return c.json({ ok: true });
});

app.delete('/api/news/:id', async (c) => {
  const result = await c.env.DB.prepare('DELETE FROM news WHERE id = ?').bind(c.req.param('id')).run();
  if (!result.meta.changes) return c.json({ error: 'News item not found' }, 404);
  return c.json({ ok: true });
});

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((error, c) => {
  console.error(error);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;

function adminIds(env: Env): Set<string> {
  return new Set(env.ADMIN_DISCORD_IDS.split(',').map((id) => id.trim()).filter(Boolean));
}

async function readSession(c: Context<{ Bindings: Env }>): Promise<SessionPayload | null> {
  const token = getCookie(c, sessionCookie);
  if (!token) return null;
  try {
    return await verify(token, c.env.SESSION_SECRET, 'HS256') as SessionPayload;
  } catch {
    return null;
  }
}

async function readDashboardSession(c: Context<{ Bindings: Env }>): Promise<{
  userId: string; username: string; avatar: string | null; accessToken: string;
} | null> {
  const jwt = getCookie(c, dashboardCookie);
  if (!jwt) return null;
  try {
    const payload = await verify(jwt, c.env.SESSION_SECRET, 'HS256') as SessionPayload & { sid?: string };
    if (!payload.sid) return null;
    const row = await c.env.DB.prepare(
      'SELECT access_token, expires_at FROM dashboard_sessions WHERE id = ? AND user_id = ?',
    ).bind(payload.sid, payload.sub).first<DashboardSession>();
    if (!row || row.expires_at <= Math.floor(Date.now() / 1000)) return null;
    return { userId: payload.sub, username: payload.username, avatar: payload.avatar, accessToken: await decryptAccessToken(c.env.SESSION_SECRET, row.access_token) };
  } catch {
    return null;
  }
}

async function getManageableGuilds(accessToken: string): Promise<DiscordGuild[] | 'expired' | null> {
  try {
    const response = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.status === 401) return 'expired';
    if (!response.ok) return null;
    const guilds = await response.json() as DiscordGuild[];
    return guilds.filter((guild) => guild.owner || (BigInt(guild.permissions) & 0x28n) !== 0n);
  } catch {
    return null;
  }
}

async function canManageGuild(accessToken: string, guildId: string): Promise<boolean | 'expired' | null> {
  const guilds = await getManageableGuilds(accessToken);
  if (guilds === 'expired') return 'expired';
  if (!guilds) return null;
  return guilds.some((guild) => guild.id === guildId);
}

async function revokeDashboardSession(c: Context<{ Bindings: Env }>): Promise<void> {
  const jwt = getCookie(c, dashboardCookie);
  if (!jwt) return;
  try {
    const payload = await verify(jwt, c.env.SESSION_SECRET, 'HS256') as SessionPayload & { sid?: string };
    if (payload.sid) await c.env.DB.prepare('DELETE FROM dashboard_sessions WHERE id = ?').bind(payload.sid).run();
  } catch { /* Expired or invalid cookie: there is no valid session to revoke. */ }
  deleteCookie(c, dashboardCookie, { path: '/' });
}

async function botRequest<T>(env: Env, path: string, init: RequestInit = {}): Promise<T | null> {
  const response = await botRawRequest(env, path, init);
  if (!response || !response.ok) return null;
  try { return await response.json() as T; } catch { return null; }
}

async function botRawRequest(env: Env, path: string, init: RequestInit = {}): Promise<Response | null> {
  if (!env.BOT_API_URL || !env.BOT_API_SECRET) return null;
  try {
    return await fetch(`${env.BOT_API_URL.replace(/\/$/, '')}${path}`, {
      ...init,
      headers: { 'X-ASTRA-BOT-SECRET': env.BOT_API_SECRET, 'Content-Type': 'application/json', ...init.headers },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return null;
  }
}

async function dashboardTokenKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptAccessToken(secret: string, token: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, await dashboardTokenKey(secret), new TextEncoder().encode(token),
  );
  const bytes = new Uint8Array(iv.length + ciphertext.byteLength);
  bytes.set(iv);
  bytes.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...bytes));
}

async function decryptAccessToken(secret: string, stored: string): Promise<string> {
  const bytes = Uint8Array.from(atob(stored), (character) => character.charCodeAt(0));
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes.slice(0, 12) }, await dashboardTokenKey(secret), bytes.slice(12),
  );
  return new TextDecoder().decode(plaintext);
}

async function requireAdminMiddleware(c: Context<{ Bindings: Env }>, next: () => Promise<void>): Promise<Response | void> {
  const session = await readSession(c);
  if (!session || !adminIds(c.env).has(session.sub)) return c.json({ error: 'Unauthorized' }, 401);
  c.set('adminUser', { id: session.sub, username: session.username, avatar: session.avatar });
  await next();
}

async function readNewsInput(request: Request): Promise<Omit<NewsItem, 'id' | 'created_at'> | null> {
  try {
    const value = await request.json() as Record<string, unknown>;
    const title = typeof value.title === 'string' ? value.title.trim() : '';
    const body = typeof value.body === 'string' ? value.body.trim() : '';
    const category = typeof value.category === 'string' ? value.category : '';
    const date = typeof value.published_at === 'string' ? new Date(value.published_at) : null;
    if (!title || title.length > 200 || !body || body.length > 20000 || !categories.has(category) || !date || Number.isNaN(date.getTime())) {
      return null;
    }
    return { title, body, category, published_at: date.toISOString() };
  } catch {
    return null;
  }
}