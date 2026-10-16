import asyncio
import os

import discord
import uvicorn
from discord.ext import commands
from dotenv import load_dotenv
from fastapi import FastAPI

from web.api import router as internal_api_router, init_bot_api
from web.pages import router as pages_router

# ローカル開発用: .env があれば読み込む（Railwayでは環境変数が直接注入される）
load_dotenv()

# 1. FastAPI アプリ
app = FastAPI()


@app.get("/health")
async def health():
    # Railway のヘルスチェック用（Botの接続状態に関係なく200を返す）
    return {"status": "ok"}


# Cloudflare Worker 専用の内部API
app.include_router(internal_api_router)

# ウェブページ（トップ）と管理Dashboard
app.include_router(pages_router)

# 2. Discord Bot
intents = discord.Intents.default()


class AstraBot(commands.Bot):
    async def setup_hook(self) -> None:
        # 起動時に1回だけ実行される（再接続のたびに走る on_ready ではなくこちらで読み込む）
        await self.load_extension("cogs.general")
        print("cogs.general を読み込みました。")

        # スラッシュコマンドを Discord に同期
        synced = await self.tree.sync()
        print(f"スラッシュコマンドを {len(synced)} 件同期しました。")

        # Worker専用APIにBotのインスタンスを渡す
        init_bot_api(self)


bot = AstraBot(command_prefix="!", intents=intents)


@bot.event
async def on_ready():
    print(f"Logged in as {bot.user} (ID: {bot.user.id})")


async def main():
    token = os.getenv("DISCORD_BOT_TOKEN")
    if not token:
        raise ValueError("環境変数 'DISCORD_BOT_TOKEN' が設定されていません。")

    # Railway は $PORT を注入する。BOT_API_PORT があればそちらを優先。
    port = int(os.getenv("BOT_API_PORT") or os.getenv("PORT") or "8000")
    # コンテナ外から到達させるため 0.0.0.0 がデフォルト
    host = os.getenv("BOT_API_HOST", "0.0.0.0")

    config = uvicorn.Config(app=app, host=host, port=port, log_level="info")
    server = uvicorn.Server(config)

    async with bot:
        await asyncio.gather(
            bot.start(token),
            server.serve(),
        )


if __name__ == "__main__":
    asyncio.run(main())
