<p align="center">
  <img src="frontend/public/brand/tokenhub-logo.png" alt="TokenHub" width="96" />
</p>

<h1 align="center">TokenHub</h1>

<p align="center">
  TokenHub は、OpenAI-Compatible API、Provider ルーティング、API Key、利用分析、コストガバナンスを一つの管理コンソールにまとめるプライベート AI ゲートウェイです。
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License" /></a>
  <img src="https://img.shields.io/badge/Go-1.26-00ADD8?logo=go&logoColor=white" alt="Go 1.26" />
  <img src="https://img.shields.io/badge/Next.js-16.2.9-black?logo=nextdotjs" alt="Next.js 16.2.9" />
  <img src="https://img.shields.io/badge/React-19.2.7-61DAFB?logo=react&logoColor=111111" alt="React 19.2.7" />
  <img src="https://img.shields.io/badge/SQLite-first-003B57?logo=sqlite&logoColor=white" alt="SQLite first" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker Compose" />
  <img src="https://img.shields.io/badge/OpenAI-Compatible-10A37F" alt="OpenAI Compatible" />
  <img src="https://img.shields.io/badge/i18n-ZH%20%7C%20EN%20%7C%20JA-6f42c1" alt="i18n ZH EN JA" />
</p>

<p align="center">
  Language: <a href="README.md">English</a> | <a href="README.zh-CN.md">简体中文</a> | 日本語
</p>

## スクリーンショット

| ログインコンソール | ゲートウェイ概要 |
| --- | --- |
| ![Login Console](docs/assets/screenshots/login-en.png) | ![Gateway Overview](docs/assets/screenshots/overview-en.png) |
| API ドキュメント | Provider チャネル |
| ![API Documentation](docs/assets/screenshots/gateway-en.png) | ![Provider Channels](docs/assets/screenshots/providers-en.png) |
| モデルカタログ | ルーティングポリシー |
| ![Model Catalog](docs/assets/screenshots/models-en.png) | ![Routing Policies](docs/assets/screenshots/routes-en.png) |
| 利用分析 | システム設定 |
| ![Usage Analytics](docs/assets/screenshots/usage-en.png) | ![System Settings](docs/assets/screenshots/settings-en.png) |

## 主な機能

- OpenAI-Compatible モデル API: `/v1/chat/completions`、`/v1/responses`、`/v1/embeddings`。
- Provider チャネル: OpenAI-Compatible、Azure OpenAI、Anthropic、Gemini、DeepSeek、Qwen、ローカル vLLM/Ollama、カスタム上流。
- モデルカタログ、ルート優先度、ルート重み、失敗時のフォールバック順序。
- API Key、プロジェクト、チーム、モデル許可リスト、クォータ、並行数制限。
- リクエストログ、利用統計、コスト請求、承認、ヘルスチェック、アラート、通知チャネル。
- 経営向け利用ダッシュボード: 部門ランキング、個人ランキング、Token 消費比較、Provider コスト比率。
- クリーンな管理コンソール: コンパクトなナビゲーション、グローバル検索、ライト/ダーク切り替え、左ナビ + 右詳細の API ドキュメント。
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
