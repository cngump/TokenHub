# Deployment

Language: English | [简体中文](zh-CN/deployment.md) | [日本語](ja/deployment.md)

TokenHub is designed for private deployment with a Go backend, a Next.js admin console, and SQLite persistence.

## Docker Compose

```bash
docker compose -f deploy/docker-compose/docker-compose.yml up --build
```

The compose file starts:

- Backend on `http://localhost:8080`
- Frontend on `http://localhost:3000`
- SQLite data volume mounted at `/app/data`

## Backend Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `TOKENHUB_ENV` | `dev` | Runtime environment label |
| `TOKENHUB_HTTP_ADDR` | `:8080` | Backend listen address |
| `TOKENHUB_PUBLIC_BASE_URL` | `http://localhost:8080` | Public backend URL shown to users |
| `TOKENHUB_ADMIN_TOKEN` | `dev_admin_token` | Bootstrap admin token for Admin API access |
| `TOKENHUB_DATABASE_URL` | `sqlite://data/tokenhub.db` | SQLite database location |
| `TOKENHUB_SQLITE_BACKUP_DIR` | `data/backups` | Backup output directory |
| `TOKENHUB_MODEL_CATALOG_FILE` | `data/model-catalog.yaml` | Standard model catalog file |
| `TOKENHUB_SEED_DEMO` | `false` | Whether to seed demo data |
| `TOKENHUB_LOG_LEVEL` | `info` | Log level |

## Frontend Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080` | Backend Admin API URL |
| `NEXT_PUBLIC_ADMIN_TOKEN` | `dev_admin_token` | Development admin token |
| `NEXT_PUBLIC_APP_NAME` | `TokenHub` | Display name |

## Data and Backups

SQLite is the persistent source for projects, keys, Providers, routes, users, request logs, usage, alerts, approvals, sessions, and backup records.

Recommended production setup:

- Store the SQLite database on a persistent disk.
- Store backups outside the application container.
- Rotate old backups according to your retention policy.
- Keep provider credentials and admin tokens in a secret manager or protected environment variables.

## Reverse Proxy

For production, place TokenHub behind HTTPS and forward:

- Admin console traffic to the frontend service.
- `/v1/*` and `/api/admin/*` traffic to the backend service.

Set request body and streaming timeouts high enough for long model responses.
