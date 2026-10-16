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
   - `DASHBOARD_PASSWORD` … Dashboard のログインパスワード（強いものを）
   - `BOT_API_SECRET` … 外部（Cloudflare Worker等）から `/internal/*` を使う場合のみ
4. **Settings → Networking → Generate Domain** で公開URLを発行。
5. 発行されたURLを開く → トップにステータス、`/dashboard` で管理画面。

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
- Dashboardは `DASHBOARD_PASSWORD` 未設定だと無効です（`/internal/*` は `BOT_API_SECRET` 未設定だと常に401）。
- ログイン失敗は5回/5分でロックされます。
