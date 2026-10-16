import hmac
import os

import discord
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/internal", tags=["internal-bot-api"])
bot_instance: discord.Client | None = None


class ProfileUpdate(BaseModel):
    nickname: str = Field(max_length=32)


def init_bot_api(bot: discord.Client) -> None:
    global bot_instance
    bot_instance = bot


def require_worker(secret: str | None) -> None:
    expected = os.getenv("BOT_API_SECRET")
    if not expected or not secret or not hmac.compare_digest(secret, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.get("/guilds")
async def list_guilds(x_astra_bot_secret: str | None = Header(default=None)):
    require_worker(x_astra_bot_secret)
    if bot_instance is None or not bot_instance.is_ready():
        raise HTTPException(status_code=503, detail="Bot is not ready")
    result = []
    for guild in bot_instance.guilds:
        me = guild.me
        if me is None and bot_instance.user:
            me = guild.get_member(bot_instance.user.id)
        result.append({"id": str(guild.id), "nickname": me.nick if me else None})
    return result


@router.get("/guilds/{guild_id}/profile")
async def get_profile(guild_id: int, x_astra_bot_secret: str | None = Header(default=None)):
    require_worker(x_astra_bot_secret)
    guild = bot_instance.get_guild(guild_id) if bot_instance else None
    if guild is None:
        raise HTTPException(status_code=404, detail="Guild not found")
    me = guild.me or (guild.get_member(bot_instance.user.id) if bot_instance and bot_instance.user else None)
    return {"nickname": me.nick if me else None}


@router.patch("/guilds/{guild_id}/profile")
async def update_profile(
    guild_id: int,
    profile: ProfileUpdate,
    x_astra_bot_secret: str | None = Header(default=None),
):
    require_worker(x_astra_bot_secret)
    guild = bot_instance.get_guild(guild_id) if bot_instance else None
    if guild is None:
        raise HTTPException(status_code=404, detail="Guild not found")
    me = guild.me or (guild.get_member(bot_instance.user.id) if bot_instance and bot_instance.user else None)
    if me is None:
        raise HTTPException(status_code=404, detail="Bot member not found")
    try:
        await me.edit(nick=profile.nickname.strip() or None)
    except (discord.Forbidden, discord.HTTPException, OSError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="Discord profile update failed") from exc
    return {"ok": True}
