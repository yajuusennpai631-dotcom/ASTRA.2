# ASTRA Bot（Railway で Bot + Dashboard + Webページを1サービスで稼働）

1つのRailwayサービスで次の3つが同時に動きます。

| 機能 | URL / 場所 |
|---|---|
| Discord Bot（`/ping` など） | Discord 上 |
| ウェブページ（ステータス） | `https://<your-domain>/` |
| 管理Dashboard（ニックネーム変更など） | `https://<your-domain>/dashboard` |
| ヘルスチェック | `/health` |
| 外部連携API（任意） | `/internal/*`（`X-ASTRA-BOT-SECRET` で保護） |

## デプロイ手順（5分）

1. このフォルダの中身を GitHub リポジトリのルートに push
   （モノレポなら Railway の **Root Directory** をこのフォルダに設定）。
2. Railway で **New Project → Deploy from GitHub repo** でそのリポジトリを選択。
   `railway.json` / `Procfile` / `.python-version` があるので設定は自動です。
3. **Variables** に設定:
   - `DISCORD_BOT_TOKEN` … Discord Developer Portal > Bot > Token（必須）
   - `DISCORD_CLIENT_SECRET` … Developer Portal > OAuth2 > Client Secret（Dashboardのログイン用）
   - `SESSION_SECRET` … 32文字以上のランダム文字列（`python -c "import secrets; print(secrets.token_urlsafe(32))"`）
   - `APP_URL` … 公開URL（例 `https://xxx.up.railway.app`）。未設定ならRailwayのドメインから自動判定
   - `DISCORD_CLIENT_ID` … 任意。未設定ならBotのIDを使用
   - `BOT_API_SECRET` … 外部（Cloudflare Worker等）から `/internal/*` を使う場合のみ
4. **Settings → Networking → Generate Domain** で公開URLを発行。
5. **Discord Developer Portal > OAuth2 > Redirects** に `https://<your-domain>/auth/dashboard/callback` を追加。
6. 発行されたURLを開く → トップにステータス、`/dashboard` で「Discordでログイン」。

## 動作確認
- `/health` が `{"status":"ok"}` を返す
- トップが「オンライン」になる（Bot接続後）
- Discord で `/ping`（スラッシュコマンドの初回反映は最大1時間かかる場合あり）

## ローカルで試す
```
pip install -r requirements.txt
cp .env.example .env   # 値を記入
python main.py         # http://localhost:8000
```

## 補足
- BotはPrivileged Intentを使いません（Developer Portalでの追加設定不要）。
- ニックネーム変更にはBotに「ニックネームの変更」権限が必要です。
- DashboardはDiscord OAuth2（scope: `identify guilds`）でログインし、**所有者または「管理者」「サーバー管理」権限を持つサーバー**だけ表示・操作できます（ASTRA-mainと同じ仕様）。
- Bot未導入のサーバーには「Botを追加」リンクが表示されます。
- ログインセッションはメモリ保持のため、Botの再起動/再デプロイ後は再ログインが必要です。
- `DISCORD_CLIENT_SECRET` / `SESSION_SECRET` 未設定だとDashboardは設定案内を表示します（`/internal/*` は `BOT_API_SECRET` 未設定だと常に401）。
