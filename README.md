# TokenHub

Language: English | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

TokenHub is an open-source AI gateway for private deployments. It gives teams one OpenAI-compatible endpoint for model access, Provider routing, API keys, quotas, request logs, usage analytics, cost governance, and alerts.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

## Screenshots

| Gateway Overview | Model Catalog |
| --- | --- |
| ![Gateway Overview](docs/assets/screenshots/overview-en.png) | ![Model Catalog](docs/assets/screenshots/models-en.png) |
| Routing Policies | System Settings |
| ![Routing Policies](docs/assets/screenshots/routes-en.png) | ![System Settings](docs/assets/screenshots/settings-en.png) |

## What You Get

- OpenAI-compatible model APIs: `/v1/chat/completions`, `/v1/responses`, `/v1/embeddings`.
- Provider channels for OpenAI-compatible, Azure OpenAI, Anthropic, Gemini, DeepSeek, Qwen, local vLLM/Ollama, and custom upstreams.
- Model catalog, routing priorities, route weights, and failover order.
- API keys, projects, teams, model allowlists, quotas, and concurrency limits.
- Request logs, usage analytics, cost billing, approvals, health checks, alerts, and notification channels.
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
