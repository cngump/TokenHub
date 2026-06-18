# Quick Start

Language: English | [简体中文](zh-CN/quick-start.md) | [日本語](ja/quick-start.md)

This guide starts TokenHub locally and verifies the model API path.

## Run With Docker Compose

```bash
cp deploy/.env.example deploy/.env
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build
```

Default URLs:

- Admin console: `http://localhost:3000`
- Backend API: `http://localhost:8080`
- Health check: `http://localhost:8080/healthz`

## Run Locally

Start the backend:

```bash
cd backend
cp .env.example .env
go run ./cmd/tokenhub
```

Start the frontend in another terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## First Configuration

1. Log in to the admin console.
2. Add or enable a Provider under `Provider Channels`.
3. Select upstream models from the Provider template, or create routes manually.
4. Open `Routing Policies` and confirm that the unified model points to the intended Provider model.
5. Create an API key under `API Key`.

## Smoke Test With AI SDK

```bash
cd sdk
npm install
cp .env.example .env
```

Edit `sdk/.env`:

```bash
TOKENHUB_BASE_URL=http://localhost:8080/v1
TOKENHUB_API_KEY=thk_xxx
TOKENHUB_MODEL=deepseek-chat
```

Run:

```bash
npm run test:deepseek
```

The script calls `GET /v1/models` first, then sends a chat request through the AI SDK.
