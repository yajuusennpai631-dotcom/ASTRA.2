"""ウェブページ（トップ）と管理Dashboard（Discord OAuth2ログイン）。

- GET  /                         : 公開ステータスページ
- GET  /dashboard                : サーバー管理（Discordログイン必須）
- GET  /auth/dashboard/discord   : Discord認可画面へリダイレクト
- GET  /auth/dashboard/callback  : OAuthコールバック
- POST /auth/dashboard/logout
- POST /dashboard/nickname

ASTRA-main (Cloudflare Worker) と同じ仕様:
  scope=identify guilds / 所有者または「管理者」「サーバー管理」権限を持つサーバーのみ操作可能。
"""
import hashlib
import hmac
import html
import os
import secrets
import time
from urllib.parse import parse_qs, quote, urlencode

import aiohttp
import discord
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, RedirectResponse

from web import api

router = APIRouter()

SESSION_COOKIE = "astra_dashboard"
STATE_COOKIE = "astra_dashboard_state"
SESSION_TTL = 60 * 60 * 24 * 7
MANAGE_MASK = 0x28  # ADMINISTRATOR(0x8) | MANAGE_GUILD(0x20)
DISCORD_API = "https://discord.com/api"

# サーバー側セッション（メモリ保持。Bot再起動時は再ログインが必要）
_sessions: dict[str, dict] = {}


# ---------- 設定 ----------
def _bot() -> discord.Client | None:
    return api.bot_instance


def _client_id() -> str | None:
    cid = os.getenv("DISCORD_CLIENT_ID")
    if cid:
        return cid
    bot = _bot()
    return str(bot.user.id) if bot and bot.user else None


def _client_secret() -> str | None:
    return os.getenv("DISCORD_CLIENT_SECRET") or None


def _session_secret() -> str | None:
    s = os.getenv("SESSION_SECRET")
    return s if s and len(s) >= 32 else None


def _configured() -> bool:
    return bool(_client_id() and _client_secret() and _session_secret())


def _base_url(request: Request) -> str:
    url = os.getenv("APP_URL")
    if not url and os.getenv("RAILWAY_PUBLIC_DOMAIN"):
        url = "https://" + os.environ["RAILWAY_PUBLIC_DOMAIN"]
    if not url:
        proto = request.headers.get("x-forwarded-proto", request.url.scheme)
        url = f"{proto}://{request.headers.get('host', request.url.netloc)}"
    return url.rstrip("/")


def _redirect_uri(request: Request) -> str:
    return f"{_base_url(request)}/auth/dashboard/callback"


def _secure(request: Request) -> bool:
    return request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https"


async def _form(request: Request) -> dict[str, str]:
    raw = (await request.body()).decode("utf-8", "replace")
    return {k: v[0] for k, v in parse_qs(raw).items()}


# ---------- セッション ----------
def _sign(sid: str) -> str:
    return hmac.new((_session_secret() or "").encode(), sid.encode(), hashlib.sha256).hexdigest()


def _session(request: Request) -> dict | None:
    raw = request.cookies.get(SESSION_COOKIE) or ""
    sid, _, sig = raw.partition(".")
    if not sid or not sig or not _session_secret() or not hmac.compare_digest(sig, _sign(sid)):
        return None
    s = _sessions.get(sid)
    if not s or s["exp"] <= time.time():
        _sessions.pop(sid, None)
        return None
    return {**s, "sid": sid}


# ---------- Discord API ----------
async def _discord_get(path: str, token: str):
    """成功: JSON / 401: 'expired' / その他の失敗: None"""
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as http:
            async with http.get(DISCORD_API + path, headers={"Authorization": f"Bearer {token}"}) as r:
                if r.status == 401:
                    return "expired"
                if r.status != 200:
                    return None
                return await r.json()
    except (aiohttp.ClientError, TimeoutError):
        return None


async def _manageable_guilds(token: str):
    guilds = await _discord_get("/users/@me/guilds", token)
    if guilds is None or guilds == "expired":
        return guilds
    return [g for g in guilds if g.get("owner") or (int(g.get("permissions", 0)) & MANAGE_MASK)]


def _avatar(sess: dict) -> str:
    if sess.get("avatar"):
        url = f"https://cdn.discordapp.com/avatars/{sess['uid']}/{sess['avatar']}.png?size=64"
        return f'<img class="avatar" src="{html.escape(url)}" alt="">'
    return f'<div class="avatar">{html.escape((sess.get("name") or "?")[:1].upper())}</div>'


_STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>'

_CSS = """
:root{--bg:#f7f9fc;--fg:#182134;--navy:#202d41;--ac:#255cd0;--ac-d:#1e4db8;--ac-l:#edf3ff;--mut:#748399;--mut2:#8491a3;--sub:#607085;
--bd:#e3e9f2;--bd2:#e6edf7;--ok:#1f9d55;--ng:#d64545;--ng-bg:#fff0f0;--ng-bd:#f5c6c6;--ng-fg:#c0392b}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;flex-direction:column;background:var(--bg);color:var(--fg);
font:16px/1.6 system-ui,-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--ac);text-decoration:none}
svg{display:block}
header.top{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.95);backdrop-filter:blur(8px);border-bottom:1px solid var(--bd)}
.bar{max-width:1280px;margin:0 auto;padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:10px;color:inherit}
.logo{width:36px;height:36px;border-radius:10px;background:var(--navy);color:#fff;display:grid;place-items:center}
.logo svg{width:20px;height:20px}
.brand .t1{display:block;font-size:20px;font-weight:800;letter-spacing:.055em;line-height:1}
.brand .t2{display:block;font-size:9px;font-weight:700;letter-spacing:.13em;color:#7d8aa0;margin-top:6px;line-height:1}
nav.top{display:flex;align-items:center;gap:28px}
nav.top a{font-size:12px;font-weight:700;color:var(--sub);transition:color .15s}
nav.top a:hover,nav.top a.on{color:var(--ac)}
nav.top a.cta{padding:10px 16px;background:var(--ac);color:#fff;border-radius:8px}
nav.top a.cta:hover{background:var(--ac-d);color:#fff}
main{flex:1;width:100%;max-width:1000px;margin:0 auto;padding:56px 24px 72px}
main.narrow{max-width:460px;padding-top:72px}
.eyebrow{display:flex;align-items:center;gap:8px;color:var(--ac);font-size:12px;font-weight:800;letter-spacing:.08em;margin-bottom:12px}
.eyebrow svg{width:20px;height:20px}
h1{font-size:30px;font-weight:800;letter-spacing:-.02em;margin:0;line-height:1.3}
p.sub{font-size:14px;color:var(--mut);margin:8px 0 0}
.head{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:32px}
.card{background:#fff;border:1px solid var(--bd);border-radius:16px;box-shadow:0 1px 2px rgba(24,33,52,.04)}
.pad{padding:20px 24px}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
.stat{padding:20px 24px}
.stat .k{font-size:12px;font-weight:700;color:var(--mut2)}
.stat .v{font-size:26px;font-weight:800;margin-top:6px;letter-spacing:-.02em;display:flex;align-items:center;gap:8px}
.stat .v.sm{font-size:18px}
.dot{width:10px;height:10px;border-radius:50%;background:var(--ng);flex:none}
.dot.on{background:var(--ok);box-shadow:0 0 0 4px rgba(31,157,85,.15)}
.sec{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.sec h2{font-size:14px;font-weight:800;color:#4c6079;margin:0}
.list{display:grid;gap:12px}
.guild{padding:18px 20px}
.guild .top{display:flex;align-items:center;gap:12px;min-width:0}
.avatar{width:48px;height:48px;flex:none;border-radius:12px;background:#eaf0fb;color:var(--ac);display:grid;place-items:center;font-weight:800;font-size:14px;object-fit:cover}
.guild h3{margin:0;font-size:16px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.guild .meta{margin:2px 0 0;font-size:12px;color:var(--mut2)}
.badge{display:inline-block;padding:1px 8px;border-radius:99px;background:var(--ac-l);color:var(--ac);font-size:11px;font-weight:700;margin-right:6px}
form.inline{display:flex;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid #e9eef5}
input[type=text],input[type=password]{flex:1;min-width:0;padding:12px 16px;border:1px solid #dce4ef;border-radius:12px;background:#fbfcfe;color:var(--fg);font:inherit;font-size:14px;outline:none}
input:focus{border-color:var(--ac)}
button{padding:11px 20px;border:0;border-radius:12px;background:var(--ac);color:#fff;font:inherit;font-size:14px;font-weight:800;cursor:pointer;transition:background .15s;white-space:nowrap}
button:hover{background:var(--ac-d)}
button.ghost{background:#fff;color:var(--sub);border:1px solid var(--bd);border-radius:8px;font-weight:700;padding:10px 16px}
button.ghost:hover{background:#f0f4fa}
button.full{width:100%;padding:14px;border-radius:10px}
.msg{padding:12px 16px;border-radius:10px;margin-bottom:20px;background:#f0f5ff;color:var(--ac);font-size:14px}
.err{display:flex;gap:10px;padding:14px;margin-bottom:20px;border-radius:8px;background:var(--ng-bg);border:1px solid var(--ng-bd);color:var(--ng-fg);font-size:12px}
.empty{padding:40px;text-align:center;font-size:14px;color:var(--mut);background:#fff;border:1px dashed #d5deea;border-radius:16px}
.center{text-align:center}
.center .logo{width:56px;height:56px;border-radius:16px;margin:0 auto 16px}
.center .logo svg{width:28px;height:28px}
.center h1{font-size:24px}
.login{padding:32px;margin-top:32px;border-radius:20px;border-color:var(--bd2)}
.login input{width:100%;margin-bottom:16px}
.note{margin-top:32px;font-size:12px;line-height:1.8;color:var(--mut2)}
.back{display:block;text-align:center;margin-top:24px;font-size:12px;font-weight:700;color:var(--mut2)}
.back:hover{color:var(--ac)}
.meta code{background:none;padding:0;color:var(--mut2)}
code{font-size:.85em;background:#eef2f8;padding:2px 6px;border-radius:6px;color:var(--sub)}
footer.bot{border-top:1px solid #e5ebf2;background:#fff;padding:28px 24px}
footer.bot .in{max-width:1280px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px}
footer.bot .fb{display:flex;align-items:center;gap:8px;font-weight:800;font-size:14px}
footer.bot .logo{width:28px;height:28px;border-radius:8px}footer.bot .logo svg{width:16px;height:16px}
footer.bot p{margin:0;font-size:12px;color:var(--mut2)}
.discord{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;border-radius:10px;background:#5865f2;color:#fff;font-size:14px;font-weight:800}
.discord:hover{background:#4752c4}
.user{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:700}
.user .avatar{width:36px;height:36px;border-radius:50%;font-size:13px}
a.btn{display:inline-block;padding:11px 20px;border-radius:12px;background:var(--ac);color:#fff;font-size:14px;font-weight:800;white-space:nowrap}
a.btn:hover{background:var(--ac-d)}
.guild .row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px}
ol{padding-left:20px;font-size:14px;color:var(--sub);line-height:2}
@media(max-width:720px){nav.top a:not(.cta){display:none}.stats{grid-template-columns:1fr}h1{font-size:26px}main{padding-top:40px}form.inline{flex-wrap:wrap}form.inline button{width:100%}}
"""


def _page(title: str, body: str, active: str = "", narrow: bool = False) -> HTMLResponse:
    dash_cls = "on" if active == "dashboard" else ""
    home_cls = "on" if active == "home" else ""
    dash_link = f'<a href="/dashboard" class="{dash_cls}">サーバー管理</a>'
    page = """<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>__TITLE__</title>
<style>__CSS__</style></head><body>
<header class="top"><div class="bar">
<a class="brand" href="/"><span class="logo">__STAR__</span>
<span><span class="t1">ASTRA</span><span class="t2">BOT SERVICE PORTAL</span></span></a>
<nav class="top"><a href="/" class="__HOME__">ホーム</a>__DASH__</nav>
</div></header>
<main class="__NARROW__">__BODY__</main>
<footer class="bot"><div class="in">
<div class="fb"><span class="logo">__STAR__</span>ASTRA</div>
<p>© 2026 ASTRA Joint Development Project</p></div></footer>
</body></html>"""
    for k, v in {
        "__TITLE__": html.escape(title), "__CSS__": _CSS, "__STAR__": _STAR,
        "__HOME__": home_cls, "__DASH__": dash_link,
        "__NARROW__": "narrow" if narrow else "", "__BODY__": body,
    }.items():
        page = page.replace(k, v)
    return HTMLResponse(page)


# ---------- 公開ページ ----------
@router.get("/", response_class=HTMLResponse)
async def index():
    bot = _bot()
    ready = bool(bot and bot.is_ready())
    name = html.escape(str(bot.user)) if ready and bot.user else "—"
    guilds = len(bot.guilds) if ready else 0
    ping = f"{round(bot.latency * 1000)}ms" if ready else "—"
    return _page("ASTRA Bot", f"""
<div class="head"><div>
<div class="eyebrow">{_STAR}<span>BOT STATUS</span></div>
<h1>ASTRA Bot</h1><p class="sub">Discord Botの稼働状況</p></div></div>
<div class="stats">
<div class="card stat"><div class="k">ステータス</div>
<div class="v sm"><span class="dot {'on' if ready else ''}"></span>{'オンライン' if ready else '起動中 / オフライン'}</div></div>
<div class="card stat"><div class="k">参加サーバー数</div><div class="v">{guilds}</div></div>
<div class="card stat"><div class="k">応答速度</div><div class="v">{ping}</div></div></div>
<div class="card pad"><span style="font-size:12px;font-weight:700;color:var(--mut2)">ログイン中のBot</span>
<div style="font-weight:800;margin-top:4px">{name}</div></div>
<p class="note"><a href="/dashboard">サーバー管理Dashboardへ →</a></p>""", active="home")


# ---------- ログイン ----------
_DISCORD_ICON = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
                 'stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 01-9 8.4 8.6 8.6 0 01-3.800-.9L3 21l1.900-5.200A8.400 8.400 0 1121 11.500z"/></svg>')


def _login_page(error: str = "") -> HTMLResponse:
    err = f'<div class="err">{html.escape(error)}</div>' if error else ""
    return _page("ログイン | ASTRA", f"""
<div class="center"><div class="logo">{_STAR}</div>
<h1>サーバー管理にログイン</h1><p class="sub">Discordアカウントでサインインします</p></div>
<div class="card login">{err}
<a class="discord" href="/auth/dashboard/discord">{_DISCORD_ICON}Discordでログイン</a>
<p class="note" style="margin:16px 0 0;text-align:center">あなたが所有、または管理権限を持つサーバーのみ表示します。<br>権限確認にのみDiscord情報を利用します。</p></div>
<a class="back" href="/">← トップページに戻る</a>""", active="dashboard", narrow=True)


def _setup_page() -> HTMLResponse:
    return _page("Dashboard", """
<div class="card pad"><h1 style="font-size:20px">Discordログインが未設定です</h1>
<p class="sub">Railway の Variables に次を設定してください。</p>
<ol><li><code>DISCORD_CLIENT_SECRET</code> … Developer Portal &gt; OAuth2 &gt; Client Secret</li>
<li><code>SESSION_SECRET</code> … 32文字以上のランダム文字列</li>
<li><code>APP_URL</code> … 公開URL（例: https://xxx.up.railway.app）※未設定でも自動判定</li>
<li>Developer Portal &gt; OAuth2 &gt; Redirects に <code>&lt;公開URL&gt;/auth/dashboard/callback</code> を追加</li></ol></div>""",
                 active="dashboard")


@router.get("/auth/dashboard/discord")
async def oauth_start(request: Request):
    if not _configured():
        return RedirectResponse("/dashboard", status_code=303)
    state = secrets.token_urlsafe(24)
    url = "https://discord.com/oauth2/authorize?" + urlencode({
        "client_id": _client_id(), "response_type": "code",
        "redirect_uri": _redirect_uri(request), "scope": "identify guilds", "state": state,
        "prompt": "none",
    })
    resp = RedirectResponse(url, status_code=302)
    resp.set_cookie(STATE_COOKIE, state, httponly=True, samesite="lax",
                    secure=_secure(request), path="/auth/dashboard", max_age=600)
    return resp


@router.get("/auth/dashboard/callback")
async def oauth_callback(request: Request, code: str = "", state: str = ""):
    fail = RedirectResponse("/dashboard?error=oauth", status_code=303)
    expected = request.cookies.get(STATE_COOKIE)
    fail.delete_cookie(STATE_COOKIE, path="/auth/dashboard")
    if not _configured() or not code or not state or not expected or not hmac.compare_digest(state, expected):
        return fail
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as http:
            async with http.post(f"{DISCORD_API}/oauth2/token", data={
                "client_id": _client_id(), "client_secret": _client_secret(),
                "grant_type": "authorization_code", "code": code, "redirect_uri": _redirect_uri(request),
            }) as r:
                if r.status != 200:
                    return fail
                token = await r.json()
            access = token.get("access_token")
            if not access:
                return fail
            async with http.get(f"{DISCORD_API}/users/@me", headers={"Authorization": f"Bearer {access}"}) as r:
                if r.status != 200:
                    return fail
                user = await r.json()
    except (aiohttp.ClientError, TimeoutError):
        return fail

    now = time.time()
    for k in [k for k, v in _sessions.items() if v["exp"] <= now]:
        _sessions.pop(k, None)
    ttl = min(int(token.get("expires_in") or SESSION_TTL), SESSION_TTL)
    sid = secrets.token_urlsafe(32)
    _sessions[sid] = {"uid": user["id"], "name": user.get("global_name") or user.get("username"),
                      "avatar": user.get("avatar"), "token": access, "exp": now + ttl}
    resp = RedirectResponse("/dashboard", status_code=303)
    resp.delete_cookie(STATE_COOKIE, path="/auth/dashboard")
    resp.set_cookie(SESSION_COOKIE, f"{sid}.{_sign(sid)}", httponly=True, samesite="lax",
                    secure=_secure(request), max_age=ttl, path="/")
    return resp


@router.post("/auth/dashboard/logout")
async def logout(request: Request):
    sess = _session(request)
    if sess:
        _sessions.pop(sess["sid"], None)
    resp = RedirectResponse("/dashboard", status_code=303)
    resp.delete_cookie(SESSION_COOKIE, path="/")
    return resp


def _expired_redirect(sess: dict) -> RedirectResponse:
    _sessions.pop(sess["sid"], None)
    resp = RedirectResponse("/dashboard?error=expired", status_code=303)
    resp.delete_cookie(SESSION_COOKIE, path="/")
    return resp


# ---------- Dashboard ----------
@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request, msg: str = "", error: str = ""):
    bot = _bot()
    if not _configured():
        return _setup_page()
    sess = _session(request)
    if not sess:
        errors = {"oauth": "Discord認証に失敗しました。もう一度お試しください。",
                  "expired": "セッションの有効期限が切れました。もう一度ログインしてください。"}
        return _login_page(errors.get(error, ""))
    if not bot or not bot.is_ready():
        return _page("Dashboard", '<div class="msg">Botが起動中です。数秒後に再読み込みしてください。</div>', active="dashboard")

    guilds = await _manageable_guilds(sess["token"])
    if guilds == "expired":
        return _expired_redirect(sess)
    if guilds is None:
        return _page("Dashboard", '<div class="err">サーバー一覧を読み込めませんでした。しばらくしてから再読み込みしてください。</div>', active="dashboard")

    cid = quote(_client_id() or "")
    cards = ""
    for g in sorted(guilds, key=lambda x: x["name"].lower()):
        name = html.escape(g["name"])
        icon = (f'<img class="avatar" src="https://cdn.discordapp.com/icons/{g["id"]}/{g["icon"]}.png?size=96" alt="">'
                if g.get("icon") else f'<div class="avatar">{html.escape("".join(w[0] for w in g["name"].split()[:2]).upper() or "?")}</div>')
        live = bot.get_guild(int(g["id"]))
        if live:
            nick = html.escape(live.me.nick or "") if live.me else ""
            cards += f"""<article class="card guild"><div class="top">{icon}
<div style="min-width:0"><h3>{name}</h3>
<p class="meta"><span class="badge">Bot導入済み</span>{html.escape(nick) if nick else "ニックネーム未設定"}</p></div></div>
<form method="post" action="/dashboard/nickname" class="inline">
<input type="hidden" name="guild_id" value="{g['id']}">
<input type="text" name="nickname" value="{nick}" maxlength="32" placeholder="サーバー内ニックネーム（空欄で既定に戻す）">
<button type="submit">変更を保存</button></form></article>"""
        else:
            cards += f"""<article class="card guild"><div class="row"><div class="top">{icon}
<div style="min-width:0"><h3>{name}</h3><p class="meta">Bot未導入</p></div></div>
<a class="btn" target="_blank" rel="noreferrer" href="https://discord.com/oauth2/authorize?client_id={cid}&scope=bot&permissions=8&guild_id={g['id']}">Botを追加 ↗</a></div></article>"""
    if not cards:
        cards = '<div class="empty">管理可能なサーバーが見つかりませんでした。</div>'
    note = f'<div class="msg">{html.escape(msg)}</div>' if msg else ""
    return _page("サーバー管理 | ASTRA", f"""
<div class="head"><div>
<div class="eyebrow">{_STAR}<span>SERVER DASHBOARD</span></div>
<h1>サーバー管理</h1>
<p class="sub">Discordサーバーに導入されたASTRA Botの設定を管理できます。</p></div>
<div class="user">{_avatar(sess)}<span>{html.escape(sess['name'] or '')}</span>
<form method="post" action="/auth/dashboard/logout"><button class="ghost" type="submit">ログアウト</button></form></div></div>
{note}
<div class="sec"><h2>管理可能なサーバー</h2></div>
<div class="list">{cards}</div>
<p class="note">ニックネーム変更にはBotがサーバーに導入されていることと、Botにニックネーム変更の権限が必要です。</p>""", active="dashboard")


@router.post("/dashboard/nickname")
async def set_nickname(request: Request):
    sess = _session(request)
    if not sess:
        return RedirectResponse("/dashboard", status_code=303)
    form = await _form(request)
    gid = form.get("guild_id", "")
    guilds = await _manageable_guilds(sess["token"])  # 毎回権限を再確認
    if guilds == "expired":
        return _expired_redirect(sess)
    result = "変更に失敗しました。"
    if guilds is None:
        result = "Discordに接続できませんでした。時間をおいて再試行してください。"
    elif not any(g["id"] == gid for g in guilds):
        result = "このサーバーを管理する権限がありません。"
    else:
        bot = _bot()
        try:
            guild = bot.get_guild(int(gid)) if bot else None
            me = guild.me if guild else None
            if me is None:
                result = "サーバーが見つかりません。"
            else:
                await me.edit(nick=(form.get("nickname", "").strip()[:32] or None))
                result = f"「{guild.name}」のニックネームを更新しました。"
        except discord.Forbidden:
            result = "権限がありません（BotにNicknameの変更権限が必要です）。"
        except (discord.HTTPException, ValueError):
            pass
    return RedirectResponse(f"/dashboard?msg={quote(result)}", status_code=303)
