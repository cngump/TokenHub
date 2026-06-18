# TokenHub

Language: [English](README.md) | [简体中文](README.zh-CN.md) | 日本語

TokenHub は、プライベートデプロイ向けのオープンソース AI ゲートウェイです。OpenAI-Compatible な単一のモデル入口を提供し、Provider ルーティング、API Key、クォータ、リクエストログ、利用統計、コストガバナンス、アラートを一元管理します。

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

## スクリーンショット

| ゲートウェイ概要 | モデルカタログ |
| --- | --- |
| ![Gateway Overview](docs/assets/screenshots/overview-en.png) | ![Model Catalog](docs/assets/screenshots/models-en.png) |
| ルーティングポリシー | システム設定 |
| ![Routing Policies](docs/assets/screenshots/routes-en.png) | ![System Settings](docs/assets/screenshots/settings-en.png) |

## 主な機能

- OpenAI-Compatible モデル API: `/v1/chat/completions`、`/v1/responses`、`/v1/embeddings`。
- Provider チャネル: OpenAI-Compatible、Azure OpenAI、Anthropic、Gemini、DeepSeek、Qwen、ローカル vLLM/Ollama、カスタム上流。
- モデルカタログ、ルート優先度、ルート重み、失敗時のフォールバック順序。
- API Key、プロジェクト、チーム、モデル許可リスト、クォータ、並行数制限。
- リクエストログ、利用統計、コスト請求、承認、ヘルスチェック、アラート、通知チャネル。
- SQLite-first のプライベートデプロイと Docker Compose サポート。
- 管理コンソールは中国語、英語、日本語の切り替えに対応。

## クイックスタート

```bash
cp deploy/.env.example deploy/.env
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build
```

アクセス先:

- 管理コンソール: `http://localhost:3000`
- バックエンド API: `http://localhost:8080`
- ヘルスチェック: `http://localhost:8080/healthz`

初期管理者ログイン:

- ユーザー名: `admin`
- パスワード: `admin123456`

外部ネットワークへ公開する前に、初期パスワードを変更し、`deploy/.env` のシークレットを置き換えてください。

## ローカル開発

バックエンド:

```bash
cd backend
go run ./cmd/tokenhub
```

フロントエンド:

```bash
cd frontend
npm install
npm run dev
```

SDK サンプルでモデル API の疎通を確認できます。

```bash
cd sdk
npm install
npm run test:deepseek
```

## ドキュメント

- [ドキュメントホーム](docs/ja/README.md)
- [クイックスタート](docs/ja/quick-start.md)
- [モデル API](docs/ja/model-api.md)
- [管理コンソール](docs/ja/admin-console.md)
- [モデルカタログ](docs/ja/model-catalog.md)
- [デプロイ](docs/ja/deployment.md)
- [セキュリティ](docs/ja/security.md)

## License

TokenHub は [Apache License 2.0](LICENSE) の下で提供されています。
