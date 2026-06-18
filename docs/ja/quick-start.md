# クイックスタート

Language: [English](../quick-start.md) | [简体中文](../zh-CN/quick-start.md) | 日本語

このガイドでは、TokenHub をローカルで起動し、モデル API の経路を確認します。

## Docker Compose で起動

```bash
cp deploy/.env.example deploy/.env
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build
```

デフォルト URL:

- 管理コンソール: `http://localhost:3000`
- バックエンド API: `http://localhost:8080`
- ヘルスチェック: `http://localhost:8080/healthz`

## ローカルで起動

バックエンドを起動します。

```bash
cd backend
cp .env.example .env
go run ./cmd/tokenhub
```

別のターミナルでフロントエンドを起動します。

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

`http://localhost:3000` を開きます。

## 初期設定

1. 管理コンソールにログインします。
2. `Provider Channels` で Provider を追加または有効化します。
3. Provider テンプレートから上流モデルを選択するか、手動でルートを作成します。
4. `Routing Policies` で、統一モデルが意図した上流 Provider モデルに向いていることを確認します。
5. `API Key` でプロジェクト用の Key を作成します。

## AI SDK でスモークテスト

```bash
cd sdk
npm install
cp .env.example .env
```

`sdk/.env` を編集します。

```bash
TOKENHUB_BASE_URL=http://localhost:8080/v1
TOKENHUB_API_KEY=thk_xxx
TOKENHUB_MODEL=deepseek-chat
```

実行します。

```bash
npm run test:deepseek
```

スクリプトは先に `GET /v1/models` を呼び、その後 AI SDK 経由でチャットリクエストを送信します。
