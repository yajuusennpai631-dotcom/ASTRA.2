# ASTRA Bot (Railway)

## デプロイ手順
1. このフォルダの中身をGitHubリポジトリのルートに置く（またはモノレポの `Bot/` に置き、Railwayの **Root Directory** を `Bot` に設定）。
2. Railway で **New Project → Deploy from GitHub repo**。
3. **Variables** に以下を設定:
   - `DISCORD_BOT_TOKEN` : BotのToken
   - `BOT_API_SECRET`    : Worker側と同じ秘密値
4. **Settings → Networking → Generate Domain** で公開ドメインを発行。
5. 発行された `https://xxxx.up.railway.app` を Cloudflare Worker の `BOT_API_URL` に設定。

## 動作確認
- `https://xxxx.up.railway.app/health` が `{"status":"ok"}` を返す
- Discordで `/ping` が使える（初回のグローバル同期は反映に最大1時間ほどかかる場合あり）

## 注意
`/internal/*` は `X-ASTRA-BOT-SECRET` ヘッダーで保護されています。`BOT_API_SECRET` は必ず強力な値にしてください。
