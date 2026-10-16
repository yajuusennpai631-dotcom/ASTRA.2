"""ウェブページ（トップ）と管理Dashboard。追加依存なし（標準ライブラリのみ）。

- GET  /            : 公開ステータスページ
- GET  /dashboard   : 管理Dashboard（DASHBOARD_PASSWORD で保護）
- POST /dashboard/login, /dashboard/logout, /dashboard/nickname
"""
import hashlib
import hmac
import html
import os
import time
from urllib.parse import parse_qs, quote

import discord
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, RedirectResponse

from web import api

router = APIRouter()

COOKIE = "astra_session"
_failed: dict[str, list[float]] = {}  # IPごとのログイン失敗履歴（簡易レート制限）


# ---------- 共通 ----------
def _password() -> str | None:
    return os.getenv("DASHBOARD_PASSWORD") or None


def _token(password: str) -> str:
    key = (os.getenv("SESSION_SECRET") or os.getenv("BOT_API_SECRET") or password).encode()
    return hmac.new(key, f"astra-dashboard:{password}".encode(), hashlib.sha256).hexdigest()


def _authed(request: Request) -> bool:
    pw = _password()
    cookie = request.cookies.get(COOKIE)
    return bool(pw and cookie and hmac.compare_digest(cookie, _token(pw)))


async def _form(request: Request) -> dict[str, str]:
    raw = (await request.body()).decode("utf-8", "replace")
    return {k: v[0] for k, v in parse_qs(raw).items()}


def _bot() -> discord.Client | None:
    return api.bot_instance


def _page(title: str, body: str) -> HTMLResponse:
    return HTMLResponse(f"""<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title>
<style>
:root{{color-scheme:light dark;--bg:#f6f7fb;--card:#fff;--fg:#1c1e26;--mut:#6b7080;--ac:#5865f2;--bd:#e2e4ee;--ok:#1f9d55;--ng:#d64545}}
@media(prefers-color-scheme:dark){{:root{{--bg:#14151b;--card:#1d1f28;--fg:#e8e9f0;--mut:#9a9eb0;--bd:#2c2f3b}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif}}
main{{max-width:760px;margin:0 auto;padding:32px 16px}}
h1{{font-size:1.5rem;margin:0 0 4px}}p.sub{{color:var(--mut);margin:0 0 24px}}
.card{{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:16px 20px;margin-bottom:12px}}
.row{{display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:space-between}}
.dot{{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;background:var(--ng)}}.dot.on{{background:var(--ok)}}
input[type=text],input[type=password]{{padding:8px 10px;border:1px solid var(--bd);border-radius:8px;background:var(--bg);color:var(--fg);font:inherit;min-width:0;flex:1}}
button{{padding:8px 16px;border:0;border-radius:8px;background:var(--ac);color:#fff;font:inherit;cursor:pointer}}
button.ghost{{background:transparent;color:var(--mut);border:1px solid var(--bd)}}
form.inline{{display:flex;gap:8px;flex:1;min-width:240px}}
.msg{{padding:10px 14px;border-radius:8px;margin-bottom:16px;background:var(--card);border:1px solid var(--bd)}}
code{{font-size:.85em;color:var(--mut)}}a{{color:var(--ac)}}
</style></head><body><main>{body}</main></body></html>""")


# ---------- 公開ページ ----------
@router.get("/", response_class=HTMLResponse)
async def index():
    bot = _bot()
    ready = bool(bot and bot.is_ready())
    name = html.escape(str(bot.user)) if ready and bot.user else "—"
    guilds = len(bot.guilds) if ready else 0
    ping = f"{round(bot.latency * 1000)}ms" if ready else "—"
    dash = '<p><a href="/dashboard">管理Dashboardへ →</a></p>' if _password() else ""
    return _page("ASTRA Bot", f"""
<h1>ASTRA Bot</h1><p class="sub">Discord Bot ステータス</p>
<div class="card"><div class="row"><div><span class="dot {'on' if ready else ''}"></span>
<strong>{'オンライン' if ready else '起動中 / オフライン'}</strong></div><code>{name}</code></div></div>
<div class="card row"><span>参加サーバー数</span><strong>{guilds}</strong></div>
<div class="card row"><span>応答速度</span><strong>{ping}</strong></div>
{dash}""")


# ---------- Dashboard ----------
def _login_page(error: str = "") -> HTMLResponse:
    err = f'<div class="msg">{html.escape(error)}</div>' if error else ""
    return _page("ログイン | ASTRA", f"""
<h1>ASTRA Dashboard</h1><p class="sub">パスワードを入力してください</p>{err}
<form method="post" action="/dashboard/login" class="card row">
<input type="password" name="password" placeholder="パスワード" required autofocus>
<button type="submit">ログイン</button></form>""")


@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request, msg: str = ""):
    if not _password():
        return _page("Dashboard", """<h1>Dashboard は無効です</h1>
<p class="sub">Railway の Variables に <code>DASHBOARD_PASSWORD</code> を設定すると有効になります。</p>""")
    if not _authed(request):
        return _login_page()
    bot = _bot()
    if not bot or not bot.is_ready():
        return _page("Dashboard", '<h1>Dashboard</h1><div class="msg">Botが起動中です。数秒後に再読み込みしてください。</div>')

    cards = ""
    for g in sorted(bot.guilds, key=lambda x: x.name):
        me = g.me
        nick = html.escape(me.nick or "") if me else ""
        cards += f"""<div class="card"><div class="row"><strong>{html.escape(g.name)}</strong>
<code>{g.id} ・ {g.member_count or '?'}人</code></div>
<form method="post" action="/dashboard/nickname" class="inline" style="margin-top:10px">
<input type="hidden" name="guild_id" value="{g.id}">
<input type="text" name="nickname" value="{nick}" maxlength="32" placeholder="ニックネーム（空欄でリセット）">
<button type="submit">変更</button></form></div>"""
    if not cards:
        cards = '<div class="card">まだどのサーバーにも参加していません。</div>'
    note = f'<div class="msg">{html.escape(msg)}</div>' if msg else ""
    return _page("Dashboard | ASTRA", f"""
<div class="row"><div><h1>ASTRA Dashboard</h1><p class="sub">{html.escape(str(bot.user))} ・ {len(bot.guilds)}サーバー ・ {round(bot.latency*1000)}ms</p></div>
<form method="post" action="/dashboard/logout"><button class="ghost" type="submit">ログアウト</button></form></div>
{note}{cards}""")


@router.post("/dashboard/login")
async def login(request: Request):
    pw = _password()
    if not pw:
        return RedirectResponse("/dashboard", status_code=303)
    ip = request.client.host if request.client else "?"
    now = time.time()
    recent = [t for t in _failed.get(ip, []) if now - t < 300]
    if len(recent) >= 5:
        return _login_page("試行回数が多すぎます。5分ほど待ってからお試しください。")
    form = await _form(request)
    if not hmac.compare_digest(form.get("password", "").encode(), pw.encode()):
        recent.append(now)
        _failed[ip] = recent
        return _login_page("パスワードが違います。")
    _failed.pop(ip, None)
    resp = RedirectResponse("/dashboard", status_code=303)
    resp.set_cookie(COOKIE, _token(pw), httponly=True, samesite="strict",
                    secure=request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https",
                    max_age=60 * 60 * 24 * 7)
    return resp


@router.post("/dashboard/logout")
async def logout():
    resp = RedirectResponse("/dashboard", status_code=303)
    resp.delete_cookie(COOKIE)
    return resp


@router.post("/dashboard/nickname")
async def set_nickname(request: Request):
    if not _authed(request):
        return RedirectResponse("/dashboard", status_code=303)
    form = await _form(request)
    bot = _bot()
    result = "変更に失敗しました。"
    try:
        guild = bot.get_guild(int(form.get("guild_id", ""))) if bot else None
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
