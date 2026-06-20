<p align="center">
  <img src="frontend/public/brand/tokenhub-logo.png" alt="TokenHub" width="96" />
</p>

<h1 align="center">TokenHub</h1>

<p align="center">
  TokenHub is a private AI gateway that unifies OpenAI-compatible APIs, Provider routing, API keys, usage analytics, and cost governance in one clean console.
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
  Language: English | <a href="README.zh-CN.md">简体中文</a> | <a href="README.ja.md">日本語</a>
</p>

## Screenshots

| Login Console | Gateway Overview |
| --- | --- |
| ![Login Console](docs/assets/screenshots/login-en.png) | ![Gateway Overview](docs/assets/screenshots/overview-en.png) |
| API Documentation | Provider Channels |
| ![API Documentation](docs/assets/screenshots/gateway-en.png) | ![Provider Channels](docs/assets/screenshots/providers-en.png) |
| Model Catalog | Routing Policies |
| ![Model Catalog](docs/assets/screenshots/models-en.png) | ![Routing Policies](docs/assets/screenshots/routes-en.png) |
| Usage Analytics | System Settings |
| ![Usage Analytics](docs/assets/screenshots/usage-en.png) | ![System Settings](docs/assets/screenshots/settings-en.png) |

## What You Get

- OpenAI-compatible model APIs: `/v1/chat/completions`, `/v1/responses`, `/v1/embeddings`.
- Provider channels for OpenAI-compatible, Azure OpenAI, Anthropic, Gemini, DeepSeek, Qwen, local vLLM/Ollama, and custom upstreams.
- Model catalog, routing priorities, route weights, and failover order.
- API keys, projects, teams, model allowlists, quotas, and concurrency limits.
- Request logs, usage analytics, cost billing, approvals, health checks, alerts, and notification channels.
- Executive usage dashboards with department rankings, member rankings, token comparisons, and Provider cost share.
- Clean admin console with compact navigation, global search, light/dark mode, and split-view API documentation.
- SQLite-first private deployment with Docker Compose support.
- Admin console language switching for Chinese, English, and Japanese.

## Quick Start

```bash
cp deploy/.env.example deploy/.env
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build
```

Open:

- Admin console: `http://localhost:3000`
- Backend API: `http://localhost:8080`
- Health check: `http://localhost:8080/healthz`

Default admin login:

- Username: `admin`
- Password: `admin123456`

Change the default password and secrets in `deploy/.env` before exposing TokenHub beyond a local machine.

## Local Development

Backend:

```bash
cd backend
go run ./cmd/tokenhub
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Smoke-test the model API with the included SDK example:

```bash
cd sdk
npm install
npm run test:deepseek
```

## Documentation

- [Documentation home](docs/README.md)
- [Quick start](docs/quick-start.md)
- [Model API](docs/model-api.md)
- [Admin console](docs/admin-console.md)
- [Model catalog](docs/model-catalog.md)
- [Deployment](docs/deployment.md)
- [Security](docs/security.md)

## License

TokenHub is licensed under the [Apache License 2.0](LICENSE).
