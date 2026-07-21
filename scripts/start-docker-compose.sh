#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deploy"

log() {
  printf '[TokenHub Compose] %s\n' "$*"
}

error() {
  printf '[TokenHub Compose] ERROR: %s\n' "$*" >&2
  exit 1
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
  error "Docker is not running. Please start Docker first."
fi

# Detect docker-compose command
if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  error "docker-compose command not found"
fi

log "Using Docker Compose command: $COMPOSE_CMD"

# Check .env file
if [ ! -f "$DEPLOY_DIR/.env" ]; then
  log ".env not found in deploy/, copying from .env.example"
  cp "$DEPLOY_DIR/.env.example" "$DEPLOY_DIR/.env"
  log "⚠️  Please edit deploy/.env to change default passwords and secrets"
fi

cd "$DEPLOY_DIR"

# Build and start all services
log "Building and starting TokenHub services (PostgreSQL + Backend + Frontend)..."
$COMPOSE_CMD --env-file .env -f docker-compose.postgres.yml up -d --build

log "Waiting for services to start..."
sleep 5

# Check service status
log "Checking service status..."
$COMPOSE_CMD -f docker-compose.postgres.yml ps

# Read configuration
source .env
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
TOKENHUB_BACKEND_PORT="${TOKENHUB_BACKEND_PORT:-8080}"
TOKENHUB_FRONTEND_PORT="${TOKENHUB_FRONTEND_PORT:-3000}"
TOKENHUB_ADMIN_TOKEN="${TOKENHUB_ADMIN_TOKEN:-change-me-tokenhub-admin-token}"

cat <<EOF

┌─────────────────────────────────────────────────────┐
│  TokenHub (Full Docker Compose) Started             │
├─────────────────────────────────────────────────────┤
│  🗄️  PostgreSQL:  localhost:${POSTGRES_PORT}                   │
│  🔧 Backend API:  http://localhost:${TOKENHUB_BACKEND_PORT}             │
│  🌐 Frontend:     http://localhost:${TOKENHUB_FRONTEND_PORT}           │
│  🔑 Admin Token:  ${TOKENHUB_ADMIN_TOKEN:0:20}...    │
├─────────────────────────────────────────────────────┤
│  Default login:                                     │
│    Username: admin                                  │
│    Password: admin123456                            │
├─────────────────────────────────────────────────────┤
│  Common commands:                                   │
│    View logs:   $COMPOSE_CMD -f deploy/docker-compose.postgres.yml logs -f  │
│    Check status: $COMPOSE_CMD -f deploy/docker-compose.postgres.yml ps      │
│    Restart:     $COMPOSE_CMD -f deploy/docker-compose.postgres.yml restart  │
│    Stop:        ./scripts/stop-docker-compose.sh    │
└─────────────────────────────────────────────────────┘

EOF

log "✅ All services started"
log "Visit http://localhost:${TOKENHUB_FRONTEND_PORT} to use TokenHub"
